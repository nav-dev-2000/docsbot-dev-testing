import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect, useRef } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { DocumentDuplicateIcon, PencilSquareIcon, CameraIcon, EyeIcon, GlobeAltIcon, ClipboardDocumentIcon, MinusIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, ArrowDownTrayIcon, DevicePhoneMobileIcon, ChartBarIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'
import { Disclosure } from '@headlessui/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import Script from 'next/script'
import PDFDropZone from '@/components/PDFDropZone'

// Add these components before the PDFToImagesGenerator component
const PDFScripts = () => {
  return (
    <>
      <Script
        id="pdf-js-lib"
        strategy="lazyOnload"
        type="module"
      >
        {`
          import pdfjsLib from 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/+esm';
        `}
      </Script>
    </>
  )
}

// Modify the convertPDFToImages function to use window.pdfjsLib
async function convertPDFToImages(file, desiredWidth = 1600) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs";
  const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise
  const numPages = pdf.numPages
  
  async function* images() {
    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')
        canvas.width = desiredWidth
        canvas.height = (desiredWidth / viewport.width) * viewport.height
        const renderContext = {
          canvasContext: context,
          viewport: page.getViewport({ scale: desiredWidth / viewport.width }),
        }
        await page.render(renderContext).promise
        const imageURL = canvas.toDataURL('image/jpeg', 0.8)
        yield { imageURL }
      } catch (error) {
        console.error(`Error rendering page ${i}:`, error)
      }
    }
  }
  return { numPages, imageIterator: images() }
}

const useCases = [
  {
    name: 'Share PDF Content',
    description: 'Convert PDF pages to images for easy sharing on social media, messaging apps, or presentations.',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Extract Diagrams & Figures',
    description: 'Pull out charts, diagrams, and illustrations from PDF documents as standalone images.',
    icon: ChartBarSquareIcon,
  },
  {
    name: 'Create Visual References',
    description: 'Convert PDF pages to images for quick visual reference or archival purposes.',
    icon: CameraIcon,
  },
  {
    name: 'Mobile-Friendly Format',
    description: 'Convert PDF pages to images for better viewing on mobile devices and tablets.',
    icon: DevicePhoneMobileIcon,
  },
  {
    name: 'Document Preservation',
    description: 'Save important PDF pages as images for long-term preservation and compatibility.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Easy Integration',
    description: 'Convert PDF pages to images for use in other documents, websites, or applications.',
    icon: ClipboardDocumentIcon,
  },
]

const faqs = [
  {
    question: 'What image format are the PDF pages converted to?',
    answer: 'Pages are converted to high-quality JPEG images, which offer a good balance between quality and file size. Each page maintains its original aspect ratio and content clarity.',
  },
  {
    question: 'Can I convert specific pages from my PDF?',
    answer: 'Yes, you can navigate through the converted pages and download individual pages as needed. You also have the option to download all pages at once.',
  },
  {
    question: 'What\'s the maximum PDF file size supported?',
    answer: 'Our tool can handle most standard PDF files. However, very large files (over 100MB) may take longer to process. For optimal performance, we recommend files under 50MB.',
  },
  {
    question: 'How is the image quality determined?',
    answer: 'Images are generated at a default width of 1600 pixels, maintaining the original aspect ratio. This provides good quality for most uses while keeping file sizes manageable.',
  },
  {
    question: 'Is my PDF data secure?',
    answer: 'Yes, your privacy is important to us. PDF processing happens in your browser, and files are not sent to or stored on our servers. The conversion process is completely private.',
  },
  {
    question: 'Can I use the converted images commercially?',
    answer: 'Yes, you can use the converted images as you wish. However, ensure you have the necessary rights to use and distribute the original PDF content.',
  },
]

