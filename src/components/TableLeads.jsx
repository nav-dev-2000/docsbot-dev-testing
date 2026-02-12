import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ChatBubbleLeftRightIcon,
  FaceFrownIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import Paginator from '@/components/Paginator'
import Tooltip from '@/components/Tooltip'
import LocaleDateTime from '@/components/LocaleDateTime'
import UserAvatar from '@/components/UserAvatar'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserEditBot } from '@/utils/function.utils'

const formatMetadataValue = (value) => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return '[object]'
    }
  }
  return String(value)
}

const formatColumnTitle = (key) => {
  if (!key) return ''
  const normalized = key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalized.replace(/\b\w/g, (char) => char.toUpperCase())
}

const formatTooltipDate = (value) => {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return `${date.toISOString().replace('T', ' ').replace('Z', ' UTC')}`
}

const buildDateTooltip = (createdAt, updatedAt) => {
  const createdLabel = formatTooltipDate(createdAt)
  const updatedLabel = updatedAt ? formatTooltipDate(updatedAt) : null
  if (updatedLabel) {
    return `Created: ${createdLabel}<br/>Updated: ${updatedLabel}`
  }
  return `Created: ${createdLabel}`
}

export default function TableLeads({
  team,
  bot,
  leads,
  dateRange,
  changePage,
  setErrorText,
}) {
  const [isLoading, setIsLoading] = useState(false)
  const [canModify, setCanModify] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [deletingLeadId, setDeletingLeadId] = useState(null)
  const [user] = useAuthState(auth)

  const leadRows = leads?.leads || []
  const pagination = leads?.pagination

  const metadataKeys = useMemo(() => {
    const keys = new Set()
    leadRows.forEach((lead) => {
      if (lead.metadata && typeof lead.metadata === 'object') {
        Object.keys(lead.metadata).forEach((key) => keys.add(key))
      }
    })
    return Array.from(keys)
  }, [leadRows])

  const hasEmailColumn = metadataKeys.includes('email')
  const otherMetadataKeys = metadataKeys
    .filter((key) => key !== 'name' && key !== 'email')
    .sort((a, b) => a.localeCompare(b))

  useEffect(() => {
    if (!team || !user) {
      setCanModify(false)
      return
    }
    setCanModify(canUserEditBot(team, user.uid, bot))
  }, [team, user, bot])

  useEffect(() => {
    if (!team || !bot) return
    const fetchLeads = async () => {
      setIsLoading(true)
      await changePage(0, dateRange)
      setIsLoading(false)
    }
    fetchLeads()
  }, [team, bot, dateRange])

  const deleteLead = async (leadId) => {
    if (!canModify) return
    if (deleteConfirmId !== leadId) {
      setDeleteConfirmId(leadId)
      return
    }

    setDeletingLeadId(leadId)
    setErrorText(null)
    try {
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/leads/${leadId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (response.ok) {
        setDeleteConfirmId(null)
        await changePage(pagination?.page || 0, dateRange)
      } else {
        try {
          const data = await response.json()
          setErrorText(data.message || 'Something went wrong, please try again.')
        } catch (error) {
          setErrorText('Error ' + response.status + ', please try again.')
        }
      }
    } catch (error) {
      setErrorText('Something went wrong, please try again.')
    } finally {
      setDeletingLeadId(null)
    }
  }

  return (
    <>
      <div className="mb-4">
        <div
          className={clsx(
            'flex justify-end',
            isLoading && 'opacity-60',
          )}
        >
          {pagination && (
            <Paginator
              perPage={pagination.perPage}
              totalCount={pagination.viewableCount}
              page={pagination.page}
              changePage={(page) => changePage(page, dateRange)}
            />
          )}
        </div>
      </div>

      <div className="mt-2 flow-root">
        {leadRows.length === 0 ? (
          <div className="my-6 rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
            <FaceFrownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-xl font-semibold text-gray-700">
              No leads found
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Try a different date range to find captured leads.
            </p>
            <div className="mt-4">
              <Link
                href={`/app/bots/${bot.id}/widget`}
                className="inline-flex items-center rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-100"
              >
                Configure Lead Collection Tool
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full py-2 align-middle">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Name
                    </th>
                    {hasEmailColumn && (
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        Email
                      </th>
                    )}
                    {otherMetadataKeys.map((key) => (
                      <th
                        key={key}
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {formatColumnTitle(key)}
                      </th>
                    ))}
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                    >
                      Created At
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-right">
                      <span className="sr-only">Conversation</span>
                    </th>
                    {canModify && (
                      <th scope="col" className="px-3 py-3.5 text-right">
                        <span className="sr-only">Delete</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {leadRows.map((lead) => {
                    const metadata = lead.metadata || {}
                    const nameValue = metadata.name || lead.alias || 'Unknown'
                    const emailValue = metadata.email || '—'
                    const tooltipContent = buildDateTooltip(
                      lead.createdAt,
                      lead.updatedAt,
                    )

                    return (
                      <tr key={lead.id}>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-700">
                          <div className="flex items-center gap-2">
                            <UserAvatar
                              alias={lead.alias || lead.id}
                              email={metadata.email || null}
                              className="h-9 w-9 rounded-full border border-gray-200 bg-white"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-gray-900">
                                {nameValue}
                              </p>
                            </div>
                          </div>
                        </td>
                        {hasEmailColumn && (
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                            {emailValue}
                          </td>
                        )}
                        {otherMetadataKeys.map((key) => {
                          const value = formatMetadataValue(metadata[key])
                          return (
                            <td
                              key={`${lead.id}-${key}`}
                              className="px-3 py-4 text-sm text-gray-600"
                              title={value}
                            >
                              <span className="block max-w-[240px] truncate">
                                {value}
                              </span>
                            </td>
                          )
                        })}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-600">
                          <Tooltip content={tooltipContent}>
                            <span className="inline-flex">
                              {lead.createdAt ? (
                                <LocaleDateTime date={lead.createdAt} />
                              ) : (
                                '—'
                              )}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                          <Tooltip content="View conversation logs">
                            <Link
                              href={`/app/bots/${bot.id}/conversations?conversationId=${lead.id}`}
                              className="inline-flex items-center text-gray-400 hover:text-gray-600"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            </Link>
                          </Tooltip>
                        </td>
                        {canModify && (
                          <td className="whitespace-nowrap px-3 py-4 text-right text-sm">
                            <Tooltip
                              content={
                                deleteConfirmId === lead.id
                                  ? 'Click again to confirm delete'
                                  : 'Delete lead'
                              }
                            >
                              <button
                                type="button"
                                onClick={() => deleteLead(lead.id)}
                                disabled={deletingLeadId === lead.id}
                                className={clsx(
                                  'inline-flex items-center rounded-md p-1',
                                  deleteConfirmId === lead.id
                                    ? 'bg-red-600 text-white ring-2 ring-red-600 ring-offset-2'
                                    : 'text-gray-400 hover:text-red-600',
                                  deletingLeadId === lead.id &&
                                    'cursor-not-allowed opacity-50',
                                )}
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </Tooltip>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
