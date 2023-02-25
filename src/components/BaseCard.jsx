import {
  BookOpenIcon,
  CalendarIcon,
  ChatBubbleLeftEllipsisIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import BadgeStatus from './BadgeStatus'

export default function BaseCard({ base, canGenerate }) {
  if (!base || !base.id) {
    return null
  }

  let ts = new Date(base.createdAt)

  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <h2 className="sr-only" id="profile-overview-title">
        {base.name} Base Overview
      </h2>
      <div className="bg-white p-6">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex space-x-5 items-center">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 p-3 shadow-lg">
                <BookOpenIcon className="h-8 w-8 sm:h-10 sm:w-10 text-cyan-100" aria-hidden="true" />
              </span>
            </div>
            <div className="mt-4 sm:mt-0 sm:pt-1 sm:text-left">
              <p className="text-xl font-bold text-gray-900 sm:text-2xl">{base.name}</p>
              <p className="text-sm text-gray-600">{base.description}</p>
              <div className="mt-2 flex">
                <div className="sm:flex">
                  <p className="flex items-center text-sm capitalize text-gray-500">
                    <EyeIcon
                      className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                      aria-hidden="true"
                    />
                    {base.privacy}
                  </p>
                </div>
                <div className="flex items-center text-sm text-gray-500 ml-4">
                  <CalendarIcon
                    className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                  />
                  <p>
                    <time dateTime={base.createdAt}>{ts.toLocaleString()}</time>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-between sm:block sm:mt-0">
            <div className="flex justify-center sm:justify-end flex-shrink-0">
              <BadgeStatus status={base.status} small={false} />
            </div>
            <div className="flex justify-between space-x-2 sm:mt-5">
              <button className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <ChatBubbleLeftRightIcon
                  className="mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                Chat
              </button>

              <button className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
                <ChatBubbleLeftEllipsisIcon
                  className="mr-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
                Q / A
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
        <div className="px-6 py-5 text-center text-sm font-medium">
          <span className="text-gray-900">{base.sourceCount}</span>{' '}
          <span className="text-gray-600">Sources</span>
        </div>
        <div className="px-6 py-5 text-center text-sm font-medium">
          <span className="text-gray-900">{base.pageCount}</span>{' '}
          <span className="text-gray-600">Indexed pages</span>
        </div>
        <div className="px-6 py-5 text-center text-sm font-medium">
          <span className="text-gray-900">35,000</span>{' '}
          <span className="text-gray-600">Questions</span>
        </div>
      </div>
    </div>
  )
}
