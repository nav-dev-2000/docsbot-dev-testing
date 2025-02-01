import { useEffect, useState } from 'react'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import { ArrowPathIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { CarbonConnect } from 'carbon-connect'

export default function SourceFailed({
  team,
  bot,
  sources,
  deleteSource,
  retrySource,
}) {
  const [fullSources, setFullSources] = useState([])

  const carbonTokenFetcher = async () => {
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/fetchCarbonTokens`,
    )
    return await response.json()
  }

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
    const [carbonOpen, setCarbonOpen] = useState(false)

    const updateCarbon = async (evnt) => {
      console.log(evnt)

      if (evnt.action === 'UPDATE') {
        await retrySource(source.id)
      }
    }

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
        {source?.isCarbon && (
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
            <CarbonConnect
              tokenFetcher={carbonTokenFetcher}
              orgName="DocsBot AI"
              brandIcon="/.well-known/logo.png"
              primaryBackgroundColor="#0891B2"
              primaryTextColor="#FFFFFF"
              secondaryBackgroundColor="#FFFFFF"
              secondaryTextColor="#0891B2"
              loadingIconColor="#0891B2"
              theme="light"
              onSuccess={updateCarbon}
              onError={(error) => console.warn(error)}
              open={carbonOpen}
              setOpen={setCarbonOpen}
              tags={{ botId: bot.id, teamId: team.id }}
              entryPoint={source.isCarbon[0]}
              useCarbonFilePicker={true}
              prependFilenameToChunks={true}
              openFilesTabTo="FILES_LIST"
              incrementalSync={true}
              enabledIntegrations={[
                {
                  id: source.isCarbon[0],
                  chunkSize: 1500,
                  overlapSize: 50,
                  fileSyncConfig: {
                    split_rows: true,
                    generate_chunks_only: true,
                  },
                  syncFilesOnConnection: false,
                  syncSourceItems: true,
                  useCarbonFilePicker: true,
                  incrementalSync: true,
                  generateChunksOnly: true,
                },
              ]}
            />
            <button
              className="inline-flex items-center justify-center space-x-2 rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              onClick={() => {
                setCarbonOpen(true)
              }}
            >
              <source.icon className="h-5 w-5" />
              <span>Manage files</span>
            </button>
          </>
        )}
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
        
        {source.type !== 'youtube' && (
          <button
            className="mt-4 flex items-center text-gray-400 hover:text-gray-600 focus:text-gray-500"
            type="button"
            onClick={(e) => {
              e.preventDefault()
              retrySource(source.id)
            }}
          >
            <ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Retry
          </button>
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
