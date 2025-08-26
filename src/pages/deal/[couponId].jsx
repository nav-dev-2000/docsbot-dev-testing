import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import * as cookie from 'cookie'
import VideoPlayer from '@/components/VideoPlayer'
import { DEALS } from '@/constants/deals.constants'
import { SparklesIcon } from '@heroicons/react/20/solid'
import SocialFaces from '@/components/SocialFaces'
import TrustedBy from '@/components/TrustedBy'
import { NextSeo } from 'next-seo'

export default function Deal() {
  const router = useRouter()
  const { couponId } = router.query
  const deal = couponId && DEALS[couponId]

  useEffect(() => {
    if (couponId && deal) {
      document.cookie = cookie.serialize('docsbot_coupon', couponId, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
      })
    }
  }, [couponId, deal])

  // Show 404 if no valid deal is found
  if (!deal) {
    return (
      <>
        <NextSeo 
          title="Deal Not Found - DocsBot"
          description="The deal you're looking for doesn't exist or has expired."
          noindex={true}
          nofollow={true}
        />
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
                      id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
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
                    fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
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
                <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
                  <div className="mx-auto max-w-4xl text-center">
                    <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl leading-tight">
                      <span className="block text-7xl leading-none tracking-tighter lg:text-8xl md:leading-[0.8]">
                        404
                      </span>
                      <span className="block text-6xl md:text-7xl bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text text-transparent">
                        Deal Not Found
                      </span>
                    </h1>
                  </div>

                  <div className="mx-auto max-w-2xl text-center mt-8">
                    <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                      The deal you're looking for doesn't exist or has expired.
                    </p> 
                  </div>

                  <div className="mt-10 max-w-3xl mx-auto">
                    <div className="flex flex-col items-center justify-center">
                      <div className="max-w-md w-full mb-6">
                        <div className="flex flex-col sm:flex-row gap-4 items-center">
                          <Link
                            href="/register"
                            type="button"
                            className="bg-animation flex-1 w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <SparklesIcon className="h-5 w-5" />
                              <span>Get Started Now</span>
                            </div>
                          </Link>
                          <Link
                            href="/"
                            className="text-md font-medium text-cyan-200 hover:text-cyan-300 transition-colors duration-200 whitespace-nowrap"
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
              </div>

              <div
                className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24"
              >
                <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                  Trusted by more than 3,000 businesses!
                </h2>
                <TrustedBy />
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <NextSeo 
        title={deal.pageTitle}
        description={deal.description}
        noindex={true}
        nofollow={true}
      />
      <Head>
        <link rel="preconnect" href="https://cdn.docsbot.com" />
      </Head>
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
                    id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
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
                  fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
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
              <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:px-8 lg:py-40">
                <div className="mx-auto max-w-4xl text-center">

                  {deal.image && (
                    <div className="mt-8 flex justify-center">
                      <img src={deal.image} alt="" className="h-32 w-auto" />
                    </div>
                  )}

                  <h1 className="mt-8 text-pretty text-5xl font-semibold tracking-tight text-white sm:text-7xl leading-tight">
                    <span className="block text-7xl leading-none tracking-tighter lg:text-8xl md:leading-[0.8]">
                      Success!
                    </span>
                    <span className="block text-6xl md:text-7xl bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text text-transparent">
                      {deal.title || 'Your Deal is Ready'}
                    </span>
                  </h1>
                </div>

                <div className="mx-auto max-w-2xl text-center mt-8">
                  <p className="text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                    {deal.description}
                  </p> 
                </div>

                <div className="mt-10 max-w-3xl mx-auto">
                  <div className="flex flex-col items-center justify-center">
                    <div className="max-w-md w-full mb-6">
                      <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <Link
                          href="/register"
                          type="button"
                          className="bg-animation flex-1 w-full cursor-pointer rounded-md px-4 py-3 text-center font-bold text-white shadow hover:from-teal-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-gray-900 transition-transform duration-300 hover:scale-105 hover:shadow-lg"
                        >
                          <div className="flex items-center justify-center space-x-2">
                            <SparklesIcon className="h-5 w-5" />
                            <span>Get Started Now</span>
                          </div>
                        </Link>
                        <Link
                          href="/"
                          className="text-md font-medium text-cyan-200 hover:text-cyan-300 transition-colors duration-200 whitespace-nowrap"
                        >
                          Learn more →
                        </Link>
                      </div>
                      <p className="mt-1 text-center text-sm text-gray-300 sm:mt-2">
                        Your special offer has been applied. Start building your AI agent today!
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

              <div
                className="mx-auto max-w-7xl px-6 pb-16 lg:px-8 lg:pb-8 xl:pb-24"
              >
                <h2 className="mb-8 text-center text-lg font-semibold leading-8 text-white">
                  Trusted by more than 3,000 businesses!
                </h2>
                <TrustedBy />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
