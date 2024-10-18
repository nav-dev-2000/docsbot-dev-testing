import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'
import { BreadcrumbJsonLd } from 'next-seo'


const Breadcrumb = ({ pages }) => {
  return (
    <nav aria-label="Breadcrumb" className="flex">
      <BreadcrumbJsonLd
        itemListElements={pages.map((page, index) => ({
          position: index + 1,
          name: page.name,
          item: `https://docsbot.ai${page.href}`,
        }))}
      />
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/" className="text-white hover:text-cyan-500">
              <HomeIcon className="h-5 w-5 flex-shrink-0 text-white" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-white" aria-hidden="true" />
              {page.href ? (
                <Link
                  href={page.href}
                  aria-current={page.current ? 'page' : undefined}
                  className="ml-4 text-sm font-medium text-white hover:text-cyan-200"
                >
                  {page.name}
                </Link>
              ) : (
                <span className="ml-4 text-sm font-medium text-white">
                  {page.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

export default Breadcrumb
