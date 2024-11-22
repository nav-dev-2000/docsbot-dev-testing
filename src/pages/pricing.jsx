import Image from 'next/image'
import Link from 'next/link'
import Head from 'next/head'
import { NextSeo } from 'next-seo'
import Faq from '@/components/Faq'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CTASection from '@/components/CTASection'
import { Testimonials } from '@/components/Testimonials'
import TrustedBy from '@/components/TrustedBy'
import { motion } from 'framer-motion'
import { useRef, useState, useEffect, useCallback } from 'react'
import AIHero from '@/components/AIHero'
import { CheckIcon, PlusIcon, CheckBadgeIcon } from '@heroicons/react/20/solid'
import {
  frequencies,
  pricingTiers,
  enterpriseFeatures,
  currencies,
} from '@/constants/pricing.constants'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import sony from '@/images/logos/logo-sony.svg'
import nuro from '@/images/avatars/sony-logo.jpg'
import wingarcLogo from '@/images/logos/logo-wingarc.png'
import aoyagi from '@/images/avatars/aoyagi.jpg'

// Add this component for reusability
const ScrollFadeIn = ({ children, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration: 0.7, delay }}
    >
      {children}
    </motion.div>
  )
}

// Add this helper function at the top level
const formatNumber = (num) => {
  return num.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// Add this new component near the top of the file
const TypewriterText = ({ text, delay = 0 }) => {
  const words = text.split(' ')
  return (
    <motion.p
      className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: delay,
          },
        },
        hidden: {},
      }}
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
              },
            },
            hidden: {
              opacity: 0,
              y: 20,
            },
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.p>
  )
}

