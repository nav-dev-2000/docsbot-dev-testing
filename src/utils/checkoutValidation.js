import {
  getLeadCollectExtraFields,
  isLeadCollectEnabled,
} from '@/lib/leadCollect'
import { normalizeWebSearchAllowedDomains } from '@/lib/webSearch'
import { getEffectiveAddOns } from '@/utils/billingAddOns'

export const PLAN_LEVELS = {
  free: 1,
  hobby: 2,
  personal: 3,
  pro: 4,
  standard: 5,
  business: 6,
  enterprise: 7,
}

export const getExceededPlanLimits = ({
  team = {},
  planLimits = {},
  inviteCount = 0,
} = {}) => {
  const exceededLimits = []

  const planBotsLimit = Number(planLimits.bots) || 0
  const planPagesLimit = Number(planLimits.pages) || 0
  const planQuestionsLimit = Number(planLimits.questions) || 0
  const planTeamMembersLimit = Number(planLimits.teamMembers) || 0
  const addOns = getEffectiveAddOns(team)
  const effectiveBotsLimit = planBotsLimit + (addOns.bots?.quantity || 0)
  const effectivePagesLimit =
    planPagesLimit + (addOns.sourcePages?.quantity || 0) * 10000
  const effectiveQuestionsLimit =
    planQuestionsLimit + (addOns.aiCredits?.quantity || 0) * 5000

  const currentBots = Number(team?.botCount ?? 0)
  const currentPages = Number(team?.pageCount ?? 0)
  const currentQuestions = Number(team?.questionCount ?? 0)
  const currentTeamMembers = Object.keys(team?.roles || {}).length + inviteCount

  if (currentBots > effectiveBotsLimit) {
    exceededLimits.push(`bots (${currentBots} > ${effectiveBotsLimit})`)
  }
  if (currentPages > effectivePagesLimit) {
    exceededLimits.push(`pages (${currentPages} > ${effectivePagesLimit})`)
  }
  if (currentQuestions > effectiveQuestionsLimit) {
    exceededLimits.push(`questions (${currentQuestions} > ${effectiveQuestionsLimit})`)
  }
  if (currentTeamMembers > planTeamMembersLimit) {
    exceededLimits.push(
      `team members (${currentTeamMembers} > ${planTeamMembersLimit})`,
    )
  }

  return exceededLimits
}

export const teamHasPerBotRoleAssignments = ({
  bots = [],
  teamRoles = {},
  teamInvites = [],
} = {}) => {
  const teamMemberIds = Object.keys(teamRoles || {})

  const hasPerBotRoles = bots.some((bot) => {
    if (!bot?.roles) return false

    return Object.keys(bot.roles).some((memberId) => {
      const botRole = bot.roles[memberId]
      return botRole && botRole !== 'default' && teamMemberIds.includes(memberId)
    })
  })

  if (hasPerBotRoles) return true

  return teamInvites.some((invite) => {
    return (
      invite?.botOverrides &&
      Array.isArray(invite.botOverrides) &&
      invite.botOverrides.length > 0
    )
  })
}

export const isDowngradingBelowBusiness = (tier) => {
  const targetTierLevel = PLAN_LEVELS[tier] || 0
  return targetTierLevel < PLAN_LEVELS.business
}

export const isDowngradingBelowStandard = (tier) => {
  const targetTierLevel = PLAN_LEVELS[tier] || 0
  return targetTierLevel < PLAN_LEVELS.standard
}

export const isDowngradingBelowPersonal = (tier) => {
  const targetTierLevel = PLAN_LEVELS[tier] || 0
  return targetTierLevel < PLAN_LEVELS.personal
}

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const actionEnabled = (value, defaultEnabled = false) => {
  if (typeof value === 'boolean') return value
  if (!isPlainObject(value)) return false
  if ('enabled' in value) return Boolean(value.enabled)
  return defaultEnabled
}

const hasConfiguredBookingAction = (value) => {
  if (!actionEnabled(value, true)) return false
  if (!isPlainObject(value)) return false
  return typeof value.url === 'string' && value.url.trim() !== ''
}

export const teamHasBookingActionsEnabled = ({ bots = [] } = {}) => {
  const bookingActionKeys = ['calendly', 'calcom', 'tidycal']
  return bots.some((bot) =>
    bookingActionKeys.some((key) => hasConfiguredBookingAction(bot?.tools?.[key])),
  )
}

