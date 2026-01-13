import { useRouter } from 'next/router'
import { useState } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getQuestions } from '@/lib/dbQueries'
import TableQuestions from '@/components/TableQuestions'

const buildParams = (ipFilter, rating, escalated, couldAnswer, dateRange) => {
  const params = []
  if (ipFilter !== null && ipFilter !== undefined) params.push('ip=' + ipFilter)
  if (rating !== null && rating !== undefined) params.push('rating=' + rating)
  if (escalated !== null && escalated !== undefined) params.push('escalated=' + escalated)
  if (couldAnswer !== null && couldAnswer !== undefined) params.push('couldAnswer=' + couldAnswer)
  if (dateRange !== null && dateRange !== undefined) {
    const endDate = new Date(dateRange.endDate)
    endDate.setUTCHours(23, 59, 59, 999)
    params.push(`startDate=${dateRange.startDate.toString()}&endDate=${endDate.toISOString()}`)
  }
  return params.join('&')
}

function Questions({ team, bot, preQuestions, openQuestion=null }) {
  const [questions, setQuestions] = useState(preQuestions)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const { botId } = router.query
  const [searchInput, setSearchInput] = useState('')

  async function changePage(page, ipFilter, rating, escalated, couldAnswer, dateRange, search = '') {
    setErrorText(null)
    let response;

    if (search && search.trim() !== '') {
      const path = `/api/teams/${team.id}/bots/${botId}/questions/search`
      response = await fetch(path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: search,
          topK: 50,
        }),
      })
    } else {
      const urlParams = [
        'teams',
        team.id,
        'bots',
        botId,
        'questions?page=' +
          page + '&' + buildParams(ipFilter, rating, escalated, couldAnswer, dateRange),
      ]
      const path = '/api/' + urlParams.join('/')

      response = await fetch(path, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
    if (response.ok) {
      const data = await response.json()
      // The search API returns the questions and pagination inside a data object or directly
      if (search && search.trim() !== '') {
        setQuestions({
          questions: data.questions,
          pagination: data.pagination
        })
      } else {
        setQuestions(data)
      }
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

  const title = [bot.name, 'Questions']

  return (
    <DashboardWrap page="Bots" title={title} team={team} fullWidth={true}>
      <Alert title={errorText} type="warning" />

      <TableQuestions
        team={team}
        questions={questions}
        setQuestions={setQuestions}
        bot={bot}
        changePage={changePage}
        buildParams={buildParams}
        openQuestion={openQuestion}
        searchInput={searchInput}
        setSearchInput={setSearchInput}  
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
