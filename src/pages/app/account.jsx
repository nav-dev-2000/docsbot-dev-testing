import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { updateEmail, sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/config/firebase-ui.config'
import { stripe } from '@/utils/stripe'
import Script from 'next/script'
import {
  ServerStackIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  ChatBubbleBottomCenterTextIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { stripePlan } from '@/utils/helpers'
import Checkout from '@/components/Checkout'
import Cancel from '@/components/Cancel'
import ModalDeleteAccount from '@/components/ModalDeleteAccount'
import LocalStringNum from '@/components/LocalStringNum'
import { getBots, getInvitesFromTeam } from '@/lib/dbQueries'
import { getUserRole, canUserCreateDeleteBot } from '@/utils/function.utils'
import ModalPasswordReset from '@/components/ModalPasswordReset'
import Tooltip from '@/components/Tooltip'

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

function Account({ team, bots, checkout, teamInvites = [] }) {
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [sentPasswordReset, setSentPasswordReset] = useState(false)
  const [canModify, setModify] = useState(false)

  useEffect(() => {
    if (team && user) {
      setModify(canUserCreateDeleteBot(team, user.uid))
    }
  }, [team, user])

  // Calculate team members count (current members + invites)
  const teamMembersCount = Object.keys(team?.roles || {}).length + teamInvites.length

  const cards = [
    {
      name: 'Current Plan',
      icon: CheckBadgeIcon,
      stat: stripePlan(team).name,
    },
    {
      name: 'Bots',
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
      tooltip: 'Current team members including pending invites. Your plan allows up to ' + stripePlan(team).teamMembers + ' members.',
      icon: UsersIcon,
      stat: teamMembersCount,
      limit: stripePlan(team).teamMembers,
    },
  ]

  return (
    <DashboardWrap page="Account" team={team}>
      {/* {checkout && (
        <Script id="gtag-conversion" strategy="lazyOnload">
          {`
        gtag('event', 'conversion', {
            'send_to': 'AW-412141971/oMEgCP3e7JMZEJOTw8QB',
            'value': ${checkout.value},
            'currency': '${checkout.currency}',
            'transaction_id': '${checkout.id}'
        });
        `}
        </Script>
      )} */}

      <Alert title={errorText} type="error" />

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

      <div className="mt-6 rounded-lg bg-white p-8 shadow">
        <Checkout team={team} />
        <Cancel team={team} bots={bots} />
      </div>

      <div className="mt-6 gap-6 md:grid md:grid-cols-2">
        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Update your email address</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can update your email address here. This will update your email address for all of
            your teams.
          </p>
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
              New Email
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="email"
                  id="team_id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Email"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  updateEmail(auth.currentUser, newEmail)
                    .then(() => {
                      alert('Email updated successfully')
                    })
                    .catch((error) => {
                      setErrorText(
                        error.message +
                          " If you havn't recently logged in to your account, you may need log out then back in to change your email address for security reasons."
                      )
                    })
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Reset your password</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can request a password reset email here. This will send a password reset email to
            your email address. Please check your spam folder if you do not receive the email.
          </p>
          <div className="mt-5 flex justify-end">
            <ModalPasswordReset team={team} />
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Delete Team Account</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can delete your team account here. This will delete all of your bots, sources,
            questions, keys, any other data, and remove all team members. This action cannot be
            undone and you should cancel any subscriptions before deleting your team account.
          </p>
          <div className="mt-5 flex justify-end">
            <ModalDeleteAccount team={team} />
          </div>
        </div>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    const role = getUserRole(data.props.team, data.props.userId)

    // redirect non-owners to dashboard
    if (role === 'viewer' || role === 'editor') {
      return {
        redirect: {
          destination: '/app',
          permanent: false,
        },
      }
    }
    data.props.bots = await getBots(data.props.team)
    
    // Fetch team invites for member count calculation
    data.props.teamInvites = await getInvitesFromTeam(data.props.team.id)
  }

  // Check if session_id is present in the query parameters
  if (context.query.session_id) {
    try {
      // Retrieve the session details from Stripe
      const session = await stripe.checkout.sessions.retrieve(context.query.session_id)

      data.props.checkout = {
        id: session.id,
        value: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
      }
      console.log(data.props.checkout)
    } catch (err) {
      // Catch any errors and log them to the console
      console.error('Error retrieving checkout session:', err.message)
    }
  }

  return data
}

export default Account
