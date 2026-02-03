import { teamMembersRoles } from '@/constants/permissions.constants'
import { isSuperAdmin } from '@/utils/helpers'

export const noop = (f) => f;

export const getUserRole = (team, userId) => {
    if (team && userId) {
        if (isSuperAdmin(userId)) {
            return 'admin'
        }
        return team?.roles[userId]
    }
    else
        return ""
}

// returns the explicit per-bot role override (admin|editor|viewer|none) for a user or 'default' if not set
export const getUserBotRole = (team, bot, userId) => {
    if (!team || !bot || !userId) return 'default'
    const botRoles = bot?.roles || {}
    return botRoles[userId] || 'default'
}

// resolves the effective role for a user on a bot: per-bot override if present (except 'default'), otherwise falls back to team role
export const getEffectiveRoleForBot = (team, bot, userId) => {
    if (!team || !userId) return ''
    if (isSuperAdmin(userId)) return 'admin'
    const teamRole = getUserRole(team, userId)
    if (!bot) return teamRole
    const botRole = getUserBotRole(team, bot, userId)
    if (botRole && botRole !== 'default') return botRole
    if (teamRole === 'none') return 'none'
    return teamRole
}

export const canUserCreateDeleteBot = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role !== 'viewer' && role !== 'editor' && role !== 'none') {
        return true
    }
    return false
}

export const canUserViewBot = (team, bot, userId) => {
    if (!team || !bot || !userId) return false
    if (isSuperAdmin(userId)) return true
    const role = getEffectiveRoleForBot(team, bot, userId)
    return role && role !== 'none'
}

// If bot provided, check against effective role for that bot
export const canUserEditBot = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    if (role && role !== 'viewer' && role !== 'none') {
        return true
    }
    return false
}

// Bot admin-only permissions (settings, integrations, exports)
export const canUserManageBotSettings = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    return role === 'admin' || role === 'owner'
}

export const canUserManageIntegrations = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    return role === 'admin' || role === 'owner'
}

export const canUserExportBotLogs = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    return role === 'admin' || role === 'owner' || role === 'editor'
}

export const canUserViewBotStats = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    return role && role !== 'none'
}

export const canUserInvite = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role === 'owner' || role === 'admin') {
        return true
    }
    return false
}

export const canUserModifyTeam = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role === 'owner' || role === 'admin') {
        return true
    }
    return false
}

export const canUserDeleteTeam = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role === 'owner') {
        return true
    }
    return false
}

export const canUserManageBilling = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role === 'owner' || role === 'admin') {
        return true
    }
    return false
}

// If bot provided, check against effective role for that bot
export const canUserModifySources = (team, userId, bot = null) => {
    const role = bot ? getEffectiveRoleForBot(team, bot, userId) : getUserRole(team, userId)
    if (role && role !== 'viewer' && role !== 'none') {
        return true
    }
    return false
}
