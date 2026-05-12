import Link from 'next/link'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { NextSeo } from 'next-seo'

export default function KeepMeSubscribedPage() {
  return (
    <>
      <NextSeo
        title="You're still subscribed - DocsBot"
        description="Confirmation that you're still subscribed to DocsBot updates."
        noindex={true}
        nofollow={true}
      />

      <Header />

      <main>
        <div className="bg-white">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:py-28">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900 sm:text-3xl">
                Thanks, you’re still subscribed.
              </h1>
              <p className="mt-4 text-base text-gray-700">
                You’ll continue to receive occasional product updates and resources from DocsBot.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                If this was a mistake, you can unsubscribe anytime using the link at the bottom of
                any email.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
                >
                  Go to DocsBot
                </Link>
                <a
                  href="mailto:human@docsbot.ai"
                  className="inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  Contact us
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
