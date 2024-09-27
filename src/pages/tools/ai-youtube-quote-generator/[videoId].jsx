import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Link from 'next/link'
import { lookupYoutubeData } from '@/lib/tools'
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

const YoutubeQuotesInfo = ({ quotes, videoId }) => {
  const [copiedQuoteIndex, setCopiedQuoteIndex] = useState(null)

  const copyQuote = (quote, index) => {
    navigator.clipboard.writeText(quote.text)
    setCopiedQuoteIndex(index)
    setTimeout(() => setCopiedQuoteIndex(null), 1500)
  }

  return (
    <div className="mx-auto rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
      <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-700">
        AI-Extracted Quotes
      </h2>
      <div className="mx-none text-left">
        <div className="relative mx-auto mb-6 w-full pb-[56.25%]">
          <iframe
            className="absolute left-0 top-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </div>
      <div className="mx-none text-left">
        {quotes.quotes.map((quote, index) => (
          <div key={index} className="mb-4 flex items-start justify-between">
            <div>
              <blockquote className="mb-1 text-lg font-semibold italic">
                "{quote.text}"
              </blockquote>
              <p className="text-sm text-gray-600">
                <strong>Context:</strong> {quote.context}
              </p>
            </div>
            <button
              onClick={() => copyQuote(quote, index)}
              className={clsx(
                'ml-2 inline-flex items-center rounded-md px-2 py-1 text-sm',
                'hover:bg-gray-100',
                copiedQuoteIndex === index ? 'text-cyan-700' : 'text-gray-600'
              )}
            >
              <ClipboardDocumentIcon className="h-4 w-4 mr-1" aria-hidden="true" />
              {copiedQuoteIndex === index ? 'Copied!' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const YoutubeQuotesPage = ({ quotes, videoId }) => {
  const title = quotes.short_title || quotes.title;

  return (
    <>
      <NextSeo
        title={`AI-Generated Quotes from ${title}`}
        description={`Extracted quotes from the YouTube video: ${title}`}
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              alt: `AI-Generated Quotes from ${title}`,
            },
          ],
        }}
        noindex={!quotes.is_ai}
      />
      <Header />
      <main>
        <div className="relative isolate bg-gray-900">
          <div
            className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a4e2ff] to-[#32aa9c] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  {title}
                </h1>
                <div className="mx-auto max-w-3xl text-center">
                  <div className="py-12 pb-0">
                    <YoutubeQuotesInfo quotes={quotes} videoId={videoId} />
                  </div>
                  <Link
                    href="/tools/ai-youtube-quote-generator"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Extract quotes from another video
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA
          customTitle="Train an AI Chatbot from YouTube"
          description="Turn your favorite YouTube videos or playlists into an AI-powered chatbot. Effortlessly create a knowledgeable assistant that can answer questions based on video content, then embed it in your website or app."
          button="Create a YouTube Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default YoutubeQuotesPage

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-quote-generator',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeData(videoId, 'quotes')
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-quote-generator',
        permanent: false,
      },
    }
  }

  return {
    props: {
      quotes: cachedData,
      videoId,
    },
  }
}