const PDFToImagesGenerator = ({ setHasResults }) => {
  const [pdf, setPdf] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [images, setImages] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const posthog = usePostHog()
  const abortControllerRef = useRef(null)
  const [filename, setFilename] = useState('')

  const convertPDF = async () => {
    setIsComputing(true)
    setErrorText('')
    setImages([])
    setCurrentPage(1)

    if (!pdf) {
      setErrorText('Please upload a PDF file.')
      setIsComputing(false)
      return
    }

    try {
      const { numPages, imageIterator } = await convertPDFToImages(pdf)
      setTotalPages(numPages)
      
      // Create new abort controller
      abortControllerRef.current = new AbortController()
      
      for await (const { imageURL } of imageIterator) {
        if (abortControllerRef.current.signal.aborted) break
        setImages(prev => [...prev, imageURL])
      }

      posthog?.capture('Free Tool', {
        tool: 'PDF to Image Converter',
        action: 'Converted',
        category: 'PDF',
      })
    } catch (error) {
      setErrorText('Error converting PDF: ' + error.message)
      posthog?.capture('Free Tool', {
        tool: 'PDF to Image Converter',
        action: 'Error',
        error: error.message,
        category: 'PDF',
      })
    }
    setIsComputing(false)
  }

  const resetTool = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setPdf(null)
    setImages([])
    setCurrentPage(1)
    setTotalPages(0)
    setErrorText(null)
    window.scrollTo({
      top: 200,
      behavior: 'smooth'
    });
  }

  const downloadImage = (imageUrl, pageNumber) => {
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${filename}-page-${pageNumber}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAllImages = () => {
    images.forEach((imageUrl, index) => {
      downloadImage(imageUrl, index + 1)
    })
  }

  const handleSetPdf = (file) => {
    setPdf(file)
    setFilename(file?.name?.replace('.pdf', '') || 'document')
  }

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={errorText} type="error" />
            {images.length === 0 && (
              <div className="mb-4">
                <PDFDropZone
                  file={pdf}
                  setFile={handleSetPdf}
                  isComputing={isComputing}
                />
              </div>
            )}

            {/* Add conversion button and progress */}
            {!images.length && pdf && (
              <button
                onClick={convertPDF}
                disabled={isComputing}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> Converting PDF...
                  </>
                ) : (
                  <>Convert PDF to Images</>
                )}
              </button>
            )}

            {/* Add image preview and navigation */}
            {images.length > 0 && (
              <div className="">
                <div className="flex items-center justify-center mb-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={clsx(
                      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
                      currentPage === 1 ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    <ChevronLeftIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Previous
                  </button>
                  <span className="mx-4 text-sm text-gray-700">
                    Page {currentPage} of {images.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(images.length, prev + 1))}
                    disabled={currentPage === images.length}
                    className={clsx(
                      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
                      currentPage === images.length ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    Next
                    <ChevronRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                  </button>
                </div>
                <div className="relative">
                  <button
                    onClick={() => downloadImage(images[currentPage - 1], currentPage)}
                    className="absolute right-2 top-2 inline-flex items-center rounded-md bg-gray-200 bg-opacity-75 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-300"
                  >
                    <ArrowDownTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Download Page
                  </button>
                  <img
                    src={images[currentPage - 1]}
                    alt={`Page ${currentPage}`}
                    className="mx-auto h-auto max-w-full rounded-lg shadow-lg border border-gray-200"
                  />
                </div>
                
                {/* Add footer with actions */}
                <div className="mt-4 flex items-center justify-center space-x-4">
                  <button
                    onClick={downloadAllImages}
                    className="inline-flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700"
                  >
                    <ArrowDownTrayIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                    Download All Pages
                  </button>
                  <button
                    onClick={resetTool}
                    className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function PDFToImagesPage({ starRatingData }) {
  const [hasResults, setHasResults] = useState(false)

  return (
    <>
      <PDFScripts />
      <NextSeo
        title="Free PDF to Image Converter | Extract PDF Pages as Images | No Login"
        description="Convert PDF pages to high-quality images with our free tool. Extract individual or all pages from your PDF as JPG images. No signup required, instant download."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/pdf-image.png',
              alt: 'PDF to Image Converter',
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
                  Free PDF to Image Converter
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Extract pages from your PDF files as high-quality images. Convert single or multiple pages, preview results instantly, and download images individually or all at once. No signup needed.
                </p>
                <PDFToImagesGenerator setHasResults={setHasResults} />
                <StarRating
                  itemId="ai-pdf-to-images-converter"
                  name="AI PDF to Image Converter - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        {!hasResults && (
          <>
            <div className="bg-white py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                  <h2 className="text-base font-semibold leading-7 text-cyan-600">
                    Effortless PDF Page Image Extraction
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    How to Use Our PDF to Image Converter
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-600">
                    Follow these simple steps to convert your PDF files to images in seconds.
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
                          Select and upload the PDF file you want to convert.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          2
                        </span>
                        Convert PDF
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Click the 'Convert PDF' button and let our tool analyze your PDF and convert it to images.
                        </p>
                      </dd>
                    </div>
                    <div className="flex flex-col">
                      <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                        <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                          3
                        </span>
                        Review and Copy
                      </dt>
                      <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                        <p className="flex-auto">
                          Review the converted images and download them with a single click for your use.
                        </p>
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            <div className="bg-gray-900 py-24 sm:py-32">
              <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="mx-auto max-w-2xl lg:text-center">
                  <h2 className="text-base font-semibold leading-7 text-cyan-400">
                    Versatile Applications
                  </h2>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Use Cases for Our PDF to Image Extractor
                  </p>
                  <p className="mt-6 text-lg leading-8 text-gray-300">
                    Discover how our PDF to Image Converter can streamline your workflow and enhance productivity across various domains.
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
          </>
        )}

        <RegisterCTA
          customTitle="Chat with Your PDFs and Documents"
          description="Upload your PDFs and other documents to chat with them instantly. Ask questions, extract information, and gain insights from your files using our advanced AI-powered chatbots for research, analysis, and customer support."
          button="Chat with PDFs Free"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('ai-pdf-to-images-converter')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
