import Script from 'next/script'
import Image from 'next/future/image'
import Alert from '@/components/Alert'
import { CheckBadgeIcon, StarIcon, CheckIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import { frequencies, pricingTiers, currencies } from '@/constants/pricing.constants'
import image1 from '@/images/avatars/testimony6.png'
import image2 from '@/images/avatars/testimony2.jpeg'
import image3 from '@/images/avatars/testimony3.jpeg'
import image4 from '@/images/avatars/testimony4.jpeg'
import image5 from '@/images/avatars/testimony-sg.jpeg'

function stripeEmbed(teamId, email, table) {
  return {
    __html: `<stripe-pricing-table pricing-table-id="${table}"
publishable-key="${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
client-reference-id="${teamId}"
customer-email="${email}">
</stripe-pricing-table>`,
  }
}

export function StripePricingTable({ team, email, setErrorText }) {
  const [enterprise, setEnterprise] = useState(false)
  const [frequency, setFrequency] = useState(frequencies[0])
  const [currency, setCurrency] = useState('USD')
  const [opening, setOpening] = useState(false)

  async function openPortal(tier) {
    setErrorText(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tier, frequency: frequency.value, currency, email }),
    })
    if (response.ok) {
      const data = await response.json()
      const { url } = data
      //redirect to url
      window.location.href = url
      return
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
        setOpening(false)
      }
    }
    setOpening(false)
  }

  return (
    <div>
      <div className="mb-2 text-center">
        <h2 className="mb-2 text-3xl font-bold">Choose a plan</h2>
        {false && (
          <Alert
            type="info"
            className=""
            title="Have a discount code? Apply it on the next screen!"
          />
        )}
        <p className="text-lg text-gray-800">
          Please choose a plan that fits your needs. You can upgrade or downgrade at any time.
        </p>
        <p className="text-md  mx-auto flex items-center justify-center font-semibold text-teal-500">
          <CheckBadgeIcon className="mr-1 h-5 w-5" /> 14-day money-back guarantee!
        </p>
      </div>
      <Script src="https://js.stripe.com/v3/pricing-table.js" />

      <div className="mx-auto my-10">
        <div className="flex justify-center">
          <RadioGroup
            value={frequency}
            onChange={setFrequency}
            className="grid grid-cols-2 gap-x-1 rounded-lg bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">Payment frequency</RadioGroup.Label>
            {frequencies.map((option) => (
              <RadioGroup.Option
                key={option.value}
                value={option}
                className={({ checked }) =>
                  clsx(
                    checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-lg px-8 py-2'
                  )
                }
              >
                <span>{option.label}</span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <p className="mt-2 text-center text-sm text-gray-600">Two months free with annual plans!</p>
        <div className="flex justify-center mt-4 lg:justify-end lg:-mt-4">
          <RadioGroup
            value={currency}
            onChange={setCurrency}
            className="grid grid-cols-2 gap-x-1 rounded-full bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
          >
            <RadioGroup.Label className="sr-only">Currency</RadioGroup.Label>
            {Object.keys(currencies).map((option) => (
              <RadioGroup.Option
                key={option}
                value={option}
                className={({ checked }) =>
                  clsx(
                    checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                    'cursor-pointer rounded-full px-2.5 py-1'
                  )
                }
              >
                <span>
                  {currencies[option].symbol} {currencies[option].label}
                </span>
              </RadioGroup.Option>
            ))}
          </RadioGroup>
        </div>
        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={clsx(
                tier.mostPopular ? 'ring-2 ring-cyan-600' : 'ring-1 ring-gray-200',
                'rounded-3xl p-6 xl:p-8'
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={clsx(
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
                    {currencies[currency].symbol}
                    {tier.price[currency][frequency.value]}
                  </span>
                  <span className="-ml-0.5 text-sm font-semibold leading-6 text-gray-600">
                    {frequency.priceSuffix}
                  </span>
                </p>
              ) : (
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-gray-900">
                    {currencies[currency].symbol}
                    {(tier.price[currency][frequency.value] / 12).toFixed(0)}
                  </span>
                  <span className="-ml-0.5 text-sm font-semibold leading-6 text-gray-600">
                    /month
                  </span>
                </p>
              )}
              <button
                aria-describedby={tier.id}
                onClick={() => openPortal(tier.id)}
                disabled={opening}
                className={clsx(
                  tier.mostPopular
                    ? 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-500'
                    : 'text-cyan-600 ring-1 ring-inset ring-cyan-500 hover:ring-cyan-800',
                  'mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800 disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                Subscribe
              </button>
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
      </div>

      <div className="relative mx-auto mt-0 max-w-xl space-y-4 pl-12 text-center">
        <div className="absolute -top-6 left-24 hidden sm:block">
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDkiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA0OSA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggb3BhY2l0eT0iMC4yIiBkPSJNNDguODg2NiA0My4yMDI0QzQ2Ljc0NDggNDQuNzE2NiA0NC40MjkyIDQ0LjU0NzYgNDIuMzI3OSA0NC4xNTIzQzM5LjQxNDcgNDMuNTY4NyAzNi41NTIxIDQyLjcwNzYgMzMuOTAzOCA0MS42MjAzQzIxLjg2NjUgMzYuMzMxNyAxNC4wOTE4IDI3LjgxMjcgMTAuMDkzNSAxNi43MjYxQzkuMDg4NjkgMTMuOTA0IDguNTQwNDIgMTAuODk4NiA3LjcyOTExIDcuNjQ4MjJDNC43NTI2OCA5LjUyMDc4IDMuNDE5MDcgMTIuNzIwNiAwLjQ2MzUwNSAxNC43OTUyQy0wLjA2NzY2NjggMTMuNDg5MSAwLjYyNjAyNiAxMi41MzI5IDEuMTc2NzkgMTEuNzI3NUMzLjQ1MTMyIDguNDMwNDIgNS44MDQyNCA1LjEyNTI4IDguMjQyNTQgMS44NzkzN0M5LjQyOTQ1IDAuMzI3Nzg4IDEwLjQzNDkgMC4wODc4MTU0IDExLjk3MTUgMS4xNTM4N0MxNS4yMDg1IDMuMzM3MTIgMTcuMzI0OSA2LjE4MDQ5IDE4LjIzNTUgOS42MjQ3N0MxOC4yNDk0IDkuNzU5NDIgMTguMDM1MSA5Ljk4NTcgMTcuNzU2MiAxMC4zNTQ3QzE0LjMwOCA5Ljk2MjUgMTQuNzA5NiA2LjE3ODUyIDExLjY2OTIgNS4xMzE3M0MxMC44OTQ2IDkuOTA2ODkgMTIuMjk0NyAxNC4yNTMyIDE0LjE1MTIgMTguNDE2M0MxNi4xMDcxIDIyLjc3MzMgMTguNTEyNSAyNi44Nzk3IDIyLjA0NTUgMzAuMzkzMkMyNS40OTMgMzMuODQ3NiAyOS42NDgyIDM2LjQ4MDMgMzQuMTc0NSAzOC44NzA2QzM4LjYyOTMgNDEuMzM2MyA0My41MjE4IDQyLjY2OCA0OC44ODY2IDQzLjIwMjRaIiBmaWxsPSIjMEQxOTI3Ii8+Cjwvc3ZnPgo="
            alt="up arrow"
            className="h-12 w-auto"
          />
        </div>
        <div className="flex items-center justify-center gap-3">
          <div className="flex -space-x-2 overflow-hidden">
            <Image
              src={image1}
              alt="Customer avatar"
              width={40}
              height={40}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
            <Image
              src={image2}
              alt="Customer avatar"
              width={40}
              height={40}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
            <Image
              src={image3}
              alt="Customer avatar"
              width={40}
              height={40}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
            <Image
              src={image4}
              alt="Customer avatar"
              width={40}
              height={40}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
            <Image
              src={image5}
              alt="Customer avatar"
              width={40}
              height={40}
              className="inline-block h-10 w-10 rounded-full ring-2 ring-white"
            />
          </div>
          <div className="flex">
            <div className="flex items-center">
              <StarIcon className="h-6 w-6 text-yellow-400" />
              <StarIcon className="h-6 w-6 text-yellow-400" />
              <StarIcon className="h-6 w-6 text-yellow-400" />
              <StarIcon className="h-6 w-6 text-yellow-400" />
              <StarIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      <p className="mt-1 text-center text-sm text-gray-500">
        Thousands of people & companies have created custom chatbots with DocsBot!
      </p>
      <div className="mb-6 mt-6 text-center">
        <p className="text-md text-gray-600">
          Need more?{' '}
          <button onClick={() => setEnterprise(true)} className="underline hover:text-gray-800">
            View our Business and Enterprise Options
          </button>
        </p>
      </div>
      {enterprise && (
        <div
          dangerouslySetInnerHTML={stripeEmbed(
            team.id,
            email,
            process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ENTERPRISE
          )}
        />
      )}
    </div>
  )
}
