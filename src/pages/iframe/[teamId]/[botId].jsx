import { useEffect } from 'react'
import { getTeam, getBot } from '@/lib/dbQueries'
import { EyeSlashIcon } from '@heroicons/react/24/outline'
import { NextSeo } from 'next-seo'
import Script from 'next/script'
import { usePostHog } from 'posthog-js/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'

export function ChatPage({ team, bot, signature, agent, testing, name, email }) {
  const posthog = usePostHog()
  const [user] = useAuthState(auth)

  // Track "Bot Tested" event when testing mode is enabled
  useEffect(() => {
    if (!testing || !posthog) return

    let hasTrackedTest = false

    const handleAnswerComplete = () => {
      if (hasTrackedTest) return
      hasTrackedTest = true

      posthog.capture('Bot Tested', {
        'Bot name': bot.name,
        bot_id: bot.id,
        team_id: team.id,
        source: 'iframe',
      })
    }

    document.addEventListener('docsbot_fetching_answer_complete', handleAnswerComplete)

    return () => {
      document.removeEventListener('docsbot_fetching_answer_complete', handleAnswerComplete)
    }
  }, [testing, posthog, bot.name, bot.id, team.id])
  const pageTitle = `${bot.name} Chatbot Demo`

  const widgetConfig = {
    id: `${team.id}/${bot.id}`,
  }

  if (signature) {
    widgetConfig.signature = signature
  }

  // Set user identification - prioritize logged-in user, then URL params
  const identify = {}
  if (user) {
    // Use logged-in user's information
    if (user.displayName) {
      identify.name = user.displayName
    }
    if (user.email) {
      identify.email = user.email
    }
  } else {
    // Fall back to URL parameters if not logged in
    if (name && name.trim() !== '') {
      identify.name = name
    }
    if (email && email.trim() !== '') {
      identify.email = email
    }
  }

  // Override referrer with parent frame location if available (iframe context)
  try {
    // Try to access parent window location (may fail due to cross-origin restrictions)
    if (window.parent && window.parent !== window && window.parent.location.href) {
      identify.referrer = window.parent.location.href
    } else {
      identify.referrer = null
    }
  } catch (e) {
    // Cross-origin access blocked, set to null
    identify.referrer = null
  }

  // Only add identify to config if we have at least one property
  if (Object.keys(identify).length > 0) {
    widgetConfig.identify = identify
  }

  const isDevelopment = process.env.NODE_ENV === 'development'
  const hasAgentOverride = typeof agent === 'boolean'
  const hasTestingParam = typeof testing === 'boolean'

  if (hasAgentOverride || isDevelopment || hasTestingParam) {
    const options = {}

    if (hasAgentOverride) {
      options.isAgent = agent
    }

    if (hasTestingParam) {
      options.testing = testing
    }

    options.localDev = isDevelopment

    widgetConfig.options = options
  }

  const widgetConfigJson = JSON.stringify(widgetConfig)

  return (
    <>
      <style>
        {`
          body {
            background-color: transparent !important;
          }
        `}
      </style>
      <NextSeo
        title={pageTitle}
        description={bot.description}
        noindex={true}
        nofollow={true}
        openGraph={{
          images: [{}] //override default
        }}
      />
      {bot.privacy === 'private' && !signature ? (
        <main className="mx-auto my-16 max-w-6xl">
          <div className="mb-32 mt-64 text-center">
            <EyeSlashIcon className="mx-auto h-12 w-12 text-gray-400" aria-hidden="true" />
            <h3 className="mt-2 text-2xl font-semibold text-gray-700">Private Bot</h3>
            <p className="mt-4 text-lg text-gray-500">
              Sorry, this bot is private. Only logged in team members can access it.
            </p>
          </div>
        </main>
      ) : (
        <>
          <Script id="docsbot">
            {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";const n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify,options:c.options,signature:c.signature});let t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));const o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(e).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};
              DocsBotAI.init(${widgetConfigJson});`}
          </Script>
          <div id="docsbot-widget-embed" className="h-full w-full bg-transparent py-0.5"></div>
        </>
      )}
    </>
  )
}

export const getServerSideProps = async (context) => {
  const { teamId, botId } = context.params
  const { signature, agent, testing, name, email } = context.query

  const data = { props: {} }
  data.props.team = await getTeam(teamId)
  data.props.bot = await getBot(teamId, botId)
  data.props.signature = signature || null

  if (typeof agent === 'string') {
    const agentValue = agent.toLowerCase()

    if (agentValue === 'true' || agentValue === '1') {
      data.props.agent = true
    } else if (agentValue === 'false' || agentValue === '0') {
      data.props.agent = false
    } else {
      data.props.agent = null
    }
  } else {
    data.props.agent = null
  }

  if (typeof testing === 'string') {
    const testingValue = testing.toLowerCase()

    if (testingValue === 'true' || testingValue === '1') {
      data.props.testing = true
    } else if (testingValue === 'false' || testingValue === '0') {
      data.props.testing = false
    } else {
      data.props.testing = null
    }
  } else {
    data.props.testing = null
  }

  if (typeof name === 'string' && name.trim() !== '') {
    data.props.name = name
  } else {
    data.props.name = null
  }

  if (typeof email === 'string' && email.trim() !== '') {
    data.props.email = email
  } else {
    data.props.email = null
  }
  
  //return 404 if bot doesn't exist
  if (!data.props.bot) {
    return {
      notFound: true,
    }
  }

  return data
}

export default ChatPage
