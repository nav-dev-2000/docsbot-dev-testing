import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'

export default function FreeTools() {
  const uniqueCategories = ['Image']

  return (
    <>
      <NextSeo
        title="Free AI Image Tools - DocsBot AI"
        description="Explore our collection of free AI Image tools for repurposing content for marketing, education, and more."
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
                Free AI-Powered Image Tools
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Take your visual content to the next level with our AI-powered
                image tools, designed to streamline tasks like generating
                detailed image descriptions, crafting creative captions, and
                extracting text from images. These tools are perfect for
                marketers, social media managers, accessibility advocates, and
                anyone who needs to manage visual content efficiently. For
                example, the AI-Powered Image Description Generator is ideal for
                improving SEO by creating rich, detailed descriptions that help
                search engines better understand your images, enhancing
                visibility. Additionally, this tool is invaluable for improving
                website accessibility by providing alternative text for visually
                impaired users.
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
        
        <div className="bg-gray-900 py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center">
              <p className="mt-4 text-lg leading-8 text-gray-300">
                The AI-Powered Image Caption Generator is a must-have for social
                media managers and content creators, offering quick,
                customizable captions that resonate with your audience. Whether
                you're promoting products, sharing personal stories, or creating
                engagement-driven content, this tool saves time and delivers
                top-notch captions that fit your brand's tone. Meanwhile, the
                AI-Powered Image to Text Generator makes extracting text from
                screenshots, documents, or even handwritten notes a breeze,
                eliminating the need for manual transcription and boosting
                productivity for professionals and students alike.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Address pain points such as spending too much time creating
                captions, struggling to make your images SEO-friendly, or
                needing to digitize written content with precision. These
                AI-powered tools automate repetitive tasks, allowing you to
                focus on creativity and strategy. With AI on your side, you can
                enhance the accessibility, engagement, and efficiency of your
                image-driven content while improving SEO and boosting overall
                visibility.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
