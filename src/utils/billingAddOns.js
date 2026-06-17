export const ADD_ON_IDS = {
  AI_CREDITS: 'aiCredits',
  BOTS: 'bots',
  SOURCE_PAGES: 'sourcePages',
  TEAM_MEMBERS: 'teamMembers',
}

export const AI_CREDIT_ADD_ON_BLOCK_SIZE = 5000

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(['active', 'trialing', 'past_due'])

const DEFAULT_ADD_ONS = {
  [ADD_ON_IDS.AI_CREDITS]: {
    id: ADD_ON_IDS.AI_CREDITS,
    name: 'AI Credit Limit',
    description: 'Increase your monthly AI credit limit for chat, skills, and API usage',
    limitKey: 'questions',
    unit: AI_CREDIT_ADD_ON_BLOCK_SIZE,
    monthlyPrice: {
      USD: 49,
      JPY: 8100,
      AUD: 72,
      EUR: 44,
      GBP: 38,
    },
    annualPrice: {
      USD: 588,
      JPY: 97200,
      AUD: 864,
      EUR: 528,
      GBP: 456,
    },
    unitLabel: '5k monthly limit increase',
    eligiblePlans: ['personal', 'standard', 'business', 'enterprise'],
  },
  [ADD_ON_IDS.BOTS]: {
    id: ADD_ON_IDS.BOTS,
    name: 'Extra Bots',
    description: 'Another DocsBot for a separate knowledge base or use case',
    limitKey: 'bots',
    unit: 1,
    monthlyPrice: {
      USD: 19,
      JPY: 3200,
      AUD: 28,
      EUR: 17,
      GBP: 15,
    },
    annualPrice: {
      USD: 228,
      JPY: 38400,
      AUD: 336,
      EUR: 204,
      GBP: 180,
    },
    unitLabel: 'extra bot',
    eligiblePlans: ['personal', 'standard', 'business', 'enterprise'],
  },
  [ADD_ON_IDS.SOURCE_PAGES]: {
    id: ADD_ON_IDS.SOURCE_PAGES,
    name: 'Source Pages',
    description: 'More indexed documentation from your connected sources',
    limitKey: 'pages',
    unit: 10000,
    monthlyPrice: {
      USD: 29,
      JPY: 4800,
      AUD: 43,
      EUR: 26,
      GBP: 23,
    },
    annualPrice: {
      USD: 348,
      JPY: 57600,
      AUD: 516,
      EUR: 312,
      GBP: 276,
    },
    unitLabel: '10k extra pages',
    eligiblePlans: ['personal', 'standard', 'business', 'enterprise'],
  },
  [ADD_ON_IDS.TEAM_MEMBERS]: {
    id: ADD_ON_IDS.TEAM_MEMBERS,
    name: 'Extra Team Users',
    description: 'More seats for teammates to access or edit bots in the dashboard',
    limitKey: 'teamMembers',
    unit: 1,
    monthlyPrice: {
      USD: 19,
      JPY: 3200,
      AUD: 28,
      EUR: 17,
      GBP: 15,
    },
    annualPrice: {
      USD: 228,
      JPY: 38400,
      AUD: 336,
      EUR: 204,
      GBP: 180,
    },
    unitLabel: 'extra team user',
    eligiblePlans: ['business', 'enterprise'],
  },
}

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

export const normalizeAddOnQuantity = (value) => {
  const quantity = Number(value)
  return Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0
}

const normalizeConfiguredAddOn = (fallback, configured = {}) => ({
  ...fallback,
  ...configured,
  id: configured.id || fallback.id,
  unit: Number(configured.unit) || fallback.unit,
  monthlyPrice: {
    ...(fallback.monthlyPrice || {}),
    ...(configured.monthlyPrice || {}),
  },
  annualPrice: {
    ...(fallback.annualPrice || {}),
    ...(configured.annualPrice || {}),
  },
})

let parsedAddOnsFromEnv
export const getStripeAddOnsFromEnv = () => {
  if (parsedAddOnsFromEnv !== undefined) return parsedAddOnsFromEnv

  const raw = process?.env?.NEXT_PUBLIC_STRIPE_ADDONS
  if (!raw) {
    parsedAddOnsFromEnv = DEFAULT_ADD_ONS
    return parsedAddOnsFromEnv
  }

  try {
    const configured = JSON.parse(raw)
    parsedAddOnsFromEnv = Object.fromEntries(
      Object.entries(DEFAULT_ADD_ONS).map(([id, fallback]) => [
        id,
        normalizeConfiguredAddOn(fallback, configured?.[id]),
      ]),
    )
  } catch (error) {
    console.warn('Unable to parse NEXT_PUBLIC_STRIPE_ADDONS', error)
    parsedAddOnsFromEnv = DEFAULT_ADD_ONS
  }

  return parsedAddOnsFromEnv
}

