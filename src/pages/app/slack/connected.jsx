import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { getUserTeams, getBots } from '@/lib/dbQueries'
import DashboardWrap from '@/components/DashboardWrap'
import LoadingSpinner from '@/components/LoadingSpinner'
import SlackLogo from '@/components/SlackLogo'
import Note from '@/components/new-dashboard/Note'
import { canUserModifyTeam } from '@/utils/function.utils'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const ERROR_MESSAGES = {
  access_denied: 'Slack authorization was cancelled.',
  oauth_error: 'Slack returned an error. Please try again from the Slack App Directory.',
  missing_code: 'Invalid request: missing authorization code.',
  exchange_failed: 'Could not complete the connection. Please try installing from Slack again.',
}

function SlackConnected({ userId, team, teamsWithBots }) {
  const router = useRouter()
  const {
    slack_team_id: slackTeamId,
    slack_team_name: slackTeamName,
    slack_enterprise_name: slackEnterpriseName,
    error: errorCode,
  } = router.query

  const [claimingTeamId, setClaimingTeamId] = useState(null)
  const [claimError, setClaimError] = useState(null)
  const [defaultBotByTeamId, setDefaultBotByTeamId] = useState({})

  const handleClaim = async (teamId) => {
    setClaimError(null)
    setClaimingTeamId(teamId)
    const defaultBotId = defaultBotByTeamId[teamId] || null
    try {
      const res = await fetch('/api/slack/oauth/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slack_team_id: slackTeamId, teamId, defaultBotId: defaultBotId || undefined }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Failed to connect')
      // Switch current team so dashboard shows the right team
      await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentTeam: teamId }),
      })
      window.location.href = '/app/api#slack-settings'
    } catch (err) {
      setClaimError(err.message || 'Something went wrong.')
      setClaimingTeamId(null)
    }
  }

  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.oauth_error : null

  return (
    <DashboardWrap page="Slack" title="Connect Slack" team={team}>
      <div className="mx-auto max-w-lg space-y-6">
        {errorMessage && (
          <Note color="red" size="md" className="flex items-start gap-3 leading-normal">
            <ExclamationTriangleIcon className="mt-0.5 h-6 w-6 flex-shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Connection failed</p>
              <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              <Link href="/app/api" className="mt-2 inline-block text-sm font-medium text-red-700 underline hover:text-red-800">
                Go to Integrations
              </Link>
            </div>
          </Note>
        )}

        {!errorCode && !slackTeamId && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
            <p className="text-gray-600">No pending Slack connection. Install the app from your team’s Integrations page.</p>
            <Link href="/app/api#slack-settings" className="mt-4 inline-block text-cyan-600 hover:text-cyan-800 font-medium">
              Go to Integrations
            </Link>
          </div>
        )}

        {!errorCode && slackTeamId && (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-3 mb-4">
              <SlackLogo className="h-10 w-10 flex-shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Connect Slack to a team</h2>
                <p className="text-sm text-gray-600">
                  Connect <strong>{slackTeamName || 'Slack workspace'}</strong>
                  {slackEnterpriseName ? ` (${slackEnterpriseName})` : ''} to one of your teams.
                </p>
              </div>
            </div>
            {claimError && (
              <Note color="red" className="mb-3 leading-normal">
                {claimError}
              </Note>
            )}
            {(teamsWithBots || []).length === 0 ? (
              <p className="text-sm text-gray-600">You don’t have permission to add Slack to any team. Ask a team owner or admin to connect Slack.</p>
            ) : (
              <ul className="space-y-3">
                {(teamsWithBots || [])
                  .slice()
                  .sort((a, b) => (a.team.id === team?.id ? -1 : b.team.id === team?.id ? 1 : 0))
                  .map(({ team: t, bots }) => (
                  <li
                    key={t.id}
                    className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">
                        {t.name}
                        {t.id === team?.id && (
                          <span className="ml-2 text-xs font-normal text-gray-500">(current team)</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleClaim(t.id)}
                        disabled={!!claimingTeamId}
                        className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:pointer-events-none"
                      >
                        {claimingTeamId === t.id ? (
                          <>
                            <LoadingSpinner className="h-4 w-4" />
                            Connecting…
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="h-4 w-4" />
                            Connect here
                          </>
                        )}
                      </button>
                    </div>
                    {bots.length > 0 && (
                      <div className="flex items-center gap-2">
                        <label htmlFor={`default-bot-${t.id}`} className="text-sm text-gray-600 whitespace-nowrap">
                          Default bot:
                        </label>
                        <select
                          id={`default-bot-${t.id}`}
                          value={defaultBotByTeamId[t.id] ?? ''}
                          onChange={(e) => setDefaultBotByTeamId((prev) => ({ ...prev, [t.id]: e.target.value || '' }))}
                          className="block rounded-md border border-gray-300 bg-white py-1.5 pl-2 pr-8 text-sm text-gray-900 focus:border-cyan-500 focus:ring-cyan-500"
                        >
                          <option value="">None (set later)</option>
                          {bots.map((bot) => (
                            <option key={bot.id} value={bot.id}>
                              {bot.name || bot.id}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-xs text-gray-500">
              If the connection link has expired, install again from the Slack App Directory. After connecting, you can change the default bot and channel routing in that team’s Integrations → Slack.
            </p>
          </div>
        )}
      </div>
    </DashboardWrap>
  )
}

export async function getServerSideProps(context) {
  const data = await getAuthorizedUserCurrentTeam(context)
  if (data.redirect) return data
  const { userId } = data.props
  const userTeams = await getUserTeams(userId) || []
  const { canUserModifyTeam } = await import('@/utils/function.utils')
  const teamsCanModify = userTeams.filter((t) => canUserModifyTeam(t, userId))
  const teamsWithBots = await Promise.all(
    teamsCanModify.map(async (t) => ({ team: t, bots: await getBots(t) })),
  )
  return {
    ...data,
    props: {
      ...data.props,
      teamsWithBots,
    },
  }
}

export default SlackConnected
