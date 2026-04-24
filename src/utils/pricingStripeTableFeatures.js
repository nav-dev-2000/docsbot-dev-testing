import { featureDefinitions } from '@/constants/pricing.constants'

/** Omitted from plan card / Stripe compact bullet lists (still in full matrix). */
const COMPACT_EXCLUDED = new Set(['mcpServer'])

/**
 * When two rows share a category, lower index wins (Skills & action ordering).
 * Unknown keys sort after known ones, stable for the rest.
 */
const COMPACT_BULLET_KEY_ORDER = [
  'docsBots',
  'sourcePages',
  'messagesPerMonth',
  'researchTasksPerMonth',
  'teamUsers',
  'docsBotSkills',
  'bookingActions',
  'webSearch',
  'leadCollection',
  'leadCollectionCustomFields',
  'escalationTickets',
  'mcpRemoteConnectors',
  'stripeActions',
  'customActionButtons',
]

function compactKeyOrderIndex(key) {
  const i = COMPACT_BULLET_KEY_ORDER.indexOf(key)
  return i === -1 ? 1000 : i
}

/**
 * Same feature rows as the Stripe pricing table columns (StripePricing.jsx).
 */
export function getDifferentiatingFeatures(currentTier, tierIndex, allTiers) {
  const previousTier = tierIndex > 0 ? allTiers[tierIndex - 1] : null

  const coreLimits = [
    'docsBots',
    'sourcePages',
    'messagesPerMonth',
    'researchTasksPerMonth',
    'teamUsers',
  ]
  const features = []

  coreLimits.forEach((key) => {
    const value = currentTier.features[key]
    if (value !== undefined && value !== false && value !== 0) {
      features.push([key, value])
    }
  })

  if (tierIndex === 0) {
    Object.entries(currentTier.features).forEach(([key, value]) => {
      if (
        !coreLimits.includes(key) &&
        typeof value === 'boolean' &&
        value === true
      ) {
        features.push([key, value])
      }
    })
    return features
      .filter(([k]) => !COMPACT_EXCLUDED.has(k))
      .slice(0, 8)
  }

  const differentiatingFeatures = []

  Object.entries(currentTier.features).forEach(([key, value]) => {
    if (coreLimits.includes(key)) return

    const prevValue = previousTier?.features[key]
    const featureDef = featureDefinitions[key]

    if (featureDef?.category === 'limits') {
      if (
        typeof value === 'number' &&
        typeof prevValue === 'number' &&
        value > prevValue
      ) {
        differentiatingFeatures.push([key, value])
      } else if (
        typeof value === 'string' &&
        value !== prevValue &&
        value !== 'false' &&
        value !== ''
      ) {
        differentiatingFeatures.push([key, value])
      }
    }
  })

  Object.entries(currentTier.features).forEach(([key, value]) => {
    if (coreLimits.includes(key)) return

    const prevValue = previousTier?.features[key]

    if (key === 'customActionButtons') {
      if (
        typeof value === 'string' &&
        value !== 'false' &&
        value !== '' &&
        value !== prevValue
      ) {
        differentiatingFeatures.push([key, value])
      }
      return
    }

    if (featureDefinitions[key]?.category !== 'limits') {
      if (
        (prevValue === false || prevValue === 0 || prevValue === '') &&
        (value === true ||
          (typeof value === 'string' && value !== 'false' && value !== '') ||
          (typeof value === 'number' && value > 0))
      ) {
        differentiatingFeatures.push([key, value])
      }
    }
  })

  const allFeatures = [...features, ...differentiatingFeatures]

  return allFeatures
    .filter(([k]) => !COMPACT_EXCLUDED.has(k))
    .sort((a, b) => {
      const [aKey] = a
      const [bKey] = b

      if (coreLimits.includes(aKey) && !coreLimits.includes(bKey)) return -1
      if (!coreLimits.includes(aKey) && coreLimits.includes(bKey)) return 1
      if (coreLimits.includes(aKey) && coreLimits.includes(bKey)) {
        return coreLimits.indexOf(aKey) - coreLimits.indexOf(bKey)
      }

      const aCat = featureDefinitions[aKey]?.category
      const bCat = featureDefinitions[bKey]?.category
      const priority = {
        limits: 0,
        integrations: 1,
        actions: 2,
        analytics: 3,
        ai: 4,
        features: 5,
        sources: 6,
        customization: 7,
        support: 8,
        compliance: 9,
      }
      const pr = (priority[aCat] || 99) - (priority[bCat] || 99)
      if (pr !== 0) return pr
      return compactKeyOrderIndex(aKey) - compactKeyOrderIndex(bKey)
    })
    .slice(0, 14)
}

/** Label string for one row — matches StripePricing table list items. */
export function formatStripeTableFeatureLabel(key, value) {
  const featureDef = featureDefinitions[key]
  if (!featureDef) return null

  let displayText = featureDef.label
  if (typeof value === 'string' && value !== 'true') {
    displayText = `${featureDef.label}: ${value}`
  } else if (typeof value === 'number') {
    displayText = `${value} ${featureDef.label}`
  }

  return displayText
}

export function getVisibleStripePricingTiers(pricingTiersList) {
  return pricingTiersList.filter(
    (tier) => !tier.legacy && tier.showInStripe !== false,
  )
}
