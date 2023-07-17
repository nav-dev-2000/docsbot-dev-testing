import {
  usePost,
  fetchHookData,
  addHookData,
  handleError,
  usePosts,
  useAppSettings,
} from '@headstartwp/next'
import { BlocksRenderer } from '@headstartwp/core/react'
import { getWPUrl, getHostUrl, removeSourceUrl } from '@headstartwp/core'
import { replaceUrls, replaceATagsWithLinks } from '@/utils/replaceUrls'
import Head from 'next/head'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ContentSection from '@/components/ContentSection'
import { resolveBatch } from '@/utils/promises'

const params = { postType: ['page', 'post'] }

const SinglePage = () => {
  const { loading, error, data } = usePost(params)

  if (loading) {
    return 'Loading...'
  }

  return (
    <>
      <Head>{data?.post?.yoast_head}</Head>
      <Header />
      <main>
        <ContentSection title={data.post.title.rendered} post={data.post}>
          <BlocksRenderer html={data.post.contentReplaced} />
          {data.post.terms?.category && (
          <div className="mt-8 flex items-center gap-x-4 text-xs border-t border-gray-200 pt-4">
            <a
              href={data.post.terms.category[0]?.link}
              className="relative z-10 no-underline rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
            >
              {data.post.terms.category[0]?.name}
            </a>
          </div>
        )}
        </ContentSection>
      </main>
      <Footer />
    </>
  )
}

/**
 * This is an example of pre-rendering a set of pages at build times.
 * In this specific example, we are pre-rendering the first 50 posts (within dates in the URL) and the first 50 pages.
 *
 * @returns {Promise<*>}
 */
export async function getStaticPaths() {
  const settings = await useAppSettings.fetcher().get()
  const frontPage = settings?.result?.home?.slug ?? ''
  const postsData = await usePosts.fetcher().get({ postType: 'post', per_page: 50 })

  const postsPath = postsData.result.map(({ link }) => {
    return {
      // path is the catch all route, so it must be array with url segments
      // if you don't want to support date urls just remove the date from the path
      params: {
        path: removeSourceUrl({ link, backendUrl: getWPUrl() }).substring(1).split('/'),
      },
    }
  })

  const pagesData = await usePosts.fetcher().get({ postType: 'page', per_page: 50 })

  const pagePaths = pagesData.result
    .map(({ link }) => {
      const normalizedLink = removeSourceUrl({ link, backendUrl: getWPUrl() })
      if (normalizedLink === '/' || normalizedLink === frontPage) {
        return false
      }

      return {
        // path is the catch all route, so it must be array with url segments
        params: {
          path: normalizedLink.substring(1).split('/'),
        },
      }
    })
    .filter(Boolean)

  return {
    paths: [...postsPath, ...pagePaths],
    fallback: true,
  }
}

export async function getStaticProps(context) {
  try {
    // fetch batch of promises and throws errors selectively
    // passing `throw:false` will prevent errors from being thrown for that promise
    const settledPromises = await resolveBatch([
      {
        func: fetchHookData(usePost.fetcher(), context, { params: params }),
      },
      { func: fetchHookData(useAppSettings.fetcher(), context), throw: false },
    ])

    settledPromises[0].data.result.link = replaceUrls(settledPromises[0].data.result.link).replace(/\/$/, '')
    settledPromises[0].data.result.yoast_head = replaceUrls(
      settledPromises[0].data.result.yoast_head
    )
    settledPromises[0].data.result.contentReplaced = replaceATagsWithLinks(
      settledPromises[0].data.result.content.rendered
    )

    return addHookData(settledPromises, { revalidate: 60 * 60 })
  } catch (e) {
    return handleError(e, context)
  }
}

export default SinglePage
