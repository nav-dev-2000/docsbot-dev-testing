import React, {
  Fragment,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import {
  LinkIcon,
  DocumentTextIcon,
  ArrowPathIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import clsx from 'clsx'
import FieldToggle from '@/components/FieldToggle'
import SegmentedControl from '@/components/new-dashboard/SegmentedControl'

function faviconUrl(displayUrl) {
  try {
    const href = /^https?:\/\//i.test(displayUrl)
      ? displayUrl
      : `https://${displayUrl}`
    const host = new URL(href).hostname.replace(/^www\./i, '')
    if (!host) return ''
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=16`
  } catch {
    return ''
  }
}

function sourceFaviconUrl(source) {
  if (!source?.url) {
    return ''
  }

  return faviconUrl(source.url)
}

const BotSearch = ({
  team,
  bot,
  setErrorText,
  fullWidth = false,
  onResultsChange,
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchSize] = useState(32)
  const [searchData, setSearchData] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [previewMode, setPreviewMode] = useState('preview')
  const [fullFileMode, setFullFileMode] = useState('preview')
  const [fullFileData, setFullFileData] = useState('')
  const [fullFileLoading, setFullFileLoading] = useState(false)
  const [fullFileError, setFullFileError] = useState('')
  const [isFullFileOpen, setIsFullFileOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]
  const [useGlossary, setUseGlossary] = useState(true)
  const textareaRef = useRef(null)
  const resultsListRef = useRef(null)
  const fullFileRequestRef = useRef(0)
  const selectedCardData = selectedIndex >= 0 ? searchData[selectedIndex] : null

  useEffect(() => {
    onResultsChange?.(searchData.length > 0)
  }, [onResultsChange, searchData.length])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [searchInput])

  useEffect(() => {
    if (!searchData.length || selectedIndex < 0) return
    if (document.activeElement !== textareaRef.current) return

    const focusResults = window.setTimeout(() => {
      textareaRef.current?.blur()
      resultsListRef.current?.focus()
    }, 0)

    return () => window.clearTimeout(focusResults)
  }, [searchData.length, selectedIndex])

  const SourceIcon = ({ source }) => {
    const SourceGlyph = source?.url ? LinkIcon : DocumentTextIcon
    const sourceFavicon = sourceFaviconUrl(source)

    if (sourceFavicon) {
      return (
        <img
          src={sourceFavicon}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 flex-none rounded-sm"
        />
      )
    }

    return <SourceGlyph className="h-4 w-4 flex-none" />
  }

  const selectChunk = useCallback(
    (index) => {
      if (!searchData.length) return
      const nextIndex = Math.min(Math.max(index, 0), searchData.length - 1)
      setSelectedIndex(nextIndex)
    },
    [searchData.length],
  )

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!searchData.length) return

      const target = event.target
      const tagName = target?.tagName?.toLowerCase()
      const isEditingText =
        tagName === 'input' ||
        tagName === 'textarea' ||
        target?.isContentEditable

      if (isEditingText || isFullFileOpen) {
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        selectChunk(selectedIndex < 0 ? 0 : selectedIndex + 1)
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        selectChunk(selectedIndex < 0 ? 0 : selectedIndex - 1)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullFileOpen, searchData.length, selectChunk, selectedIndex])

  const resetSearch = () => {
    fullFileRequestRef.current += 1
    setSearchInput('')
    setSearchData([])
    setSelectedIndex(-1)
    setFullFileData('')
    setFullFileLoading(false)
    setFullFileError('')
    setIsFullFileOpen(false)
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    fullFileRequestRef.current += 1
    setLoading(true)
    setSelectedIndex(-1)
    setFullFileData('')
    setFullFileLoading(false)
    setFullFileError('')
    setIsFullFileOpen(false)
    if (searchInput.trim().length) {
      const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/search`
      const searchPayload = {
        query: searchInput,
        top_k: searchSize,
        use_glossary: useGlossary,
      }
      const headers = {
        'Content-Type': 'application/json',
      }
      if (bot.privacy === 'private') {
        headers['Authorization'] = 'Bearer ' + bot.signature
      }

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(searchPayload),
        })

        if (response.ok) {
          const data = await response.json()
          // API returns { sources: [...] }; accept array or object with sources
          const items = Array.isArray(data) ? data : (data?.sources ?? [])
          setSearchData(items)
          setSelectedIndex(items.length ? 0 : -1)
          if (items.length) {
            requestAnimationFrame(() => {
              textareaRef.current?.blur()
              resultsListRef.current?.focus()
            })
          }
          setErrorText('')
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData?.error ||
              `Error ${response.status}: ${response.statusText}`,
          )
        }
      } catch (error) {
        console.error('Fetch error:', error)
        setErrorText(
          'Network error. Please check your connection and try again.',
        )
      } finally {
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }

  const openFullFile = async (item = selectedCardData) => {
    const fileId = item?.fileId
    if (!fileId) return

    const requestId = fullFileRequestRef.current + 1
    fullFileRequestRef.current = requestId
    setIsFullFileOpen(true)
    setFullFileMode('preview')
    setFullFileData('')
    setFullFileError('')
    setFullFileLoading(true)

    const apiUrl = `${process.env.NEXT_PUBLIC_BOT_API_URL}/teams/${team.id}/bots/${bot.id}/fetch`
    const headers = {
      'Content-Type': 'application/json',
    }
    if (bot.privacy === 'private') {
      headers['Authorization'] = 'Bearer ' + bot.signature
    }

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileId }),
      })

      if (fullFileRequestRef.current !== requestId) {
        return
      }

      if (response.ok) {
        const data = await response.json()
        setFullFileData(data)
      } else {
        const errorData = await response.json().catch(() => null)
        setFullFileError(
          errorData?.error ||
            `Error ${response.status}: ${response.statusText}`,
        )
      }
    } catch (error) {
      if (fullFileRequestRef.current !== requestId) {
        return
      }
      console.error('Fetch document error:', error)
      setFullFileError('Network error. Could not load the full file.')
    } finally {
      if (fullFileRequestRef.current === requestId) {
        setFullFileLoading(false)
      }
    }
  }

  const renderContent = (content, mode) => {
    if (mode === 'markdown') {
      return (
        <pre className="whitespace-pre-wrap break-words bg-gray-950 p-4 font-mono text-xs leading-6 text-gray-100">
          {content || ''}
        </pre>
      )
    }

    return (
      <Streamdown
        mode="static"
        isAnimating={false}
        remarkPlugins={streamdownRemarkPlugins}
      >
        {preprocessMath(content || '')}
      </Streamdown>
    )
  }

  const SearchLimitDivider = ({ children }) => (
    <li role="presentation" className="bg-white px-4 py-3 sm:px-5">
      <div className="relative flex items-center">
        <div className="h-px flex-1 bg-cyan-300" />
        <span className="mx-3 rounded-full border border-cyan-300 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
          {children}
        </span>
        <div className="h-px flex-1 bg-cyan-300" />
      </div>
    </li>
  )

  return (
    <>
      <div className={clsx('space-y-6', fullWidth ? '' : 'mx-auto max-w-5xl')}>
        <form className="w-full" onSubmit={handleSearch}>
          <div className="w-full rounded-md sm:flex sm:shadow-sm">
            <div className="relative flex w-full flex-grow items-end shadow-sm sm:shadow-inherit">
              <textarea
                ref={textareaRef}
                name="searchInput"
                id="searchInput"
                value={searchInput}
                maxLength={2000}
                minLength={2}
                required
                rows={1}
                onChange={(event) => setSearchInput(event.target.value)}
                onKeyDown={(e) => {
                  if (e.isComposing || e.keyCode === 229) {
                    return
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    if (e.shiftKey) {
                      setSearchInput((prevQuestion) => `${prevQuestion}\n`)
                    } else if (!e.shiftKey && !loading) {
                      handleSearch(e)
                    }
                  }
                }}
                tabIndex={1}
                autoComplete="off"
                className="block max-h-48 w-full resize-none rounded-md border border-gray-200 py-4 pl-2 pr-10 text-lg outline-none placeholder:text-gray-400 focus:border-none focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50 sm:py-2 sm:pl-4 sm:pr-12 sm:text-lg"
                placeholder="Enter a question"
              />

              <button
                type="submit"
                tabIndex={2}
                disabled={loading}
                className="absolute right-0 my-3 mr-2 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
              >
                <span className="sr-only">Search training documentation</span>
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative w-5">
                      <div className="h-5 w-5 rounded-full border border-teal-400"></div>
                      <div className="absolute left-0 top-0 h-5 w-5 animate-spin rounded-full border-t-2 border-cyan-600"></div>
                    </div>
                  </div>
                ) : (
                  <MagnifyingGlassIcon className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="w-36">
              <FieldToggle
                label="Use Glossary"
                enabled={useGlossary}
                setEnabled={setUseGlossary}
              />
            </div>
            <div className="flex items-center text-xs text-gray-500">
              <span>Use Shift + Enter to skip to a new line.</span>
              {searchInput && (
                <button
                  type="button"
                  className="mx-1 flex items-center text-gray-600 hover:text-cyan-700 focus:outline-none focus:ring-1 focus:ring-offset-2"
                  onClick={resetSearch}
                >
                  <ArrowPathIcon
                    className="mr-0.5 h-3 w-3"
                    aria-hidden="true"
                  />
                  Reset
                </button>
              )}
            </div>
          </div>
        </form>

        {searchData.length ? (
          <div className="grid min-h-[520px] grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <section className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5">
              <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">
                      Relevant chunks
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Ranked by semantic and keyword relevance descending
                    </p>
                  </div>
                  <div className="inline-flex w-[104px] shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    <ArrowsUpDownIcon className="h-3.5 w-3.5" />
                    Arrow keys
                  </div>
                </div>
              </div>
              <ul
                ref={resultsListRef}
                role="listbox"
                aria-label="Search result chunks"
                className="max-h-[640px] divide-y divide-gray-100 overflow-y-auto outline-none"
                tabIndex={0}
              >
                {searchData.map((item, index) => (
                  <Fragment key={index}>
                    <li role="option" aria-selected={selectedIndex === index}>
                      <button
                        type="button"
                        onClick={() => selectChunk(index)}
                        className={clsx(
                          'flex w-full gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5',
                          selectedIndex === index
                            ? 'bg-cyan-50/70 ring-1 ring-inset ring-cyan-200'
                            : '',
                        )}
                      >
                        <div
                          className={clsx(
                            'flex h-7 w-7 flex-none items-center justify-center rounded-md text-xs font-semibold',
                            selectedIndex === index
                              ? 'bg-cyan-600 text-white'
                              : 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {index + 1}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <SourceIcon source={item} />
                            <p className="truncate text-sm font-semibold leading-6 text-gray-900">
                              {item.title || 'Untitled source'}
                            </p>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                            {item?.page ? <span>Page {item.page}</span> : null}
                          </div>
                          {item.content ? (
                            <p className="mt-2 line-clamp-3 text-xs leading-5 text-gray-600">
                              {item.content}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    </li>
                    {index === 5 && searchData.length > 6 ? (
                      <SearchLimitDivider>
                        Default search limit
                      </SearchLimitDivider>
                    ) : null}
                    {index === 15 && searchData.length > 16 ? (
                      <SearchLimitDivider>
                        Context boost limit
                      </SearchLimitDivider>
                    ) : null}
                  </Fragment>
                ))}
              </ul>
            </section>

            <section className="min-w-0 rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5 lg:sticky lg:top-6 lg:self-start">
              <div className="border-b border-gray-100 px-4 py-4 sm:px-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                    <span>Chunk {selectedIndex + 1}</span>
                    {selectedCardData?.page ? (
                      <span>Page {selectedCardData.page}</span>
                    ) : null}
                  </div>
                  <SegmentedControl
                    value={previewMode}
                    onChange={setPreviewMode}
                    className="!p-px"
                    buttonClassName="!px-2 !py-1 !text-[11px] !leading-4"
                    options={[
                      { value: 'preview', label: 'Preview' },
                      { value: 'markdown', label: 'Markdown' },
                    ]}
                  />
                </div>
                <div className="mt-2 flex min-w-0 items-center gap-2">
                  <SourceIcon source={selectedCardData} />
                  <h3 className="truncate text-base font-semibold text-gray-900">
                    {selectedCardData?.title || 'Untitled source'}
                  </h3>
                </div>
                <div className="mt-1 flex min-w-0 flex-wrap items-center justify-between gap-2">
                  {selectedCardData?.url ? (
                    <Link
                      href={selectedCardData.url}
                      target="_blank"
                      className="min-w-0 flex-1 truncate text-xs text-cyan-700 hover:underline"
                    >
                      {selectedCardData.url}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1" />
                  )}
                  {selectedCardData?.fileId ? (
                    <button
                      type="button"
                      onClick={() => openFullFile()}
                      className="shrink-0 rounded-md bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-cyan-700"
                    >
                      Open full file
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="px-4 py-4 sm:px-5">
                <div
                  className={clsx(
                    'max-h-[560px] overflow-y-auto rounded-lg text-sm leading-6 text-gray-700',
                    previewMode === 'markdown'
                      ? 'bg-gray-950'
                      : 'border border-gray-100 bg-white p-4',
                  )}
                >
                  {renderContent(selectedCardData?.content || '', previewMode)}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </div>

      <Transition.Root show={isFullFileOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-modal"
          onClose={setIsFullFileOpen}
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

          <div className="fixed inset-0 z-modal overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="flex max-h-[90vh] w-full max-w-5xl transform flex-col overflow-hidden rounded-xl bg-white text-left shadow-xl transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
                    <div className="min-w-0">
                      <Dialog.Title className="truncate text-base font-semibold text-gray-900">
                        {fullFileData?.title ||
                          selectedCardData?.title ||
                          'Full file'}
                      </Dialog.Title>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        {fullFileData?.page ? (
                          <span>Page {fullFileData.page}</span>
                        ) : null}
                        {fullFileData?.url || selectedCardData?.url ? (
                          <Link
                            href={fullFileData?.url || selectedCardData?.url}
                            target="_blank"
                            className="max-w-md truncate text-cyan-700 hover:underline"
                          >
                            {fullFileData?.url || selectedCardData?.url}
                          </Link>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <SegmentedControl
                        value={fullFileMode}
                        onChange={setFullFileMode}
                        className="!p-px"
                        buttonClassName="!px-2 !py-1 !text-[11px] !leading-4"
                        options={[
                          { value: 'preview', label: 'Preview' },
                          { value: 'markdown', label: 'Markdown' },
                        ]}
                      />
                      <button
                        type="button"
                        className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        onClick={() => setIsFullFileOpen(false)}
                      >
                        <span className="sr-only">Close full file preview</span>
                        <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto p-5">
                    {fullFileLoading ? (
                      <div className="flex min-h-[280px] items-center justify-center text-sm text-gray-500">
                        Loading full file...
                      </div>
                    ) : fullFileError ? (
                      <div className="rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
                        {fullFileError}
                      </div>
                    ) : (
                      <div className="text-sm leading-6 text-gray-700">
                        {renderContent(
                          fullFileData?.content || '',
                          fullFileMode,
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

export default BotSearch
