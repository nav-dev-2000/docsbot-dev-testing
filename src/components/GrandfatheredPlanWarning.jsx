export default function GrandfatheredPlanWarning({
  planName,
  message,
  className = 'mt-5',
}) {
  if (!message) return null

  return (
    <div className={`${className} rounded-md border border-red-200 bg-red-50 p-4`}>
      <p className="text-sm font-semibold text-red-900">You have grandfathered plan limits</p>
      <p className="mt-1 text-sm text-red-800">{message}</p>
    </div>
  )
}

export const getGrandfatheredDowngradeWarningMessage = (planName) =>
  `Your ${planName} plan includes limits that are no longer offered on current plans. If you downgrade, you won't be able to switch back to these grandfathered limits.`

export const getGrandfatheredCancelWarningMessage = (planName) =>
  `Your ${planName} plan includes limits that are no longer offered on current plans. If you cancel, you won't be able to get these grandfathered limits back if you resubscribe.`
