import { useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo, QAPageJsonLd } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import clsx from 'clsx'
import Breadcrumb from '@/components/Breadcrumb'
import { GLOSSARY } from '@/constants/glossary.constants'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import FreeToolsGrid from '@/components/FreeToolsGrid'

const GlossaryTermPage = ({
  letter,
  term,
  definition,
  long_definition,
  slug,
  question,
}) => {
  const breadcrumbPages = [
    { name: 'AI Glossary', href: '/ai-terms-glossary', current: false },
    { name: term, href: `/ai-terms-glossary/${slug}`, current: true },
  ]

  // Add this function to process markdown
  const processMarkdown = (text) => {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
      .toString()
  }

  // Process the long_definition
  const processedLongDefinition = processMarkdown(long_definition)

  // Add this function to filter and sort terms by letter
  const getTermsByLetter = (letter) => {
    return GLOSSARY.filter((item) =>
      item.term.toLowerCase().startsWith(letter.toLowerCase()),
    ).sort((a, b) => a.term.localeCompare(b.term))
  }

  // Get matching terms
  const matchingTerms = getTermsByLetter(letter)

  return (
    <>
      <NextSeo
        title={`${question} - AI Glossary`}
        description={`${definition}`}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/glossary.png',
              alt: 'AI Glossary',
            },
          ],
        }}
      />
      <QAPageJsonLd
        mainEntity={{
          name: question,
          answerCount: 1,
          acceptedAnswer: {
            text: definition,
            url: `https://docsbot.ai/ai-terms-glossary/term/${slug}`,
          },
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2830&h=500&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
            alt=""
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ffdb] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-xl font-semibold leading-7 text-teal-500">
              {question}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              {term}
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300">{definition}</p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <Breadcrumb pages={breadcrumbPages} />
          </div>

          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>

        <div className="bg-white">
          <div className="prose prose-sm mx-auto max-w-5xl bg-white px-6 py-12 text-left sm:prose lg:prose-lg xl:prose-xl lg:px-8">
            <div
              dangerouslySetInnerHTML={{ __html: processedLongDefinition }}
            />
          </div>
        </div>

        <div className="bg-gray-100 py-12">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="mb-6 text-center text-2xl font-bold">
              More terms starting with '{letter.toUpperCase()}'
            </h2>
            <ul className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 lg:grid-cols-3">
              {matchingTerms.map((item) => (
                <li key={item.slug}>
                  <Link
                    href={`/ai-terms-glossary/term/${item.slug}`}
                    className="text-cyan-600 hover:underline"
                  >
                    {item.term}
                  </Link>
                </li>
              ))}
            </ul>
          <div className="mt-8 text-center">
            <Link href="/ai-terms-glossary" className="text-cyan-600 text-xl font-semibold hover:underline">
             &larr; All AI Terms
            </Link>
          </div>
          </div>
        </div>

        <RegisterCTA />

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default GlossaryTermPage

export async function getStaticPaths() {
  let paths = GLOSSARY.map((item) => {
    return { params: { term: `${item.slug}` } }
  })
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  const term = context.params.term
  return {
    props: { ...GLOSSARY.find((e) => `${e.slug}` == term) },
  }
}
