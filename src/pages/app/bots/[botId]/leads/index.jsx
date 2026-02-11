import { useRouter } from 'next/router'
import { useState } from 'react'
import Link from 'next/link'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBot, getLeads } from '@/lib/dbQueries'
import TableLeads from '@/components/TableLeads'
import { canUserViewBot } from '@/utils/function.utils'

const buildParams = (dateRange) => {
  if (!dateRange?.startDate || !dateRange?.endDate) {
    return ''
  }

  const startDate = new Date(dateRange.startDate)
  const endDate = new Date(dateRange.endDate)

  // Use local day boundaries so "Today" and "Yesterday" match user intent.
  startDate.setHours(0, 0, 0, 0)
  endDate.setHours(23, 59, 59, 999)

  const params = new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })

  return params.toString()
}

function Leads({ team, bot, preLeads }) {
  const [leads, setLeads] = useState(preLeads)
  const [errorText, setErrorText] = useState(null)
  const router = useRouter()
  const { botId } = router.query

  async function changePage(page, dateRange) {
    setErrorText(null)
    const perPage = leads?.pagination?.perPage ?? 50
    const params = buildParams(dateRange)
    const path = `/api/teams/${team.id}/bots/${botId}/leads?page=${page}&perPage=${perPage}${
      params ? `&${params}` : ''
    }`

    const response = await fetch(path, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const data = await response.json()
      setLeads(data)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (error) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  if (!bot) return null

  const title = [bot.name, 'Leads']

  return (
    <DashboardWrap page="Bots" title={title} team={team} fullWidth={true}>
      <Alert title={errorText} type="warning" />

      <TableLeads
        team={team}
        bot={bot}
        leads={leads}
        changePage={changePage}
        buildParams={buildParams}
        setErrorText={setErrorText}
      />

      <div className="mt-6">
        <Link
          href={`/app/bots/${bot.id}/webhooks`}
          className="text-sm text-cyan-700 hover:text-cyan-900"
        >
          Configure webhooks for lead notifications →
        </Link>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  const { botId } = context.params

  if (data?.props?.team) {
    data.props.bot = await getBot(data.props.team.id, botId)
    if (!data.props.bot) {
      return {
        notFound: true,
      }
    }

    if (!canUserViewBot(data.props.team, data.props.bot, data.props.userId)) {
      return {
        notFound: true,
      }
    }
  }

  if (data?.props?.team) {
    data.props.preLeads = await getLeads(data.props.team, botId)
  } else {
    data.props = data.props || {}
    data.props.preLeads = {
      pagination: {
        perPage: 50,
        page: 0,
        viewableCount: 0,
        totalCount: 0,
        hasMorePages: false,
        planLimit: 10,
      },
      leads: [],
    }
  }

  return data
}

export default Leads
