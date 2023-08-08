import { useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import { CheckIcon, CheckBadgeIcon } from '@heroicons/react/20/solid'
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
    href: '/register',
    price: { monthly: 19, annually: 192 },
    description: 'Create your own basic DocsBot for quick answers and copywriting.',
    features: [
      '1 DocsBot',
      '1k Source Pages',
      'Unlock all source types',
      '1k questions/mo',
      'Private bot',
      'GPT-4 support',
      '1 user',
    ],
    mostPopular: false,
  },
  {
    name: 'Power',
    id: 'tier-power',
    href: '/register',
    price: { monthly: 49, annually: 492 },
    description: 'For power users and small businesses just getting started.',
    features: [
      '3 DocsBots',
      '5k Source Pages',
      'Unlock all source types',
      'Monthly source refresh',
      '5k questions/mo',
      'Private bots',
      'GPT-4 support',
      '1 user',
      'Basic Analytics',
      'Zapier integration',
      'Chat history',
    ],
    mostPopular: false,
  },
  {
    name: 'Pro',
    id: 'tier-pro',
    href: '/register',
    price: { monthly: 99, annually: 996 },
    description: 'For small businesses who want to save time and money on support and copywriting.',
    features: [
      '10 DocsBots',
      '10k Source Pages',
      'Unlock all source types',
      'Weekly source refresh',
      '10k questions/mo',
      'Private bots',
      'GPT-4 support',
      '5 team users',
      'Advanced Analytics',
      'Zapier integration',
      'Chat history',
      'Unbranded chat widgets',
      'Prompt customization',
    ],
    mostPopular: true,
  },
  {
    name: 'Business',
    id: 'tier-business',
    href: '/register',
    price: { monthly: 499, annually: 4992 },
    description: 'For serious traffic, priority support, and AI reports to improve your product & docs.',
    features: [
      '100 DocsBots',
      '100k Source Pages',
      'Unlock all source types',
      'Daily source refresh',
      '100k questions/mo',
      'Private bots',
      'GPT-4 support',
      '50 team users',
      'Advanced Analytics',
      'Zapier integration',
      'Chat history',
      'Unbranded chat widgets',
      'AI reports (coming soon)',
      'Prompt customization',
      'Priority support',
    ],
    mostPopular: false,
  },
]

const enterpriseFeatures = [
  'Custom DocsBot limit',
  'Custom Source Pages',
  'Unlock all source types',
  'Daily source refresh',
  'Custom questions/mo',
  'Private bots',
  'GPT-4 support',
  'Custom team users',
  'Advanced Analytics',
  'Zapier integration',
  'Chat history',
  'Unbranded chat widgets',
  'AI reports (coming soon)',
  'Prompt customization',
  'Azure OpenAI Service',
  'Self-hosted options',
]

export default function Pricing() {
  const [frequency, setFrequency] = useState(frequencies[0])

  return (
    <div className="bg-white py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-cyan-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Pricing plans for any size business
          </p>
        </div>
        <p className="mx-auto mt-6 text-center text-lg leading-8 text-gray-600">
          Save money and time with DocsBot. We offer a variety of plans to fit your needs. Need a
          custom plan?{' '}
          <a
            className="underline"
            href="mailto:human@docsbot.ai"
            onClick={(e) => {
              if (Beacon !== undefined) {
                e.preventDefault()
                DocsBotAI.unmount()
                Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2')
                Beacon('open')
              }
            }}
          >
            Contact us
          </a>
          .
        </p>
        <p className="flex items-center justify-center text-lg font-bold text-teal-500">
          <CheckBadgeIcon className="mr-1 h-5 w-5" /> 14-day money-back guarantee!
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
                    'cursor-pointer rounded-full px-2.5 py-1'
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">Two months free with annual plans!</p>
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
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
                  <p className="rounded-full bg-cyan-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-cyan-600">
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
                  'mt-6 block rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800'
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
        <p className="mx-auto mt-4 text-center text-sm text-gray-600">
          Does not include OpenAI API costs (roughly $0.003/question)
        </p>
        <div className="mt-12 flex flex-col items-start gap-x-8 gap-y-6 rounded-3xl p-8 ring-1 ring-gray-900/10 sm:gap-y-10 sm:p-10 lg:col-span-2 lg:flex-row lg:items-center">
          <div className="lg:min-w-0 lg:flex-1">
            <h3 className="text-lg font-semibold leading-8 tracking-tight text-cyan-600">
              Personal
            </h3>
            <p className="mt-1 text-base leading-7 text-gray-600">
              Try DocsBot free for personal use. No credit card required. Import document files or
              urls with up to 50 pages of content and start chatting with your bot. Free bots will
              be deleted after 30 days.
            </p>
          </div>
          <Link
            href="/register"
            className="rounded-md px-3.5 py-2 text-sm font-semibold leading-6 text-cyan-600 ring-1 ring-inset ring-cyan-600 hover:ring-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-700"
          >
            Try free <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="mx-auto mt-16 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-20 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">Enterprise</h3>
            <p className="mt-6 text-base leading-7 text-gray-600">
              For serious traffic and custom integrations. Identify problem areas in your product
              and gaps in your documentation with automated AI analysis of user questions. Get
              priority support & integration help to create specialized bots for your unique
              business needs. Use the Microsoft Azure OpenAI Service for Enterprise-grade security
              with role-based access control (RBAC), private networks, and region restrictions.
              Self-hosted options are available to satisfy any data protection requirements.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-cyan-600">
                What’s included
              </h4>
              <div className="h-px flex-auto bg-gray-100" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
            >
              {enterpriseFeatures.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon className="h-6 w-5 flex-none text-cyan-600" aria-hidden="true" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="h-full rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold text-gray-600">Plans starting at</p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">$899/mo</span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                    USD
                  </span>
                </p>
                <a
                  href="mailto:human@docsbot.ai"
                  onClick={(e) => {
                    if (Beacon !== undefined) {
                      e.preventDefault()
                      DocsBotAI.unmount()
                      Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2')
                      Beacon('open')
                    }
                  }}
                  className="mt-10 block w-full rounded-md bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                >
                  Contact us
                </a>
                <p className="mt-6 text-xs leading-5 text-gray-600">
                  Custom invoices and pay by ACH or wire transfer
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
