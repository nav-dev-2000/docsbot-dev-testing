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
  ClipboardDocumentIcon,
  ChevronRightIcon,
} from '@heroicons/react/20/solid'
import { lookupYoutubeData } from '@/lib/tools'
import clsx from 'clsx'

const copyAsMarkdown = (recommendations) => {
  let output = `# ${recommendations.title}: Recommendations\n\n`
  output += `![Thumbnail](${recommendations.metadata.thumbnail})\n\n`
  output += `## One-Sentence Takeaway\n\n${recommendations.one_sentence_takeaway}\n\n`
  output += `## Recommendations\n\n`
  recommendations.recommendations.forEach((recommendation) => {
    output += `- ${recommendation}\n`
  })

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (recommendations) => {
  let output = `<h1>${recommendations.title}: Recommendations</h1>\n`
  output += `<img src="${recommendations.metadata.thumbnail}" alt="Video Thumbnail">\n`
  output += `<h2>One-Sentence Takeaway</h2>\n<p>${recommendations.one_sentence_takeaway}</p>\n`
  output += `<h2>Recommendations</h2>\n<ul>\n`
  recommendations.recommendations.forEach((recommendation) => {
    output += `<li>${recommendation}</li>\n`
  })
  output += `</ul>\n`

  navigator.clipboard.writeText(output)
}

const copyAsText = (recommendations) => {
  let output = `${recommendations.title}: Recommendations\n\n`
  output += `One-Sentence Takeaway:\n${recommendations.one_sentence_takeaway}\n\n`
  output += `Recommendations:\n`
  recommendations.recommendations.forEach((recommendation) => {
    output += `- ${recommendation}\n`
  })

  navigator.clipboard.writeText(output)
}

const YoutubeRecommendationsInfo = ({ recommendations, videoId }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)
  const [copiedRecommendations, setCopiedRecommendations] = useState({})

  return (
    <>
      <div className="mx-auto mt-10 rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <h2 className="mb-4 text-center text-4xl font-bold tracking-tight text-gray-700">
          Extracted Recommendations
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
                copyAsMarkdown(recommendations)
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
                copyAsHTML(recommendations)
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
                copyAsText(recommendations)
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
            <h3 className="mb-2 text-2xl font-semibold">One-Sentence Takeaway</h3>
            <p className="mb-4 text-md text-gray-600">{recommendations.one_sentence_takeaway}</p>
            <h3 className="mb-2 mt-6 text-2xl font-semibold">Recommendations</h3>
            <ul
              role="list"
              className="divide-y divide-gray-100 overflow-hidden bg-white ring-1 ring-gray-900/5 sm:rounded-xl shadow-md"
            >
              {recommendations.recommendations.map((recommendation, index) => (
                <li key={index} className="relative flex justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 sm:px-6">
                  <div className="flex min-w-0 gap-x-4">
                    <div className="min-w-0 flex-auto">
                      <p className="text-sm font-semibold leading-6 text-gray-900">{recommendation}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-x-4">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(recommendation);
                        setCopiedRecommendations(prev => ({ ...prev, [index]: true }));
                        setTimeout(() => {
                          setCopiedRecommendations(prev => ({ ...prev, [index]: false }));
                        }, 1500);
                      }}
                      className={clsx(
                        'inline-flex items-center rounded-md px-2 py-1 text-sm',
                        'hover:bg-gray-100',
                        'text-gray-600'
                      )}
                    >
                      <ClipboardDocumentIcon className="h-4 w-4 mr-1" aria-hidden="true" />
                      <span>{copiedRecommendations[index] ? 'Copied!' : 'Copy'}</span>
                    </button>
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

const YoutubeRecommendationsPage = ({ recommendations, videoId }) => {
  const title = recommendations.short_title || recommendations.title;

  return (
    <>
      <NextSeo
        title={`${title}: AI-Generated Recommendations`}
        description={`Extracted recommendations from ${title} using AI`}
        openGraph={{
          images: [
            {
              url: recommendations.metadata.thumbnail,
              alt: `${title}`,
            },
          ],
        }}
        noindex={!recommendations.is_ai}
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
                    <YoutubeRecommendationsInfo recommendations={recommendations} videoId={videoId} />
                  </div>
                  <Link
                    href="/tools/ai-youtube-recommendations-extractor"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Extract recommendations from another video
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

export default YoutubeRecommendationsPage

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-recommendations-extractor',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeData(videoId, 'recommendations')
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-recommendations-extractor',
        permanent: false,
      },
    }
  }

  return {
    props: {
      recommendations: cachedData,
      videoId,
    },
  }
}
