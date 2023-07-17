import Breadcrumb from "@/components/blog/Breadcrumb"

export default function ContentSection({ pretitle, title, intro, post, children, ...props }) {
  return (
    <div className="relative overflow-hidden bg-white pt-8 pb-16" {...props}>
      <div className="hidden lg:absolute lg:inset-y-0 lg:block lg:h-full lg:w-full lg:[overflow-anchor:none]">
        <div className="relative mx-auto h-full max-w-prose text-lg" aria-hidden="true">
          <svg
            className="absolute top-12 left-full translate-x-32 transform"
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
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-prose text-lg">
          <Breadcrumb post={post} />
          <h1 className="mt-8">
            <span className="block text-center sm:text-left text-lg font-semibold text-cyan-600">
              {pretitle}
            </span>
            <span className="mt-2 block text-center sm:text-left text-3xl font-bold leading-8 tracking-tight text-gray-900 sm:text-4xl">
              {title}
            </span>
          </h1>
          <p className="mt-8 text-xl leading-8 text-gray-500">{intro}</p>
        </div>
        <div className="prose-lg prose prose-cyan mx-auto mt-6 text-gray-500">{children}</div>
      </div>
    </div>
  )
}
