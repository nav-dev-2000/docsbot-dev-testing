import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { freeTools } from '@/constants/freeTools.constants'

export default function FreeTools() {
  const uniqueCategories = [...new Set(freeTools.map(tool => tool.category))];

  return (
    <>
      <NextSeo
        title="Free AI Productivity Tools - DocsBot AI"
        description="Explore our collection of free AI tools to enhance your productivity and streamline your workflow."
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
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                Free AI Tools
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Explore our collection of powerful AI tools designed to boost your productivity and streamline your workflow. All free to use and brought to you by DocsBot AI!
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                These tools are powered by the same advanced AI technology behind DocsBot. Experience the power of custom trained AI-driven solutions and discover how DocsBot can revolutionize your customer support, knowledge management, and content creation processes. <Link href="/register" className="text-cyan-400 hover:text-cyan-300">Create your free chatbot</Link> to see how our AI can transform your business to save you time and money.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            {uniqueCategories.map(category => (
              <div key={category} className="mb-12">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8 text-center">
                  {category} Tools
                </h2>
                <FreeToolsGrid category={category} showTitle={false} />
              </div>
            ))}
          </div>
        </div>

        <RegisterCTA />
      </main>
      <Footer />
    </>
  )
}
