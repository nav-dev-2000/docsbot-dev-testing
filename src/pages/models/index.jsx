import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import Link from 'next/link'
import { LLMS } from '@/constants/llms.constants'
import { MagnifyingGlassIcon, XCircleIcon } from '@heroicons/react/20/solid'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getProviderInfo, getBenchmarkDescription } from '@/lib/llms'

const ModelsLandingPage = () => {
  const [filteredModels, setFilteredModels] = useState(
    LLMS.filter((m) => !m.redirect_to)
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchModels = () => {
      setIsSearching(true)
      const filtered = LLMS.filter((m) => !m.redirect_to).filter(
        (model) =>
          model.model_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          model.provider.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredModels(filtered)
      setIsSearching(false)
    }

    const debounceTimer = setTimeout(searchModels, 300)
    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  // Group and sort models
  const groupedModels = filteredModels.reduce((acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = []
    }
    acc[model.provider].push(model)
    return acc
  }, {})

  // Sort each provider's models by release date and slug
  Object.keys(groupedModels).forEach(provider => {
    groupedModels[provider].sort((a, b) => {
      return new Date(b.release_date) - new Date(a.release_date)
    })
  })

  return (
    <>
      <NextSeo
        title="LLM Large Language Model Directory - DocsBot"
        description="Comprehensive directory of large language models (LLMs) and their capabilities. Compare details, pricing, benchmarks, and more."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/llm-models.jpeg',
              width: 1200,
              height: 630,
              alt: 'AI Models Directory',
              type: 'image/jpeg',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img
            src="https://images.unsplash.com/photo-1655720028125-d5979d4bf62f?ixid=M3w1OTc2MjN8MHwxfGFsbHx8fHx8fHx8fDE3MzAzMTY4MDN8&ixlib=rb-4.0.3&fm=webp&auto=format&fit=crop&w=2000&h=600&q=70&blend=111827&sat=-100&exp=15&blend-mode=multiply"
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
              LLM Large Language Model Directory
            </h1>
            <p className="mt-6 text-xl leading-8 text-gray-300">
              Explore and compare the latest LLM large language models, their capabilities, 
              benchmarks, and specifications. Stay informed about the evolving landscape 
              of LLM models and their performance across various tasks.
            </p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
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
                  className="block w-full rounded-md border-0 bg-white py-1.5 pl-10 pr-8 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  placeholder="Search models..."
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 flex items-center pr-2"
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

          {/* Add quicklinks here */}
          <div className="mx-auto mt-6 flex max-w-2xl justify-center gap-4 flex-wrap">
            {Object.keys(groupedModels).map((provider) => (
              <a
                key={provider}
                href={`#${provider}`}
                className="text-sm text-gray-300 hover:text-white transition-colors font-semibold"
              >
                {getProviderInfo(provider)?.displayName || provider}
              </a>
            ))}
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
          {Object.entries(groupedModels).map(([provider, models]) => (
            <div key={provider} id={provider} className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                {(() => {
                  const info = getProviderInfo(provider)
                  const ProviderIcon = info?.icon
                  return ProviderIcon ? (
                    <ProviderIcon className="h-10 w-10 not-sr-only" />
                  ) : null
                })()} {getProviderInfo(provider)?.displayName || provider}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => {
                  const providerInfo = getProviderInfo(model.provider)
                  return (
                    <Link
                      key={model.slug}
                      href={`/models/${model.slug}`}
                      className="relative flex flex-col rounded-lg border border-gray-300 bg-white p-6 shadow-sm hover:border-gray-400 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {model.model_name}
                          </h3>
                          {model.release_date && (
                            <p className="text-sm text-gray-500">
                              {new Date(model.release_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                        {model.description}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <RegisterCTA />
      </main>
      <Footer />
    </>
  )
}

export default ModelsLandingPage
