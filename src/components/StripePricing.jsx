import Script from 'next/script'
import Image from 'next/future/image'
import Alert from '@/components/Alert'
import { CheckBadgeIcon, StarIcon } from '@heroicons/react/24/solid'
import { useState } from 'react'
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

export function StripePricingTable({ teamId, email }) {
  const [enterprise, setEnterprise] = useState(false)

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
      <div className="mb-6 mt-4 text-center">
        <p className="text-md text-gray-600">Get two months free with all Yearly plans</p>
      </div>
      <div
        dangerouslySetInnerHTML={stripeEmbed(
          teamId,
          email,
          process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE
        )}
      />
      <div className="relative mx-auto mt-0 pl-12 max-w-xl space-y-4 text-center">
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

      <p className="text-sm text-gray-500 text-center mt-1">
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
            teamId,
            email,
            process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_ENTERPRISE
          )}
        />
      )}
    </div>
  )
}
