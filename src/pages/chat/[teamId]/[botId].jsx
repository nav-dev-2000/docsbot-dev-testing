import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { getTeam, getBot } from '@/lib/dbQueries'
import docsbotLogo from '@/images/docsbot-logo.png'
import { EyeSlashIcon } from '@heroicons/react/24/outline'
import { checkPlanPermission } from '@/utils/helpers'
import { NextSeo } from 'next-seo'
import Script from 'next/script'

export function ChatPage({ team, bot }) {
  const pageTitle = `${bot.name} Chatbot`
  
  // Extract color from bot or use default
  const botColor = bot.color || '#1292EE'
  
  // Create gradient colors based on bot color
  const gradientFrom = botColor
  const gradientTo = botColor

  return (
    <>
      <NextSeo title={pageTitle} description={bot.description} noindex={true} nofollow={true} />
      {bot.privacy === 'private' ? (
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
          <Script id="docsbot-share-embed">
            {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";const n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify,options:c.options,signature:c.signature});let t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));const o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(e).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};
DocsBotAI.init({id: "${team.id}/${bot.id}", options: {localDev: ${process.env.NODE_ENV === 'development' ? 'true' : 'false'}, customCSS: ".docsbot-chat-inner-container {border: 0px;}"}});`}
          </Script>
          
          <div className="overflow-hidden bg-gray-50 py-24 sm:py-32 dark:bg-gray-900 h-full">
            <div className="relative isolate">
              <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                <div id="docsbot-widget-embed" className="mx-auto max-w-4xl bg-white/75 shadow-lg h-[70vh] ring-1 ring-gray-900/5 sm:rounded-3xl overflow-hidden dark:bg-white/[0.03] dark:shadow-none dark:ring-white/10">
                </div>
                
                {!checkPlanPermission(team, 'business', 'branding').allowed && (
                  <div className="mt-16 text-center">
                    <p>
                      <Link
                        href="/"
                        target="_blank"
                        className="text-sm text-gray-500 dark:text-gray-300 underline hover:text-gray-600"
                      >
                        {bot.labels.create}
                      </Link>
                    </p>
                    <p className="flex items-start justify-center text-gray-500 dark:text-gray-400 text-md">
                      <Link href="/" target="_blank" className="block">
                        <span className="sr-only">DocsBot AI</span>
                        <Image className="" src={docsbotLogo} alt="DocsBot Logo" height={24} width={95} />
                      </Link>
                    </p>
                  </div>
                )}
              </div>
              <div
                aria-hidden="true"
                className="absolute inset-x-0 -top-16 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl"
              >
                <div
                  style={{
                    clipPath:
                      'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                    background: `linear-gradient(to right, ${gradientFrom}, ${gradientTo})`,
                  }}
                  className="aspect-[1318/752] w-[82.375rem] flex-none opacity-20 dark:opacity-10"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export const getServerSideProps = async (context) => {
  const { teamId, botId } = context.params

  const data = { props: {} }
  data.props.team = await getTeam(teamId)
  data.props.bot = await getBot(teamId, botId)
  //return 404 if bot doesn't exist
  if (!data.props.bot) {
    return {
      notFound: true,
    }
  }

  return data
}

export default ChatPage
