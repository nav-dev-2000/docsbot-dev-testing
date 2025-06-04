import Link from 'next/link'
import { useEffect, useState } from 'react'
import { stripe } from '@/utils/stripe'
import {
  AcademicCapIcon,
  CreditCardIcon,
  ServerStackIcon,
  UsersIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import UpgradeNotice from '@/components/UpgradeNotice'
import { stripePlan } from '@/utils/helpers'
import NewBotPanel from '@/components/NewBotPanel'
import classNames from '@/utils/classNames'
import LocalStringNum from '@/components/LocalStringNum'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserCreateDeleteBot } from '@/utils/function.utils'
import TeamHistory from '@/components/TeamHistory'
import Tooltip from '@/components/Tooltip'
import { getInvitesFromTeam } from '@/lib/dbQueries'

const Card = ({ name, stat, href, linkText, tooltip, CardIcon, limit }) => {
  const cardContent = (
    <div key={name} className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CardIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">{name}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  <LocalStringNum value={stat} />
                  {limit && (
                    <span className="text-sm text-gray-500">
                      {' '}
                      / <LocalStringNum value={limit} />
                    </span>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {href && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={href} className="font-medium text-cyan-700 hover:text-cyan-900">
              {linkText}
              <ArrowRightIcon className="-mr-0.5 ml-1 inline h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  return tooltip ? (
    <Tooltip content={tooltip}>
      {cardContent}
    </Tooltip>
  ) : cardContent
}

function Dashboard({ team, purchase, teamInvites = [] }) {
  const [errorText, setErrorText] = useState(null)
  const [open, setOpen] = useState(false)
  const [user] = useAuthState(auth)
  const [canModify, setModify] = useState(false)

  useEffect(() => {
    if (team && user) {
      setModify(canUserCreateDeleteBot(team, user.uid))
    }
  }, [team, user])

  useEffect(() => {
    if (!team.botCount) {
      setOpen(true)
    }
  }, [])

  // Calculate team members count (current members + invites)
  const teamMembersCount = Object.keys(team?.roles || {}).length + teamInvites.length

  const cards = [
    {
      name: 'Bots',
      href: '/app/bots',
      linkText: 'View all',
      tooltip: 'You can create up to ' + stripePlan(team).bots + ' bots.',
      icon: ServerStackIcon,
      stat: team?.botCount || 0,
      limit: stripePlan(team).bots,
    },
    {
      name: 'Source Pages',
      href: false,
      tooltip: 'A source page is the greater of 5000 characters of processed text or one document/web page.',
      icon: Square3Stack3DIcon,
      stat: team?.pageCount || 0,
      limit: stripePlan(team).pages,
    },
    {
      name: 'Messages',
      href: false,
      tooltip: 'User messages in current month',
      icon: ChatBubbleBottomCenterTextIcon,
      stat: team?.questionCount || 0,
      limit: stripePlan(team).questions,
    },
    {
      name: 'Team Members',
      href: '/app/team',
      linkText: 'Manage',
      tooltip: 'Current team members including pending invites. Your plan allows up to ' + stripePlan(team).teamMembers + ' members.',
      icon: UsersIcon,
      stat: teamMembersCount,
      limit: stripePlan(team).teamMembers,
    },
    {
      name: 'Current Plan',
      href: canModify ? '/app/account' : false,
      linkText: 'Manage',
      icon: CheckBadgeIcon,
      stat: stripePlan(team).name,
    },
  ]

  const actions = [
    {
      title: 'View Bots',
      description: 'Manage, test, use, and deploy trained DocsBots.',
      href: '/app/bots',
      icon: ServerStackIcon,
      iconForeground: 'text-indigo-700',
      iconBackground: 'bg-indigo-50',
      disabled: false,
    },
    {
      title: 'New Bot',
      description: canModify ? 'Train a new knowledge base with your custom documentation and content.' : 'Ask an admin to create a new bot for you.',
      href: '/app/bots',
      click: setOpen,
      icon: AcademicCapIcon,
      iconForeground: 'text-cyan-700',
      iconBackground: 'bg-cyan-50',
      disabled: !canModify,
    },
    {
      title: 'Plan & Billing',
      description: 'Manage your plans and billing information in your billing dashboard.',
      href: '/app/account',
      icon: CreditCardIcon,
      iconForeground: 'text-green-700',
      iconBackground: 'bg-green-50',
      disabled: false,
    },
    {
      title: 'Team Management',
      description: 'Manage your team members and their roles in your team dashboard.',
      href: '/app/team',
      icon: UsersIcon,
      iconForeground: 'text-yellow-700',
      iconBackground: 'bg-yellow-50',
      disabled: false,
    }
  ]

  const removeLastError = async () => {
    const urlParams = ['teams', team.id, 'clearError']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'POST',
    })
    if (response.ok) {
      const data = await response.json()
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const LastError = ({ lastError }) => {
    if (!lastError)
      return null;
  
    return (
      <Alert title={lastError.type === 'chat' ?
                  'A bot received an error!' :
                  'A bot has a failing source!'
      } type="warning" onClose={removeLastError}>
        <div className='text-left text-sm'> {/* prevent overflow */}
          {lastError.type === 'chat' ?
            (<p>Looks like <a href={`https://docsbot.ai/app/bots/${lastError.botId}`}>{lastError.botName}</a> is failing with the following error:<br/><p className='break-words font-mono'>{lastError.message}</p></p>) :
            (<p>Looks like <a href={`https://docsbot.ai/app/bots/${lastError.botId}`}>{lastError.botName}</a> has a failing source with the following error:<br/><p className='break-words font-mono'>{lastError.message}</p></p>)
          }
        </div>
      </Alert>
    )
  } 

  return (
    <DashboardWrap page="Dashboard" team={team}>
      <Alert title={errorText} type="warning" />
      <LastError lastError={team?.lastError} />
      <UpgradeNotice team={team} />

      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card */}
        {cards.map((card) => (
          <Card
            key={card.name}
            name={card.name}
            href={card.href}
            linkText={card.linkText}
            tooltip={card.tooltip}
            CardIcon={card.icon}
            stat={card.stat}
            limit={card.limit}
          />
        ))}
      </div>

      <div className="mt-8 divide-y divide-gray-200 overflow-hidden rounded-lg bg-gray-200 shadow sm:grid sm:grid-cols-2 sm:gap-px sm:divide-y-0">
        {actions.map((action, actionIdx) => (
          <div
            key={action.title}
            className={classNames(
              actionIdx === 0 ? 'rounded-tl-lg rounded-tr-lg sm:rounded-tr-none' : '',
              actionIdx === 1 ? 'sm:rounded-tr-lg' : '',
              actionIdx === actions.length - 2 ? 'sm:rounded-bl-lg' : '',
              actionIdx === actions.length - 1
                ? 'rounded-bl-lg rounded-br-lg sm:rounded-bl-none'
                : '',
              action.disabled ? 'opacity-50' : '',
              'group relative bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-500'
            )}
          >
            <div>
              <span
                className={classNames(
                  action.iconBackground,
                  action.iconForeground,
                  'inline-flex rounded-lg p-3 ring-4 ring-white'
                )}
              >
                <action.icon className="h-6 w-6" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-8">
              <h3 className="text-lg font-medium">
                {action.click ? (
                  <Link
                    href={action.href}
                    onClick={!action.disabled ? (e) => {
                      e.preventDefault()
                      action.click(true)
                    } : null}
                    className="focus:outline-none"
                  >
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </Link>
                ) : (
                  <Link href={action.href} className="focus:outline-none">
                    {/* Extend touch target to entire panel */}
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.title}
                  </Link>
                )}
              </h3>
              <p className="mt-2 text-sm text-gray-500">{action.description}</p>
            </div>
            <span
              className="pointer-events-none absolute right-6 top-6 text-gray-300 group-hover:text-gray-400"
              aria-hidden="true"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20 4h1a1 1 0 00-1-1v1zm-1 12a1 1 0 102 0h-2zM8 3a1 1 0 000 2V3zM3.293 19.293a1 1 0 101.414 1.414l-1.414-1.414zM19 4v12h2V4h-2zm1-1H8v2h12V3zm-.707.293l-16 16 1.414 1.414 16-16-1.414-1.414z" />
              </svg>
            </span>
          </div>
        ))}
      </div>

      <TeamHistory team={team} />

      <NewBotPanel {...{ team, open, setOpen }} />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    // Fetch team invites for member count calculation
    data.props.teamInvites = await getInvitesFromTeam(data.props.team.id)

    //check for session_id in query params
    if (context.query.session_id) {
      //get checkout session data from stripe
      try {
        const session = await stripe.checkout.sessions.retrieve(context.query.session_id, {
          expand: ['line_items'],
        })
        console.log(session)
        data.props.purchase = {
          productName: session.line_items.data[0].description,
          price: session.amount_total / 100,
        }
      } catch (error) {
        console.warn(error)
      }
    }
  }

  return data
}

export default Dashboard
