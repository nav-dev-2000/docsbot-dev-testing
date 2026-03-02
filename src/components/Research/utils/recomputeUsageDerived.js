export const recomputeUsageDerived = (usage) => {
    if (!usage) return usage

    const monthlyLimit = usage.monthlyLimit
    const monthlyUsed = usage.monthlyUsed ?? 0
    const lifetimeLimit = usage.lifetimeLimit
    const lifetimeUsed = usage.lifetimeUsed ?? 0

    return {
        ...usage,
        monthlyRemaining:
            monthlyLimit === null
                ? Infinity
                : Math.max(
                      (typeof monthlyLimit === 'number' ? monthlyLimit : 0) -
                          monthlyUsed,
                      0,
                  ),
        trialRemaining:
            typeof lifetimeLimit === 'number' && lifetimeLimit > 0
                ? Math.max(lifetimeLimit - lifetimeUsed, 0)
                : 0,
    }
}
