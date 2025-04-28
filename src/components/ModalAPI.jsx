import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  XMarkIcon,
  LinkIcon,
  ClipboardIcon,
  ArrowTopRightOnSquareIcon,
  ChatBubbleLeftEllipsisIcon,
  BoltIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline'
import {
  CheckCircleIcon,
  CodeBracketSquareIcon,
  ShareIcon,
} from '@heroicons/react/24/solid'
import Link from 'next/link'
import classNames from '@/utils/classNames'
import SlackLogo from '@/components/SlackLogo'
import HelpScoutLogo from '@/components/HelpScoutLogo'
import OpenAILogo from '@/components/OpenAILogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import Image from 'next/image'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'

export default function ModalAPI({ team, bot, integrations }) {
  const [open, setOpen] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const helpScoutIntegration = integrations.find((i) => i.id === 'helpscout')
  const [subscribedTags, setSubscribedTags] = useState([])
  const [isConnectingSlack, setIsConnectingSlack] = useState(false)
  const [slackConnection, setSlackConnection] = useState({
    slackBotUserId: bot.slackBotUserId,
    slackTeamId: bot.slackTeamId,
    slackTeamName: bot.slackTeamName,
    slackConnectedAt: bot.slackConnectedAt
  })

  // Check if Slack is connected via bot
  const isSlackConnected = slackConnection.slackBotUserId && slackConnection.slackTeamId

  // Check if user has power plan
  const hasPowerPlan = checkPlanPermission(team, 'power').allowed

  // Add an effect to listen for postMessage events from the Slack OAuth callback window
  useEffect(() => {
    const handlePostMessage = (event) => {
      console.log('Received postMessage event:', event.data);
      
      // Allow messages from any origin that have our expected format
      // This is more reliable than checking origin which can be tricky with subdomains, https/http differences, etc.
      if (event.data && typeof event.data === 'object') {
        // Check if the message is a Slack connected message with the expected format
        if (
          event.data.type === 'SLACK_CONNECTED' &&
          event.data.teamId === team.id &&
          event.data.botId === bot.id
        ) {
          console.log('Valid Slack connection message received, updating state', event.data);
          
          // Update the Slack connection state with the new values
          setSlackConnection({
            slackBotUserId: event.data.slackBotUserId,
            slackTeamId: event.data.slackTeamId,
            slackTeamName: event.data.slackTeamName,
            slackConnectedAt: event.data.slackConnectedAt
          });
          
          // Also update the connecting state
          setIsConnectingSlack(false);
        }
      }
    }

    // Add event listener for messages
    window.addEventListener('message', handlePostMessage);
    
    console.log('PostMessage event listener added for Slack integration');

    // Remove event listener on cleanup
    return () => {
      console.log('Removing postMessage event listener');
      window.removeEventListener('message', handlePostMessage);
    }
  }, [team.id, bot.id]);

  useEffect(() => {
    if (!helpScoutIntegration || !helpScoutIntegration?.tags) {
      return
    }

    // scrape tags for tags assigned to this bot
    let tags = []
    for (const tag of helpScoutIntegration.tags) {
      const assignedId = tag?.assignedBot
      if (assignedId === bot.id) {
        tags.push(tag)
      }
    }

    setSubscribedTags(tags)
  }, [helpScoutIntegration])

  // Function to initiate Slack connection
  const handleConnectSlack = async () => {
    setIsConnectingSlack(true);
    
    try {
      console.log(`Initiating Slack connection for team ${team.id} and bot ${bot.id}`);
      
      // Request the authorization URL from our API
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/integrations/slack/authorize`,
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();

      if (data.url) {
        console.log('Received Slack authorization URL:', data.url);
        
        // Define features for the popup window
        const popupFeatures = 'width=800,height=600,menubar=no,toolbar=no,location=no,resizable=yes,scrollbars=yes,status=no';
        
        // Open in a new window with specific features
        const slackWindow = window.open(
          data.url,
          'Connect to Slack',
          popupFeatures
        );

        // Check if the window was successfully opened
        if (!slackWindow) {
          throw new Error('Popup was blocked by the browser or failed to open');
        }
        
        // Focus the window to make it more visible to the user
        slackWindow.focus();
        
        console.log('Slack authorization window opened successfully');
        
        // Poll for changes to the window status
        const checkInterval = 1000; // Check every second
        const maxChecks = 300; // Maximum number of checks (5 minutes)
        let checkCount = 0;
        
        const checkIntegrationStatus = setInterval(() => {
          checkCount++;
          
          // Check if we've exceeded the maximum number of checks
          if (checkCount > maxChecks) {
            clearInterval(checkIntegrationStatus);
            setIsConnectingSlack(false);
            console.log('Stopped checking for Slack window - max time exceeded');
          }
          
          // Check if the window is closed
          if (slackWindow.closed) {
            clearInterval(checkIntegrationStatus);
            setIsConnectingSlack(false);
            console.log('Slack authorization window was closed');
            
            // The page may be reloaded by the postMessage event listener if successful,
            // but we'll also check the integration status directly after a delay
            setTimeout(async () => {
              try {
                // Check if integration is now connected by fetching fresh bot data
                const statusResponse = await fetch(`/api/teams/${team.id}/bots/${bot.id}`);
                if (statusResponse.ok) {
                  const botData = await statusResponse.json();
                  if (botData.slackBotToken && botData.slackBotUserId && botData.slackTeamId) {
                    console.log('Slack integration confirmed as connected via API check');
                    window.location.reload();
                  }
                }
              } catch (statusError) {
                console.error('Failed to check integration status:', statusError);
              }
            }, 2000);
          }
        }, checkInterval);
      } else {
        throw new Error('No redirect URL returned from the API');
      }
    } catch (error) {
      console.error('Error connecting to Slack:', error);
      setIsConnectingSlack(false);
      
      // Simply log the error without showing a toast
    }
  }

  const handleDisconnectSlack = async () => {
    try {
      setIsConnectingSlack(true);
      
      const response = await fetch(
        `/api/teams/${team.id}/bots/${bot.id}/integrations/slack/disconnect`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to disconnect Slack');
      }

      // Update local state
      setSlackConnection({
        slackBotUserId: null,
        slackTeamId: null,
        slackTeamName: null,
        slackConnectedAt: null
      });
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
      // You might want to show an error toast here
    } finally {
      setIsConnectingSlack(false);
    }
  }

  const HelpScoutInfo = () => {
    if (!helpScoutIntegration || !helpScoutIntegration.webhookSecret) {
      return (
        <p className="text-md text-gray-800">
          If you use Help Scout, you can use our replies feature to generate
          a draft/published reply or note to customer support tickets. This can save your support
          staff precious time and guide them by pre-writing answers to common
          issues. Please configure the{' '}
          <Link
            href="/app/api"
            className="text-cyan-600 underline hover:text-cyan-800"
          >
            Help Scout integration
          </Link>{' '}
          for your team to get started.
        </p>
      )
    }

    return (
      <div>
        <div className="text-gray-800">
          {subscribedTags.length > 0 ? (
            <table className="min-w-full border-separate border-spacing-0">
              <thead>
                <tr>
                  <th
                    scope="col"
                    className="sticky top-16 z-10 border-b border-gray-300 bg-white bg-opacity-75 px-3 py-3.5 text-left text-sm font-semibold text-gray-900 backdrop-blur backdrop-filter"
                  >
                    Assigned Tag
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribedTags.map((tag) => {
                  return (
                    <tr key={tag.id} className="hover:bg-gray-50">
                      <td className="px-3 py-1 text-sm text-gray-500">
                        {tag.name}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <pre className="black text-sm font-medium text-gray-700">
              This bot is not subscribed to any helpscout tags
            </pre>
          )}
          <p className="text-md mt-3">
            You can edit subscribed tags in your{' '}
            <Link
              href="/app/api"
              className="text-cyan-600 underline hover:text-cyan-800"
            >
              Integrations tab
            </Link>{' '}
          </p>
        </div>
      </div>
    )
  }

  const SlackInfo = () => {
    if (!isSlackConnected) {
      return (
        <div>
          <p className="text-md text-gray-800">
            Connect your Slack workspace to integrate this bot with your paid
            team's Slack channels as an AI Agents. (BETA)
          </p>
          <ul className="mt-2 list-disc pl-5 text-gray-800">
            <li>
              Once you install the DocsBot AI Agent app, everyone in your
              workspace can start using it right away
            </li>
            <li>
              Interact with AI Agents in Slack via channels, DMs, or the App
              Home tab
            </li>
          </ul>
          <div className="mt-4">
          {!hasPowerPlan ? (
              <button
                type="button"
                onClick={() => setShowUpgrade(true)}
                className="mt-2 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              >
                <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                Upgrade Plan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConnectSlack}
                disabled={isConnectingSlack}
              className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConnectingSlack ? (
                <>
                  <LoadingSpinner small className="mr-3 text-gray-500" />
                  Connecting...
                </>
              ) : (
                <>
                  <SlackLogo className="mr-2 h-4 w-4" />
                  Add to Slack
                </>
              )}
            </button>
            )}
          </div>
        </div>
      )
    }

    // Get connection timestamp
    const connectedDate = slackConnection.slackConnectedAt 
      ? new Date(slackConnection.slackConnectedAt).toUTCString()
      : 'Unknown date';

    return (
      <div>
        <div className="flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600" aria-hidden="true" />
          <span className="ml-1 text-sm font-medium text-green-700">
            Connected to {slackConnection.slackTeamName || 'Slack workspace'}
          </span>
        </div>
        {slackConnection.slackBotUserId && (
          <p className="mt-2 text-sm text-gray-600">
            Bot User ID:{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              {slackConnection.slackBotUserId}
            </code>
          </p>
        )}
        {slackConnection.slackTeamId && (
          <p className="mt-1 text-sm text-gray-600">
            Slack Team:{' '}
            <code className="rounded bg-gray-100 px-1 py-0.5">
              {slackConnection.slackTeamId}
            </code>
          </p>
        )}
        <p className="mt-1 text-sm text-gray-600">
          Connected on: {connectedDate}
        </p>
        <p className="mt-4 text-gray-800">
          You can mention your bot in any channel using{' '}
          <code className="rounded bg-gray-100 px-1 py-0.5">@docsbot</code>.
        </p>
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleConnectSlack}
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <SlackLogo className="mr-2 h-4 w-4" />
            Reconnect to Slack
          </button>
          <button
            type="button"
            onClick={handleDisconnectSlack}
            className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-white px-4 py-1 text-sm font-medium text-red-600 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <XMarkIcon className="mr-1 h-4 w-4" />
            Disconnect
          </button>
        </div>
      </div>
    )
  }

  const GPTActionInfo = () => {
    return (
      <>
        <p className="text-md text-gray-800">
          Give your custom GPTs access to this DocsBot training library with our
          custom action.
        </p>
        <div className="mt-3 space-y-2">
          <div className="text-sm">
            <span className="block font-semibold">OpenAPI Schema URL:</span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={`https://docsbot.ai/api/teams/${team.id}/bots/${bot.id}/openapi`}
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-6 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={(e) => {
                  navigator.clipboard.writeText(
                    `https://docsbot.ai/api/teams/${team.id}/bots/${bot.id}/openapi`,
                  )
                  // Optional: Add visual feedback for copy success
                }}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
              >
                <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="text-sm">
            <span className="block font-semibold">Privacy Policy URL:</span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value="https://docsbot.ai/legal/privacy-policy"
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    'https://docsbot.ai/legal/privacy-policy',
                  )
                }
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
              >
                <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        <Link
          href="https://docsbot.ai/documentation/doc/how-to-create-openai-gpt-chatbots-with-access-to-your-trained-documentation"
          className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
        >
          Read documentation
          <ArrowTopRightOnSquareIcon
            className="ml-1 h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </>
    )
  }

  const ShareLinksInfo = () => {
    return (
      <>
        <p className="text-md text-gray-800">
          Share these public links for people to interact with your bot.
        </p>
        <div className="mt-3 flex flex-col space-y-2">
          <Link
            target="_blank"
            href={`/chat/${team.id}/${bot.id}`}
            onClick={(e) => {
              if (bot.privacy === 'private' || bot.status !== 'ready') {
                e.preventDefault()
              }
            }}
            className={classNames(
              bot.privacy === 'private' || bot.status !== 'ready'
                ? 'cursor-not-allowed opacity-50'
                : '',
              'inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
            )}
          >
            <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Chat Page
          </Link>
          <Link
            target="_blank"
            href={`/ask/${team.id}/${bot.id}`}
            onClick={(e) => {
              if (bot.privacy === 'private' || bot.status !== 'ready') {
                e.preventDefault()
              }
            }}
            className={classNames(
              bot.privacy === 'private' || bot.status !== 'ready'
                ? 'cursor-not-allowed opacity-50'
                : '',
              'inline-flex justify-center items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50',
            )}
          >
            <LinkIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Q/A Page
          </Link>
        </div>
      </>
    )
  }

  const APIInfo = () => {
    return (
      <>
        <p className="text-md text-gray-800">
          Integrate DocsBot AI with your apps using our powerful chat and
          admin APIs. Use these identifiers with the API for admin and
          chat interactions.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3">
          <div className="rounded border border-gray-200 p-2">
            <span className="text-xs font-semibold text-gray-500">Team ID</span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={team.id}
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={() => navigator.clipboard.writeText(team.id)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
              >
                <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="rounded border border-gray-200 p-2">
            <span className="text-xs font-semibold text-gray-500">Bot ID</span>
            <div className="relative mt-1">
              <input
                type="text"
                readOnly
                value={bot.id}
                onClick={(e) => e.target.select()}
                className="block w-full truncate rounded border border-gray-300 bg-gray-100 p-2 pr-8 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
              />
              <button
                onClick={() => navigator.clipboard.writeText(bot.id)}
                className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 hover:text-gray-700"
              >
                <ClipboardIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <Link
              href="/documentation/developer"
              className="inline-flex items-center text-sm text-cyan-600 hover:text-cyan-800"
            >
              API Documentation
              <ArrowTopRightOnSquareIcon
                className="ml-1 h-4 w-4"
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </>
    )
  }

  const WorkflowAutomationsInfo = () => {
    return (
      <>
        <p className="text-md text-gray-800">
          Connect DocsBot AI to thousands of apps using automation platforms to
          create powerful workflows. Train your bot or use it to respond to
          triggers in your apps like a new message, task, or form submission.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            href="https://zapier.com/apps/docsbot-ai/integrations"
            target="_blank"
            className={classNames(
              "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <Image
              src="/images/logo-timeline/zapier.svg"
              alt="Zapier Logo"
              width={16}
              height={16}
              className="mr-2"
            />
            Zapier
          </Link>
          <Link
            href="https://www.make.com/en/hq/app-invitation/e73df823a271deb12baa80178f4429b7"
            target="_blank"
            className={classNames(
              "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <Image
              src="/images/logo-timeline/make.svg"
              alt="Make Logo"
              width={16}
              height={16}
              className="mr-2"
            />
            Make
          </Link>
          <Link
            href="https://suretriggers.com/integrations/docsbot?aff=5abd7bee"
            target="_blank"
            className={classNames(
              "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <Image
              src="/images/logo-timeline/suretriggers.svg"
              alt="SureTriggers Logo"
              width={16}
              height={16}
              className="mr-2"
            />
            SureTriggers
          </Link>
          <Link
            href="https://payments.pabbly.com/api/affurl/RVYZ07kQyUZ0Z1HUKZ1m/CNd76ecbplizUZ1mp?target=9Z2AHyhSldo6KI1Fn"
            target="_blank"
            className={classNames(
              "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <Image
              src="/images/logo-timeline/pabbly.webp"
              alt="Pabbly Logo"
              width={16}
              height={16}
              className="mr-2"
            />
            Pabbly
          </Link>
          <Link
            href="https://pipedream.com/apps/docsbot-ai"
            target="_blank"
            className={classNames(
              "inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <span className="mr-2 font-humanist text-green-500">p</span>
            Pipedream
          </Link>
          <Link
            href="https://n8n.io/integrations/docsbot-ai/"
            target="_blank"
            className={classNames(
              "col-span-1 inline-flex items-center justify-center rounded border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2",
              !hasPowerPlan ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
            )}
          >
            <Image
              src="/images/logo-timeline/n8n.svg"
              alt="n8n Logo"
              width={16}
              height={16}
              className="mr-2"
            />
            n8n
          </Link>
        </div>
        {!hasPowerPlan && (
          <button
            type="button"
            onClick={() => setShowUpgrade(true)}
            className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <CreditCardIcon className="mr-1.5 h-5 w-5 flex-shrink-0" aria-hidden="true" />
            Upgrade Plan
          </button>
        )}
        <Link
          href="https://docsbot.ai/documentation#integrations"
          className="mt-3 inline-flex items-center justify-end text-sm text-cyan-600 hover:text-cyan-800"
        >
          Read documentation
          <ArrowTopRightOnSquareIcon
            className="ml-1 h-4 w-4"
            aria-hidden="true"
          />
        </Link>
      </>
    )
  }

  const ChatWidgetInfo = () => {
    return (
      <>
        <p className="text-md text-gray-800">
          Embed a customizable chat widget on your website to give your visitors
          instant access to documentation and support.
        </p>
        <ul className="mt-2 list-disc pl-5 text-gray-800">
          <li>Customize appearance to match your brand</li>
          <li>Configure widget placement and behavior</li>
        </ul>
        <div className="mt-4">
          <Link
            href={`/app/bots/${bot.id}/widget`}
            className="inline-flex w-full items-center justify-center rounded border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
          >
            <ChatBubbleLeftEllipsisIcon className="mr-2 h-4 w-4" />
            Configure Widget
          </Link>
        </div>
      </>
    )
  }

  // Integration card component for consistent styling
  const IntegrationCard = ({ title, icon, children, isNew, minPlan }) => {
    return (
      <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-5 sm:px-6">
          <div className="flex items-center">
            <div className="mr-3 flex h-10 w-10 items-center justify-center">
              {icon}
            </div>
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {title}
              {minPlan ? (
                <span className="ml-2 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                  {minPlan}
                </span>
              ) : (
                isNew && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    New!
                  </span>
                )
              )}
            </h3>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-between px-4 py-5 sm:p-6">
          {children}
        </div>
      </div>
    )
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <a
        type="button"
        className="mt-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
        onClick={() => setOpen(true)}
      >
        <ShareIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
        Integrations & Sharing
      </a>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-6xl">
                  <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="rounded-lg bg-white p-8 shadow">
                    <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
                      Integrations & Sharing
                    </h2>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Chat Widget Card - Added First */}
                      <IntegrationCard
                        title="Chat Widget"
                        icon={<ChatBubbleLeftEllipsisIcon className="h-8 w-8 text-cyan-600" />}
                      >
                        <ChatWidgetInfo />
                      </IntegrationCard>
                      
                      {/* Share Links Card */}
                      <IntegrationCard
                        title="Share Links"
                        icon={<ShareIcon className="h-8 w-8" />}
                      >
                        <ShareLinksInfo />
                      </IntegrationCard>

                      {/* Slack Integration Card */}
                      {true && (
                        <IntegrationCard
                          title="Slack Integration"
                          icon={<SlackLogo className="h-8 w-8" />}
                          isNew={true}
                          minPlan={!checkPlanPermission(team, 'power', 'slack').allowed ? checkPlanPermission(team, 'power', 'slack').requiredPlanLabel : undefined}
                        >
                          <SlackInfo />
                        </IntegrationCard>
                      )}

                      {/* Help Scout Integration Card */}
                      <IntegrationCard
                        title="Help Scout Replies"
                        icon={
                          <HelpScoutLogo className="h-8 w-8 text-[#1292ee]" />
                        }
                      >
                        <HelpScoutInfo />
                      </IntegrationCard>

                      {/* ChatGPT Action Card */}
                      <IntegrationCard
                        title="ChatGPT Custom GPT"
                        icon={<OpenAILogo className="h-8 w-8" />}
                      >
                        <GPTActionInfo />
                      </IntegrationCard>

                      {/* Workflow Automations Card */}
                      <IntegrationCard
                        title="Workflow Automations"
                        icon={<BoltIcon className="h-8 w-8 text-cyan-600" />}
                        minPlan={!checkPlanPermission(team, 'power', 'automations').allowed ? checkPlanPermission(team, 'power', 'automations').requiredPlanLabel : undefined}
                      >
                        <WorkflowAutomationsInfo />
                      </IntegrationCard>

                      {/* API Documentation Card */}
                      <IntegrationCard
                        title="API Documentation"
                        icon={<CodeBracketSquareIcon className="h-8 w-8" />}
                      >
                        <APIInfo />
                      </IntegrationCard>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
