import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Link from 'next/link'
import {
  ClipboardDocumentIcon,
  HeartIcon,
  ArrowPathRoundedSquareIcon,
  ArrowUpTrayIcon,
  ChatBubbleOvalLeftIcon,
} from '@heroicons/react/24/outline'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'
import CarbonAd from '@/components/CarbonAd'
import { lookupYoutubeData } from '@/lib/tools'

const TweetComponent = ({ tweet, onCopy }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(tweet.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onCopy()
  }

  return (
    <div className="mb-4 flex h-full flex-col rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex flex-grow items-start space-x-3">
        <div className="flex-shrink-0">
          <img
            className="h-12 w-12 rounded-full"
            src={`https://api.dicebear.com/6.x/personas/svg?seed=${tweet.creative_handle}?size=24&backgroundType=gradientLinear,solid&backgroundColor=FDE7E4,FFE8EF,FCF2FF,EBDFFF,EEF1FF,EAF5FF,E9FDFF,ECFFF6,F0FFE9,FFFDEE,FFF5DD,FFD9C9,EDEDED,FFFFFF,B3B3B3`}
            alt="User avatar"
          />
        </div>
        <div className="min-w-0 flex-grow">
          <p className="flex items-center font-bold text-gray-900">
            {tweet.creative_name}
            <span className="ml-1 inline-flex items-center">
              <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
            </span>
            <span className="ml-1 text-sm font-normal text-gray-600">
              {tweet.creative_handle}
            </span>
          </p>
          <p className="break-words text-gray-800">{tweet.content}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-gray-500">
        <button
          className="flex cursor-not-allowed items-center space-x-1 text-gray-400"
          disabled
        >
          <ChatBubbleOvalLeftIcon className="h-5 w-5" />
          <span>{tweet.virality_potential}</span>
        </button>
        <button
          className="flex cursor-not-allowed items-center space-x-1 text-gray-400"
          disabled
        >
          <ArrowPathRoundedSquareIcon className="h-5 w-5" />
          <span>{tweet.virality_potential}</span>
        </button>
        <button
          className="flex cursor-not-allowed items-center space-x-1 text-gray-400"
          disabled
        >
          <HeartIcon className="h-5 w-5" />
          <span>{tweet.virality_potential}</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 hover:text-blue-500"
        >
          {copied ? (
            <ClipboardDocumentIcon className="h-5 w-5" />
          ) : (
            <ArrowUpTrayIcon className="h-5 w-5" />
          )}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  )
}

const YoutubeTweetGenerator = ({ tweets, videoId }) => {
  const [copiedIndex, setCopiedIndex] = useState(null)
  const sortedTweets = [...tweets.tweets].sort(
    (a, b) => b.virality_potential - a.virality_potential,
  )

  return (
    <>
      <NextSeo
        title={`${tweets.title} - AI YouTube Tweet/X Post Generator`}
        description="Generate engaging tweets and X posts from YouTube videos using AI"
        noindex={!tweets.is_ai}
      />
      <Header />
      <main>
        <div className="relative isolate bg-gray-900">
          <div className="py-8 sm:py-12">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">
                  Twitter/X Posts for {tweets.short_title || tweets.title}
                </h1>
                <div className="relative mx-auto mt-2 w-full pb-[56.25%]">
                  <iframe
                    className="absolute left-0 top-0 h-full w-full"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6">
            <h2 className="mb-4 text-center text-4xl font-bold text-white">
              Generated Tweets/X Posts
            </h2>

            <CarbonAd className="flex justify-center mb-4" /> 

            <p className="mb-6 text-lg leading-8 text-gray-300 text-center">
              AI-generated tweets and X posts created from {tweets.short_title || tweets.title}. Share your
              insights and grow your followers!
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {sortedTweets.map((tweet, index) => (
                <TweetComponent
                  key={index}
                  tweet={tweet}
                  onCopy={() => setCopiedIndex(index)}
                />
              ))}
            </div>
            <div className="flex justify-center">
              <Link
                href="/tools/ai-youtube-tweet-x-post-generator"
                className="mt-8 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                Generate tweets for another video
              </Link>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="AI-Powered Content Generation & Repurposing"
          description="Supercharge your content strategy by leveraging an AI chatbot trained on all your existing content. From websites and YouTube videos to Notion docs and Google Drive files, our AI analyzes 30+ data sources to generate fresh content and repurpose your best ideas across platforms."
          button="Start Repurposing Your Content, Free!"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default YoutubeTweetGenerator

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-tweet-x-post-generator',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeData(videoId, 'tweets')
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-tweet-x-post-generator',
        permanent: false,
      },
    }
  }

  return {
    props: {
      tweets: cachedData,
      videoId,
    },
  }
}
