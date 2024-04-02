import { MegaphoneIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import Countdown from 'react-countdown'
import { stripePlan } from '@/utils/helpers'
import news from '/public/latest-news.json'

export function HeaderBanner() {
  if (!news) return null

  return (
    <div className="bg-animation flex items-center justify-center gap-x-2 px-6 py-2 sm:px-3.5">
      <SparklesIcon className="h-5 w-5 text-white" aria-hidden="true" />
      <p className="text-md leading-6 text-white">
        <Link href={news.link}>
          <strong className="font-semibold">NEW</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          <span dangerouslySetInnerHTML={{ __html: news.title }} />
          &nbsp;
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </p>
    </div>
  )
}

export function HeaderBannerSale({ team }) {
  if (team && stripePlan(team).name !== 'Free') {
    return null
  }

  return (
    <div className="bg-animation flex items-center justify-center gap-x-6 px-6 py-2.5 sm:px-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-center text-lg leading-6 text-white xl:text-left">
          <strong className="font-semibold">Save up to 50% for Cyber Monday!</strong>
          <svg
            viewBox="0 0 2 2"
            className="mx-2 inline h-0.5 w-0.5 fill-current"
            aria-hidden="true"
          >
            <circle cx={1} cy={1} r={1} />
          </svg>
          Lock-in an amazing price for any plan. Ends in{' '}
          <Countdown date={new Date('2023-11-29T00:00:00')} renderer={DayCounter} />!
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

export function BannerSale() {
  return (
    <div className="bg-animation my-4 flex items-center justify-center gap-x-6 rounded-md px-6 py-2.5 sm:px-3.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-center text-lg font-semibold leading-6 text-white">
          Cyber Monday sale: Save up to 50% on all plans! Ends in{' '}
          <Countdown date={new Date('2023-11-29T00:00:00')} renderer={DayCounter} />!
        </p>
      </div>
    </div>
  )
}

export function DayCounter({ days, hours, minutes, seconds, completed }) {
  if (completed) {
    return <span className="text-white">Sale ended!</span>
  } else {
    return (
      <span className="text-white">
        {hours}h {minutes}m {seconds}s
      </span>
    )
  }
}
