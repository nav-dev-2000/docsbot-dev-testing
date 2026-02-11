import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChevronLeftIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CheckCircleIcon,
  PauseCircleIcon,
  PlayCircleIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import DashboardWrap from '@/components/DashboardWrap'
import Tooltip from '@/components/Tooltip'
import Alert from '@/components/Alert'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getBot } from '@/lib/dbQueries'
import { canUserManageIntegrations } from '@/utils/function.utils'
import Link from 'next/link'
import {
  WEBHOOK_EVENT_LEAD_CREATED,
  WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
  WEBHOOK_EVENT_CONVERSATION_RATED,
} from '@/lib/webhooks'

function WebhooksPage({ team, bot, preWebhooks = [] }) {
  const [webhooks, setWebhooks] = useState(preWebhooks)
  const [errorText, setErrorText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [targetUrl, setTargetUrl] = useState('')
  const [label, setLabel] = useState('')
  const [events, setEvents] = useState([WEBHOOK_EVENT_LEAD_CREATED])
  const [testResult, setTestResult] = useState(null)
  const [copiedSigningKey, setCopiedSigningKey] = useState(false)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const loadWebhooks = async () => {
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/webhooks`,
    )
    const data = await response.json()
    if (response.ok) {
      setWebhooks(data.webhooks || [])
      return
    }

    setErrorText(data.message || 'Unable to load webhooks.')
  }

  const createWebhook = async (event) => {
    event.preventDefault()
    setErrorText('')
    setIsSubmitting(true)

    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/webhooks`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl,
          label,
          events,
          source: 'admin',
        }),
      },
    )

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      setTargetUrl('')
      setLabel('')
      setEvents([WEBHOOK_EVENT_LEAD_CREATED])
      await loadWebhooks()
    } else {
      setErrorText(data.message || 'Failed to create webhook.')
    }

    setIsSubmitting(false)
  }

  const deleteWebhook = async (webhookId) => {
    if (!confirm('Delete this webhook subscription?')) return

    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/webhooks/${webhookId}`,
      {
        method: 'DELETE',
      },
    )

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      setErrorText(data.message || 'Failed to delete webhook.')
      return
    }

    await loadWebhooks()
  }

  const updateWebhookStatus = async (webhookId, status) => {
    setUpdatingStatusId(webhookId)
    setErrorText('')
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/webhooks/${webhookId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      },
    )
    const data = await response.json().catch(() => ({}))
    setUpdatingStatusId(null)
    if (!response.ok) {
      setErrorText(data.message || 'Failed to update webhook status.')
      return
    }
    await loadWebhooks()
  }

  const runTest = async (webhook) => {
    const webhookEvents = webhook.events || []
    let totalDelivered = 0
    let totalFailed = 0
    const allDeliveries = []

    for (const event of webhookEvents) {
      let url
      if (event === WEBHOOK_EVENT_LEAD_CREATED) {
        url = `/api/teams/${team.id}/bots/${bot.id}/webhooks/deliver-lead`
      } else if (event === WEBHOOK_EVENT_DEEP_RESEARCH_DONE) {
        url = `/api/teams/${team.id}/bots/${bot.id}/webhooks/deliver-research`
      } else if (event === WEBHOOK_EVENT_CONVERSATION_ESCALATED) {
        url = `/api/teams/${team.id}/bots/${bot.id}/webhooks/deliver-escalated`
      } else if (event === WEBHOOK_EVENT_CONVERSATION_RATED) {
        url = `/api/teams/${team.id}/bots/${bot.id}/webhooks/deliver-rated`
      } else {
        url = null
      }

      if (!url) continue

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: webhook.id }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setErrorText(data.message || 'Failed to send test webhook event.')
        return
      }

      totalDelivered += data.delivered ?? 0
      totalFailed += data.failed ?? 0
      if (Array.isArray(data.deliveries)) {
        allDeliveries.push(
          ...data.deliveries.map((d) => ({ ...d, event })),
        )
      }
    }

    await loadWebhooks()
    setTestResult({
      delivered: totalDelivered,
      failed: totalFailed,
      deliveries: allDeliveries,
    })
  }

  return (
    <DashboardWrap
      page="Bots"
      title={[bot.name, 'Webhooks']}
      team={team}
      fullWidth={true}
    >
      <Alert title={errorText} type="warning" />

      <div className="mb-4">
        <Link
          href={`/app/bots/${bot.id}`}
          className="text-md flex items-center font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon
            className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400"
            aria-hidden="true"
          />
          Back
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8 xl:items-start">
          <div
            className={
              bot.signatureKey
                ? 'min-w-0 xl:col-span-2'
                : 'min-w-0 xl:col-span-3'
            }
          >
            <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
            <p className="mt-2 text-sm text-gray-600">
              Create REST hook subscriptions for bot events such as lead creation
              and deep research completion. Compatible with Zapier, Make, and any
              HTTP endpoint. See the{' '}
              <Link
                href="/documentation/developer/webhooks-api"
                className="text-cyan-600 underline hover:text-cyan-800"
              >
                Webhooks API documentation
              </Link>{' '}
              for details.
            </p>
          </div>
          {bot.signatureKey && (
            <div className="mt-4 xl:mt-0 xl:col-span-1">
              <label className="block text-sm font-medium text-gray-700">
                Signing key
              </label>
              <div className="relative mt-1 flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 min-w-[240px]">
                <span className="flex select-none items-center pl-3 text-xs text-gray-500">
                  {copiedSigningKey ? 'Copied!' : 'Key'}
                </span>
                <input
                  type="text"
                  readOnly
                  value={bot.signatureKey}
                  className="block flex-1 overflow-hidden border-0 bg-transparent py-2 pl-1 pr-10 text-xs text-gray-900 focus:ring-0 sm:leading-6"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
                  onClick={() => {
                    navigator.clipboard.writeText(bot.signatureKey)
                    setCopiedSigningKey(true)
                    setTimeout(() => setCopiedSigningKey(false), 2000)
                  }}
                  disabled={copiedSigningKey}
                >
                  <ClipboardDocumentIcon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Copy signing key</span>
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Optional but recommended: use this key to verify webhook
                signatures (HMAC-SHA256 of the raw body) and ensure requests
                originate from DocsBot. See the{' '}
                <Link
                  href="/documentation/developer/webhooks-api"
                  className="text-cyan-600 underline hover:text-cyan-800"
                >
                  documentation
                </Link>{' '}
                for verification examples.
              </p>
            </div>
          )}
        </div>

        <hr className="my-6 border-gray-200" />

        <form
          onSubmit={createWebhook}
          className="grid grid-cols-1 gap-3 md:grid-cols-3"
        >
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label (optional)"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="url"
            required
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://your-server.com/webhook"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm md:col-span-2"
          />
          <fieldset className="md:col-span-3">
            <legend className="sr-only">Events</legend>
            <div className="space-y-5">
              <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      id="lead-created"
                      type="checkbox"
                      aria-describedby="lead-created-description"
                      checked={events.includes(WEBHOOK_EVENT_LEAD_CREATED)}
                      onChange={(e) => {
                        setEvents((prev) =>
                          e.target.checked
                            ? [...new Set([...prev, WEBHOOK_EVENT_LEAD_CREATED])]
                            : prev.filter(
                                (item) => item !== WEBHOOK_EVENT_LEAD_CREATED,
                              ),
                        )
                      }}
                      className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-cyan-600 checked:bg-cyan-600 checked:text-cyan-600 indeterminate:border-cyan-600 indeterminate:bg-cyan-600 indeterminate:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:checked]:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:indeterminate]:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="lead-created"
                    className="font-medium text-gray-900"
                  >
                    lead.created
                  </label>{' '}
                  <span
                    id="lead-created-description"
                    className="text-gray-500"
                  >
                    <span className="sr-only">lead.created </span>Fired when a
                    new lead is captured from a conversation. Configure in{' '}
                    <Link
                      href={`/app/bots/${bot.id}/widget`}
                      className="text-cyan-600 underline hover:text-cyan-800"
                    >
                      widget settings
                    </Link>
                    .
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      id="deep-research-done"
                      type="checkbox"
                      aria-describedby="deep-research-done-description"
                      checked={events.includes(
                        WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
                      )}
                      onChange={(e) => {
                        setEvents((prev) =>
                          e.target.checked
                            ? [
                                ...new Set([
                                  ...prev,
                                  WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
                                ]),
                              ]
                            : prev.filter(
                                (item) =>
                                  item !== WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
                              ),
                        )
                      }}
                      className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-cyan-600 checked:bg-cyan-600 checked:text-cyan-600 indeterminate:border-cyan-600 indeterminate:bg-cyan-600 indeterminate:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:checked]:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:indeterminate]:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="deep-research-done"
                    className="font-medium text-gray-900"
                  >
                    deep_research.done
                  </label>{' '}
                  <span
                    id="deep-research-done-description"
                    className="text-gray-500"
                  >
                    <span className="sr-only">deep_research.done </span>Fired
                    when a deep research job completes.
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      id="conversation-escalated"
                      type="checkbox"
                      aria-describedby="conversation-escalated-description"
                      checked={events.includes(
                        WEBHOOK_EVENT_CONVERSATION_ESCALATED,
                      )}
                      onChange={(e) => {
                        setEvents((prev) =>
                          e.target.checked
                            ? [
                                ...new Set([
                                  ...prev,
                                  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
                                ]),
                              ]
                            : prev.filter(
                                (item) =>
                                  item !== WEBHOOK_EVENT_CONVERSATION_ESCALATED,
                              ),
                        )
                      }}
                      className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-cyan-600 checked:bg-cyan-600 checked:text-cyan-600 indeterminate:border-cyan-600 indeterminate:bg-cyan-600 indeterminate:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:checked]:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:indeterminate]:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="conversation-escalated"
                    className="font-medium text-gray-900"
                  >
                    conversation.escalated
                  </label>{' '}
                  <span
                    id="conversation-escalated-description"
                    className="text-gray-500"
                  >
                    <span className="sr-only">conversation.escalated </span>Fired
                    when a conversation is escalated.
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 shrink-0 items-center">
                  <div className="group grid size-4 grid-cols-1">
                    <input
                      id="conversation-rated"
                      type="checkbox"
                      aria-describedby="conversation-rated-description"
                      checked={events.includes(
                        WEBHOOK_EVENT_CONVERSATION_RATED,
                      )}
                      onChange={(e) => {
                        setEvents((prev) =>
                          e.target.checked
                            ? [
                                ...new Set([
                                  ...prev,
                                  WEBHOOK_EVENT_CONVERSATION_RATED,
                                ]),
                              ]
                            : prev.filter(
                                (item) =>
                                  item !== WEBHOOK_EVENT_CONVERSATION_RATED,
                              ),
                        )
                      }}
                      className="col-start-1 row-start-1 appearance-none rounded border border-gray-300 bg-white checked:border-cyan-600 checked:bg-cyan-600 checked:text-cyan-600 indeterminate:border-cyan-600 indeterminate:bg-cyan-600 indeterminate:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                    />
                    <svg
                      fill="none"
                      viewBox="0 0 14 14"
                      className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-[:disabled]:stroke-gray-950/25"
                    >
                      <path
                        d="M3 8L6 11L11 3.5"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:checked]:opacity-100"
                      />
                      <path
                        d="M3 7H11"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-0 group-has-[:indeterminate]:opacity-100"
                      />
                    </svg>
                  </div>
                </div>
                <div className="text-sm/6">
                  <label
                    htmlFor="conversation-rated"
                    className="font-medium text-gray-900"
                  >
                    conversation.rated
                  </label>{' '}
                  <span
                    id="conversation-rated-description"
                    className="text-gray-500"
                  >
                    <span className="sr-only">conversation.rated </span>Fired
                    when a conversation answer is rated.
                  </span>
                </div>
              </div>
            </div>
          </fieldset>

          <div className="flex justify-end md:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting || events.length === 0}
              className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
            >
              {isSubmitting ? 'Creating…' : 'Create webhook'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Label
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Target URL
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Events
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Last delivery
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {webhooks.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-sm text-gray-500"
                >
                  No webhooks configured.
                </td>
              </tr>
            ) : (
              webhooks.map((webhook) => (
                <tr key={webhook.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {webhook.label || '—'}
                  </td>
                  <td className="break-all px-4 py-3 text-sm text-gray-700">
                    {webhook.targetUrl}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {(webhook.events || []).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {webhook.status === 'active' && (
                      <span className="inline-flex items-center gap-1.5 text-green-700">
                        <CheckCircleIcon className="h-5 w-5" aria-hidden />
                        active
                      </span>
                    )}
                    {webhook.status === 'paused' && (
                      <span className="inline-flex items-center gap-1.5 text-amber-700">
                        <PauseCircleIcon className="h-5 w-5" aria-hidden />
                        paused
                      </span>
                    )}
                    {webhook.status !== 'active' &&
                      webhook.status !== 'paused' && (
                        <span className="inline-flex items-center gap-1.5 text-gray-500">
                          <XCircleIcon className="h-5 w-5" aria-hidden />
                          {webhook.status || '—'}
                        </span>
                      )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {webhook.lastTriggeredAt || 'Never'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => runTest(webhook)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Test
                      </button>
                      {webhook.status === 'active' ? (
                        <Tooltip
                          content={
                            updatingStatusId === webhook.id
                              ? 'Pausing…'
                              : 'Pause webhook delivery'
                          }
                          placement="top"
                        >
                          <button
                            onClick={() =>
                              updateWebhookStatus(webhook.id, 'paused')
                            }
                            disabled={updatingStatusId === webhook.id}
                            className="rounded-md border border-amber-300 px-2.5 py-1.5 text-amber-600 hover:bg-amber-50 disabled:opacity-50"
                            aria-label="Pause webhook delivery"
                          >
                            <PauseCircleIcon className="h-4 w-4" aria-hidden />
                          </button>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          content={
                            updatingStatusId === webhook.id
                              ? 'Resuming…'
                              : 'Resume webhook delivery'
                          }
                          placement="top"
                        >
                          <button
                            onClick={() =>
                              updateWebhookStatus(webhook.id, 'active')
                            }
                            disabled={updatingStatusId === webhook.id}
                            className="rounded-md border border-green-300 px-2.5 py-1.5 text-green-600 hover:bg-green-50 disabled:opacity-50"
                            aria-label="Resume webhook delivery"
                          >
                            <PlayCircleIcon className="h-4 w-4" aria-hidden />
                          </button>
                        </Tooltip>
                      )}
                      <button
                        onClick={() => deleteWebhook(webhook.id)}
                        className="rounded-md border border-red-300 px-2.5 py-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Delete webhook"
                      >
                        <TrashIcon className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Transition.Root show={!!testResult} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => setTestResult(null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
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
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                  <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                    <div className="flex items-start justify-between">
                      <Dialog.Title className="text-lg font-semibold text-gray-900">
                        Webhook test result
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        onClick={() => setTestResult(null)}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-4 space-y-3">
                      <p className="text-sm text-gray-600">
                        Success: {testResult?.delivered ?? 0}, Failed:{' '}
                        {testResult?.failed ?? 0}
                      </p>
                      {testResult?.failed > 0 &&
                        testResult?.deliveries
                          ?.filter((d) => !d.ok)
                          ?.map((d, i) => (
                            <div
                              key={i}
                              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm"
                            >
                              <p className="font-medium text-red-800">
                                {d.targetUrl}
                              </p>
                              <p className="mt-1 text-red-700">
                                Response:{' '}
                                {d.status != null ? (
                                  <span className="font-mono font-semibold">
                                    {d.status}
                                  </span>
                                ) : (
                                  <span className="italic">
                                    {d.response || 'Connection error'}
                                  </span>
                                )}
                              </p>
                              {d.response &&
                                d.status != null &&
                                d.response.trim() && (
                                  <p className="mt-1 truncate text-red-600">
                                    {d.response}
                                  </p>
                                )}
                            </div>
                          ))}
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                    <button
                      type="button"
                      className="inline-flex w-full justify-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                      onClick={() => setTestResult(null)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params

  if (data?.props?.team) {
    data.props.bot = await getBot(data.props.team.id, botId)
    if (!data.props.bot) {
      return { notFound: true }
    }

    if (
      !canUserManageIntegrations(
        data.props.team,
        data.props.userId,
        data.props.bot,
      )
    ) {
      return { notFound: true }
    }
  }

  if (data?.props?.team) {
    // getBot returns webhooks as map; page expects array
    data.props.preWebhooks = Object.values(data.props.bot.webhooks || {})
  }

  return data
}

export default WebhooksPage
