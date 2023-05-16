import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getQuestions } from '@/lib/dbQueries'
import TableQuestions from '@/components/TableQuestions'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

function Questions({ team, bot, preQuestions }) {
  const [questions, setQuestions] = useState(preQuestions)
  const [errorText, setErrorText] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const router = useRouter()
  const { botId } = router.query

  async function changePage(page, ipFilter) {
    const urlParams = ['teams', team.id, 'bots', botId, 'questions?page=' + page + ((ipFilter !== null && ipFilter !== undefined) ? ('&filter=' + ipFilter) : '')]
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
    var link = document.createElement("a");
    link.href = "/api/teams/" + team.id + "/bots/" + botId + "/export-log";
    link.click();
    link.remove();
  }

  if (!bot) return null

  const title = [ bot.name, 'Questions']

  return (
    <DashboardWrap page="Bots" title={title} team={team}>
      <Alert title={errorText} type="warning" />
      <button
        onClick={downloadLogs}
        type="button"
        className="mb-4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
      >
        <ArrowDownTrayIcon className='h-6 w-6 mr-2'/> Export Logs
      </button>

      <TableQuestions team={team} questions={questions} setQuestions={setQuestions} botId={botId} changePage={changePage} />
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
