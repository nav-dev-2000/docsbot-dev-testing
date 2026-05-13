import { useState } from 'react'
import Head from 'next/head'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import classNames from '@/utils/classNames'
import { NextSeo } from 'next-seo'
import {
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'

const colors = [
  { hex: '#0891B2', rgb: 'rgb(8, 145, 178)', bgColor: 'bg-cyan-600', name: 'Primary Cyan' },
  { hex: '#14B8A6', rgb: 'rgb(20, 184, 166)', bgColor: 'bg-teal-500', name: 'Teal Accent' },
  { hex: '#111827', rgb: 'rgb(17, 24, 39)', bgColor: 'bg-gray-900', name: 'Dark Gray' },
]

const logos = [
  {
    name: 'Color Logo',
    description: 'Use this logo on a white or light-colored background.',
    previewBg: 'bg-gray-100',
    files: [
      { format: 'PNG', url: '/branding/docsbot-logo-lg.png', filename: 'docsbot-logo-lg.png' },
      { format: 'SVG', url: '/branding/docsbot-logo.svg', filename: 'docsbot-logo.svg' },
    ],
    previewUrl: '/branding/docsbot-logo-lg.png',
    alt: 'DocsBot color logo',
  },
  {
    name: 'White Logo',
    description: 'Use this logo on a dark background (recommended: #111827 or darker).',
    previewBg: 'bg-gray-900',
    files: [
      {
        format: 'PNG',
        url: '/branding/docsbot-logo-white.png',
        filename: 'docsbot-logo-white.png',
      },
      {
        format: 'SVG',
        url: '/branding/docsbot-logo-white.svg',
        filename: 'docsbot-logo-white.svg',
      },
    ],
    previewUrl: '/branding/docsbot-logo-white.png',
    alt: 'DocsBot white logo',
  },
  {
    name: 'Square Icon (Color)',
    description: 'Square icon perfect for app icons, favicons, and social media profiles.',
    previewBg: 'bg-gray-100',
    files: [
      {
        format: 'PNG',
        url: '/branding/docsbot-icon-sq-384.png',
        filename: 'docsbot-icon-sq-384.png',
      },
      {
        format: 'SVG',
        url: '/branding/docsbot-icon-sq.svg',
        filename: 'docsbot-icon-sq.svg',
      },
    ],
    previewUrl: '/branding/docsbot-icon-sq.svg',
    alt: 'DocsBot square icon',
    isSquare: true,
  },
  {
    name: 'Square Icon (White)',
    description: 'White square icon for use on dark backgrounds.',
    previewBg: 'bg-gray-900',
    files: [
      {
        format: 'SVG',
        url: '/branding/docsbot-icon-sq-white.svg',
        filename: 'docsbot-icon-sq-white.svg',
      },
    ],
    previewUrl: '/branding/docsbot-icon-sq-white.svg',
    alt: 'DocsBot white square icon',
    isSquare: true,
  },
]

export default function PressPage() {
  const [copiedColor, setCopiedColor] = useState(null)
  const [copyTimeout, setCopyTimeout] = useState(null)

  const handleCopyColor = async (color, type) => {
    const valueToCopy = type === 'hex' ? color.hex : color.rgb
    try {
      await navigator.clipboard.writeText(valueToCopy)
      const key = `${color.hex}-${type}`
      setCopiedColor(key)
      
      // Clear any existing timeout
      if (copyTimeout) {
        clearTimeout(copyTimeout)
      }
      
      // Set new timeout to clear the copied state
      const timeout = setTimeout(() => {
        setCopiedColor(null)
        setCopyTimeout(null)
      }, 2000)
      setCopyTimeout(timeout)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownload = (url, filename) => {
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <NextSeo
        title="Press & Branding Assets - DocsBot"
        description="Download DocsBot logos, brand colors, and media assets for press and marketing use. High-quality PNG and SVG formats available."
        openGraph={{
          title: 'Press & Branding Assets - DocsBot',
          description: 'Download DocsBot logos, brand colors, and media assets for press and marketing use.',
        }}
      />
      <Header />
      <main>
        <div className="bg-white">
          <div className="mx-auto max-w-7xl py-24 sm:px-2 sm:py-32 lg:px-4">
            <div className="mx-auto max-w-2xl px-4 lg:max-w-none">
              <div className="max-w-3xl">
                <h1 className="font-semibold text-gray-500">Branding Assets</h1>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  For Press and Media
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  We're happy to provide you with any of the following assets for your use. If you
                  need something that isn't listed here, just{' '}
                  <a
                    href="mailto:human@docsbot.ai"
                    className="font-medium text-cyan-600 hover:text-cyan-700 underline"
                  >
                    contact us
                  </a>{' '}
                  and we'll get it to you as soon as possible.
                </p>
                <p className="mt-3 text-sm text-gray-500">
                  <span className="font-medium">DocsBot&reg;</span> is a registered trademark of
                  UglyRobot, LLC.
                </p>
              </div>

              {/* About Section */}
              <div className="mt-10 rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:mt-16">
                <h3 className="text-lg font-semibold text-gray-900">About DocsBot</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  DocsBot is an AI support and knowledge automation platform that helps businesses
                  turn documentation, help centers, product information, ticket history, and
                  internal knowledge into accurate AI answers and actions. Teams use DocsBot to
                  automate customer support, improve documentation discovery, power internal
                  knowledge assistants, and connect AI agents to approved business workflows.
                </p>
              </div>

              {/* Press Contact Section */}
              <div className="mt-10 rounded-lg border border-gray-200 bg-gray-50 p-6 sm:mt-16">
                <h3 className="text-lg font-semibold text-gray-900">Press Inquiries</h3>
                <p className="mt-2 text-sm text-gray-600">
                  For media inquiries, interview requests, or additional assets, please contact:
                </p>
                <p className="mt-2">
                  <a
                    href="mailto:human@docsbot.ai"
                    className="text-base font-medium text-cyan-600 hover:text-cyan-700"
                  >
                    human@docsbot.ai
                  </a>
                </p>
              </div>

              {/* Colors Section */}
              <div className="mt-10 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Brand Colors</h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Click on any color code to copy it to your clipboard.
                  </p>
                </div>
                <ul role="list" className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {colors.map((color) => (
                    <li
                      key={color.hex}
                      className="col-span-1 flex rounded-lg shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
                    >
                      <div
                        className={classNames(
                          color.bgColor,
                          'flex w-32 flex-shrink-0 items-center justify-center rounded-l-lg text-sm font-medium text-white'
                        )}
                        aria-label={`${color.name} color swatch`}
                      ></div>
                      <div className="flex flex-1 items-center justify-between truncate rounded-r-lg border-b border-r border-t border-gray-200 bg-white p-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-gray-500">{color.name}</p>
                          <div className="mt-2 flex flex-col gap-2">
                            <button
                              onClick={() => handleCopyColor(color, 'hex')}
                              className="group flex items-center gap-2 text-left"
                              aria-label={`Copy ${color.hex} to clipboard`}
                            >
                              <span className="font-mono text-sm font-semibold text-gray-900 group-hover:text-cyan-600">
                                {color.hex}
                              </span>
                              {copiedColor === `${color.hex}-hex` ? (
                                <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600" />
                              ) : (
                                <ClipboardIcon className="h-4 w-4 text-gray-400 group-hover:text-cyan-600" />
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyColor(color, 'rgb')}
                              className="group flex items-center gap-2 text-left"
                              aria-label={`Copy ${color.rgb} to clipboard`}
                            >
                              <span className="font-mono text-xs text-gray-600 group-hover:text-cyan-600">
                                {color.rgb}
                              </span>
                              {copiedColor === `${color.hex}-rgb` ? (
                                <ClipboardDocumentCheckIcon className="h-4 w-4 text-green-600" />
                              ) : (
                                <ClipboardIcon className="h-4 w-4 text-gray-400 group-hover:text-cyan-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Logos Section */}
              <div className="mt-10 space-y-16 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16">
                {logos.map((logo, index) => {
                  // Check if this is a square icon and if there's a matching pair
                  const isSquareIcon = logo.isSquare
                  const squareIcons = logos.filter((l) => l.isSquare)
                  const isFirstSquareIcon = isSquareIcon && logo === squareIcons[0]
                  
                  // If this is the first square icon, render both together in a grid
                  // Color icon (first) on left, white icon (second) on right
                  if (isFirstSquareIcon && squareIcons.length === 2) {
                    return (
                      <div key="square-icons-group" className="space-y-8">
                        <h3 className="text-lg font-semibold text-gray-900">Square Icons</h3>
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                          {squareIcons.map((squareLogo, sqIndex) => (
                            <div key={squareLogo.name} className="flex flex-col">
                              <h4 className="text-base font-semibold text-gray-900">{squareLogo.name}</h4>
                              <p className="mt-2 text-sm text-gray-600">{squareLogo.description}</p>
                              <div className="mt-4">
                                <div
                                  className={classNames(
                                    squareLogo.previewBg,
                                    'aspect-square max-w-xs overflow-hidden rounded-lg p-8 transition-shadow hover:shadow-lg'
                                  )}
                                >
                                  <img
                                    src={squareLogo.previewUrl}
                                    alt={squareLogo.alt}
                                    className="h-full w-full object-contain object-center"
                                    loading={sqIndex === 0 ? 'eager' : 'lazy'}
                                  />
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap gap-3">
                                {squareLogo.files.map((file) => (
                                  <button
                                    key={`${file.format}-${file.size || ''}`}
                                    onClick={() => handleDownload(file.url, file.filename)}
                                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                    aria-label={`Download ${squareLogo.name} as ${file.format}${file.size ? ` (${file.size})` : ''}`}
                                  >
                                    {file.format}
                                    {file.size && <span className="ml-1 text-xs text-gray-500">({file.size})</span>}
                                    <svg
                                      className="ml-2 h-4 w-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-hidden="true"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                      />
                                    </svg>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  }
                  
                  // Skip rendering if this is the second square icon (already rendered above)
                  if (isSquareIcon && !isFirstSquareIcon) {
                    return null
                  }
                  
                  // Regular logo rendering
                  return (
                    <div
                      key={logo.name}
                      className="flex flex-col-reverse lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-8"
                    >
                      <div className="mt-6 lg:col-span-5 lg:mt-0 xl:col-span-4">
                        <h3 className="text-lg font-semibold text-gray-900">{logo.name}</h3>
                        <p className="mt-2 text-sm text-gray-600">{logo.description}</p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          {logo.files.map((file) => (
                            <button
                              key={`${file.format}-${file.size || ''}`}
                              onClick={() => handleDownload(file.url, file.filename)}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                              aria-label={`Download ${logo.name} as ${file.format}${file.size ? ` (${file.size})` : ''}`}
                            >
                              {file.format}
                              {file.size && <span className="ml-1 text-xs text-gray-500">({file.size})</span>}
                              <svg
                                className="ml-2 h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                aria-hidden="true"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-auto lg:col-span-7 xl:col-span-8">
                        <div
                          className={classNames(
                            logo.previewBg,
                            logo.isSquare
                              ? 'aspect-square max-w-md overflow-hidden rounded-lg p-8 transition-shadow hover:shadow-lg'
                              : 'aspect-h-2 aspect-w-5 overflow-hidden rounded-lg p-8 transition-shadow hover:shadow-lg'
                          )}
                        >
                          <img
                            src={logo.previewUrl}
                            alt={logo.alt}
                            className="h-full w-full object-contain object-center"
                            loading={index === 0 ? 'eager' : 'lazy'}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Usage Guidelines */}
              <div className="mt-10 border-t border-gray-200 pt-10 sm:mt-16 sm:pt-16">
                <h3 className="text-lg font-semibold text-gray-900">Usage Guidelines</h3>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      Do's
                    </h4>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600"></span>
                        <span>Maintain clear space around the logo (at least 20% of logo height)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600"></span>
                        <span>Use the appropriate logo variant for your background</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600"></span>
                        <span>Maintain the logo's aspect ratio when resizing</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600"></span>
                        <span>Use SVG format for scalable applications</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <XCircleIcon className="h-5 w-5 text-red-600" />
                      Don'ts
                    </h4>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600"></span>
                        <span>Don't modify, distort, or alter the logo in any way</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600"></span>
                        <span>Don't use the logo on backgrounds that reduce visibility</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600"></span>
                        <span>Don't rotate or add effects to the logo</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-600"></span>
                        <span>Don't use the logo as part of your own branding</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
