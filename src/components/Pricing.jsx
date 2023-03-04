import { useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import { CheckIcon } from '@heroicons/react/20/solid'
import Link from 'next/link'
import classNames from '@/utils/classNames'

const frequencies = [
  { value: 'monthly', label: 'Monthly', priceSuffix: '/month' },
  { value: 'annually', label: 'Annual', priceSuffix: '/year' },
]
const tiers = [
  {
    name: 'Hobby',
    id: 'tier-hobby',
    href: '/#signup',
    price: { monthly: 19, annually: 192 },
    description: 'Create your own basic DocsBot for quick answers and copywriting.',
    features: [
      '1 DocsBot',
      '10 Sources',
      '100 Source Pages',
      'Unlock all source types',
      '1k questions/mo',
      '1 user'
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-startup',
    href: '/#signup',
    price: { monthly: 99, annually: 996 },
    description: 'For businesses who want to save time and money on support and copywriting.',
    features: [
      '10 DocsBots',
      '100 Sources',
      '1000 Source Pages',
      'Unlock all source types',
      '10k questions/mo',
      '5 team users',
      'Basic Analytics',
      'Chat history (coming soon)',
      'Unbranded chat widgets (coming soon)',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/#signup',
    price: { monthly: 499, annually: 4992 },
    description: 'For serious traffic and custom integrations. Identify gaps in your documentation.',
    features: [
      '100 DocsBots',
      '1k Sources',
      '100k Source Pages',
      'Unlock all source types',
      '100k questions/mo',
      '50 team users',
      'Advanced Analytics (coming soon)',
      'Chat history (coming soon)',
      'Unbranded chat widgets (coming soon)',
      'AI reports (coming soon)',
    ],
    mostPopular: false,
  },
]

export default function Pricing() {
  const [frequency, setFrequency] = useState(frequencies[1])

  return (
    <div className="bg-white py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-cyan-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing plans for any size business
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Save money and time with DocsBot. We offer a variety of plans to fit your needs. Need a
          custom plan?{' '}
          <a
            className="underline"
            href="mailto:human@docsbot.ai"
            onClick={(e) => {
              if (Beacon !== undefined) {
                e.preventDefault()
                Beacon('open')
              }
            }}
          >
            Contact us
          </a>
          .
        </p>
        <div className="mt-16 flex justify-center">
          <RadioGroup
            value={frequency}
            onChange={setFrequency}
            className="grid grid-cols-2 gap-x-1 rounded-full p-1 text-center text-xs font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">Payment frequency</RadioGroup.Label>
            {frequencies.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option}
                className={({ checked }) =>
                  classNames(
                    checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-full py-1 px-2.5'
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'ring-2 ring-cyan-600' : 'ring-1 ring-gray-200',
                'rounded-3xl p-8 xl:p-10'
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? 'text-cyan-600' : 'text-gray-900',
                    'text-lg font-semibold leading-8'
                  )}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular ? (
                  <p className="rounded-full bg-cyan-600/10 py-1 px-2.5 text-xs font-semibold leading-5 text-cyan-600">
                    Most popular
                  </p>
                ) : null}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">{tier.description}</p>
              {frequency?.value === 'monthly' ? (
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${tier.price[frequency.value]}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">
                    {frequency.priceSuffix}
                  </span>
                </p>
              ) : (
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    ${tier.price[frequency.value] / 12}
                  </span>
                  <span className="text-sm font-semibold leading-6 text-gray-600">/month</span>
                  <span className="ml-2 text-sm font-semibold leading-6 text-gray-600">
                    (${tier.price[frequency.value]}
                    {frequency.priceSuffix})
                  </span>
                </p>
              )}
              <Link
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-500'
                    : 'text-cyan-600 ring-1 ring-inset ring-cyan-500 hover:ring-cyan-800',
                  'mt-6 block rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800'
                )}
              >
                Get started
              </Link>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600 xl:mt-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-cyan-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start gap-y-6 gap-x-8 rounded-3xl p-8 ring-1 ring-gray-900/10 sm:gap-y-10 sm:p-10 lg:col-span-2 lg:flex-row lg:items-center">
          <div className="lg:min-w-0 lg:flex-1">
            <h3 className="text-lg font-semibold leading-8 tracking-tight text-cyan-600">
              Personal
            </h3>
            <p className="mt-1 text-base leading-7 text-gray-600">
              Try DocsBot free for personal use. No credit card required. Import up to three
              document files or urls with ten pages and chat with your bot within our website.
            </p>
          </div>
          <Link
            href="/#signup"
            className="rounded-md px-3.5 py-2 text-sm font-semibold leading-6 text-cyan-600 ring-1 ring-inset ring-cyan-600 hover:ring-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          >
            Try free <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
