import { Fragment, useMemo, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  InformationCircleIcon,
  DocumentIcon,
  GlobeAltIcon,
  BookOpenIcon,
  UserIcon,
  UserGroupIcon,
  CommandLineIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import SourceDelete from '@/components/SourceDelete'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import BadgeStatusSource from '@/components/BadgeStatusSource'
import ModalCheckout from '@/components/ModalCheckout'
import ScheduleSelect from '@/components/ScheduleSelect'
import {
  canSourceTypeSchedule,
  canSourceTypeDownload,
  sourceTypes,
  isTrutoSourceType,
} from '@/constants/sourceTypes.constants'
import QAForm from '@/components/QAForm'
import Link from 'next/link'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserModifySources } from '@/utils/function.utils'
import Tooltip from '@/components/Tooltip'
import React from 'react'
import FieldToggle from '@/components/FieldToggle'
import { isSuperAdmin } from '@/utils/helpers'
import { showFilePicker } from '@truto/truto-link-sdk'

export const getTrutoIcon = (icon) => {
  switch (icon) {
    case 'global':
      return GlobeAltIcon
    case 'knowledge_base':
      return BookOpenIcon
    case 'personal':
      return UserIcon
    case 'collaboration':
      return UserGroupIcon
    default:
      return DocumentIcon
  }
}

