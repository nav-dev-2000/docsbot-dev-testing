import { useState, useEffect } from 'react'
import { NextSeo, FAQPageJsonLd } from 'next-seo'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import Link from 'next/link'
import {
  CodeBracketIcon,
  HashtagIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/20/solid'
import clsx from 'clsx'

const WebsiteFAQPage = ({ faqs, videoId }) => {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedFormat, setCopiedFormat] = useState(null);

  useEffect(() => {
    if (copiedIndex !== null || copiedFormat !== null) {
      const timer = setTimeout(() => {
        setCopiedIndex(null);
        setCopiedFormat(null);
      }, 2000); // Reset after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [copiedIndex, copiedFormat]);

  const title = faqs.short_title || faqs.title;

  const copyAllFAQs = (format) => {
    let content = '';

    if (format === 'markdown') {
      content += `# ${title}\n\n## Frequently Asked Questions\n\n`;
      faqs.faqs.forEach((faq, index) => {
        content += `### ${faq.question}\n\n${faq.answer}\n\n`;
      });
    } else if (format === 'html') {
      content += `<h1>${title}</h1>\n<h2>Frequently Asked Questions</h2>\n\n`;
      faqs.faqs.forEach((faq, index) => {
        content += `<h3>${faq.question}</h3>\n<p>${faq.answer}</p>\n\n`;
      });
    } else {
      content += `${title}\n\nFrequently Asked Questions\n\n`;
      faqs.faqs.forEach((faq, index) => {
        content += `${faq.question}\n${faq.answer}\n\n`;
      });
    }
    navigator.clipboard.writeText(content);
    setCopiedFormat(format);
  };

  return (
    <>
      <NextSeo
        title={`Frequently Asked Questions about ${title}`}
        description={`AI-generated frequently asked questions (FAQ) for YouTube video: ${title}`}
        openGraph={{
          images: [
            {
              url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              alt: title,
            },
          ],
        }}
        noindex={!faqs.is_ai}
      />
      <FAQPageJsonLd
        mainEntity={faqs.faqs.map((faq) => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
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
            <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-6"> {/* Reduced padding */}
              <div className="mx-auto max-w-full text-center"> {/* Changed to max-w-full */}
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  {title}
                </h1>
                <p className="mt-4 text-xl text-gray-300">
                  Frequently Asked Questions
                </p>
                
                {/* YouTube embed with adjusted width */}
                <div className="mt-8 mb-6 mx-auto w-full max-w-3xl bg-white rounded-lg p-8"> {/* Changed from w-4/5 to w-full max-w-3xl */}
                  <div className="rounded-lg">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-[400px] rounded-lg"
                      ></iframe>
                    </div>
                    <p className="mt-6 text-lg leading-8 text-gray-800">
                  {faqs.one_sentence_takeaway}
                </p>
                    <div className="flex justify-between space-x-4 mt-4">
                      {[
                        { format: 'markdown', icon: HashtagIcon },
                        { format: 'html', icon: CodeBracketIcon },
                        { format: 'text', icon: DocumentTextIcon },
                      ].map(({ format, icon: Icon }) => (
                        <button
                          key={format}
                          className={`inline-flex items-center w-full justify-center px-3 py-2 border text-sm leading-4 font-medium rounded-md transition-colors duration-300 ${
                            copiedFormat === format
                              ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-600 text-white'
                              : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-700 hover:text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500`}
                          onClick={() => copyAllFAQs(format)}
                        >
                          <Icon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                          {copiedFormat === format ? "Copied!" : `Copy as ${format.charAt(0).toUpperCase() + format.slice(1)}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                
                <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6 text-center">
                  <div className="py-12 pb-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                      {faqs.faqs.map((faq, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 sm:p-6 flex flex-col h-full w-full text-left">
                          <h3 className="text-xl font-semibold text-white mb-2">{faq.question}</h3>
                          <p className="text-gray-300 mb-4 flex-grow">{faq.answer}</p>
                          <div className="mt-auto flex justify-center">
                            <button
                              className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md transition-colors duration-300 ${
                                copiedIndex === index
                                  ? 'bg-cyan-600 hover:bg-cyan-700 border-cyan-400 text-white'
                                  : 'bg-transparent hover:bg-gray-700 border-white hover:border-cyan-400 text-white'
                              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-400`}
                              onClick={() => {
                                navigator.clipboard.writeText(`${faq.question}\n${faq.answer}`);
                                setCopiedIndex(index);
                              }}
                            >
                              <ClipboardDocumentIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
                              {copiedIndex === index ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Link
                    href="/tools/ai-youtube-faq-generator"
                    className="mt-12 inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-6 py-3 text-xl font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
                  >
                    Generate FAQs from another video
                  </Link>
                </div>
              </div>
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

export default WebsiteFAQPage

export const getServerSideProps = async (context) => {
  const { videoId } = context.params

  console.log('Received videoId:', videoId)

  if (!videoId || typeof videoId !== 'string' || videoId.length !== 11) {
    console.log('Invalid videoId, redirecting to YouTube FAQ generator')
    return {
      redirect: {
        destination: '/tools/ai-youtube-faq-generator',
        permanent: false,
      },
    }
  }

  // Dynamically import server-side modules
  const { lookupYoutubeData } = await import('@/lib/tools')

  const cachedData = await lookupYoutubeData(videoId, 'faq')
  if (!cachedData) {
    console.log('No cached data found, redirecting to YouTube FAQ generator')
    return {
      redirect: {
        destination: '/tools/ai-youtube-faq-generator',
        permanent: false,
      },
    }
  }

  return {
    props: {
      faqs: cachedData,
      videoId,
    },
  }
}