export const teamHasCustomButtonsEnabled = ({ bots = [] } = {}) => {
  return bots.some((bot) => {
    const customButtons = bot?.tools?.customButtons
    return (
      Array.isArray(customButtons) &&
      customButtons.some((button) => actionEnabled(button, true))
    )
  })
}

export const teamHasMcpServersEnabled = ({ bots = [] } = {}) => {
  return bots.some(
    (bot) =>
      Array.isArray(bot?.mcpServers) &&
      bot.mcpServers.some((server) => server?.enabled === true),
  )
}

export const teamHasLeadCollectionEnabled = ({ bots = [] } = {}) => {
  return bots.some((bot) => {
    if (typeof bot?.leadCollect === 'boolean') return bot.leadCollect
    return isLeadCollectEnabled(bot?.leadCollect)
  })
}

/**
 * Returns true if any bot has Stripe billing support actions enabled.
 * Used to block downgrades from Standard when Stripe actions are in use.
 */
export const teamHasStripeActionsEnabled = ({ bots = [] } = {}) => {
  return bots.some(
    (bot) =>
      bot?.tools?.stripe &&
      typeof bot.tools.stripe === 'object' &&
      bot.tools.stripe.enabled === true,
  )
}

/**
 * Returns true if any bot has lead collection with custom fields (beyond name/email).
 * Used to block downgrades from Standard when custom lead fields are in use.
 */
export const teamHasLeadCollectCustomFields = ({ bots = [] } = {}) => {
  return bots.some((bot) => {
    const extra = getLeadCollectExtraFields(bot?.leadCollect)
    return Array.isArray(extra) && extra.length > 0
  })
}

export const teamHasWebSearchEnabled = ({ bots = [] } = {}) => {
  return bots.some((bot) => actionEnabled(bot?.tools?.web_search, false))
}

export const teamHasWebSearchAllowedDomains = ({ bots = [] } = {}) => {
  return bots.some((bot) => {
    const webSearch = bot?.tools?.web_search
    if (!isPlainObject(webSearch)) return false
    return normalizeWebSearchAllowedDomains(webSearch.allowed_domains).length > 0
  })
}

export const teamHasWidgetSkillsEnabled = ({ bots = [] } = {}) => {
  return bots.some(
    (bot) => Array.isArray(bot?.widgetSkills) && bot.widgetSkills.length > 0,
  )
}

export const getBotPlanFeatureConflicts = ({
  bots = [],
  targetPlanId,
} = {}) => {
  const conflicts = []
  const safeBots = Array.isArray(bots) ? bots : []

  if (isDowngradingBelowPersonal(targetPlanId)) {
    if (teamHasBookingActionsEnabled({ bots: safeBots })) {
      conflicts.push('Scheduling actions require Personal or higher')
    }
    if (teamHasCustomButtonsEnabled({ bots: safeBots })) {
      conflicts.push('Custom action buttons require Personal or higher')
    }
    if (teamHasLeadCollectionEnabled({ bots: safeBots })) {
      conflicts.push('Lead collection requires Personal or higher')
    }
    if (teamHasMcpServersEnabled({ bots: safeBots })) {
      conflicts.push('MCP servers require Personal or higher')
    }
  }

  if (isDowngradingBelowStandard(targetPlanId)) {
    if (teamHasWebSearchEnabled({ bots: safeBots })) {
      conflicts.push('Web search requires Standard or higher')
    }
    if (teamHasStripeActionsEnabled({ bots: safeBots })) {
      conflicts.push('Stripe billing support actions require Standard or higher')
    }
    if (teamHasLeadCollectCustomFields({ bots: safeBots })) {
      conflicts.push('Custom lead fields require Standard or higher')
    }
    if (teamHasWidgetSkillsEnabled({ bots: safeBots })) {
      conflicts.push('DocsBot Skills require Standard or higher')
    }
  }

  if (isDowngradingBelowBusiness(targetPlanId)) {
    if (teamHasWebSearchAllowedDomains({ bots: safeBots })) {
      conflicts.push('Web search allowed domains require Business or higher')
    }
  }

  return conflicts
}
