import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getSources, getTeamIntegrations } from '@/lib/dbQueries'
import BotCard from '@/components/BotCard'
import SourceForm from '@/components/SourceForm'
import SourceGrid from '@/components/SourceGrid'
import SourceFailed from '@/components/SourceFailed'
import Link from 'next/link'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalPrompt from '@/components/ModalPrompt'

const sourcePerPage = 60

function Bot({ team, preBot, preSources, autoOpenSourceId, integrations }) {
  const [sources, setSources] = useState(preSources?.sources)
  const [paginationData, setPaginationData] = useState(preSources?.pagination)
  const [page, setPage] = useState(preSources?.pagination?.page || 0)
  const [perPage] = useState(sourcePerPage)
  const [bot, setBot] = useState(preBot)
  const [errorText, setErrorText] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const [autoOpenSourceIdState, setAutoOpenSourceIdState] =
    useState(autoOpenSourceId)
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPromptModal, setShowPromptModal] = useState(false)
  const router = useRouter()
  const { botId } = router.query

  const getExpirationAlert = () => {
    if (checkPlanPermission(team, 'hobby').allowed) {
      return null
    }

    const createdAt = new Date(bot.createdAt)
    const expirationDate = new Date(
      createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
    ) // 30 days from creation
    const now = new Date()
    const daysLeft = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) {
      return {
        title:
          'This free bot has expired and will be deleted shortly. All source data, logs, analytics, and settings will be lost. Upgrade to a paid plan to keep your bot.',
        type: 'warning',
      }
    }

    return {
      title: `This free bot will expire in ${daysLeft} days. All source data, logs, analytics, and settings will be lost. Upgrade to a paid plan to keep your bot.`,
      type: 'warning',
    }
  }

  const expirationAlert = getExpirationAlert()

  async function refreshBot() {
    const urlParams = ['teams', team.id, 'bots', botId]
    let path = '/api/' + urlParams.join('/')
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setBot(data)
      setErrorText('')
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  async function refreshSources() {
    const urlParams = ['teams', team.id, 'bots', botId, 'sources']
    let path = '/api/' + urlParams.join('/') + `?page=${page}&limit=${perPage}`
    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setSources((prevSources) =>
        data.sources.map((source) => {
          const existing = prevSources?.find((s) => s.id === source.id) || {}
          return { ...existing, ...source }
        }),
      )
      setPaginationData(data.pagination)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const handleChangePage = (page) => {
    setPage(page)
  }

  useEffect(() => {
    refreshSources()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  //restart polling when sources change
  useEffect(() => {
    let interval = null
    if (bot) {
      if (isProcessing && !interval) {
        clearInterval(interval)
        interval = setInterval(() => {
          refreshBot()
          refreshSources()
        }, 10000)
      }
      if (!isProcessing && interval) {
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [isProcessing])

  useEffect(() => {
    //set processing if there are any sources with status 'indexing'
    if (
      sources.some((source) =>
        ['pending', 'indexing', 'processing'].includes(source.status),
      )
    ) {
      setIsProcessing(true)
    } else {
      setIsProcessing(false)
    }

    refreshBot()
  }, [sources])

  const deleteSource = async (id) => {
    setErrorText('')
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/sources/${id}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (response.ok) {
      const data = await response.json()
      setSources((prev) => prev.filter((source) => source.id !== id))
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const retrySource = async (id) => {
    setErrorText('')
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/sources/${id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    )
    if (response.ok) {
      const data = await response.json()
      setSources((prev) =>
        prev.map((source) => (source.id === id ? data : source)),
      )
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const refreshSourceWithCrawlerJS = async (id) => {
    setErrorText('')
    const response = await fetch(
      `/api/teams/${team.id}/bots/${bot.id}/sources/${id}/reingest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crawlerJS: true }),
      },
    )

    if (response.ok) {
      let data = {}
      try {
        data = await response.json()
      } catch (e) {
        data = {}
      }

      setSources((prev) =>
        prev.map((source) =>
          source.id === id
            ? {
                ...source,
                status: 'pending',
                refreshing: true,
                crawlerJS: true,
                scheduled:
                  data?.newScheduled !== undefined
                    ? data.newScheduled
                    : source.scheduled ?? null,
              }
            : source,
        ),
      )
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  if (!bot) return null

  return (
    <DashboardWrap page="Bots" title={bot.name} team={team}>
      <Alert title={errorText} type="warning" />
      {expirationAlert && (
        <Alert title={expirationAlert.title} type={expirationAlert.type}>
          <button
            onClick={() => setShowCheckout(true)}
            className="mt-2 inline-flex items-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800 ring-2 ring-inset ring-yellow-600 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Upgrade Now
          </button>
        </Alert>
      )}
      {!bot.isAgent && (
        <Alert
          title="Agent Mode is here!"
          type="info"
          dismissKey="agent-mode-landing"
        >
          When ready, you can enable our new{' '}
          <Link
            href={`/app/bots/${botId}/widget#agent-mode`}
            className="text-blue-600 underline hover:text-blue-500"
          >
            Agentic mode
          </Link>
          , which provides more intelligent and contextual responses, tool
          calling to perform actions, conversaton view, and so much more! When
          enabling,{' '}
          <strong>
            <button
              type="button"
              onClick={() => setShowPromptModal(true)}
              className="text-blue-600 underline hover:text-blue-500"
            >
              set your agent instructions
            </button>{' '}
            and please test!
          </strong>{' '}
          Start with a preset role and adjust, then update or remove any
          instructions that may conflict.
        </Alert>
      )}
      <ModalCheckout
        team={team}
        open={showCheckout}
        setOpen={setShowCheckout}
      />
      <ModalPrompt
        team={team}
        integrations={integrations}
        bot={bot}
        open={showPromptModal}
        setOpen={setShowPromptModal}
      />
      <div className="mb-4 flex justify-start">
        <Link
          href={`/app/bots`}
          className="text-md flex items-center font-medium text-gray-500 hover:text-gray-700"
        >
          <ChevronLeftIcon
            className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400"
            aria-hidden="true"
          />
          Back
        </Link>
      </div>

      <BotCard
        team={team}
        bot={bot}
        integrations={integrations}
        setBot={setBot}
      />
      <SourceFailed
        {...{ team, bot, sources, deleteSource, retrySource }}
        refreshSourceWithCrawlerJS={refreshSourceWithCrawlerJS}
      />

      <SourceGrid
        {...{
          team,
          bot,
          sources,
          setSources,
          autoOpenSourceId: autoOpenSourceIdState,
          paginationData,
          handleChangePage,
          retrySource,
        }}
      />

      <SourceForm
        {...{
          team,
          bot,
          sources,
          setSources,
          setOpenSourceID: setAutoOpenSourceIdState,
        }}
      />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params
  const { sourceId } = context.query

  if (data?.props?.team) {
    data.props.preBot = await getBot(data.props.team.id, botId)
    //return 404 if bot doesn't exist
    if (!data.props.preBot) {
      return {
        notFound: true,
      }
    }

    data.props.preSources = await getSources(
      data.props.team.id,
      data.props.preBot,
      0,
      sourcePerPage,
    )
    data.props.integrations = await getTeamIntegrations(data.props.team.id)
    data.props.autoOpenSourceId = sourceId ? sourceId : null
  }

  return data
}

export default Bot
