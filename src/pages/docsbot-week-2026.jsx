import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import RobotIconSolid from '@/components/RobotIconSolid'
import HeaderAuthSection from '@/components/HeaderAuthSection'
import docsbotLogo from '@/images/logos/docsbot-logo.svg'

export default function DocsBotWeek2026Page() {
  return (
    <>
      <Head>
        <title>DocsBot Week 2026 Webinar | DocsBot AI</title>
        <meta
          name="description"
          content="DocsBot Week 2026: AI That Acts. Register for the webinar and see how DocsBot agents move from AI answers to AI action."
        />
      </Head>

      <main className="relative min-h-screen w-full bg-gray-900 text-white">
        {/* Fills the viewport behind content so bg stays correct when scrolling or zooming */}
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-0 bg-gray-900"
        />
        <section className="relative z-10 isolate min-h-screen w-full overflow-hidden bg-gray-900">
          <svg
            aria-hidden="true"
            className="absolute inset-0 -z-10 size-full stroke-white/10 [-webkit-mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)] [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="docsbot-webinar-grid"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-800/20">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              fill="url(#docsbot-webinar-grid)"
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
              className="aspect-[1108/632] h-[70rem] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20 lg:h-[75rem]"
            />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 sm:pb-24 lg:px-8 lg:pb-28">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" aria-label="Go to DocsBot home">
                <Image src={docsbotLogo} alt="DocsBot" className="h-8 w-auto" priority />
              </Link>
              <HeaderAuthSection showAuthOnMobile />
            </div>

            <div className="mt-10 grid grid-cols-1 gap-10 lg:mt-14 lg:grid-cols-2 lg:gap-x-12 lg:gap-y-8">
              <div className="flex w-fit max-w-full shrink-0 items-center justify-self-start rounded-full bg-cyan-500/10 py-1 pl-3 pr-1 text-sm/6 font-semibold text-cyan-200 ring-1 ring-inset ring-cyan-500/20 lg:col-start-1 lg:row-start-1">
                <span className="pr-1">Webinar</span>
                <Link
                  href="https://docsbot.ai/article/docsbot-week-2026-ai-that-acts"
                  className="shrink-0 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 px-2 py-0.5 text-sm font-semibold leading-5 text-white no-underline transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300"
                  aria-label="DocsBot Week 2026: April 30th, 2026 at 10:00 AM CT — read the announcement"
                >
                  April 30th, 2026 at 10:00 AM CT
                </Link>
              </div>

              <div className="lg:col-start-1 lg:row-start-2">
                <h1 className="text-pretty text-5xl font-semibold leading-tight tracking-tight text-white sm:text-7xl">
                  <span className="block whitespace-nowrap text-[2.25rem] leading-none tracking-tighter sm:text-[2.5rem] lg:text-[2.9rem]">
                    DocsBot Week 2026
                  </span>
                  <span
                    className="relative mt-3 block font-bold text-transparent [-webkit-text-stroke:1px_#14b8a6] before:absolute before:inset-0 before:left-1 before:top-1 before:text-white before:content-[attr(data-text)] before:[-webkit-text-stroke:0]"
                    data-text="Live Build."
                  >
                    Live Build.
                  </span>
                </h1>

                <p className="mt-6 text-pretty text-lg font-medium text-gray-300 sm:text-xl/8">
                  We&apos;re skill building live.
                  {' '}
                  See how you can take your bots from answers to <em>actions</em>.
                </p>
                <p className="mt-4 text-base font-bold leading-8 text-gray-300">What you will learn:</p>

                <ul className="mt-3 space-y-2 text-base text-gray-200">
                  <li>• First look and live demo</li>
                  <li>• Q&A with DocsBot founder</li>
                  <li>• Replay and resources sent after the event</li>
                  <li>• Surprise announcement</li>
                </ul>

                <p className="mt-6 text-base font-bold leading-8">
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">
                    Sign up to secure your place and{' '}
                  </span>
                  <Link
                    href="https://docsbot.ai/article/docsbot-week-2026-ai-that-acts"
                    className="bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent underline decoration-cyan-400 underline-offset-2 hover:decoration-cyan-200"
                  >
                    learn more
                  </Link>
                  <span className="bg-gradient-to-r from-teal-500 to-cyan-600 bg-clip-text text-transparent">
                    .
                  </span>
                </p>
              </div>

              <div id="register" className="lg:col-start-2 lg:row-start-2 lg:self-start">
                {/* Hosted Bento Form — share/embed URL from Bento Forms → Embed */}
                <iframe
                  title="Register for DocsBot Week 2026 webinar"
                  src="https://formsbybento.com/f04a55fad9446821a8cf840e2f5c3a0e"
                  className="min-h-[480px] w-full rounded-xl border-0"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="mt-24 flex justify-center sm:mt-28 lg:mt-32">
              <RobotIconSolid size="48" gradient={true} className="h-6 w-6" />
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
