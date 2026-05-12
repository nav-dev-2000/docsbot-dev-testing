import { fetchHookData, addHookData, handleError, usePosts } from '@headstartwp/next'
import { getWPUrl, getHostUrl } from '@headstartwp/core'
import { useEffect, useMemo, useRef, useState } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import LoadingSpinner from '@/components/LoadingSpinner'
import {
  BoltIcon,
  BookOpenIcon,
  ChevronDownIcon,
  CircleStackIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CodeBracketSquareIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  Squares2X2Icon,
  WrenchScrewdriverIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import { getRecoverableWordPressErrorDetails } from '@/utils/wordpressErrors'

const params = {
  postType: 'docs',
  per_page: 100,
  _embed: true,
  orderby: 'menu_order',
  order: 'asc',
}

const categoryMeta = {
  developer: {
    name: 'Developer/API',
    slug: 'developer-api',
    description:
      'Use the DocsBot APIs, widget docs, and admin reference to build custom integrations.',
    icon: CommandLineIcon,
    href: '/documentation/developer',
  },
}

const categorySlugIconMap = {
  actions: BoltIcon,
  dashboard: Squares2X2Icon,
  'developer-api': CommandLineIcon,
  embedding: CodeBracketSquareIcon,
  integrations: PuzzlePieceIcon,
  sources: CircleStackIcon,
}

const categoryNameIconMap = {
  'developer/api': CommandLineIcon,
}

function getSectionIcon(section) {
  const slug = normalizeName(section.slug).toLowerCase()
  const name = normalizeName(section.name).toLowerCase()

  return categorySlugIconMap[slug] || categoryNameIconMap[name] || QuestionMarkCircleIcon
}

function normalizeName(name = '') {
  return String(name).replace(/<[^>]+>/g, '').trim()
}

function normalizeSearchText(value = '') {
  return normalizeName(value).toLowerCase()
}

function filterNavigation(navigation, searchQuery) {
  const terms = normalizeSearchText(searchQuery)
    .split(/\s+/)
    .filter(Boolean)

  if (!terms.length) {
    return navigation
  }

  return navigation
    .map((section) => {
      const sectionText = [section.name, section.description, section.excerpt]
        .map((value) => normalizeSearchText(value))
        .join(' ')

      const sectionMatches = terms.every((term) => sectionText.includes(term))
      const docs = section.children || []

      if (!docs.length) {
        return sectionMatches ? section : null
      }

      const filteredDocs = sectionMatches
        ? docs
        : docs.filter((doc) => {
            const docText = [doc.name].map((value) => normalizeSearchText(value)).join(' ')
            return terms.every((term) => docText.includes(term))
          })

      if (!filteredDocs.length) {
        return null
      }

      return {
        ...section,
        children: filteredDocs,
      }
    })
    .filter(Boolean)
}

// Function to build the hierarchical navigation object
function buildNavigation(data) {
  // Step 1: Group by terms->section[0] and handle objects with no section term
  const grouped = data.reduce((acc, cur) => {
    const section = cur.terms && cur.terms.section && cur.terms.section[0]
    if (section) {
      const sectionKey = section.slug || section.name
      if (!acc[sectionKey]) {
        acc[sectionKey] = {
          name: section.name,
          slug: section.slug,
          description: section.description,
          children: [],
        }
      }
      acc[sectionKey].children.push({
        name: cur.title.rendered,
        href: cur.link,
        excerpt: cur.excerpt.rendered,
        menu_order: cur.menu_order || 0,
      })
    } else {
      // If no section term, make it a top-level item with no children
      acc[cur.link] = {
        name: cur.title.rendered,
        href: cur.link,
        excerpt: cur.excerpt.rendered,
      }
    }
    return acc
  }, {})

  // Step 2: Order by menu_order (assuming you want to order the children by menu_order)
  for (const section in grouped) {
    if (grouped[section].children) {
      grouped[section].children.sort((a, b) => a.menu_order - b.menu_order)
    }
  }

  // Step 3: Convert the grouped object to an array
  const navigation = Object.values(grouped).map((section) => ({
    ...section,
    icon: getSectionIcon(section),
  }))

  navigation.push({
    ...categoryMeta.developer,
    icon: categoryMeta.developer.icon,
  })

  return navigation
}

function CategoryCard({ section }) {
  const Icon = section.icon || QuestionMarkCircleIcon
  const docs = section.children || []
  const title = normalizeName(section.name)
  const listRef = useRef(null)
  const [scrollState, setScrollState] = useState({
    canScrollAbove: false,
    canScrollBelow: false,
  })

  useEffect(() => {
    if (!docs.length) return

    const listEl = listRef.current
    if (!listEl) return

    const updateScrollState = () => {
      const maxScrollTop = Math.max(listEl.scrollHeight - listEl.clientHeight, 0)
      const nextState = {
        canScrollAbove: listEl.scrollTop > 2,
        canScrollBelow: listEl.scrollTop < maxScrollTop - 2,
      }

      setScrollState((currentState) =>
        currentState.canScrollAbove === nextState.canScrollAbove &&
        currentState.canScrollBelow === nextState.canScrollBelow
          ? currentState
          : nextState
      )
    }

    updateScrollState()

    listEl.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)

    let resizeObserver
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateScrollState)
      resizeObserver.observe(listEl)
      if (listEl.firstElementChild) {
        resizeObserver.observe(listEl.firstElementChild)
      }
    }

    return () => {
      listEl.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
      resizeObserver?.disconnect()
    }
  }, [docs.length])

  const scrollListDown = () => {
    const listEl = listRef.current
    if (!listEl) return

    listEl.scrollBy({
      top: Math.max(listEl.clientHeight * 0.75, 180),
      behavior: 'smooth',
    })
  }

  return (
    <section
      id={section.slug}
      className="flex h-full max-h-[34rem] flex-col rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex min-h-12 flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h2>
            {section.href && (
              <Link
                href={section.href}
                className="text-sm font-semibold text-teal-600 transition hover:text-teal-700"
              >
                View overview <span aria-hidden="true">&rarr;</span>
              </Link>
            )}
          </div>
          {(section.description || section.excerpt) && (
            <p
              className="mt-3 text-sm leading-6 text-gray-600"
              dangerouslySetInnerHTML={{ __html: section.description || section.excerpt }}
            />
          )}
        </div>
      </div>

      {docs.length > 0 ? (
        <div className="relative mt-6 min-h-0 flex-1">
          <div ref={listRef} className="h-full overflow-y-auto pb-14">
            <div className="space-y-3">
              {docs.map((doc) => (
                <Link
                  key={doc.href || doc.name}
                  href={doc.href}
                  className="block rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <div
                    className="text-base font-semibold leading-7 text-gray-900"
                    dangerouslySetInnerHTML={{ __html: doc.name }}
                  />
                </Link>
              ))}
            </div>
          </div>

          {scrollState.canScrollAbove && (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-white via-white/95 to-transparent" />
          )}

          {scrollState.canScrollBelow && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-white via-white/95 to-transparent" />
          )}

          {scrollState.canScrollBelow && (
            <button
              type="button"
              onClick={scrollListDown}
              aria-label={`Scroll ${title} articles`}
              className="absolute bottom-4 right-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white/95 text-teal-600 shadow-lg backdrop-blur transition hover:bg-white hover:text-teal-700"
            >
              <ChevronDownIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 flex justify-end">
          <Link
            href={section.href}
            className="inline-flex items-center rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            {section.slug === 'developer-api' ? 'Developer documentation' : `Open ${title}`}
            <span className="ml-2" aria-hidden="true">
              &rarr;
            </span>
          </Link>
        </div>
      )}
    </section>
  )
}

