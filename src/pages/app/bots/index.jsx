import Link from 'next/link'
import { useState, useEffect } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import BotCTA from '@/components/BotCTA'
import {
  CalendarIcon,
  XMarkIcon,
  DocumentDuplicateIcon,
  QuestionMarkCircleIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { getBots } from '@/lib/dbQueries'
import BotDelete from '@/components/BotDelete'
import { BotCopyModal } from '@/components/BotCopy'
import clsx from 'clsx'
import LocalStringNum from '@/components/LocalStringNum'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { canUserCreateDeleteBot, canUserViewBot, getUserRole } from '@/utils/function.utils'
import BotIconDisplay from '@/components/BotIconDisplay'
import ModalCheckout from '@/components/ModalCheckout'
import { roundAiCreditsForDisplay, stripePlan } from '@/utils/helpers'
import { useRouter } from 'next/router'
import { decideTextColor } from '@/utils/colors'
import circuitBg from '@/images/circuit.png'

function Bots({ preBots, team }) {
  const [bots, setBots] = useState(preBots)
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [user] = useAuthState(auth)
  const [canModify, setModify] = useState(false)
  const [currentTeam, setCurrentTeam] = useState(team)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const router = useRouter()
  const currentRole = user && currentTeam ? getUserRole(currentTeam, user.uid) : null
  const visibleBots =
    currentRole === 'none' && user && currentTeam
      ? bots.filter((bot) => canUserViewBot(currentTeam, bot, user.uid))
      : bots

  useEffect(() => {
    if (currentTeam && user) {
      setModify(canUserCreateDeleteBot(currentTeam, user?.uid))
    }
  }, [currentTeam, user])

  const handleCreateBot = () => {
    if (stripePlan(currentTeam).bots <= currentTeam.botCount) {
      setShowUpgrade(true)
    } else {
      router.push('/app/onboarding')
    }
  }

  const handleAddOnBillingUpdate = (billingUpdate = {}) => {
    if (!billingUpdate || Object.keys(billingUpdate).length === 0) return
    setCurrentTeam((current) => ({
      ...(current || {}),
      ...billingUpdate,
    }))
  }

  const BotsGrid = ({ bots, team, canModify: canModifyGrid }) => {
    const hasBots = bots && bots.length > 0

    return (
      <>
        {hasBots && (
          <p className="text-md font-bol mb-4 sm:text-base">
            These are your custom trained DocsBots. You can create a new one, or train them with new
            sources.
          </p>
        )}
        <ul
          role="list"
          className='md:grid-cols-2 mt-0 grid grid-cols-1 justify-items-center gap-6'
        >
          {hasBots && bots.map((bot) => (
            <BotItem
              key={bot.id}
              bot={bot}
              team={team}
              canModify={canModifyGrid}
            />
          ))}
          {canModify && (
            <li className={clsx(" w-full", hasBots ? 'col-span-1' : 'col-span-2')}>
              <BotCTA 
                onClick={handleCreateBot}
                className="group relative mx-auto flex h-full w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
              />
            </li>
          )}
        </ul>
      </>
    )
  }

  const BotItem = ({ bot, team, canModify: canModifyBot }) => {
    if (!bot || !bot.id) return null

    const brandColor = bot.color && bot.color.trim() ? bot.color : '#0ea5e9'
    let titleColor = '#fff'

    try {
      titleColor = decideTextColor(brandColor)
    } catch (error) {
      titleColor = '#fff'
    }

    const description =
      bot.description && bot.description.trim().length > 0
        ? bot.description
        : null

    const createdDate = new Date(bot.createdAt)
    const createdLabel = Number.isNaN(createdDate.getTime())
      ? bot.createdAt?.slice(0, 10) || '—'
      : createdDate.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })

    const privacyIsPrivate = bot.privacy === 'private'
    const PrivacyIconComponent = privacyIsPrivate ? EyeSlashIcon : EyeIcon
    const privacyLabel = privacyIsPrivate ? 'Private' : 'Public'

    const sourceCount = bot.sourceCount ?? 0
    const aiCreditCount = roundAiCreditsForDisplay(bot?.questionCount)

    return (
      <li className="col-span-1 w-full">
        <Link href={'/app/bots/' + bot.id} className="cover-link block h-full cursor-pointer">
          <div className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white/80 shadow-sm transition-all duration-200 hover:shadow-lg">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${circuitBg.src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            />
            <div
              className="absolute inset-0 mix-blend-color-burn"
              style={{ backgroundColor: `${brandColor}40` }} // 80 = 50% opacity in hex
            />
            <div className="relative flex h-full flex-col p-6 pb-0">
              <div className="flex h-full flex-col w-full max-w-md mx-auto">
                <div className="flex h-full flex-col rounded-t-2xl rounded-b-none border border-gray-200 bg-white shadow-lg shadow-gray-900/5 backdrop-blur pb-3 overflow-hidden border-b-0">
                  <div
                    className="relative flex flex-wrap items-center justify-between gap-3 pl-3 pr-4 py-3 shadow-sm"
                    style={{ background: `linear-gradient(to bottom, ${brandColor} 70%, ${brandColor}ee 100%)` }}
                  >
                    <div className="flex min-w-0 items-center gap-4 w-full">
                      <BotIconDisplay
                        bot={bot}
                        size="small"
                        className="shadow-none ring-1 ring-white/30 bg-white/10 rounded-xl"
                      />
                      <h3
                        className="truncate text-lg font-semibold leading-tight"
                        style={{ color: titleColor }}
                      >
                        {bot.name}
                      </h3>
                    </div>
                    {canModifyBot && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <BotCopyModal
                          team={team}
                          bot={bot}
                          iconOnly
                          iconColor={titleColor}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4 px-3 flex flex-1 flex-col justify-between">
                    {description ? (
                      <div className="max-w-prose rounded-2xl mr-4 rounded-tl-none bg-white px-4 py-3 text-sm text-gray-700 shadow-sm ring-1 ring-gray-100">
                        {description}
                      </div>
                    ) : null}

                    <div className="mt-4 ml-auto max-w-fit flex flex-wrap items-center gap-4 bg-gray-100 px-4 py-3 text-xs font-medium text-gray-600 rounded-2xl rounded-tr-none justify-end">
                      <div className="flex items-center gap-1.5">
                        <PrivacyIconComponent
                          className="h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="text-gray-700">{privacyLabel}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon
                          className="h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <time dateTime={bot.createdAt} className="text-gray-700">
                          {createdLabel}
                        </time>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DocumentDuplicateIcon
                          className="h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="text-gray-700">
                          <span className="text-gray-900">
                            <LocalStringNum value={sourceCount} />
                          </span>{' '}
                          {sourceCount === 1 ? 'Source' : 'Sources'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <QuestionMarkCircleIcon
                          className="h-4 w-4 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="text-gray-700">
                          <span className="text-gray-900">
                            <LocalStringNum value={aiCreditCount} />
                          </span>{' '}
                          {aiCreditCount === 1 ? 'AI Credit' : 'AI Credits'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {canModify ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setToDelete(bot)
                }}
                className="absolute right-4 top-4 z-0 rounded-full bg-transparent p-2 text-red-400 backdrop-blur-sm transition hover:bg-white hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                title="Delete"
              >
                <span className="sr-only">Delete</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
        </Link>
      </li>
    )
  }

  return (
    <DashboardWrap page="Bots" team={currentTeam} bots={bots}>
      <Alert title={errorText} type="warning" />
      <Alert title={successText} type="success" />

      <BotDelete
        team={currentTeam}
        setTeam={setCurrentTeam}
        bot={toDelete}
        setToDelete={setToDelete}
        setErrorText={setErrorText}
        bots={bots}
        setBots={setBots}
      />

      <ModalCheckout
        team={currentTeam}
        open={showUpgrade}
        setOpen={setShowUpgrade}
        showAddOns
        onTeamBillingUpdate={handleAddOnBillingUpdate}
        onError={setErrorText}
        onSuccess={setSuccessText}
      />

      <BotsGrid
        bots={visibleBots}
        team={currentTeam}
        canModify={canModify}
      />

    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    const role = getUserRole(data.props.team, data.props.userId)
    if (!data.props.team.botCount && role !== 'none') {
      return {
        redirect: {
          destination: '/app/onboarding',
          permanent: false,
        },
      }
    }

    const allBots = await getBots(data.props.team)
    data.props.preBots =
      role === 'none'
        ? allBots.filter((bot) => canUserViewBot(data.props.team, bot, data.props.userId))
        : allBots
  }

  return data
}

export default Bots
