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

function Login() {
  const router = useRouter()
  const { register, handleSubmit, watch, getValues } = useForm()
  const [authError, setAuthError] = useState('')
  const [redirectPath, setRedirectPath] = useState(routePaths.APP)

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

  const [signInWithEmailAndPassword, user, userAuthLoading, error] =
    useSignInWithEmailAndPassword(auth)
  const [signInWithGoogle, googleUser, googleAuthLoading] = useSignInWithGoogle(auth)

  const isAnyAuthMethodLoading = userAuthLoading && googleAuthLoading

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
      authorizeUser({
        accessToken: user?.user?.accessToken,
        name: null,
        isNewUser: false,
        onComplete: () => {
          if (window.bento !== undefined) {
            window.bento.identify(user?.user?.email)
          }
          router.push(redirectPath)
        },
      })
    }
  }, [user, userAuthLoading, router, authorizeUser])

  useRegisterGoogleUser({
    googleUser,
    googleAuthLoading,
    onComplete: () => {
      if (window.bento !== undefined) {
        window.bento.identify(googleUser?.user?.email)
        window.bento.updateFields({"name": googleUser?.user?.displayName})
      }
      router.push(redirectPath)
    },
  })

  return (
    <>
      <Head>
        <title key="title">Sign In - DocsBot</title>
      </Head>
      <AuthLayout
        title="Sign in to account"
        subtitle={
          <>
            Don’t have an account?{' '}
            <Link href="/#signup" className="text-teal-100">
              Sign up
            </Link>{' '}
            to get started.
          </>
        }
      >
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
            <span className="mt-1 mb-1 inline-flex items-center rounded-md bg-red-100 p-3 text-sm font-medium text-red-800">
              Username or password is incorrect. <button className="ml-1 underline" onClick={
                (e) => {
                  e.preventDefault()
                  sendPasswordResetEmail(auth, getValues('email'))
                  .then(() => {
                    // Password reset email sent!
                    alert('Password reset email sent!')
                  })
                  .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;
                    alert("Please check the email address you entered and try again.")
                  });
                }
              }>Forgot password?</button>
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
      </AuthLayout>
    </>
  )
}

export const getServerSideProps = nonProtectedRouteRedirect

export default Login
