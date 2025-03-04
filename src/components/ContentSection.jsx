import Breadcrumb from '@/components/blog/Breadcrumb'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/20/solid'
import { ClockIcon, CalendarIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

export default function ContentSection({ pretitle, title, intro, post, children, ...props }) {
  const [headings, setHeadings] = useState([])
  const [activeId, setActiveId] = useState('')
  const [expandedSections, setExpandedSections] = useState({})
  const [useCases, setUseCases] = useState([
    'Customer Support',
    'Internal Knowledge',
    'Research Assistance',
    'Document Q&A',
    'Pre-Sales Automation',
    'Employee Training',
    'Content Repurposing',
    'Onboarding',
    'Customer Retention'
  ])
  const [currentUseCase, setCurrentUseCase] = useState(0)
  const observerRef = useRef(null)
  const sidebarRef = useRef(null)
  const sidebarContainerRef = useRef(null)
  const contentRef = useRef(null)
  const isPost = post?.type === 'post'

  // Calculate reading time (assuming 200 words per minute)
  const readTime = isPost ? Math.ceil((post.content?.rendered?.split(/\s+/).length || 0) / 200) : 0

  // Format post date if available
  const formattedDate = isPost && post.date ? new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }) : ''

  // Extract headings from the post content
  useEffect(() => {
    if (!isPost) return

    // Wait for the content to be rendered
    setTimeout(() => {
      const articleElement = document.querySelector('.prose')
      if (!articleElement) return
      
      const headingElements = Array.from(articleElement.querySelectorAll('h2, h3'))
      
      const extractedHeadings = headingElements.map(heading => {
        // Create an id if it doesn't exist
        if (!heading.id) {
          heading.id = heading.textContent.toLowerCase().replace(/[^\w]+/g, '-')
        }
        
        return {
          id: heading.id,
          text: heading.textContent,
          level: heading.tagName.toLowerCase(),
          element: heading
        }
      })
      
      // Group headings by h2
      const groupedHeadings = []
      let currentH2 = null
      
      extractedHeadings.forEach(heading => {
        if (heading.level === 'h2') {
          currentH2 = {
            ...heading,
            children: []
          }
          groupedHeadings.push(currentH2)
          // Auto-expand the first H2 section
          setExpandedSections(prev => ({
            ...prev,
            [heading.id]: groupedHeadings.length === 1
          }))
        } else if (heading.level === 'h3' && currentH2) {
          currentH2.children.push(heading)
        }
      })
      
      setHeadings(groupedHeadings)
      
      // Set up intersection observer to track active heading
      const observer = new IntersectionObserver(
        entries => {
          // Track which h2 sections are currently in view
          const visibleH2Ids = new Set();
          
          entries.forEach(entry => {
            // Find the heading object for this entry
            const currentHeading = extractedHeadings.find(h => h.id === entry.target.id);
            
            if (!currentHeading) return;
            
            // If this is an h2 heading, track its visibility
            if (currentHeading.level === 'h2') {
              if (entry.isIntersecting) {
                visibleH2Ids.add(entry.target.id);
              }
            }
            
            if (entry.isIntersecting) {
              setActiveId(entry.target.id);
              
              // Auto-expand the section containing the active heading
              if (currentHeading.level === 'h2') {
                setExpandedSections(prev => ({
                  ...prev,
                  [entry.target.id]: true
                }));
              } else if (currentHeading.level === 'h3') {
                const parentH2 = groupedHeadings.find(h2 => 
                  h2.children.some(h3 => h3.id === entry.target.id)
                );
                if (parentH2) {
                  setExpandedSections(prev => ({
                    ...prev,
                    [parentH2.id]: true
                  }));
                  // Add parent to visible sections
                  visibleH2Ids.add(parentH2.id);
                }
              }
            }
          });
          
          // After processing all entries, close h2 sections that are not in view
          if (visibleH2Ids.size > 0) {
            setExpandedSections(prev => {
              const newState = { ...prev };
              
              // For each h2 heading, close it if it's not in the visible set
              groupedHeadings.forEach(h2 => {
                if (!visibleH2Ids.has(h2.id)) {
                  newState[h2.id] = false;
                }
              });
              
              return newState;
            });
          }
        },
        { rootMargin: '0px 0px -80% 0px' }
      );
      
      headingElements.forEach(element => {
        observer.observe(element)
      })
      
      observerRef.current = observer
      
      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect()
        }
      }
    }, 500) // Wait for content to render
  }, [isPost, post])
  
  // Rotate through use cases
  useEffect(() => {
    if (!isPost) return
    
    const interval = setInterval(() => {
      setCurrentUseCase(prev => (prev + 1) % useCases.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [isPost, useCases.length])

  // Toggle section expansion
  const toggleSection = (id) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  return (
    <div className="relative bg-white pb-12 pt-8" {...props}>
      <div className="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full lg:[overflow-anchor:none]">
        <div className="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
          <svg
            className="absolute left-full top-12 translate-x-32 transform"
            width={404}
            height={384}
            fill="none"
            viewBox="0 0 404 384"
          >
            <defs>
              <pattern
                id="74b3fd99-0a6f-4271-bef2-e80eeafdf357"
                x={0}
                y={0}
                width={20}
                height={20}
                patternUnits="userSpaceOnUse"
              >
                <rect
                  x={0}
                  y={0}
                  width={4}
                  height={4}
                  className="text-gray-200"
                  fill="currentColor"
                />
              </pattern>
            </defs>
            <rect width={404} height={384} fill="url(#74b3fd99-0a6f-4271-bef2-e80eeafdf357)" />
          </svg>
        </div>
      </div>

      {/* Header section that stretches across the page when isPost is true */}
      {isPost && (
        <div className="relative px-4 sm:px-6 lg:px-8 max-w-prose lg:max-w-5xl mx-auto mb-8">
          <Breadcrumb post={post} />
          <h1 className="mt-8">
            <span className="block text-center text-lg font-semibold text-cyan-600 sm:text-left">
              {pretitle}
            </span>
            <span
              className="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-left sm:text-4xl"
              dangerouslySetInnerHTML={{ __html: title }}
            />
          </h1>
          {/* Post date and reading time */}
          <div className="mt-4 flex items-center justify-between sm:justify-start text-sm text-gray-500">
            {formattedDate && (
              <div className="flex items-center">
                <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                <span>{formattedDate}</span>
              </div>
            )}
            <div className="flex items-center sm:ml-6">
              <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
              <span>{readTime} min read</span>
            </div>
          </div>
          <p className="mt-6 text-xl leading-8 text-gray-500">{intro}</p>
        </div>
      )}

      {isPost ? (
        <div className="relative px-4 sm:px-6 lg:px-8 max-w-prose lg:max-w-5xl mx-auto">
          <div className="lg:grid lg:grid-cols-10 lg:gap-8 relative">
            <div className="lg:col-span-7" ref={contentRef}>
              <div className="prose prose-lg prose-cyan text-gray-500">
                {children}
              </div>
            </div>
            
            {headings.length > 0 && (
              <aside className="lg:col-span-3 hidden lg:block" ref={sidebarContainerRef}>
                <div ref={sidebarRef} className="max-h-[calc(100vh-10rem)] sticky top-6 transition-all duration-200">
                  {/* Table of Contents */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm mb-6">
                    <h3 className="mb-3 font-medium text-gray-900">Table of Contents</h3>
                    <nav className="toc-nav overflow-y-auto max-h-[calc(100vh-16rem)]">
                      <ul className="space-y-1 text-sm">
                        {headings.map(heading => (
                          <li key={heading.id}>
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleSection(heading.id)}
                                className="mr-1 p-1 text-gray-400 hover:text-cyan-600"
                                aria-label={expandedSections[heading.id] ? "Collapse section" : "Expand section"}
                              >
                                {heading.children.length > 0 && (
                                  expandedSections[heading.id] 
                                    ? <ChevronDownIcon className="h-4 w-4" /> 
                                    : <ChevronRightIcon className="h-4 w-4" />
                                )}
                              </button>
                              <Link
                                href={`#${heading.id}`}
                                className={clsx(
                                  'block truncate hover:text-cyan-600',
                                  activeId === heading.id ? 'font-medium text-cyan-600' : 'text-gray-600'
                                )}
                              >
                                {heading.text}
                              </Link>
                            </div>
                            
                            {heading.children.length > 0 && expandedSections[heading.id] && (
                              <ul className="ml-6 mt-1 space-y-1">
                                {heading.children.map(subheading => (
                                  <li key={subheading.id}>
                                    <Link
                                      href={`#${subheading.id}`}
                                      className={clsx(
                                        'block truncate hover:text-cyan-600',
                                        activeId === subheading.id ? 'font-medium text-cyan-600' : 'text-gray-600'
                                      )}
                                    >
                                      {subheading.text}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </div>
                  
                  {/* CTA Card */}
                  <div className="overflow-hidden rounded-lg shadow-sm mb-6 text-center">
                    <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-r from-cyan-600 to-teal-500 px-4 py-5 text-white">
                      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10"></div>
                      <div className="absolute -bottom-10 -left-10 h-24 w-24 rounded-full bg-white/10"></div>
                      <h3 className="relative z-10 text-md font-semibold">Unlock the potential of your existing content & documentation with AI chatbots for:</h3>
                      <div className="relative z-10 mt-2 h-6 overflow-hidden">
                        <div 
                          className="transition-transform duration-500" 
                          style={{ transform: `translateY(-${currentUseCase * 1.5}rem)` }}
                        >
                          {useCases.map((useCase, index) => (
                            <p key={index} className="h-6 text-sm text-white/90">{useCase}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="bg-white px-4 pt-4 pb-2 border-l border-r border-b border-cyan-600 border-r-teal-500 rounded-b-lg">
                      <Link
                        href="/register"
                        className="block w-full rounded-md bg-animation bg-gradient-to-r from-cyan-600 to-teal-500 px-3 py-2 text-center text-sm font-medium text-white shadow hover:from-cyan-600 hover:to-teal-500"
                      >
                        Get started <ArrowRightIcon className="ml-1 inline-block h-4 w-4" />
                      </Link>
                      <p className="mt-2 text-center text-xs text-gray-500">
                        Free, no credit card required
                      </p>
                    </div>
                  </div>
                </div>
                {/* Spacer div to maintain layout flow */}
                <div className="invisible">
                  {/* Table of Contents spacer */}
                  <div className="rounded-lg border p-4 mb-6">
                    <h3 className="mb-3">Table of Contents</h3>
                    <div className="h-64"></div>
                  </div>
                  {/* CTA Card spacer */}
                  <div className="rounded-lg mb-6">
                    <div className="px-4 py-5">
                      <h3 className="text-md font-semibold"></h3>
                      <div className="mt-2 h-6"></div>
                    </div>
                    <div className="px-4 pt-4 pb-2">
                      <div className="py-2"></div>
                      <p className="mt-2 text-xs"></p>
                    </div>
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      ) : (
        <div className="relative px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-prose text-lg">
            <Breadcrumb post={post} />
            <h1 className="mt-8">
              <span className="block text-center text-lg font-semibold text-cyan-600 sm:text-left">
                {pretitle}
              </span>
              <span
                className="mt-2 block text-center text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-left sm:text-4xl"
                dangerouslySetInnerHTML={{ __html: title }}
              />
            </h1>
            <p className="mt-8 text-xl leading-8 text-gray-500">{intro}</p>
            <div className="prose prose-lg prose-cyan mt-6 text-gray-500 mx-auto">
              {children}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
