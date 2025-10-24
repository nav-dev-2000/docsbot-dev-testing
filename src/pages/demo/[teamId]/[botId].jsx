import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { getBot } from '@/lib/dbQueries'
import { NextSeo } from 'next-seo'
import Script from 'next/script'
import { useState } from 'react'

export function DemoPage({ teamId, bot }) {
  const pageTitle = `${bot.name} - Live Demo`
  const [isOverlayCollapsed, setIsOverlayCollapsed] = useState(false)
  
  // Extract colors from bot
  const botColor = bot.color || '#1292EE'
  const buttonColor = bot.buttonColor || '#1292EE'

  return (
    <>
      <NextSeo 
        title={pageTitle} 
        description={`Try out ${bot.name} - an AI chatbot demo for ${bot.name}`} 
        noindex={true} 
        nofollow={true} 
      />
      
      {/* DocsBot Widget Script */}
      <Script id="docsbot-demo-widget">
        {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";const n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify,options:c.options,signature:c.signature});let t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));const o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(function(){setTimeout(function(){const button=document.querySelector('#docsbotai-root button');if(button){button.click();}},1000);}).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};
DocsBotAI.init({
  id: "${teamId}/${bot.id}", 
  options: { 
    localDev: ${process.env.NODE_ENV === 'development' ? 'true' : 'false'},
  }
}).then(setTimeout(function(){DocsBotAI.open();},2000));`}
      </Script>

      <div className="min-h-screen bg-gray-100 relative overflow-hidden">
        {/* Header */}
        <div className="fixed top-0 left-0 right-0 z-30 bg-white/50 backdrop-blur-sm shadow-sm border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center min-w-0 flex-1">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {bot.name} - Live Demo
                </h1>
              </div>
              
              <div className="flex items-center flex-shrink-0 ml-4">
                <Link
                  href="/"
                  className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors text-sm font-medium bg-animation whitespace-nowrap"
                >
                  Create Your Bot
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Demo Content */}
        <div className="relative z-10">
          {bot.brandAnalysis?.screenshotUrl ? (
            /* Website Screenshot Background */
            <div 
              className="h-screen bg-cover bg-top bg-no-repeat relative w-full"
              style={{
                backgroundImage: `url(${bot.brandAnalysis.screenshotUrl})`,
                backgroundSize: 'cover',
              }}
            >
              
              {/* Demo Instructions Overlay */}
              <div className="absolute top-20 left-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-xl max-w-md transition-all duration-300 ease-in-out">
                {/* Header with collapse button */}
                <div className={`flex items-center justify-between p-4 ${!isOverlayCollapsed ? 'border-b border-gray-200' : ''}`}>
                  <h2 className="font-bold text-gray-900">{bot.name} - Demo</h2>
                  <button
                    onClick={() => setIsOverlayCollapsed(!isOverlayCollapsed)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label={isOverlayCollapsed ? "Expand instructions" : "Collapse instructions"}
                  >
                    <svg 
                      className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOverlayCollapsed ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                
                {/* Collapsible content */}
                {!isOverlayCollapsed && (
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">{bot.description}</p>
                    
                    <div className="space-y-3 text-sm text-gray-700">
                      <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        <span>Use the chat widget to ask questions</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-cyan-500 rounded-full"></span>
                        <span>The bot has been trained on some of this website's content</span>
                      </p>
                      <p className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        <span>Try asking about products, services, or support</span>
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500">
                        This is a live demo showing how the DocsBot widget might appear and behave on your website, trained on your website's content.
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Floating Chat Widget will appear here via the script */}
            </div>
          ) : (
            /* Fallback when no screenshot */
            <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-indigo-100 flex items-center justify-center">
              <div className="max-w-2xl mx-auto text-center px-4">
                <div 
                  className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-white font-bold text-2xl"
                  style={{ backgroundColor: botColor }}
                >
                  AI
                </div>
                
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                  {bot.name}
                </h1>
                
                <p className="text-xl text-gray-600 mb-8">
                  {bot.description}
                </p>
                
                <div className="bg-white rounded-2xl p-8 shadow-xl">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    Try the Demo
                  </h2>
                  
                  <p className="text-gray-600 mb-6">
                    The chat widget will open automatically. Start a conversation with the AI assistant!
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="font-medium text-green-800 mb-2">Ask Questions</div>
                      <div className="text-green-600">
                        Get instant answers about products, services, and more
                      </div>
                    </div>
                    
                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <div className="font-medium text-cyan-800 mb-2">Get Support</div>
                      <div className="text-cyan-600">
                        Find help and guidance 24/7 with AI assistance
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="font-medium text-purple-800 mb-2">Learn More</div>
                      <div className="text-purple-600">
                        Discover features and capabilities through conversation
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8">
                  <Link
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors font-medium"
                  >
                    Create Your Own Bot
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
        
      </div>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const { teamId, botId } = context.params

  const data = { props: {} }
  
  try {
    data.props.teamId = teamId
    data.props.bot = await getBot(teamId, botId)
    
    // Return 404 if bot doesn't exist
    if (!data.props.bot) {
      return {
        notFound: true,
      }
    }
  } catch (error) {
    console.error('Error fetching demo bot:', error)
    return {
      notFound: true,
    }
  }

  return data
}

export default DemoPage