export default function ModalSource({
  team,
  bot,
  source,
  setSources,
  children,
  defaultOpen = false,
}) {
  const [open, setOpen] = useState(defaultOpen)
  const [toDelete, setToDelete] = useState(null)
  const [infoText, setInfoText] = useState(null)
  const [errorText, setErrorText] = useState(null)
  const [scheduleInterval, setScheduleInterval] = useState(
    source?.scheduleInterval ?? 'none',
  )
  const [submitting, setSubmitting] = useState(false)
  const [submittingRefresh, setSubmittingRefresh] = useState(false)
  const [showInterval, setShowInterval] = useState(
    canSourceTypeSchedule(source?.type),
  )
  const [locked, setLocked] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [changed, setChanged] = useState(false)
  const [questions, setQuestions] = useState(source?.faqs ?? [])
  const [qaSearchTerm, setQaSearchTerm] = useState('')
  const [user] = useAuthState(auth)
  const [canModify, setModify] = useState(false)
  const [isSuperAdminUser, setIsSuperAdminUser] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredUrls, setFilteredUrls] = useState(source?.indexedUrls ?? [])
  const [filteredTrutoSelected, setFilteredTrutoSelected] = useState(
    Array.isArray(source?.trutoSelected) ? source?.trutoSelected : [],
  )
  const [crawlerJsEnabled, setCrawlerJsEnabled] = useState(
    !!source?.crawlerJS,
  )
  const [addingFiles, setAddingFiles] = useState(false)
  const trutoIntegrationType = useMemo(
    () => isTrutoSourceType(source?.type),
    [source?.type],
  )
  const originalScheduleInterval = source?.scheduleInterval ?? 'none'
  const canToggleCrawlerJs =
    isSuperAdminUser &&
    ['urls', 'sitemap'].includes(source?.type) &&
    !source?.carbonId
  const scheduleChanged = scheduleInterval !== originalScheduleInterval
  const shouldUpdateCrawlerJs =
    canToggleCrawlerJs && crawlerJsEnabled !== !!source?.crawlerJS
  const hasPendingSourceUpdates = scheduleChanged || shouldUpdateCrawlerJs
  const documentSourceMimeTypes = useMemo(() => {
    const documentSource = sourceTypes.find(
      (sourceType) => sourceType.id === 'document',
    )

    if (!documentSource?.fileTypes) return []

    return Array.from(new Set(Object.values(documentSource.fileTypes)))
  }, [])

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserModifySources(team, user.uid, bot))
    setIsSuperAdminUser(isSuperAdmin(user.uid))
  }, [team, user, bot])

  useEffect(() => {
    setCrawlerJsEnabled(!!source?.crawlerJS)
  }, [source?.crawlerJS])

  const fetchSourceDetails = async () => {
    if (source.id) {
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/sources/${source.id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )
      if (response.ok) {
        const sourceData = await response.json()
        setSources((sources) =>
          sources.map((s) => (s.id === sourceData.id ? sourceData : s)),
        )
      }
    }
  }

  //when opening modal, fetch source details
  useEffect(() => {
    if (open) {
      fetchSourceDetails()
    }
  }, [open])

  useEffect(() => {
    setOpen(defaultOpen)
  }, [defaultOpen])

  useEffect(() => {
    setQuestions(source?.faqs ?? [])
  }, [source, source?.faqs])

  const downloadSource = async () => {
    const response = await fetch(
      source?.type == 'qa'
        ? `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/export-qa`
        : `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/download`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (response.ok) {
      // we get a signed url back
      const { url } = await response.json()
      var link = document.createElement('a')
      link.href = url
      link.download = url.substring(url.lastIndexOf('/') + 1).split('?')[0]
      link.target = '_blank'
      link.click()
      link.remove()
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const updateSource = async () => {
    setErrorText('')
    setSubmitting(true)
    if (!hasPendingSourceUpdates) {
      setSubmitting(false)
      return
    }

    let updatedSourceFields = {}
    let updatedScheduled = source?.scheduled ?? null

    if (scheduleChanged) {
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/reingest`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scheduleInterval }),
        },
      )

      if (response.ok) {
        let data = {}
        try {
          data = await response.json()
        } catch (e) {
          data = {}
        }

        updatedSourceFields = {
          ...updatedSourceFields,
          scheduleInterval,
        }

        if (scheduleInterval === 'none') {
          updatedScheduled = null
        } else if (data?.newScheduled !== undefined) {
          updatedScheduled = data.newScheduled
        }
      } else {
        try {
          const data = await response.json()
          if (data.message?.includes('upgrade')) {
            setShowUpgrade(true)
            setScheduleInterval(originalScheduleInterval)
          } else {
            setErrorText(
              data.message || 'Something went wrong, please try again.',
            )
          }
        } catch (e) {
          setErrorText('Error ' + response.status + ', please try again.')
        }
        setSubmitting(false)
        return
      }
    }

    if (shouldUpdateCrawlerJs) {
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/reingest`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ crawlerJS: crawlerJsEnabled }),
        },
      )

      if (response.ok) {
        let data = {}
        try {
          data = await response.json()
        } catch (e) {
          data = {}
        }

        updatedSourceFields = {
          ...updatedSourceFields,
          crawlerJS: crawlerJsEnabled,
          status: 'pending',
          refreshing: true,
        }

        if (data?.newScheduled !== undefined) {
          updatedScheduled = data.newScheduled
        }
      } else {
        try {
          const data = await response.json()
          setErrorText(
            data.message || 'Something went wrong, please try again.',
          )
        } catch (e) {
          setErrorText('Error ' + response.status + ', please try again.')
        }
        setCrawlerJsEnabled(!!source?.crawlerJS)
        setSubmitting(false)
        return
      }
    }

    if (hasPendingSourceUpdates) {
      setSources((sources) =>
        sources.map((s) =>
          s.id === source?.id
            ? {
                ...s,
                ...(scheduleChanged ? { scheduleInterval } : {}),
                ...(scheduleChanged || shouldUpdateCrawlerJs
                  ? { scheduled: updatedScheduled ?? null }
                  : {}),
                ...updatedSourceFields,
              }
            : s,
        ),
      )
    }

    setSubmitting(false)
  }

  const patchSource = async () => {
    if (questions.length === 0) {
      setErrorText('Please add at least one question and answer.')
      return
    }

    // make sure they have content
    for (const q of questions) {
      if (
        !q.question ||
        !q.answer ||
        q.question.length === 0 ||
        q.answer.length === 0
      ) {
        setErrorText('Please fill out all questions and answers.')
        return
      }
    }

    setErrorText('')
    setSubmitting(true)
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/reingest`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ faqs: questions }),
      },
    )
    if (response.ok) {
      const data = await response.json()

      // update source
      setSources((sources) => sources.map((s) => (s.id === data.id ? data : s)))
      setOpen(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setSubmitting(false)
  }

  const getTrutoToken = async () => {
    const urlParams = ['teams', team.id, 'bots', bot.id, 'fetchTrutoToken']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      return data.token
    }
  }

  const getTrutoIntegrationToken = async (accountID) => {
    const urlParams = ['teams', team.id, 'bots', bot.id, 'fetchTrutoToken']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountID,
      }),
    })
    if (response.ok) {
      return await response.json()
    } else {
      console.log(await response.json())
    }
  }

  const refreshSource = async () => {
    setErrorText('')
    setSubmittingRefresh(true)
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/sources/${source?.id}/reingest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (response.ok) {
      const { newScheduled } = await response.json()
      setSources((sources) =>
        sources.map((s) =>
          s.id === source?.id
            ? { ...source, status: 'pending', scheduled: newScheduled || null }
            : s,
        ),
      )
      setOpen(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setSubmittingRefresh(false)
  }

  const openTrutoFilePicker = async () => {
    if (addingFiles || submittingRefresh || submitting || locked !== null) return

    if (!trutoIntegrationType) return

    // Skip if running on server-side
    if (typeof window === 'undefined') {
      return
    }

    setErrorText('')
    const trutoID = source?.trutoIntegrationID

    if (!trutoID) {
      setErrorText('Source integration ID not found. Please refresh the page.')
      return
    }

    try {
      setAddingFiles(true)

      const tokenResponse = await getTrutoIntegrationToken(trutoID)
      if (!tokenResponse?.accountToken) {
        throw new Error('Failed to get integration token')
      }

      const googleDrivePickerConfig =
        trutoIntegrationType === 'google'
          ? {
              //appId: process.env.NEXT_PUBLIC_TRUTO_GOOGLE_APP_ID,
              selectableMimeTypes: Array.from(
                new Set([
                  ...documentSourceMimeTypes,
                  'application/vnd.google-apps.document',
                  'application/vnd.google-apps.spreadsheet',
                  'application/vnd.google-apps.presentation',
                  'application/vnd.google-apps.folder',
                ]),
              ),
              views: [
                {
                  includeFolders: true,
                  selectFolderEnabled: true,
                },
              ],
              truto_upsert_drive_items: true,
            }
          : undefined

      const selectedFiles = await showFilePicker(
        trutoIntegrationType,
        tokenResponse.accountToken,
        googleDrivePickerConfig,
      )

      if (!selectedFiles?.length) {
        throw new Error('No files selected')
      }

      await refreshSource()
    } catch (error) {
      console.error('Truto UI error:', error)
      setErrorText(`Failed to connect: ${error.message || 'Please try again'}`)
    } finally {
      setAddingFiles(false)
    }
  }

  useEffect(() => {
    setLocked(null)
    if (source?.status === 'failed') {
      setErrorText('Refresh Failed: ' + (source?.error || 'Unknown error'))
    } else if (source?.status !== 'ready') {
      setLocked('This source is currently being processed. Please wait.')
    }

    setShowInterval(canSourceTypeSchedule(source?.type))
  }, [source])

  useEffect(() => {
    if (!source?.indexedUrls) return

    const lowercasedTerm = searchTerm.toLowerCase()
    const filtered = source.indexedUrls.filter(
      (item) =>
        (item.title && item.title.toLowerCase().includes(lowercasedTerm)) ||
        (item.source && item.source.toLowerCase().includes(lowercasedTerm)),
    )
    setFilteredUrls(filtered)
  }, [searchTerm, source?.indexedUrls])

  useEffect(() => {
    if (!Array.isArray(source?.trutoSelected)) return

    const lowercasedTerm = searchTerm.toLowerCase()
    const filtered = source.trutoSelected.filter((item) =>
      item.name.toLowerCase().includes(lowercasedTerm),
    )
    setFilteredTrutoSelected(filtered)
  }, [searchTerm, source?.trutoSelected])

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <a
        type="button"
        className="m-0 block cursor-pointer"
        disabled={source?.status !== 'ready'}
        onClick={() => setOpen(true)}
      >
        {children}
      </a>
      <Transition.Root show={open} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-10"
          onClose={() => {
            setOpen(false)
          }}
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
                <Dialog.Panel className="relative flex max-h-[calc(100vh-4rem)] transform flex-col overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-5xl">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:flex">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => {
                        setOpen(false)
                      }}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="flex-grow overflow-y-auto rounded-lg bg-white p-8 shadow">
                    <div className="pb-2">
                      <h3 className="inline-flex text-2xl font-bold">
                        {source?.title ?? source?.url}
                      </h3>
                      <h1 className="flex-end inline-flex pl-2 text-sm font-medium text-gray-500">
                        {
                          sourceTypes.find(
                            (sourceType) => sourceType.id === source?.type,
                          )?.title
                        }
                      </h1>
                    </div>
                    <div className="items-center justify-between text-center sm:flex">
                      {source && <BadgeStatusSource source={source} />}
                      <Tooltip content="A source page is the greater of 5000 processed characters or one document/web page.">
                        <h3 className="flex-end cursor-help text-sm font-medium text-gray-500">
                          {source?.pageCount.toString()} Source pages
                        </h3>
                      </Tooltip>
                      {source?.processedPages?.total && (
                        <Tooltip content="The total number of items (files, tickets, etc) processed from the source.">
                          <h3 className="flex-end cursor-help text-sm font-medium text-gray-500">
                            {source?.processedPages?.total.toString()} Items
                          </h3>
                        </Tooltip>
                      )}
                      {source?.type === 'freescout' && source?.freescoutMonths && (
                        <Tooltip content="Number of months of FreeScout ticket history included.">
                          <h3 className="flex-end cursor-help text-sm font-medium text-gray-500">
                            {source.freescoutMonths} Month{source.freescoutMonths > 1 ? 's' : ''}
                          </h3>
                        </Tooltip>
                      )}
                      {source?.processImages && (
                        <Tooltip
                          content={`Includes AI analysis of images${source.processedImages ? ` (${source.processedImages.processed} processed, ${source.processedImages.skipped} skipped)` : ''}`}
                        >
                          <span className="flex-end cursor-help items-center text-sm font-medium text-gray-500">
                            <PhotoIcon className="ml-2 mr-1 inline-flex h-4 w-4 text-gray-500" />
                            {source?.processedImages?.processed
                              ? `${source.processedImages.processed} `
                              : ''}
                            Images
                          </span>
                        </Tooltip>
                      )}
                      {source?.crawlerJS && (
                        <Tooltip content="Javascript parsing enabled">
                          <CommandLineIcon
                            className="ml-2 mr-1 inline-flex h-4 w-4 text-gray-500"
                            aria-hidden="true"
                          />
                        </Tooltip>
                      )}
                      <h3 className="flex-end text-sm font-medium text-gray-500">
                        {(showInterval ? 'Updated: ' : 'Created: ') +
                          new Date(source?.createdAt).toUTCString()}
                      </h3>
                    </div>
                    <Alert title={errorText} type="warning" />
                    {source?.faqs && (
                      <>
                        <div className="my-4">
                          <label htmlFor="filter-faqs" className="sr-only">
                            Search
                          </label>
                          <div className="relative flex items-center md:max-w-xs">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              id="filter-faqs"
                              name="filter-faqs"
                              type="text"
                              value={qaSearchTerm}
                              onChange={(e) => setQaSearchTerm(e.target.value)}
                              className="block w-full rounded-md border-0 py-1 pl-8 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-xs sm:leading-6"
                              placeholder="Filter questions..."
                            />
                            {qaSearchTerm && (
                              <button
                                onClick={() => setQaSearchTerm('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-2"
                              >
                                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                        <QAForm
                          questions={questions}
                          setQuestions={(v) => {
                            setChanged(true)
                            setQuestions(v)
                          }}
                          canChange={canModify}
                          searchTerm={qaSearchTerm}
                          onClearSearch={() => setQaSearchTerm('')}
                        />
                        <div className="flex flex-shrink-0 items-end justify-end">
                          <button
                            disabled={submitting || !changed || !canModify}
                            onClick={patchSource}
                            className={
                              'ml-4 inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm' +
                              (canModify
                                ? ' bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
                                : ' cursor-not-allowed bg-gray-300')
                            }
                          >
                            {submitting && <LoadingSpinner className="mr-3" />}
                            Save
                          </button>
                        </div>
                      </>
                    )}
                    <Alert title={infoText} type="info" />
                    
                    {canModify && (
                      <SourceDelete
                        team={team}
                        bot={bot}
                        source={toDelete}
                        setToDelete={setToDelete}
                        setErrorText={setErrorText}
                        setSources={setSources}
                      />
                    )}
                    {source?.indexedUrls?.length > 0 && (
                      <>
                        <h2 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                          Indexed Items{' '}
                          <em className="text-sm text-slate-500">
                            ({source?.indexedUrls.length})
                          </em>
                          :
                        </h2>
                        <div className="mb-2">
                          <label htmlFor="search" className="sr-only">
                            Search
                          </label>
                          <div className="relative flex items-center md:max-w-xs">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-2">
                              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              id="filter-results"
                              name="filter-results"
                              type="text"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="block w-full rounded-md border-0 py-1 pl-8 pr-8 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-xs sm:leading-6"
                              placeholder="Filter list..."
                            />
                            {searchTerm && (
                              <button
                                onClick={() => setSearchTerm('')}
                                className="absolute inset-y-0 right-0 flex items-center pr-2"
                              >
                                <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="border-1 max-h-96 overflow-y-scroll rounded-md border-solid border-slate-400 bg-slate-100 p-2">
                          {filteredUrls.length > 0 ? (
                            <ul
                              role="list"
                              className="grid grid-cols-1 gap-2 md:grid-cols-2"
                            >
                              {filteredUrls.map((item, index) => (
                                <li
                                  key={index + item.source}
                                  className="overflow-hidden overflow-ellipsis whitespace-nowrap rounded-md bg-white px-3 py-1 shadow"
                                >
                                  {item.source ? (
                                    <Link
                                      href={item.source}
                                      target="_blank"
                                      className="block w-full overflow-hidden overflow-ellipsis text-xs hover:underline"
                                    >
                                      {item.title}
                                    </Link>
                                  ) : (
                                    <span className="block w-full overflow-hidden overflow-ellipsis text-xs">
                                      {item.title}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="flex items-center justify-center text-center">
                              <span className="text-sm text-gray-500">
                                No results found
                              </span>
                              <button
                                onClick={() => setSearchTerm('')}
                                className="ml-2 text-sm text-cyan-600 hover:text-cyan-700"
                              >
                                <XCircleIcon className="mr-0.5 inline h-3 w-3" />
                                Clear filter
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {source?.carbonId ? (
                      <>
                        <h2 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                          Indexed Files:{' '}
                          <em className="text-sm text-slate-500">
                            {typeof source.carbonFiles === 'number'
                              ? `(${source.carbonFiles})`
                              : Array.isArray(source.carbonFiles)
                                ? `(${source.carbonFiles.length})`
                                : 'Fetching...'}
                          </em>
                        </h2>
                        <div className="mt-2 rounded-md bg-yellow-50 p-3">
                          <div className="flex items-center">
                            <div className="flex-shrink-0">
                              <InformationCircleIcon
                                className="h-5 w-5 text-yellow-400"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="ml-2">
                              <p className="text-sm text-yellow-700">
                                This is a legacy cloud source and can no longer
                                be refreshed or edited. If you delete this
                                source, you will not be able to recreate it!
                                <Link
                                  href="https://docsbot.ai/documentation/doc/carbon-cloud-source-connections-update"
                                  className="ml-1 font-medium text-yellow-700 underline hover:text-yellow-600"
                                >
                                  Learn more &raquo;
                                </Link>
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                    {source?.trutoFiles ? (
                      <>
                        {(!source?.indexedUrls || source.indexedUrls.length === 0) && (
                          <h2 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                            Indexed Items:{' '}
                            <em className="text-sm text-slate-500">
                              ({source.trutoFiles})
                            </em>
                          </h2>
                        )}
                        {Array.isArray(source.trutoSelected) &&
                          source.trutoSelected.length > 0 && (
                            <>
                              <h3 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                                Selected Items:{' '}
                                <em className="text-sm text-slate-500">
                                  ({source.trutoSelected.length})
                                </em>
                              </h3>
                              <div className="border-1 max-h-48 overflow-y-scroll rounded-md border-solid border-slate-400 bg-slate-100 p-2">
                                {filteredTrutoSelected.length > 0 ? (
                                  <ul
                                    role="list"
                                    className="grid grid-cols-1 gap-2 md:grid-cols-2"
                                  >
                                    {filteredTrutoSelected.map(
                                      (item, index) => (
                                        <li
                                          key={index + item.name}
                                          className="flex items-center overflow-hidden overflow-ellipsis whitespace-nowrap rounded-md bg-white py-1 pe-3 ps-1 shadow"
                                        >
                                          {item.icon ? (
                                            item.icon.startsWith('http') ? (
                                              <img
                                                src={item.icon}
                                                alt=""
                                                className="mr-2 h-4 w-4 rounded-sm"
                                                aria-hidden="true"
                                              />
                                            ) : (
                                              <>{React.createElement(getTrutoIcon(item.icon), {
                                                className: 'mr-2 h-4 w-4 text-gray-400'
                                              })}</>
                                            )
                                          ) : (
                                            <DocumentIcon
                                              className="mr-2 h-4 w-4 text-gray-400"
                                              aria-hidden="true"
                                            />
                                          )}
                                          {item.modified ? (
                                            <Tooltip
                                              content={`Last modified: ${new Date(item.modified).toUTCString()}`}
                                            >
                                              <span className="block w-full overflow-hidden overflow-ellipsis text-xs">
                                                {item.name}
                                              </span>
                                            </Tooltip>
                                          ) : (
                                            <span className="block w-full overflow-hidden overflow-ellipsis text-xs">
                                              {item.name}
                                            </span>
                                          )}
                                        </li>
                                      ),
                                    )}
                                  </ul>
                                ) : (
                                  <div className="flex items-center justify-center text-center">
                                    <span className="text-sm text-gray-500">
                                      No results found
                                    </span>
                                    <button
                                      onClick={() => setSearchTerm('')}
                                      className="ml-2 text-sm text-cyan-600 hover:text-cyan-700"
                                    >
                                      <XCircleIcon className="mr-0.5 inline h-3 w-3" />
                                      Clear filter
                                    </button>
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                      </>
                    ) : null}
                    {source?.warnsList?.length > 0 && (
                      <>
                        <h2 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                          Warnings:{' '}
                          <em className="text-sm text-slate-500">
                            ({source?.warnsList?.length})
                          </em>
                        </h2>
                        <div className="max-h-48 overflow-y-scroll rounded-md border-2 border-solid border-slate-200 bg-slate-100">
                          <pre className="whitespace-pre-wrap p-2 font-mono text-xs text-orange-600">
                            {source?.warnsList.join('\n')}
                          </pre>
                        </div>
                        {source.type === 'youtube' && (
                          <div className="mt-2 text-xs italic text-red-900">
                            Note: Not every YouTube video has transcripts
                            available, especially for older/unpopular/unlisted
                            videos.
                          </div>
                        )}
                      </>
                    )}
                    {(showInterval && !source?.carbonId) && (
                      <>
                        <Alert title={locked} type="info" />
                        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                          <div className="flex-1 space-y-4 max-w-xs">
                            <ScheduleSelect
                              team={team}
                              onSelect={setScheduleInterval}
                              defaultSelected={scheduleInterval}
                            />
                            <h1 className="flex-end inline-flex pl-0.5 text-sm font-medium text-gray-500">
                              {source?.scheduled
                                ? 'Refresh scheduled for ' +
                                  new Date(source?.scheduled).toUTCString()
                                : 'This source will not be refreshed.'}
                            </h1>
                          </div>
                          {canToggleCrawlerJs && (
                            <div className="sm:w-64">
                              <FieldToggle
                                label="Enable JS Execution"
                                description="Execute JavaScript on pages for this source (Super Admin only)."
                                enabled={crawlerJsEnabled}
                                setEnabled={setCrawlerJsEnabled}
                                disabled={
                                  submitting ||
                                  submittingRefresh ||
                                  locked !== null
                                }
                              />
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {!toDelete && (
                      <div className="mt-6 flex flex-col-reverse items-end justify-between space-y-0 sm:flex-row sm:space-y-0">
                        <div className="items-middle mt-8 flex flex-shrink-0 justify-end sm:mt-0">
                          {(source?.status === 'ready' ||
                            source?.status === 'failed') && (
                            <button
                              type="button"
                              className={
                                'flex items-center rounded-md bg-white text-sm ' +
                                (canModify
                                  ? ' text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                  : ' cursor-not-allowed text-gray-400')
                              }
                              onClick={() => setToDelete(source)}
                              disabled={!canModify}
                            >
                              <TrashIcon
                                className="mr-1 h-4 w-4"
                                aria-hidden="true"
                              />{' '}
                              Delete
                            </button>
                          )}
                          {source?.type === 'url' && (
                            <Link
                              target="_blank"
                              href={source?.url}
                              className="my-1 ml-4 text-xs text-slate-600 hover:underline"
                            >
                              {source?.url}
                            </Link>
                          )}
                          {(canSourceTypeDownload(source?.type) ||
                            'qa' == source?.type) && (
                            <button
                              type="button"
                              className="ml-2 flex items-center rounded-md bg-white text-sm text-slate-600 hover:text-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                              onClick={downloadSource}
                            >
                              <ArrowDownTrayIcon
                                className="mr-1 h-4 w-4"
                                aria-hidden="true"
                              />{' '}
                              Download
                            </button>
                          )}
                        </div>
                        {showInterval && !source?.carbonId && (
                          <div className="flex flex-shrink-0 items-end justify-end">
                            {trutoIntegrationType === 'google' && (
                              <button
                                type="button"
                                className={
                                  'mr-4 inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium text-gray-600 shadow-sm disabled:opacity-50' +
                                  (canModify
                                    ? ' border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
                                    : ' cursor-not-allowed border-gray-200 bg-gray-300')
                                }
                                onClick={openTrutoFilePicker}
                                disabled={
                                  submitting ||
                                  submittingRefresh ||
                                  locked !== null ||
                                  !canModify ||
                                  addingFiles
                                }
                              >
                                {addingFiles ? (
                                  <LoadingSpinner className="mr-3" />
                                ) : (
                                  <PlusIcon
                                    className="mr-2 h-5 w-5"
                                    aria-hidden="true"
                                  />
                                )}
                                Add files
                              </button>
                            )}
                            <button
                              type="button"
                              className={
                                'inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium text-gray-600 shadow-sm disabled:opacity-50' +
                                ((canModify || submittingRefresh)
                                  ? ' border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
                                  : ' cursor-not-allowed border-gray-200 bg-gray-300')
                              }
                              onClick={refreshSource}
                              disabled={
                                submitting || submittingRefresh || locked !== null || !canModify
                              }
                            >
                              {submittingRefresh ? (
                                <LoadingSpinner className="mr-3" />
                              ) : (
                                <ArrowPathIcon
                                  className="mr-2 h-5 w-5"
                                  aria-hidden="true"
                                />
                              )}
                              Refresh
                            </button>
                            <button
                              disabled={
                                submitting ||
                                submittingRefresh ||
                                locked !== null ||
                                !canModify ||
                                !hasPendingSourceUpdates
                              }
                              onClick={updateSource}
                              className={
                                'ml-4 inline-flex items-center justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500' +
                                (canModify
                                  ? ' bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'
                                  : ' cursor-not-allowed bg-gray-300')
                              }
                            >
                              {submitting && (
                                <LoadingSpinner className="mr-3" />
                              )}
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
