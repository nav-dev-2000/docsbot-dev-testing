import { featureDefinitions, pricingTiers } from '@/constants/pricing.constants'
import {
  formatStripeTableFeatureLabel,
  getVisibleStripePricingTiers,
} from '@/utils/pricingStripeTableFeatures'
import {
  countBillableBotActions,
  checkPlanPermission,
  stripePlan,
} from '@/utils/helpers'
import {
  getBotPlanFeatureConflicts,
  getExceededPlanLimits,
} from '@/utils/checkoutValidation'
import { getEffectiveAddOns } from '@/utils/billingAddOns'
import { getIncompatibleSourceTypesForPlan } from '@/utils/sourceTypePlanChecks'

export const PLAN_LEVELS = {
  free: 1,
  hobby: 2,
  personal: 3,
  pro: 4,
  standard: 5,
  business: 6,
  enterprise: 7,
}

const getConfiguredPlans = () => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
  } catch (error) {
    console.warn('Unable to parse NEXT_PUBLIC_STRIPE_PLANS', error)
    return {}
  }
}

const formatLimitDisplay = (key, value) => {
  const label = formatStripeTableFeatureLabel(key, value)
  if (label) return label
  const featureDef = featureDefinitions[key]
  if (!featureDef) return key
  if (typeof value === 'number') return `${value.toLocaleString()} ${featureDef.label}`
  if (typeof value === 'string' && value !== 'true' && value !== 'false') {
    return `${featureDef.label}: ${value}`
  }
  return featureDef.label
}

const featureIsIncluded = (value) => {
  if (value === true) return true
  if (typeof value === 'number') return value > 0
  if (typeof value === 'string') {
    return value !== '' && value !== 'false' && value !== '0'
  }
  return false
}

const isLimitDecrease = (currentValue, targetValue) => {
  const parseLimitValue = (value) => {
    if (typeof value === 'number') return value
    if (typeof value !== 'string') return null
    const normalized = value.trim().toLowerCase()
    if (normalized === 'unlimited') return Number.POSITIVE_INFINITY
    const match = normalized.match(/^([\d,.]+)\s*(k|m)?$/)
    if (!match) return null
    let amount = Number.parseFloat(match[1].replace(/,/g, ''))
    if (match[2] === 'k') amount *= 1000
    if (match[2] === 'm') amount *= 1_000_000
    return Number.isFinite(amount) ? amount : null
  }

  const currentParsed = parseLimitValue(currentValue)
  const targetParsed = parseLimitValue(targetValue)
  if (currentParsed != null && targetParsed != null) {
    return currentParsed > targetParsed
  }
  return String(currentValue) !== String(targetValue)
}

const getMaxActionsPerBot = (bots = []) =>
  Array.isArray(bots)
    ? bots.reduce((maxCount, bot) => {
        const actionCount = countBillableBotActions({
          tools: bot?.tools,
          leadCollect: bot?.leadCollect,
          mcpServers: bot?.mcpServers,
          widgetSkills: bot?.widgetSkills,
        })
        return Math.max(maxCount, actionCount)
      }, 0)
    : 0

export const getIncompatibleSourceTypesByTier = ({
  team,
  teamSourceTypes = [],
  tiers = getVisibleStripePricingTiers(pricingTiers),
}) => {
  const normalizedSourceTypes = Array.isArray(teamSourceTypes) ? teamSourceTypes : []
  if (normalizedSourceTypes.length === 0) return {}

  const result = {}
  tiers.forEach((tier) => {
    const incompatible = getIncompatibleSourceTypesForPlan({
      team,
      targetPlanId: tier.id,
      usedSourceTypeIds: normalizedSourceTypes,
    })
    if (incompatible.length > 0) {
      result[tier.id] = incompatible
    }
  })
  return result
}

