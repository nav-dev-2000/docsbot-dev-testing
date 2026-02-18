import { stripe } from '@/utils/stripe'
import { getURL, getNeededStripeProduct, stripePlan, checkPlanPermission } from '@/utils/helpers'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import { getInvitesFromTeam, getBots } from '@/lib/dbQueries'
import * as cookie from 'cookie'
import { canUserManageBilling } from '@/utils/function.utils'
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

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

const resolvePriceId = (plans, tier, frequency) => {
  return plans?.[tier]?.prices?.current?.[frequency] || null
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
        const price = resolvePriceId(plans, tier, selectedFrequency)
        const teamInvites = await getInvitesFromTeam(team.id)

        if (!price) throw Error('Please select a valid plan.')

        const planLimits = plans[tier]
        if (!planLimits) {
          throw Error('Invalid plan selected.')
        }
        
        // Resolve researchTasks limit (can be number or object)
        const researchTasksLimit = typeof planLimits.researchTasks === 'number' 
          ? planLimits.researchTasks 
          : typeof planLimits.researchTasks === 'object' && planLimits.researchTasks !== null
            ? (planLimits.researchTasks.monthly || planLimits.researchTasks.lifetime || 0)
            : 0
        
        // Calculate effective research count (excluding trial research up to 2)
        const currentPlan = stripePlan(team)
        const currentPlanResearchLimit = typeof currentPlan?.researchTasks === 'number' 
          ? currentPlan.researchTasks 
          : 0
        
        // If current plan has no monthly research tasks, they may have used trial research (up to 2)
        const trialResearchAmount = currentPlanResearchLimit === 0 ? Math.min(2, Number(team?.researchCount ?? 0)) : 0
        const researchCount = Math.max(0, Number(team?.researchCount ?? 0) - trialResearchAmount)
        
        // Ensure plan limits are numbers for proper comparison
        const planBotsLimit = Number(planLimits.bots) || 0
        const planPagesLimit = Number(planLimits.pages) || 0
        const planQuestionsLimit = Number(planLimits.questions) || 0
        const planTeamMembersLimit = Number(planLimits.teamMembers) || 0
        
        // Get current usage values
        const currentBots = Number(team?.botCount ?? 0)
        const currentPages = Number(team?.pageCount ?? 0)
        const currentQuestions = Number(team?.questionCount ?? 0)
        const currentTeamMembers = Object.keys(team?.roles || {}).length + teamInvites.length
        
        const exceededLimits = []
        if (currentBots > planBotsLimit) {
          exceededLimits.push(`bots (${currentBots} > ${planBotsLimit})`)
        }
        if (currentPages > planPagesLimit) {
          exceededLimits.push(`pages (${currentPages} > ${planPagesLimit})`)
        }
        if (currentQuestions > planQuestionsLimit) {
          exceededLimits.push(`questions (${currentQuestions} > ${planQuestionsLimit})`)
        }
        if (currentTeamMembers > planTeamMembersLimit) {
          exceededLimits.push(`team members (${currentTeamMembers} > ${planTeamMembersLimit})`)
        }
        if (researchCount > researchTasksLimit) {
          exceededLimits.push(`research tasks (${researchCount} > ${researchTasksLimit})`)
        }
        
        if (exceededLimits.length > 0) {
          throw Error(`This plan does not fit your current usage. The following limits are exceeded: ${exceededLimits.join(', ')}.`)
        }

        // Check if team is on Business plan and has per bot roles - prevent downgrading
        const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
        const planLevels = { free: 1, hobby: 2, personal: 3, pro: 4, standard: 5, business: 6, enterprise: 7 }
        const targetTierLevel = planLevels[tier] || 0
        const businessLevel = planLevels['business']
        const isDowngradingToBelowBusiness = targetTierLevel < businessLevel
        
        if (isCurrentlyBusinessOrHigher && isDowngradingToBelowBusiness) {
          // Check if any member or invite has per bot roles
          const bots = await getBots(team)
          const teamMemberIds = Object.keys(team.roles || {})
          
          // Check if any bot has per bot roles for any team member
          const hasPerBotRoles = bots.some(bot => {
            if (!bot.roles) return false
            return Object.keys(bot.roles).some(memberId => {
              const botRole = bot.roles[memberId]
              // Check if member has a non-default role
              return botRole && botRole !== 'default' && teamMemberIds.includes(memberId)
            })
          })
          
          // Check if any invite has bot overrides
          const invitesHaveBotOverrides = teamInvites.some(invite => {
            return invite.botOverrides && Array.isArray(invite.botOverrides) && invite.botOverrides.length > 0
          })
          
          if (hasPerBotRoles || invitesHaveBotOverrides) {
            throw Error('Cannot downgrade from Business plan while per-bot roles are assigned to team members or invites. Please remove all per-bot role assignments before downgrading.')
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
        const couponId = cookies['docsbot_coupon']
        const hasSubscription =
          team.stripeCustomerId &&
          ['active', 'trialing', 'past_due', 'incomplete'].includes(
            team.stripeSubscriptionStatus
          )
        if (team.stripeCustomerId) {
          params.customer = team.stripeCustomerId
        } else {
          params.tax_id_collection = { enabled: true }
          params.customer_email = email
          if (team.canTrial) {
            params.subscription_data = {
              trial_period_days: 14,
            }
          }
        }
        if (couponId && !hasSubscription) {
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

        const { data } = await stripe.billingPortal.configurations.list({
          expand: ['data.features.subscription_update.products'],
          active: true,
          is_default: false,
          limit: 100,
        })

        const teamInvites = await getInvitesFromTeam(team.id)
        let neededProducts = getNeededStripeProduct(team, teamInvites)

        // Check if team is on Business plan and has per bot roles - prevent downgrading
        const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
        
        if (isCurrentlyBusinessOrHigher) {
          // Check if any member or invite has per bot roles
          const bots = await getBots(team)
          const teamMemberIds = Object.keys(team.roles || {})
          
          // Check if any bot has per bot roles for any team member
          const hasPerBotRoles = bots.some(bot => {
            if (!bot.roles) return false
            return Object.keys(bot.roles).some(memberId => {
              const botRole = bot.roles[memberId]
              // Check if member has a non-default role
              return botRole && botRole !== 'default' && teamMemberIds.includes(memberId)
            })
          })
          
          // Check if any invite has bot overrides
          const invitesHaveBotOverrides = teamInvites.some(invite => {
            return invite.botOverrides && Array.isArray(invite.botOverrides) && invite.botOverrides.length > 0
          })
          
          if (hasPerBotRoles || invitesHaveBotOverrides) {
            // If they have per bot roles, restrict portal to Business-only (no downgrade option)
            const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
            const businessPrices = [
              plans?.business?.prices?.current?.monthly,
              plans?.business?.prices?.current?.annually,
            ].filter(Boolean)
            
            if (businessPrices.length > 0) {
              // Override neededProducts to only include Business plan so portal opens for invoices etc.
              neededProducts = [businessPrices]
            }
          }
        }

        const sanitizeSubscriptionUpdateFeatures = (features) => {
          if (!features?.subscription_update) return features
          const subscriptionFeatures = features.subscription_update
          if (
            subscriptionFeatures.billing_cycle_anchor === '' ||
            subscriptionFeatures.billing_cycle_anchor === null
          ) {
            delete subscriptionFeatures.billing_cycle_anchor
          }
          return features
        }

        // If upgrading to a specific tier, validate the target tier can support current usage
        if (upgrade && tier) {
          const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
          const interval = team.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
          const targetPriceId = resolvePriceId(plans, tier, interval)
          
          if (targetPriceId) {
            const allPrices = neededProducts.flat()
            if (!allPrices.includes(targetPriceId)) {
              throw Error('Your current usage exceeds the limits of your current and selected plan. Please select a higher tier plan to upgrade to.')
            }
          }
          
          // Check if downgrading from Business plan with per-bot roles
          const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
          const planLevels = { free: 1, hobby: 2, personal: 3, pro: 4, standard: 5, business: 6, enterprise: 7 }
          const targetTierLevel = planLevels[tier] || 0
          const businessLevel = planLevels['business']
          const isDowngradingToBelowBusiness = targetTierLevel < businessLevel
          
          if (isCurrentlyBusinessOrHigher && isDowngradingToBelowBusiness) {
            // Check if any member or invite has per bot roles
            const bots = await getBots(team)
            const teamMemberIds = Object.keys(team.roles || {})
            
            const hasPerBotRoles = bots.some(bot => {
              if (!bot.roles) return false
              return Object.keys(bot.roles).some(memberId => {
                const botRole = bot.roles[memberId]
                return botRole && botRole !== 'default' && teamMemberIds.includes(memberId)
              })
            })
            
            const invitesHaveBotOverrides = teamInvites.some(invite => {
              return invite.botOverrides && Array.isArray(invite.botOverrides) && invite.botOverrides.length > 0
            })
            
            if (hasPerBotRoles || invitesHaveBotOverrides) {
              throw Error('Cannot downgrade from Business plan while per-bot roles are assigned to team members or invites. Please remove all per-bot role assignments before downgrading.')
            }
          }
        }

        //This command will disable non-default portal configs: stripe billing_portal configurations list --active=true --is-default=false | jq -r '.data[].id' | xargs -I {} stripe billing_portal configurations update {} --active=false

        const getConfigId = async (currentConfigs, neededProducts) => {
          let configId = ''
          if (neededProducts) {
            currentConfigs.map((item) => {
              if (
                item?.features?.subscription_update?.products?.length === neededProducts?.length
              ) {
                const isPriceAvailable = item?.features?.subscription_update?.products
                  ?.map((product, index) => {
                    return product.prices?.every((item) => neededProducts?.flat().includes(item))
                  })
                  .every((value) => value === true)
                if (isPriceAvailable) {
                  configId = item.id
                }
              }
            })
            if (!configId) {
              const { data } = await stripe.billingPortal.configurations.list({
                expand: ['data.features.subscription_update.products', 'data.business_profile'],
                is_default: true,
              })
              let existingConfig = JSON.parse(JSON.stringify(data[0]))
              const newProducts = []
              existingConfig.features?.subscription_update?.products.map((product) => {
                if (neededProducts.flat()?.includes(product.prices[0])) {
                  if (
                    product?.adjustable_quantity &&
                    (product.adjustable_quantity.maximum === null ||
                      product.adjustable_quantity.maximum === '')
                  ) {
                    product.adjustable_quantity = { enabled: false }
                  }
                  newProducts.push(product)
                }
              })
              if (newProducts.length) {
                existingConfig.features.subscription_update.products = newProducts
              }
              const newConfig = await stripe.billingPortal.configurations?.create({
                business_profile: {
                  privacy_policy_url: 'https://docsbot.ai/legal/privacy-policy',
                  terms_of_service_url: 'https://docsbot.ai/legal/terms-of-service',
                },
                features: sanitizeSubscriptionUpdateFeatures(existingConfig.features),
              })
              configId = newConfig?.id
              console.log('New portal config created', configId)
            } else {
              console.log('Existing portal config found', configId)
            }
          }
          return configId
        }

        let configId = await getConfigId(data, neededProducts)

        // If upgrading from annual to annual with sale, create a custom config with billing_cycle_anchor reset
        const isAnnualToAnnualSale = upgrade && tier && isAnnualSale && team.stripeSubscriptionInterval === 'year'
        if (isAnnualToAnnualSale) {
          // Check if a config with billing_cycle_anchor: "now" already exists
          const existingSaleConfig = data.find((item) => {
            const hasBillingCycleAnchor = 
              item?.features?.subscription_update?.billing_cycle_anchor === 'now'
            const hasMatchingProducts = 
              item?.features?.subscription_update?.products?.length === neededProducts?.length &&
              item?.features?.subscription_update?.products
                ?.map((product) => {
                  return product.prices?.every((price) => neededProducts?.flat().includes(price))
                })
                .every((value) => value === true)
            return hasBillingCycleAnchor && hasMatchingProducts
          })

          if (existingSaleConfig) {
            configId = existingSaleConfig.id
            console.log('Existing annual sale portal config found with billing_cycle_anchor reset', configId)
          } else {
            // Get the base config (either the found one or default) to use as template
            let baseConfig
            if (configId) {
              // Retrieve the existing config we found
              baseConfig = data.find(c => c.id === configId)
            }
            
            // If no base config found, use default
            if (!baseConfig) {
              const { data: defaultConfigData } = await stripe.billingPortal.configurations.list({
                expand: ['data.features.subscription_update.products', 'data.business_profile'],
                is_default: true,
              })
              baseConfig = defaultConfigData[0]
            }
            
            let saleConfig = JSON.parse(JSON.stringify(baseConfig))
            
            // Ensure products are filtered correctly if neededProducts is set
            if (neededProducts && saleConfig.features?.subscription_update?.products) {
              const filteredProducts = []
              saleConfig.features.subscription_update.products.forEach((product) => {
                if (neededProducts.flat()?.includes(product.prices[0])) {
                  if (
                    product?.adjustable_quantity &&
                    (product.adjustable_quantity.maximum === null ||
                      product.adjustable_quantity.maximum === '')
                  ) {
                    product.adjustable_quantity = { enabled: false }
                  }
                  filteredProducts.push(product)
                }
              })
              if (filteredProducts.length) {
                saleConfig.features.subscription_update.products = filteredProducts
              }
            }
            
            // Set billing_cycle_anchor to "now" to reset billing cycle
            if (saleConfig.features?.subscription_update) {
              saleConfig.features.subscription_update.billing_cycle_anchor = 'now'
            }
            
            const salePortalConfig = await stripe.billingPortal.configurations.create({
              business_profile: {
                privacy_policy_url: 'https://docsbot.ai/legal/privacy-policy',
                terms_of_service_url: 'https://docsbot.ai/legal/terms-of-service',
              },
              features: sanitizeSubscriptionUpdateFeatures(saleConfig.features),
            })
            configId = salePortalConfig.id
            console.log('New annual sale portal config created with billing_cycle_anchor reset', configId)
          }
        }

        let sessionConfig = {
          customer: team.stripeCustomerId,
          return_url: `${getURL()}/app/account`,
        }
        if (configId) {
          sessionConfig['configuration'] = configId
        }
        if (upgrade) {
          if (!team.stripeSubscriptionId) {
            throw Error('No subscription found for upgrade.')
          }

          if (tier) {
            const subscription = await stripe.subscriptions.retrieve(team.stripeSubscriptionId)
            const subscriptionItem = subscription?.items?.data?.[0]

            if (!subscriptionItem) {
              throw Error('Unable to locate subscription item for upgrade.')
            }

            const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
            const interval = team.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
            const targetPriceId = isAnnualSale
              ? resolvePriceId(plans, tier, 'annually')
              : resolvePriceId(plans, tier, interval)

            if (!targetPriceId) {
              throw Error('Unable to determine upgrade price.')
            }

            if (isAnnualSale) {
              const annualCoupon = getAnnualSaleCoupon(tier)
              if (!annualCoupon) {
                throw Error('Unable to apply annual sale coupon.')
              }

              const flowData = {
                type: 'subscription_update_confirm',
                subscription_update_confirm: {
                  subscription: team.stripeSubscriptionId,
                  items: [
                    {
                      id: subscriptionItem.id,
                      price: targetPriceId,
                      quantity: subscriptionItem.quantity || 1,
                    },
                  ],
                  discounts: [{ coupon: annualCoupon }],
                },
              }

              sessionConfig['flow_data'] = flowData
            } else {
              const flowData = {
                type: 'subscription_update_confirm',
                subscription_update_confirm: {
                  subscription: team.stripeSubscriptionId,
                  items: [
                    {
                      id: subscriptionItem.id,
                      price: targetPriceId,
                      quantity: subscriptionItem.quantity || 1,
                    },
                  ],
                },
              }

              sessionConfig['flow_data'] = flowData
            }
          } else {
            sessionConfig['flow_data'] = {
              type: 'subscription_update',
              subscription_update: {
                subscription: team.stripeSubscriptionId,
              },
            }
          }
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
