import Image from 'next/image'
import { ShieldCheckIcon, GlobeAltIcon, LockClosedIcon, ServerStackIcon } from '@heroicons/react/24/outline'

import gdprImage from '@/images/gdpr.webp'
import soc2Image from '@/images/soc-2.webp'

const defaultFeatures = [
  {
    name: 'SOC 2 Type II Certification',
    description:
      'Independent auditors validate our controls annually so your organization can rely on consistent safeguards.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'GDPR-ready governance',
    description:
      'Data retention, erasure, and residency workflows respect regional privacy obligations across the EU and beyond.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Granular access controls',
    description:
      'Role-based permissions and scoped API tokens keep every workspace isolated and auditable.',
    icon: LockClosedIcon,
  },
  {
    name: 'Encryption end-to-end',
    description:
      'Customer content stays encrypted at rest and in transit using strong TLS and AES-256 standards.',
    icon: ServerStackIcon,
  },
]

export default function SecuritySection({
  eyebrow = 'Security & compliance',
  title = 'Built-in protection for sensitive data',
  description =
    'DocsBot pairs enterprise AI with rigorous controls so you can ship AI agents quickly without sacrificing privacy or trust.',
  features = defaultFeatures,
}) {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <p className="text-center text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
            {eyebrow}
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-6 sm:mt-8 sm:flex-row">
            <a
              className="shrink-0"
              href="https://trust.docsbot.ai"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image
                alt="SOC 2 Type II certification badge"
                className="h-16 w-auto sm:h-24"
                priority
                src={soc2Image}
              />
            </a>
            <h2 className="text-pretty text-center text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl lg:text-balance">
              {title}
            </h2>
            <a
              className="shrink-0"
              href="https://docsbot.ai/legal/gdpr"
              rel="noopener noreferrer"
              target="_blank"
            >
              <Image
                alt="GDPR compliance badge"
                className="h-16 w-auto sm:h-24"
                priority
                src={gdprImage}
              />
            </a>
          </div>
          <p className="mt-6 text-lg/8 text-gray-700">{description}</p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-16">
                <dt className="text-base/7 font-semibold text-gray-900">
                  <div className="absolute left-0 top-0 flex size-10 items-center justify-center rounded-lg bg-cyan-600">
                    <feature.icon aria-hidden="true" className="size-6 text-white" />
                  </div>
                  {feature.name}
                </dt>
                <dd className="mt-2 text-base/7 text-gray-600">{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
