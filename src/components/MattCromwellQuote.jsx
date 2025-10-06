import Image from 'next/image'
import mattCromwellImage from '@/images/avatars/thumb-matt-cromwell.jpg'
import stellarwpLogo from '@/images/logos/stellarwp-white.svg'

export default function MattCromwellQuote() {
  return (
    <section className="relative isolate overflow-hidden bg-gray-900 px-6 py-24 sm:py-32 lg:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.cyan.500),transparent)] opacity-10" />
      <div className="absolute inset-y-0 right-1/2 -z-10 mr-16 w-[200%] origin-bottom-left skew-x-[-30deg] bg-gray-900 shadow-xl shadow-cyan-500/5 ring-1 ring-white/5 sm:mr-28 lg:mr-0 xl:mr-16 xl:origin-center" />
      <div className="mx-auto max-w-2xl lg:max-w-4xl">
        <Image alt="StellarWP logo" src={stellarwpLogo} className="mx-auto h-10 w-auto" />
        <figure className="mt-10">
          <blockquote className="text-center text-xl/8 font-semibold text-white sm:text-2xl/9">
            <p>
              “The real power of AI in support isn’t fewer tickets; it’s better answers for more people. AI doesn’t replace human support; it scales access to better answers and makes documentation more effective.”
            </p>
          </blockquote>
          <figcaption className="mt-10">
            <Image alt="Matt Cromwell" src={mattCromwellImage} className="mx-auto size-12 rounded-full object-cover" />
            <div className="mt-4 flex items-center justify-center space-x-3 text-base">
              <div className="font-semibold text-white">Matt Cromwell</div>
              <svg width={3} height={3} viewBox="0 0 2 2" aria-hidden="true" className="fill-cyan-400/70">
                <circle r={1} cx={1} cy={1} />
              </svg>
              <div className="text-cyan-400">Director of CX at StellarWP</div>
            </div>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}
