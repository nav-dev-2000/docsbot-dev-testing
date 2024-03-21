import { teamMembersRoles } from '@/constants/permissions.constants'

export const noop = (f) => f;

export const getUserRole = (team, userId) => {
    if (team && userId) {
        return team?.roles[userId]
    }
    else
        return ""
}

export const canUserCreateDeleteBot = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role !== 'viewer' && role !== 'editor') {
        return true
    }
    return false
}

export const canUserEditBot = (team, userId) => {
    if (getUserRole(team, userId) !== 'viewer') {
        return true
    }
    return false
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
    if (role === 'owner' || role === 'admin') {
        return true
    }
    return false
}

export const canUserModifySources = (team, userId) => {
    const role = getUserRole(team, userId)
    if (role !== 'viewer') {
        return true
    }
    return false
}