import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'

export default function CustomerSupportTools() {
  const uniqueCategories = ['Customer Support']

  return (
    <>
      <NextSeo
        title="Free AI Customer Support Tools - DocsBot AI"
        description="Explore our collection of free AI customer support tools for streamlining operations, enhancing satisfaction, and optimizing service efficiency."
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
                Free AI-Powered Customer Support Tools
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Streamline your customer service and enhance customer satisfaction with our AI-powered customer support tools, specifically designed to automate and optimize your service operations. Whether you're running a small business or managing a large e-commerce site, our tools help you address customer inquiries more efficiently, leading to improved customer retention and satisfaction. From generating comprehensive FAQs to calculating potential chatbot savings, our AI solutions are designed to revolutionize your customer support experience.
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
          customTitle="Create an AI Chatbot for Customer Support"
          description="Turn your customer support documentation or FAQs into an AI-powered chatbot. Easily build a knowledgeable assistant that can handle customer inquiries 24/7, then embed it in your website or app."
          button="Create a Free Customer Support Chatbot"
        />
        
        <div className="bg-gray-900 py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-7xl text-center">
              <p className="mt-4 text-lg leading-8 text-gray-300">
                Our AI-Powered FAQ Generator helps businesses instantly create a comprehensive FAQ section based on their website's content, improving both user experience and SEO. By answering common questions proactively, this tool reduces the burden on customer service teams while ensuring visitors find the information they need quickly.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                The AI-Powered Support Chatbot Savings Calculator helps you estimate potential cost savings from using a GPT-powered chatbot for your customer support. Imagine automating repetitive inquiries, providing 24/7 assistance, and reducing the need for human intervention in routine tasks. This tool is perfect for businesses looking to cut operational costs while improving service quality.
              </p>
              <p className="mt-4 text-lg leading-8 text-gray-300">
                These tools solve common pain points like high customer service costs, long response times, and inconsistent support quality. By leveraging AI, you can scale your customer support operations without hiring more staff, maintain high levels of customer satisfaction, and improve your bottom line. Whether it's automating FAQs or deploying an AI chatbot, our tools help businesses offer reliable, round-the-clock support while reducing costs and enhancing customer experience.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
