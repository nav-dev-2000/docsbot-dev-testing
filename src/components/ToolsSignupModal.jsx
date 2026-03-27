import { Dialog } from '@headlessui/react'
import { useSignInWithGoogle } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { useRouter } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { GoogleLogo } from '@/components/GoogleLogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useState, useEffect, useCallback, useRef } from 'react'
import { usePostHog } from 'posthog-js/react'
import { useRegisterGoogleUser } from '@/hooks/useRegisterGoogleUser'
import { getIsNewGmailUser } from '@/utils/firebase.utils'
import Link from 'next/link'

export default function ToolsSignupModal({
  open,
  setOpen,
  toolName,
  toolCategory,
}) {
  const [user] = useAuthState(auth)
  const router = useRouter()
  const [signInWithGoogle, googleUser, googleAuthLoading, error] =
    useSignInWithGoogle(auth)
  const [authLoading, setAuthLoading] = useState(false)
  const posthog = usePostHog()
  const [hasTracked, setHasTracked] = useState(false)
  const [registrationComplete, setRegistrationComplete] = useState(false)
  const isNewUserRef = useRef(false)

  const handleBentoTracking = useCallback(() => {
    if (hasTracked || !googleUser?.user?.email) return
    
    if (typeof window !== 'undefined' && window.bento) {
      try {
        window.bento.identify(googleUser?.user?.email)
        window.bento.updateFields({
          name: googleUser?.user?.displayName,
          usage_type: 'tools',
          tool: toolName,
          tool_category: toolCategory,
        })
        window.bento.track('toolsSignup')
        setHasTracked(true)
      } catch (e) {
        console.error('Bento error:', e)
      }
    }
  }, [googleUser?.user, toolName, toolCategory, hasTracked])

  // Handle PostHog tracking separately with useEffect
  useEffect(() => {
    if (!registrationComplete || !googleUser || !isNewUserRef.current) return;
    
    // Handle FirstPromoter tracking
    if (window.fpr !== undefined) {
      window.fpr('referral', { email: googleUser?.user?.email })
    }
    
    // Handle PostHog tracking - only if not already identified
    if (!posthog?._isIdentified()) {
      posthog?.identify(googleUser.user.uid, {
        email: googleUser.user.email,
        name: googleUser.user.displayName,
        'Usage Type': 'tools',
        'Signup Source': toolName,
        'Tool Category': toolCategory,
      })
    }
    
    // Capture signup event only once
    posthog?.capture('Signup', {
      provider: 'google',
      usage_type: 'tools',
      tool: toolName,
      tool_category: toolCategory,
    })
    
  }, [registrationComplete, googleUser, posthog, toolName, toolCategory]);

  useRegisterGoogleUser({
    googleUser,
    googleAuthLoading,
    setAuthLoading,
    onComplete: () => {
      const isNewUser = getIsNewGmailUser(googleUser)
      isNewUserRef.current = isNewUser
      
      if (isNewUser) {
        handleBentoTracking()
      }
      
      setRegistrationComplete(true)
      setOpen(false)
    },
  })

  // If the user is already signed in, don't show the modal
  if (user) {
    return null
  }

  return (
    <Dialog open={open} onClose={() => {}} className="relative z-modal">
      <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="high flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel className="relative isolate transform overflow-hidden rounded-lg bg-gray-900 px-6 py-12 text-center shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:rounded-3xl sm:px-16">
            <div className="mx-auto mb-2 w-fit rounded-lg bg-red-600 px-4 py-0.5 text-center text-sm font-semibold text-white shadow-md">
              Daily Usage Exceeded
            </div>
            <h2 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Double Your Daily Free Usage
            </h2>
            <p className="mx-auto mt-6 text-pretty text-lg/8 text-gray-300">
              Sign up for a free account to increase your daily usage limit for{' '}
              {toolName} & <strong>20+ other AI tools!</strong> Expect
              occasional updates about new free AI tools and features. No spam,
              unsubscribe anytime.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center space-y-4">
              {googleAuthLoading || authLoading ? (
                <div className="flex items-center space-x-3 font-semibold text-white">
                  <LoadingSpinner />
                  <span>Signing you in...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-2 rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
                  >
                    <GoogleLogo className="mr-2 h-5 w-5" />
                    Continue with Google
                  </button>
                  <p className="text-sm text-gray-300">
                    By continuing, you agree to our{' '}
                    <Link
                      href="/legal/terms-of-service"
                      target="_blank"
                      className="underline hover:text-white"
                    >
                      Terms of Service
                    </Link>{' '}
                    &{' '}
                    <Link
                      href="/legal/privacy-policy"
                      target="_blank"
                      className="underline hover:text-white"
                    >
                      Privacy Policy
                    </Link>
                  </p>
                </>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-200">
                There was an error signing in. Please try again.
              </p>
            )}

            <svg
              viewBox="0 0 1024 1024"
              aria-hidden="true"
              className="absolute left-1/2 top-1/2 -z-10 h-[64rem] w-[64rem] -translate-x-1/2 [mask-image:radial-gradient(closest-side,white,transparent)]"
            >
              <circle
                cx={512}
                cy={512}
                r={512}
                fill="url(#gradient)"
                fillOpacity="0.7"
              />
              <defs>
                <radialGradient id="gradient">
                  <stop stopColor="#06b6d4" />
                  <stop offset={1} stopColor="#0891b2" />
                </radialGradient>
              </defs>
            </svg>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  )
}
