import LoadingSpinner from '@/components/LoadingSpinner'
import Tooltip from '@/components/Tooltip'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

const RETAINED_CREDIT_TOOLTIP =
  'Unused prorated credit will stay on your account and be applied automatically to future invoices.'

export default function PlanChangePreviewModal({
  preview,
  opening,
  onClose,
  onConfirm,
  description = 'This updates your plan. Any active add-ons stay on the same billing interval.',
}) {
  if (!preview) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 text-left shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Confirm subscription change</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <div className="mt-5 rounded-lg border border-gray-200">
          {(preview.lines || []).length > 0 ? (
            <div className="max-h-56 overflow-y-auto border-b border-gray-200 px-4 py-3">
              <ul className="space-y-3">
                {preview.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-start justify-between gap-4 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="text-gray-600">{line.description}</div>
                      {line.periodLabel && (
                        <div className="mt-0.5 text-xs text-gray-400">{line.periodLabel}</div>
                      )}
                    </div>
                    <span className="shrink-0 font-medium text-gray-900">
                      {line.formattedAmount}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="border-b border-gray-200 px-4 py-3 text-sm text-gray-600">
              Stripe does not show any immediate prorated charge for this change.
            </p>
          )}
          {preview.accountCreditApplied > 0 && (
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm">
              <span className="text-gray-600">Account credit applied</span>
              <span className="font-medium text-gray-900">
                -{preview.formattedAccountCreditApplied}
              </span>
            </div>
          )}
          {preview.creditAmount > 0 && (
            <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-gray-600">
                Credit kept for future invoices
                <Tooltip content={RETAINED_CREDIT_TOOLTIP}>
                  <span
                    className="inline-flex cursor-help text-gray-400"
                    aria-label={RETAINED_CREDIT_TOOLTIP}
                  >
                    <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Tooltip>
              </span>
              <span className="shrink-0 font-medium text-gray-900">
                {preview.formattedCreditAmount}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-gray-700">Amount due now</span>
            <span className="text-sm font-semibold text-gray-900">
              {preview.formattedAmountDue}
            </span>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            onClick={onClose}
            disabled={opening}
          >
            Cancel
          </button>
          <button
            type="button"
            className="inline-flex min-w-32 items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={onConfirm}
            disabled={opening}
          >
            {opening ? <LoadingSpinner /> : 'Confirm change'}
          </button>
        </div>
      </div>
    </div>
  )
}
