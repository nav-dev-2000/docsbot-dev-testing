import { ClipboardIcon, CheckIcon, PrinterIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'

export default function ResearchActionButtons({ onCopy, onPrint, isCopied, compact = false }) {
  const iconSize = compact ? 'h-4 w-4' : 'h-5 w-5'
  const buttonClass = compact
    ? 'rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
    : 'flex items-center rounded-sm text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'

  return (
    <div className="flex items-center gap-3">
      <Tooltip content={isCopied ? 'Copied!' : 'Copy'}>
        <button
          onClick={onCopy}
          className={buttonClass}
          title="Copy"
        >
          {isCopied ? (
            <CheckIcon className={iconSize} />
          ) : (
            <ClipboardIcon className={iconSize} />
          )}
          {!compact && (
            <span className="ml-1 text-sm">
              {isCopied ? 'Copied' : 'Copy'}
            </span>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Print formatted report">
        <button
          onClick={onPrint}
          className={buttonClass}
          title="Print"
          type="button"
        >
          <PrinterIcon className={iconSize} />
          {!compact && <span className="ml-1 text-sm">Print</span>}
        </button>
      </Tooltip>
    </div>
  )
}

