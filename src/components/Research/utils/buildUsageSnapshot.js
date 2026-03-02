import { stripePlan } from '@/utils/helpers'
import { recomputeUsageDerived } from './recomputeUsageDerived'

export const buildUsageSnapshot = (team) => {
    // Staff localhost testing team - allow unlimited deep research jobs
    const STAFF_TESTING_TEAM_ID = 'nG4F5A3BFSBzdYc5TZIX'

    const plan = stripePlan(team || {})
    const rawMonthlyLimit = plan?.researchTasks
    const monthlyLimit =
        team?.id === STAFF_TESTING_TEAM_ID
            ? null // Unlimited for staff testing team
            : typeof rawMonthlyLimit === 'number' &&
                !Number.isNaN(rawMonthlyLimit)
              ? rawMonthlyLimit
              : 25
    const monthlyUsed = Number(team?.researchCount ?? 0) || 0

    const baseUsage = {
        planId: plan?.id || 'free',
        planName: plan?.name || 'Free',
        monthlyLimit,
        monthlyUsed,
    }

    const questionHistory =
        team?.questionHistory && typeof team.questionHistory === 'object'
            ? Object.values(team.questionHistory)
            : []

    const historicalCounts = []
    for (const entry of questionHistory) {
        if (!entry || typeof entry !== 'object') continue
        const value = Number(entry?.research ?? entry?.researchCount ?? 0)
        if (!Number.isNaN(value)) {
            historicalCounts.push(value)
        }
    }

    const researchLifetimeCount = Number(team?.researchLifetimeCount ?? 0)
    if (!Number.isNaN(researchLifetimeCount) && researchLifetimeCount > 0) {
        historicalCounts.push(researchLifetimeCount)
    }

    if (!Number.isNaN(monthlyUsed)) {
        historicalCounts.push(monthlyUsed)
    }

    const historicalMaxResearch =
        historicalCounts.length > 0 ? Math.max(...historicalCounts) : 0

    const rawPlanResearch =
        plan?.researchTasks ??
        plan?.research ??
        plan?.researchTasksPerMonth ??
        null

    let lifetimeLimit = null
    let legacyTrialThreshold = null

    if (rawPlanResearch && typeof rawPlanResearch === 'object') {
        const lifetimeCandidates = [
            rawPlanResearch.lifetime,
            rawPlanResearch.trial,
            rawPlanResearch.tasksLifetime,
            rawPlanResearch.jobsLifetime,
        ]

        for (const candidate of lifetimeCandidates) {
            if (typeof candidate === 'number') {
                lifetimeLimit = candidate
                break
            }
        }
    }

    if (lifetimeLimit === null) {
        const directLifetimeCandidates = [
            plan?.researchTasksLifetime,
            plan?.researchLifetime,
            plan?.research?.lifetime,
            plan?.research?.trial,
        ]

        for (const candidate of directLifetimeCandidates) {
            if (typeof candidate === 'number') {
                lifetimeLimit = candidate
                break
            }
        }
    }

    const normalizedPlanId = (baseUsage.planId || '').toLowerCase()
    const normalizedPlanName = (baseUsage.planName || '').toLowerCase()

    const isLegacyPlan = Boolean(plan?.legacy)
    const isLegacyPro =
        isLegacyPlan &&
        (normalizedPlanId === 'pro' || normalizedPlanName.includes('pro'))
    const isLegacyPersonal =
        isLegacyPlan &&
        (normalizedPlanId === 'personal' ||
            normalizedPlanName.includes('personal'))

    if (lifetimeLimit === null && (isLegacyPro || isLegacyPersonal)) {
        lifetimeLimit = 1
        legacyTrialThreshold = 2
    }

    let lifetimeUsed = Number(team?.researchLifetimeCount ?? 0) || 0

    if (typeof lifetimeLimit === 'number') {
        if (legacyTrialThreshold !== null) {
            lifetimeUsed = historicalMaxResearch >= legacyTrialThreshold ? 1 : 0
        } else if (lifetimeUsed === 0) {
            lifetimeUsed = historicalMaxResearch
        }
    }

    return recomputeUsageDerived({
        ...baseUsage,
        lifetimeLimit,
        lifetimeUsed,
        historicalMaxResearch,
        legacyTrialThreshold,
    })
}
