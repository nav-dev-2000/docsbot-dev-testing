import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useCreateUserWithEmailAndPassword, useSignInWithGoogle } from 'react-firebase-hooks/auth'
import { useForm } from 'react-hook-form'
import clsx from 'clsx'
import { auth } from '@/config/firebase-ui.config'
import { postAuth } from '@/api/postAuth'
import { routePaths } from '@/constants/routePaths.constants'
import { useRegisterGoogleUser } from '@/hooks/useRegisterGoogleUser'
import { hasRegistrationError } from '@/utils/firebase.utils'
import { nonProtectedRouteRedirect } from '@/middleware/nonProtectedRouteRedirect'
import { RegisterLayout } from '@/components/RegisterLayout'
import { Button } from '@/components/Button'
import { TextField } from '@/components/Fields'
import { GoogleLogo } from '@/components/GoogleLogo'
import LoadingSpinner from '@/components/LoadingSpinner'
import FieldRadioCards from '@/components/FieldRadioCards'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { updateProfile } from 'firebase/auth'
import { NextSeo } from 'next-seo'
import { PencilIcon } from '@heroicons/react/24/outline'
import { usePostHog } from 'posthog-js/react'
import * as cookie from 'cookie'
import {
  WEBSITE_PATH_WARNING_COPY,
  ensureUrlHasProtocol,
  validateWebsiteInput,
} from '@/utils/websiteValidation'
import { persistSignupOnboardingCache } from '@/utils/signupOnboardingCache'

