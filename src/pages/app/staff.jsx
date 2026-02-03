import { Fragment, useState } from 'react'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { isSuperAdmin } from '@/utils/helpers'

function Staff({ team, userId }) {
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [newTeam, setNewTeam] = useState(null)
  const [teamOptions, setTeamOptions] = useState([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [weaviateUrl, setWeaviateUrl] = useState(team.weaviateUrl || '')
  const [weaviateApiKey, setWeaviateApiKey] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [canTrial, setCanTrial] = useState(team.canTrial || false)
  const [isEnablingTrial, setIsEnablingTrial] = useState(false)
  const [blogPath, setBlogPath] = useState('')
  const [isClearingBlogCache, setIsClearingBlogCache] = useState(false)

  const changeTeam = async (teamId) => {
    setErrorText('')
    setTeamOptions([])

    if (teamId === team.id || !teamId) {
      setErrorText('Please enter a different valid team')
      return
    }

    const urlParams = ['users', userId]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentTeam: teamId }),
    })
    if (response.ok) {
      const { team: newTeam } = await response.json()
      window.location.href = `/app/team?switchTeam=${newTeam.id}`
    } else if (response.status === 409) {
      const data = await response.json()
      setTeamOptions(data.teams || [])
      setErrorText(data.message || 'Multiple teams found. Please choose one.')
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const updateTeam = async () => {
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ weaviateUrl, weaviateApiKey }),
    })
    if (response.ok) {
      const data = await response.json()
      setSuccessText('Successfully updated team settings!')
      setIsUpdating(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  const enableTrial = async () => {
    setErrorText('')
    setIsEnablingTrial(true)

    const urlParams = ['teams', team.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ canTrial: true }),
    })
    if (response.ok) {
      const data = await response.json()
      setSuccessText('Successfully enabled trial for team!')
      setCanTrial(true)
      setIsEnablingTrial(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsEnablingTrial(false)
    }
  }

  const clearBlogCache = async () => {
    setErrorText('')
    setSuccessText('')

    if (!blogPath) {
      setErrorText('Please enter a blog article or documentation URL or path.')
      return
    }

    setIsClearingBlogCache(true)

    try {
      const response = await fetch('/api/tools/clear-blog-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ articlePath: blogPath }),
      })

      if (response.ok) {
        setSuccessText('Cache cleared successfully.')
        setBlogPath('')
      } else {
        const data = await response.json()
        setErrorText(data.message || 'Failed to clear cache.')
      }
    } catch (error) {
      setErrorText('Failed to clear cache. Please try again.')
    } finally {
      setIsClearingBlogCache(false)
    }
  }

  if (!isSuperAdmin(userId)) {
    return null
  }

  return (
    <DashboardWrap page="Staff Tools" team={team}>
      <Alert title={errorText} type="error" />
      <Alert title={successText} type="success" />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
        <div className="w-full">
          <h3 className="m-0 text-lg font-medium leading-6 text-gray-900">
            Super Admin Tools
          </h3>
        </div>
        <div>
          <label
            htmlFor="team_id"
            className="block text-sm font-medium text-gray-700"
          >
            Open Team
          </label>
          <div className="mt-2 max-w-xl text-xs text-gray-500">
            <p>Enter customer email or Team ID to switch to their team.</p>
          </div>
          <div className="mt-1 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <input
                type="text"
                id="team_id"
                value={newTeam}
                onChange={(e) => {
                  setNewTeam(e.target.value)
                  setSelectedTeam('')
                  setTeamOptions([])
                }}
                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                placeholder="Email/Team ID"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                changeTeam(newTeam)
              }}
              className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              Go
            </button>
          </div>
          {teamOptions.length > 0 ? (
            <div className="mt-3">
              <label
                htmlFor="team-select"
                className="block text-sm font-medium text-gray-700"
              >
                Select a team
              </label>
              <div className="mt-1 flex gap-2">
                <select
                  id="team-select"
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  className="block w-full rounded-md border-gray-300 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                >
                  <option value="">Choose a team</option>
                  {teamOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.name || option.id} ({option.botCount} bots)
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => changeTeam(selectedTeam)}
                  disabled={!selectedTeam}
                  className="inline-flex items-center rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                >
                  Open
                </button>
              </div>
            </div>
          ) : null}
        </div>
        <div className="w-full border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-2">
              <label
                htmlFor="w-url"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Custom Weaviate URL
              </label>
              <div className="mt-2">
                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-600 sm:max-w-md">
                  <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                    https://
                  </span>
                  <input
                    type="text"
                    name="w-url"
                    id="w-url"
                    autoComplete="off"
                    value={weaviateUrl}
                    onChange={(e) => setWeaviateUrl(e.target.value)}
                    className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="xxx.xxx.weaviate.cloud"
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="w-key"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Custom Weaviate API Key
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="w-key"
                  id="w-key"
                  autoComplete="off"
                  value={weaviateApiKey}
                  onChange={(e) => setWeaviateApiKey(e.target.value)}
                  placeholder={team.weaviateApiKey ? '••••••••••••••••••' : ''}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <button
              type="submit"
              onClick={updateTeam}
              disabled={isUpdating}
              className="mt-8 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-25 sm:col-span-2"
            >
              Save
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
        <div className="w-full">
          <h3 className="m-0 text-lg font-medium leading-6 text-gray-900">
            Trial Settings
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>
              Enable trial access for this team. This will allow them to sign up
              for a premium 14-day trial of up to Pro plan.
            </p>
          </div>
        </div>
        <div className="w-full border-t border-gray-200 pt-4">
          <div className="flex items-center gap-2">
            {!canTrial ? (
              <button
                type="button"
                onClick={enableTrial}
                disabled={isEnablingTrial || team.canTrial}
                className="rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 disabled:opacity-25"
              >
                {team.canTrial ? 'Trial Enabled' : 'Enable Trial'}
              </button>
            ) : (
              <span className="text-sm text-cyan-600">✓ Trial is enabled</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
        <div className="w-full">
          <h3 className="m-0 text-lg font-medium leading-6 text-gray-900">
            Blog & Documentation Cache Tools
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>Clear ISR and Cloudflare cache for a blog article or documentation URL or path.</p>
          </div>
        </div>
        <div className="w-full border-t border-gray-200 pt-4">
          <label
            htmlFor="blog_url"
            className="block text-sm font-medium text-gray-700"
          >
            Article or Documentation URL
          </label>
          <div className="mt-2 max-w-xl text-xs text-gray-500">
            <p>
              Blog example: https://docsbot.ai/article/content-management-best-practices
            </p>
            <p>
              Documentation example: https://docsbot.ai/documentation/doc/how-to-share-your-ai-chatbot-with-other-users
            </p>
            <p>Or: /article/slug, /documentation/doc/slug, or just the slug</p>
          </div>
          <div className="mt-1 flex rounded-md shadow-sm">
            <div className="relative flex flex-grow items-stretch focus-within:z-10">
              <input
                type="text"
                id="blog_url"
                value={blogPath}
                onChange={(e) => setBlogPath(e.target.value)}
                className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                placeholder="https://docsbot.ai/article/your-article or /documentation/doc/slug"
              />
            </div>
            <button
              type="button"
              onClick={clearBlogCache}
              disabled={isClearingBlogCache}
              className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-25"
            >
              {isClearingBlogCache ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>
        </div>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.userId && !isSuperAdmin(data.props.userId)) {
    return {
      redirect: {
        destination: '/app',
        permanent: false,
      },
    }
  }

  return data
}

export default Staff
