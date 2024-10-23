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
import { lookupYoutubeBlogPost, getRecentVideoBlogPosts } from '@/lib/tools'
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

  // Check if copy buttons should be displayed
  const shouldShowCopyButtons = () => {
    if (!summary.is_ai) return true
    if (!summary.createdAt) return false

    const oneHour = 1 * 60 * 60 * 1000 // milliseconds in one hour
    const createdDate = new Date(summary.createdAt)
    const now = new Date()
    return now - createdDate < oneHour
  }

  return (
    <div className="mb-8 mt-4 rounded-lg bg-gray-100 p-4">
      <h3 className="mb-2 mt-0 text-lg font-semibold">
        {shouldShowCopyButtons() ? 'Copy this article' : 'Created with DocsBot AI'}
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        This article has been created using the same AI that powers{' '}
        <Link href="/" className="text-cyan-600 hover:underline">
          DocsBot AI
        </Link>
        . {shouldShowCopyButtons() ? 'You can copy it and easily use on your website or blog.' : ''}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {shouldShowCopyButtons() && (
          <>
            <button
              onClick={() => {
                copyAsMarkdown(summary, videoId, thumbnailError)
                setMarkdownCopied(true)
                setTimeout(() => setMarkdownCopied(false), 1500)
              }}
              className={clsx(
                'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                markdownCopied ? 'text-cyan-600' : 'text-gray-700',
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
                'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                htmlCopied ? 'text-cyan-600' : 'text-gray-700',
              )}
            >
              <DocumentTextIcon className="mr-2 h-5 w-5" aria-hidden="true" />
              {htmlCopied ? 'Copied!' : 'Copy as HTML'}
            </button>
          </>
        )}
        <Link
          href="/tools/youtube-blog-post-generator"
          className="items-cente inline-flex flex-1 justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white no-underline hover:bg-cyan-700"
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
  const formattedDate = summary.createdAt
    ? new Date(summary.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''

  // Calculate read time (assuming 200 words per minute)
  const wordCount = summary.content.split(/\s+/).length
  const readTime = Math.ceil(wordCount / 200)

  return (
    <>
      <NextSeo
        title={`${summary.title} - DocsBot AI`}
        description={
          summary.seo_meta_description ||
          'An AI-generated blog post from a YouTube video'
        }
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              alt: summary.title,
            },
          ],
        }}
        noindex={!summary.is_ai}
        nofollow={!summary.is_ai}
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
                <h1 className="mb-0 mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-left sm:text-4xl">
                  {summary.title}
                </h1>
                <div className="my-2 flex flex-col gap-y-2 text-center text-base text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:text-left">
                  {summary.channelName && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <p className="m-0">By {summary.channelName}</p>
                      <span className="mx-2 hidden text-gray-300 sm:inline">
                        •
                      </span>
                    </div>
                  )}
                  {formattedDate && (
                    <div className="flex items-center justify-center sm:justify-start">
                      <p className="m-0">Published {formattedDate}</p>
                      <span className="mx-2 hidden text-gray-300 sm:inline">
                        •
                      </span>
                    </div>
                  )}
                  <p className="m-0">{readTime} min read</p>
                </div>
                <div className="relative mb-8 aspect-video w-full overflow-hidden rounded-lg">
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

export default YoutubeBlogPost

export async function getStaticPaths() {
  const recentVideos = await getRecentVideoBlogPosts()
 
  // Get the paths we want to prerender based on posts
  // In production environments, prerender all pages
  // (slower builds, but faster initial page load)
  const paths = recentVideos.aiVideos.map((post) => ({
    params: { videoId: post.id },
  }))
 
  // { fallback: false } means other routes should 404
  return { paths, fallback: 'blocking' }
}

export const getStaticProps = async (context) => {
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
    revalidate: 86400,
  }
}
