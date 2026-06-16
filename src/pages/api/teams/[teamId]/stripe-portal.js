import { stripe } from '@/utils/stripe'
import {
  getURL,
  stripePlan,
  checkPlanPermission,
} from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import { getInvitesFromTeam, getBots, getTeamSourceTypeIds } from '@/lib/dbQueries'
import * as cookie from 'cookie'
import { canUserManageBilling } from '@/utils/function.utils'
import {
  getIncompatibleSourceTypesForPlan,
} from '@/utils/sourceTypePlanChecks'
import {
  getExceededPlanLimits,
  isDowngradingBelowBusiness,
  isDowngradingBelowStandard,
  teamHasPerBotRoleAssignments,
  teamHasStripeActionsEnabled,
  teamHasLeadCollectCustomFields,
  getBotPlanFeatureConflicts,
} from '@/utils/checkoutValidation'
import { verifyDemoTrialToken } from '@/lib/demoTrialToken'
import { parseDocsbotCouponCookie } from '@/utils/couponCookie.utils'

const ANNUAL_SALE_COUPONS = {
  production: {
    personal: 'QXPNAW0W',
    standard: '5WDmnk8x',
    business: 'FWMt2MJQ',
  },
  test: {
    personal: '7pj7aaX3',
    standard: 'd2Lh1UEY',
    business: '1RAyTdmz',
  },
}

const getAnnualSaleCoupon = (tier) => {
  if (!tier) return null
  const envKey = process.env.NODE_ENV === 'development' ? 'test' : 'production'
  return ANNUAL_SALE_COUPONS[envKey]?.[tier] ?? null
}

const resolvePriceId = (plans, tier, frequency, currency) => {
  const plan = plans?.[tier]
  if (!plan?.prices) return null
  // Support currency-keyed prices: plans[tier].prices.USD.monthly
  if (currency && plan.prices[currency]?.[frequency]) {
    return plan.prices[currency][frequency]
  }
  // Fallback: plans[tier].prices.current.monthly
  return plan.prices?.current?.[frequency] || null
}

