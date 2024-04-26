import { useEffect, useState, useRef } from 'react'
import {
  ArrowPathIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModalCheckout from '@/components/ModalCheckout'
import { stripePlan } from '@/utils/helpers'
import FieldToggle from '@/components/FieldToggle'

const generateWebhookURL = (teamId) => `https://api.docsbot.ai/teams/${teamId}/helpscout`

const HelpscoutIntegration = ({ team, integrations, bots, setErrorText }) => {
  const [helpScoutIntegration, setHelpScoutIntegration] = useState(
    integrations.find((i) => i.id === 'helpscout')
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [appID, setAppID] = useState('')
  const [appSecret, setAppSecret] = useState('')
  const [isProcessing, setIsProcessing] = useState(true)
  // blur is disabled for pro and higher plans
  const [blurEnabled, setBlurEnabled] = useState(() => {
    return stripePlan(team).bots < 10
  })
  const [showUpgrade, setShowUpgrade] = useState(false)

  const addHelpscout = async () => {
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'integrations']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'helpscout',
        appID,
        appSecret,
      }),
    })

    if (response.ok) {
      const { newIntegration } = await response.json()
      setHelpScoutIntegration(newIntegration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setIsUpdating(false)
  }

  const refreshTags = async () => {
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'integrations', 'helpscout', 'refresh']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const { newIntegration } = await response.json()
      setHelpScoutIntegration(newIntegration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setIsUpdating(false)
  }

  const deleteHelpscout = async () => {
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'integrations']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'helpscout',
      }),
    })

    if (response.ok) {
      setHelpScoutIntegration(undefined)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setIsUpdating(false)
  }

  const refreshHelpscout = async () => {
    setErrorText('')

    const urlParams = ['teams', team.id, 'integrations?type=helpscout']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      const { integration } = await response.json()
      setHelpScoutIntegration(integration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setIsUpdating(false)
  }

  useEffect(() => {
    let interval = null
    if (helpScoutIntegration) {
      if (isProcessing && !interval) {
        clearInterval(interval)
        interval = setInterval(() => {
          refreshHelpscout()
        }, 5000)
      }
      if (!isProcessing && interval) {
        clearInterval(interval)
      }
    }

    return () => clearInterval(interval)
  }, [isProcessing])

  useEffect(() => {
    if (helpScoutIntegration && ['working', 'pending'].includes(helpScoutIntegration.status)) {
      setIsProcessing(true)
      return
    } else {
      setIsProcessing(false)
    }
  }, [helpScoutIntegration])

  const updateHelpScoutTag = async (tag, botId) => {
    setErrorText('')

    const urlParams = ['teams', team.id, 'integrations', 'helpscout']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignedBots: {
          [tag.id]: botId,
        },
      }),
    })

    if (response.ok) {
      const { integration } = await response.json()
      setHelpScoutIntegration(integration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const updateHelpScoutMailbox = async (mailboxId, botId) => {
    setErrorText('')

    const urlParams = ['teams', team.id, 'integrations', 'helpscout']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignedMailboxes: {
          [mailboxId]: botId
        },
      }),
    })

    if (response.ok) {
      const { integration } = await response.json()
      setHelpScoutIntegration(integration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const updateHelpscoutSourceResponse = async (sourceResponse) => {
    setErrorText('')

    const urlParams = ['teams', team.id, 'integrations', 'helpscout']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sourceResponse
      }),
    })

    if (response.ok) {
      const { integration } = await response.json()
      setHelpScoutIntegration(integration)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }


  const BotSelect = ({ onChange, value }) => {
    return (
      <select
        id="team_role"
        value={value}
        onChange={onChange}
        className="block w-full rounded-none rounded-l-md rounded-r-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
      >
        {bots.map((bot) => (
          <option key={bot.id} value={bot.id}>
            {bot.name}
          </option>
        ))}
        <option key={'none'} value="none">
          No listener
        </option>
      </select>
    )
  }

  const TagTable = () => {
    if (!helpScoutIntegration || !helpScoutIntegration?.tags) return null
    return (
      <div className="inline-block min-w-full py-2 align-middle">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
              >
                Tag
              </th>
              <th
                scope="col"
                className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
              >
                Bot
              </th>
            </tr>
          </thead>
          <tbody>
            {helpScoutIntegration.tags.map((tag) => {
              return (
                <tr key={tag.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1 text-sm text-gray-500">{tag.name}</td>
                  <td className="px-3 py-1 text-sm text-gray-500">
                    <BotSelect
                      onChange={(e) => updateHelpScoutTag(tag, e.target.value)}
                      value={tag?.assignedBot || 'none'}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const checkAssignedMailbox = (mailboxId) => {
    if (!helpScoutIntegration || !helpScoutIntegration?.mailboxes || !helpScoutIntegration?.assignedMailboxes) {
      return null
    }

    const lookup = helpScoutIntegration.assignedMailboxes[mailboxId]
    if (!lookup) {
      return null
    }

    return lookup;
  }

  const MailboxTable = () => {
    if (!helpScoutIntegration || !helpScoutIntegration?.mailboxes) return null
    return (
      <div className="inline-block min-w-full py-2 align-middle">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
              >
                Mailbox
              </th>
              <th
                scope="col"
                className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
              >
                Default Bot
              </th>
            </tr>
          </thead>
          <tbody>
            {helpScoutIntegration.mailboxes.map((mb) => {
              return (
                <tr key={mb.id} className="hover:bg-gray-50">
                  <td className="px-3 py-1 text-sm text-gray-500">
                    <span className="text-sm text-gray-500">{mb.name}</span>
                    <span className="ml-2 text-sm text-gray-400">{mb.slug}</span>
                  </td>
                  <td className="px-3 py-1 text-sm text-gray-500">
                    <BotSelect
                      onChange={(e) => updateHelpScoutMailbox(mb.id, e.target.value)}
                      value={checkAssignedMailbox(mb.id) || 'none'}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const HelpScoutForm = () => {
    return (
      <>
        <div className="mb-4">
          <p className="text-md mt-2 text-justify text-gray-800">
            If you use{' '}
            <Link
              href="https://helpscout.grsm.io/9cush642f1y3"
              target="_blank"
              className="underline"
            >
              HelpScout
            </Link>{' '}
            for customer support, you can integrate your bots with your mailboxes to automatically
            draft replies to support tickets. Please{' '}
            <Link
              href="/documentation/developer/helpscout"
              target="_blank"
              className="text-cyan-800 underline"
            >
              read our instructions
            </Link>{' '}
            for configuring this integration.
          </p>
          <div className="mt-4 flex justify-between">
            <label htmlFor="helpscout_app_id" className="block text-sm font-medium text-gray-700">
              App ID
            </label>
            <span className="text-sm capitalize text-gray-500">Required</span>
          </div>
          <div className="mt-1">
            <input
              type="text"
              id="helpscout_app_id"
              autoComplete="off"
              value={appID}
              onChange={(e) => setAppID(e.target.value)}
              disabled={false}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder=""
              aria-describedby="helpscout_app_id-description"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500" id="helpscout_app_id-description">
            App ID of your created Helpscout app.
          </p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between">
            <label htmlFor="helpscout_app_secret" className="block text-sm font-medium text-gray-700">
              App Secret
            </label>
            <span className="text-sm capitalize text-gray-500">Required</span>
          </div>
          <div className="mt-1">
            <input
              type="password"
              id="helpscout_app_secret"
              autoComplete="off"
              value={appSecret}
              disabled={false}
              onChange={(e) => setAppSecret(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
              placeholder=""
              aria-describedby="helpscout_app_secret-description"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500" id="helpscout_app_secret-description">
            App Secret of your created Helpscout app.
          </p>
        </div>

        <div className="mb-2 mt-6 flex flex-shrink-0 items-end justify-end">
          <button
            disabled={isUpdating}
            onClick={addHelpscout}
            className="ml-4 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
          >
            {isUpdating ? (
              <LoadingSpinner className="mr-3" />
            ) : (
              <PlusIcon className="-ml-1 mr-2 h-6 w-6" aria-hidden="true" />
            )}
            Add HelpScout App
          </button>
        </div>
      </>
    )
  }

  const HelpScoutInfo = () => {
    const [appSecretShown, setAppSecretShown] = useState(false)
    const [webhookSecretShown, setWebhookSecretShown] = useState(false)

    return (
      <>
        {helpScoutIntegration.status === 'ready' && (
          <>
            <div className="mb-4">
              <pre className="block text-sm font-medium text-gray-700">
                App ID: {helpScoutIntegration.appID}
              </pre>
            </div>
            <div className="mb-4">
              <div className="flex justify-between">
                <pre className="block text-sm font-medium text-gray-700">
                  App Secret:{' '}
                  {appSecretShown
                    ? helpScoutIntegration.appSecret
                    : '*'.repeat(helpScoutIntegration.appSecret.length)}
                </pre>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => setAppSecretShown((shown) => !shown)}
                >
                  <span className="sr-only">Show</span>
                  {appSecretShown ? (
                    <EyeSlashIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div className="text-md mb-4 text-gray-800">
              <label className="block text-sm font-bold text-gray-700">Auto-Reply:</label>
              <p className="mb-2">
                To enable Auto-drafts, you'll need to create a webhook in HelpScout.
              </p>
              <ol className="ml-2 list-inside list-decimal">
                <li>
                  Install the{' '}
                  <Link
                    href="https://secure.helpscout.net/apps/webhooks/"
                    target="_blank"
                    className="text-cyan-800 underline"
                  >
                    Webhooks App in your HelpScout dashboard
                  </Link>{' '}
                  or create a new webhook and paste the Webhook Secret and Callback URL from below
                  into the relevant fields.
                </li>
                <li>
                  Set it to Active and check the "Conversation Created" and optionally "Conversation
                  Customer Reply" events.
                </li>
                <li>Select the mailbox you want to enable Auto-drafts for.</li>
                <li>Finally, click "Save" and you're all set!</li>
              </ol>
            </div>
            <div className="mb-4">
              <div className="flex justify-between">
                <pre className="block text-sm font-medium text-gray-700">
                  Webhook Secret:{' '}
                  {webhookSecretShown
                    ? helpScoutIntegration.webhookSecret
                    : '*'.repeat(helpScoutIntegration.webhookSecret.length)}
                </pre>
                <button
                  type="button"
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                  onClick={() => setWebhookSecretShown((shown) => !shown)}
                >
                  <span className="sr-only">Show</span>
                  {webhookSecretShown ? (
                    <EyeSlashIcon className="h-6 w-6" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="h-6 w-6" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between">
                <pre className="block text-sm font-medium text-gray-700">
                  Callback URL: {generateWebhookURL(team.id)}
                </pre>
              </div>
            </div>
            <div className="mb-4">
              <FieldToggle
                label="Source response"
                description="If the bot cannot fully answer the question, a note will be made showing relevant sources."
                enabled={helpScoutIntegration.sourceResponse || false}
                setEnabled={updateHelpscoutSourceResponse}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700">Active tags:</label>
              <TagTable />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-bold text-gray-700">Mailboxes:</label>
              <MailboxTable />
              {/* <div className="ml-2 mt-2">
                {helpScoutIntegration.mailboxes.map((mailbox) => (
                  <div key={mailbox.id} className="flex items-center">
                    <span className="text-sm text-gray-500">{mailbox.name}</span>
                    <span className="ml-2 text-sm text-gray-400">{mailbox.slug}</span>
                  </div>
                ))}
              </div> */}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                className="flex items-center rounded-md bg-white text-sm text-red-400 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={deleteHelpscout}
              >
                <TrashIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Delete
              </button>
              <button
                type="button"
                className={
                  'mr-10 flex items-center rounded-md text-xs text-gray-500 hover:text-gray-900 focus:outline-none'
                }
                onClick={() => refreshTags()}
              >
                <ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Refresh
              </button>
            </div>
          </>
        )}
        {helpScoutIntegration.status === 'failed' && (
          <>
            <Alert
              type="warning"
              title={'Integration failed: ' + helpScoutIntegration.error}
              onClose={deleteHelpscout}
            >
              <button
                className="flex items-center text-gray-400 hover:text-gray-600 focus:text-gray-500"
                type="button"
                onClick={(e) => refreshTags()}
              >
                <ArrowPathIcon className="mr-1 h-4 w-4" aria-hidden="true" /> Retry
              </button>
            </Alert>
          </>
        )}
        {['working', 'pending'].includes(helpScoutIntegration.status) && (
          <span
            className={
              'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800'
            }
          >
            <LoadingSpinner small={false} /> Checking integration...
          </span>
        )}
      </>
    )
  }

  return (
    <div className="mt-8 rounded-lg bg-white p-8 shadow">
      <h3 className="mb-2 flex align-middle text-2xl font-bold">
        <svg
          className="mr-2 h-7 w-7"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 137.5 166"
          role="img"
        >
          <path
            fill="#1292ee"
            d="M9.9 97.2l48.6-48.6c6.3-6.2 10.2-14.9 10.2-24.4 0-9.4-3.8-18-9.9-24.2L10.2 48.6C3.9 54.8 0 63.5 0 73c0 9.5 3.8 18 9.9 24.2zM127.6 68.8L79 117.4c-6.3 6.2-10.2 14.9-10.2 24.4 0 9.4 3.8 18 9.9 24.2l48.6-48.6c6.3-6.2 10.2-14.9 10.2-24.4 0-9.5-3.8-18-9.9-24.2zM127.3 48.7s0-.1 0 0c6.3-6.2 10.2-14.9 10.2-24.4 0-9.4-3.8-18-9.9-24.2L10.2 117.4C3.9 123.6 0 132.3 0 141.8c0 9.4 3.8 18 9.9 24.2L127.3 48.7z"
          ></path>
        </svg>
        HelpScout Integration <span className="text-sm text-gray-400">BETA</span>
      </h3>

      {blurEnabled && (
        <div className="relative z-10 -mb-72 mt-32 w-full">
          <div className="flex justify-center py-4 text-center">
          <div className="max-w-3xl">
          <h3 className="text-3xl font-bold">Setup Helpscout Auto replying</h3>
              <p className="mb-8 text-center text-gray-700">
                Upgrade to the Pro plan or higher to reduce support queues and speed up Helpscout responses! View{' '}
                <Link href="/#pricing" target="_blank" className="underline">
                  plan details
                </Link>
                .
              </p>
            <button
              type="button"
              className="text-md inline-flex w-64 cursor-pointer items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-3 font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 "
              onClick={(e) => setShowUpgrade(true)}
            >
              <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
              Upgrade Plan
            </button>
            <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
          </div>
        </div>
        </div>
      )}

      <div className={blurEnabled ? 'blur-lg' : ''}>
        {helpScoutIntegration ? <HelpScoutInfo /> : <HelpScoutForm />}
      </div>
    </div>
  )
}

export default HelpscoutIntegration
