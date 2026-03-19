import { useState } from 'react'
import * as cookie from 'cookie'
import { NextSeo } from 'next-seo'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import PilotTrialActivation from '@/components/PilotTrialActivation'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { canUserManageBilling } from '@/utils/function.utils'
import { verifyDemoTrialToken } from '@/lib/demoTrialToken'

function Activate({ team, canManageBilling }) {
  const [errorText, setErrorText] = useState(null)

  return (
    <>
      <NextSeo
        title="Activate Pilot - DocsBot"
        description="Unlock your 14-day Business plan pilot."
        noindex={true}
      />
      <DashboardWrap page="Activate Pilot" team={team}>
        <div className="mx-auto flex min-h-[calc(100dvh-11rem)] max-w-5xl flex-col justify-center">
          <Alert title={errorText} type="error" />
          {!canManageBilling && (
            <Alert
              type="error"
              title="Only the team owner or billing manager can start this trial."
            />
          )}

          <PilotTrialActivation
            team={team}
            canManageBilling={canManageBilling}
            setErrorText={setErrorText}
          />
        </div>
      </DashboardWrap>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  if (data?.redirect) {
    return data
  }

  const cookies = cookie.parse(context.req?.headers?.cookie || '')
  const demoCode = cookies['docsbot_demo_trial']
  const demoTrial = demoCode ? verifyDemoTrialToken(demoCode) : null

  if (!demoTrial) {
    return {
      redirect: {
        destination: '/app',
        permanent: false,
      },
    }
  }

  if (data?.props?.team) {
    const team = data.props.team
    if (team.stripeCustomerId) {
      return {
        redirect: {
          destination: '/app/account',
          permanent: false,
        },
      }
    }

    data.props.canManageBilling = canUserManageBilling(team, data.props.userId)
  }

  return data
}

export default Activate
