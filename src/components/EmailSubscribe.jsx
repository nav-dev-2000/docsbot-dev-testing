import React, { useState } from 'react'

export default function EmailSubscribe() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    fetch('/api/waitlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Success:', data)
        setSubmitted(true)
      })
      .catch((error) => {
        console.error('Error:', error)
        setSubmitted(false)
      })
  }

  return (
    <div
      id="signup"
      className="pt-8 lg:flex lg:items-center lg:justify-between"
    >
      <div>
        <h3 className="text-sm/6 font-semibold text-gray-900">
          Subscribe to product updates
        </h3>
        <p className="mt-2 text-sm/6 text-gray-600">
          The latest news and updates, sent to your inbox occasionally.
        </p>
      </div>
      {submitted ? (
        <div className="mt-6 sm:mx-auto sm:flex sm:max-w-lg">
          <div className="min-w-0 flex-1">
            <p className="text-center text-xl font-medium text-cyan-700">
              Thanks for signing up!
            </p>
          </div>
        </div>
      ) : (
        <form
          className="mt-6 sm:flex sm:max-w-md lg:mt-0"
          onSubmit={handleSubmit}
        >
          <label htmlFor="email-address" className="sr-only">
            Email address
          </label>
          <input
            id="email-address"
            name="email-address"
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            autoComplete="email"
            className="w-full min-w-0 appearance-none rounded-md border-0 bg-white px-3 py-1.5 text-base text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:w-56 sm:text-sm/6"
          />
          <div className="mt-4 sm:ml-4 sm:mt-0 sm:flex-shrink-0">
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              Subscribe
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
