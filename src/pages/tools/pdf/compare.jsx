import { NextSeo, FAQPageJsonLd } from 'next-seo'
import { useState, useCallback, useEffect, useRef } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { DocumentDuplicateIcon, MinusIcon, PlusIcon, ChevronLeftIcon, ChevronRightIcon, FingerPrintIcon, CodeBracketSquareIcon, ScaleIcon, ShieldCheckIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'
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

const useCases = [
  {
    name: 'Document Verification',
    description: 'Compare different versions of contracts, legal documents, or agreements to spot changes.',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Quality Control',
    description: 'Compare original and scanned documents to ensure accuracy and completeness.',
    icon: CheckBadgeIcon,
  },
  {
    name: 'Version Control',
    description: 'Identify differences between document versions quickly and accurately.',
    icon: CodeBracketSquareIcon,
  },
  {
    name: 'Contract Review',
    description: 'Easily spot changes in contract revisions and amendments.',
    icon: ScaleIcon,
  },
  {
    name: 'Document Auditing',
    description: 'Track and verify changes across multiple document versions.',
    icon: FingerPrintIcon,
  },
  {
    name: 'Compliance Checking',
    description: 'Ensure documents match approved templates and standards.',
    icon: ShieldCheckIcon,
  },
]

const faqs = [
  {
    question: 'How to compare two PDF files?',
    answer: 'It\'s easy to compare two PDF files with our tool: 1) Upload your first PDF document 2) Upload your second PDF document 3) Our tool will automatically analyze and highlight the differences between them. You can view differences side by side or in overlay mode page by page.',
  },
  {
    question: 'How does the PDF comparison tool work?',
    answer: 'Our PDF compare tool analyzes two PDF documents pixel by pixel, highlighting any differences between them. It displays both documents side by side with a third view showing the differences in red. This makes it easy to spot even minor changes between documents.',
  },
  {
    question: 'Can I compare PDFs of different sizes?',
    answer: 'Yes, our tool can handle PDFs of different sizes and will automatically adjust to show the differences accurately. Whether you\'re comparing scanned documents or digital PDFs, our comparison tool will align and analyze them properly.',
  },
  {
    question: 'How to compare PDF documents for differences?',
    answer: 'To compare PDF documents for differences: Upload both files to our free comparison tool, wait for the analysis to complete, and review the highlighted differences. You can switch between different view modes to see original documents side by side or view an overlay highlighting the changes.',
  },
  {
    question: 'What\'s the maximum PDF file size supported?',
    answer: 'Our tool can handle most standard PDF files. However, very large files may take longer to process. For optimal performance, we recommend files without too many pages.',
  },
  {
    question: 'Is this PDF compare tool free?',
    answer: 'Yes, our PDF comparison tool is completely free to use. You can compare two PDF files online without any registration or login required. There are no hidden fees or limitations.',
  },
  {
    question: 'How accurate is the PDF comparison?',
    answer: 'The tool performs a pixel-level comparison, making it highly accurate at detecting even minor differences between documents. It\'s suitable for comparing contracts, legal documents, research papers, and any other PDF files.',
  },
  {
    question: 'Is my PDF data secure?',
    answer: 'Yes, your privacy is important to us. PDF processing happens entirely in your browser, and files are not sent to or stored on our servers. This makes our tool safe for comparing sensitive documents.',
  },
  {
    question: 'Can I compare multiple PDF documents at once?',
    answer: 'Currently, you can compare two PDF files at a time. The tool will compare all pages in both documents and show the differences for each page pair. For comparing multiple documents, you\'ll need to process them in pairs.',
  },
  {
    question: 'Do I need Adobe Acrobat to compare PDF files?',
    answer: 'No, you don\'t need Adobe Acrobat or any other software. Our online PDF comparison tool works directly in your web browser, making it a convenient alternative to desktop PDF comparison software.',
  }
]

const PDFCompare = () => {
  const [pdf1, setPdf1] = useState(null);
  const [pdf2, setPdf2] = useState(null);
  const [error, setError] = useState('');
  const [pages, setPages] = useState([]);
  const [activeTab, setActiveTab] = useState('differences');
  const [currentPage, setCurrentPage] = useState(1);
  const [isComparing, setIsComparing] = useState(false); // Add this line

  useEffect(() => {
    if (pdf1 && pdf2) {
      // Validate that both files exist and are PDFs
      if (!pdf1 || !pdf2) {
        setError('Please select two valid PDF files.');
        setPages([]);
        return;
      }
      if (!pdf1.type.includes('pdf') || !pdf2.type.includes('pdf')) {
        setError('Please select valid PDF files only.');
        setPages([]);
        return;
      }
      
      setError('');
      renderPDFs(pdf1, pdf2);
    }
  }, [pdf1, pdf2]);

  const renderPDFs = async (file1, file2) => {
    if (!file1 || !file2) {
      setError('Please select two valid PDF files.');
      return;
    }

    setIsComparing(true); // Add this line
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/build/pdf.worker.min.mjs";
    try {
      // Convert files to ArrayBuffers first
      const [buffer1, buffer2] = await Promise.all([
        file1.arrayBuffer(),
        file2.arrayBuffer(),
      ]);

      const [doc1, doc2] = await Promise.all([
        pdfjsLib.getDocument(new Uint8Array(buffer1)).promise,
        pdfjsLib.getDocument(new Uint8Array(buffer2)).promise,
      ]);

      const pageCount = Math.max(doc1.numPages, doc2.numPages);
      const newPages = [];

      for (let i = 1; i <= pageCount; i++) {
        const [page1, page2] = await Promise.all([
          i <= doc1.numPages ? doc1.getPage(i) : null,
          i <= doc2.numPages ? doc2.getPage(i) : null,
        ]);

        const [canvas1, canvas2] = await Promise.all([
          page1 ? renderPageToCanvas(page1) : createEmptyCanvas(),
          page2 ? renderPageToCanvas(page2) : createEmptyCanvas(),
        ]);

        const diffCanvas = compareCanvases(canvas1, canvas2);
        newPages.push({ canvas1, canvas2, diffCanvas });
      }

      setPages(newPages);
    } catch (error) {
      console.error('Error rendering PDFs:', error);
      setError('Error rendering PDFs. Please try again with valid PDF files.');
    } finally {
      setIsComparing(false); // Add this line
    }
  };

  const renderPageToCanvas = async (page) => {
    const scale = 1.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;
    return canvas;
  };

  const createEmptyCanvas = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const compareCanvases = (canvas1, canvas2) => {
    const width = Math.max(canvas1.width, canvas2.width);
    const height = Math.max(canvas1.height, canvas2.height);

    const diffCanvas = document.createElement('canvas');
    diffCanvas.width = width;
    diffCanvas.height = height;
    const ctx = diffCanvas.getContext('2d');

    const img1 = canvas1.getContext('2d').getImageData(0, 0, canvas1.width, canvas1.height);
    const img2 = canvas2.getContext('2d').getImageData(0, 0, canvas2.width, canvas2.height);

    const diff = ctx.createImageData(width, height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const r1 = img1.data[i] || 255;
        const g1 = img1.data[i + 1] || 255;
        const b1 = img1.data[i + 2] || 255;
        const r2 = img2.data[i] || 255;
        const g2 = img2.data[i + 1] || 255;
        const b2 = img2.data[i + 2] || 255;

        if (r1 !== r2 || g1 !== g2 || b1 !== b2) {
          diff.data[i] = 255;
          diff.data[i + 1] = 0;
          diff.data[i + 2] = 0;
          diff.data[i + 3] = 128;
        }
      }
    }

    ctx.putImageData(diff, 0, 0);
    return diffCanvas;
  };

  return (
    <>
      <div className="mx-auto max-w-3xl text-center">
        <div className="py-12 pb-0">
          <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
            <Alert title={error} type="error" />
            
            {/* Add loading indicator */}
            {isComparing && (
              <div className="mb-4 flex items-center justify-center">
                <LoadingSpinner />
                <span className="ml-2 text-sm text-gray-600">Comparing PDFs...</span>
              </div>
            )}
            
            {!isComparing && pages.length === 0 && (
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pdf1" className="block text-sm font-medium text-gray-700 mb-2">
                    PDF 1
                  </label>
                  <PDFDropZone
                    id="pdf1"
                    file={pdf1}
                    setFile={setPdf1}
                    isComputing={isComparing}
                  />
                </div>
                <div>
                  <label htmlFor="pdf2" className="block text-sm font-medium text-gray-700 mb-2">
                    PDF 2
                  </label>
                  <PDFDropZone
                    id="pdf2"
                    file={pdf2}
                    setFile={setPdf2}
                    isComputing={isComparing}
                  />
                </div>
              </div>
            )}

            {/* PDF Comparison Display */}
            {pages.length > 0 && (
              <div className="">
                {/* Add pagination controls */}
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
                    Page {currentPage} of {pages.length}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(pages.length, prev + 1))}
                    disabled={currentPage === pages.length}
                    className={clsx(
                      "inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
                      currentPage === pages.length ? "text-gray-300 cursor-not-allowed" : "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    Next
                    <ChevronRightIcon className="ml-2 h-5 w-5" aria-hidden="true" />
                  </button>
                </div>

                {/* Replace the pages.map with single page display */}
                <div key={currentPage - 1} className="mb-8">
                  {/* Tabbed interface */}
                  <div>
                    <div className="sm:hidden">
                      <select
                        className="block w-full rounded-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
                        defaultValue="differences"
                      >
                        <option value="differences">Differences</option>
                        <option value="pdf1">PDF 1</option>
                        <option value="pdf2">PDF 2</option>
                      </select>
                    </div>
                    <div className="hidden sm:block">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex" aria-label="Tabs">
                          {['Differences', 'PDF 1', 'PDF 2'].map((tab) => (
                            <a
                              key={tab}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setActiveTab(tab.toLowerCase());
                              }}
                              className={clsx(
                                tab.toLowerCase() === activeTab
                                  ? 'border-cyan-500 text-cyan-600'
                                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                'w-1/3 border-b-2 py-4 px-1 text-center text-sm font-medium'
                              )}
                            >
                              {tab}
                            </a>
                          ))}
                        </nav>
                      </div>
                    </div>

                    {/* Tab content */}
                    <div className="mt-4">
                      <div className="relative">
                        {activeTab === 'differences' && (
                          <img 
                            src={pages[currentPage - 1].diffCanvas.toDataURL('image/png', 0.8)} 
                            className="mx-auto rounded-lg shadow-lg border border-gray-200 max-h-[80vh]"
                            alt="PDF differences"
                          />
                        )}
                        {activeTab === 'pdf 1' && (
                          <img 
                            src={pages[currentPage - 1].canvas1.toDataURL('image/jpeg', 0.8)} 
                            className="mx-auto rounded-lg shadow-lg border border-gray-200 max-h-[80vh]"
                            alt="PDF 1"
                          />
                        )}
                        {activeTab === 'pdf 2' && (
                          <img 
                            src={pages[currentPage - 1].canvas2.toDataURL('image/jpeg', 0.8)} 
                            className="mx-auto rounded-lg shadow-lg border border-gray-200 max-h-[80vh]"
                            alt="PDF 2"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                <div className="mt-4 flex items-center justify-center">
                  <button
                    onClick={() => {
                      setPdf1(null);
                      setPdf2(null);
                      setPages([]);
                      setError('');
                      setCurrentPage(1); // Reset current page
                      window.scrollTo({ top: 200, behavior: 'smooth' });
                    }}
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
  );
};

// Update main page component
export default function PDFComparePage({ starRatingData }) {
  return (
    <>
      <PDFScripts />
      <NextSeo
        title="Compare PDF Files Online | Free PDF Comparison Tool | No Login | Secure"
        description="Free online tool to compare two PDF files and spot differences instantly. Easy to use PDF comparison for contracts, documents, and files. Compare PDFs side by side with our free comparison tool. No signup needed."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/pdf-compare.png',
              alt: 'Compare PDF Files Online',
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
                  Free PDF Comparison Tool
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Compare two PDF documents side by side and instantly spot differences. Perfect for comparing contracts, legal documents, and files. Our free & secure PDF comparison tool makes it easy to identify changes between PDF files.
                </p>
                <PDFCompare />
                <StarRating
                  itemId="pdf-compare"
                  name="PDF Comparison Tool - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Chat with Your PDFs and Documents"
          description="Upload your PDFs and other documents to chat with them instantly. Ask questions, extract information, and gain insights from your files using our advanced AI-powered chatbots for research, analysis, and customer support."
          button="Chat with PDFs Free"
        />

        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Effortless PDF Comparison
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Compare Two PDF Files
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Follow these simple steps to compare PDF documents and spot differences in seconds - no login required.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">1</span>
                    Upload Your PDF Documents
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select and upload the two PDF files you want to compare. Our tool supports all standard PDF formats.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">2</span>
                    Compare PDFs
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Our tool will automatically analyze both documents and highlight any differences between them.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">3</span>
                    Review Differences
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the highlighted differences page by page and switch between different viewing modes.
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
                Use Cases for Our PDF Comparison Tool
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our PDF Comparison Tool can streamline your document review process and ensure accuracy across various domains.
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

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Writing" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('pdf-compare')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
}
