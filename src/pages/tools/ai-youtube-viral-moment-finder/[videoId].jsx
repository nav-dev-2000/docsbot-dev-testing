import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Link from 'next/link'
import {
  CodeBracketIcon,
  HashtagIcon,
  DocumentTextIcon,
} from '@heroicons/react/20/solid'
import { lookupYoutubeData } from '@/lib/tools'
import clsx from 'clsx'

const getViralityRating = (rating) => {
  const fullEmojis = Math.floor(rating);
  return '🔥'.repeat(fullEmojis);
};

const sortMomentsByVirality = (moments) => {
  return [...moments].sort((a, b) => parseFloat(b.virality_rating) - parseFloat(a.virality_rating));
};

const copyAsMarkdown = (ideas) => {
  const title = ideas.short_title || ideas.title;
  let output = `# ${title}: Viral Moments\n\n`
  output += `![Thumbnail](${ideas.metadata.thumbnail})\n\n`
  output += `## Viral Moments\n\n`
  sortMomentsByVirality(ideas.viral_moments).forEach((moment) => {
    output += `- **${moment.description}**\n`
    output += `  - Rating: ${getViralityRating(parseFloat(moment.virality_rating))}\n`
    output += `  - Wow Factor: ${moment.wow_factor}\n`
    output += `  - Viral Potential: ${moment.viral_potential}\n\n`
  })

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (ideas) => {
  const title = ideas.short_title || ideas.title;
  let output = `<h1>${title}: Viral Moments</h1>\n`
  output += `<img src="${ideas.metadata.thumbnail}" alt="Video Thumbnail">\n`
  output += `<h2>Viral Moments</h2>\n<ul>\n`
  sortMomentsByVirality(ideas.viral_moments).forEach((moment) => {
    output += `<li><strong>${moment.description}</strong><br>`
    output += `Rating: ${getViralityRating(parseFloat(moment.virality_rating))}<br>`
    output += `Wow Factor: ${moment.wow_factor}<br>`
    output += `Viral Potential: ${moment.viral_potential}</li>\n`
  })
  output += `</ul>\n`

  navigator.clipboard.writeText(output)
}

const copyAsText = (ideas) => {
  const title = ideas.short_title || ideas.title;
  let output = `${title}: Viral Moments\n\n`
  output += `Viral Moments:\n`
  sortMomentsByVirality(ideas.viral_moments).forEach((moment) => {
    output += `- ${moment.description}\n`
    output += `  - Rating: ${getViralityRating(parseFloat(moment.virality_rating))}\n`
    output += `  - Wow Factor: ${moment.wow_factor}\n`
    output += `  - Viral Potential: ${moment.viral_potential}\n\n`
  })

  navigator.clipboard.writeText(output)
}

const YoutubeIdeasInfo = ({ ideas, videoId }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)

  // Sort viral moments by virality rating (highest to lowest)
  const sortedMoments = [...ideas.viral_moments].sort((a, b) => 
    b.virality_rating - a.virality_rating
  );

  return (
    <>
      <div className="mx-auto mt-10 rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-700">
          Extracted Viral Moments
        </h2>
        <div className="relative mx-auto mb-6 w-full pb-[56.25%]">
          <iframe
            className="absolute left-0 top-0 h-full w-full"
            src={`https://www.youtube.com/embed/${videoId}`}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <div className="mx-none text-left">
          <div className="mb-3 flex w-full items-center justify-center space-x-4 text-center">
            <button
              type="button"
              onClick={() => {
                copyAsMarkdown(ideas)
                setMarkdownCopied(true)
                setTimeout(() => setMarkdownCopied(false), 1500)
              }}
              className={clsx(
                'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
                'hover:bg-gray-100',
                markdownCopied ? 'text-cyan-700' : 'text-gray-600',
              )}
            >
              <HashtagIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {markdownCopied ? 'Copied!' : 'Copy as Markdown'}
            </button>
            <button
              type="button"
              onClick={() => {
                copyAsHTML(ideas)
                setHtmlCopied(true)
                setTimeout(() => setHtmlCopied(false), 1500)
              }}
              className={clsx(
                'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
                'hover:bg-gray-100',
                htmlCopied ? 'text-cyan-700' : 'text-gray-600',
              )}
            >
              <CodeBracketIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {htmlCopied ? 'Copied!' : 'Copy as HTML'}
            </button>
            <button
              type="button"
              onClick={() => {
                copyAsText(ideas)
                setTextCopied(true)
                setTimeout(() => setTextCopied(false), 1500)
              }}
              className={clsx(
                'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
                'hover:bg-gray-100',
                textCopied ? 'text-cyan-700' : 'text-gray-600',
              )}
            >
              <DocumentTextIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              {textCopied ? 'Copied!' : 'Copy as Text'}
            </button>
          </div>
          <div className="mx-none text-left">
            <h3 className="mb-8 text-2xl font-semibold">Viral Moments</h3>
            <div className="grid grid-cols-12 gap-2 font-bold text-gray-700 mb-2 pb-2 border-b border-gray-300">
              <div className="col-span-2">Rating</div>
              <div className="col-span-2">Wow Factor</div>
              <div className="col-span-8">Moment</div>
            </div>
            <ul className="space-y-4">
              {sortedMoments.map((moment, index) => (
                <li key={index} className="border-b border-gray-200 pb-4">
                  <div className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 font-semibold">
                      {getViralityRating(parseFloat(moment.virality_rating))}
                    </div>
                    <div className="col-span-2">
                      {moment.wow_factor}
                    </div>
                    <div className="col-span-8">
                      {moment.description}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <span className="font-medium">Viral Potential:</span> {moment.viral_potential}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  )
}

const YoutubeIdeasPage = ({ ideas, videoId }) => {
  const title = ideas.short_title || ideas.title;

  return (
    <>
      <NextSeo
        title={`${title}: AI-Generated Viral Moments`}
        description={`Extracted viral moments from ${title} using AI`}
        openGraph={{
          images: [
            {
              url: ideas.metadata.thumbnail,
              alt: `${title}`,
            },
          ],
        }}
        noindex={!ideas.is_ai}
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
                    <YoutubeIdeasInfo ideas={ideas} videoId={videoId} />
                  </div>
                  <Link
                    href="/tools/ai-youtube-viral-moment-finder"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Extract viral moments from another video
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA
          customTitle="Train an AI Chatbot from YouTube"
          description="Turn your favorite YouTube videos or playlists into an AI-powered chatbot. Effortlessly create a knowledgeable assistant that can answer questions based on video content, then embed it in your website or app."
          button="Create a Free YouTube Chatbot"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="YouTube" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default YoutubeIdeasPage

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-viral-moment-finder',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeData(videoId, 'moments')
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-viral-moment-finder',
        permanent: false,
      },
    }
  }

  return {
    props: {
      ideas: cachedData,
      videoId,
    },
  }
}
