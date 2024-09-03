import { useState } from 'react'
import { useRouter } from 'next/router'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import { lookupFAQs } from '@/lib/tools'
import { sanitizeURL } from '@/utils/helpers'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import { CodeBracketIcon, HashtagIcon } from '@heroicons/react/20/solid'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { Favicon } from '.'
import clsx from 'clsx'
import FreeToolsGrid from '@/components/FreeToolsGrid'

const copyAsMarkdown = (FAQs) => {
  let output = ''
  for (const faq of FAQs) {
    output += `## ${faq.question}\n\n`
    output += `${faq.answer}\n\n`
  }

  navigator.clipboard.writeText(output)
}

const copyAsHTML = (FAQs) => {
  let output = ''
  for (const faq of FAQs) {
    output += `<h3>${faq.question}</h3>\n`
    output += unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(faq.answer).toString() + '\n\n'
  }

  navigator.clipboard.writeText(output)
}

// site is a URL
const FAQsInfo = ({ FAQs, title, summary, screenCap, site }) => {
  const [markdownCopied, setMarkdownCopied] = useState(false)
  const [htmlCopied, setHtmlCopied] = useState(false)

  return (
    <>
      <div className="mx-auto rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <div className="flex items-center justify-center space-x-2 text-center text-3xl font-bold tracking-tight text-gray-800">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden">
            <Favicon url={site.hostname} />
          </div>
          <div>{title} Summary</div>
        </div>
        <div className="mx-none text-left">
          <div className="prose mx-auto mt-4 w-full max-w-none">
            <p className="mb-2">{summary}</p>
          </div>

          <div className="mx-auto mt-2">
            <img
              className="block w-full rounded-md shadow-sm"
              src={screenCap}
              alt={'Thumbnail image of ' + title}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 rounded-xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
        <div className="mb-3 text-center text-3xl font-bold tracking-tight text-gray-800">
          Frequently Asked Questions
        </div>
        <div className="mb-3 flex w-full items-center text-center">
          <button
            type="button"
            onClick={() => {
              copyAsMarkdown(FAQs)
              setMarkdownCopied(true)
              setTimeout(() => setMarkdownCopied(false), 1500)
            }}
            className={clsx(
              'm-auto inline-flex items-center rounded-md px-3 py-2 text-center text-sm font-medium hover:bg-gray-100',
              markdownCopied ? 'text-cyan-700 hover:text-cyan-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <HashtagIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {markdownCopied ? 'Copied!' : 'Copy as Markdown'}
          </button>
          <button
            type="button"
            onClick={() => {
              copyAsHTML(FAQs)
              setHtmlCopied(true)
              setTimeout(() => setHtmlCopied(false), 1500)
            }}
            className={clsx(
              'm-auto inline-flex items-center rounded-md px-3 py-2 text-center text-sm font-medium hover:bg-gray-100',
              htmlCopied ? 'text-cyan-700 hover:text-cyan-900' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            <CodeBracketIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            {htmlCopied ? 'Copied!' : 'Copy as HTML'}
          </button>
        </div>
        <div className="mx-none text-left">
          {FAQs.map((faq) => {
            const renderedAnswer = unified()
              .use(remarkParse)
              .use(remarkGfm)
              .use(remarkRehype)
              .use(rehypeStringify)
              .processSync(faq.answer)
              .toString()
            return (
              <div
                key={faq.question}
                className="prose mt-2 w-full max-w-none border-t border-gray-200 pt-4"
              >
                <h1 className="text-2xl font-bold text-black">{faq.question}</h1>
                <div dangerouslySetInnerHTML={{ __html: renderedAnswer }} />
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const FAQsSharePage = ({ FAQs, title, summary, screenCap, thumbnail, siteURL }) => {
  const [site] = useState(new URL(siteURL))

  return (
    <>
      <NextSeo
        title={`AI-Generated Frequently Asked Questions for ${title}`}
        description={summary}
        openGraph={{
          images: [
            {
              url: `${thumbnail}`,
              alt: `AI-Generated Frequently Asked Questions for ${title}`,
            },
          ],
        }}
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
                  Frequently Asked Questions for {title}
                </h1>
                <div className="mx-auto max-w-3xl text-center">
                  <div className="py-12 pb-0">
                    <FAQsInfo FAQs={FAQs} title={title} summary={summary} screenCap={thumbnail} site={site} />
                  </div>
                  <Link
                    href="/tools/ai-faq-generator"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Create your own website FAQ
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">
            Explore More Free Tools
          </h2>
          <FreeToolsGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default FAQsSharePage

export const getServerSideProps = async (context) => {
  const siteURL = sanitizeURL(context?.params?.siteURL)

  // no query param?
  if (!siteURL) {
    return {
      redirect: {
        destination: '/tools/ai-faq-generator',
        permanent: false,
      },
    }
  }

  // data doesn't exist?
  const cachedData = await lookupFAQs(siteURL)
  if (!cachedData) {
    return {
      redirect: {
        destination: '/tools/ai-faq-generator',
        permanent: false,
      },
    }
  }

  return {
    props: {
      FAQs: cachedData.FAQs,
      title: cachedData?.title || new URL(siteURL).hostname,
      summary: cachedData.summary,
      screenCap: cachedData.screenCap,
      thumbnail: cachedData.thumbnail,
      siteURL: siteURL,
    },
  }
}