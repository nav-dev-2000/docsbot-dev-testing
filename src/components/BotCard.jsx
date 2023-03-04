import {
  BookOpenIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import BadgeStatus from '@/components/BadgeStatus'
import ChatModal from '@/components/ChatModal'
import APIModal from '@/components/APIModal'

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
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center space-x-5">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 p-3 shadow-lg">
                <BookOpenIcon
                  className="h-8 w-8 text-cyan-100 sm:h-10 sm:w-10"
                  aria-hidden="true"
                />
              </span>
            </div>
            <div className="mt-4 sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{bot.name}</p>
              <p className="text-sm text-gray-600">{bot.description}</p>
              <div className="mt-2 flex">
                <div className="sm:flex">
                  <p className="flex items-center text-sm capitalize text-gray-500">
                    <EyeIcon
                      className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    {bot.privacy}
                  </p>
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
          </div>
          <div className="mt-4 flex justify-between sm:mt-0 sm:block">
            <div className="flex flex-shrink-0 justify-center sm:justify-end">
              <BadgeStatus status={bot.status} small={false} />
            </div>
            <div className="flex justify-between space-x-2 sm:mt-5">
              <button
                className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={true}
              >
                <ChatBubbleLeftRightIcon
                  className="mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                Chat (coming soon)
              </button>

              <ChatModal team={team} bot={bot} />
            </div>
            <APIModal team={team} bot={bot} />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        <div className="px-6 py-5 text-center text-sm font-medium flex items-center justify-center space-x-1">
        <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-gray-900">{bot.sourceCount}</span>{' '}
          <span className="text-gray-600">Sources</span>
        </div>
        <div className="px-6 py-5 text-center text-sm font-medium flex items-center justify-center space-x-1">
          <Square3Stack3DIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-gray-900">{bot.pageCount}</span>{' '}
          <span className="text-gray-600">Indexed pages</span>
        </div>
        <div className="px-6 py-5 text-center text-sm font-medium flex items-center justify-center space-x-1">
          <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
          <span className="text-gray-900">{bot.questionCount}</span>{' '}
          <span className="text-gray-600">Questions</span>
        </div>
      </div>
    </div>
  )
}