export const getPlanSelectionDisableReasons = ({
  team,
  bots = [],
  teamInvites = [],
  teamSourceTypes = [],
  targetPlanId,
  isUpgrade = true,
  configuredPlans = getConfiguredPlans(),
  incompatibleSourceTypesByTier = null,
}) => {
  const reasons = []
  const planLimits = configuredPlans[targetPlanId]
  if (!planLimits) return reasons

  const incompatibleByTier =
    incompatibleSourceTypesByTier ||
    getIncompatibleSourceTypesByTier({ team, teamSourceTypes })

  const planActionsLimit = Number(planLimits.actionsLimit)
  const maxActionsPerBot = getMaxActionsPerBot(bots)
  const addOns = getEffectiveAddOns(team)

  if (Number.isFinite(planActionsLimit) && maxActionsPerBot > planActionsLimit) {
    reasons.push(`Actions per bot: ${maxActionsPerBot}/${planActionsLimit}`)
  }

  if (
    (PLAN_LEVELS[targetPlanId] || 0) < PLAN_LEVELS.business &&
    (addOns.teamMembers?.quantity || 0) > 0
  ) {
    reasons.push('Extra team users require Business or higher')
  }

  reasons.push(
    ...getBotPlanFeatureConflicts({
      bots,
      targetPlanId,
    }),
  )

  if (isUpgrade) {
    reasons.push(
      ...getExceededPlanLimits({
        team,
        planLimits,
        inviteCount: teamInvites.length,
      }),
    )
  } else {
    const planBotsLimit = Number(planLimits.bots) || 0
    const planPagesLimit = Number(planLimits.pages) || 0
    const planQuestionsLimit = Number(planLimits.questions) || 0
    const planTeamMembersLimit = Number(planLimits.teamMembers) || 0
    const effectiveBotsLimit = planBotsLimit + (addOns.bots?.quantity || 0)
    const effectivePagesLimit =
      planPagesLimit + (addOns.sourcePages?.quantity || 0) * 10000
    const effectiveQuestionsLimit =
      planQuestionsLimit + (addOns.aiCredits?.quantity || 0) * 5000
    const effectiveTeamMembersLimit =
      planTeamMembersLimit + (addOns.teamMembers?.quantity || 0)

    const currentBots = Number(team?.botCount ?? 0)
    const currentPages = Number(team?.pageCount ?? 0)
    const currentQuestions = Number(team?.questionCount ?? 0)
    const currentTeamMembers =
      Object.keys(team?.roles || {}).length + teamInvites.length

    if (currentBots > effectiveBotsLimit) {
      reasons.push(`Bots: ${currentBots}/${effectiveBotsLimit}`)
    }
    if (currentPages > effectivePagesLimit) {
      reasons.push(`Pages: ${currentPages}/${effectivePagesLimit}`)
    }
    if (currentQuestions > effectiveQuestionsLimit) {
      reasons.push(`Questions: ${currentQuestions}/${effectiveQuestionsLimit}`)
    }
    if (currentTeamMembers > effectiveTeamMembersLimit) {
      reasons.push(`Team members: ${currentTeamMembers}/${effectiveTeamMembersLimit}`)
    }
  }

  if (isUpgrade) {
    const isCurrentlyBusinessOrHigher = checkPlanPermission(team, 'business').allowed
    const targetTierLevel = PLAN_LEVELS[targetPlanId] || 0
    const businessLevel = PLAN_LEVELS.business
    const isDowngradingToBelowBusiness = targetTierLevel < businessLevel

    if (isCurrentlyBusinessOrHigher && isDowngradingToBelowBusiness) {
      if (bots && Array.isArray(bots)) {
        const teamMemberIds = Object.keys(team?.roles || {})
        const hasPerBotRoles = bots.some((bot) => {
          if (!bot.roles) return false
          return Object.keys(bot.roles).some((memberId) => {
            const botRole = bot.roles[memberId]
            return (
              botRole &&
              botRole !== 'default' &&
              teamMemberIds.includes(memberId)
            )
          })
        })

        const invitesHaveBotOverrides = teamInvites.some(
          (invite) =>
            invite.botOverrides &&
            Array.isArray(invite.botOverrides) &&
            invite.botOverrides.length > 0,
        )

        if (hasPerBotRoles || invitesHaveBotOverrides) {
          reasons.push('Per-bot roles require Business or higher')
        }
      } else {
        reasons.push('Cannot verify per-bot roles for Business downgrade')
      }
    }
  }

  if (incompatibleByTier[targetPlanId]?.length > 0) {
    reasons.push(
      `Unsupported source types: ${incompatibleByTier[targetPlanId]
        .map((source) => source.title)
        .join(', ')}`,
    )
  }

  return reasons
}

