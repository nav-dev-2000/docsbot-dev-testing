import { BookOpenIcon, PaintBrushIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Countdown from 'react-countdown'

export function HeaderBanner() {

  return (
    <div className="flex items-center gap-x-6 bg-animation px-6 py-2 sm:px-3.5 justify-center">
      <p className="text-md leading-6 text-white">
        <Link href="https://docsbot.ai/documentation/doc/how-to-create-openai-gpt-chatbots-with-access-to-your-trained-documentation">
          <strong className="font-semibold">NEW</strong>
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          Supercharge your GPTs on OpenAI with our custom Action&nbsp;<span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
    </div>
  )
}

export function HeaderBannerSale() {

  return (
    <div className="flex items-center gap-x-6 px-6 py-2.5 sm:px-3.5 bg-animation justify-center">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-lg leading-6 text-white text-center xl:text-left">
          <strong className="font-semibold">Save 40% for Black Friday!</strong>
          <svg viewBox="0 0 2 2" className="mx-2 inline h-0.5 w-0.5 fill-current" aria-hidden="true">
            <circle cx={1} cy={1} r={1} />
          </svg>
          Lock-in an amazing price for any new annual plan. Ends in{' '}
        <Countdown date={new Date('2023-11-25T00:00:00')} zeroPadDays={0} />!
        </p>
        <Link
          href="/register?redirect=/app/account"
          className="flex-none rounded-full bg-gray-900 px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          Act now <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  )
}
