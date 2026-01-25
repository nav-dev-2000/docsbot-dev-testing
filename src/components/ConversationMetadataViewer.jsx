import { useState, useEffect, useMemo, Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import {
  CircleStackIcon,
  ClipboardIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'
import HelpScoutLogo from '@/components/HelpScoutLogo'

// Format key: convert underscores to spaces and capitalize
const formatKey = (key) => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ConversationMetadataViewer({ metadata }) {
  const [copiedKeys, setCopiedKeys] = useState(new Set())

  // Check if this is a Help Scout conversation
  const isHelpScoutConversation = useMemo(() => {
    if (!metadata || typeof metadata !== 'object') {
      return false
    }
    return metadata.helpscoutReply === true
  }, [metadata])

  // Check if metadata has fields other than name and email
  const hasMetadata = useMemo(() => {
    if (!metadata || typeof metadata !== 'object') {
      return false
    }
    const keys = Object.keys(metadata)
    const filteredKeys = keys.filter(
      (key) => key !== 'name' && key !== 'email',
    )
    return filteredKeys.length > 0
  }, [metadata])

  // Get metadata excluding name and email
  const filteredMetadata = useMemo(() => {
    if (!hasMetadata) return {}
    const { name, email, ...rest } = metadata || {}
    return rest
  }, [metadata, hasMetadata])

  // Copy value to clipboard
  const copyValue = (value, keyPath, e) => {
    if (e) {
      e.stopPropagation()
    }
    const valueToCopy =
      typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
    navigator.clipboard.writeText(valueToCopy)
    setCopiedKeys((prev) => new Set([...prev, keyPath]))
    setTimeout(() => {
      setCopiedKeys((prev) => {
        const next = new Set(prev)
        next.delete(keyPath)
        return next
      })
    }, 2000)
  }

  // Render metadata value (handles nested objects and arrays)
  const renderMetadataValue = (value, depth = 0, keyPath = '') => {
    if (value === null || value === undefined) {
      const nullKeyPath = keyPath || 'null'
      return (
        <button
          onClick={(e) => copyValue('null', nullKeyPath, e)}
          className={`text-left rounded px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 transition-colors ${
            copiedKeys.has(nullKeyPath) ? 'bg-green-50 text-green-600' : ''
          }`}
        >
          null
        </button>
      )
    }

    const indentMargin = depth * 20

    if (Array.isArray(value)) {
      if (value.length === 0) {
        const emptyKeyPath = keyPath || 'empty'
        return (
          <button
            onClick={(e) => copyValue('[]', emptyKeyPath, e)}
            className={`text-left rounded px-2 py-1 text-sm text-gray-400 hover:bg-gray-100 transition-colors ${
              copiedKeys.has(emptyKeyPath) ? 'bg-green-50 text-green-600' : ''
            }`}
          >
            []
          </button>
        )
      }
      return (
        <div style={{ marginLeft: `${indentMargin}px` }} className="space-y-2">
          {value.map((item, index) => {
            const itemKeyPath = `${keyPath}[${index}]`
            if (typeof item === 'object' && item !== null) {
              return (
                <div key={index} className="space-y-1">
                  <div className="text-xs text-gray-500 mb-1">
                    Item {index + 1}:
                  </div>
                  {renderMetadataValue(item, depth + 1, itemKeyPath)}
                </div>
              )
            }
            return (
              <button
                key={index}
                onClick={(e) => copyValue(item, itemKeyPath, e)}
                className={`text-left rounded px-2 py-1 text-sm text-gray-900 hover:bg-gray-100 transition-colors w-full ${
                  copiedKeys.has(itemKeyPath)
                    ? 'bg-green-50 text-green-600'
                    : ''
                }`}
              >
                {String(item)}
              </button>
            )
          })}
        </div>
      )
    }

    if (typeof value === 'object') {
      return (
        <div
          style={{ marginLeft: `${indentMargin}px` }}
          className="space-y-2"
        >
          {Object.entries(value).map(([key, val]) => {
            const valKeyPath = keyPath ? `${keyPath}.${key}` : key
            return (
              <div key={key} className="flex items-start gap-2">
                <span className="text-sm font-medium text-gray-700 min-w-[120px] flex-shrink-0 py-1">
                  {formatKey(key)}:
                </span>
                <div className="flex-1 min-w-0">
                  {typeof val === 'object' && val !== null ? (
                    renderMetadataValue(val, depth + 1, valKeyPath)
                  ) : (
                    <button
                      onClick={(e) => copyValue(val, valKeyPath, e)}
                      className={`text-left rounded px-2 py-1 text-sm text-gray-900 hover:bg-gray-100 transition-colors w-full ${
                        copiedKeys.has(valKeyPath)
                          ? 'bg-green-50 text-green-600'
                          : ''
                      }`}
                    >
                      {String(val)}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )
    }

    // Primitive value - render as clickable button
    const primitiveKeyPath = keyPath || 'value'
    return (
      <button
        onClick={(e) => copyValue(value, primitiveKeyPath, e)}
        className={`text-left rounded px-2 py-1 text-sm text-gray-900 hover:bg-gray-100 transition-colors ${
          copiedKeys.has(primitiveKeyPath)
            ? 'bg-green-50 text-green-600'
            : ''
        }`}
      >
        {String(value)}
      </button>
    )
  }

  // If Help Scout conversation, show Help Scout icon instead of metadata dropdown
  if (isHelpScoutConversation) {
    const hasUrl =
      metadata.helpscoutConversationUrl &&
      typeof metadata.helpscoutConversationUrl === 'string'
    const icon = (
      <HelpScoutLogo className="h-5 w-5 text-[#1292ee]" aria-hidden="true" />
    )

    return (
      <Tooltip content={hasUrl ? 'View conversation in Help Scout' : 'Help Scout conversation'}>
        {hasUrl ? (
          <a
            href={metadata.helpscoutConversationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {icon}
          </a>
        ) : (
          <div className="flex items-center text-gray-400">
            {icon}
          </div>
        )}
      </Tooltip>
    )
  }

  if (!hasMetadata) {
    return null
  }

  return (
    <Popover className="relative">
      {({ open, close }) => (
        <>
          <Tooltip content="View conversation metadata">
            <Popover.Button className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none">
              <CircleStackIcon className="h-5 w-5" aria-hidden="true" />
            </Popover.Button>
          </Tooltip>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute left-0 z-10 mt-2 min-w-80 max-w-[calc(100vw-2rem)] origin-top-left rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Metadata
                  </h3>
                  <button
                    onClick={close}
                    className="rounded-md p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
                    aria-label="Close metadata viewer"
                  >
                    <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="max-h-96 divide-y divide-gray-200 overflow-y-auto">
                  {Object.entries(filteredMetadata).map(
                    ([key, value], index, array) => (
                      <div
                        key={key}
                        className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                      >
                        <span className="text-sm font-medium text-gray-700 min-w-[140px] flex-shrink-0 py-1">
                          {formatKey(key)}:
                        </span>
                        <div className="flex-1 min-w-0">
                          {renderMetadataValue(value, 0, key)}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  )
}
