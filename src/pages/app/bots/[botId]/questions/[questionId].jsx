import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getBot, getQuestions, getQuestion } from '@/lib/dbQueries'

import Questions from './index'

function OpenQuestion({ team, bot, preQuestions, openQuestion }) {
    return <Questions team={team} bot={bot} preQuestions={preQuestions} openQuestion={openQuestion} />
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId, questionId } = context.params

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
    data.props.openQuestion = await getQuestion(data.props.team.id, botId, questionId)
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

export default OpenQuestion
