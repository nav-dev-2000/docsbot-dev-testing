import Image from 'next/image'
import logoSentry from '@/images/logos/logo-sentry.svg'
import lizaMockAvatar from '@/images/avatars/liza-mock.jpg'

export default function SentryQuote() {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.500),transparent)] opacity-10" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-gray-900 shadow-xl shadow-indigo-500/5 ring-1 ring-white/5 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      <div className="mx-auto max-w-2xl lg:max-w-4xl">
        <Image
          alt="Sentry logo"
          src={logoSentry}
          width={108}
          height={32}
          className="mx-auto h-10 w-auto"
          style={{ width: 'auto', height: 'auto' }}
        />
        <figure className="mt-10">
          <blockquote className="text-center text-xl/8 font-semibold text-white sm:text-2xl/9">
            <p>
              “We've had DocsBot on our docs site for the last couple of months and our users are definitely engaging with it. It's been a great tool for understanding what our users are interested in learning from our docs!”
            </p>
          </blockquote>
          <figcaption className="mt-10">
            <Image alt="Liza Mock" src={lizaMockAvatar} className="mx-auto size-12 rounded-full object-cover" />
            <div className="mt-4 flex items-center justify-center space-x-3 text-base">
              <div className="font-semibold text-white">Liza Mock</div>
              <svg width={3} height={3} viewBox="0 0 2 2" aria-hidden="true" className="fill-indigo-400/70">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <div className="text-indigo-400">Manager Docs & Technical Writing @ Sentry.io</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

