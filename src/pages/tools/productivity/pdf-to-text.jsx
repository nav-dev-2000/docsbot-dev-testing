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
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
// import remarkMath from 'remark-math'
// import rehypeKatex from 'rehype-katex'
import ToolsSignupModal from '@/components/ToolsSignupModal'
import PDFDropZone from '@/components/PDFDropZone'
import CarbonAd from '@/components/CarbonAd'
import Head from 'next/head'
// import 'katex/dist/katex.min.css'

const loadingText = [
  'Loading PDF...',
  'Extracting text from PDF...',
  'Processing document content...',
  'Cleaning up extracted text...',
  'Organizing content structure...',
  'Finalizing text extraction...',
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

const PDFToText = () => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [extractionResults, setExtractionResults] = useState([])
  const [copiedState, setCopiedState] = useState({ raw: false, markdown: false })
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
  
  const extractTextFromPDFFile = async (file) => {
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
          type: 'pdfToText',
          input: pdfText,
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

      // Add the new extraction result to the beginning of the results array
        setExtractionResults((prevResults) => [
          {
          text: data,
          timestamp: new Date().toISOString(),
          filename: file.name,
          },
        ...prevResults,
        ])

      setIsComputing(false)
        posthog?.capture('Free Tool', {
        tool: 'PDF to Text Converter',
        action: 'Success',
        category: 'Productivity',
        fileSize: file.size,
      })
    } catch (error) {
      console.error('Error:', error)
      setErrorText(error.message || 'Something went wrong while processing your PDF')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'PDF to Text Converter',
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
      setErrorText('Please select a PDF file to convert to text.')
      return
    }
    extractTextFromPDFFile(selectedFile)
  }

  const handleNewPDF = () => {
    setSelectedFile(null)
    setExtractionResults([])
    setErrorText(null)
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const copyLatestText = (format = 'raw') => {
    if (extractionResults.length > 0) {
      let textToCopy = extractionResults[0].text
      
      if (format === 'raw') {
        // Convert markdown to plain text by removing markdown formatting
        textToCopy = textToCopy
          .replace(/#{1,6}\s+/g, '') // Remove headers
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
          .replace(/\*(.*?)\*/g, '$1') // Remove italic
          .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links, keep text
          .replace(/`(.*?)`/g, '$1') // Remove inline code
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/^\s*[-*+]\s+/gm, '') // Remove bullet points
          .replace(/^\s*\d+\.\s+/gm, '') // Remove numbered lists
          .replace(/\|.*?\|/g, '') // Remove table formatting
          .replace(/^\s*\|.*\|\s*$/gm, '') // Remove table rows
          .replace(/^\s*[:|\s-]+\s*$/gm, '') // Remove table separators
          .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
          .trim()
      }
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        setCopiedState(prev => ({ ...prev, [format]: true }))
        setTimeout(() => {
          setCopiedState(prev => ({ ...prev, [format]: false }))
        }, 2000)
      })
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {extractionResults.length === 0 && (
            <>
              <PDFDropZone 
                file={selectedFile} 
                setFile={handleFileChange} 
                isComputing={isComputing} 
              />
            </>
          )}

          {extractionResults.map((result, index) => (
            <ExtractionResult key={index} result={result} />
          ))}

          {/* Only show the form if there are no results */}
          {extractionResults.length === 0 && (
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
                      <DocumentTextIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Convert PDF to Text
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <CarbonAd className="flex justify-center mt-4" />

          {extractionResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <button
                type="button"
                onClick={handleNewPDF}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
              >
                <DocumentTextIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Convert New PDF
              </button>
              <button
                onClick={() => copyLatestText('raw')}
                type="button"
                className={`rounded-lg text-center bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-md ring-1 ring-inset transition-all duration-200 hover:shadow-lg ${
                  copiedState.raw ? 'ring-green-500' : 'ring-gray-300'
                } hover:bg-gray-50`}
                title="Copy as plain text"
              >
                <div className="flex items-center justify-center">
                  <ClipboardDocumentIcon className={`h-5 w-5 transition-colors duration-200 ${
                    copiedState.raw ? 'text-green-500' : 'text-gray-600'
                  }`} />
                  <span className={`ml-2 transition-colors duration-200 ${
                    copiedState.raw ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {copiedState.raw ? 'Copied!' : 'Copy as Text'}
                  </span>
                </div>
              </button>
              <button
                onClick={() => copyLatestText('markdown')}
                type="button"
                className={`rounded-lg text-center bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-md ring-1 ring-inset transition-all duration-200 hover:shadow-lg ${
                  copiedState.markdown ? 'ring-green-500' : 'ring-gray-300'
                } hover:bg-gray-50`}
                title="Copy as markdown"
              >
                <div className="flex items-center justify-center">
                  <ClipboardDocumentIcon className={`h-5 w-5 transition-colors duration-200 ${
                    copiedState.markdown ? 'text-green-500' : 'text-gray-600'
                  }`} />
                  <span className={`ml-2 transition-colors duration-200 ${
                    copiedState.markdown ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {copiedState.markdown ? 'Copied!' : 'Copy as Markdown'}
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
        toolName="PDF to Text Converter"
        toolCategory="Productivity"
      />
    </div>
  )
}

const ExtractionResult = ({ result }) => {
  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]

  return (
    <div className="relative">
      <div className="min-h-16 max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200 max-h-96 overflow-auto">
        <Streamdown
          mode="static"
          isAnimating={false}
          remarkPlugins={streamdownRemarkPlugins}
        >
          {preprocessMath(result.text)}
        </Streamdown>
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'Document Digitization',
    description: 'Convert scanned documents, academic papers, and research materials into editable text format. Perfect for students, researchers, and professionals who need to work with text content.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Large PDF Text Extraction',
    description:
      'Extract text from extensive business reports, financial documents, and strategic plans. Our AI-powered tool handles complex layouts and formatting with high accuracy.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Legal Document Processing',
    description:
      'Convert legal contracts, briefs, and case documents into searchable, editable text format while preserving all content and maintaining accuracy.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Study Material Conversion',
    description:
      'Transform textbooks, course materials, and educational PDFs into plain text for easier copying, searching, and note-taking.',
    icon: MagnifyingGlassIcon,
  },
  {
    name: 'Technical Manual Processing',
    description:
      'Extract text from complex technical manuals, user guides, and specification documents, including text from diagrams and charts when possible.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Content Extraction',
    description:
      'Convert PDFs into clean text format for content creation, data entry, or further processing in other applications and workflows.',
    icon: PencilIcon,
  },
]

const faqs = [
  {
    question: 'What is the best free PDF to text converter online?',
    answer: 'Our free PDF to text converter is the best way to convert PDF to text free online. Using advanced AI technology, it extracts clean text from PDF files and shows you how to copy text from PDF easily. Works with complex layouts, tables, and diagrams.',
  },
  {
    question: 'How to copy text from PDF using this free converter?',
    answer:
      'Learning how to copy text from PDF is easy with our free PDF to text converter. Upload your PDF, click convert, then copy the extracted text. Our tool processes files in your browser and shows you exactly how to copy text from PDF files efficiently.',
  },
  {
    question: 'Can it handle large PDF documents?',
    answer:
      'Yes! Our PDF to text converter can process extensive documents including lengthy research papers, business reports, legal documents, academic articles, and technical manuals. It supports PDF files up to 10MB in size.',
  },
  {
    question: 'Does it extract text from images and diagrams in PDFs?',
    answer:
      'Yes! Our AI-powered converter can extract and organize text information from diagrams, charts, and tables when the text is embedded in the PDF. It reconstructs fragmented text and presents it in a readable format.',
  },
  {
    question: 'Is my PDF data secure?',
    answer:
      'Yes, we prioritize your privacy and security. PDF processing happens directly in your browser using PDF.js, and only the extracted text is sent to our servers for cleaning and organization. Your original PDF files are never uploaded or stored on our servers.',
  },
  {
    question: 'Can it handle scanned documents or image-based PDFs?',
    answer:
      'Our tool works best with text-based PDFs where the text is selectable. For scanned documents or image-based PDFs, you may need to use an OCR tool first to convert the images to text before using our converter.',
  },
  {
    question: 'What formats does the output come in?',
    answer:
      'The extracted text is provided as clean, formatted plain text that you can copy and paste into any application. The AI organizes the content with proper paragraph breaks and structure for easy reading and use.',
  },
  {
    question: 'Are there any file size limitations?',
    answer:
      'Yes, we support PDF files up to 10MB in size. For best results, the extracted text should be under 50,000 characters. Most documents including academic papers, reports, and manuals work well within these limits.',
  },
  {
    question: 'Is this really a free PDF to text converter?',
    answer:
      'Yes! Our PDF to text converter free tool has no hidden costs. Convert PDF to text free online without signup or subscription. It\'s the best free PDF to text converter for anyone learning how to copy text from PDF files.',
  },
]

export default function PDFToTextPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="Free PDF to Text Converter | Convert PDF to Text Free Online"
        description="Free PDF to text converter online. Convert PDF to text free with our AI tool. Learn how to copy text from PDF files easily. Best free PDF to text converter with no signup required."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/pdf-to-text.png',
              alt: 'Free PDF to Text Converter - AI Powered',
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
                  Free PDF to Text Converter
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Convert PDF to text free with our AI-powered PDF to text converter. Learn how to copy text from PDF files easily - extract clean, formatted text from tables, charts, and diagrams. Best free PDF to text converter online with no signup required.
                </p>
                <PDFToText />
                <StarRating
                  itemId="pdf-to-text"
                  name="PDF to Text Converter - DocsBot"
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
                Convert PDF to Text Free
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Copy Text from PDF - Free PDF to Text Converter
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Learn how to copy text from PDF files with our free PDF to text converter. Convert PDF to text free online - extract clean, formatted text from any PDF document in seconds. Best free PDF to text converter for digitizing documents.
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
                      Select any PDF document from your device (up to 10MB). Our free PDF to text converter online works with large PDFs, research papers, reports, contracts, and any text-based document. Easy way to convert PDF to text free.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    AI Processing
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Our AI extracts raw text from your PDF and then cleans up formatting issues, organizes content structure, and reconstructs text from tables and diagrams.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Get Clean Text
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Click 'Convert PDF to Text' and learn how to copy text from PDF easily. Receive clean, well-formatted text that you can copy, edit, or use in any application. Our PDF to text converter free tool preserves all content.
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
                Best Free PDF to Text Converter Use Cases
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how to copy text from PDF files and convert PDF to text free with our AI-powered tool. Streamline your document processing across various domains with our free PDF to text converter.
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
  const starRatingData = await getRating('pdf-to-text')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
