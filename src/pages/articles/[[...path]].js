import { fetchHookData, addHookData, handleError, usePosts } from '@headstartwp/next'
import { getWPUrl, getHostUrl } from '@headstartwp/core'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Pagination from '@/components/blog/Pagination'
import { NextSeo } from 'next-seo'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { getRecoverableWordPressErrorDetails } from '@/utils/wordpressErrors'

const BASE_PARAMS = {
  postType: 'post',
  per_page: 12,
}

/** WP category term IDs: News (1), Case Studies (208). Main /articles index only. */
const MAIN_BLOG_CATEGORY_IDS = [1, 208]

/** Path segments for `pages/articles/[[...path]].js` (the part after `/articles`). */
function toArticlesPathSegments(path) {
  if (path == null) return []
  return Array.isArray(path) ? path : [path]
}

/** True for `/articles` and `/articles/page/*` (not category/tag/author archives). */
function isMainBlogArchivePath(path) {
  const segments = toArticlesPathSegments(path)
  if (segments.length === 0) return true
  return (
    segments.length === 2 &&
    segments[0] === 'page' &&
    /^\d+$/.test(String(segments[1]))
  )
}

function getArticlesPathSegmentsFromRouter(router) {
  if (router.query?.path != null) {
    return toArticlesPathSegments(router.query.path)
  }
  const base = (router.asPath || '').split('?')[0]
  if (!base.startsWith('/articles')) return []
  const rest = base.replace(/^\/articles\/?/, '')
  return rest ? rest.split('/').filter(Boolean) : []
}

function buildUsePostsParams(pathOrSegments) {
  const isMain = isMainBlogArchivePath(pathOrSegments)
  if (!isMain) {
    return BASE_PARAMS
  }
  return {
    ...BASE_PARAMS,
    categories: MAIN_BLOG_CATEGORY_IDS,
  }
}

const ArchivePageContent = ({ seo }) => {
  const router = useRouter()
  const { data } = usePosts(buildUsePostsParams(getArticlesPathSegmentsFromRouter(router)))

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
          title="Blog - DocsBot AI"
          description="DocsBot AI news, tutorials, case studies, and articles."
        />
      )}
      <Header />
      <main>
        <div className="bg-white py-12 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {data?.queriedObject?.term
                  ? data.queriedObject.term.name
                  : 'Articles'}
              </h1>
              {data?.queriedObject?.term ? (
                <p className="mt-2 text-lg leading-8 text-gray-600">
                  DocsBot AI{' '}
                  <Link
                    href="/articles/category/news"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    news
                  </Link>
                  ,{' '}
                  <Link
                    href="/articles/category/tutorials"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    tutorials
                  </Link>
                  ,{' '}
                  <Link
                    href="/articles/category/case-studies"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    case studies
                  </Link>
                  , and{' '}
                  <Link
                    href="/articles/category/article"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    articles
                  </Link>
                  . View the{' '}
                  <Link
                    href="/articles"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    main blog
                  </Link>
                  .
                </p>
              ) : (
                <p className="mt-2 text-lg leading-8 text-gray-600">
                  The latest <span className="font-medium text-gray-800">news</span> and{' '}
                  <span className="font-medium text-gray-800">case studies</span>. You can also view{' '}
                  <Link
                    href="/articles/category/article"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    articles
                  </Link>{' '}
                  or{' '}
                  <Link
                    href="/articles/category/tutorials"
                    className="font-medium text-cyan-700 hover:text-cyan-600 hover:underline"
                  >
                    tutorials
                  </Link>
                  .
                </p>
              )}
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-4 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {data?.posts?.map((post) => (
                <article
                  key={post.id}
                  className={clsx(
                    'flex flex-col items-start justify-between p-4',
                    post.terms.category.some((term) => term.slug == 'news') &&
                      !data?.queriedObject?.term &&
                      'rounded-2xl border border-cyan-500 shadow-lg'
                  )}
                >
                  <a href={post.link} className="relative w-full">
                    <img
                      src={
                        (post._embedded &&
                          post._embedded['wp:featuredmedia'] &&
                          post._embedded['wp:featuredmedia'][0]?.source_url) ||
                        '/og-main.png'
                      }
                      alt=""
                      className="aspect-[16/9] w-full rounded-2xl bg-gray-100 object-cover sm:aspect-[2/1] lg:aspect-[3/2]"
                    />
                    <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-gray-900/10" />
                  </a>
                  <div className="max-w-xl">
                    <div className="group relative mt-8">
                      <h3 className="mt-3 align-top text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                        <a href={post.link}>
                          <span className="absolute inset-0" />
                          <span dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
                        </a>
                      </h3>
                      <div
                        className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600"
                        dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
                      ></div>
                    </div>
                    <div className="mt-8 flex items-center gap-x-4 text-xs">
                      {post.terms.category.map((category) => (
                        <a
                          key={category.id}
                          href={category.link}
                          className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600 hover:bg-gray-100"
                        >
                          {category.name}
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <Pagination queriedObject={data?.queriedObject} pageInfo={data?.pageInfo} />
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
              Articles are temporarily unavailable
            </h1>
            <p className="mt-4 text-base text-gray-600">
              We could not fetch the article index from WordPress right now. Please try again
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
    paths: [
      { params: { path: [] } },
      { params: { path: ['page', '1'] } },
      { params: { path: ['page', '2'] } },
      { params: { path: ['page', '3'] } },
      { params: { path: ['page', '4'] } },
      { params: { path: ['category', 'news'] } },
      { params: { path: ['category', 'news', 'page', '2'] } },
      { params: { path: ['category', 'tutorials'] } },
      { params: { path: ['category', 'case-studies'] } },
    ],
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
    const pathParam = context.params?.path
    const params = buildUsePostsParams(pathParam)
    // make sure to pass the same params to fetchHookData and usePost
    const usePostData = await fetchHookData(usePosts.fetcher(), context, { params })

    usePostData.data.result = usePostData.data.result.map((post) => {
      removeYoastHead(post) //strip unneeded yoast meta from posts as it 10x the size of the archives cached json
      //remove unneeded data
      return {
        title: post.title,
        id: post.id,
        link: post.link.replace(getWPUrl(), getHostUrl()).replace(/\/$/, ''), //ugly hack for now
        _embedded: post._embedded,
        excerpt: post.excerpt,
      }
    })
    return addHookData([usePostData], { revalidate: 1 * 60 * 60 })
  } catch (e) {
    const { statusCode, codes, messages, isRecoverableWordPressError } =
      getRecoverableWordPressErrorDetails(e)

    if (isRecoverableWordPressError) {
      console.warn('WordPress fetch failed during article archive generation. Serving ISR fallback.', {
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
