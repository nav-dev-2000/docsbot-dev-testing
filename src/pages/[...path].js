import {
  usePost,
  fetchHookData,
  addHookData,
  handleError,
  usePosts,
} from '@headstartwp/next'
import { BlocksRenderer } from '@headstartwp/core/react'
import { getWPUrl, getHostUrl, removeSourceUrl } from '@headstartwp/core'
import { replaceUrls, replaceATagsWithLinks } from '@/utils/replaceUrls'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ContentSection from '@/components/ContentSection'
import { resolveBatch } from '@/utils/promises'
import { getRecoverableWordPressErrorDetails } from '@/utils/wordpressErrors'
import { NextSeo } from 'next-seo'
import RegisterCTA from '@/components/RegisterCTA'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useRouter } from 'next/router'
import JsonLd from '@/components/seo/JsonLd'
import {
  buildBlogPosting,
  buildOrganization,
  buildPageUrl,
  buildWebPage,
  buildWebSite,
  stripHtml,
} from '@/lib/structuredData'

const params = { postType: ['page', 'post'] }

const SinglePageContent = ({ seo }) => {
  const { loading, error, data } = usePost(params)
  const router = useRouter()

  const post = data?.post
  const isPost = post?.type === 'post'
  const pageUrl = post?.link || buildPageUrl(router.asPath)
  const headline = stripHtml(post?.title?.rendered || '')
  const description =
    seo?.yoast_head_json?.description ||
    stripHtml(post?.excerpt?.rendered || '')
  const imageUrl =
    post?._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
  const datePublished = seo?.yoast_head_json?.article_published_time || null
  const dateModified = seo?.yoast_head_json?.article_modified_time || null
  const authorName = seo?.yoast_head_json?.article_author || null

  const webPageSchema =
    isPost && headline
      ? buildWebPage({
          url: pageUrl,
          name: headline,
          description,
        })
      : null

  const blogPostingSchema =
    isPost && headline
      ? buildBlogPosting({
          url: pageUrl,
          headline,
          description,
          image: imageUrl || undefined,
          datePublished,
          dateModified,
          authorName,
        })
      : null

  if (webPageSchema && blogPostingSchema) {
    webPageSchema.mainEntity = { '@id': blogPostingSchema['@id'] }
  }

  const schema =
    webPageSchema && blogPostingSchema
      ? {
          '@context': 'https://schema.org',
          '@graph': [
            buildOrganization(),
            buildWebSite(),
            webPageSchema,
            blogPostingSchema,
          ],
        }
      : null

  return (
    <>
      <JsonLd id="blog-post-schema" data={schema} />
      {seo?.yoast_head_json && (
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
      )}
      <Header />
      <main>
        {loading ? (
          <div className="bg-white py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-16 lg:px-24">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="flex items-center justify-center space-x-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  <LoadingSpinner large={true} />
                  <span>Loading...</span>
                </h2>
              </div>
            </div>
          </div>
        ) : (
          <>
            <ContentSection title={data.post.title.rendered} post={data.post}>
              <BlocksRenderer html={data.post.contentReplaced || replaceATagsWithLinks(data.post.content?.rendered || '')} />
              {data.post.terms?.category && (
                <div className="mt-8 flex items-center gap-x-4 border-t border-gray-200 pt-4 text-xs">
                  <a
                    href={data.post.terms.category[0]?.link}
                    className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 no-underline hover:bg-gray-100"
                  >
                    {data.post.terms.category[0]?.name}
                  </a>
                </div>
              )}
            </ContentSection>
            
            {data.post.type === 'post' && (
              <>
                <RegisterCTA />
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  )
}

const SinglePage = ({ seo, wpRecoverableError = false }) => {
  if (wpRecoverableError) {
    return (
      <>
        <Header />
        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-3xl px-6 text-center lg:px-8">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Page temporarily unavailable
            </h1>
            <p className="mt-4 text-base text-gray-600">
              We couldn’t fetch this page from WordPress right now. Please try again shortly.
            </p>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return <SinglePageContent seo={seo} />
}

/**
 * This is an example of pre-rendering a set of pages at build times.
 * In this specific example, we are pre-rendering the first 50 posts (within dates in the URL) and the first 50 pages.
 *
 * @returns {Promise<*>}
 */
export async function getStaticPaths() {
  try {
    const postsData = await usePosts
      .fetcher()
      .get({ postType: 'post', per_page: 60 })

    const postsPath = postsData.result.map(({ link }) => {
      return {
        params: {
          path: removeSourceUrl({ link, backendUrl: getWPUrl() })
            .substring(1)
            .split('/'),
        },
      }
    })

    const pagesData = await usePosts
      .fetcher()
      .get({ postType: 'page', per_page: 50 })

    const pagePaths = pagesData.result
      .map(({ link }) => {
        const normalizedLink = removeSourceUrl({ link, backendUrl: getWPUrl() })
        if (normalizedLink === '/') {
          return false
        }

        return {
          params: {
            path: normalizedLink.substring(1).split('/'),
          },
        }
      })
      .filter(Boolean)

    return {
      paths: [...postsPath, ...pagePaths],
      fallback: 'blocking',
    }
  } catch (error) {
    console.warn(
      'Skipping WP pre-render path generation because WordPress is unavailable.',
      error,
    )
    return {
      paths: [],
      fallback: 'blocking',
    }
  }
}

export async function getStaticProps(context) {
  // Check if the request is a POST or if the path starts with /api/
  if (context.req?.method === 'POST' || context.params.path[0] === 'api') {
    console.log('404 skip')
    return {
      notFound: true,
    }
  }

  // Check if the last segment of the path has a file extension
  const lastPathSegment = context.params.path[context.params.path.length - 1]
  if (lastPathSegment.includes('.')) {
    return {
      notFound: true,
    }
  } else {
    try {
      // fetch batch of promises and throws errors selectively
      // passing `throw:false` will prevent errors from being thrown for that promise
      const settledPromises = await resolveBatch([
        {
          func: fetchHookData(usePost.fetcher(), context, { params: params }),
        },
      ])

      settledPromises[0].data.result.link = replaceUrls(
        settledPromises[0].data.result.link,
      ).replace(/\/$/, '')
      //settledPromises[0].data.result.yoast_head = replaceUrls(
      //  settledPromises[0].data.result.yoast_head
      //)
      settledPromises[0].data.result.contentReplaced = replaceATagsWithLinks(
        settledPromises[0].data.result.content.rendered,
      )

      return addHookData(settledPromises, { revalidate: 60 * 60 })
    } catch (e) {
      const { statusCode, codes, messages, isRecoverableWordPressError } =
        getRecoverableWordPressErrorDetails(e)

      if (isRecoverableWordPressError) {
        console.warn('WordPress fetch failed during page generation. Serving ISR fallback.', {
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
}

export default SinglePage
