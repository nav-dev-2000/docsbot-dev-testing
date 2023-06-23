import { useState, useEffect, useRef } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot } from '@/lib/dbQueries'
import BotHistory from '@/components/BotHistory'

function Reports({ team, bot }) {
  const [errorText, setErrorText] = useState(null)
  const [infoText, setInfoText] = useState(null)

  if (!bot) return null

  const title = [ bot.name, 'Reports']

  return (
    <DashboardWrap page="Bots" title={title} team={team}>
      <Alert title={infoText} type="info" />
      <Alert title={errorText} type="warning" />
      
      <BotHistory team={team} botId={bot.id} />

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

  return data
}

export default Reports