export const getAddOnConfig = (addOnId) =>
  getStripeAddOnsFromEnv()?.[addOnId] || null

export const getAddOnPriceIds = (addOnConfig) => {
  if (!addOnConfig) return []
  const prices = addOnConfig.prices || addOnConfig.price || {}
  if (typeof prices === 'string') return [prices]
  if (Array.isArray(prices)) return prices.filter(Boolean)
  if (isPlainObject(prices)) {
    return Object.values(prices)
      .flatMap((value) => {
        if (typeof value === 'string') return [value]
        if (Array.isArray(value)) return value
        if (isPlainObject(value)) return Object.values(value)
        return []
      })
      .filter(Boolean)
  }
  return []
}

export const getAllAddOnPriceIds = () =>
  Object.values(getStripeAddOnsFromEnv()).flatMap((addOn) =>
    getAddOnPriceIds(addOn),
  )

export const findAddOnByPriceId = (priceId) => {
  if (!priceId) return null
  return Object.values(getStripeAddOnsFromEnv()).find((addOn) =>
    getAddOnPriceIds(addOn).includes(priceId),
  ) || null
}

export const isAddOnPriceId = (priceId) => Boolean(findAddOnByPriceId(priceId))

const planLooksEnterprise = (plan = {}) => {
  const name = String(plan?.name || '')
  return (
    name === 'Enterprise' ||
    name === 'Staff' ||
    name.includes('Enterprise') ||
    Number(plan?.pages || 0) > 100000 ||
    Number(plan?.bots || 0) > 100
  )
}

export const isAddOnAvailableForPlan = (addOn, plan = {}) =>
  !Array.isArray(addOn?.eligiblePlans) ||
  addOn.eligiblePlans.includes(plan?.id) ||
  (addOn.eligiblePlans.includes('enterprise') && planLooksEnterprise(plan))

const normalizeInterval = (interval = 'month') =>
  interval === 'year' || interval === 'annually' || interval === 'annual'
    ? 'annually'
    : 'monthly'

export const getAddOnPriceId = (addOnId, currency = 'USD', interval = 'month') => {
  const addOn = getAddOnConfig(addOnId)
  if (!addOn) return null
  const prices = addOn.prices || {}
  const normalizedCurrency = String(currency || 'USD').toUpperCase()
  const normalizedInterval = normalizeInterval(interval)

  if (typeof prices === 'string') return prices
  if (prices.current?.[normalizedInterval]) return prices.current[normalizedInterval]
  if (prices[normalizedCurrency]?.[normalizedInterval]) {
    return prices[normalizedCurrency][normalizedInterval]
  }
  if (prices[normalizedInterval]) return prices[normalizedInterval]
  if (prices[normalizedCurrency]) return prices[normalizedCurrency]
  if (prices.current) return prices.current
  if (prices.USD) return prices.USD
  return getAddOnPriceIds(addOn)[0] || null
}

export const getAddOnDisplayPrice = (addOn, currency = 'USD', interval = 'month') => {
  if (!addOn) return 0
  const normalizedCurrency = String(currency || 'USD').toUpperCase()
  const priceSet = normalizeInterval(interval) === 'annually'
    ? addOn.annualPrice || {}
    : addOn.monthlyPrice || {}
  return priceSet[normalizedCurrency] || priceSet.USD || 0
}

export const normalizeTeamAddOns = (stripeAddOns = {}) => {
  const normalized = {}
  for (const addOnId of Object.keys(getStripeAddOnsFromEnv())) {
    const current = stripeAddOns?.[addOnId]
    const quantity = isPlainObject(current)
      ? current.quantity
      : current
    normalized[addOnId] = {
      quantity: normalizeAddOnQuantity(quantity),
      subscriptionId: isPlainObject(current) ? current.subscriptionId || null : null,
      itemId: isPlainObject(current) ? current.itemId || null : null,
      status: isPlainObject(current) ? current.status || null : null,
    }
  }
  return normalized
}

export const addOnsAreUsable = (team = {}) =>
  ACTIVE_SUBSCRIPTION_STATUSES.has(team?.stripeSubscriptionStatus)

export const getEffectiveAddOns = (team = {}) => {
  if (!addOnsAreUsable(team)) {
    return normalizeTeamAddOns({})
  }
  const normalized = normalizeTeamAddOns(team?.stripeAddOns || {})
  const baseSubscriptionId = team?.stripeSubscriptionId || null
  for (const [addOnId, addOn] of Object.entries(normalized)) {
    if (
      baseSubscriptionId &&
      addOn.subscriptionId &&
      addOn.subscriptionId !== baseSubscriptionId
    ) {
      normalized[addOnId] = {
        ...addOn,
        quantity: 0,
      }
    }
  }
  return normalized
}

