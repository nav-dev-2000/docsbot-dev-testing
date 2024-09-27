import { NextSeo } from 'next-seo'
import { useState, useCallback } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import { usePostHog } from 'posthog-js/react'

const resizeImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const scaleFactor = Math.min(1024 / img.width, 1024 / img.height)
        canvas.width = img.width * scaleFactor
        canvas.height = img.height * scaleFactor
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg'))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

const ImageToTextGenerator = () => {
  const [image, setImage] = useState(null)
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [extractedText, setExtractedText] = useState('')
  const [textCopied, setTextCopied] = useState(false)
  const posthog = usePostHog()

  const handleImageUpload = useCallback(async (e) => {
    const file = e.target.files[0]
    if (file) {
      const resizedImage = await resizeImage(file)
      setImage(resizedImage)
      
      // Track image upload
      posthog?.capture('Free Tool', {
        tool: 'Image to Text Generator',
        action: 'Upload Image',
        category: 'Image'
      })
    }
  }, [posthog])

  const extractText = async () => {
    setIsComputing(true)
    setErrorText('')

    if (!image) {
      setErrorText('Please upload an image.')
      setIsComputing(false)
      
      // Track no image error
      posthog?.capture('Free Tool', {
        tool: 'Image to Text Generator',
        action: 'Error',
        error: 'No Image Uploaded',
        category: 'Image'
      })
      return
    }

    const endpoint = `/api/tools/image-text-generator`
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: image.split(',')[1], // Remove the data URL prefix
      }),
    })

    try {
      const data = await response.json()
      if (response.ok) {
        setExtractedText(data.text)
        
        // Track successful text extraction
        posthog?.capture('Free Tool', {
          tool: 'Image to Text Generator',
          action: 'Used',
          category: 'Image'
        })
      } else if (response.status === 429) {
        setErrorText(
          'Daily usage limit exceeded, please try again tomorrow or create a free account.',
        )
        
        // Track usage limit exceeded
        posthog?.capture('Free Tool', {
          tool: 'Image to Text Generator',
          action: 'Error',
          error: 'Usage Limit Exceeded',
          category: 'Image'
        })
      } else {
        setErrorText(data.message || 'Something went wrong, please try again.')
        
        // Track error
        posthog?.capture('Free Tool', {
          tool: 'Image to Text Generator',
          action: 'Error',
          error: data.message || 'Unknown error',
          category: 'Image'
        })
      }
    } catch (e) {
      setErrorText('Error ' + response.status + ', please try again. ' + e)
      
      // Track error
      posthog?.capture('Free Tool', {
        tool: 'Image to Text Generator',
        action: 'Error',
        error: `Error ${response.status}: ${e}`,
        category: 'Image'
      })
    }

    setIsComputing(false)
  }

  const copyText = () => {
    navigator.clipboard.writeText(extractedText)
    setTextCopied(true)
    setTimeout(() => setTextCopied(false), 1500)
    
    // Track text copy
    posthog?.capture('Free Tool', {
      tool: 'Image to Text Generator',
      action: 'Copy Text',
      category: 'Image'
    })
  }

  const resetTool = () => {
    setImage(null)
    setExtractedText('')
    setErrorText(null)
    
    // Track tool reset
    posthog?.capture('Free Tool', {
      tool: 'Image to Text Generator',
      action: 'Reset Tool',
      category: 'Image'
    })
  }

  return (
    <div className="mx-auto max-w-3xl text-center">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <Alert title={errorText} type="error" />
          {!extractedText && (
            <div className="mb-4">
              <label
                htmlFor="image-upload"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Upload Image
              </label>
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isComputing}
                className="block w-full cursor-pointer text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-cyan-600 file:ring-2 file:ring-inset file:ring-cyan-600 hover:file:bg-cyan-50 hover:file:text-cyan-700 focus:outline-none"
              />
            </div>
          )}
          {image && (
            <div className="mb-4">
              <img
                src={image}
                alt="Preview"
                className="mx-auto h-auto max-w-full rounded-lg shadow-lg"
              />
            </div>
          )}
          {!extractedText && (
            <>
              <button
                onClick={extractText}
                disabled={isComputing || !image}
                className="inline-flex w-full items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75"
              >
                {isComputing ? (
                  <>
                    <LoadingSpinner /> Extracting Text...
                  </>
                ) : (
                  <>Extract Text</>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-500">Images are never saved</p>
            </>
          )}
          {extractedText && (
            <div className="mt-4 rounded-lg bg-gray-100 p-4 text-left">
              <h3 className="mb-2 text-md font-medium">Extracted Text</h3>
              <div className="mb-4 text-gray-700">
                {extractedText.split('\n').map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyText}
                  className={clsx(
                    'inline-flex flex-1 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50',
                    textCopied ? 'text-cyan-600' : 'text-gray-700',
                  )}
                >
                  <DocumentDuplicateIcon
                    className="mr-2 h-5 w-5"
                    aria-hidden="true"
                  />
                  {textCopied ? 'Copied!' : 'Copy Text'}
                </button>
                <button
                  onClick={resetTool}
                  className="inline-flex flex-1 items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
                >
                  Try Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ImageToTextPage() {
  return (
    <>
      <NextSeo
        title="Free AI Image to Text Extractor | No Login | Copy Formatted Results"
        description="Extract text from any image using our AI tool with no-signup. Perfect for digitizing documents, transcribing handwritten notes, or extracting text from screenshots and photos to repurpose in other content."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/image-to-text.png',
              alt: 'AI-Powered Image to Text Generator',
            },
          ],
        }}
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
                  AI-Powered Image to Text Generator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Extract text from any image using our AI-powered tool. Perfect for
                  digitizing documents, transcribing handwritten notes, or extracting
                  text from screenshots and photos.
                </p>
                <ImageToTextGenerator />
              </div>
            </div>
          </div>
        </div>
        <RegisterCTA
          customTitle="Train a Custom AI Chatbot"
          description="Train a custom chatbot with your content, chat with images, and explore advanced AI-powered tools for personalized interactions with your data."
          button="Get Started for Free"
        />
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Image" />
        </div>
      </main>
      <Footer />
    </>
  )
}
