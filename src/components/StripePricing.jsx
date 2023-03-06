import Script from 'next/script'
import Alert from '@/components/Alert'
import Image from 'next/image'
import { CheckBadgeIcon } from '@heroicons/react/24/solid'

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
  return (
    <div>
      <div className="mb-2 text-center">
        <h2 className="mb-2 text-3xl font-bold">Choose a plan</h2>
        <Alert
          type="info"
          className=""
          title="Have a discount code? Apply it on the next screen!"
        />
        <p className="text-lg text-gray-800">
          Please choose a plan that fits your needs. You can upgrade or downgrade at any time.
        </p>
        <p className="text-md  text-teal-500 font-semibold flex items-center mx-auto justify-center"><CheckBadgeIcon className='h-5 w-5 mr-1' /> 14-day money-back guarantee!</p>
      </div>
      <Script src="https://js.stripe.com/v3/pricing-table.js" />
      <div className="mt-4 mb-6 text-center">
        <p className="text-md text-gray-600">Get two months free with all Yearly plans</p>
      </div>
      <div
        dangerouslySetInnerHTML={stripeEmbed(
          teamId,
          email,
          process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE
        )}
      />
    </div>
  )
}
