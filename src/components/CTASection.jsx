import Link from 'next/link'
import SocialFaces from '@/components/SocialFaces'
import { ArrowRightIcon } from '@heroicons/react/20/solid'

export default function CTASection({ 
  heading = "Enough excuses. Create your free chatbot today.", 
  description = "Join the thousands of companies using DocsBot to turn their existing content into instant, accurate answers for customers and employees. Reduce costs, increase productivity, and become the AI hero of your organization.",
  buttonText = "Get Started Free",
  buttonHref = "/register",
  infoText = "Learn More",
  infoHref
}) {
  return (
    <div className="bg-white">
      <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            {heading}
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg/8 text-gray-600">
            {description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-y-6">
            <div className="flex gap-4 w-full justify-center">
              <Link
                href={buttonHref}
                className="rounded-md bg-animation min-w-48 bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                {buttonText}
              </Link>
              {infoHref && (
                <Link
                  href={infoHref}
                  className="flex items-center justify-center gap-2 text-center text-sm/6 font-semibold"
                >
                  {infoText} <ArrowRightIcon className="size-4" />
                </Link>
              )}
            </div>
            <SocialFaces />
          </div>
        </div>
      </div>
    </div>
  )
} 