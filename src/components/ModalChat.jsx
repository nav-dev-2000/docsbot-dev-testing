import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Chat from '@/components/ChatAgent'
import TipsTooltip from '@/components/TipsTooltip'
import Tooltip from '@/components/Tooltip'

export default function ModalChat({ team, bot }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Tooltip content="Chat with your bot">
        <button
          className="inline-flex items-center justify-center gap-x-2 rounded-md bg-cyan-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:from-teal-700 hover:to-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={bot.status !== 'ready'}
          onClick={() => setOpen(true)}
        >
          <ChatBubbleLeftEllipsisIcon
            className="h-6 w-6 text-white"
            aria-hidden="true"
          />
          Chat
        </button>
      </Tooltip>

      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-modal" onClose={setOpen}>
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

          <div className="fixed inset-0 z-modal overflow-y-auto">
            <div className="flex min-h-full items-start justify-center text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-y-auto rounded-lg bg-gray-50 pb-8 text-left shadow-xl w-full h-[100dvh] sm:my-8 sm:max-w-7xl sm:rounded-lg sm:max-h-[90vh]">
                  <TipsTooltip />
                  <div className="absolute right-0 top-0 z-20 pr-4 pt-4 sm:block">
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <Chat team={team} bot={bot} showResearchMode={true} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
