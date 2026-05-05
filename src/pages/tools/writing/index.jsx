import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'

export default function FreeTools() {
  const uniqueCategories = ['Writing']

  return (
    <>
      <NextSeo
        title="Free AI Writing Tools - DocsBot AI"
        description="Explore our collection of free AI Writing tools for transforming, creating, and improving your content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/free-tools.jpeg',
              width: 1200,
              height: 630,
              alt: 'Free AI Tools',
              type: 'image/jpeg',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-6xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Free AI-Powered Writing Tools
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Improve your productivity with our AI-powered writing tools, designed to streamline the creation and management of custom content. These tools are perfect for writers, content creators, students, and AI enthusiasts who need to generate and transform content efficiently.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {uniqueCategories.map((category) => (
              <div key={category} className="mb-12">
                <h2 className="mb-8 text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  {category} Tools
                </h2>
                <FreeToolsGrid category={category} showTitle={false} />
              </div>
            ))}
            <div className="mt-12 text-center">
              <Link
                href="/tools"
                className="inline-flex items-center rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                View All Free Tools &rarr;
              </Link>
            </div>
          </div>
        </div>

        <RegisterCTA />
        
        
      </main>
      <Footer />
    </>
  )
}
