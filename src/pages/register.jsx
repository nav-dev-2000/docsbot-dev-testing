import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { useEffect, useState, useCallback } from 'react'
import { useCreateUserWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'

import { auth } from '@/config/firebase-ui.config'
import { postAuth } from '@/api/postAuth'
import { routePaths } from '@/constants/routePaths.constants'
import { useRegisterGoogleUser } from '@/hooks/useRegisterGoogleUser'
import { hasRegistrationError } from '@/utils/firebase.utils'
import { nonProtectedRouteRedirect } from '@/middleware/nonProtectedRouteRedirect'
import { AuthLayout } from '@/components/AuthLayout'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'
import { GoogleLogo } from '@/components/GoogleLogo'
import LoadingSpinner from '@/components/LoadingSpinner'

function Register() {
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm()
  const [authError, setAuthError] = useState('')
  const [redirectPath, setRedirectPath] = useState(routePaths.APP)
  const [authLoading, setAuthLoading] = useState(false)

  //set redirect path from query param
  useEffect(() => {
    if (router.query.redirect) {
      //check if redirect path is valid
      if (Object.values(routePaths).includes(router.query.redirect)) {
        setRedirectPath(router.query.redirect)
        console.log('redirect path set to', router.query.redirect)
      }
    }
  }, [router.query.redirect])

  const [createUserWithEmailAndPassword, user, userAuthLoading, error] =
    useCreateUserWithEmailAndPassword(auth)
  const [signInWithGoogle, googleUser, googleAuthLoading] = useSignInWithGoogle(auth)
  const [checked, setChecked] = useState(false)
  const handleTos = () => {
    setChecked(!checked)
  }

  useEffect(() => {
    const subscription = watch((_) => setAuthError(''))
    return () => subscription.unsubscribe()
  }, [watch])

  useEffect(() => {
    setAuthError(error)
  }, [error])

  const isAnyAuthMethodLoading = userAuthLoading || googleAuthLoading || authLoading

  const authorizeUser = useCallback(postAuth, [])
  useEffect(() => {
    if (user && !userAuthLoading) {
      setAuthLoading(true)
      authorizeUser({
        accessToken: user?.user?.accessToken,
        name: user?.user?.email,
        isNewUser: true,
        onComplete: () => {
          if (window.bento !== undefined) {
            window.bento.identify(user?.user?.email)
          }
          if (window.Reflio !== undefined) {
            Reflio.signup(user?.user?.email)
          }
          console.log('on complete')
          router.push(redirectPath)
        },
      })
    }
  }, [user, userAuthLoading, authorizeUser, router])

  useRegisterGoogleUser({
    googleUser,
    authLoading,
    setAuthLoading,
    onComplete: () => {
      if (window.bento !== undefined) {
        window.bento.identify(googleUser?.user?.email)
        window.bento.updateFields({ name: googleUser?.user?.displayName })
      }
      if (window.Reflio !== undefined) {
        Reflio.signup(googleUser?.user?.email)
      }
      router.push(redirectPath)
    },
  })

  return (
    <>
      <Head>
        <title key="title">Sign Up - DocsBot</title>
      </Head>
      <AuthLayout
        title="Get started now"
        subtitle={
          <>
            Already registered?{' '}
            <Link href={routePaths.LOGIN} className="font-medium text-teal-100 hover:underline">
              Sign in
            </Link>{' '}
            to your account.
          </>
        }
      >
        {isAnyAuthMethodLoading ? (
          <div className="flex h-64 items-center justify-center text-2xl">
            <LoadingSpinner large={true} /> <span className="ml-3">Loading...</span>
          </div>
        ) : (
          <form
            action="#"
            className="mt-10 grid grid-cols-1 gap-y-8 gap-x-6 sm:grid-cols-2"
            onSubmit={handleSubmit(({ email, password }) => {
              if (!checked) {
                alert('Please agree to the Terms of Service and Privacy Policy')
                return
              }
              createUserWithEmailAndPassword(email, password)
            })}
          >
            <TextField
              className="col-span-full"
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              {...register('email')}
            />
            <TextField
              className="col-span-full"
              label="Password"
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              {...register('password')}
            />
            {hasRegistrationError(authError) && (
              <div className="col-span-full">
                <span className="mt-1 mb-1 inline-flex items-center rounded-md bg-red-100 p-3 text-sm font-medium text-red-800">
                  There is already a user associated with this account
                </span>
              </div>
            )}

            <div className="col-span-full">
              <label>
                <input
                  type="checkbox"
                  id="terms"
                  name="terms"
                  className="mr-2"
                  onChange={handleTos}
                />
                I agree to the{' '}
                <Link href="/terms-of-service" target="_blank">
                  Terms of Service
                </Link>{' '}
                &{' '}
                <Link href="/privacy-policy" target="_blank">
                  Privacy Policy
                </Link>
              </label>
            </div>
            <div className="col-span-full">
              <Button
                type="submit"
                variant="solid"
                color="blue"
                className={clsx('w-full', { 'opacity-75': isAnyAuthMethodLoading })}
                disabled={isAnyAuthMethodLoading}
              >
                <span>
                  Sign up <span aria-hidden="true">&rarr;</span>
                </span>
              </Button>
            </div>
            <div className="col-span-full" style={{ marginTop: '-15px' }}>
              <Button
                variant="outline"
                color="slate"
                className={clsx('w-full', { 'opacity-75': isAnyAuthMethodLoading })}
                disabled={isAnyAuthMethodLoading}
                onClick={(e) => {
                  e.preventDefault()
                  if (!checked) {
                    alert('Please agree to the Terms of Service and Privacy Policy')
                    return
                  }
                  signInWithGoogle()
                }}
              >
                <span className="mr-3">
                  <GoogleLogo />
                </span>
                <span>Sign up with Google</span>
              </Button>
            </div>
          </form>
        )}
      </AuthLayout>
    </>
  )
}

export const getServerSideProps = nonProtectedRouteRedirect

export default Register
