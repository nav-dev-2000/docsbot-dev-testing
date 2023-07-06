import { Testimonials } from '@/components/TestimonialsRegister'
import Image from 'next/image'
import docsbotLogo from '@/images/docsbot-logo.png'
import Link from 'next/link'
import { routePaths } from '@/constants/routePaths.constants'

export function RegisterLayout({ teamCount, children }) {
  return (
    <>
      <div className="relative flex min-h-full justify-center md:px-12 lg:px-0">
        <div className="bg-white relative z-10 flex flex-1 flex-col px-4 py-10 shadow-2xl md:flex-none md:px-28">
        <Link href="/" aria-label="Home" className='mx-auto'>
          <Image src={docsbotLogo} alt="Docsbot" />
        </Link>
          <div className="relative text-center md:text-left mt-6 sm:mt-8 border-b border-gray-200 pb-4">
            <h1 className="text-2xl font-medium tracking-tight">Create your free account</h1>
            <p className="mt-3 text-sm">
              Already registered?{' '}
              <Link href={routePaths.LOGIN} className="font-medium text-cyan-900 underline hover:text-cyan-700">
                Sign in
              </Link>{' '}
              to your account.
            </p>
          </div>
          <div className="mx-auto w-full max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
            {children}
          </div>
        </div>
        <div className="hidden bg-gradient-to-br from-teal-500 to-90% via-cyan-600 to-cyan-700 sm:contents lg:relative align-middle lg:flex min-h-full">
          <Testimonials teamCount={teamCount} />
        </div>
      </div>
    </>
  )
}