const ArchivePageContent = ({ seo }) => {
  const { data, loading, error } = usePosts(params)
  const [searchQuery, setSearchQuery] = useState('')
  const navigation = useMemo(() => (data?.posts ? buildNavigation(data.posts) : []), [data?.posts])
  const filteredNavigation = useMemo(
    () => filterNavigation(navigation, searchQuery),
    [navigation, searchQuery]
  )

  if (loading) {
    return (
      <>
        <Header />
        <div className="sm:py-18 bg-white py-10">
          <div className="mx-auto max-w-7xl px-16 lg:px-24">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="flex items-center justify-center space-x-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                <LoadingSpinner large={true} />
                <span>Loading...</span>
              </h2>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      {seo.yoast_head_json.title ? (
        <NextSeo
          title={seo.yoast_head_json.title}
          description={seo.yoast_head_json.description}
          openGraph={{
            type: seo.yoast_head_json.og_type,
            locale: seo.yoast_head_json.og_locale,
            siteName: seo.yoast_head_json.og_site_name,
            images: seo.yoast_head_json.og_image,
            title: seo.yoast_head_json.og_title,
            description: seo.yoast_head_json.og_description,
            article: {
              publishedTime: seo.yoast_head_json.article_published_time,
              modifiedTime: seo.yoast_head_json.article_modified_time,
              authors: [seo.yoast_head_json.article_author],
            },
          }}
        />
      ) : (
        <NextSeo
          title="Documentation - DocsBot"
          description="DocsBot documentation and knowlegebase."
        />
      )}
      <Header />
      <main>
        <div className="bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-2 text-base font-semibold leading-7 text-teal-500">
              Get the help you need
            </p>
            <h2 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Documentation
            </h2>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Welcome to the DocsBot Documentation! These pages are designed to provide you with
              all the information you need to understand, integrate, and make the most out of
              DocsBot.
            </p>
          </div>
          <div className="mx-auto mt-10 max-w-2xl lg:mx-0 lg:max-w-none flex justify-center">
            <div className="flex flex-wrap justify-center gap-3 text-sm font-semibold leading-6 text-white">
              {filteredNavigation.map((section) =>
                section.slug ? (
                  <a
                    key={section.slug}
                    href={'#' + section.slug}
                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white transition hover:border-teal-400/60 hover:bg-white/10"
                  >
                    {normalizeName(section.name)}
                  </a>
                ) : null
              )}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 py-10 sm:py-14">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto mb-8 max-w-2xl">
              <label htmlFor="documentation-search" className="sr-only">
                Search documentation
              </label>
              <div className="relative">
                <MagnifyingGlassIcon
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                  aria-hidden="true"
                />
                <input
                  id="documentation-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search documentation"
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-12 pr-12 text-base text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 focus:border-teal-400 focus:ring-4 focus:ring-teal-100"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {filteredNavigation.map((section) => (
                <CategoryCard key={section.slug || section.href || section.name} section={section} />
              ))}
            </div>
            {!filteredNavigation.length && (
              <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900">No matching documentation</h2>
                <p className="mt-2 text-sm text-gray-600">
                  Try a different search term or clear the current search.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

const ArchivePage = ({ seo, wpRecoverableError = false }) => {
  if (wpRecoverableError) {
    return (
      <>
        <Header />
        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Documentation is temporarily unavailable
            </h1>
            <p className="mt-4 text-base text-gray-600">
              We could not fetch the documentation index from WordPress right now. Please try again
              shortly.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return <ArchivePageContent seo={seo} />
}

// Hardcode the main archive pagination pages
export async function getStaticPaths() {
  return {
    paths: [{ params: { path: [] } }],
    fallback: 'blocking',
  }
}

// or export async function getServerSideProps(context)
export async function getStaticProps(context) {
  function removeYoastHead(obj) {
    if (Array.isArray(obj)) {
      obj.forEach((item) => removeYoastHead(item))
    } else if (typeof obj === 'object') {
      for (let key in obj) {
        if (key === 'yoast_head' || key === 'yoast_head_json') {
          delete obj[key]
        } else {
          removeYoastHead(obj[key])
        }
      }
    }
  }
  try {
    // make sure to pass the same params to fetchHookData and usePost
    const usePostData = await fetchHookData(usePosts.fetcher(), context, { params })

    usePostData.data.result = usePostData.data.result.map((post) => {
      removeYoastHead(post) //strip unneeded yoast meta from posts as it 10x the size of the archives cached json
      //remove unneeded data
      return {
        title: post.title,
        id: post.id,
        link: post.link.replace(getWPUrl(), getHostUrl()).replace(/\/$/, ''), //ugly hack for now
        _embedded: post._embedded || {},
        excerpt: post.excerpt,
        menu_order: post.menu_order || 0,
        terms: post.terms || {},
      }
    })
    return addHookData([usePostData], { revalidate: 60 * 60 })
  } catch (e) {
    const { statusCode, codes, messages, isRecoverableWordPressError } =
      getRecoverableWordPressErrorDetails(e)

    if (isRecoverableWordPressError) {
      console.warn('WordPress fetch failed during docs archive generation. Serving ISR fallback.', {
        path: context?.params?.path,
        statusCode,
        code: codes[0],
        message: messages[0],
      })

      return {
        props: {
          wpRecoverableError: true,
        },
        revalidate: 60,
      }
    }

    return handleError(e, context)
  }
}

export default ArchivePage
