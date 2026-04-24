import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ChevronDownIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  invalidHttpFieldNameMessage,
  isValidHttpFieldName,
} from '@/lib/httpFieldName'

/** Open the advanced (custom auth) panel when the saved server has data there. */
function shouldOpenCustomAuthOnLoad(server) {
  if (!server) return false
  if (String(server.oauthClientId || '').trim()) return true
  if (String(server.oauthClientSecret || '').trim()) return true
  if (String(server.apiKey || '').trim()) return true
  const h = server.customHeaders
  if (h && typeof h === 'object' && !Array.isArray(h)) {
    for (const [rawK, rawV] of Object.entries(h)) {
      const k = rawK == null ? '' : String(rawK).trim()
      const v = rawV == null ? '' : String(rawV).trim()
      if (k || v) return true
    }
  }
  return false
}

export default function ModalMcpServer({
  open,
  setOpen,
  server,
  onSave,
  teamId,
  botId,
}) {
  const [oauthClientId, setOauthClientId] = useState('')
  const [oauthClientSecret, setOauthClientSecret] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [serverLabel, setServerLabel] = useState('')
  const [serverUrl, setServerUrl] = useState('')
  const [serverDescription, setServerDescription] = useState('')
  const [generatingDraft, setGeneratingDraft] = useState(false)
  const [draftError, setDraftError] = useState('')
  const [addPhase, setAddPhase] = useState('url')
  const [customAuthOpen, setCustomAuthOpen] = useState(false)
  const [customHeaders, setCustomHeaders] = useState([{ key: '', value: '' }])

  const [errors, setErrors] = useState({})

  const isAdd = !server

  const mapToHeaderRows = (headers) => {
    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
      return [{ key: '', value: '' }]
    }
    const rows = Object.entries(headers).map(([key, value]) => ({
      key: String(key ?? ''),
      value: value == null ? '' : String(value),
    }))
    return rows.length ? rows : [{ key: '', value: '' }]
  }

  const headerRowsToMap = (rows) => rows.reduce((acc, row) => {
    const key = typeof row?.key === 'string' ? row.key.trim() : ''
    if (!key) return acc
    acc[key] = row?.value == null ? '' : String(row.value)
    return acc
  }, {})

  const validateServerLabel = (label) => {
    if (!label) return 'Server label is required'
    if (label.length < 3) return 'At least 3 characters'
    if (!/^[a-zA-Z0-9_-]+$/.test(label)) {
      return 'Only letters, numbers, underscore (_) and dash (-) are allowed. No spaces. Example: echo_test or server-1'
    }
    if (label.length > 255) return 'Server label must be less than 255 characters'
    return ''
  }

  const validateServerUrl = (url) => {
    if (!url) return 'Server URL is required'
    if (!/^https:\/\//.test(url)) {
      return 'URL must start with https://'
    }
    if (url.length > 255) return 'URL must be less than 255 characters'
    return ''
  }

  const validateCustomHeaderRows = (rows) => {
    for (const row of rows) {
      const key = typeof row?.key === 'string' ? row.key.trim() : ''
      if (!key) continue
      if (!isValidHttpFieldName(key)) {
        return invalidHttpFieldNameMessage(key)
      }
    }
    return ''
  }

  useEffect(() => {
    if (server) {
      setServerLabel(server.serverLabel || '')
      setServerUrl(server.serverUrl || '')
      setServerDescription(server.serverDescription || '')
      setOauthClientId(server.oauthClientId || '')
      setOauthClientSecret(server.oauthClientSecret || '')
      setApiKey(server.apiKey || '')
      setCustomHeaders(mapToHeaderRows(server.customHeaders))
      setDraftError('')
      setGeneratingDraft(false)
      setAddPhase('details')
      setCustomAuthOpen(shouldOpenCustomAuthOnLoad(server))
    } else {
      setServerLabel('')
      setServerUrl('')
      setServerDescription('')
      setOauthClientId('')
      setOauthClientSecret('')
      setApiKey('')
      setCustomHeaders([{ key: '', value: '' }])
      setDraftError('')
      setGeneratingDraft(false)
      setAddPhase('url')
      setCustomAuthOpen(false)
    }
    setErrors({})
  }, [server, open])

  const canRequestDraft = Boolean(teamId && botId)

  const handleDraftMetadata = async () => {
    setDraftError('')
    const urlError = validateServerUrl(serverUrl)
    if (urlError) {
      setErrors((prev) => ({ ...prev, serverUrl: urlError }))
      return
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next.serverUrl
      return next
    })

    if (!canRequestDraft) {
      setDraftError('Unable to look up server details (missing team or bot).')
      return
    }

    try {
      setGeneratingDraft(true)
      const response = await fetch(
        `/api/teams/${teamId}/bots/${botId}/mcp-server-draft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ serverUrl: serverUrl.trim() }),
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setDraftError(
          data?.message ||
            'Could not generate server details. Please try again.',
        )
        return
      }

      if (data?.serverLabel) {
        setServerLabel(String(data.serverLabel).trim())
      }
      if (data?.serverDescription != null) {
        setServerDescription(String(data.serverDescription).trim())
      }

      setErrors({})
      if (isAdd) {
        setAddPhase('details')
      }
    } catch (error) {
      setDraftError('Could not generate server details. Please try again.')
    } finally {
      setGeneratingDraft(false)
    }
  }

  const handleRegenerateDescription = async () => {
    if (!server) return
    setDraftError('')
    const urlError = validateServerUrl(serverUrl)
    if (urlError) {
      setErrors((prev) => ({ ...prev, serverUrl: urlError }))
      return
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next.serverUrl
      return next
    })

    if (!canRequestDraft) {
      setDraftError('Unable to look up server details (missing team or bot).')
      return
    }

    const enabledTools = (server.tools || [])
      .filter((t) => t.enabled)
      .map((t) => {
        const name = typeof t.name === 'string' ? t.name.trim() : ''
        if (!name) return null
        const o = { name }
        if (typeof t.description === 'string' && t.description.trim()) {
          o.description = t.description.trim()
        }
        return o
      })
      .filter(Boolean)

    try {
      setGeneratingDraft(true)
      const response = await fetch(
        `/api/teams/${teamId}/bots/${botId}/mcp-server-draft`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            serverUrl: serverUrl.trim(),
            enabledTools,
          }),
        },
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setDraftError(
          data?.message ||
            'Could not regenerate the description. Please try again.',
        )
        return
      }

      if (data?.serverLabel) {
        setServerLabel(String(data.serverLabel).trim())
      }
      if (data?.serverDescription != null) {
        setServerDescription(String(data.serverDescription).trim())
      }

      setErrors({})
    } catch (error) {
      setDraftError('Could not regenerate the description. Please try again.')
    } finally {
      setGeneratingDraft(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isAdd && addPhase === 'url') {
      return
    }

    const nextErrors = {
      serverLabel: validateServerLabel(serverLabel),
      serverUrl: validateServerUrl(serverUrl),
      customHeaders: validateCustomHeaderRows(customHeaders),
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some((error) => error)) {
      return
    }
    setErrors({})
    const customHeadersMap = headerRowsToMap(customHeaders)
    onSave({
      ...server,

      id: server?.id,
      type: 'mcp',
      serverLabel,
      serverUrl,
      serverDescription,
      requireApproval: 'never',
      oauthClientId,
      oauthClientSecret,
      apiKey: apiKey || '',
      ...(Object.keys(customHeadersMap).length > 0
        ? { customHeaders: customHeadersMap }
        : {}),
      enabled: server?.enabled !== undefined ? server.enabled : false,
      tools: server?.tools || [],
      createdAt: server?.createdAt || new Date().toISOString(),
    })
  }

  const showDetailsFields = !isAdd || addPhase === 'details'

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-[999]" onClose={setOpen}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-2 w-full text-center sm:mt-0 sm:text-left">
                    <Dialog.Title
                      as="h3"
                      className="text-lg font-medium leading-6 text-gray-900"
                    >
                      {server ? 'Edit MCP Server' : 'Add MCP Server'}
                    </Dialog.Title>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          DocsBot supports connecting to remote MCP servers so
                          you can integrate your agent with your internal tools.
                        </p>
                        <label
                          htmlFor="mcp-server-url"
                          className="block text-sm font-medium text-gray-700"
                        >
                          MCP server URL
                        </label>
                        <input
                          type="url"
                          name="url"
                          id="mcp-server-url"
                          value={serverUrl}
                          onChange={(e) => {
                            const value = e.target.value
                            setServerUrl(value)
                            setErrors((prev) => {
                              const next = { ...prev }
                              delete next.serverUrl
                              return next
                            })
                          }}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                          placeholder="https://mcp.example.com/mcp"
                          autoComplete="off"
                        />
                        {errors.serverUrl && (
                          <p className="mt-1 min-h-[1rem] text-xs text-red-500">
                            {errors.serverUrl}
                          </p>
                        )}
                        {isAdd && addPhase === 'url' && (
                          <div className="mt-3 space-y-3">
                            <p className="text-xs text-gray-500">
                              We suggest a label and description from the URL
                              (and public info when needed). You can edit them
                              on the next step.
                            </p>
                            <div className="flex items-center justify-between gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setAddPhase('details')
                                  setDraftError('')
                                }}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 text-left"
                              >
                                Skip and enter details manually
                              </button>
                              <button
                                type="button"
                                onClick={handleDraftMetadata}
                                disabled={
                                  generatingDraft ||
                                  !canRequestDraft ||
                                  Boolean(validateServerUrl(serverUrl))
                                }
                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
                              >
                                {generatingDraft ? (
                                  <>
                                    <LoadingSpinner
                                      small
                                      className="!m-0 h-4 w-4 text-white"
                                    />
                                    <span>Generating</span>
                                  </>
                                ) : (
                                  'Next'
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {draftError && (
                          <p className="mt-2 text-xs text-red-500">
                            {draftError}
                          </p>
                        )}
                      </div>

                      {showDetailsFields && (
                        <>
                          <div>
                            <label
                              htmlFor="mcp-server-label"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Server label
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="mcp-server-label"
                              value={serverLabel}
                              onChange={(e) => {
                                const value = e.target.value
                                setServerLabel(value)
                                setErrors((prev) => {
                                  const next = { ...prev }
                                  delete next.serverLabel
                                  return next
                                })
                              }}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                              placeholder="my-server-label"
                              autoComplete="off"
                            />
                            {errors.serverLabel && (
                              <p className="mt-1 text-xs text-red-500">
                                {errors.serverLabel}
                              </p>
                            )}
                          </div>

                          <div>
                            <label
                              htmlFor="mcp-server-description"
                              className="block text-sm font-medium text-gray-700"
                            >
                              Description
                            </label>
                            <textarea
                              name="description"
                              id="mcp-server-description"
                              rows={3}
                              value={serverDescription}
                              onChange={(e) =>
                                setServerDescription(e.target.value)
                              }
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                              placeholder="When the agent should use tools from this MCP server."
                            />
                            {!isAdd && (
                              <div className="mt-2">
                                <button
                                  type="button"
                                  onClick={handleRegenerateDescription}
                                  disabled={
                                    generatingDraft ||
                                    !canRequestDraft ||
                                    Boolean(validateServerUrl(serverUrl))
                                  }
                                  className="text-sm font-medium text-cyan-600 hover:text-cyan-800 disabled:cursor-not-allowed disabled:text-gray-400"
                                >
                                  {generatingDraft ? (
                                    <span className="inline-flex items-center gap-2">
                                      <LoadingSpinner
                                        small
                                        className="!m-0 h-4 w-4 text-cyan-600"
                                      />
                                      Regenerating…
                                    </span>
                                  ) : (
                                    'Regenerate description'
                                  )}
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="border-t border-gray-200 pt-2">
                            <button
                              type="button"
                              onClick={() =>
                                setCustomAuthOpen((open) => !open)
                              }
                              className="flex w-full items-center justify-between gap-2 rounded-md text-left text-sm font-medium text-gray-900 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1"
                              aria-expanded={customAuthOpen}
                            >
                              <span>
                                Custom Authentication{' '}
                                <span className="font-normal text-gray-500">
                                  (advanced)
                                </span>
                              </span>
                              <ChevronDownIcon
                                className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${
                                  customAuthOpen ? 'rotate-180' : ''
                                }`}
                                aria-hidden
                              />
                            </button>
                            {customAuthOpen && (
                              <div className="space-y-1 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <label
                                      htmlFor="mcp-oauth-client-id"
                                      className="block text-sm font-medium text-gray-700"
                                    >
                                      Client ID
                                    </label>
                                    <input
                                      type="text"
                                      id="mcp-oauth-client-id"
                                      name="mcpOAuthClientId"
                                      value={oauthClientId}
                                      onChange={(e) =>
                                        setOauthClientId(e.target.value)
                                      }
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                      placeholder="Optional"
                                      autoComplete="off"
                                      data-1p-ignore
                                      data-lpignore="true"
                                    />
                                  </div>
                                  <div>
                                    <label
                                      htmlFor="mcp-oauth-client-secret"
                                      className="block text-sm font-medium text-gray-700"
                                    >
                                      Client secret
                                    </label>
                                    <input
                                      type="text"
                                      id="mcp-oauth-client-secret"
                                      name="mcpOAuthClientSecret"
                                      value={oauthClientSecret}
                                      onChange={(e) =>
                                        setOauthClientSecret(e.target.value)
                                      }
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                      placeholder="Optional"
                                      autoComplete="off"
                                      data-1p-ignore
                                      data-lpignore="true"
                                    />
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400">
                                  Manual credentials skip dynamic client
                                  registration when the server requires
                                  allowlisting.
                                </p>
                                <div className="mt-3 border-t border-gray-100 pt-3">
                                  <p className="text-sm font-medium text-gray-700">
                                    Custom request headers
                                  </p>
                                  <p className="text-xs text-gray-400">
                                    Optional headers sent when connecting to this MCP server.
                                  </p>
                                  {errors.customHeaders && (
                                    <p className="mt-2 text-xs text-red-500">
                                      {errors.customHeaders}
                                    </p>
                                  )}
                                  <div className="mt-2 space-y-2">
                                    {customHeaders.map((header, index) => (
                                      <div key={`header-row-${index}`} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2">
                                        <input
                                          type="text"
                                          value={header.key}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setCustomHeaders((prev) => prev.map((row, rowIndex) => (
                                              rowIndex === index ? { ...row, key: value } : row
                                            )))
                                            setErrors((prev) => {
                                              const next = { ...prev }
                                              delete next.customHeaders
                                              return next
                                            })
                                          }}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                          placeholder="Header name"
                                          autoComplete="off"
                                        />
                                        <input
                                          type="text"
                                          value={header.value}
                                          onChange={(e) => {
                                            const value = e.target.value
                                            setCustomHeaders((prev) => prev.map((row, rowIndex) => (
                                              rowIndex === index ? { ...row, value } : row
                                            )))
                                          }}
                                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                          placeholder="Header value"
                                          autoComplete="off"
                                          data-1p-ignore
                                          data-lpignore="true"
                                        />
                                        {index > 0 ? (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setCustomHeaders((prev) =>
                                                prev.filter((_, rowIndex) => rowIndex !== index),
                                              )
                                            }}
                                            className="inline-flex flex-shrink-0 items-center justify-center self-end rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 sm:self-center"
                                            title="Remove header"
                                            aria-label="Remove header"
                                          >
                                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                          </button>
                                        ) : (
                                          <span
                                            className="hidden shrink-0 sm:block sm:w-9"
                                            aria-hidden="true"
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setCustomHeaders((prev) => [...prev, { key: '', value: '' }])
                                    }
                                    className="mt-2 text-sm font-medium text-cyan-600 hover:text-cyan-800"
                                  >
                                    + Add header
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}

                      {showDetailsFields && (
                        <div className="mt-5 sm:mt-6">
                          <button
                            type="submit"
                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:text-sm"
                          >
                            Save server
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
