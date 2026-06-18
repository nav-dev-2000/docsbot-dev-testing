export default function GrandfatheredPlanWarning({
  planName,
  message,
  limitDifferences = [],
  className = 'mt-5',
}) {
  if (!message) return null
  const formatLimit = (value) => Number(value || 0).toLocaleString()

  return (
    <div className={`${className} rounded-md border border-red-200 bg-red-50 p-4`}>
      <p className="text-sm font-semibold text-red-900">You have grandfathered plan limits</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>
      {limitDifferences.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm text-red-900">
          {limitDifferences.map((difference) => (
            <li key={difference.key} className="flex gap-2">
              <span aria-hidden="true">-</span>
              <span>
                <span className="font-medium">{difference.label}</span>
                {': '}
                {formatLimit(difference.grandfatheredLimit)} grandfathered
                {' vs '}
                {formatLimit(difference.currentLimit)} currently offered
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export const getGrandfatheredDowngradeWarningMessage = (planName) =>
  `Your ${planName} plan includes limits that are no longer offered on current plans. If you downgrade, you won't be able to switch back to these grandfathered limits.`

export const getGrandfatheredCancelWarningMessage = (planName) =>
  `Your ${planName} plan includes limits that are no longer offered on current plans. If you cancel, you won't be able to get these grandfathered limits back if you resubscribe.`