export const AiSupportSavingsCalculator = () => {
  const [supportTickets, setSupportTickets] = useState(1000)
  const [timePerTicket, setTimePerTicket] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(18)
  const closeRate = 0.75

  const planName = supportTickets < 500 ? 'Power' : supportTickets < 10000 ? 'Pro' : 'Business'
  const planCost = supportTickets < 500 ? 41 : supportTickets < 10000 ? 83 : 416
  const timeSavings = Math.round(
    (supportTickets * closeRate * timePerTicket) / 60,
  )
  const costSavings = Math.round(timeSavings * hourlyRate - planCost)

  const handleSupportTicketsChange = useCallback((e) => {
    setSupportTickets(e.target.value)
  }, [])

  const handleTimePerTicketChange = useCallback((e) => {
    setTimePerTicket(e.target.value)
  }, [])

  const handleHourlyRateChange = useCallback((e) => {
    setHourlyRate(e.target.value)
  }, [])

  const logScale = (position) => {
    const minp = 0
    const maxp = 100
    const minv = Math.log(50)
    const maxv = Math.log(200000)
    const scale = (maxv - minv) / (maxp - minp)
    return Math.round(Math.exp(minv + scale * (position - minp)))
  }

  const logPosition = (value) => {
    const minp = 0
    const maxp = 100
    const minv = Math.log(50)
    const maxv = Math.log(200000)
    const scale = (maxv - minv) / (maxp - minp)
    return Math.round((Math.log(value) - minv) / scale + minp)
  }

  return (
    <div className=" bg-gray-50 text-center px-6 lg:px-8 py-16 lg:py-24">
      <div className="max-w-7xl mx-auto pb-0">

        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
            AI Customer Support
          </h2>
          <TypewriterText text="Humans are expensive and hard to scale!" delay={0.2} />
          <p className="mt-6 mb-12 text-lg text-gray-500 sm:text-xl/8">
            AI chatbots can handle Tier 1 support inquiries instantly, 24/7, at a fraction of the cost of human agents. They can also assist your support team by providing instant access to knowledge, drafting responses, and handling repetitive queries - allowing your agents to focus on complex issues that truly need a human touch.
          </p>
        </div>

        <div className="mx-auto rounded-xl bg-white px-6 py-10 shadow-xl ring-1 ring-slate-900/10 lg:px-8">
          <div className="mx-auto sm:text-center">
            <h2 className="text-primary mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              You can save
              {costSavings > 0 && (
                <span className="px-2 text-cyan-600">
                  $<span>{costSavings.toLocaleString()}</span>
                </span>
              )}
              and
              <span className="px-2 text-cyan-600">
                <span>{timeSavings.toLocaleString()}</span> hours
              </span>
              <br className="hidden px-2 sm:block" />
              {costSavings > 0 && <span>every month!</span>}
            </h2>
            <p className="text-muted-foreground mt-6 hidden text-lg leading-8 sm:block">
              Calculated based on the {planName} plan ($<span>{planCost}</span>
              /mo) and our average customer AI chatbot deflection rate of 75%.
            </p>
          </div>
          <div className="mt-12 flex items-center gap-x-6">
            <div className="text-muted-foreground w-20 flex-shrink-0 sm:w-28 text-xs md:text-base">
              Support Tickets / Messages
            </div>
            <input
              type="range"
              value={logPosition(supportTickets)}
              min="0"
              max="100"
              step="1"
              onChange={(e) =>
                setSupportTickets(logScale(Number(e.target.value)))
              }
              className="col-span-4 h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-cyan-600"
            />
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs md:text-base">
              <strong>{supportTickets}</strong>
              <br />
              per month
            </div>
          </div>
          <div className="mt-12 flex items-center gap-x-6">
            <div className="text-muted-foreground w-20 flex-shrink-0 sm:w-28 text-xs md:text-base">
              Time Per Ticket
            </div>
            <input
              type="range"
              value={timePerTicket}
              min="5"
              max="60"
              step="1"
              onChange={handleTimePerTicketChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-cyan-600"
            />
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs md:text-base">
              <strong>{timePerTicket}</strong>
              <br />
              minutes
            </div>
          </div>
          <div className="mt-12 flex items-center gap-x-6">
            <div className="text-muted-foreground w-20 flex-shrink-0 sm:w-28 text-xs md:text-base">
              Hourly <br />
              Rate
            </div>
            <input
              type="range"
              value={hourlyRate}
              min="7"
              max="50"
              step="1"
              onChange={handleHourlyRateChange}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-100 accent-cyan-600"
            />
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs md:text-base">
              <strong>${hourlyRate}</strong>
              <br />
              per hour
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PricingPage() {
  const [frequency, setFrequency] = useState(frequencies[1])
  const [currency, setCurrency] = useState('USD')

  return (
    <>
      <NextSeo title="Pricing & Savings - DocsBot AI" />
      <Head />
      <div className="bg-white">
        <div className="relative overflow-hidden">
          <Header transparent />
          <main>
            <div className="-mt-24 bg-gray-900">
              <div className="relative isolate overflow-hidden bg-gray-900">
                <svg
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 size-full stroke-white/10 [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]"
                >
                  <defs>
                    <pattern
                      x="50%"
                      y={-1}
                      id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
                      width={200}
                      height={200}
                      patternUnits="userSpaceOnUse"
                    >
                      <path d="M.5 200V.5H200" fill="none" />
                    </pattern>
                  </defs>
                  <svg
                    x="50%"
                    y={-1}
                    className="overflow-visible fill-gray-800/20"
                  >
                    <path
                      d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                      strokeWidth={0}
                    />
                  </svg>
                  <rect
                    fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
                    width="100%"
                    height="100%"
                    strokeWidth={0}
                  />
                </svg>
                <div
                  aria-hidden="true"
                  className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]"
                >
                  <div
                    style={{
                      clipPath:
                        'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
                    }}
                    className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-teal-500 to-cyan-600 opacity-20"
                  />
                </div>
                <div className="mx-auto max-w-7xl px-6 pb-12 pt-10 sm:pb-16 lg:px-8 lg:pt-40">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 text-center"
                  >
                    <h1 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-teal-400">
                      Pricing
                    </h1>
                    <p className="mt-4 text-pretty text-center text-5xl font-semibold tracking-tight text-white sm:text-7xl">
                      <span className="block text-6xl leading-[0.8] tracking-tighter text-white md:text-8xl md:leading-[0.8]">
                        Driving Business Value
                      </span>
                      <span className="mt-2 block bg-gradient-to-r from-teal-200 to-cyan-400 bg-clip-text pb-3 text-3xl text-transparent sm:pb-5 sm:text-4xl">
                        See how much you can save with AI
                      </span>
                    </p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                  <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
                    Save money and time with DocsBot. We offer a variety of
                    plans to fit your needs. Need a custom plan?{' '}
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
                  <p className="mb-24 flex items-center justify-center text-lg font-bold text-teal-400">
                    <CheckBadgeIcon className="mr-1 h-5 w-5" /> 14-day
                    money-back guarantee!
                    </p>
                  </motion.div>

                  {/* Period and Currency Switchers */}
                  <div className="mb-8 mt-10 flex flex-col items-center gap-8 px-6 sm:flex-row sm:items-start sm:justify-center md:justify-between lg:px-0">
                    <div className="w-full sm:w-auto">
                      <RadioGroup
                        value={frequency}
                        onChange={setFrequency}
                        className="grid grid-cols-2 gap-x-1 rounded-lg bg-slate-800/50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-700"
                      >
                        <RadioGroup.Label className="sr-only">
                          Payment frequency
                        </RadioGroup.Label>
                        {frequencies.map((option) => (
                          <RadioGroup.Option
                            key={option.value}
                            value={option}
                            className={({ checked }) =>
                              clsx(
                                checked
                                  ? 'bg-cyan-600 text-white'
                                  : 'text-gray-300',
                                'cursor-pointer rounded-lg px-8 py-2',
                              )
                            }
                          >
                            <span>{option.label}</span>
                          </RadioGroup.Option>
                        ))}
                      </RadioGroup>
                      <p className="mt-2 text-center text-sm text-gray-300 sm:text-left">
                        Two months free with annual plans!
                      </p>
                    </div>

                    <div className="w-full sm:w-auto">
                      <RadioGroup
                        value={currency}
                        onChange={setCurrency}
                        className="grid grid-cols-5 gap-x-1 rounded-md bg-slate-800/50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-700"
                      >
                        <RadioGroup.Label className="sr-only">
                          Currency
                        </RadioGroup.Label>
                        {Object.keys(currencies).map((option) => (
                          <RadioGroup.Option
                            key={option}
                            value={option}
                            className={({ checked }) =>
                              clsx(
                                checked
                                  ? 'bg-cyan-600 text-white'
                                  : 'text-gray-300',
                                'cursor-pointer rounded-md px-2.5 py-1',
                              )
                            }
                          >
                            <span className="whitespace-nowrap">
                              {currencies[option].symbol}{' '}
                              {currencies[option].label}
                            </span>
                          </RadioGroup.Option>
                        ))}
                      </RadioGroup>
                    </div>
                  </div>

                  <div className="relative mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-0">
                    <div className="isolate mx-auto grid max-w-md grid-cols-1 gap-8 sm:mx-0 sm:max-w-none sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4">
                      {pricingTiers.map((tier, index) => (
                        <div
                          key={tier.id}
                          className={clsx(
                            "-m-2 grid grid-cols-1 rounded-[2rem] shadow-[inset_0_0_2px_1px_#ffffff4d] ring-1 max-sm:mx-auto max-sm:w-full max-sm:max-w-md hover:shadow-lg hover:shadow-cyan-300/20 hover:scale-105 transition-all duration-300",
                            tier.mostPopular 
                              ? "ring-cyan-500/50"
                              : "ring-black/5"
                          )}
                        >
                          <div className={clsx(
                            "grid grid-cols-1 rounded-[2rem] p-2",
                            tier.mostPopular
                              ? "shadow-lg shadow-cyan-500/20"
                              : "shadow-md shadow-black/5"
                          )}>
                            <div className={clsx(
                              "rounded-3xl bg-white p-6 pb-9",
                              tier.mostPopular
                                ? "shadow-2xl ring-1 ring-cyan-600"
                                : "shadow-2xl ring-1 ring-black/5"
                            )}>
                              <div className="flex items-center justify-between gap-x-4">
                                <h3
                                  id={tier.id}
                                  className={clsx(
                                    tier.mostPopular
                                      ? 'text-cyan-600'
                                      : 'text-gray-900',
                                    'text-lg font-semibold',
                                  )}
                                >
                                  {tier.name}{' '}
                                  <span className="sr-only">plan</span>
                                </h3>
                                {tier.mostPopular ? (
                                  <p className="rounded-full bg-cyan-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-cyan-600">
                                    Most popular
                                  </p>
                                ) : null}
                              </div>
                              <p className="mt-2 text-pretty text-sm/6 text-gray-600">
                                {tier.description}
                              </p>
                              <div className="mt-8 flex items-center gap-4">
                                {frequency?.value === 'monthly' ? (
                                  <>
                                    <div className="text-5xl font-semibold text-gray-950">
                                      {currencies[currency].symbol}
                                      <motion.span
                                        key={`${currency}-${frequency.value}-${tier.price[currency][frequency?.value]}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                      >
                                        {formatNumber(tier.price[currency][frequency?.value])}
                                      </motion.span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <p>{frequency.priceSuffix}</p>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="text-5xl font-semibold text-gray-950">
                                      {currencies[currency].symbol}
                                      <motion.span
                                        key={`${currency}-${frequency.value}-${tier.price[currency][frequency?.value]}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4 }}
                                      >
                                        {formatNumber(tier.price[currency][frequency?.value] / 12)}
                                      </motion.span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      <p>/month</p>
                                      <p className="text-xs">
                                        ({currencies[currency].symbol}
                                        <motion.span
                                          key={`${currency}-${frequency.value}-yearly-${tier.price[currency][frequency?.value]}`}
                                          initial={{ opacity: 0, y: 20 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.4 }}
                                        >
                                          {formatNumber(tier.price[currency][frequency?.value])}
                                        </motion.span>{' '}
                                        /yr)
                                      </p>
                                    </div>
                                  </>
                                )}
                              </div>
                              <div className="mt-8">
                                <Link
                                  href={tier.href}
                                  aria-label={`Signup for the ${tier.name} plan`}
                                  className="bg-animation inline-block w-full rounded-md bg-cyan-600 px-3.5 py-2 text-center text-sm/6 font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                                >
                                  Get started
                                </Link>
                              </div>
                              <div className="mt-8">
                                <h3 className="text-sm/6 font-medium text-gray-950">
                                {index === 0 ? 'Including:' : `Everything in ${pricingTiers[index - 1]?.name || 'Free'} plan, and:`}
                                </h3>
                                <ul className="mt-3 space-y-3">
                                  {tier.features.map((feature) => (
                                    <li
                                      key={feature}
                                      className="group flex items-start gap-4 text-sm/6 text-gray-600"
                                    >
                                      <span className="inline-flex h-6 items-center">
                                        <PlusIcon
                                          aria-hidden="true"
                                          className="size-4 fill-gray-400"
                                        />
                                      </span>
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="mx-auto mt-10 text-center text-sm text-gray-200">
                      Does not include optional OpenAI API costs
                      (&lt;$0.008/question) if using advanced models like
                      GPT-4o.
                    </p>
                  </div>

                  <ScrollFadeIn>
                    <section className="pt-16 sm:pt-24">
                      <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-2xl grid-cols-1 lg:mx-0 lg:max-w-none lg:grid-cols-2">
                          <div className="flex flex-col pb-10 sm:pb-16 lg:pb-0 lg:pr-8 xl:pr-20">
                            <Image
                              alt=""
                              src={sony}
                              className="max-h-8 w-fit self-start mt-1"
                            />
                            <figure className="mt-10 flex flex-auto flex-col justify-between">
                              <blockquote className="text-xl/8 text-white">
                                <p>
                                  "Within just one month of deployment, DocsBot
                                  successfully handled over 30,000 customer
                                  inquiries, demonstrating its ability to handle
                                  a high volume of interactions. The chatbot
                                  achieved an impressive resolution rate of
                                  approximately 80%."
                                </p>
                              </blockquote>
                              <figcaption className="mt-10 flex items-center gap-x-6">
                                <Image
                                  alt=""
                                  src={nuro}
                                  className="size-14 rounded-full bg-gray-50"
                                />
                                <div className="text-base">
                                  <div className="font-semibold text-white">
                                    NURO 光
                                  </div>
                                  <div className="mt-1 text-gray-400">
                                    Sony Network Communications Inc.
                                  </div>
                                </div>
                              </figcaption>
                            </figure>
                          </div>
                          <div className="flex flex-col border-t border-white/10 pt-10 sm:pt-16 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:pl-20">
                            <Image
                              alt=""
                              src={wingarcLogo}
                              className="w-fit self-start"
                            />
                            <figure className="mt-10 flex flex-auto flex-col justify-between">
                              <blockquote className="text-lg/8 text-white">
                                <p>
                                  "企業のビジネスにとって、運用ループを構築することは非常に重要です。AIボットにおいても同様であり、そこには回答を提供するだけでなく、顧客の質問を素早くキャッチして、質問の細部にまで目を通すことが含まれます。DocsBotは、AIボット運用における私たちのニーズを完璧に把握し、信じられないほどの速さで新機能を追加しています。この素晴らしいパートナーシップに心から感謝します！"
                                </p>
                              </blockquote>
                              <figcaption className="mt-10 flex items-center gap-x-6">
                                <Image
                                  className="h-14 w-14 rounded-full bg-gray-400"
                                  src={aoyagi}
                                  alt=""
                                />
                                <div className="text-base">
                                  <div className="font-semibold text-white">
                                    Yukitoshi Aoyagi
                                  </div>
                                  <div className="mt-1 text-gray-400">
                                    Customer Success 部長 @
                                    ウイングアーク1st株式会社
                                  </div>
                                </div>
                              </figcaption>
                            </figure>
                          </div>
                        </div>

                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: 1 }}
                          className="mx-auto max-w-7xl pt-6 xl:pt-14"
                        >
                          <TrustedBy />
                        </motion.div>
                      </div>
                    </section>
                  </ScrollFadeIn>
                </div>
              </div>
            </div>

            <ScrollFadeIn>
              <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
                <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                  Other Plans
                </h2>
                <div className="mx-auto mt-12 flex max-w-2xl flex-col items-start gap-x-8 gap-y-6 rounded-3xl p-8 ring-1 ring-gray-900/10 sm:gap-y-10 sm:p-10 lg:col-span-2 lg:max-w-none lg:flex-row lg:items-center">
                  <div className="lg:min-w-0 lg:flex-1">
                    <h3 className="text-lg font-semibold leading-8 tracking-tight text-cyan-600">
                      Personal
                    </h3>
                    <p className="mt-1 text-base leading-7 text-gray-600">
                      Try DocsBot free for personal use. No credit card
                      required. Import document files or urls with up to 50
                      pages of content and start chatting with your bot. Free
                      bots will be deleted after 30 days.
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
                    <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                      Enterprise
                    </h3>
                    <p className="mt-6 text-base leading-7 text-gray-600">
                      For serious traffic and custom integrations. Identify
                      problem areas in your product and gaps in your
                      documentation with automated AI analysis of user
                      questions. Get priority support & integration help to
                      create specialized bots for your unique business needs.
                      Use the Microsoft Azure OpenAI Service for
                      Enterprise-grade security with role-based access control
                      (RBAC), private networks, and region restrictions.
                      Self-hosted options are available to satisfy any data
                      protection requirements.
                    </p>
                    <div className="mt-10 flex items-center gap-x-4">
                      <h4 className="flex-none text-sm font-semibold leading-6 text-cyan-600">
                        Access everything in Business, plus:
                      </h4>
                      <div className="h-px flex-auto bg-gray-100" />
                    </div>
                    <ul
                      role="list"
                      className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
                    >
                      {enterpriseFeatures.map((feature) => (
                        <li key={feature} className="flex gap-x-3">
                          <CheckIcon
                            className="h-6 w-5 flex-none text-cyan-600"
                            aria-hidden="true"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
                    <div className="h-full rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
                      <div className="mx-auto max-w-xs px-8">
                        <p className="text-base font-semibold text-gray-600">
                          Get Started
                        </p>
                        <a
                          href="mailto:human@docsbot.ai"
                          onClick={(e) => {
                            if (Beacon !== undefined) {
                              e.preventDefault()
                              DocsBotAI.unmount()
                              Beacon(
                                'init',
                                '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2',
                              )
                              Beacon('open')
                            }
                          }}
                          className="mt-10 block w-full rounded-md bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                        >
                          Contact us
                        </a>
                        <p className="mt-6 text-xs leading-5 text-gray-600">
                          for your custom quote and to learn more about our
                          enterprise features.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>


            <ScrollFadeIn>
              <AiSupportSavingsCalculator />
            </ScrollFadeIn>

            <ScrollFadeIn>
              <Testimonials />
            </ScrollFadeIn>

            <ScrollFadeIn>
              <AIHero />
            </ScrollFadeIn>

            <ScrollFadeIn>
              <CTASection />
            </ScrollFadeIn>

            <ScrollFadeIn>
              <Faq />
            </ScrollFadeIn>
          </main>
          <Footer />
        </div>
      </div>
    </>
  )
}
