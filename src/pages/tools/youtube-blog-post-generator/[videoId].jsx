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
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Image from 'next/image'

const copyAsMarkdown = (summary, videoId, thumbnailError) => {
  let output = `# ${summary.title}\n\n`
  const thumbnailUrl = thumbnailError
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : summary.thumbnail
  output += `![Thumbnail](${thumbnailUrl})\n\n`
  output += summary.content

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (summary, videoId, thumbnailError) => {
  let output = `<h1>${summary.title}</h1>\n`
  const thumbnailUrl = thumbnailError
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : summary.thumbnail
  output += `<img src="${thumbnailUrl}" alt="${summary.title}">\n`
  output += unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(summary.content)
    .toString()

  navigator.clipboard.writeText(output)
}

const CopyButtons = ({ summary, videoId, thumbnailError }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)

  return (
    <div className="mt-4 mb-8 p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mt-0 mb-2">Copy this article</h3>
      <p className="text-sm text-gray-600 mb-4">
        This article has been created using the same AI that powers{' '}
        <Link href="/" className="text-cyan-600 hover:underline">
          DocsBot AI
        </Link>
        . You can copy it and easily use on your website or blog.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={() => {
            copyAsMarkdown(summary, videoId, thumbnailError)
            setMarkdownCopied(true)
            setTimeout(() => setMarkdownCopied(false), 1500)
          }}
          className={clsx(
            "flex-1 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50",
            markdownCopied ? "text-cyan-600" : "text-gray-700"
          )}
        >
          <CodeBracketIcon className="mr-2 h-5 w-5" aria-hidden="true" />
          {markdownCopied ? 'Copied!' : 'Copy as Markdown'}
        </button>
        <button
          onClick={() => {
            copyAsHTML(summary, videoId, thumbnailError)
            setHtmlCopied(true)
            setTimeout(() => setHtmlCopied(false), 1500)
          }}
          className={clsx(
            "flex-1 inline-flex items-center justify-center rounded-md bg-white px-4 py-2 text-sm font-medium border border-gray-300 hover:bg-gray-50",
            htmlCopied ? "text-cyan-600" : "text-gray-700"
          )}
        >
          <DocumentTextIcon className="mr-2 h-5 w-5" aria-hidden="true" />
          {htmlCopied ? 'Copied!' : 'Copy as HTML'}
        </button>
        <Link
          href="/tools/youtube-blog-post-generator"
          className="flex-1 inline-flex items-cente no-underline justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
        >
          Create new article
        </Link>
      </div>
    </div>
  )
}

const YoutubeBlogPost = ({ summary, videoId }) => {
  const [thumbnailError, setThumbnailError] = useState(false)

  const blogContent = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeStringify)
    .processSync(summary.content)
    .toString()

  // Format the date
  const formattedDate = summary.createdAt ? new Date(summary.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''

  // Calculate read time (assuming 200 words per minute)
  const wordCount = summary.content.split(/\s+/).length
  const readTime = Math.ceil(wordCount / 200)

  return (
    <>
      <NextSeo
        title={`${summary.title} - AI-Generated Blog Post`}
        description="An AI-genrated blog post from a YouTube video."
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              alt: summary.title,
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
              <div className="mx-auto mb-12 max-w-3xl text-center">
                <p className="text-xl font-bold tracking-tight text-white sm:text-3xl">
                  YouTube Video Blog Post
                </p>
              </div>
              <article className="prose prose-lg prose-cyan mx-auto max-w-4xl rounded-xl bg-white px-4 py-4 shadow-xl ring-1 ring-slate-900/10 sm:px-6 lg:px-8">
                <h1 className="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-left sm:text-4xl mb-0">
                  {summary.title}
                </h1>
                <div className="my-2 text-center text-base text-gray-500 sm:text-left flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-2">
                  {summary.channelName && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <p className="m-0">By {summary.channelName}</p>
                      <span className="text-gray-300 mx-2 hidden sm:inline">•</span>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <p className="m-0">Published {formattedDate}</p>
                      <span className="text-gray-300 mx-2 hidden sm:inline">•</span>
                    </div>
                  )}
                  <p className="m-0">{readTime} min read</p>
                </div>
                <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
                  <Image
                    src={
                      thumbnailError
                        ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
                        : summary.thumbnail
                    }
                    alt={summary.title}
                    layout="fill"
                    objectFit="cover"
                    className="m-0"
                    onError={() => setThumbnailError(true)}
                  />
                </div>

                {/* Copy buttons after image */}
                <CopyButtons
                  summary={summary}
                  videoId={videoId}
                  thumbnailError={thumbnailError}
                />

                <div dangerouslySetInnerHTML={{ __html: blogContent }} />

                <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-8">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={summary.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute top-0 left-0 w-full h-full"
                  />
                </div>

                {/* Copy buttons at the bottom of the article */}
                <CopyButtons
                  summary={summary}
                  videoId={videoId}
                  thumbnailError={thumbnailError}
                />
              </article>
            </div>
          </div>
        </div>
        <RegisterCTA />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
            Explore More Free Tools
          </h2>
          <FreeToolsGrid />
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
