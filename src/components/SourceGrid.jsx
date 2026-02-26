import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import BadgeStatusSource from '@/components/BadgeStatusSource'
import classNames from '@/utils/classNames'
import { ClockIcon } from '@heroicons/react/24/outline'
import Paginator from '@/components/Paginator'

const ModalSource = dynamic(() => import('@/components/ModalSource'), {
  ssr: false,
})

export default function SourceGrid({
  team,
  bot,
  sources,
  setSources,
  autoOpenSourceId = null,
  paginationData,
  handleChangePage,
}) {
  const [fullSources, setFullSources] = useState([])

  const getDisplayTitle = (value) => {
    if (typeof value !== 'string') return ''

    return value.replace(/^undefined(?:\s+|\s*[:-]\s*)?/i, '').trim()
  }

  const sourceArg = (type, arg) => {
    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)
    return sourceType[arg] || null
  }

  useEffect(() => {
    const newSources = []
    sources.map((source) => {
      source.icon = sourceArg(source.type, 'icon')
      source.name = sourceArg(source.type, 'title')
      if (source.status !== 'failed' || source.refreshing) {
        newSources.push(source)
      }
    })
    setFullSources(newSources)
  }, [sources])

  //if no sources, show empty state
  if (!fullSources || fullSources.length === 0) {
    return null
  }

  return (
    <div>
      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Sources</h2>
        <Paginator
          page={paginationData.page}
          totalCount={paginationData.totalCount}
          perPage={paginationData.perPage}
          changePage={handleChangePage}
        />
      </div>
      <ul
        role="list"
        className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3"
      >
        {fullSources.map((source) => {
          const displayTitle = getDisplayTitle(source.title)
          const hasDistinctUrl = source.url && source.url !== displayTitle

          return (
            <ModalSource
              key={source.id}
              team={team}
              bot={bot}
              source={source}
              setSources={setSources}
              defaultOpen={source.id === autoOpenSourceId}
            >
              <li
                key={source.id}
                className="col-span-1 flex h-full rounded-md shadow-sm"
              >
                <div
                  className={classNames(
                    'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-gradient-to-r from-teal-600 to-cyan-700 text-sm font-medium text-white',
                  )}
                >
                  <source.icon
                    className="h-6 w-6 text-cyan-100"
                    aria-hidden="true"
                  />
                </div>
                <div className="relative w-full truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white px-3 py-2 first-letter:truncate">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center text-sm">
                      <p className="font-medium text-gray-900 hover:text-gray-600">
                        {source.name}
                      </p>
                      {source.pageCount ? (
                        <p className="ml-2 text-xs text-gray-500">
                          {source.pageCount} Source pages
                        </p>
                      ) : null}
                    </div>
                  </div>
                  {source.status !== 'ready' && (
                    <div className="absolute right-2 top-2">
                      <BadgeStatusSource source={source} small={true} />
                    </div>
                  )}
                  <div className="flex-1 truncate text-sm">
                    {displayTitle && (
                      <p className="truncate text-xs text-gray-600">
                        {displayTitle}
                      </p>
                    )}
                    {hasDistinctUrl && (
                      <p className="truncate text-xs text-gray-500">
                        {source.url}
                      </p>
                    )}
                  </div>
                  {source.scheduled && source.status === 'ready' && (
                    <ClockIcon
                      className="absolute right-2 top-2 h-3 w-3 text-gray-400"
                      title="Scheduled"
                    />
                  )}
                </div>
              </li>
            </ModalSource>
          )
        })}
      </ul>
      <div className="mt-6 flex items-center justify-center">
        <Paginator
          page={paginationData.page}
          totalCount={paginationData.totalCount}
          perPage={paginationData.perPage}
          changePage={handleChangePage}
        />
      </div>
    </div>
  )
}
