import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import * as cookie from 'cookie'
import docsbotWordmark from '@/images/logos/docsbot-logo.svg'
import VideoPlayer from '@/components/VideoPlayer'
import { SparklesIcon } from '@heroicons/react/20/solid'
import SocialFaces from '@/components/SocialFaces'
import TrustedBy from '@/components/TrustedBy'
import { NextSeo } from 'next-seo'
import { CountdownTicker } from '@/components/SaleLoyalty'
import { retrieveBrandByDomain } from '@/utils/crawlHelpers'
import { decideTextColor } from '@/utils/colors'
import {
  normalizeDomainForToken,
  verifyDemoDealTag,
  verifyDemoTrialToken,
  buildDemoTrialCookieValue,
  DEMO_TRIAL_COOKIE_MAX_AGE_SEC,
} from '@/lib/demoTrialToken'

const PATTERN_ID = 'pilot-branded-grid-pattern'

function pilotRegisterHref(domain) {
  return `/register?${new URLSearchParams({
    userType: 'business',
    domain,
  }).toString()}`
}

function DemoTrialOfferCountdown({ deadline }) {
  if (!deadline || deadline.getTime() <= Date.now()) {
    return null
  }

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center">
      <p className="text-sm text-gray-300">
        <span className="font-medium text-cyan-200">Pilot invite · </span>
        <span className="text-gray-300">
          <strong className="font-semibold text-gray-200">
            Start your pilot
          </strong>{' '}
          before this invite expires —{' '}
        </span>
        <CountdownTicker
          deadline={deadline}
          className="inline font-semibold text-cyan-200"
        />
      </p>
    </div>
  )
}

/**
 * Pilot hero is always dark (gray-900). Brand.dev: `dark` = mark for dark surfaces,
 * `light` = mark for light surfaces, `has_opaque_background` works on any surface.
 * Prefer opaque when present; among transparent assets, prefer `dark` before `light`.
 * Prefers `type: "logo"` (wordmark) over `icon` when both exist.
 *
 * @returns {{ url: string, kind: 'logo' | 'icon' | null, mode: string | null }}
 */
const selectBestBrandLogo = (logos) => {
  const empty = { url: '', kind: null, mode: null }
  if (!logos || logos.length === 0) return empty

  const fullLogos = logos.filter((logo) => logo.type === 'logo')
  const iconLogos = logos.filter((logo) => logo.type === 'icon')
  const pool = fullLogos.length > 0 ? fullLogos : iconLogos

  const kindOf = (logo) => (logo?.type === 'logo' ? 'logo' : 'icon')

  const pick = (logo) => {
    if (!logo?.url) return null
    return {
      url: logo.url,
      kind: kindOf(logo),
      mode: logo.mode ?? null,
    }
  }

  const opaque = pool.find((logo) => logo.mode === 'has_opaque_background')
  if (opaque) {
    const p = pick(opaque)
    if (p) return p
  }

  const darkVariant = pool.find((logo) => logo.mode === 'dark')
  if (darkVariant) {
    const p = pick(darkVariant)
    if (p) return p
  }

  const lightVariant = pool.find((logo) => logo.mode === 'light')
  if (lightVariant) {
    const p = pick(lightVariant)
    if (p) return p
  }

  const noMode = pool.find((logo) => !logo.mode)
  if (noMode) {
    const p = pick(noMode)
    if (p) return p
  }

  return pick(pool[0]) || pick(logos[0]) || empty
}

