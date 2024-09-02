import { useEffect, useState } from 'react'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'

export default function SourceFailed({ sources, deleteSource, retrySource }) {
  const [fullSources, setFullSources] = useState([])

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
        <Alert
          key={source.id}
          type="warning"
          title={source.name + ': ' + (source.error || 'Unknown error')}
          onClose={() => deleteSource(source.id)}
        >
          <div className="mb-2 w-full flex-1 text-sm">
            <p className="truncate text-xs text-gray-600">{source.title}</p>
            <p className="truncate text-xs text-gray-500">{source.url}</p>
          </div>
          {source.warnsList?.length > 0 && (
            <>
              <h1 className="mt-6 pb-2 text-sm font-medium text-gray-600">
                Warnings:
              </h1>
              <div className="rounded-md border-2 border-solid border-slate-200 bg-slate-100">
                <pre className="whitespace-pre-wrap p-2 font-mono text-sm text-orange-600">
                  {source.warnsList.join('\n')}
                </pre>
              </div>
            </>
          )}
          {source.type === 'youtube' && (
            <div className="mt-2 text-xs text-red-900 italic">
              Note: YouTube's scraping protections sometimes prevent us from fetching
              a transcript. We are working on making this more reliable.
              Please try again.
            </div>
          )}

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
        </Alert>
      ))}
    </div>
  )
}
