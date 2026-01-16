import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'

const StreamdownMermaidError = ({ chart, error, showActions = false }) => (
  <div className="rounded-lg border border-amber-200 bg-amber-50 mt-1 p-4">
    {error ? (
      <Tooltip content={error} placement="top">
        <div className="flex items-center gap-2 text-amber-700 cursor-help">
          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
          <p className="font-semibold">Diagram could not be rendered</p>
        </div>
      </Tooltip>
    ) : (
      <div className="flex items-center gap-2 text-amber-700">
        <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
        <p className="font-semibold">Diagram could not be rendered</p>
      </div>
    )}
    <p className="mt-2 text-xs text-amber-700">
      This diagram contains invalid Mermaid syntax, so it cannot be displayed.
    </p>
    {showActions && (
      <div className="mt-3">
        <p className="text-sm font-medium text-amber-800">What you can do:</p>
        <ul className="mt-1 list-disc list-inside text-sm text-amber-700">
          <li>Ask me to try to fix the invalid syntax</li>
        </ul>
      </div>
    )}
    {chart && (
      <div className="mt-3 rounded border border-amber-200 bg-white p-3">
        <pre className="text-xs text-amber-900 overflow-x-auto">
          <code>{chart}</code>
        </pre>
      </div>
    )}
  </div>
)

export default StreamdownMermaidError
