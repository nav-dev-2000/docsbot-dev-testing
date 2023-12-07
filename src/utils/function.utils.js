export const noop = (f) => f;

export const getUserRole = (team, userId) => {
    if (team && userId) {
        return team?.roles[userId]
    }
    else
        return ""
}