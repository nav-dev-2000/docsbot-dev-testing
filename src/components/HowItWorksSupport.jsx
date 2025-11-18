import Image from 'next/image'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import {
  PlusCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  ChartBarIcon,
} from '@heroicons/react/20/solid'
import React from 'react'
import { Container } from '@/components/Container'

const features = [
  {
    name: 'Upload',
    summary: 'Upload Your Docs & Sources',
    description:
      'Easily import content from 37+ sources including docs, websites, cloud connections, and more. Our system automatically processes and indexes everything for optimal performance.',
    icon: PlusCircleIcon,
  },
  {
    name: 'Train',
    summary: 'DocsBot Trains Itself Automatically',
    description:
      'Our AI instantly understands and organizes your content—no training required. It automatically processes and indexes everything for optimal performance.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Launch',
    summary: 'Embed Anywhere',
    description:
      'Share your DocsBot via a dedicated chat interface, seamlessly embed it into your website, documentation, or help center, or connect to thousands of other apps via Zapier, Make, or our API.',
    icon: RocketLaunchIcon,
  },
  {
    name: 'Improve',
    summary: 'Refine & Grow Over Time',
    description:
      'Get detailed logs and analytics to identify areas for improvement. Track usage insights, feedback, and CSAT tracking out of the box.',
    icon: ChartBarIcon,
  },
]

function Feature({ feature, className, ...props }) {
  return (
    <div
      className={clsx(className)}
      {...props}
    >
      <div className="w-9 rounded-lg bg-cyan-600">
        <feature.icon className="h-9 w-9 p-1.5 text-white" />
      </div>
      <h3 className="mt-6 font-mono text-sm/5 font-semibold uppercase tracking-widest text-cyan-400">
        {feature.name}
      </h3>
      <p className="mt-2 font-display text-xl text-white">{feature.summary}</p>
      <p className="mt-4 text-sm text-slate-400">{feature.description}</p>
    </div>
  )
}

function FeaturesMobile() {
  return (
    <div className="-mx-4 mt-20 flex flex-col gap-y-10 overflow-hidden px-4 sm:-mx-6 sm:px-6 lg:hidden">
      {features.map((feature) => (
        <div key={feature.name}>
          <Feature feature={feature} className="mx-auto max-w-2xl" />
        </div>
      ))}
    </div>
  )
}

function FeaturesDesktop() {
  return (
    <div className="hidden lg:mt-20 lg:block">
      <div className="grid grid-cols-4 gap-x-4">
        {features.map((feature) => (
          <Feature
            key={feature.name}
            feature={feature}
            className="relative"
          />
        ))}
      </div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <section
      id="features"
      aria-label="How It Works"
      className="relative isolate overflow-hidden bg-gray-900 pb-14 pt-20 sm:pb-20 sm:pt-32 lg:pb-32"
    >
      <Container>
        <div className="mx-auto max-w-4xl md:text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-7xl text-xl text-gray-300">
            Create your own AI-powered documentation assistant in four simple
            steps - no coding or technical skills required. Our intuitive process 
            lets anyone go from setup to launch in minutes while ensuring 
            high-quality responses.
          </p>
        </div>
        <FeaturesMobile />
        <FeaturesDesktop />
      </Container>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/3 top-1/2 -z-10 -translate-y-1/2 transform-gpu blur-3xl lg:bottom-[-12rem] lg:top-auto lg:translate-y-0 lg:transform-gpu"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-cyan-500 to-cyan-600 opacity-25"
        />
      </div>
    </section>
  )
}
