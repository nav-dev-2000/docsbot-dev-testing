import {
  CalendarIcon,
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
  DocumentDuplicateIcon,
  PaperClipIcon,
  CommandLineIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import BadgeStatus from '@/components/BadgeStatus'
import ModalChat from '@/components/ModalChat'
import ModalAPI from '@/components/ModalAPI'
import PrivacyStatus from '@/components/PrivacyStatus'
import Link from 'next/link'
import classNames from '@/utils/classNames'
import RobotIcon from '@/components/RobotIcon'
import ModalPrompt from '@/components/ModalPrompt'

export default function BotCard({ team, bot }) {
  if (!bot || !bot.id) {
    return null
  }

  let ts = new Date(bot.createdAt)

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <h2 className="sr-only" id="profile-overview-title">
        {bot.name} Bot Overview
      </h2>
      <div className="bg-white p-6">
        <div className="lg:flex lg:items-center lg:justify-between">
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 p-3 shadow-lg">
                <RobotIcon className="h-8 w-8 text-cyan-100 sm:h-10 sm:w-10" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{bot.name}</p>
              <p className="text-sm text-gray-600">{bot.description}</p>
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
                <ModalPrompt team={team} bot={bot} />
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between sm:mt-0 lg:block">
            <div className="flex flex-shrink-0 justify-center sm:justify-end">
              <BadgeStatus status={bot.status} small={false} />
            </div>
            <div className="flex justify-end space-x-2 sm:mt-5">
              <ModalChat team={team} bot={bot} />
            </div>
            <div className="flex justify-end space-x-4 sm:mt-1">
              <Link
                target="_blank"
                type="button"
                className={classNames(
                  bot.privacy === 'private' || bot.status !== 'ready'
                    ? 'cursor-not-allowed opacity-50'
                    : '',
                  'mt-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900'
                )}
                href={`/chat/${team.id}/${bot.id}`}
                onClick={(e) => {
                  if (bot.privacy === 'private' || bot.status !== 'ready') {
                    e.preventDefault()
                  }
                }}
              >
                <PaperClipIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
                Share
              </Link>
              <ModalAPI team={team} bot={bot} />
            </div>
          </div>
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
    </div>
  )
}
