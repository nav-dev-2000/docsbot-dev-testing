import { stripe } from '@/utils/stripe'
import {
  countBillableBotActions,
  getNeededStripeProduct,
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
import { canUserModifyTeam } from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'
import {
  getIncompatibleSourceTypesForPlan,
  isPlanCompatibleWithSourceTypes,
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
import { hasPurchasedAddOns } from '@/utils/billingAddOns'

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

const resolveCurrentPriceGroup = (plans, tier) => {
  const currentPrices = plans?.[tier]?.prices?.current
  if (!currentPrices || typeof currentPrices !== 'object') return []
  return Object.values(currentPrices).filter(Boolean)
}

const filterNeededProductsByPlanIds = (neededProducts, plans, allowedPlanIds = []) => {
  if (!Array.isArray(neededProducts) || neededProducts.length === 0) {
    return neededProducts
  }
  const allowedSet = new Set(allowedPlanIds)
  return neededProducts.filter((priceList) => {
    if (!Array.isArray(priceList) || priceList.length === 0) return false
    const planId = Object.entries(plans || {}).find(([, plan]) => {
      const planPrices = Object.values(plan?.prices?.current || {})
      if (planPrices.length === 0) return false
      return planPrices.every((price) => priceList.includes(price))
    })?.[0]
    return planId ? allowedSet.has(planId) : false
  })
}

const normalizeNeededProducts = (neededProducts) => {
  if (!Array.isArray(neededProducts)) return []
  return neededProducts.filter(
    (priceGroup) => Array.isArray(priceGroup) && priceGroup.length > 0,
  )
}

const getMaxBillableActionsPerBot = (bots = []) => {
  if (!Array.isArray(bots)) return 0
  return bots.reduce((maxCount, bot) => {
    const actionCount = countBillableBotActions({
      tools: bot?.tools,
      leadCollect: bot?.leadCollect,
      mcpServers: bot?.mcpServers,
      widgetSkills: bot?.widgetSkills,
    })
    return Math.max(maxCount, actionCount)
  }, 0)
}

const cloneJson = (value) => {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value))
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

        const { data } = await stripe.billingPortal.configurations.list({
          expand: ['data.features.subscription_update.products'],
          active: true,
          is_default: false,
          limit: 100,
        })

        const teamInvites = await getInvitesFromTeam(team.id)
        const allPlans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
        const bots = await getBots(team)
        const teamHasAddOns = hasPurchasedAddOns(team)
        if (upgrade && tier && team?.stripeSubscriptionId) {
          return res.status(409).json({
            message:
              'Plan changes must be previewed and confirmed from the account page.',
          })
        }
        let neededProducts = normalizeNeededProducts(
          getNeededStripeProduct(team, teamInvites, bots),
        )
        if (teamHasAddOns) {
          neededProducts = []
        }
        const teamSourceTypeIds = await getTeamSourceTypeIds(team.id)
        if (teamSourceTypeIds.length > 0) {
          const allowedPlanIds = Object.keys(allPlans).filter((planId) =>
            isPlanCompatibleWithSourceTypes({
              team,
              targetPlanId: planId,
              usedSourceTypeIds: teamSourceTypeIds,
            }),
          )
          const fallbackPlanId = stripePlan(team)?.id
          const effectiveAllowedPlanIds =
            allowedPlanIds.length > 0
              ? allowedPlanIds
              : fallbackPlanId
                ? [fallbackPlanId]
                : []
          if (effectiveAllowedPlanIds.length > 0) {
            neededProducts = filterNeededProductsByPlanIds(
              neededProducts,
              allPlans,
              effectiveAllowedPlanIds,
            )
            neededProducts = normalizeNeededProducts(neededProducts)
          }
        }

        // Check if team is on Business plan and has per bot roles - prevent downgrading
        const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
        const isCurrentlyStandardOrHigher = checkPlanPermission(team, 'standard').allowed

        if (isCurrentlyBusinessOrHigher) {
          if (
            teamHasPerBotRoleAssignments({
              bots,
              teamRoles: team.roles,
              teamInvites,
            })
          ) {
            // If they have per bot roles, restrict portal to Business-only (no downgrade option)
            const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
            const businessPrices = [
              plans?.business?.prices?.current?.monthly,
              plans?.business?.prices?.current?.annually,
            ].filter(Boolean)

            if (businessPrices.length > 0) {
              neededProducts = [businessPrices]
            }
          }
        } else if (
          isCurrentlyStandardOrHigher &&
          (teamHasStripeActionsEnabled({ bots }) || teamHasLeadCollectCustomFields({ bots }))
        ) {
          // If they have Stripe actions or lead custom fields, restrict portal to Standard and above
          neededProducts = filterNeededProductsByPlanIds(
            neededProducts,
            allPlans,
            ['standard', 'business', 'enterprise'],
          )
          neededProducts = normalizeNeededProducts(neededProducts)
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

        const getPortalConfigProductId = (product) => {
          const productValue = product?.product
          if (typeof productValue === 'string') return productValue
          if (productValue?.id) return productValue.id
          return null
        }

        const sanitizePortalProduct = (product) => {
          const sanitizedProduct = cloneJson(product) || {}
          if (
            sanitizedProduct?.adjustable_quantity &&
            (sanitizedProduct.adjustable_quantity.maximum === null ||
              sanitizedProduct.adjustable_quantity.maximum === '')
          ) {
            sanitizedProduct.adjustable_quantity = { enabled: false }
          }
          return sanitizedProduct
        }

        const buildPortalProductsFromPrices = async (priceGroups, baseProducts = []) => {
          const products = []

          for (const priceGroup of priceGroups || []) {
            if (!Array.isArray(priceGroup) || priceGroup.length === 0) continue

            const primaryPrice = await stripe.prices.retrieve(priceGroup[0])
            const productId = typeof primaryPrice?.product === 'string'
              ? primaryPrice.product
              : primaryPrice?.product?.id

            if (!productId) continue

            const templateProduct = baseProducts.find(
              (product) => getPortalConfigProductId(product) === productId,
            )
            products.push(sanitizePortalProduct({
              ...(templateProduct || {}),
              product: productId,
              prices: priceGroup,
            }))
          }

          return products
        }

        const buildPortalConfigurationParams = (baseConfig) => {
          const features = sanitizeSubscriptionUpdateFeatures(
            cloneJson(baseConfig?.features || {}),
          )
          const businessProfile = baseConfig?.business_profile || {}
          const params = {
            business_profile: {
              headline: businessProfile.headline || undefined,
              privacy_policy_url:
                businessProfile.privacy_policy_url ||
                'https://docsbot.ai/legal/privacy-policy',
              terms_of_service_url:
                businessProfile.terms_of_service_url ||
                'https://docsbot.ai/legal/terms-of-service',
            },
            features,
          }

          if (baseConfig?.default_return_url) {
            params.default_return_url = baseConfig.default_return_url
          }
          params.login_page = { enabled: false }
          if (baseConfig?.metadata && Object.keys(baseConfig.metadata).length > 0) {
            params.metadata = { ...baseConfig.metadata }
          }

          return params
        }

        const productPricesMatchNeededGroup = (product, priceGroups) => {
          const productPrices = [...(product?.prices || [])].sort()
          return priceGroups.some((priceGroup) => {
            const neededPrices = [...(priceGroup || [])].sort()
            return (
              productPrices.length === neededPrices.length &&
              productPrices.every((price, index) => price === neededPrices[index])
            )
          })
        }

        const ensureSubscriptionUpdateEnabled = (features, products) => {
          const existingUpdate = features?.subscription_update || {}
          const allowedUpdates = new Set(existingUpdate.default_allowed_updates || [])
          allowedUpdates.add('price')
          allowedUpdates.add('quantity')

          return {
            ...(features || {}),
            subscription_update: {
              ...existingUpdate,
              enabled: true,
              default_allowed_updates: Array.from(allowedUpdates),
              proration_behavior:
                existingUpdate.proration_behavior || 'create_prorations',
              products,
            },
          }
        }

        // If upgrading to a specific tier, validate the target tier can support current usage
        if (upgrade && tier) {
          const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
          const interval = team.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
          const targetInterval = isAnnualSale ? 'annually' : interval
          const targetPriceId = resolvePriceId(plans, tier, targetInterval)
          const targetPriceGroup = resolveCurrentPriceGroup(plans, tier)
          const targetActionsLimit = Number(plans?.[tier]?.actionsLimit)
          const maxBillableActionsPerBot = getMaxBillableActionsPerBot(bots)
          
          if (targetPriceId) {
            const allPrices = neededProducts.flat()
            if (!allPrices.includes(targetPriceId)) {
              throw Error('Your current usage exceeds the limits of your current and selected plan. Please select a higher tier plan to upgrade to.')
            }
            neededProducts = targetPriceGroup.length > 0
              ? [targetPriceGroup]
              : [[targetPriceId]]
          }

          if (
            Number.isFinite(targetActionsLimit) &&
            maxBillableActionsPerBot > targetActionsLimit
          ) {
            throw Error(
              `Your bots currently use up to ${maxBillableActionsPerBot} actions per bot, but the selected plan allows ${targetActionsLimit}. Disable actions or choose a higher plan.`,
            )
          }

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

          const botFeatureConflicts = getBotPlanFeatureConflicts({
            bots,
            targetPlanId: tier,
          })
          if (botFeatureConflicts.length > 0) {
            throw Error(
              `This plan does not support enabled bot features: ${botFeatureConflicts.join(', ')}. Disable those features or choose a higher plan.`,
            )
          }
          
          // Check if downgrading from Standard plan with Stripe actions or lead custom fields
          const isCurrentlyStandardOrHigher = checkPlanPermission(team, 'standard').allowed
          const isDowngradingToBelowStandard = isDowngradingBelowStandard(tier)

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

          // Check if downgrading from Business plan with per-bot roles
          const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
          const isDowngradingToBelowBusiness = isDowngradingBelowBusiness(tier)

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
        }

        //This command will disable non-default portal configs: stripe billing_portal configurations list --active=true --is-default=false | jq -r '.data[].id' | xargs -I {} stripe billing_portal configurations update {} --active=false

        const getConfigId = async (currentConfigs, neededProducts) => {
          let configId = ''
          if (Array.isArray(neededProducts) && neededProducts.length > 0) {
            currentConfigs.map((item) => {
              const subscriptionUpdate = item?.features?.subscription_update
              if (subscriptionUpdate?.products?.length === neededProducts?.length) {
                const isUpdateEnabled = subscriptionUpdate.enabled === true
                const supportsPriceUpdate = (
                  subscriptionUpdate.default_allowed_updates || []
                ).includes('price')
                const isPriceAvailable = subscriptionUpdate.products
                  ?.every((product) =>
                    productPricesMatchNeededGroup(product, neededProducts),
                  )
                if (isUpdateEnabled && supportsPriceUpdate && isPriceAvailable) {
                  configId = item.id
                }
              }
            })
            if (!configId) {
              const { data } = await stripe.billingPortal.configurations.list({
                expand: ['data.features.subscription_update.products', 'data.business_profile'],
                is_default: true,
              })
              let existingConfig = cloneJson(data[0]) || { features: {} }
              const newProducts = await buildPortalProductsFromPrices(
                neededProducts,
                existingConfig.features?.subscription_update?.products || [],
              )
              if (newProducts.length) {
                existingConfig.features = ensureSubscriptionUpdateEnabled(
                  existingConfig.features,
                  newProducts,
                )
              }
              const newConfig = await stripe.billingPortal.configurations?.create(
                buildPortalConfigurationParams(existingConfig),
              )
              configId = newConfig?.id
              console.log('New portal config created', configId)
            } else {
              console.log('Existing portal config found', configId)
            }
          }
          return configId
        }

        const getNoSubscriptionUpdateConfigId = async (currentConfigs) => {
          const existingConfig = currentConfigs.find(
            (item) => item?.features?.subscription_update?.enabled === false,
          )
          if (existingConfig?.id) return existingConfig.id

          const { data: defaultConfigData } = await stripe.billingPortal.configurations.list({
            expand: ['data.features.subscription_update.products', 'data.business_profile'],
            is_default: true,
          })
          const disabledConfig = cloneJson(defaultConfigData[0]) || { features: {} }
          disabledConfig.features = {
            ...(disabledConfig.features || {}),
            subscription_update: {
              ...(disabledConfig.features?.subscription_update || {}),
              enabled: false,
            },
          }
          const newConfig = await stripe.billingPortal.configurations.create(
            buildPortalConfigurationParams(disabledConfig),
          )
          return newConfig?.id || ''
        }

        let configId = teamHasAddOns
          ? await getNoSubscriptionUpdateConfigId(data)
          : await getConfigId(data, neededProducts)

        // If upgrading from annual to annual with sale, create a custom config with billing_cycle_anchor reset
        const isAnnualToAnnualSale = upgrade && tier && isAnnualSale && team.stripeSubscriptionInterval === 'year'
        if (isAnnualToAnnualSale && neededProducts.length > 0) {
          // Check if a config with billing_cycle_anchor: "now" already exists
          const existingSaleConfig = data.find((item) => {
            const hasBillingCycleAnchor = 
              item?.features?.subscription_update?.billing_cycle_anchor === 'now'
            const hasMatchingProducts = 
              item?.features?.subscription_update?.products?.length === neededProducts?.length &&
              item?.features?.subscription_update?.enabled === true &&
              (item?.features?.subscription_update?.default_allowed_updates || [])
                .includes('price') &&
              item?.features?.subscription_update?.products
                ?.every((product) =>
                  productPricesMatchNeededGroup(product, neededProducts),
                )
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
              if (!baseConfig) {
                baseConfig = await stripe.billingPortal.configurations.retrieve(configId, {
                  expand: ['features.subscription_update.products', 'business_profile'],
                })
              }
            }
            
            // If no base config found, use default
            if (!baseConfig) {
              const { data: defaultConfigData } = await stripe.billingPortal.configurations.list({
                expand: ['data.features.subscription_update.products', 'data.business_profile'],
                is_default: true,
              })
              baseConfig = defaultConfigData[0]
            }
            
            let saleConfig = cloneJson(baseConfig) || { features: {} }
            
            // Ensure products are built from the selected current price IDs.
            if (neededProducts && saleConfig.features?.subscription_update?.products) {
              const saleProducts = await buildPortalProductsFromPrices(
                neededProducts,
                saleConfig.features.subscription_update.products,
              )
              if (saleProducts.length) {
                saleConfig.features = ensureSubscriptionUpdateEnabled(
                  saleConfig.features,
                  saleProducts,
                )
              }
            }
            
            // Set billing_cycle_anchor to "now" to reset billing cycle
            if (saleConfig.features?.subscription_update) {
              saleConfig.features.subscription_update.billing_cycle_anchor = 'now'
            }
            
            const salePortalConfig = await stripe.billingPortal.configurations.create(
              buildPortalConfigurationParams(saleConfig),
            )
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
