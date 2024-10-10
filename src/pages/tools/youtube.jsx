import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { freeTools } from '@/constants/freeTools.constants'

export default function FreeTools() {
  const uniqueCategories = ['YouTube']

  return (
    <>
      <NextSeo
        title="Free AI YouTube Tools - DocsBot AI"
        description="Explore our collection of free AI YouTube tools for creating and repurposing content for marketing, education, and more."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/free-tools.png',
              alt: 'Free AI Tools',
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
                Free AI-Powered YouTube Tools
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Unlock the full potential of your video content with our
                AI-powered YouTube tools, designed to save you time, enhance
                SEO, and expand your reach across platforms. Whether you're a
                content creator, marketer, or educator, our tools simplify the
                process of repurposing YouTube videos into multiple formats like
                blog posts, Tweets/X posts, or concise summaries. For instance,
                the AI-Powered YouTube Blog Post Generator converts long videos
                into structured, SEO-friendly blog articles that drive traffic
                and boost engagement. Similarly, our YouTube Video Summarizer
                helps you quickly extract key insights, making it perfect for
                research or fast consumption.
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

        <RegisterCTA
          customTitle="Create an AI Chatbot from YouTube"
          description="Turn your favorite YouTube videos or playlists into an AI-powered chatbot. Easily build a knowledgeable assistant that can generate social media content based on video content, then embed it in your website or app."
          button="Create a Free YouTube Chatbot"
        />
        
        <div className="bg-gray-900 py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center">
              <p className="mt-4 text-lg leading-8 text-gray-300">
                These tools are essential for anyone looking to extend the life
                of their YouTube content without spending hours manually
                transcribing or summarizing videos. Marketers can transform
                videos into social media content with the AI YouTube to Tweet/X
                Post Generator, while educators and content creators can extract
                quotes and key moments using the YouTube Quote Generator. Pain
                points such as struggling to repurpose long videos, spending too
                much time creating new content, or failing to capture audience
                engagement across platforms are easily solved with our
                AI-powered solutions.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                By automating these tasks, our tools free up time for creative
                thinking and content strategy, making them indispensable for
                growing your online presence. The SEO-optimized outputs also
                improve discoverability on search engines, ensuring that your
                repurposed content drives meaningful traffic back to your
                website or social media profiles.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
