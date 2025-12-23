import { CheckCircleIcon } from '@heroicons/react/20/solid'

const tiers = [
  {
    name: 'Startup',
    id: 'tier-startup',
    href: '/register',
    priceMonthly: '$0',
    description: 'Perfect for small documentation sites and personal projects.',
    features: ['1 Public Bot', '1,000 Questions / mo', 'Basic Analytics', 'Standard Support'],
    mostPopular: false,
  },
  {
    name: 'Growth',
    id: 'tier-growth',
    href: '/register',
    priceMonthly: '$99',
    description: 'For growing teams that need more power and private documentation.',
    features: [
      '5 Bots (Public or Private)',
      '10,000 Questions / mo',
      'Advanced Analytics',
      'Priority Support',
      'Slack & Discord Integration',
      'Remove "Powered by" Branding',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'tier-enterprise',
    href: '/contact',
    priceMonthly: 'Custom',
    description: 'Dedicated support and infrastructure for large-scale knowledge bases.',
    features: [
      'Unlimited Bots',
      'Unlimited Questions',
      'Custom SLA',
      'Dedicated Success Manager',
      'SSO / SAML',
      'On-premise deployment options',
    ],
    mostPopular: false,
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function ScalabilitySection() {
  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base/7 font-semibold text-cyan-600">Scalability</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Grow with your content
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-600">
          Whether you're documenting a small open-source library or a massive enterprise platform, DocsBot scales with you.
        </p>
        
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier, tierIdx) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular ? 'lg:z-10 lg:rounded-b-none' : 'lg:mt-8',
                tierIdx === 0 ? 'lg:rounded-r-none' : '',
                tierIdx === tiers.length - 1 ? 'lg:rounded-l-none' : '',
                'flex flex-col justify-between rounded-3xl bg-white p-8 ring-1 ring-gray-200 xl:p-10',
              )}
            >
              <div>
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={classNames(
                      tier.mostPopular ? 'text-cyan-600' : 'text-gray-900',
                      'text-lg/8 font-semibold',
                    )}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-cyan-600/10 px-2.5 py-1 text-xs/5 font-semibold text-cyan-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm/6 text-gray-600">{tier.description}</p>
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-semibold tracking-tight text-gray-900">{tier.priceMonthly}</span>
                  {tier.priceMonthly !== 'Custom' ? <span className="text-sm/6 font-semibold text-gray-600">/month</span> : null}
                </p>
                <ul role="list" className="mt-8 space-y-3 text-sm/6 text-gray-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <CheckCircleIcon aria-hidden="true" className="h-6 w-5 flex-none text-cyan-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href={tier.href}
                aria-describedby={tier.id}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-500'
                    : 'text-cyan-600 ring-1 ring-inset ring-cyan-200 hover:ring-cyan-300',
                  'mt-8 block rounded-md px-3 py-2 text-center text-sm/6 font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600',
                )}
              >
                {tier.priceMonthly === 'Custom' ? 'Contact sales' : 'Get started'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