export default async function createCheckoutSession(req, res) {
  let check = null
  try {
    check = await userTeamCheck(req)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check

  if (!canUserManageBilling(team, userId)) {
    return res.status(403).json({
      message: 'Unauthorized action; please contact your team owner.',
    })
  }

  if (req.method === 'POST') {
    const { tier, frequency, email, upgrade, sale, currency } = req.body
    // Promo ended: ignore annual sale param and do not auto-apply annual sale coupons.
    const isAnnualSale = false

    try {
      if (tier && !upgrade) {
        const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
        const selectedFrequency = isAnnualSale ? 'annually' : frequency
        const price = resolvePriceId(plans, tier, selectedFrequency, currency)
        const teamInvites = await getInvitesFromTeam(team.id)

        if (!price) throw Error('Please select a valid plan.')

        const planLimits = plans[tier]
        if (!planLimits) {
          throw Error('Invalid plan selected.')
        }
        const bots = await getBots(team)
        
        const exceededLimits = getExceededPlanLimits({
          team,
          planLimits,
          inviteCount: teamInvites.length,
          currentPlan: stripePlan(team),
        })

        if (exceededLimits.length > 0) {
          throw Error(`This plan does not fit your current usage. The following limits are exceeded: ${exceededLimits.join(', ')}.`)
        }

        // Check if team is on Business plan and has per bot roles - prevent downgrading
        const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
        const isDowngradingToBelowBusiness = isDowngradingBelowBusiness(tier)

        // Check if team is on Standard plan and has Stripe actions or lead custom fields - prevent downgrading
        const isCurrentlyStandardOrHigher = checkPlanPermission(team, 'standard').allowed
        const isDowngradingToBelowStandard = isDowngradingBelowStandard(tier)

        const botFeatureConflicts = getBotPlanFeatureConflicts({
          bots,
          targetPlanId: tier,
        })
        if (botFeatureConflicts.length > 0) {
          throw Error(
            `This plan does not support enabled bot features: ${botFeatureConflicts.join(', ')}. Disable those features or choose a higher plan.`,
          )
        }

        if (isCurrentlyStandardOrHigher && isDowngradingToBelowStandard) {
          if (teamHasStripeActionsEnabled({ bots })) {
            throw Error(
              'Cannot downgrade while Stripe billing support actions are enabled on one or more bots. Disable Stripe Tools in Widget → Actions before downgrading.',
            )
          }
          if (teamHasLeadCollectCustomFields({ bots })) {
            throw Error(
              'Cannot downgrade while custom lead fields are configured on one or more bots. Remove custom fields (keep only name/email) in Widget → Actions before downgrading.',
            )
          }
        }

        if (isCurrentlyBusinessOrHigher && isDowngradingToBelowBusiness) {
          if (
            teamHasPerBotRoleAssignments({
              bots,
              teamRoles: team.roles,
              teamInvites,
            })
          ) {
            throw Error('Cannot downgrade from Business plan while per-bot roles are assigned to team members or invites. Please remove all per-bot role assignments before downgrading.')
          }
        }

        const teamSourceTypeIds = await getTeamSourceTypeIds(team.id)
        if (teamSourceTypeIds.length > 0) {
          const incompatibleSources = getIncompatibleSourceTypesForPlan({
            team,
            targetPlanId: tier,
            usedSourceTypeIds: teamSourceTypeIds,
          })
          if (incompatibleSources.length > 0) {
            const incompatibleList = incompatibleSources
              .map((source) => source.title)
              .join(', ')
            throw Error(
              `This plan doesn't support these source types: ${incompatibleList}. Remove/disable them or choose a higher plan.`,
            )
          }
        }

        const params = {
          success_url: `${getURL()}/app/account?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${getURL()}/app/account`,
          line_items: [{ price, quantity: 1 }],
          client_reference_id: team.id,
          allow_promotion_codes: true,
          mode: 'subscription',
        }
        if (currency) {
          params.currency = currency.toLowerCase()
        }
        const cookies = cookie.parse(req.headers.cookie || '')
        const { couponId } = parseDocsbotCouponCookie(cookies['docsbot_coupon'])
        const demoTrialCode = cookies['docsbot_demo_trial']
        const demoTrialPayload = demoTrialCode
          ? verifyDemoTrialToken(demoTrialCode)
          : null
        const hasSubscription =
          team.stripeCustomerId &&
          ['active', 'trialing', 'past_due', 'incomplete'].includes(
            team.stripeSubscriptionStatus
          )
        const isDemoTrial = Boolean(demoTrialPayload)

        if (isDemoTrial) {
          if (tier !== 'business') {
            throw Error('Demo trials are only available for the Business plan.')
          }
          if (team.stripeCustomerId) {
            throw Error('Demo trials are only available for new customers.')
          }
        }

        if (team.stripeCustomerId) {
          params.customer = team.stripeCustomerId
        } else {
          params.tax_id_collection = { enabled: true }
          params.customer_email = email
          if (team.canTrial || isDemoTrial) {
            params.subscription_data = {
              trial_period_days: 14,
            }
          }
        }
        if (!isDemoTrial && couponId && !hasSubscription) {
          delete params.allow_promotion_codes
          if (couponId === 'paul-higgins') {
            params.subscription_data = {
              ...(params.subscription_data || {}),
              trial_period_days: 30,
            }
          } else {
            params.discounts = [{ coupon: couponId }]
          }
        }
        if (isDemoTrial) {
          params.success_url = `${getURL()}/app`
          params.cancel_url = `${getURL()}/app/activate`
        }

        if (isAnnualSale) {
          const annualCoupon = getAnnualSaleCoupon(tier)
          if (!annualCoupon) {
            throw Error('Unable to apply annual sale coupon.')
          }
          delete params.allow_promotion_codes
          params.discounts = [{ coupon: annualCoupon }]
        }

        //cyber monday
        /*
        if (frequency === 'annually') {
          delete params.allow_promotion_codes
          params.discounts = [{coupon: '5BvogbZc'}] //41% off
        } else {
          delete params.allow_promotion_codes
          params.discounts = [{coupon: '6kMHwH8t'}] //25% off
        }
        */

        const { url } = await stripe.checkout.sessions.create(params)

        try {
          bentoTrack(userId, 'track', {
            type: 'openCheckout',
            tier,
            frequency,
          })
          phTrack(userId, 'Checkout Started', {
            tier,
            frequency,
          }, team.id)
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      } else {
        if (!team.stripeCustomerId) throw Error('No Customer ID found.')

        if (upgrade) {
          return res.status(409).json({
            message:
              'Plan changes must be previewed and confirmed from the account page.',
          })
        }

        let sessionConfig = {
          customer: team.stripeCustomerId,
          return_url: `${getURL()}/app/account`,
        }
        const { url } = await stripe.billingPortal.sessions.create(sessionConfig)

        try {
          bentoTrack(userId, 'track', {
            type: 'openBillingPortal',
          })
          
          phTrack(userId, 'Billing Portal Opened', {}, team.id)
        } catch (e) {
          console.log('Error sending bento track', e)
        }

        return res.json({ url })
      }
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else if (req.method === 'DELETE') {
    if (!team.stripeCustomerId || !team.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found.' })
    }

    const { reason, details } = req.body

    try {
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        cancel_at_period_end: true,
        cancellation_details: {
          feedback: reason,
          comment: details,
        },
      })

      try {
        bentoTrack(userId, 'track', {
          type: 'cancelSubscription',
        })
        
        phTrack(userId, 'Subscription Canceled', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Subscription canceled' })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else if (req.method === 'PUT') {
    if (!team.stripeCustomerId || !team.stripeSubscriptionId) {
      return res.status(400).json({ message: 'No subscription found.' })
    }

    try {
      await stripe.subscriptions.update(team.stripeSubscriptionId, {
        cancel_at_period_end: false,
      })

      try {
        bentoTrack(userId, 'track', {
          type: 'renewedSubscription',
        })
        
        phTrack(userId, 'Subscription Renewed', {}, team.id)
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Subscription renewed' })
    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: err?.message })
    }
  } else {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
  }
}
