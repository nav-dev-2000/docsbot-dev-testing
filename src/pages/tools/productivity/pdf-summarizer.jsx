import { NextSeo } from 'next-seo'
import { useState, useEffect } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import {
  AcademicCapIcon,
  DocumentTextIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import PDFDropZone from '@/components/PDFDropZone'
import CarbonAd from '@/components/CarbonAd'
import Head from 'next/head'

const loadingText = [
  'Loading PDF...',
  'Extracting text from PDF...',
  'Analyzing document content...',
  'Identifying key sections...',
  'Generating summary...',
  'Finalizing summary...',
]

// text that slowly fades in and out walking through the above array
const LoadingText = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex < loadingText.length - 1) {
          return prevIndex + 1
        }
        clearInterval(interval)
        return prevIndex
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return <p className="animate-pulse">{loadingText[index]}</p>
}

const PDFSummarizer = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [summaryResults, setSummaryResults] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [summaryType, setSummaryType] = useState('detailed')
  const [pdfLibraryLoaded, setPdfLibraryLoaded] = useState(false)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  useEffect(() => {
    // Load PDF.js library from CDN
    const loadPdfJs = () => {
      if (window.pdfjsLib || pdfLibraryLoaded) {
        setPdfLibraryLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
        setPdfLibraryLoaded(true)
      }
      script.onerror = () => {
        setErrorText('Failed to load PDF.js library. Please refresh the page and try again.')
      }
      document.head.appendChild(script)
    }

    loadPdfJs()
  }, [pdfLibraryLoaded])
  
  const extractTextFromPDF = async (file) => {
    if (!pdfLibraryLoaded || !window.pdfjsLib) {
      throw new Error('PDF.js library not loaded')
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map(item => item.str).join(' ')
      fullText += pageText + '\n'
    }

    return fullText.trim()
  }
  
  const summarizePDF = async (file) => {
    setIsComputing(true)
    setErrorText('')

    try {
      // Wait for PDF.js library to load if it hasn't already
      if (!pdfLibraryLoaded) {
        let attempts = 0
        while (!pdfLibraryLoaded && attempts < 50) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }
        if (!pdfLibraryLoaded) {
          throw new Error('PDF processing library failed to load. Please refresh and try again.')
        }
      }

      // Extract text from PDF
      const pdfText = await extractTextFromPDF(file)
      
      if (!pdfText.trim()) {
        throw new Error('Could not extract text from PDF. The PDF might be image-based or corrupted.')
      }

      if (pdfText.length > 50000) {
        throw new Error('PDF content is too long. Please use a smaller PDF (max ~50,000 characters).')
    }

    const endpoint = `/api/tools/text-prompter`
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pdfSummarize',
          input: pdfText,
          summaryType: summaryType,
        }),
      })

      const data = await response.json()

        if (response.status === 429) {
        setErrorText('You have reached the rate limit. Please try again later.')
        setIsComputing(false)
        return
      }

      if (response.status === 403) {
          setShowSignupModal(true)
        setIsComputing(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong')
      }

      // Add the new summary to the beginning of the results array
        setSummaryResults((prevResults) => [
          {
          text: data,
          timestamp: new Date().toISOString(),
          filename: file.name,
          summaryType: summaryType,
          },
        ...prevResults,
        ])

      setIsComputing(false)
        posthog?.capture('Free Tool', {
        tool: 'PDF Summarizer',
        action: 'Success',
        category: 'Productivity',
        fileSize: file.size,
        summaryType: summaryType,
      })
    } catch (error) {
      console.error('Error:', error)
      setErrorText(error.message || 'Something went wrong while processing your PDF')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'PDF Summarizer',
        action: 'Error',
        error: error.message,
        category: 'Productivity',
      })
    }
  }

  const handleFileChange = (file) => {
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setErrorText('PDF file is too large. Please select a file under 10MB.')
        return
      }
      setSelectedFile(file)
      setErrorText(null)
    } else {
      // Handle file removal
      setSelectedFile(null)
      setErrorText(null)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setErrorText('Please select a PDF file to summarize.')
      return
    }
    summarizePDF(selectedFile)
  }

  const handleNewPDF = () => {
    setSelectedFile(null)
    setSummaryResults([])
    setErrorText(null)
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyLatestSummary = () => {
    if (summaryResults.length > 0) {
      navigator.clipboard.writeText(summaryResults[0].text).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {summaryResults.length === 0 && (
            <>
              <div className="mb-4">
                <label htmlFor="summary-type" className="block text-sm font-medium text-gray-700 mb-2">
                  Summary Type
                </label>
                <select
                  id="summary-type"
                  value={summaryType}
                  onChange={(e) => setSummaryType(e.target.value)}
                disabled={isComputing}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm"
                >
                  <option value="brief">Brief (2-3 paragraphs)</option>
                  <option value="detailed">Detailed (4-6 paragraphs)</option>
                  <option value="comprehensive">Comprehensive (Full analysis)</option>
                </select>
              </div>
              <PDFDropZone 
                file={selectedFile} 
                setFile={handleFileChange} 
                isComputing={isComputing} 
              />
            </>
          )}

          {summaryResults.map((result, index) => (
            <SummaryResult key={index} result={result} />
          ))}

          {/* Only show the form if there are no results */}
          {summaryResults.length === 0 && (
            <form onSubmit={handleSubmit}>
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={isComputing || !selectedFile}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> <LoadingText />
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Summarize PDF
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <CarbonAd className="flex justify-center mt-4" />

          {summaryResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={handleNewPDF}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
              >
                <SparklesIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Summarize New PDF
              </button>
              <button
                onClick={copyLatestSummary}
                type="button"
                className={`rounded-lg text-center bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-md ring-1 ring-inset transition-all duration-200 hover:shadow-lg ${
                  isCopied ? 'ring-green-500' : 'ring-gray-300'
                } hover:bg-gray-50`}
                title="Copy to clipboard"
              >
                <div className="flex items-center justify-center">
                  <ClipboardDocumentIcon className={`h-5 w-5 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-600'
                  }`} />
                  <span className={`ml-2 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {isCopied ? 'Copied!' : 'Copy Summary'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="PDF Summarizer"
        toolCategory="Productivity"
      />
    </div>
  )
}

const SummaryResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(result.text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const processMarkdown = (text) => {
    return unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(text)
      .toString()
  }

  const processedSummaryMarkdown = processMarkdown(result.text)

  return (
    <div className="relative">
      <div className="prose prose-h2:mt-0 min-h-16 max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200">
        <div
          dangerouslySetInnerHTML={{
            __html: processedSummaryMarkdown,
          }}
        />
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Academic Research & Assignments',
    description: 'Free AI PDF summarizer perfect for students and researchers. Extract key insights from research papers, theses, and assignment documents with ChatGPT-level accuracy.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Large PDF Documents',
    description:
      'Our large PDF summarizer handles extensive business reports, financial documents, and strategic plans. Advanced AI PDF summarizer for processing lengthy corporate documents.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Legal Document Review',
    description:
      'Quickly understand contracts, legal briefs, and case documents by extracting the most important terms, conditions, and key points.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Study Material Prep',
    description:
      'Transform textbooks, course materials, and educational PDFs into concise study notes highlighting essential concepts and facts.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Technical Documentation',
    description:
      'Simplify complex technical manuals, user guides, and specification documents into clear, actionable summaries for easier understanding.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Content Creation',
    description:
      'Convert lengthy PDFs into blog post outlines, article summaries, or content briefs for writers and marketing teams.',
    icon: PencilIcon,
  },
]

const faqs = [
  {
    question: 'What is the best free AI PDF summarizer?',
    answer: 'Our free ChatGPT PDF summarizer is among the best AI PDF summarizers available, using advanced GPT technology to extract and analyze text from PDF documents. It generates concise summaries highlighting key points, main arguments, and important details, helping users quickly understand large PDFs without reading the entire content.',
  },
  {
    question: 'How does this free ChatGPT PDF summarizer work?',
    answer:
      'Our free AI PDF summarizer uses PDF.js to extract text from your uploaded PDF files directly in your browser. The extracted text is then processed by ChatGPT-level AI models to create structured summaries with different levels of detail - brief, detailed, or comprehensive. It works like ChatGPT for documents.',
  },
  {
    question: 'Can this large PDF summarizer handle big documents?',
    answer:
      'Yes! Our large PDF summarizer can process extensive documents including lengthy research papers, business reports, legal documents, academic articles, assignments, and technical manuals. This free AI PDF summarizer handles documents up to 10MB in size.',
  },
  {
    question: 'Is this better than other PDF summarizer tools?',
    answer:
      'Yes! Our free ChatGPT PDF summarizer offers superior accuracy compared to basic AI PDF reader tools. Perfect for students needing assignment help, researchers, and professionals who need a reliable AI PDF summarizer for their work - completely free.',
  },
  {
    question: 'Is my PDF data secure?',
    answer:
      'Yes, we prioritize your privacy and security. PDF processing happens directly in your browser using PDF.js, and only the extracted text is sent to our servers for summarization. Your original PDF files are never uploaded or stored on our servers.',
  },
  {
    question: 'Can it handle technical or specialized documents?',
    answer:
      'Yes, our AI is trained to understand and summarize various types of content, including technical documents, academic papers, legal texts, and business reports. It maintains accuracy while making complex information more accessible.',
  },
  {
    question: 'What are the different summary types?',
    answer:
      'We offer three summary types: Brief (2-3 paragraphs with main points), Detailed (4-6 paragraphs with key sections), and Comprehensive (full analysis with all major sections and supporting details). Choose based on your needs.',
  },
  {
    question: 'Are there any file size limitations?',
    answer:
      'Yes, we support PDF files up to 10MB in size. For best results, the extracted text should be under 50,000 characters. Large academic papers, reports, and books typically work well within these limits.',
  },
]

export default function PDFSummarizerPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free AI PDF Summarizer | ChatGPT-Powered Document Reader"
        description="Free AI PDF summarizer tool powered by ChatGPT. Summarize large PDFs instantly - research papers, reports, assignments. Best AI PDF reader and summarizer with no signup required."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/pdf-summarizer.png',
              alt: 'Free AI PDF Summarizer - ChatGPT Powered',
            },
          ],
        }}
      />
      <FAQPageJsonLd
        mainEntity={faqs.map((faq) => ({
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
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Free AI PDF Summarizer
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Free AI PDF summarizer powered by ChatGPT technology. Upload large PDFs and get instant summaries of research papers, business reports, assignments, and technical documents. Our AI PDF reader and summarizer works like ChatGPT for documents - completely free with no signup required.
                </p>
                <PDFSummarizer />
                <StarRating
                  itemId="pdf-summarizer"
                  name="PDF Summarizer - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Build Custom AI Bots for Your Documents - Free Trial!"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                ChatGPT PDF Summarizer
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our Free AI PDF Summarizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Our free ChatGPT PDF summarizer transforms large PDF documents into clear, insightful summaries in seconds. Perfect for assignments, research papers, and business documents.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Upload Your PDF
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select any PDF document from your device (up to 10MB). Our free AI PDF summarizer works with large PDFs, research papers, reports, assignments, and any text-based document.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Choose Summary Type
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select your preferred summary length: Brief (2-3 paragraphs), Detailed (4-6 paragraphs), or Comprehensive (full analysis).
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Get Your Summary
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click 'Summarize PDF' and our GPT PDF summarizer will extract text and create a structured summary with key points, details, and conclusions - just like ChatGPT for documents.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Many Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our Free AI Support Ticket Summarizer
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Support Ticket Summarizer can improve your support workflow and boost productivity across various domains.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-300">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                            <span className="text-base font-semibold leading-7">
                              {faq.question}
                            </span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              ) : (
                                <PlusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">
                            {faq.answer}
                          </p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Productivity" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('pdf-summarizer')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
