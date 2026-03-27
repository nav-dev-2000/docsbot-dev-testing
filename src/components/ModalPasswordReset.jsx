import { Fragment, useEffect, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '@/config/firebase-ui.config'
import { Dialog, Transition } from '@headlessui/react'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'
import { LockClosedIcon, XMarkIcon } from '@heroicons/react/24/outline'

export default function ModalPasswordReset({ team }) {
  const [open, setOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')

  return (
    <>
      <a
        type="button"
        className="inline-flex cursor-pointer items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        onClick={() => setOpen(true)}
      >
        <LockClosedIcon className="mr-1 h-4 w-4" aria-hidden="true" />
        Reset Password
      </a>

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
                <Dialog.Panel className="relative transform rounded-lg bg-white p-6 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-xl">
                  <h3 className="inline-flex text-2xl font-bold">Reset Password</h3>
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
                  <div className="light mt-4 overflow-visible">
                    <Alert type="success" title={message} />
                    <Alert type="error" title={error} />
                    <p>
                      Are you sure you want to send a password reset link to{' '}
                      {auth.currentUser?.email}?
                    </p>
                  </div>
                  <div className="mt-6 flex w-full flex-shrink-0 items-end justify-end">
                    <button
                      onClick={() => {
                        setIsProcessing(true)
                        sendPasswordResetEmail(auth, auth.currentUser.email)
                          .then(() => {
                            // Password reset email sent!
                            setIsProcessing(false)
                            setMessage('Password reset email sent!')
                            setError(null)
                          })
                          .catch((error) => {
                            const errorCode = error.code
                            const errorMessage = error.message
                            setIsProcessing(false)
                            setError(errorMessage)
                            setMessage(null)
                          })
                      }}
                      disabled={isProcessing}
                      type="button"
                      className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                    >
                      {isProcessing ? (
                        <LoadingSpinner className="mr-2 h-4 w-4" />
                      ) : (
                        <LockClosedIcon className="mr-2 h-4 w-4" />
                      )}
                      Reset Password
                    </button>
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
