import Script from 'next/script'
import Alert from '@/components/Alert'
import Image from 'next/future/image'

function stripeEmbed(teamId, email, table) {
  return {
    __html: `<stripe-pricing-table pricing-table-id="${table}"
publishable-key="${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY}"
client-reference-id="${teamId}"
customer-email="${email}">
</stripe-pricing-table>`,
  }
}

export function StripePricingTableBaseh({ teamId, email }) {
  return (
    <>
      <div className="mb-2 text-center">
        <h2 className="mb-2 text-3xl font-bold">Choose a plan</h2>
        <Alert
          type="info"
          className=""
          title="Have a discount code? Apply it on the next screen!"
        />
        <p className="text-lg text-gray-800">
          Please choose a plan that fits your needs. Just getting started? Try our one-time{' '}
          <strong>Starter</strong> plan to generate hundreds of amazing profile pictures!
        </p>
      </div>
      <Script src="https://js.stripe.com/v3/pricing-table.js" />
      <div className="mt-4 mb-6 text-center">
        <h2 className="mb-2 text-3xl font-bold">Power user?</h2>
        <p className="text-lg text-gray-800">Save big with bulk pricing.</p>
        <p className="text-md text-gray-600">Get two months free with all Yearly plans!</p>
      </div>
      <div
        dangerouslySetInnerHTML={stripeEmbed(
          teamId,
          email,
          process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE
        )}
      />
    </>
  )
}

export function StripePricingTableRecharge({ teamId, email }) {
  return (
    <>
      <div className="mb-0 text-center">
        <h2 className="mb-2 text-3xl font-bold">Top-up your credits</h2>
        <p className="m-0 text-md text-gray-800 text-justify">
          Just want to top-up your base or source credit balance with a one-time purchase? (You can choose multiple at checkout)
        </p>
      </div>
      <Script src="https://js.stripe.com/v3/pricing-table.js" />
        <div
          className="min-w-fit"
          dangerouslySetInnerHTML={stripeEmbed(
            teamId,
            email,
            process.env.NEXT_PUBLIC_STRIPE_PRICING_TABLE_SINGLE
          )}
        />
    </>
  )
}
