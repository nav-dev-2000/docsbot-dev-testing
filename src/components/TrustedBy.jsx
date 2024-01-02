import Image from 'next/image'
import Link from 'next/link'
import iuLogo from '@/images/logos/iu-logo-words.svg'
import dollieLogo from '@/images/logos/logo-dollie.png'
import extendifyLogo from '@/images/logos/logo-extendify.png'
import conversionLogo from '@/images/logos/logo-conversion.svg'
import sonyLogo from '@/images/logos/logo-sony.svg'
import logoWingarc from '@/images/logos/logo-wingarc.png'
import logoSentry from '@/images/logos/logo-sentry.svg'
import WPMUDEVLogo from '@/components/WPMUDEVLogo'

export default function TrustedBy({ props }) {
  return (
      <div className="mx-auto mt-10 grid max-w-lg grid-cols-2 items-center gap-x-8 gap-y-10 sm:max-w-xl sm:grid-cols-2 sm:gap-x-10 lg:mx-0 lg:max-w-none lg:grid-cols-4 xl:grid-cols-8" {...props}>
        <Link
          href="https://infiniteuploads.com"
          target="_blank"
          title="Infinite Uploads"
          className="flex justify-center"
        >
          <Image
            className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
            src={iuLogo}
            alt="Infinite Uploads Logo"
            width={125}
            height={32}
          />
        </Link>

        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={sonyLogo}
          alt="Sony Logo"
          width={125}
          height={26}
        />

        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={extendifyLogo}
          alt="Extendify Logo"
          width={125}
          height={32}
        />

        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={conversionLogo}
          alt="Conversion Logo"
          width={125}
          height={32}
        />

        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={dollieLogo}
          alt="Dollie Logo"
          width={125}
          height={32}
        />
        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={logoWingarc}
          alt="WingArc1st Logo"
          width={125}
          height={32}
        />
        <Image
          className="col-span-2 max-h-8 w-full object-contain lg:col-span-1"
          src={logoSentry}
          alt="SENTRY.io Logo"
          width={108}
          height={32}
        />

        <WPMUDEVLogo className="col-span-1 max-h-8 w-full object-contain text-white" />
      </div>
  )
}
