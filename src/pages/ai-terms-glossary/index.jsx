import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import { GLOSSARY } from '@/constants/glossary.constants'
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/20/solid'
import LoadingSpinner from '@/components/LoadingSpinner'
import FreeToolsGrid from '@/components/FreeToolsGrid'

const GlossaryLandingPage = () => {
  const [glossaryByLetter, setGlossaryByLetter] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  useEffect(() => {
    const searchGlossary = () => {
      setIsSearching(true)
      const filteredGlossary = GLOSSARY.filter(
        (term) =>
          term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
          term.definition.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      const groupedGlossary = filteredGlossary.reduce((acc, term) => {
        const letter = term.term[0].toUpperCase()
        if (!acc[letter]) {
          acc[letter] = []
        }
        acc[letter].push(term)
        return acc
      }, {})

      Object.keys(groupedGlossary).forEach((letter) => {
        groupedGlossary[letter].sort((a, b) => a.term.localeCompare(b.term))
      })

      setGlossaryByLetter(groupedGlossary)
      setIsSearching(false)
    }

    const debounceTimer = setTimeout(searchGlossary, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Add this new function to get available letters
  const getAvailableLetters = () => {
    return Object.keys(glossaryByLetter).sort()
  }

  return (
    <>
      <NextSeo
        title="Generative AI Terms Glossary - DocsBot AI"
        description="Comprehensive glossary of AI terms and definitions"
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/glossary.jpeg',
              width: 1200,
              height: 630,
              alt: 'AI Glossary',
              type: 'image/jpeg',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?ixid=M3w1OTc2MjN8MHwxfGFsbHx8fHx8fHx8fDE3MjkzNjEyMjN8&ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2000&h=600&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
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
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Generative AI Terms Glossary
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300">
              As AI continues to transform industries, staying current with
              its evolving terminology is key. This glossary is designed to be
              a quick reference, offering insights into the latest terms and
              concepts that shape AI innovation. Whether you're exploring new
              AI technologies, discussing trends, or integrating AI into your
              projects, this glossary equips you with the knowledge you need
              to navigate the AI landscape effectively.
            </p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            {/* Add search input */}
            <div className="w-full max-w-lg lg:max-w-xs">
              <label htmlFor="search" className="sr-only">
                Search
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  placeholder="Search AI terms..."
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-3"
                  >
                    {isSearching ? (
                      <LoadingSpinner className="h-5 w-5 text-gray-400" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                    )}
                  </button>
                )}
              </div>
            </div>
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

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav className="mb-12 flex justify-center space-x-2">
            {alphabet.map((letter) => {
              const isAvailable = getAvailableLetters().includes(letter)
              return (
                <a
                  key={letter}
                  href={isAvailable ? `#${letter}` : undefined}
                  className={`w-8 rounded px-2 py-1 text-center ${
                    isAvailable
                      ? 'cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300'
                      : 'cursor-not-allowed bg-gray-100 text-gray-400'
                  }`}
                  onClick={isAvailable ? undefined : (e) => e.preventDefault()}
                >
                  {letter}
                </a>
              )
            })}
          </nav>

          {getAvailableLetters().map((letter) => (
            <div key={letter} id={letter} className="mb-12">
              <h2 className="mb-4 text-2xl font-bold">{letter}</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {glossaryByLetter[letter]?.map((term) => (
                  <div
                    key={term.slug}
                    className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-500 focus-within:ring-offset-2 hover:border-gray-400"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/ai-terms-glossary/term/${term.slug}`}
                        className="focus:outline-none"
                      >
                        <span className="absolute inset-0" aria-hidden="true" />
                        <p className="text-sm font-medium text-gray-900">
                          {term.term}
                        </p>
                        <p className="truncate text-sm text-gray-500">
                          {term.definition}
                        </p>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <RegisterCTA />

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="AI" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export default GlossaryLandingPage
