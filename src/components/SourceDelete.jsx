import { useState, useEffect, useRef } from 'react'

export default function SourceDelete({ team, bot, source, setToDelete, setErrorText, sources, setSources }) {
  const [submitting, setSubmitting] = useState(false)
  const alertRef = useRef(null);

  async function submitDelete() {
    setErrorText('')
    setSubmitting(true)
    const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}/sources/${source.id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      const deleting = source.id
      setSources(sources.filter((source) => source.id !== deleting))
      setToDelete(null)
      setSubmitting(false)
      //reload page
      window.location.reload()
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setSubmitting(false)
    }
  }

  //show whenever params change
  useEffect(() => {
    return () => {
      if (alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [source])

  if (!source) return null

  return (
    <div className="mb-6 flex justify-between bg-white shadow sm:rounded-lg" ref={alertRef}>
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Delete source {source.name}?</h3>
        <div className="text-md mt-2 text-gray-500">
            <p>
              Once you delete this source, it will not be recoverable! Are you sure you'd like to delete this source?
            </p>
        </div>
        <div className="mt-5">
          <div className="flex justify-start">
            <button
              onClick={() => setToDelete(null)}
              disabled={submitting}
              type="button"
              className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
            >
              Cancel
            </button>
            <button
              onClick={submitDelete}
                disabled={submitting}
              type="button"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-red-100 px-4 py-2 font-medium text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:text-sm disabled:opacity-25 disabled:cursor-not-allowed"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