function DemoHeroShell({ children, footer }) {
  return (
    <div className="bg-white">
      <div className="relative overflow-hidden">
        <div className="-mt-24 bg-gray-900">
          <div className="relative isolate overflow-hidden bg-gray-900">
            <svg
              aria-hidden="true"
              className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
            >
              <defs>
                <pattern
                  x="50%"
                  y={-1}
                  id={PATTERN_ID}
                  width={200}
                  height={200}
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M.5 200V.5H200" fill="none" />
                </pattern>
              </defs>
              <svg
                x="50%"
                y={-1}
                className="overflow-visible fill-gray-800/20"
              >
                <path
                  d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                  strokeWidth={0}
                />
              </svg>
              <rect
                fill={`url(#${PATTERN_ID})`}
                width="100%"
                height="100%"
                strokeWidth={0}
              />
            </svg>
            <div
              aria-hidden="true"
              className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
            >
              <div
                style={{
                  clipPath:
                    'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                }}
                className="aspect-[1108/632] w-[69.25rem] h-[70rem] lg:h-[75rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20"
              />
            </div>
            {children}
            <div className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24">
              <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                Trusted by more than 3,000 businesses!
              </h2>
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DemoTrialLanding({ valid, domain, brand, inviteDeadlineIso }) {
  if (!valid) {
    return (
      <>
        <NextSeo
          title="Pilot link not found - DocsBot"
          description="This pilot invite link is invalid or has expired."
          noindex={true}
          nofollow={true}
        />
        <DemoHeroShell footer={<TrustedBy />}>
          <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl leading-tight">
                <span className="block text-7xl leading-none tracking-tighter lg:text-8xl md:leading-[0.8]">
                  404
                </span>
                <span className="block text-6xl md:text-7xl bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text text-transparent">
                  Pilot link not found
                </span>
              </h1>
            </div>

            <div className="mx-auto max-w-2xl text-center mt-8">
              <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                This pilot invite link is invalid or has expired.
              </p>
            </div>

            <div className="mt-10 max-w-3xl mx-auto">
              <div className="flex flex-col items-center justify-center">
                <div className="max-w-md w-full mb-6">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <Link
                      href="/register"
                      className="bg-animation flex-1 w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <SparklesIcon className="h-5 w-5" />
                        <span>Start your pilot</span>
                      </div>
                    </Link>
                    <Link
                      href="/"
                      className="inline-flex w-full shrink-0 items-center justify-center rounded-md bg-transparent px-4 py-3 text-center font-bold text-white ring-1 ring-inset ring-white transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto"
                    >
                      Learn more →
                    </Link>
                  </div>
                  <p className="mt-1 text-center text-sm text-gray-300 sm:mt-2">
                    Start building your AI agent today with our standard pricing!
                  </p>
                </div>
                <SocialFaces
                  ringColor="ring-gray-900"
                  className="flex justify-center items-center gap-4 scale-75"
                />
              </div>
            </div>

            <div className="mx-auto mt-12 sm:mt-16 lg:mt-12 max-w-6xl">
              <VideoPlayer
                videoSrc="https://cdn.docsbot.com/docsbot-intro.mp4"
                posterSrc="/video/docsbot-intro.webp"
                className="mx-auto w-full"
              />
            </div>
          </div>
        </DemoHeroShell>
      </>
    )
  }

  const mainColor =
    brand?.colors?.[0]?.hex && /^#[0-9A-Fa-f]{6}$/.test(brand.colors[0].hex)
      ? brand.colors[0].hex
      : '#14b8a6'

  const secondaryColorHex =
    brand?.colors?.[1]?.hex && /^#[0-9A-Fa-f]{6}$/.test(brand.colors[1].hex)
      ? brand.colors[1].hex
      : null
  /** Frosted panel: prefer brand palette #2, else primary. */
  const glassAccentColor = secondaryColorHex || mainColor

  let pilotCtaTextColor = '#ffffff'
  try {
    pilotCtaTextColor = decideTextColor(mainColor)
  } catch {
    /* keep fallback */
  }

  const { url: logoUrl, kind: logoKind, mode: logoMode } = brand?.logos?.length
    ? selectBestBrandLogo(brand.logos)
    : { url: '', kind: null, mode: null }
  const logoHasOpaqueBackground = logoMode === 'has_opaque_background'
  /** Wordmarks include the name; icons need the title beside them. */
  const showCompanyNameInLockup = !logoUrl || logoKind === 'icon'
  const companyName = brand?.title || domain
  const taglinePrimary = (brand?.slogan || '').trim()
  const seoDescription =
    taglinePrimary ||
    `After your DocsBot demo, ${companyName} has an unlocked pilot: 7 days to start, then a 14-day Business trial with our help finding value.`

  return (
    <>
      <NextSeo
        title={`${companyName} × DocsBot`}
        description={seoDescription}
        noindex={true}
        nofollow={true}
      />
      <Head>
        <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>
      <DemoHeroShell footer={<TrustedBy />}>
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
          <h1 className="mx-auto mt-8 max-w-4xl text-pretty">
            <span className="mb-6 block text-pretty text-center text-base font-semibold tracking-wide text-cyan-200/90 sm:text-lg md:text-xl">
              Your{' '}
              <span style={{ color: mainColor }}>{companyName}</span> AI pilot is{' '}
              <span className="uppercase">Unlocked</span>.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-4 sm:gap-x-6">
              {logoUrl ? (
                <div
                  className={
                    logoKind === 'icon'
                      ? 'inline-flex h-[4.5rem] w-[min(100%,225px)] shrink-0 items-center justify-center sm:h-24 sm:w-[225px]'
                      : 'inline-flex h-24 w-[min(100%,300px)] shrink-0 items-center justify-center sm:h-32 sm:w-[300px]'
                  }
                >
                  <img
                    src={logoUrl}
                    alt={logoKind === 'logo' ? companyName : ''}
                    className={`h-full w-full min-h-0 min-w-0 object-contain${logoHasOpaqueBackground ? ' rounded-xl' : ''}`}
                  />
                </div>
              ) : null}
              {showCompanyNameInLockup ? (
                <span
                  className="inline-flex min-h-24 items-center text-center text-4xl font-semibold leading-none tracking-tight sm:min-h-32 sm:text-5xl lg:text-6xl"
                  style={{ color: mainColor }}
                >
                  {companyName}
                </span>
              ) : null}
              <span
                className="inline-flex min-h-24 select-none items-center text-3xl font-light leading-none text-white/40 sm:min-h-32 sm:text-4xl"
                aria-hidden
              >
                +
              </span>
              <div className="inline-flex h-24 shrink-0 items-center justify-center sm:h-32">
                <Image
                  src={docsbotWordmark}
                  alt="DocsBot"
                  width={209}
                  height={36}
                  className="block h-12 w-auto sm:h-14 lg:h-16"
                  priority
                />
              </div>
            </div>
          </h1>

          {taglinePrimary ? (
            <div className="mt-5 flex justify-center sm:mt-6">
              <div className="relative w-fit max-w-full">
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: 'min(calc(100% + 5rem), calc(100vw - 2.5rem))',
                    height: '2.5rem',
                    backgroundColor: glassAccentColor,
                    opacity: 0.32,
                    filter: 'blur(40px)',
                  }}
                />
                <p className="relative text-pretty text-center text-lg font-semibold leading-snug text-white sm:text-xl sm:leading-snug lg:text-2xl lg:leading-snug">
                  <span
                    className="mr-0.5 font-serif text-2xl leading-none opacity-80 sm:text-3xl"
                    style={{ color: glassAccentColor }}
                    aria-hidden
                  >
                    &ldquo;
                  </span>
                  {taglinePrimary}
                  <span
                    className="ml-0.5 font-serif text-2xl leading-none opacity-80 sm:text-3xl"
                    style={{ color: glassAccentColor }}
                    aria-hidden
                  >
                    &rdquo;
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
              Thanks for walking through DocsBot with us. We've set up a DocsBot Business pilot account just for{' '}
              <span className="font-semibold text-gray-200">{companyName}</span>.
              You'll get a <span className="font-semibold text-cyan-200">14-day trial</span> with hands-on support from our team, so you can start seeing value immediately.
            </p>
          </div>

          <DemoTrialOfferCountdown
            deadline={
              inviteDeadlineIso ? new Date(inviteDeadlineIso) : null
            }
          />

          <div className="mt-10 max-w-3xl mx-auto">
            <div className="flex flex-col items-center justify-center">
              <div className="max-w-md w-full mb-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <Link
                    href={pilotRegisterHref(domain)}
                    className="flex-1 w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold shadow transition-transform duration-300 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                    style={{
                      backgroundColor: mainColor,
                      color: pilotCtaTextColor,
                    }}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <SparklesIcon className="h-5 w-5" />
                      <span>Start your pilot</span>
                    </div>
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex w-full shrink-0 items-center justify-center rounded-md bg-transparent px-4 py-3 text-center font-bold text-white ring-1 ring-inset ring-white transition-colors hover:bg-white hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 sm:w-auto"
                  >
                    Learn more →
                  </Link>
                </div>
                <p className="mt-1 text-center text-sm text-gray-300 sm:mt-2">
                  Sign up now and let our AI agent set up everything for you —
                  see the value of DocsBot in minutes, not days.
                </p>
              </div>
              <SocialFaces
                ringColor="ring-gray-900"
                className="flex justify-center items-center gap-4 scale-75"
              />
            </div>
          </div>

          <div className="mx-auto mt-12 sm:mt-16 lg:mt-12 max-w-6xl">
            <VideoPlayer
              videoSrc="https://cdn.docsbot.com/docsbot-intro.mp4"
              posterSrc="/video/docsbot-intro.webp"
              className="mx-auto w-full"
            />
          </div>
        </div>
      </DemoHeroShell>
    </>
  )
}

export async function getServerSideProps(context) {
  context.res.setHeader('X-Robots-Tag', 'noindex, nofollow')

  const rawDomain = context.params?.domain
  const domainParam = Array.isArray(rawDomain) ? rawDomain[0] : rawDomain
  const normalizedDomain = normalizeDomainForToken(domainParam || '')

  const rawDeal = context.query?.deal
  const dealParam = Array.isArray(rawDeal) ? rawDeal[0] : rawDeal
  const token = typeof dealParam === 'string' ? dealParam : ''

  if (!normalizedDomain || !token) {
    return {
      props: {
        valid: false,
        domain: null,
        brand: null,
        inviteDeadlineIso: null,
      },
    }
  }

  if (!verifyDemoDealTag(token, normalizedDomain)) {
    return {
      props: {
        valid: false,
        domain: null,
        brand: null,
        inviteDeadlineIso: null,
      },
    }
  }

  const reqCookies = cookie.parse(context.req.headers.cookie || '')
  const existingRaw = reqCookies['docsbot_demo_trial']
  const nowSec = Math.floor(Date.now() / 1000)
  const verifiedExisting = verifyDemoTrialToken(existingRaw)

  let expiresAtSec = nowSec + DEMO_TRIAL_COOKIE_MAX_AGE_SEC
  const tagNorm = token.trim().toLowerCase()
  if (
    verifiedExisting &&
    verifiedExisting.domain === normalizedDomain &&
    typeof verifiedExisting.expiresAtSec === 'number' &&
    verifiedExisting.expiresAtSec > nowSec &&
    typeof existingRaw === 'string'
  ) {
    const parts = existingRaw.split('|')
    const cookieTag = parts[1]?.trim().toLowerCase()
    if (cookieTag === tagNorm) {
      expiresAtSec = verifiedExisting.expiresAtSec
    }
  }

  const cookiePayload = buildDemoTrialCookieValue(
    normalizedDomain,
    token,
    expiresAtSec,
  )
  if (!cookiePayload) {
    return {
      props: {
        valid: false,
        domain: null,
        brand: null,
        inviteDeadlineIso: null,
      },
    }
  }

  let brand = null
  try {
    brand = await retrieveBrandByDomain(normalizedDomain)
  } catch (e) {
    console.error('retrieveBrandByDomain on pilot page', e)
  }

  const cookieHeader = cookie.serialize('docsbot_demo_trial', cookiePayload, {
    path: '/',
    maxAge: DEMO_TRIAL_COOKIE_MAX_AGE_SEC,
    sameSite: 'lax',
  })

  const prev = context.res.getHeader('Set-Cookie')
  if (prev) {
    if (Array.isArray(prev)) {
      context.res.setHeader('Set-Cookie', [...prev, cookieHeader])
    } else {
      context.res.setHeader('Set-Cookie', [prev, cookieHeader])
    }
  } else {
    context.res.setHeader('Set-Cookie', cookieHeader)
  }

  return {
    props: {
      valid: true,
      domain: normalizedDomain,
      brand,
      inviteDeadlineIso: new Date(expiresAtSec * 1000).toISOString(),
    },
  }
}
