import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getQuestions } from '@/lib/dbQueries'
import TableQuestions from '@/components/TableQuestions'
import { ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import LoadingSpinner from '@/components/LoadingSpinner'
import Link from 'next/link'
import ModalExport from '@/components/ModalExport';

function Questions({ team, bot, preQuestions }) {
  const [exportOpen, setExportOpen] = useState(false)
  const [questions, setQuestions] = useState(preQuestions)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const { botId } = router.query

  async function changePage(page, ipFilter) {
    const urlParams = [
      'teams',
      team.id,
      'bots',
      botId,
      'questions?page=' +
        page +
        (ipFilter !== null && ipFilter !== undefined ? '&filter=' + ipFilter : ''),
    ]
    const path = '/api/' + urlParams.join('/')

    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setQuestions(data)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const downloadLogs = async () => {
    if (isProcessing) {
      return
    }
    setIsProcessing(true)

    // ask api to generate logs
    const apiUrl = `/api/teams/${team.id}/bots/${botId}/export-log`
    try {
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      })
      if (response.ok) {
        // we get a signed url back
        const { url } = await response.json()
        var link = document.createElement('a')
        link.href = url
        link.click()
        link.remove()

        setInfoText('Successfully exported logs! Your download should start soon.')
      } else {
        setErrorText('Something went wrong, please try again.')
      }
    } catch (e) {
      console.warn(e)
      setErrorText('Something went wrong, please try again.')
    }
    setIsProcessing(false)
  }
  

  if (!bot) return null

  const title = [bot.name, 'Questions']

  return (
    <DashboardWrap page="Bots" title={title} team={team}>
      <Alert title={errorText} type="warning" />
      
      <div className="mb-4 flex justify-between">
        <button
          onClick={() => setExportOpen((prev) => !prev)}
          type="button"
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
        >
          Export Logs
        </button>

        <Link
          href={`/app/bots/${bot.id}/reports`}
          className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChartBarIcon className="mr-2 h-5 w-5 text-gray-400" aria-hidden="true" />
          Reports
        </Link>
      </div>
      <ModalExport team={team} bot={bot} open={exportOpen} setOpen={setExportOpen} />

      <TableQuestions
        team={team}
        questions={questions}
        setQuestions={setQuestions}
        botId={botId}
        changePage={changePage}
      />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params

  if (data?.props?.team) {
    data.props.bot = await getBot(data.props.team.id, botId)
    //return 404 if bot doesn't exist
    if (!data.props.bot) {
      return {
        notFound: true,
      }
    }
  }

  if (data?.props?.team) {
    data.props.preQuestions = await getQuestions(data.props.team, botId)
  } else {
    data.props = data.props || {}
    data.props.preQuestions = {
      pagination: {
        perPage: 50,
        page: 0,
        viewableCount: 0,
        totalCount: 0,
        hasMorePages: false,
        planLimit: 10,
      },
      questions: [],
    }
  }

  return data
}

export default Questions