export const applyAddOnsToPlan = (basePlan = {}, team = {}) => {
  const effectivePlan = { ...basePlan }
  const addOns = getEffectiveAddOns(team)

  for (const [addOnId, addOn] of Object.entries(getStripeAddOnsFromEnv())) {
    const quantity = addOns?.[addOnId]?.quantity || 0
    if (!quantity || !addOn.limitKey) continue
    const currentLimit = Number(effectivePlan[addOn.limitKey])
    if (!Number.isFinite(currentLimit)) continue
    effectivePlan[addOn.limitKey] = currentLimit + quantity * addOn.unit
  }

  return effectivePlan
}

export const subscriptionItems = (subscription = {}) =>
  Array.isArray(subscription?.items?.data) ? subscription.items.data : []

export const getSubscriptionItemPriceId = (item = {}) =>
  item?.price?.id || item?.plan?.id || null

export const getSubscriptionItemPrice = (item = {}) =>
  item?.price || item?.plan || null

export const collectAddOnsFromSubscription = (subscription = {}) => {
  const status = subscription?.status || null
  const subscriptionId = subscription.id || null
  const addOns = subscriptionId
    ? Object.fromEntries(
        Object.keys(getStripeAddOnsFromEnv()).map((addOnId) => [
          addOnId,
          {
            quantity: 0,
            subscriptionId,
            itemId: null,
            status,
          },
        ]),
      )
    : {}

  for (const item of subscriptionItems(subscription)) {
    const priceId = getSubscriptionItemPriceId(item)
    const addOn = findAddOnByPriceId(priceId)
    if (!addOn) continue
    addOns[addOn.id] = {
      quantity: normalizeAddOnQuantity(item.quantity),
      subscriptionId: subscription.id || null,
      itemId: item.id || null,
      status,
    }
  }

  return addOns
}

export const findSubscriptionAddOnItem = (subscription, addOnId) => {
  const addOn = getAddOnConfig(addOnId)
  if (!addOn) return null
  const priceIds = getAddOnPriceIds(addOn)
  return subscriptionItems(subscription).find((item) =>
    priceIds.includes(getSubscriptionItemPriceId(item)),
  ) || null
}

export const getBaseSubscriptionItem = (subscription = {}, configuredPlans) => {
  const items = subscriptionItems(subscription)
  if (items.length === 0) return null

  const configuredPriceIds = new Set()
  if (configuredPlans) {
    const collect = (value) => {
      if (!value) return
      if (typeof value === 'string') {
        configuredPriceIds.add(value)
        return
      }
      if (Array.isArray(value)) {
        value.forEach(collect)
        return
      }
      if (isPlainObject(value)) {
        Object.values(value).forEach(collect)
      }
    }
    Object.values(configuredPlans).forEach((plan) => collect(plan?.prices))
  }

  return items.find((item) => configuredPriceIds.has(getSubscriptionItemPriceId(item))) ||
    items.find((item) => !isAddOnPriceId(getSubscriptionItemPriceId(item))) ||
    null
}

export const mergeStripeAddOns = (existing = {}, incoming = {}) => {
  const next = normalizeTeamAddOns(existing)
  for (const [addOnId, addOn] of Object.entries(incoming || {})) {
    next[addOnId] = {
      ...next[addOnId],
      ...addOn,
      quantity: normalizeAddOnQuantity(addOn?.quantity),
    }
  }
  return next
}

export const getTeamAddOnsForRequestedQuantity = ({
  team = {},
  addOnId,
  quantity,
}) => {
  if (!addOnId) return mergeStripeAddOns(team?.stripeAddOns, {})

  const existing = normalizeTeamAddOns(team?.stripeAddOns)[addOnId] || {}
  return mergeStripeAddOns(team?.stripeAddOns, {
    [addOnId]: {
      ...existing,
      quantity: normalizeAddOnQuantity(quantity),
      subscriptionId:
        team?.stripeSubscriptionId || existing.subscriptionId || null,
      status: team?.stripeSubscriptionStatus || existing.status || null,
    },
  })
}

export const hasPurchasedAddOns = (team = {}) =>
  Object.values(getEffectiveAddOns(team)).some(
    (addOn) => addOn.quantity > 0,
  )

export const isAutoIncreaseAiCreditsEnabled = (team = {}) =>
  team?.autoIncreaseAiCredits === true
