import Image from "next/image"
import { ArrowUpRightIcon } from "@heroicons/react/20/solid"
import {
  Description,
  Section,
  SectionContent,
  Title,
} from "@/components/elements"
import stellarwpLogo from '@/images/logos/stellarwp-white.svg'
import sonyLogo from '@/images/logos/logo-sony.svg'

const caseStudies = [
  {
    logo: stellarwpLogo,
    logoAlt: 'StellarWP logo',
    headline: 'Software',
    client: 'StellarWP + DocsBot',
    quote:
      '“AI doesn’t replace human support; it scales access to better answers and makes documentation more effective.”',
    link: 'https://docsbot.ai/article/stellarwp-docsbot-expanding-customer-success',
  },
  {
    logo: sonyLogo,
    logoAlt: 'Sony logo',
    headline: 'Telecommunications',
    client: 'Sony’s NURO Hikari + DocsBot',
    quote:
      '“Within just one month of deployment, DocsBot successfully handled over 30,000 customer inquiries with an ~80% resolution rate.”',
    link: 'https://docsbot.ai/article/sonys-nuro-hikari-revolutionizing-customer-support-with-docsbots-ai-powered-chatbot',
  },
]

const CaseStudyCard = ({ logo, logoAlt, headline, client, quote, link }) => {
  return (
    <article className="relative isolate flex flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950 p-8 shadow-2xl ring-1 ring-cyan-500/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-cyan-500/15 via-slate-900/50 to-indigo-700/25 opacity-80" aria-hidden="true" />
      <div className="relative flex h-full flex-col gap-6">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-col gap-1">
            <h3 className="text-2xl font-semibold leading-tight text-white">{headline}</h3>
            {client && <p className="text-base font-medium text-cyan-100/80">{client}</p>}
          </div>
          <Image src={logo} alt={logoAlt} className="h-6 w-auto sm:h-7 lg:h-8 xl:h-9 mr-auto sm:mr-0" />
        </div>

        <div className="flex flex-1 flex-col gap-4">
          <blockquote className="text-lg leading-8 text-neutral-100">
            <p className="text-pretty">{quote}</p>
          </blockquote>

          <div className="mt-auto pt-2">
            <a
              href={link}
              className="inline-flex items-center gap-2 text-base font-semibold text-cyan-200 transition hover:text-white"
            >
              Read case study
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

export const CaseStudies = ({ title, description }) => {
  return (
    <Section theme="medium" className="bg-gradient-to-b from-slate-100 via-slate-50 to-white py-8 lg:pt-16 lg:pb-16">
      <SectionContent
        theme="light"
        title={title}
        description={description}
        isBoxedHeader={true}
      >
        <div className="lg:mt-10 flex flex-col gap-6 lg:gap-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.headline} {...study} />
            ))}
          </div>
        </div>
      </SectionContent>
    </Section>
  )
}
