import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import AddOnsManager from '@/components/AddOnsManager'
import Checkout from '@/components/Checkout'
import { ADD_ON_IDS } from '@/utils/billingAddOns'
import { XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function ModalCheckout({
  team,
  open,
  setOpen,
  showAddOns = false,
  addOnFocusId = ADD_ON_IDS.BOTS,
  addOnTitle = 'Add bot capacity',
  addOnDescription = 'Add another bot without changing plans. Add-ons renew on your billing cycle, and changes are prorated on your next invoice.',
  teamInvites = [],
  onTeamBillingUpdate = null,
  onError = null,
  onSuccess = null,
}) {
  return (
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    onClick={() => setOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                <div className="p-6">
                  <p className="mb-8 text-center text-gray-500">
                    You've reached the limit of your current plan or must upgrade to enable this
                    feature. View{' '}
                    <Link href="/pricing" target="_blank" className="underline">
                      plan details
                    </Link>
                    .
                  </p>
                  <Checkout team={team} upgrade={true} showBillingPortalSection={false} />
                  {showAddOns && (
                    <AddOnsManager
                      team={team}
                      focusAddOnId={addOnFocusId}
                      teamInvites={teamInvites}
                      className="mb-8"
                      title={addOnTitle}
                      description={addOnDescription}
                      headerCentered
                      onTeamBillingUpdate={onTeamBillingUpdate}
                      onError={onError}
                      onSuccess={onSuccess}
                    />
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
