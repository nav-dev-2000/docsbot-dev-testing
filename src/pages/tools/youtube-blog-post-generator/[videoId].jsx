import { useState } from 'react'
import { NextSeo } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Link from 'next/link'
import {
  CodeBracketIcon,
  HashtagIcon,
  DocumentTextIcon,
} from '@heroicons/react/20/solid'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { lookupYoutubeBlogPost } from '@/lib/tools'
import clsx from 'clsx'

const copyAsMarkdown = (summary) => {
  let output = `# ${summary.title}\n\n`
  output += `![Thumbnail](${summary.thumbnail})\n\n`
  output += summary.content

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (summary) => {
  let output = `<h1>${summary.title}</h1>\n`
  output += `<img src="${summary.thumbnail}" alt="${summary.title}">\n`
  output += unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(summary.content)
    .toString()

  navigator.clipboard.writeText(output)
}

const YoutubeBlogPost = ({ summary, videoId }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)
  const [textCopied, setTextCopied] = useState(false)

  const blogContent = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(summary.content)
    .toString()

  return (
    <>
      <NextSeo
        title={`${summary.title} - AI-Generated Blog Post`}
        description="An AI-genrated blog post from a YouTube video."
        openGraph={{
          images: [{ url: summary.thumbnail, alt: summary.title }],
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
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <p className="text-xl font-bold tracking-tight text-white sm:text-3xl">
                  YouTube Video Blog Post
                </p>
              </div>
              <article className="prose prose-lg prose-cyan mx-auto max-w-4xl rounded-xl bg-white px-4 py-4 shadow-xl ring-1 ring-slate-900/10 sm:px-6 lg:px-8">
                <h1 className="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-left sm:text-4xl">
                  {summary.title}
                </h1>
                <img
                  src={summary.thumbnail}
                  alt={summary.title}
                  className="w-full rounded-lg shadow-lg"
                />
                <div dangerouslySetInnerHTML={{ __html: blogContent }} />
                <div className="mt-8 flex justify-center space-x-4">
                  <button
                    onClick={() => {
                      copyAsMarkdown(summary)
                      setMarkdownCopied(true)
                      setTimeout(() => setMarkdownCopied(false), 1500)
                    }}
                    className={clsx(
                      'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100',
                      markdownCopied ? 'text-cyan-700 hover:text-cyan-900' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <HashtagIcon className="mr-2 h-5 w-5" />
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
                      'inline-flex items-center rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-100',
                      htmlCopied ? 'text-cyan-700 hover:text-cyan-900' : 'text-gray-500 hover:text-gray-700'
                    )}
                  >
                    <CodeBracketIcon
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    {htmlCopied ? 'Copied!' : 'Copy as HTML'}
                  </button>
                </div>
              </article>
              <div className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-2">
                <Link
                  href="/tools/youtube-blog-post-generator"
                  className="inline-flex w-full items-center justify-center rounded-md bg-cyan-600 px-6 py-3 text-white hover:bg-cyan-700"
                >
                  Generate another YouTube blog post
                </Link>
                <Link
                  href={`/tools/ai-youtube-summarizer`}
                  className="inline-flex w-full items-center justify-center rounded-md bg-cyan-600 px-6 py-3 text-white hover:bg-cyan-700"
                >
                  Summarize a YouTube video
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default YoutubeBlogPost

export const getServerSideProps = async (context) => {
  const videoId = context?.params?.videoId

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      redirect: {
        destination: '/tools/youtube-blog-post-generator',
        permanent: false,
      },
    }
  }

  const cachedData = await lookupYoutubeBlogPost(videoId)
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/youtube-blog-post-generator',
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