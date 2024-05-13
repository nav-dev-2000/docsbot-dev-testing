import Link from 'next/link'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import clsx from 'clsx'
import { NextSeo } from 'next-seo'
import SocialFaces from '@/components/SocialFaces'
import Image from 'next/future/image'
import TrustedBy from '@/components/TrustedBy'
import RegisterCTA from '@/components//RegisterCTA'
import { INDUSTRIES } from '@/constants/industries.constants'
import dynamic from 'next/dynamic'
import React from 'react'

// Function to dynamically import icons
const dynamicIconImport = (iconName) => {
  return dynamic(() =>
    import('@heroicons/react/20/solid').then((icons) => {
      const IconComponent = icons[iconName]
      if (!IconComponent) {
        return icons['LightBulbIcon']
      }
      return IconComponent
    })
  )
}

export default function IndustryPage({
  slug,
  business,
  industry,
  image,
  title,
  mainContentIntro,
  supportSection,
  usesSection,
}) {
  const enhancedFeatures = Object.entries(supportSection.features).map(([key, bulletPoint]) => {
    const DynamicIcon = dynamicIconImport(bulletPoint.icon)
    return {
      ...bulletPoint,
      icon: DynamicIcon,
    }
  })

  const enhancedUses = Object.entries(usesSection.uses).map(([key, bulletPoint]) => {
    const DynamicIcon = dynamicIconImport(bulletPoint.icon)
    return {
      ...bulletPoint,
      icon: DynamicIcon,
    }
  })

  return (
    <>
      <NextSeo
        title={`${title} - DocsBot AI`}
        description={`${mainContentIntro}`}
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/og-industry.jpeg',
              alt: 'AI chatbots for your industry',
            },
          ],
        }}
      />
      <Header />
      <main>
        <div className="relative isolate overflow-hidden bg-gray-900 px-6 py-16 sm:py-24 lg:px-8">
          <img src={image} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div
            className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ffdb] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-2 text-xl font-semibold leading-7 text-teal-500">DocsBot AI</p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">{title}</h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">{mainContentIntro}</p>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl justify-center lg:mx-0 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-6 text-base font-semibold leading-7 text-white sm:grid-cols-2 md:flex lg:gap-x-10">
              <Link href="#support">
                For Customer Support <span aria-hidden="true">&darr;</span>
              </Link>
              <Link href="#uses">
                {business} Uses <span aria-hidden="true">&darr;</span>
              </Link>
            </div>
          </div>
          <div className="mx-auto mt-20 max-w-7xl">
            <h2 className="mb-6 text-center text-lg font-semibold leading-8 text-white">
              Trusted by
            </h2>
            <TrustedBy />
          </div>

          <div
            className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
        </div>

        <div id="support" className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                {supportSection.preHeading}
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {supportSection.heading}
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">{supportSection.paragraph}</p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {enhancedFeatures.map((feature) => (
                  <div key={feature.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-gray-900">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </div>
                      {feature.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-600">
                      {feature.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mt-20 flex items-center justify-center gap-x-6 bg-white lg:flex-shrink-0">
              <Link
                href="/register"
                className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                <span>Automate Your Customer Support</span>
              </Link>
              <Link
                href="/tools/ai-support-savings-calculator"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white pb-24">
          <SocialFaces />
        </div>

        <div id="uses" className="mb-12 bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                {usesSection.preHeading}
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {usesSection.heading}
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">{usesSection.paragraph}</p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {enhancedUses.map((feature) => (
                  <div key={feature.name} className="flex flex-col">
                    <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-white">
                      <feature.icon
                        className="h-5 w-5 flex-none text-cyan-400"
                        aria-hidden="true"
                      />
                      {feature.name}
                    </dt>
                    <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-300">
                      <p className="flex-auto">{feature.description}</p>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="mx-auto mt-20 flex max-w-2xl items-center justify-center gap-x-6 lg:flex-shrink-0">
              <Link
                href="/register"
                className="rounded-md bg-cyan-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
              >
                <span>{usesSection.heading}</span>
              </Link>
              <Link href="/#features" className="text-sm font-semibold leading-6 text-white">
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>

        <RegisterCTA customTitle={`Transform ${business} with AI`} button="Get started for free!" />

        <div className="mx-auto bg-white py-16 text-center">
          <h2 className="mx-auto max-w-2xl text-xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Discover how DocsBot AI can revolutionize your industry!
          </h2>
          {Object.entries(INDUSTRIES.reduce((acc, item) => {
            if (item.slug !== slug) {
              acc[item.industry] = [...(acc[item.industry] || []), item];
            }
            return acc;
          }, {})).map(([industry, items], industryIndex) => (
            <div key={industry} className="mt-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{industry}</h3>
              <div className="flex flex-wrap justify-center bg-white text-lg font-semibold leading-7 text-cyan-700">
                {items.map((item, index) => (
                  <span key={item.slug}>
                    <Link
                      className="m-4 inline-block underline-offset-2 hover:underline"
                      href={`/industry/${item.slug}`}
                    >
                      {item.business}
                    </Link>
                    {index < items.length - 1 && <span className="mx-2 text-gray-400">•</span>}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  )
}
export async function getStaticPaths() {
  let paths = INDUSTRIES.map((item) => {
    return { params: { index: `${item.slug}` } }
  })
  return {
    paths,
    fallback: false,
  }
}

export async function getStaticProps(context) {
  return {
    props: { ...INDUSTRIES.find((e) => `${e.slug}` == context.params.index) },
  }
}
