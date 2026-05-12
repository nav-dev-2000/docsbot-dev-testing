import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { useSignInWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth'
import clsx from 'clsx'

import { auth } from '@/config/firebase-ui.config'
import { sendPasswordResetEmail } from 'firebase/auth'
import { hasAuthenticationError } from '@/utils/firebase.utils'
import { routePaths } from '@/constants/routePaths.constants'
import { nonProtectedRouteRedirect } from '@/middleware/nonProtectedRouteRedirect'
import { postAuth } from '@/api/postAuth'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'
import { Logo } from '@/components/Logo'
import { GoogleLogo } from '@/components/GoogleLogo'
import { useRegisterGoogleUser } from '@/hooks/useRegisterGoogleUser'
import LoadingSpinner from '@/components/LoadingSpinner'
import { NextSeo } from 'next-seo'
import { usePostHog } from 'posthog-js/react'

function Login() {
  const router = useRouter()
  const { register, handleSubmit, watch, getValues } = useForm()
  const [authError, setAuthError] = useState('')
  const [redirectPath, setRedirectPath] = useState(routePaths.APP)
  const [authLoading, setAuthLoading] = useState(false)
  const posthog = usePostHog()

  //set redirect path from query param
  useEffect(() => {
    const redirectParam = router.query.redirect
    if (typeof redirectParam !== 'string') return

    const decodedRedirect = decodeURIComponent(redirectParam)
    const isYearInReviewShare = /^\/\d{4}-in-review\/[A-Za-z0-9]{20}$/.test(
      decodedRedirect,
    )
    // Slack Marketplace OAuth: user returns here after login to pick team + bot
    const isSlackConnectedRedirect = decodedRedirect.startsWith('/app/slack/connected')

    const isAllowedRedirect =
      Object.values(routePaths).includes(decodedRedirect) ||
      isYearInReviewShare ||
      isSlackConnectedRedirect

    if (isAllowedRedirect) {
      setRedirectPath(decodedRedirect)
    }
  }, [router.query.redirect])

  const [signInWithEmailAndPassword, user, userAuthLoading, error] =
    useSignInWithEmailAndPassword(auth)
  const [signInWithGoogle, googleUser, googleAuthLoading] = useSignInWithGoogle(auth)

  const isAnyAuthMethodLoading = userAuthLoading || googleAuthLoading || authLoading

  useEffect(() => {
    const subscription = watch((_) => setAuthError(''))
    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    setAuthError(error)
  }, [error])

  const authorizeUser = useCallback(postAuth, [])
  useEffect(() => {
    if (user && !userAuthLoading) {
      setAuthLoading(true)
      authorizeUser({
        accessToken: user?.user?.accessToken,
        name: null,
        isNewUser: false,
        onComplete: () => {
          if (window.bento !== undefined) {
            window.bento.identify(user?.user?.email)
          }
          if (!posthog?._isIdentified()) {
            posthog?.identify(user.user.uid, { email: user.user.email })
          }
          router.push(redirectPath)
        },
      })
    }
  }, [user, userAuthLoading, router, authorizeUser])

  useRegisterGoogleUser({
    googleUser,
    googleAuthLoading,
    setAuthLoading,
    onComplete: () => {
      if (window.bento !== undefined) {
        window.bento.identify(googleUser?.user?.email)
        window.bento.updateFields({ name: googleUser?.user?.displayName })
      }
      if (window.fpr !== undefined) {
        window.fpr("referral",{email: googleUser?.user?.email})
      }
      if (!posthog?._isIdentified()) {
        posthog?.identify(googleUser.user.uid, { email: googleUser.user.email, name: googleUser.user.displayName })
      }
      posthog?.capture('Signup', { method: 'Google' })
      if (Math.random() < 0.5) {
        posthog?.startSessionRecording()
      }
      router.push(redirectPath)
    },
  })

  return (
    <>
      <NextSeo title="Sign In - DocsBot" description="Login to your DocsBot account." />
      <AuthLayout
        title="Sign in to account"
        subtitle={
          <>
            Don’t have an account?{' '}
            <Link href="/register" className="text-teal-100">
              Sign up
            </Link>{' '}
            to get started.
          </>
        }
      >
        {isAnyAuthMethodLoading ? (
          <div className="flex h-64 items-center justify-center text-2xl">
            <LoadingSpinner large={true} /> <span className="ml-3">Loading...</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(async ({ email, password }) => {
              signInWithEmailAndPassword(email, password)
            })}
            action="#"
            className="mt-10 grid grid-cols-1 gap-y-8"
          >
            <TextField
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              required
            />
            <TextField
              label="Password"
              id="password"
              name="password"
              type="password"
              {...register('password')}
              autoComplete="current-password"
              required
            />
            {hasAuthenticationError(authError) && (
              <span className="mb-1 mt-1 inline-flex items-center rounded-md bg-red-100 p-3 text-sm font-medium text-red-800">
                Username or password is incorrect.{' '}
                <button
                  className="ml-1 underline"
                  onClick={(e) => {
                    e.preventDefault()
                    sendPasswordResetEmail(auth, getValues('email'))
                      .then(() => {
                        // Password reset email sent!
                        alert('Password reset email sent!')
                      })
                      .catch((error) => {
                        const errorCode = error.code
                        const errorMessage = error.message
                        alert('Please check the email address you entered and try again.')
                      })
                  }}
                >
                  Forgot password?
                </button>
              </span>
            )}
            <div>
              <Button
                type="submit"
                variant="solid"
                color="blue"
                className={clsx('w-full', {
                  'opacity-75': isAnyAuthMethodLoading,
                })}
                disabled={isAnyAuthMethodLoading ? 'disabled' : ''}
              >
                <span>
                  Sign in <span aria-hidden="true">&rarr;</span>
                </span>
              </Button>
            </div>
            <div style={{ marginTop: '-15px' }}>
              <Button
                variant="outline"
                color="slate"
                className={clsx('w-full', {
                  'opacity-75': isAnyAuthMethodLoading,
                })}
                disabled={isAnyAuthMethodLoading ? 'disabled' : ''}
                onClick={(e) => {
                  e.preventDefault()
                  signInWithGoogle()
                }}
              >
                <span className="mr-3">
                  <GoogleLogo />
                </span>
                <span>Sign in with Google</span>
              </Button>
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  )
}

export const getServerSideProps = nonProtectedRouteRedirect

export default Login
