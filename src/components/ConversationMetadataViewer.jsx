import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  CircleStackIcon,
  ClipboardIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'
import HelpScoutLogo from '@/components/HelpScoutLogo'

const POPOVER_MARGIN = 16
const POPOVER_OFFSET = 8
const POPOVER_MAX_WIDTH = 512

// Format key: convert underscores to spaces and capitalize
const formatKey = (key) => {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function ConversationMetadataViewer({ metadata }) {
  const [copiedKeys, setCopiedKeys] = useState(new Set())
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [panelPosition, setPanelPosition] = useState({
    top: POPOVER_MARGIN,
    left: POPOVER_MARGIN,
  })
  const [portalTarget, setPortalTarget] = useState(null)
  const buttonRef = useRef(null)
  const panelRef = useRef(null)

  const updatePanelPosition = useCallback(() => {
    if (!buttonRef.current || typeof window === 'undefined') return

    const buttonRect = buttonRef.current.getBoundingClientRect()
    const panelRect = panelRef.current?.getBoundingClientRect()
    const targetRect =
      portalTarget && portalTarget !== document.body
        ? portalTarget.getBoundingClientRect()
        : null
    const panelWidth = Math.min(
      POPOVER_MAX_WIDTH,
      window.innerWidth - POPOVER_MARGIN * 2,
    )
    const panelHeight = panelRect?.height || 0
    const maxLeft = window.innerWidth - panelWidth - POPOVER_MARGIN
    const nextLeft = Math.min(
      Math.max(buttonRect.left, POPOVER_MARGIN),
      Math.max(POPOVER_MARGIN, maxLeft),
    )

    const belowTop = buttonRect.bottom + POPOVER_OFFSET
    const aboveTop = buttonRect.top - panelHeight - POPOVER_OFFSET
    const maxTop = window.innerHeight - panelHeight - POPOVER_MARGIN
    const nextTop =
      panelHeight > 0 &&
      belowTop + panelHeight > window.innerHeight - POPOVER_MARGIN &&
      aboveTop >= POPOVER_MARGIN
        ? aboveTop
        : Math.min(
            Math.max(belowTop, POPOVER_MARGIN),
            Math.max(POPOVER_MARGIN, maxTop),
          )

    setPanelPosition({
      top: targetRect ? nextTop - targetRect.top : nextTop,
      left: targetRect ? nextLeft - targetRect.left : nextLeft,
    })
  }, [portalTarget])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !buttonRef.current) return

    setPortalTarget(
      buttonRef.current.closest('[data-question-dialog-panel]') ||
        document.body,
    )
  }, [mounted])

  useEffect(() => {
    if (!open) return

    updatePanelPosition()
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }
    const handlePointerDown = (event) => {
      if (
        buttonRef.current?.contains(event.target) ||
        panelRef.current?.contains(event.target)
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handlePointerDown, true)
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handlePointerDown, true)
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [open, updatePanelPosition])

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

  useEffect(() => {
    if (open) {
      updatePanelPosition()
    }
  }, [open, filteredMetadata, updatePanelPosition])

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

  const metadataPanel =
    mounted && open && portalTarget
      ? createPortal(
          <div
            ref={panelRef}
            className={`${
              portalTarget === document.body ? 'fixed' : 'absolute'
            } z-[10000] w-[min(calc(100vw-2rem),32rem)] rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}
            style={{
              top: `${panelPosition.top}px`,
              left: `${panelPosition.left}px`,
            }}
          >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between border-b border-gray-200 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Metadata
                  </h3>
                  <button
                    onClick={() => setOpen(false)}
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
            </div>,
          portalTarget,
        )
      : null

  return (
    <>
      <Tooltip content="View conversation metadata">
        <button
          ref={buttonRef}
          type="button"
          className="flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => {
            setOpen((currentOpen) => !currentOpen)
          }}
        >
          <CircleStackIcon className="h-5 w-5" aria-hidden="true" />
          <span className="sr-only">View conversation metadata</span>
        </button>
      </Tooltip>
      {metadataPanel}
    </>
  )
}
