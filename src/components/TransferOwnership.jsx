import { useState, useEffect, useRef } from 'react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function TransferOwnership({
  team,
  transferToUser,
  setTransferToUser,
  setErrorText,
  setSuccessText,
  setCurrTeamUsers,
  setCurrTeam,
}) {
  const [submitting, setSubmitting] = useState(false)
  const alertRef = useRef(null)

  async function submitTransfer() {
    if (submitting) {
      return
    }

    setErrorText('')
    setSuccessText('')
    setSubmitting(true)

    const response = await fetch(`/api/teams/${team.id}/members`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        memberId: transferToUser.uid,
        role: 'owner',
        transferOwnership: true,
      }),
    })

    if (response.ok) {
      const data = await response.json()
      setSuccessText(`Ownership successfully transferred to ${transferToUser.displayName || transferToUser.email}`)
      setCurrTeamUsers(data.teamUsers)
      if (data.team) {
        setCurrTeam(data.team)
      }
      setTransferToUser(null)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
    setSubmitting(false)
  }

  //show whenever params change
  useEffect(() => {
    return () => {
      if (alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [transferToUser])

  if (!transferToUser) return null

  return (
    <div className="mt-8 flex justify-between bg-white shadow sm:rounded-lg" ref={alertRef}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Transfer ownership to {transferToUser.displayName || transferToUser.email}?
            </h3>
            <div className="mt-2 text-sm text-gray-500">
              <p className="mb-2">
                You are about to transfer team ownership to <strong>{transferToUser.displayName || transferToUser.email}</strong>.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Once ownership is transferred, only the new owner can change it back</li>
                <li>Your role will be changed to admin</li>
                <li>The new owner will be able to delete your account membership</li>
              </ul>
            </div>
            <div className="mt-5">
              <div className="flex justify-start">
                <button
                  onClick={() => setTransferToUser(null)}
                  disabled={submitting}
                  type="button"
                  className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  Cancel
                </button>
                <button
                  onClick={() => submitTransfer()}
                  disabled={submitting}
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-yellow-600 px-4 py-2 font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25 sm:text-sm"
                >
                  Transfer Ownership
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
