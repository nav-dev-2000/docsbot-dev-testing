import { getLeadCollectExtraFields } from '@/lib/leadCollect'

export const PLAN_LEVELS = {
  free: 1,
  hobby: 2,
  personal: 3,
  pro: 4,
  standard: 5,
  business: 6,
  enterprise: 7,
}

export const getPlanResearchTasksLimit = (planLimits = {}) => {
  if (typeof planLimits.researchTasks === 'number') {
    return planLimits.researchTasks
  }

  if (
    typeof planLimits.researchTasks === 'object' &&
    planLimits.researchTasks !== null
  ) {
    return (
      planLimits.researchTasks.monthly || planLimits.researchTasks.lifetime || 0
    )
  }

  return 0
}

export const getEffectiveResearchTaskCount = ({
  team = {},
  currentPlan = {},
} = {}) => {
  const currentPlanResearchLimit =
    typeof currentPlan?.researchTasks === 'number' ? currentPlan.researchTasks : 0
  const rawResearchCount = Math.max(0, Number(team?.researchCount ?? 0))
  const trialResearchAmount =
    currentPlanResearchLimit === 0 ? Math.min(2, rawResearchCount) : 0

  return Math.max(0, rawResearchCount - trialResearchAmount)
}

export const getExceededPlanLimits = ({
  team = {},
  planLimits = {},
  inviteCount = 0,
  currentPlan = {},
} = {}) => {
  const exceededLimits = []
  const researchTasksLimit = getPlanResearchTasksLimit(planLimits)
  const researchCount = getEffectiveResearchTaskCount({ team, currentPlan })

  const planBotsLimit = Number(planLimits.bots) || 0
  const planPagesLimit = Number(planLimits.pages) || 0
  const planQuestionsLimit = Number(planLimits.questions) || 0
  const planTeamMembersLimit = Number(planLimits.teamMembers) || 0

  const currentBots = Number(team?.botCount ?? 0)
  const currentPages = Number(team?.pageCount ?? 0)
  const currentQuestions = Number(team?.questionCount ?? 0)
  const currentTeamMembers = Object.keys(team?.roles || {}).length + inviteCount

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
    exceededLimits.push(
      `team members (${currentTeamMembers} > ${planTeamMembersLimit})`,
    )
  }
  if (researchCount > researchTasksLimit) {
    exceededLimits.push(`research tasks (${researchCount} > ${researchTasksLimit})`)
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