function Register({ teamCount }) {
  const router = useRouter()
  const { register, handleSubmit, watch } = useForm()
  const [authError, setAuthError] = useState('')
  const [redirectPath, setRedirectPath] = useState(routePaths.APP)
  const [authLoading, setAuthLoading] = useState(false)
  const [notCheckedError, setNotCheckedError] = useState(false)
  const [site, setSite] = useState('')
  const [name, setName] = useState('')
  const [userType, setUserType] = useState(null)
  const [usageType, setUsageType] = useState(null)
  const [siteError, setSiteError] = useState('')
  const [siteWarning, setSiteWarning] = useState('')
  const posthog = usePostHog()
  const signupQueryPresetAppliedRef = useRef(false)
  /** When URL has business (+ optional domain) but no usage yet, apply after user picks usage. */
  const pendingBusinessSignupFromQueryRef = useRef(null)

  const userTypes = [
    { value: 'business', title: 'Business', description: 'Create chatbots for your company.' },
    { value: 'personal', title: 'Personal', description: 'Create chatbots for your personal use.' },
  ]

  const usageTypes = [
    { value: 'support', title: 'Support & Presales', description: 'Customer support & presales 24/7 in 95 languages.' },
    { value: 'internal', title: 'Internal Knowledge', description: 'Give your team answers from your company knowledge base.' },
    { value: 'research', title: 'Document Q&A', description: 'Chat with your docs & files for research or education.' },
    { value: 'content', title: 'Content Creation', description: 'Generate custom content for your blog or social media.' },
  ]

  /**
   * Deep-link presets: usage/user/site from query when both usage and user are present;
   * pilot: ?userType=business&domain=example.com — usage chosen on-page, then business + site apply.
   */
  useEffect(() => {
    if (!router.isReady || signupQueryPresetAppliedRef.current) return

    const q = router.query
    const usageParamRaw =
      typeof q.usageType === 'string'
        ? q.usageType
        : typeof q.usage === 'string'
          ? q.usage
          : null
    const userParam =
      typeof q.userType === 'string' ? q.userType : null
    const siteParam =
      typeof q.site === 'string'
        ? q.site
        : typeof q.domain === 'string'
          ? q.domain
          : null

    const usageAllowed = new Set(['support', 'internal', 'research', 'content'])
    const userAllowed = new Set(['business', 'personal'])

    const validUsage =
      usageParamRaw && usageAllowed.has(usageParamRaw) ? usageParamRaw : null

    let siteNormalized = null
    if (siteParam && userParam === 'business') {
      const withProtocol = ensureUrlHasProtocol(siteParam)
      const result = validateWebsiteInput(withProtocol)
      if (result.valid && result.normalizedUrl) {
        siteNormalized = result.normalizedUrl
      }
    }

    if (validUsage) {
      setUsageType(validUsage)
    }

    if (userParam === 'business' && userAllowed.has(userParam)) {
      if (validUsage) {
        setUserType('business')
        if (siteNormalized) {
          setSite(siteNormalized)
          setSiteError('')
          setSiteWarning('')
        }
      } else {
        pendingBusinessSignupFromQueryRef.current = { site: siteNormalized }
      }
    } else if (userParam && userAllowed.has(userParam) && validUsage) {
      setUserType(userParam)
    }

    signupQueryPresetAppliedRef.current = true
  }, [router.isReady, router.query])

  useEffect(() => {
    const pending = pendingBusinessSignupFromQueryRef.current
    if (!usageType || !pending) return
    setUserType('business')
    if (pending.site) {
      setSite(pending.site)
      setSiteError('')
      setSiteWarning('')
    }
    pendingBusinessSignupFromQueryRef.current = null
  }, [usageType])

  const persistSignupSelections = useCallback(
    (normalizedSite) => {
      if (typeof window === 'undefined') return
      try {
        const payload = persistSignupOnboardingCache(window.localStorage, {
          usageType,
          site: normalizedSite || null,
        })
        if (!payload) return
      } catch (error) {
        console.error('Failed to persist onboarding selections', error)
      }
    },
    [usageType],
  )

  const validateBusinessSite = useCallback(
    (value) => {
      const trimmed = value ? value.trim() : ''
      if (!trimmed) {
        setSiteError('')
        setSiteWarning('')
        return { valid: true, normalizedUrl: null }
      }

      const result = validateWebsiteInput(trimmed)
      if (!result.valid) {
        setSiteError(
          result.error || 'Enter a valid URL, e.g. https://example.com',
        )
        setSiteWarning('')
        return { valid: false, normalizedUrl: null }
      }

      if (result.hasPathWarning) {
        setSiteError('')
        setSiteWarning(WEBSITE_PATH_WARNING_COPY)
        return { valid: false, normalizedUrl: result.normalizedUrl }
      }

      setSiteError('')
      setSiteWarning('')
      if (result.normalizedUrl && result.normalizedUrl !== trimmed) {
        setSite(result.normalizedUrl)
      }

      return { valid: true, normalizedUrl: result.normalizedUrl }
    },
    [setSite, setSiteError, setSiteWarning],
  )

  const validateBeforeSubmit = useCallback(() => {
    if (userType !== 'business') {
      setSiteError('')
      setSiteWarning('')
      return { valid: true, normalizedUrl: null }
    }
    return validateBusinessSite(site)
  }, [userType, site, validateBusinessSite])

  //set redirect path from demo trial cookie or query param
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookies = cookie.parse(document.cookie || '')
      if (cookies['docsbot_demo_trial']) {
        setRedirectPath('/app/activate')
        return
      }
    }
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

  useEffect(() => {
    if (userType !== 'business') {
      setSiteError('')
      setSiteWarning('')
    }
  }, [userType])

  const isAnyAuthMethodLoading = userAuthLoading || googleAuthLoading || authLoading
  const hasBusinessSiteIssue =
    userType === 'business' && (Boolean(siteError) || Boolean(siteWarning))

  const authorizeUser = useCallback(postAuth, [])
  useEffect(() => {
    if (user && !userAuthLoading) {
      const usageTypeForTracking = usageType ?? 'tools'
      //update user profile with name
      updateProfile(user?.user, {
        displayName: name,
      })
      setAuthLoading(true)
      authorizeUser({
        accessToken: user?.user?.accessToken,
        name: name,
        isNewUser: true,
        userType: userType ?? null,
        domain: userType === 'business' && site?.trim() ? site.trim() : null,
        email: user?.user?.email ?? null,
        onComplete: () => {
          if (window.bento !== undefined) {
            window.bento.identify(user?.user?.email)
            window.bento.updateFields({ website: site, user_type: userType, name: name, usage_type: usageTypeForTracking })
          }
          if (window.fpr !== undefined) {
            window.fpr("referral",{email: user?.user?.email})
          }
          if (!posthog?._isIdentified()) {
            posthog?.identify(user.user.uid, { email: user.user.email, name: user.user.displayName, "Usage Type": usageTypeForTracking, "User Type": userType })
          }
          posthog?.capture('Signup', { provider: 'email', user_type: userType, usage_type: usageTypeForTracking })
          if (userType === 'business' || Math.random() < 0.5) {
            posthog?.startSessionRecording()
          }
          const normalizedSite =
            userType === 'business' && site.trim() ? site.trim() : null
          persistSignupSelections(normalizedSite)
          router.push(redirectPath)
        },
      })
    }
  }, [
    user,
    userAuthLoading,
    authorizeUser,
    router,
    usageType,
    userType,
    site,
    persistSignupSelections,
    redirectPath,
    name,
    posthog,
  ])

  useRegisterGoogleUser({
    googleUser,
    authLoading,
    setAuthLoading,
    userType,
    domain: site,
    onComplete: () => {
      const usageTypeForTracking = usageType ?? 'tools'
      if (window.bento !== undefined) {
        window.bento.identify(googleUser?.user?.email)
        window.bento.updateFields({
          name: googleUser?.user?.displayName,
          user_type: userType,
          usage_type: usageTypeForTracking,
          website: site,
        })
      }
      if (window.fpr !== undefined) {
        window.fpr("referral",{email: googleUser?.user?.email})
      }
      if (!posthog?._isIdentified()) {
        posthog?.identify(googleUser.user.uid, { email: googleUser.user.email, name: googleUser.user.displayName, "Usage Type": usageTypeForTracking, "User Type": userType })
      }
      posthog?.capture('Signup', { provider: 'google', user_type: userType, usage_type: usageTypeForTracking })
      if (userType === 'business' || Math.random() < 0.5) {
        posthog?.startSessionRecording()
      }
      const normalizedSite =
        userType === 'business' && site.trim() ? site.trim() : null
      persistSignupSelections(normalizedSite)
      router.push(redirectPath)
    },
  })

  return (
    <>
      <NextSeo
        title="Sign Up - DocsBot AI"
        description="Register for a free DocsBot AI account."
        noindex={true}
      />
      <RegisterLayout teamCount={teamCount}>
        {isAnyAuthMethodLoading ? (
          <div className="flex h-64 items-center justify-center text-2xl">
            <LoadingSpinner large={true} /> <span className="ml-3">Loading...</span>
          </div>
        ) : (
          <form
            action="#"
            className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2"
            onSubmit={handleSubmit(({ email, password }) => {
              setNotCheckedError(false)
              if (!checked) {
                setNotCheckedError(true)
                return
              }
              const validation = validateBeforeSubmit()
              if (!validation.valid) {
                return
              }
              createUserWithEmailAndPassword(email, password)
            })}
          >
            <div className="col-span-full">
              <p className="col-span-full mb-2 text-sm text-gray-500">
                Please select your planned usage for DocsBot so we can better serve you.
              </p>
              {!userType && !usageType && (
              <FieldRadioCards options={usageTypes} selected={usageType} setSelected={setUsageType} />
              )}
              {usageType && (
                <>
              <p className="col-span-full mb-2 font-medium text-md text-gray-800">
                Usage: {usageTypes.find((x) => x.value === usageType).title}{' '}
                <button
                  type="button"
                  onClick={() => {
                    setUsageType(null)
                    setUserType(null)
                    setSiteError('')
                    setSiteWarning('')
                  }}
                  className="underline text-sm text-gray-500"
                  title="Change"
                >
                  <PencilIcon className="h-3 w-3" />
                </button>
              </p>
              <FieldRadioCards options={userTypes} selected={userType} setSelected={setUserType} />
              </>
              )}
            </div>
            {userType === 'business' && (
              <>
                <TextField
                  className="col-span-full"
                  label="Business website"
                  id="site"
                  name="site"
                  type="url"
                  placeholder="https://mycompany.com"
                  value={site}
                  onChange={(e) => {
                    setSite(e.target.value)
                    if (siteError) {
                      setSiteError('')
                    }
                    if (siteWarning) {
                      setSiteWarning('')
                    }
                  }}
                  onBlur={(event) => validateBusinessSite(event.target.value)}
                  aria-invalid={Boolean(siteError)}
                />
                {siteError && (
                  <p className="col-span-full mt-2 text-sm text-red-600">
                    {siteError}
                  </p>
                )}
                {!siteError && siteWarning && (
                  <div className="col-span-full mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                    {siteWarning}
                  </div>
                )}
                <p className="col-span-full mt-2 text-sm text-gray-500">
                  If your company has a website, please provide the URL. This will help us better
                  train your bot for your business.
                </p>
              </>
            )}

            {hasRegistrationError(authError) && (
              <div className="col-span-full">
                <span className="mb-1 mt-1 inline-flex items-center rounded-md bg-red-100 p-3 text-sm font-medium text-red-800">
                  There is already a user associated with this account. Please sign in.
                </span>
              </div>
            )}

            {notCheckedError && (
              <div className="col-span-full">
                <span className="mb-1 mt-1 inline-flex items-center rounded-md bg-red-100 p-3 text-sm font-medium text-red-800">
                  Please agree to the Terms of Service and Privacy Policy
                </span>
              </div>
            )}

            {userType && usageType && (
              <>
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
                    <Link
                      href="/legal/terms-of-service"
                      target="_blank"
                      className="underline hover:text-gray-400"
                    >
                      Terms of Service
                    </Link>{' '}
                    &{' '}
                    <Link
                      href="/legal/privacy-policy"
                      target="_blank"
                      className="underline hover:text-gray-400"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <div className="col-span-full">
                  <Button
                    variant="outline"
                    color="slate"
                    className={clsx('w-full', {
                      'opacity-75': isAnyAuthMethodLoading || hasBusinessSiteIssue,
                    })}
                    disabled={isAnyAuthMethodLoading || hasBusinessSiteIssue}
                    onClick={(e) => {
                      e.preventDefault()
                      setNotCheckedError(false)
                      if (!checked) {
                        setNotCheckedError(true)
                      return
                    }
                    const validation = validateBeforeSubmit()
                    if (!validation.valid) {
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

                <div className="relative col-span-full">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm font-medium leading-6">
                    <span className="bg-white px-6 text-gray-900">or create a password</span>
                  </div>
                </div>

                <TextField
                  className="col-span-full"
                  label="Full name"
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.replace(/https?:\/\/\S+/gi, ''))}
                />
                <TextField
                  className="col-span-full"
                  label={userType === 'business' ? 'Work email' : 'Email address'}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  {...register('email')}
                />
                <TextField
                  className="col-span-full mb-6"
                  label="Password"
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  {...register('password')}
                />

                <div className="col-span-full">
                  <Button
                    type="submit"
                    variant="solid"
                    color="cyan"
                    className={clsx('w-full', {
                      'opacity-75': isAnyAuthMethodLoading || hasBusinessSiteIssue,
                    })}
                    disabled={isAnyAuthMethodLoading || hasBusinessSiteIssue}
                  >
                    <span>
                      Sign up <span aria-hidden="true">&rarr;</span>
                    </span>
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </RegisterLayout>
    </>
  )
}

export const getServerSideProps = async (context) => {
  const data = await nonProtectedRouteRedirect(context)
  if (data.redirect) {
    return data
  }
  context.res.setHeader('Cache-Control', 'public, s-maxage=72000, stale-while-revalidate=600')

  configureFirebaseApp()
  const firestore = getFirestore()

  //get team count from firestore
  const collectionRef = firestore.collection('teams')
  const snapshot = await collectionRef.count().get()
  const teamCount = snapshot.data().count

  data.props.teamCount = teamCount

  return data
}

export default Register
