import { useRouter } from 'next/router'
import { useState, useEffect, useRef } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getQuestions } from '@/lib/dbQueries'
import TableQuestions from '@/components/TableQuestions'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

function Questions({ team, bot, preQuestions }) {
  const [questions, setQuestions] = useState(preQuestions)
  const [errorText, setErrorText] = useState(null)
  const [isProcessing, setIsProcessing] = useState(true)
  const router = useRouter()
  const { botId } = router.query

  async function changePage(page, ipFilter) {
    let urlParams = ['teams', team.id, 'bots', botId, 'questions?page=' + page + ((ipFilter !== null) ? ('&filter=' + ipFilter) : '')]

    let path = '/api/' + urlParams.join('/')
    console.log(path)
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

  if (!bot) return null

  const title = [ bot.name, 'Questions']

  return (
    <DashboardWrap page="Bots" title={title} team={team}>
      <Alert title={errorText} type="warning" />

      <TableQuestions questions={questions} changePage={changePage} />
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

  data.props.preQuestions = await getQuestions(data.props.team.id, botId)

  return data
}

export default Questions
