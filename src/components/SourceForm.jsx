'use client'

import { useEffect, useState } from 'react'
import { RadioGroup, Disclosure } from '@headlessui/react'
import { CheckCircleIcon, ChevronUpIcon } from '@heroicons/react/20/solid'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import {
  PlusIcon,
  LinkIcon,
  DocumentArrowUpIcon,
  PaperClipIcon,
  DocumentPlusIcon,
} from '@heroicons/react/24/outline'
import { ref, uploadBytesResumable } from 'firebase/storage'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth, storage } from '@/config/firebase-ui.config'
import { stripePlan, checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import classNames from '@/utils/classNames'
import ScheduleSelect from '@/components/ScheduleSelect'
import QAForm from '@/components/QAForm'
import { canUserModifySources } from '@/utils/function.utils'
import authenticate, { showFilePicker } from '@truto/truto-link-sdk'
import Link from 'next/link'

export default function SourceForm({
  team,
  bot,
  sources,
  setSources,
  setOpenSourceID,
}) {
  const [showForm, setShowForm] = useState(bot.sourceCount === 0) //show form if bot has no sources
  const [selectedSourceType, setSelectedSourceType] = useState(null)
  const [user] = useAuthState(auth)
  // State to store uploaded file
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState(null)
  const [percent, setPercent] = useState(0)
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [urlDescription, setUrlDescription] = useState(null)
  const [scheduleInterval, setScheduleInterval] = useState('none')
  const [questions, setQuestions] = useState([{ question: '', answer: '' }])
  const [canModifySources, setCanModifySources] = useState(() =>
    canUserModifySources(team, user?.uid),
  )
  const [processImages, setProcessImages] = useState(false)
  const [trutoIntegrationID, setTrutoIntegrationID] = useState(null)
  const [trutoFiles, setTrutoFiles] = useState(null)
  // State for URL list (urls source type)
  const [urls, setUrls] = useState([])
  const [urlInput, setUrlInput] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [freescoutKey, setFreescoutKey] = useState('')
  const [freescoutMailbox, setFreescoutMailbox] = useState('')
  const [freescoutMailboxes, setFreescoutMailboxes] = useState([])
  const [freescoutMonths, setFreescoutMonths] = useState(3)
  const [mailboxError, setMailboxError] = useState(null)
  const [loadingMailboxes, setLoadingMailboxes] = useState(false)

  // FreeScout API key validation regex (32 character hex string)
  const isValidFreescoutApiKey = (key) => {
    return /^[a-f0-9]{32}$/i.test(key)
  }

  // Check if all FreeScout fields are valid
  const isFreescoutFormValid = () => {
    return (
      url && 
      isValidURL(url) && 
      freescoutKey && 
      isValidFreescoutApiKey(freescoutKey) && 
      freescoutMailbox && 
      freescoutMonths >= 1 && 
      freescoutMonths <= 12
    )
  }

  useEffect(() => {
    if (showForm && stripePlan(team).pages <= team.pageCount) {
      setShowForm(false)
      setShowUpgrade(true)
    }
  }, [showForm])

  //validate fields
  useEffect(() => {
    if (selectedSourceType) {
      let valid = true
      if (selectedSourceType.fieldUrl === 'required' && !url) {
        valid = false
      }
      if (selectedSourceType.fieldFile === 'required' && !file) {
        valid = false
      }

      // Special validation for urls source type - require either file or urls (but not both)
      if (selectedSourceType.id === 'urls') {
        if (!file && urls.length === 0) {
          valid = false // Neither provided
        }
        if (file && urls.length > 0) {
          valid = false // Both provided - not allowed
        }
      }
      if (selectedSourceType.fieldTitle === 'required' && !title) {
        valid = false
      }

      if (selectedSourceType.fieldQA === 'required') {
        // sanity check faqs
        if (questions.length) {
          if (!Array.isArray(questions)) {
            valid = false
          }

          try {
            questions.forEach((QA) => {
              if (!QA.question || !QA.answer) {
                throw new Error()
              }
            })
          } catch (error) {
            valid = false
          }
        } else {
          valid = false
        }
      }

      if (selectedSourceType.id === 'freescout') {
        // Check if URL is provided and valid
        if (!url || !isValidURL(url)) {
          valid = false
        }
        // Check if API key is provided and valid
        if (!freescoutKey || !isValidFreescoutApiKey(freescoutKey)) {
          valid = false
        }
        // Check if mailbox is selected
        if (!freescoutMailbox) {
          valid = false
        }
        // Check if months is valid
        if (!freescoutMonths || freescoutMonths < 1 || freescoutMonths > 12) {
          valid = false
        }
      }

      setValidated(valid)
    } else {
      setValidated(false)
    }

    if (selectedSourceType?.id === 'rss') {
      setUrlDescription('URL of the RSS feed to learn from.')
    } else if (selectedSourceType?.id === 'sitemap') {
      setUrlDescription('URL of the site to crawl for all discovered sitemaps.')
    } else if (selectedSourceType?.id === 'youtube') {
      setUrlDescription('URL of the YouTube video or playlist.')
    } else if (selectedSourceType?.id === 'freescout') {
      setUrlDescription(
        'Base URL of your FreeScout instance (e.g., https://example.com)',
      )
    } else {
      setUrlDescription('Clickable URL of source link displayed with answers.')
    }
  }, [
    selectedSourceType,
    url,
    file,
    title,
    questions,
    urls,
    freescoutKey,
    freescoutMailbox,
    freescoutMonths,
  ])

  // Reset image processing when not applicable
  useEffect(() => {
    if (
      selectedSourceType?.id === 'document' &&
      !(fileName && /\.(html?|md|zip)$/i.test(fileName))
    ) {
      setProcessImages(false)
    }
  }, [fileName, selectedSourceType])

  useEffect(() => {
    const fetchMailboxes = async () => {
      setLoadingMailboxes(true)
      setMailboxError(null)
      try {
        const params = new URLSearchParams({
          url,
          key: freescoutKey,
        })
        const response = await fetch(
          `/api/freescout/mailboxes?${params.toString()}`,
        )
        if (!response.ok) {
          throw new Error('Request failed')
        }
        const data = await response.json()
        // Handle the new FreeScout response format with _embedded.mailboxes
        const boxes = data?._embedded?.mailboxes || data?.mailboxes || data?.data || []
        setFreescoutMailboxes(boxes)
      } catch (e) {
        setFreescoutMailboxes([])
        if (freescoutKey) {
          setMailboxError('Unable to load mailboxes. Check URL and API key.')
        }
      } finally {
        setLoadingMailboxes(false)
      }
    }
    // Only fetch mailboxes if API key is valid and we have required fields
    if (selectedSourceType?.id === 'freescout' && url && freescoutKey && isValidFreescoutApiKey(freescoutKey)) {
      fetchMailboxes()
    } else {
      setFreescoutMailboxes([])
      if (freescoutKey && !isValidFreescoutApiKey(freescoutKey)) {
        setMailboxError('Invalid API key format. Please enter a valid 32-character hex string.')
      } else if (freescoutKey && !url) {
        setMailboxError('Please enter the FreeScout instance URL.')
      } else if (url && !isValidURL(url)) {
        setMailboxError('Please enter a valid FreeScout instance URL.')
      } else if (freescoutKey && url && isValidFreescoutApiKey(freescoutKey) && !freescoutMailbox) {
        setMailboxError('Please select a mailbox to continue.')
      }
    }
  }, [selectedSourceType, url, freescoutKey])

  const showProcessImagesOption =
    selectedSourceType?.fieldImages &&
    (selectedSourceType.id !== 'document' ||
      (fileName && /\.(html?|md|zip)$/i.test(fileName)))

  const resetState = () => {
    setFile(null)
    setFileName(null)
    setUrl(null)
    setTitle('')
    setSelectedSourceType(null)
    setValidated(false)
    setIsUpdating(false)
    setPercent(0)
    setShowForm(false)
    setScheduleInterval('none')
    setProcessImages(false)
    setTrutoIntegrationID(null)
    setTrutoFiles(null)
    setUrls([])
    setUrlInput('')
    setIsDragOver(false)
    setFreescoutKey('')
    setFreescoutMailbox('')
    setFreescoutMailboxes([])
    setFreescoutMonths(3)
    setMailboxError(null)
    setLoadingMailboxes(false)
  }

  // Helper function to validate and clean URLs
  const isValidURL = (string) => {
    try {
      const url = new URL(string)
      return url.protocol === 'http:' || url.protocol === 'https:'
    } catch (_) {
      return false
    }
  }

  // Function to extract URLs from various formatted text
  const extractUrlsFromText = (text) => {
    // Regex to match URLs (http/https) - exclude common trailing punctuation
    const urlRegex = /https?:\/\/[^\s<>"'{}|\\^`\[\]]+/gi

    // First, try to extract URLs using regex
    const regexMatches = (text.match(urlRegex) || []).map((url) => {
      // Remove common trailing punctuation that shouldn't be part of URLs
      return url.replace(/[)\]}>.,;:!?'"]+$/, '')
    })

    // Also try line-by-line approach for simple lists
    const lines = text
      .split('\n')
      .map((line) => {
        // Remove common formatting:
        // - Bullet points (-, *, •, ◦)
        // - Numbers (1., 2., etc.)
        // - Table separators (| text |)
        // - Markdown links [text](url)
        // - HTML tags
        return line
          .replace(/^[\s]*[-*•◦]\s*/, '') // Remove bullet points
          .replace(/^[\s]*\d+\.\s*/, '') // Remove numbered lists
          .replace(/^\s*\|\s*/, '') // Remove table start
          .replace(/\s*\|\s*$/, '') // Remove table end
          .replace(/\s*\|.*$/, '') // Remove everything after table separator
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$2') // Extract URL from markdown links
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .trim()
      })
      .filter((line) => line.length > 0)

    // Combine both approaches
    const allPotentialUrls = [...regexMatches, ...lines]

    return allPotentialUrls
  }

  // Function to process URLs from text
  const processUrls = (text) => {
    if (!text.trim()) return

    // Extract URLs from various formatted text
    const extractedUrls = extractUrlsFromText(text)

    // Validate and deduplicate URLs
    const validUrls = []
    const seenUrls = new Set(urls) // Include existing URLs for deduplication

    for (const url of extractedUrls) {
      const trimmedUrl = url.trim()
      if (trimmedUrl && isValidURL(trimmedUrl) && !seenUrls.has(trimmedUrl)) {
        validUrls.push(trimmedUrl)
        seenUrls.add(trimmedUrl)
      }
    }

    if (validUrls.length > 0) {
      // Clear file when URLs are added (for urls source type)
      if (selectedSourceType?.id === 'urls' && file) {
        setFile(null)
        setFileName(null)
        setPercent(0)
        setIsUploading(false)
      }

      setUrls((prev) => [...prev, ...validUrls])
      setUrlInput('') // Clear input after successful processing
    }
  }

  // Handle paste events (auto-process)
  const handlePaste = (event) => {
    // Small delay to ensure pasted content is in the textarea
    setTimeout(() => {
      const pastedText = event.target.value
      processUrls(pastedText)
    }, 50)
  }

  // Handle Enter key (manual processing)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault() // Prevent new line
      processUrls(urlInput)
    }
  }

  // Handle regular input changes (just update value)
  const handleInputChange = (event) => {
    setUrlInput(event.target.value)
  }

  // Function to remove a URL from the list
  const removeUrl = (urlToRemove) => {
    setUrls((prev) => prev.filter((url) => url !== urlToRemove))
  }

  async function createSource() {
    if (!validated) {
      // Provide more specific error message for urls source type
      if (selectedSourceType?.id === 'urls') {
        if (file && urls.length > 0) {
          setErrorText('Please use either URL input or file upload, not both.')
        } else if (!file && urls.length === 0) {
          setErrorText('Please provide either URLs or upload a CSV file.')
        } else {
          setErrorText('Please complete required fields.')
        }
      } else {
        setErrorText('Please complete required fields.')
      }
      return
    }
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots', bot.id, 'sources']
    const apiPath = '/api/' + urlParams.join('/')

    // Prepare payload based on the selected source type requirements
    const payload = {
      type: selectedSourceType.id,
    }

    // Only include fields that are required or optional for this source type
    if (selectedSourceType.fieldUrl) {
      payload.url = url
      if (selectedSourceType.id === 'freescout') {
        payload.freescoutUrl = url
      }
    }

    if (selectedSourceType.fieldFile) {
      payload.file = file
      payload.title = fileName
    }

    if (selectedSourceType.fieldTitle) {
      payload.title = title
    }

    if (selectedSourceType.fieldQA) {
      payload.faqs = questions
    }

    if (selectedSourceType.fieldSchedule) {
      payload.scheduleInterval = scheduleInterval
    }

    if (showProcessImagesOption) {
      payload.processImages = processImages
    }

    // Include Truto integration fields if they exist
    if (trutoIntegrationID) {
      payload.trutoIntegrationID = trutoIntegrationID
    }

    if (trutoFiles) {
      payload.trutoFiles = trutoFiles
    }

    // Include urls for urls source type
    if (selectedSourceType.id === 'urls' && urls.length > 0) {
      payload.urls = urls
    }

    if (selectedSourceType.id === 'freescout') {
      payload.freescoutKey = freescoutKey
      payload.freescoutMailbox = freescoutMailbox
      payload.freescoutMonths = freescoutMonths
    }

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (response.ok) {
      const data = await response.json()
      // check if sent source is already in our sources
      //  (this can happen if we added a QA source and we already have a QA source for example)
      const existingSource = sources.find((s) => s.id === data.id)
      if (existingSource) {
        // if so, replace it and open the modal!
        setSources([data, ...sources.filter((s) => s.id !== data.id)])
        // sike, don't open the modal actually
        // setOpenSourceID(data.id)
      } else {
        setSources([data, ...sources])
      }
      resetState()
    } else {
      try {
        const data = await response.json()
        if (data.message.includes('upgrade')) {
          setShowUpgrade(true)
        } else {
          setErrorText(
            data.message || 'Something went wrong, please try again.',
          )
        }
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
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

  useEffect(() => {
    if (trutoIntegrationID && trutoFiles) {
      createSource()
    }
  }, [trutoIntegrationID, trutoFiles])

  const openTrutoUI = async (integrationType) => {
    if (isUpdating) return
    let trutoID = trutoIntegrationID
    setErrorText('')

    try {
      setIsUpdating(true)

      if (!trutoID) {
        const token = await getTrutoToken()
        if (!token) {
          throw new Error('Failed to get authentication token')
        }

        const integration = await authenticate(token, {
          integration: integrationType,
          noBack: true,
        })

        if (!integration?.integrated_account_id) {
          throw new Error('Integration failed - no account ID received')
        }

        console.log('Integration:', integration)
        setTrutoIntegrationID(integration.integrated_account_id)
        trutoID = integration.integrated_account_id
      }

      const tokenResponse = await getTrutoIntegrationToken(trutoID)
      if (!tokenResponse?.accountToken) {
        throw new Error('Failed to get integration token')
      }

      console.log('Token response:', tokenResponse)
      if (tokenResponse?.label) {
        setTitle('Account: ' + tokenResponse.label)
      }

      // Only show file picker for Google Docs
      if (
        integrationType === 'googledrive' ||
        integrationType === 'sharepoint'
      ) {
        const selectedFiles = await showFilePicker(
          integrationType,
          tokenResponse.accountToken,
        )
        if (!selectedFiles?.length) {
          throw new Error('No files selected')
        }

        console.log('Selected files:', selectedFiles)
        setTrutoFiles(selectedFiles.length)
      } else {
        // For other integrations, just set files to 1 and proceed
        setTrutoFiles(1)
      }
    } catch (error) {
      console.error('Truto UI error:', error)
      setErrorText(`Failed to connect: ${error.message || 'Please try again'}`)
      // Reset states on error
      setTrutoIntegrationID(null)
      setTrutoFiles(null)
      setTitle('')
    } finally {
      setIsUpdating(false)
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (file) {
      // Clear URLs when a file is uploaded (for urls source type)
      if (selectedSourceType?.id === 'urls') {
        setUrls([])
        setUrlInput('')
      }

      setPercent(0)
      setIsUploading(true)
      setFileName(file.name)
      if (!title) {
        setTitle(file.name)
      } else {
        setUrl(file.name)
      }

      //upload to firebase cloud storage
      const filepath = `user/${user.uid}/team/${team.id}/bot/${bot.id}/${file.name}`
      const storageRef = ref(storage, filepath)
      const uploadTask = uploadBytesResumable(storageRef, file)

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const percent = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100,
          ) // update progress
          setPercent(percent)
        },
        (err) => () => {
          console.warn(err)
          setErrorText(
            'Error uploading file, please try again. If the problem persists, try logging out then back in again.',
          )
          setIsUploading(false)
          setFileName(null)
        },
        () => {
          setFile(filepath)
          setIsUploading(false)
        },
      )
    }
  }

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      // Use the first file and simulate the file input change event
      const file = droppedFiles[0]

      // Check if file type is acceptable
      const acceptedTypes = Object.values(selectedSourceType?.fileTypes || {})
      if (acceptedTypes.length > 0) {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase()
        const fileType = file.type

        const isValidType = acceptedTypes.some(
          (acceptedType) =>
            fileType === acceptedType ||
            acceptedType === fileExtension ||
            acceptedType.includes(fileExtension),
        )

        if (!isValidType) {
          setErrorText(
            `File type not supported. Please upload: ${Object.keys(selectedSourceType?.fileTypes).join(', ')}`,
          )
          return
        }
      }

      // Create a synthetic event to reuse existing handleFileChange logic
      const syntheticEvent = {
        target: {
          files: [file],
        },
      }
      handleFileChange(syntheticEvent)
    }
  }

  if (showForm) {
    // Get unique categories from sourceTypes, preserving order
    const categories = [
      ...new Set(
        sourceTypes
          .filter((source) => !source.hide)
          .map((source) => source.category),
      ),
    ]

    return (
      <>
        <ModalCheckout
          team={team}
          open={showUpgrade}
          setOpen={setShowUpgrade}
        />
        <p className="text-md mb-2 ml-2 mt-8 text-gray-800">
          Add any{' '}
          <Link
            href="/documentation#sources"
            className="underline hover:text-gray-600"
          >
            content sources
          </Link>{' '}
          you want your bot to be able to answer questions about. You can always
          add more later on.
        </p>
        <div className="mb-4 rounded-lg bg-white px-4 py-4 shadow sm:px-6">
          <Alert title={errorText} type="error" />

          {!selectedSourceType ? (
            <RadioGroup
              value={selectedSourceType}
              onChange={(e) => {
                if (!checkPlanPermission(team, e.minPlan, 'source').allowed) {
                  setShowUpgrade(true)
                  return
                } else {
                  resetState()
                  setSelectedSourceType(e)
                  setShowForm(true)
                  setErrorText('')
                }
              }}
            >
              <RadioGroup.Label className="text-sm font-medium text-gray-700">
                Source types
              </RadioGroup.Label>

              <div className="mt-2 space-y-4">
                {categories.map((category) => {
                  const hasAvailableSource = sourceTypes
                    .filter((sourceType) => sourceType.category === category)
                    .filter((sourceType) => !sourceType.hide)
                    .some((sourceType) => !sourceType.coming)

                  return (
                    <Disclosure key={category} defaultOpen={hasAvailableSource}>
                      {({ open }) => (
                        <>
                          <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-100 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring focus-visible:ring-gray-500 focus-visible:ring-opacity-75">
                            <span>{category}</span>
                            <ChevronUpIcon
                              className={`${
                                open ? '' : 'rotate-180 transform'
                              } h-5 w-5 text-gray-500`}
                            />
                          </Disclosure.Button>
                          <Disclosure.Panel className="px-4 pb-2 pt-4">
                            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4 xl:grid-cols-4">
                              {sourceTypes
                                .filter(
                                  (sourceType) =>
                                    sourceType.category === category,
                                )
                                .filter((sourceType) => !sourceType.hide)
                                .map((sourceType) => (
                                  <RadioGroup.Option
                                    key={sourceType.id}
                                    value={sourceType}
                                    disabled={sourceType.coming || isUpdating}
                                    className={({ checked, active }) =>
                                      classNames(
                                        checked
                                          ? 'border-transparent'
                                          : 'border-gray-300',
                                        active
                                          ? 'border-cyan-500 ring-2 ring-cyan-500'
                                          : '',
                                        'relative flex cursor-pointer rounded-lg border bg-white p-4 shadow-sm focus:outline-none',
                                        sourceType.coming ? 'opacity-50' : '',
                                      )
                                    }
                                  >
                                    {({ checked, active }) => (
                                      <>
                                        <span className="mr-2 flex-shrink-0 items-center">
                                          <sourceType.icon
                                            className="h-6 w-6 text-gray-400"
                                            aria-hidden="true"
                                          />
                                        </span>
                                        <span className="flex flex-1">
                                          <span className="flex flex-col">
                                            <RadioGroup.Label
                                              as="span"
                                              className="block text-sm font-medium text-gray-900"
                                            >
                                              {sourceType.title}
                                              {!sourceType.coming &&
                                              !checkPlanPermission(
                                                team,
                                                sourceType.minPlan,
                                                'source',
                                              ).allowed ? (
                                                <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                                  {
                                                    checkPlanPermission(
                                                      team,
                                                      sourceType.minPlan,
                                                      'source',
                                                    ).requiredPlanLabel
                                                  }
                                                </span>
                                              ) : (
                                                sourceType.isNew && (
                                                  <span className="ml-4 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    New
                                                  </span>
                                                )
                                              )}

                                              {sourceType.coming && (
                                                <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                                  Coming soon
                                                </span>
                                              )}
                                            </RadioGroup.Label>
                                            <RadioGroup.Description
                                              as="span"
                                              className="mt-1 flex items-center text-sm text-gray-500"
                                            >
                                              {sourceType.description}
                                            </RadioGroup.Description>
                                          </span>
                                        </span>
                                        <CheckCircleIcon
                                          className={classNames(
                                            !checked ? 'invisible' : '',
                                            'h-5 w-5 text-cyan-600',
                                          )}
                                          aria-hidden="true"
                                        />
                                        <span
                                          className={classNames(
                                            active ? 'border' : 'border-2',
                                            checked
                                              ? 'border-cyan-500'
                                              : 'border-transparent',
                                            'pointer-events-none absolute -inset-px rounded-lg',
                                          )}
                                          aria-hidden="true"
                                        />
                                      </>
                                    )}
                                  </RadioGroup.Option>
                                ))}
                            </div>
                          </Disclosure.Panel>
                        </>
                      )}
                    </Disclosure>
                  )
                })}
              </div>
            </RadioGroup>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="col text-sm text-gray-600">
                <h3 className="mb-4 inline-flex items-center text-xl font-medium text-gray-800">
                  <selectedSourceType.icon
                    className="mr-2 h-6 w-6 text-gray-400"
                    aria-hidden="true"
                  />
                  {selectedSourceType?.title}
                </h3>
                <p>
                  {selectedSourceType?.fullDescription ||
                    selectedSourceType?.description}
                </p>
                {selectedSourceType?.instructionsUrl && (
                  <Link
                    href={selectedSourceType.instructionsUrl}
                    target="_blank"
                    className="underline"
                  >
                    Learn how to connect to this source
                  </Link>
                )}
                {selectedSourceType?.id === 'google_docs' && (
                  <Alert
                    type="warning"
                    title="Connecting never-before-used Google accounts is temporarily blocked while we await verification from Google for our integration. We apologize for the inconvenience!"
                  />
                )}
                {selectedSourceType?.id === 'csv' && (
                  <a
                    href="/csv-import-template.csv"
                    download={true}
                    className="block underline"
                  >
                    Download CSV template
                  </a>
                )}
                {selectedSourceType?.id === 'document' && (
                  <a
                    href="/infinite-uploads.pdf"
                    download={true}
                    className="block underline"
                  >
                    Download an example PDF document
                  </a>
                )}
                {selectedSourceType?.id === 'urls' && (
                  <a
                    href="/urls-import-template.csv"
                    download={true}
                    className="underline"
                  >
                    Download an example CSV urls file
                  </a>
                )}
              </div>
              <div className="col">
                {selectedSourceType?.fieldUrl && (
                  <div className="mb-4">
                    <div className="flex justify-between">
                      <label
                        htmlFor="url"
                        className="block text-sm font-medium text-gray-700"
                      >
                        {selectedSourceType?.id === 'freescout' ? 'FreeScout Instance URL' : 'Source URL'}
                      </label>
                      <span className="text-sm capitalize text-gray-500">
                        {selectedSourceType.fieldUrl}
                      </span>
                    </div>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <LinkIcon
                          className="h-5 w-5 text-gray-400"
                          aria-hidden="true"
                        />
                      </div>
                      <input
                        type="url"
                        name="url"
                        id="url"
                        value={url}
                        disabled={isUpdating}
                        onChange={(e) => setUrl(e.target.value)}
                        className={`block w-full rounded-md pl-10 focus:ring-cyan-500 sm:text-sm ${
                          selectedSourceType?.id === 'freescout' && url && !isValidURL(url)
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-cyan-500'
                        }`}
                        placeholder={
                          selectedSourceType?.id === 'sitemap'
                            ? 'https://example.com/'
                            : 'https://example.com/page/'
                        }
                        aria-describedby="url-description"
                      />
                    </div>
                    <p
                      className="mt-2 text-sm text-gray-500"
                      id="url-description"
                    >
                      {urlDescription}
                    </p>
                  </div>
                )}
                {selectedSourceType?.id === 'freescout' && (
                  <>
                    <div className="mb-4">
                      <label
                        htmlFor="freescoutKey"
                        className="block text-sm font-medium text-gray-700"
                      >
                        API Key
                      </label>
                      <input
                        type="text"
                        name="freescoutKey"
                        id="freescoutKey"
                        value={freescoutKey}
                        disabled={isUpdating}
                        onChange={(e) => setFreescoutKey(e.target.value)}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-cyan-500 sm:text-sm ${
                          freescoutKey && !isValidFreescoutApiKey(freescoutKey)
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-cyan-500'
                        }`}
                        placeholder="Enter 32-character API key"
                      />
                      {freescoutKey && !isValidFreescoutApiKey(freescoutKey) && (
                        <p className="mt-1 text-sm text-red-500">
                          Invalid API key format. Must be a 32-character hex string.
                        </p>
                      )}
                      {url && (
                        <p className="mt-2 text-sm text-gray-500">
                          You'll need the{' '}
                          <a
                            href="https://freescout.net/module/api-webhooks/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 underline"
                          >
                            API & Webhooks module
                          </a>
                          . Get your API key from{' '}
                          <a
                            href={`${url.replace(/\/api\/?$/, '').replace(/\/$/, '')}/app-settings/apiwebhooks`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 underline"
                          >
                            FreeScout
                          </a>
                          .
                        </p>
                      )}
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="freescoutMailbox"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Mailbox
                      </label>
                      {mailboxError && (
                        <p className="mt-1 text-sm text-red-500">
                          {mailboxError}
                        </p>
                      )}
                      <select
                        id="freescoutMailbox"
                        name="freescoutMailbox"
                        value={freescoutMailbox}
                        disabled={
                          isUpdating ||
                          loadingMailboxes ||
                          freescoutMailboxes.length === 0
                        }
                        onChange={(e) => setFreescoutMailbox(e.target.value)}
                        className={`mt-1 block w-full rounded-md shadow-sm focus:ring-cyan-500 sm:text-sm ${
                          freescoutMailboxes.length > 0 && !freescoutMailbox
                            ? 'border-red-300 focus:border-red-500'
                            : 'border-gray-300 focus:border-cyan-500'
                        }`}
                      >
                        <option value="">
                          {loadingMailboxes ? 'Loading...' : 'Select mailbox'}
                        </option>
                        {freescoutMailboxes.map((mb) => (
                          <option key={mb.id} value={mb.id}>
                            {mb.name} ({mb.email})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label
                        htmlFor="freescoutMonths"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Months to index
                      </label>
                      <input
                        type="number"
                        id="freescoutMonths"
                        name="freescoutMonths"
                        min={1}
                        max={12}
                        value={freescoutMonths}
                        disabled={isUpdating}
                        onChange={(e) =>
                          setFreescoutMonths(parseInt(e.target.value))
                        }
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                      />
                      <p className="mt-2 text-sm text-gray-500">
                        Number of past months of tickets to index (1-12).
                      </p>
                    </div>
                    
                    {/* FreeScout validation summary */}
                    {selectedSourceType?.id === 'freescout' && (
                      <div className="mb-4 rounded-md border p-3">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            {isFreescoutFormValid() ? (
                              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <h3 className={`text-sm font-medium ${isFreescoutFormValid() ? 'text-green-800' : 'text-yellow-800'}`}>
                              {isFreescoutFormValid() ? 'All fields are valid' : 'Please complete all required fields'}
                            </h3>
                            <div className="mt-2 text-sm">
                              <ul className={`list-disc space-y-1 pl-5 ${isFreescoutFormValid() ? 'text-green-700' : 'text-yellow-700'}`}>
                                <li className={url && isValidURL(url) ? 'text-green-600' : 'text-yellow-600'}>
                                  {url && isValidURL(url) ? '✓' : '○'} FreeScout instance URL
                                </li>
                                <li className={freescoutKey && isValidFreescoutApiKey(freescoutKey) ? 'text-green-600' : 'text-yellow-600'}>
                                  {freescoutKey && isValidFreescoutApiKey(freescoutKey) ? '✓' : '○'} Valid API key
                                </li>
                                <li className={freescoutMailbox ? 'text-green-600' : 'text-yellow-600'}>
                                  {freescoutMailbox ? '✓' : '○'} Mailbox selected
                                </li>
                                <li className={freescoutMonths >= 1 && freescoutMonths <= 12 ? 'text-green-600' : 'text-yellow-600'}>
                                  {freescoutMonths >= 1 && freescoutMonths <= 12 ? '✓' : '○'} Months to index (1-12)
                                </li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedSourceType?.fieldTitle && (
                  <div className="mb-4">
                    <div className="flex justify-between">
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Source title
                      </label>
                      <span className="text-sm capitalize text-gray-500">
                        {selectedSourceType.fieldTitle}
                      </span>
                    </div>
                    <div className="mt-1">
                      <input
                        type="text"
                        name="title"
                        id="title"
                        value={title}
                        disabled={isUpdating}
                        onChange={(e) => setTitle(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                        placeholder=""
                        aria-describedby="title-description"
                      />
                    </div>
                    <p
                      className="mt-2 text-sm text-gray-500"
                      id="title-description"
                    >
                      Title of source displayed alongside answers. Defaults to
                      page title or file name.
                    </p>
                  </div>
                )}

                {selectedSourceType?.fieldQA && (
                  <QAForm
                    questions={questions}
                    setQuestions={setQuestions}
                    canChange={true}
                  />
                )}

                {selectedSourceType?.fieldFile && (
                  <div>
                    {/* URL paste functionality for urls source type */}
                    {selectedSourceType.id === 'urls' && (
                      <div className="mb-4">
                        <div className="mb-4">
                          <label
                            htmlFor="url-paste"
                            className="mb-2 block text-sm font-medium text-gray-700"
                          >
                            Paste or type URLs (press Enter to add)
                          </label>
                          <textarea
                            id="url-paste"
                            name="url-paste"
                            rows={2}
                            value={urlInput}
                            onChange={handleInputChange}
                            onPaste={handlePaste}
                            onKeyDown={handleKeyDown}
                            disabled={isUpdating || file}
                            className={classNames(
                              'block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm',
                              file ? 'bg-gray-100 text-gray-400' : '',
                            )}
                            placeholder={
                              file
                                ? 'File upload is being used instead'
                                : `https://example.com/page1
https://example.com/page2`
                            }
                          />
                          <p className="mt-2 text-sm text-gray-500">
                            {file
                              ? 'URL input is disabled while a file is selected.'
                              : 'Paste URLs in any format - plain text, bullet points, numbered lists, tables, or markdown links. URLs will be automatically extracted and duplicates removed. Press Enter to process typed URLs.'}
                          </p>
                        </div>

                        {/* Display current URLs */}
                        {urls.length > 0 && (
                          <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                              URLs to index ({urls.length})
                            </label>
                            <div className="max-h-40 overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-2">
                              {urls.map((url, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between rounded px-2 py-1 hover:bg-gray-100"
                                >
                                  <span className="mr-2 flex-1 truncate text-sm text-gray-700">
                                    {url}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => removeUrl(url)}
                                    disabled={isUpdating}
                                    className="rounded text-red-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                  >
                                    <svg
                                      className="h-4 w-4"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="my-4 flex items-center justify-center">
                          <div className="flex-grow border-t border-gray-300"></div>
                          <span className="mx-4 text-sm text-gray-500">
                            OR upload a CSV file
                          </span>
                          <div className="flex-grow border-t border-gray-300"></div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Source file
                      </label>
                      <span className="text-sm capitalize text-gray-500">
                        {selectedSourceType.fieldFile}
                      </span>
                    </div>
                    {file || isUploading ? (
                      <div className="mt-1">
                        <div
                          className={classNames(
                            file
                              ? 'border-cyan-500 text-cyan-600'
                              : 'border-gray-300 text-gray-500',
                            'flex items-center justify-between rounded-md border-2 bg-gray-50 px-6 py-4 text-lg shadow-sm',
                          )}
                        >
                          <div className="flex items-center">
                            <PaperClipIcon
                              className="mr-4 h-6 w-6"
                              aria-hidden="true"
                            />
                            {fileName}
                          </div>
                          {isUploading && (
                            <p className="flex items-center text-sm">
                              <LoadingSpinner /> Uploading ({percent}%)
                            </p>
                          )}
                          {file && (
                            <CheckCircleIcon
                              className="h-6 w-6"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <label
                        htmlFor="file-upload"
                        className={classNames(
                          'mt-1 flex justify-center rounded-md border-2 border-dashed px-6 pb-6 pt-5 text-center transition-colors duration-200',
                          urls.length > 0
                            ? 'cursor-not-allowed border-gray-200 bg-gray-50'
                            : isDragOver
                              ? 'cursor-pointer border-cyan-600 bg-cyan-50'
                              : 'cursor-pointer border-gray-300 hover:border-gray-400',
                        )}
                        onDragOver={
                          urls.length > 0 ? undefined : handleDragOver
                        }
                        onDragLeave={
                          urls.length > 0 ? undefined : handleDragLeave
                        }
                        onDrop={urls.length > 0 ? undefined : handleDrop}
                      >
                        <div className="space-y-1 text-center">
                          <DocumentArrowUpIcon
                            className={classNames(
                              'mx-auto h-12 w-12 transition-colors duration-200',
                              urls.length > 0
                                ? 'text-gray-200'
                                : isDragOver
                                  ? 'text-cyan-600'
                                  : 'text-gray-300',
                            )}
                            aria-hidden="true"
                          />
                          <div
                            className={classNames(
                              'text-sm transition-colors duration-200',
                              urls.length > 0
                                ? 'text-gray-400'
                                : isDragOver
                                  ? 'text-cyan-700'
                                  : 'text-gray-600',
                            )}
                          >
                            {urls.length > 0
                              ? 'URLs are being used instead'
                              : isDragOver
                                ? 'Drop your file here'
                                : 'Upload your source file or drag & drop'}
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              accept={Object.values(
                                selectedSourceType?.fileTypes,
                              ).join(',')}
                              onChange={handleFileChange}
                              className="sr-only"
                              disabled={
                                isUploading ||
                                file ||
                                isUpdating ||
                                urls.length > 0
                              }
                            />
                          </div>
                          <p
                            className={classNames(
                              'text-xs uppercase transition-colors duration-200',
                              urls.length > 0
                                ? 'text-gray-400'
                                : isDragOver
                                  ? 'text-cyan-600'
                                  : 'text-gray-500',
                            )}
                          >
                            {urls.length > 0
                              ? 'File upload disabled'
                              : Object.keys(selectedSourceType?.fileTypes).join(
                                  ', ',
                                )}
                          </p>
                        </div>
                      </label>
                    )}
                  </div>
                )}
                {selectedSourceType?.fieldSchedule && (
                  <div className="mt-4 justify-start">
                    <ScheduleSelect
                      team={team}
                      onSelect={setScheduleInterval}
                      defaultSelected={scheduleInterval}
                      disabled={isUpdating}
                    />
                    <p
                      className="mt-2 text-sm text-gray-500"
                      id="title-description"
                    >
                      This will automatically refresh the source at the selected
                      interval.
                    </p>
                  </div>
                )}
                {showProcessImagesOption && (
                  <div className="mt-4">
                    <div className="relative flex items-start">
                      <div className="flex h-5 items-center">
                        <input
                          id="process-images"
                          name="process-images"
                          type="checkbox"
                          checked={
                            checkPlanPermission(team, 'pro').allowed
                              ? processImages
                              : false
                          }
                          disabled={isUpdating}
                          onChange={(e) => {
                            if (!checkPlanPermission(team, 'pro').allowed) {
                              setShowUpgrade(true)
                            } else {
                              setProcessImages(e.target.checked)
                            }
                          }}
                          className={`h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 ${!checkPlanPermission(team, 'pro').allowed ? 'cursor-pointer' : 'disabled:opacity-50'}`}
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="process-images"
                          className={`font-medium text-gray-700 ${!checkPlanPermission(team, 'pro').allowed ? 'cursor-pointer hover:text-cyan-600' : ''}`}
                          onClick={(e) => {
                            if (!checkPlanPermission(team, 'pro').allowed) {
                              e.preventDefault()
                              setShowUpgrade(true)
                            }
                          }}
                        >
                          Learn from public images in HTML/Markdown
                          {!checkPlanPermission(team, 'pro').allowed && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                              {
                                checkPlanPermission(team, 'standard')
                                  .requiredPlanLabel
                              }
                            </span>
                          )}
                        </label>
                        <p className="text-sm text-gray-500">
                          Only recommended for documentation pages with
                          screenshots or diagrams. Processing images
                          significantly increases indexing time and source page
                          usage.{' '}
                          <Link
                            target="_blank"
                            href="https://docsbot.ai/documentation/doc/enable-learn-from-public-images-docsbot"
                            className="text-cyan-600 hover:text-cyan-500"
                          >
                            Learn more about image processing
                          </Link>
                          .
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="mb-2 mt-6 flex flex-shrink-0 items-end justify-end">
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              onClick={() => {
                setFile(null)
                if (selectedSourceType) {
                  setSelectedSourceType(null)
                } else {
                  setShowForm(false)
                  setSelectedSourceType(null)
                }
              }}
              disabled={isUpdating}
            >
              Cancel
            </button>

            {selectedSourceType?.isTruto ? (
              <button
                disabled={isUpdating}
                onClick={() => {
                  if (isUpdating) return
                  openTrutoUI(selectedSourceType.isTruto)
                }}
                className="ml-4 inline-flex items-center justify-center space-x-2 rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isUpdating ? (
                  <>
                    <LoadingSpinner className="mr-3" />
                    <span>Adding source...</span>
                  </>
                ) : (
                  <>
                    <selectedSourceType.icon className="h-5 w-5" />
                    <span>Connect to {selectedSourceType?.title}</span>
                  </>
                )}
              </button>
            ) : (
              <button
                disabled={isUpdating || !validated}
                onClick={createSource}
                className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                title={!validated && selectedSourceType?.id === 'freescout' ? 'Please complete all required FreeScout fields' : ''}
              >
                {isUpdating ? (
                  <LoadingSpinner className="mr-3" />
                ) : (
                  <PlusIcon className="-ml-1 mr-2 h-6 w-6" aria-hidden="true" />
                )}
                Add source
              </button>
            )}
          </div>
        </div>
      </>
    )
  } else {
    return (
      <>
        <ModalCheckout
          team={team}
          open={showUpgrade}
          setOpen={setShowUpgrade}
        />
        {canModifySources ? (
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <DocumentPlusIcon
              className="mx-auto h-12 w-12 text-gray-400"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Add source
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Add source content to {bot.name} that you want your bot to be able
              to answer questions about. Don't index the same content multiple
              times.
            </p>
            <div className="mt-8">
              {
                <button
                  className="inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 hover:text-white focus:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 active:text-white"
                  onClick={() => setShowForm(true)}
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Source
                </button>
              }
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-16 max-w-2xl text-center">
            <DocumentPlusIcon
              className="mx-auto h-12 w-12 text-gray-400"
              aria-hidden="true"
            />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Add source
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Ask your team admin for permissions to add sources to this bot.
            </p>
          </div>
        )}
      </>
    )
  }
}