export const getEligibleLowerPlanOptions = ({
  team,
  bots = [],
  teamInvites = [],
  teamSourceTypes = [],
  configuredPlans = getConfiguredPlans(),
}) => {
  if (!team?.stripeSubscriptionId) return []

  const visibleTiers = getVisibleStripePricingTiers(pricingTiers)
  const currentPlanId = stripePlan(team)?.id || null
  const currentPlanLevel = PLAN_LEVELS[currentPlanId] || 0
  const incompatibleSourceTypesByTier = getIncompatibleSourceTypesByTier({
    team,
    teamSourceTypes,
    tiers: visibleTiers,
  })

  return visibleTiers
    .filter((tier) => {
      const tierLevel = PLAN_LEVELS[tier.id] || 0
      return (
        tierLevel > 0 &&
        tierLevel < currentPlanLevel &&
        getSubscriptionPlanChangeBlockers({
          team,
          bots,
          teamInvites,
          teamSourceTypes,
          targetPlanId: tier.id,
          incompatibleSourceTypesByTier,
          configuredPlans,
        }).length === 0
      )
    })
    .sort((a, b) => (PLAN_LEVELS[b.id] || 0) - (PLAN_LEVELS[a.id] || 0))
}

export const getSubscriptionPlanChangeBlockers = ({
  team,
  bots = [],
  teamInvites = [],
  teamSourceTypes = [],
  targetPlanId,
  incompatibleSourceTypesByTier = null,
  configuredPlans = getConfiguredPlans(),
}) =>
  getPlanSelectionDisableReasons({
    team,
    bots,
    teamInvites,
    teamSourceTypes,
    targetPlanId,
    incompatibleSourceTypesByTier,
    configuredPlans,
  })

export const assertSubscriptionPlanChangeAllowed = (params) => {
  const blockers = getSubscriptionPlanChangeBlockers(params)
  if (blockers.length > 0) {
    throw new Error(
      `This plan does not fit your current usage: ${blockers.join('; ')}.`,
    )
  }
}

export const getPlanDowngradeLosses = ({ currentPlanId, targetPlanId }) => {
  const visibleTiers = getVisibleStripePricingTiers(pricingTiers)
  const currentTier = visibleTiers.find((tier) => tier.id === currentPlanId)
  const targetTier = visibleTiers.find((tier) => tier.id === targetPlanId)
  if (!currentTier || !targetTier) return []

  const coreLimitKeys = new Set([
    'docsBots',
    'sourcePages',
    'messagesPerMonth',
    'actionsLimit',
    'teamUsers',
    'botLifetime',
  ])
  const losses = []

  coreLimitKeys.forEach((key) => {
    const currentValue = currentTier.features[key]
    const targetValue = targetTier.features[key]
    if (!featureIsIncluded(currentValue)) return
    if (!isLimitDecrease(currentValue, targetValue)) return

    losses.push({
      type: 'limit',
      label: featureDefinitions[key]?.label || key,
      from: formatLimitDisplay(key, currentValue),
      to: formatLimitDisplay(key, targetValue),
    })
  })

  Object.entries(currentTier.features).forEach(([key, value]) => {
    if (coreLimitKeys.has(key)) return
    if (!featureIsIncluded(value)) return

    const targetValue = targetTier.features[key]
    if (featureIsIncluded(targetValue)) {
      if (
        typeof value === 'number' &&
        typeof targetValue === 'number' &&
        value > targetValue
      ) {
        losses.push({
          type: 'feature',
          label: featureDefinitions[key]?.label || key,
          from: String(value),
          to: String(targetValue),
        })
      }
      return
    }

    losses.push({
      type: 'feature',
      label: featureDefinitions[key]?.label || key,
    })
  })

  return losses
}
