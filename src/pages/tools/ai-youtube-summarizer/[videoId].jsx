import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import { CodeBracketIcon, HashtagIcon, DocumentTextIcon } from '@heroicons/react/20/solid'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { lookupYoutubeSummary } from '@/lib/tools'
import clsx from 'clsx';

const copyAsMarkdown = (summary) => {
  let output = `# ${summary.title}\n\n`
  output += `![Thumbnail](${summary.thumbnail})\n\n`
  output += `${summary.summary}\n\n`
  output += `## Key Points\n\n`
  summary.keyPoints.forEach((point) => {
    output += `### ${point.point}\n\n${point.summary}\n\n`
  })

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (summary) => {
  let output = `<h1>${summary.title}</h1>\n`
  output += unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(summary.summary).toString() + '\n\n'
  output += `<h2>Key Points</h2>\n`
  summary.keyPoints.forEach((point) => {
    output += `<h3>${point.point}</h3>\n<p>${point.summary}</p>\n`
  })

  navigator.clipboard.writeText(output)
}

const copyAsText = (summary) => {
  let output = `${summary.title}\n\n`
  output += `${summary.summary}\n\n`
  output += `Key Points:\n\n`
  summary.keyPoints.forEach((point) => {
    output += `${point.point}\n${point.summary}\n\n`
  })

  navigator.clipboard.writeText(output)
}

const YoutubeSummaryInfo = ({ summary, videoId }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)

  return (
    <>
      <div className="mx-auto rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <div className="flex items-center justify-center space-x-2 text-center text-3xl font-bold tracking-tight text-gray-800">
          <div>{summary.title}</div>
        </div>
        <div className="mx-none text-left">
          <div className="prose mx-auto mt-4 w-full max-w-none">
            <p className="mb-2">{summary.summary}</p>
          </div>

          <div className="mx-auto mt-2 relative w-full pb-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <div className="mb-3 text-center text-3xl font-bold tracking-tight text-gray-800">
          Key Points
        </div>
        <div className="mb-3 flex w-full items-center justify-center space-x-4 text-center">
          <button
            type="button"
            onClick={() => {
              copyAsMarkdown(summary)
              setMarkdownCopied(true)
              setTimeout(() => setMarkdownCopied(false), 1500)
            }}
            className={clsx(
              'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
              'hover:bg-gray-100',
              markdownCopied ? 'text-cyan-700' : 'text-gray-600'
            )}
          >
            <HashtagIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {markdownCopied ? 'Copied!' : 'Copy as Markdown'}
          </button>
          <button
            type="button"
            onClick={() => {
              copyAsHTML(summary)
              setHtmlCopied(true)
              setTimeout(() => setHtmlCopied(false), 1500)
            }}
            className={clsx(
              'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
              'hover:bg-gray-100',
              htmlCopied ? 'text-cyan-700' : 'text-gray-600'
            )}
          >
            <CodeBracketIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {htmlCopied ? 'Copied!' : 'Copy as HTML'}
          </button>
          <button
            type="button"
            onClick={() => {
              copyAsText(summary)
              setTextCopied(true)
              setTimeout(() => setTextCopied(false), 1500)
            }}
            className={clsx(
              'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
              'hover:bg-gray-100',
              textCopied ? 'text-cyan-700' : 'text-gray-600'
            )}
          >
            <DocumentTextIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {textCopied ? 'Copied!' : 'Copy as Text'}
          </button>
        </div>
        <div className="mx-none text-left">
          {summary.keyPoints.map((keyPoint, index) => (
            <div key={index} className="mb-4">
              <h3 className="font-semibold mb-1 text-lg">{keyPoint.point}</h3>
              <p className="text-sm text-gray-600">{keyPoint.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

const YoutubeSummaryPage = ({ summary, videoId }) => {
  return (
    <>
      <NextSeo
        title={`AI-Generated Summary for ${summary.title}`}
        description={summary.summary}
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
              alt: `AI-Generated Summary for ${summary.title}`,
            },
          ],
        }}
        noindex
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
                  YouTube Video Summary
                </h1>
                <div className="mx-auto max-w-3xl text-center">
                  <div className="py-12 pb-0">
                    <YoutubeSummaryInfo summary={summary} videoId={videoId} />
                  </div>
                  <Link
                    href="/tools/ai-youtube-summarizer"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Summarize another video
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />
      </main>
      <Footer />
    </>
  )
}

export default YoutubeSummaryPage

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-summarizer',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeSummary(videoId)
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-youtube-summarizer',
        permanent: false,
      },
    }
  }

  return {
    props: {
      summary: cachedData,
      videoId,
    },
  }
}