import Link from 'next/link'
import Image from 'next/future/image'
import { useState, useEffect } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import BotCTA from '@/components/BotCTA'
import BadgeStatus from '@/components/BadgeStatus'
import {
  CalendarIcon,
  DocumentPlusIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  Square3Stack3DIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { getBots } from '@/lib/dbQueries'
import BotDelete from '@/components/BotDelete'
import NewBotPanel from '@/components/NewBotPanel'
import ModalOpenAI from '@/components/ModalOpenAI'
import classNames from '@/utils/classNames'
import PrivacyStatus from '@/components/PrivacyStatus'

function Bots({ preBots, team }) {
  const [bots, setBots] = useState(preBots)
  const [errorText, setErrorText] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!team.botCount) {
      setOpen(true)
    }
  }, [])

  const BotsGrid = ({ bots }) => {
    if (!bots || bots.length === 0) {
      return null
    }

    return (
      <>
        <p className="text-md font-bol mb-4 sm:text-base">
          These are your custom trained DocsBots. You can create a new one, or train them with new
          sources.
        </p>
        <ul
          role="list"
          className={classNames(
            bots.length > 1 ? 'xl:grid-cols-2' : '',
            'mt-0 grid grid-cols-1 gap-6'
          )}
        >
          {bots.map((bot) => (
            <BotItem key={bot.id} bot={bot} />
          ))}
        </ul>
      </>
    )
  }

  const BotItem = ({ bot }) => {
    if (!bot || !bot.id) return null

    let ts = new Date(bot.createdAt)

    return (
      <li
        key={bot.id}
        className="col-span-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow hover:shadow-lg"
      >
        <Link href={'/app/bots/' + bot.id} className="cover-link">
          <div className="relative flex w-full items-start justify-between space-x-6 p-6">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="truncate text-lg font-medium text-gray-900">{bot.name}</h3>
              </div>
              <p className="mt-1 truncate text-sm text-gray-700">{bot.description}</p>
              <div className="mt-2 flex">
                <div className="sm:flex">
                  <PrivacyStatus bot={bot} />
                </div>
                <div className="ml-4 flex items-center text-sm text-gray-500">
                  <CalendarIcon
                    className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <p>
                    <time dateTime={bot.createdAt}>{ts.toLocaleString()}</time>
                  </p>
                </div>
              </div>
            </div>
            <div className="grid flex-shrink-0">
              <div className="mt-2 mb-10 flex justify-center sm:mb-6">
                <BadgeStatus status={bot.status} small={true} />
              </div>

              <div className="flex justify-end">
                <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 p-3 shadow-lg">
                  <BookOpenIcon className="h-6 w-6 text-cyan-200" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setToDelete(bot)
                }}
                className=" text-red-400 hover:text-red-200 focus:text-red-200"
                title="Delete"
              >
                <span className="sr-only">Delete</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{bot.sourceCount}</span>{' '}
              <span className="text-gray-600">Sources</span>
            </div>
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <Square3Stack3DIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{bot.pageCount}</span>{' '}
              <span className="text-gray-600">Indexed pages</span>
            </div>
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{bot.questionCount}</span>{' '}
              <span className="text-gray-600">Questions</span>
            </div>
          </div>
        </Link>
      </li>
    )
  }

  return (
    <DashboardWrap page="Bots">
      <Alert title={errorText} type="error" />

      <BotDelete
        team={team}
        bot={toDelete}
        setToDelete={setToDelete}
        setErrorText={setErrorText}
        bots={bots}
        setBots={setBots}
      />

      <BotsGrid bots={bots} />

      <BotCTA {...{ setOpen }} />

      <NewBotPanel {...{ team, open, setOpen }} />

      <ModalOpenAI {...{ team }} />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    data.props.preBots = await getBots(data.props.team)
  }

  return data
}

export default Bots
