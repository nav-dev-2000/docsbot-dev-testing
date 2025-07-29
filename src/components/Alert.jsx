import { useState, useEffect, useRef } from 'react'
import { noop } from '@/utils/function.utils'
import { XCircleIcon } from '@heroicons/react/20/solid'
import { ExclamationTriangleIcon } from '@heroicons/react/20/solid'
import { CheckCircleIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { InformationCircleIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import * as cookie from 'cookie'

// Utility functions for managing preferences cookie
const getPreferences = () => {
  if (typeof window === 'undefined') return {}
  try {
    const cookies = cookie.parse(document.cookie || '')
    const prefsValue = cookies['docsbot-prefs']
    if (!prefsValue) return {}
    
    // The cookie.parse automatically URL decodes, but let's be explicit about JSON parsing
    const decoded = decodeURIComponent(prefsValue)
    const parsed = JSON.parse(decoded)
    return parsed
  } catch (error) {
    console.error('Failed to parse preferences cookie:', error)
    return {}
  }
}

const setPreference = (key, value) => {
  if (typeof window === 'undefined') return
  try {
    const prefs = getPreferences()
    prefs[key] = value
    const expires = new Date()
    expires.setDate(expires.getDate() + 365)
    document.cookie = cookie.serialize('docsbot-prefs', JSON.stringify(prefs), {
      expires,
      path: '/',
      sameSite: 'lax'
    })
  } catch (error) {
    console.error('Failed to set preference:', error)
  }
}

const isAlertDismissed = (dismissKey) => {
  if (!dismissKey) return false
  const prefs = getPreferences()
  return prefs[`dismissed-${dismissKey}`] === true
}

export default function Alert({ title, type, children, onClose = noop, dismissKey }) {
  const [show, setShow] = useState(true)
  const alertRef = useRef(null);



  let icon = null
  let color = null
  if (type === 'error') {
    icon = <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
    color = 'red'
  } else if (type === 'warning') {
    icon = (
      <ExclamationTriangleIcon
        className="h-5 w-5 text-yellow-400"
        aria-hidden="true"
      />
    )
    color = 'yellow'
  } else if (type === 'success') {
    icon = (
      <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
    )
    color = 'green'
  } else {
    icon = (
      <InformationCircleIcon
        className="h-5 w-5 text-blue-400"
        aria-hidden="true"
      />
    )
    color = 'blue'
  }

  //show whenever params change, but respect dismissal preferences
  useEffect(() => {
    if (dismissKey && isAlertDismissed(dismissKey)) {
      setShow(false)
    } else {
      setShow(true)
    }
    return () => {
      if (alertRef.current && type === 'error') {
        alertRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [title, children, type, dismissKey])
  

  if (!show || !title) return null

  return (
    <div
      className={clsx(
        'my-4 rounded-md p-4 text-left break-words',
        {
          'bg-red-50': type === 'error',
          'bg-yellow-50': type === 'warning', 
          'bg-green-50': type === 'success',
          'bg-blue-50': type !== 'error' && type !== 'warning' && type !== 'success'
        }
      )}
      ref={alertRef}
    >
      <div className="flex">
        <div className="flex-shrink-0">{icon}</div>
        <div className="ml-3 w-full">
          <h3
            className={clsx(
              'text-md font-semibold',
              {
                'text-red-800': type === 'error',
                'text-yellow-800': type === 'warning',
                'text-green-800': type === 'success',
                'text-blue-800': type !== 'error' && type !== 'warning' && type !== 'success'
              }
            )}
          >
            {title}
          </h3>
          {children && (
            <div
              className={clsx(
                'mt-2 text-sm overflow-hidden',
                {
                  'text-red-700': type === 'error',
                  'text-yellow-700': type === 'warning',
                  'text-green-700': type === 'success',
                  'text-blue-700': type !== 'error' && type !== 'warning' && type !== 'success'
                }
              )}
            >
              {children}
            </div>
          )}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              type="button"
              onClick={() => {
                setShow(false)
                if (dismissKey) {
                  setPreference(`dismissed-${dismissKey}`, true)
                }
                onClose()
              }}
              className={clsx(
                'inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2',
                {
                  'bg-red-50 text-red-500 hover:bg-red-100 focus:ring-red-600 focus:ring-offset-red-50': type === 'error',
                  'bg-yellow-50 text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 focus:ring-offset-yellow-50': type === 'warning',
                  'bg-green-50 text-green-500 hover:bg-green-100 focus:ring-green-600 focus:ring-offset-green-50': type === 'success',
                  'bg-blue-50 text-blue-500 hover:bg-blue-100 focus:ring-blue-600 focus:ring-offset-blue-50': type !== 'error' && type !== 'warning' && type !== 'success'
                }
              )}
            >
              <span className="sr-only">Dismiss</span>
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
