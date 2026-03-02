export const formatResearchUsageDisplay = (usage) => {
    if (!usage) return null

    const {
        monthlyLimit,
        monthlyUsed = 0,
        lifetimeLimit,
        lifetimeUsed = 0,
        planName,
    } = usage

    const hasTrial = typeof lifetimeLimit === 'number' && lifetimeLimit > 0

    const formatRatio = (usedValue, limitValue) => {
        const used = Number.isFinite(usedValue) ? usedValue : 0
        if (limitValue === null) {
            return `${used}/\u221E`
        }
        if (typeof limitValue === 'number') {
            return `${used}/${limitValue}`
        }
        return `${used}/\u221E`
    }

    if (hasTrial && (monthlyLimit === 0 || monthlyLimit === undefined)) {
        const used = Math.min(lifetimeUsed, lifetimeLimit)
        return {
            label: `Deep research trial: ${used} / ${lifetimeLimit}`,
            tooltip:
                'Legacy Pro plans include a one-time deep research task trial that can be used before upgrading.',
            ratio: formatRatio(used, lifetimeLimit),
        }
    }

    if (monthlyLimit === null) {
        return {
            label: `${monthlyUsed} deep research tasks used`,
            tooltip: `Your ${planName} plan has a custom deep research task allowance. Contact support to adjust this limit.`,
            ratio: formatRatio(monthlyUsed, null),
        }
    }

    if (typeof monthlyLimit === 'number') {
        return {
            label: `${monthlyUsed} / ${monthlyLimit} deep research tasks this month`,
            tooltip: `Your ${planName} plan includes ${monthlyLimit} deep research tasks per month.`,
            ratio: formatRatio(monthlyUsed, monthlyLimit),
        }
    }

    return {
        label: `${monthlyUsed} deep research tasks used`,
        tooltip: `Your ${planName} plan has a custom deep research task allowance.`,
        ratio: formatRatio(monthlyUsed, monthlyLimit),
    }
}
