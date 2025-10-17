import { useEffect, useState } from 'react'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { isSuperAdmin } from '@/utils/helpers'

export default function SourceFailed({
  team,
  bot,
  sources,
  deleteSource,
  retrySource,
  refreshSourceWithCrawlerJS,
}) {
  const [fullSources, setFullSources] = useState([])
  const [user] = useAuthState(auth)

  useEffect(() => {
    const newSources = []
    sources.map((source) => {
      source.icon = sourceArg(source.type, 'icon')
      source.name = sourceArg(source.type, 'title')
      if (source.status === 'failed' && !source.refreshing) {
        console.log(source)
        newSources.push(source)
      }
    })
    setFullSources(newSources)
  }, [sources])

  const sourceArg = (type, arg) => {
    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)
    return sourceType[arg] || null
  }

  const Source = ({ source }) => {

    return (
      <Alert
        key={source.id}
        type="warning"
        title={source.name + ': ' + (source.error || 'Unknown error')}
        onClose={() => source.type !== 'qa' && deleteSource(source.id)}
      >
        <div className="mb-2 w-full flex-1 text-sm whitespace-normal">
          <p className="break-all whitespace-pre-wrap text-xs text-gray-600">{source.title}</p>
          <p className="break-all whitespace-pre-wrap text-xs text-gray-500">{source.url}</p>
        </div>
        {source.warnsList?.length > 0 && (
          <>
            <h2 className="mt-6 pb-2 text-sm font-medium text-gray-600">
              Warnings:
            </h2>
            <div className="rounded-md border-2 border-solid border-slate-200 bg-slate-100">
              <pre className="whitespace-pre-wrap p-2 font-mono text-sm text-orange-600">
                {source.warnsList.join('\n')}
              </pre>
            </div>
          </>
        )}
        {source.type === 'youtube' && (
          <div className="mt-2 text-xs italic text-red-900">
            Note: YouTube's scraping protections sometimes prevent us from
            fetching a transcript. We are working on making this more reliable.
            Please try again.
          </div>
        )}
        
        {source.type !== 'youtube' && !source?.carbonId && (
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <button
              className="flex items-center text-gray-400 hover:text-gray-600 focus:text-gray-500"
              type="button"
              onClick={(e) => {
                e.preventDefault()
                retrySource(source.id)
              }}
            >
              <ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Retry
            </button>
            {refreshSourceWithCrawlerJS &&
              isSuperAdmin(user?.uid) &&
              ['urls', 'sitemap'].includes(source.type) &&
              !source.crawlerJS && (
                <button
                  className="inline-flex items-center text-cyan-600 hover:text-cyan-700 focus:text-cyan-700"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    refreshSourceWithCrawlerJS(source.id)
                  }}
                >
                  <ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" />
                  Refresh with JavaScript
                </button>
              )}
          </div>
        )}
      </Alert>
    )
  }

  //if no sources, show empty state
  if (!fullSources || fullSources.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="mt-8 text-xl font-semibold text-gray-800">
        Indexing Errors
      </h2>

      {fullSources.map((source) => (
        <Source source={source} key={source.id} />
      ))}
    </div>
  )
}
