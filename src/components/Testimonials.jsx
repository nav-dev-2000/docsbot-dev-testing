import Image from 'next/image'
import clsx from 'clsx'
import image1 from '@/images/avatars/testimony1.jpeg'
import image2 from '@/images/avatars/testimony2.jpeg'
import image3 from '@/images/avatars/testimony3.jpeg'
import image4 from '@/images/avatars/testimony4.jpeg'
import image5 from '@/images/avatars/testimony5.jpeg'
import image6 from '@/images/avatars/testimony6.png'
import image7 from '@/images/avatars/testimony-sg.jpeg'
import image8 from '@/images/avatars/avatar-default.jpg'
import image9 from '@/images/avatars/testimony7.png'
import image10 from '@/images/avatars/testimony8.jpeg'
import sony from '@/images/avatars/sony-logo.jpg'
import nuro from '@/images/logos/sony.png'
import wingarc from '@/images/avatars/wingarc.png'
import sentry from '@/images/avatars/sentry.png'
import aoyagi from '@/images/avatars/aoyagi.jpg'
import davidf from '@/images/avatars/davidf.jpeg'
import davids from '@/images/avatars/davids.jpeg'
import jasonc from '@/images/avatars/jasonc.jpeg'
import steveburge from '@/images/avatars/steve-burge.jpg'
import zachkatz from '@/images/avatars/zach-katz.jpg'
import SocialFaces from '@/components/SocialFaces'
import Link from 'next/link'

const featuredTestimonial = {
  body: 'Within just one month of deployment, DocsBot successfully handled over 30,000 customer inquiries, demonstrating its ability to handle a high volume of interactions. The chatbot achieved an impressive resolution rate of approximately 80%.',
  author: {
    name: 'NURO 光',
    role: 'Sony Network Communications Inc.',
    image: sony,
    logoUrl: nuro,
  },
}

const testimonials = [
  [
    [
      {
        body: 'DocsBot has perfectly understood our needs in AI bot operations and is adding new features at an incredible speed. We are truly grateful for this wonderful partnership!',
        author: {
          name: 'Yukitoshi Aoyagi',
          role: 'GM, Customer Success @ WingArc1st Inc.',
          imageUrl: aoyagi,
        },
      },
      {
        body: "Really excited to see what this can do for WordPress support. The chat responses are already saving us time, I'm looking forward to getting it integrated with Help Scout as well. Very promising, worth a watch!",
        author: {
          name: 'Jack Arturo',
          role: 'Founder and CEO of Very Good Plugins',
          imageUrl: image1,
        },
      },
      {
        body: "DocsBot has become an essential part of my courses, assisting students with assignments, exams, and projects, while reinforcing key concepts from our lecture discussions. By adopting this technology, I've been able to offer a richer, more engaging learning experience that empowers students to take control of their own education.",
        author: {
          name: 'Brian D. Avery',
          role: 'Instructional Associate Professor',
          imageUrl: image9,
        },
      },
      {
        body: 'While there seem to be a ton of these types of "bots" getting launched all the time, few of them are so well designed from a UI and a usability perspective. The ability to train the bot on your own content library in really intuitive ways sets DocsBot apart. Love it!',
        author: {
          name: 'Matt Cromwell',
          role: 'Customer Experience at StellarWP',
          imageUrl: image4,
        },
      },
    ],
    [
      {
        body: 'This is a product that will save time for a lot of startups and indie hackers that are usually short of staff.',
        author: {
          name: 'Igor Benić',
          role: 'Soloprenuer/Web Developer',
          imageUrl: image5,
        },
      },
      {
        body: '企業のビジネスにとって、運用ループを構築することは非常に重要です。AIボットにおいても同様であり、そこには回答を提供するだけでなく、顧客の質問を素早くキャッチして、質問の細部にまで目を通すことが含まれます。DocsBotは、AIボット運用における私たちのニーズを完璧に把握し、信じられないほどの速さで新機能を追加しています。この素晴らしいパートナーシップに心から感謝します！',
        author: {
          name: 'Yukitoshi Aoyagi',
          role: 'Customer Success 部長 @ ウイングアーク1st株式会社',
          imageUrl: wingarc,
        },
      },

      {
        body: 'DocsBot is amazing! I want to thank you for your great work on this product. I have tried a few others, and nothing compares.',
        author: {
          name: 'Gareth P.',
          role: 'IT & Marketing Manager',
          imageUrl: image8,
        },
      },
    ],
  ],
  [
    [
      {
        body: "We were invested in building our own RAG, but the ease of use of your service made me stop our efforts, even though we're all technical people here! Good job.",
        author: {
          name: 'Geovanny Tejeda',
          role: 'CTO @ BotPro',
          imageUrl: image10,
        },
      },
      {
        body: "I have tested it in the beta phase; it's an amazing tool to create your own ai bot that will give answers based on your training materials; I mean; you can train this bot to answer your common queries.",
        author: {
          name: 'Gobinda Tarafdar',
          role: 'Senior Digital Strategist - Product Co-Ordinator',
          imageUrl: image2,
        },
      },

      {
        body: "I think this is a very natural application for AI. It was already the case that you could pretty much find answers to questions by searching the FAQ. This is an even better way of doing that. I believe that this will be a big area for AI, saving on frontline customer support... and I think the AI will do a really good job eliminating level one, it'll start to eating into level two.",
        author: {
          name: 'David Sacks',
          role: 'All-In Podcast, VC Craft Ventures',
          imageUrl: davids,
        },
      },
    ],
    [
      {
        body: "We've had DocsBot on our docs site for the last couple of months and our users are definitely engaging with it. It's been a great tool for understanding what our users are interested in learning from our docs!",
        author: {
          name: 'Liza Mock',
          role: 'Manager Docs & Technical Writing @ Sentry.io',
          imageUrl: sentry,
        },
      },
      {
        body: "Huge fan of this.. We're using it for our product Dollie, to index our knowledge base and our site to provide first line of support for our customers and help them get started faster with our product using the embedded widget.",
        author: {
          name: 'Bowe Frankema',
          role: 'Founder Dollie',
          imageUrl: image3,
        },
      },

      {
        body: 'AIチャットボット系のツールでNo.1ですね。テキスト、ファイル、URLを読み込んで簡単にチャットボットが作れます。LINEの連携もできて非常に便利です！！',
        author: {
          name: 'MASAHIRO CHAEN',
          role: 'チャエン | 重要AIニュースを毎日発信',
          imageUrl: image6,
        },
      },
      {
        body: "I absolutely love DocsBot, and I'm a huge proponent. In my experience, it's about 60 percent in terms of giving a REALLY good answer. That's not to say it isn't incredible, because it is, and DocsBot still saves us a ton of time. It's great.",
        author: {
          name: 'Zach Katz',
          role: 'Founder of Gravity Kit',
          imageUrl: zachkatz,
        },
      },
      {
        body: "We've been testing DocsBot and the results are really quite impressive. The answer isn't in our docs, but DocsBot did great!",
        author: {
          name: 'Steve Burge',
          role: 'PublishPress',
          imageUrl: steveburge,
        },
      },
    ],
  ],
]

export function Testimonials() {
  return (
    <div className="relative isolate bg-white pb-32 pt-24 sm:pt-32">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-1/2 -z-10 -translate-y-1/2 transform-gpu overflow-hidden opacity-30 blur-3xl"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="ml-[max(50%,38rem)] aspect-[1313/771] w-[82.0625rem] bg-gradient-to-tr from-cyan-200 to-indigo-200"
        />
      </div>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-10 flex transform-gpu overflow-hidden pt-32 opacity-25 blur-3xl sm:pt-40 xl:justify-end"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="ml-[-22rem] aspect-[1313/771] w-[82.0625rem] flex-none origin-top-right rotate-[30deg] bg-gradient-to-tr from-teal-100 to-cyan-100 xl:ml-0 xl:mr-[calc(50%-12rem)]"
        />
      </div>
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
            Testimonials
          </h2>
          <p className="mt-2 text-balance text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Here's what people are saying about DocsBot
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 grid-rows-1 gap-8 text-sm/6 text-gray-900 sm:mt-20 sm:grid-cols-2 xl:mx-0 xl:max-w-none xl:grid-flow-col xl:grid-cols-4">
          <figure className="rounded-2xl bg-white shadow-lg ring-1 ring-gray-900/5 sm:col-span-2 xl:col-start-2 xl:row-end-1">
            <blockquote className="p-6 text-lg font-semibold tracking-tight text-gray-900 sm:p-12 sm:text-xl/8">
              <p>{`“${featuredTestimonial.body}”`}</p>
            </blockquote>
            <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-4 border-t border-gray-900/10 px-6 py-4 sm:flex-nowrap">
              <Image
                alt=""
                src={featuredTestimonial.author.image}
                className="size-10 flex-none rounded-full bg-gray-50"
              />
              <div className="flex-auto">
                <div className="font-semibold">
                  {featuredTestimonial.author.name}
                </div>
                <div className="text-gray-600">{`${featuredTestimonial.author.role}`}</div>
              </div>
              <Image
                alt=""
                src={featuredTestimonial.author.logoUrl}
                className="h-10 w-auto flex-none"
              />
            </figcaption>
          </figure>
          {testimonials.map((columnGroup, columnGroupIdx) => (
            <div
              key={columnGroupIdx}
              className="space-y-8 xl:contents xl:space-y-0"
            >
              {columnGroup.map((column, columnIdx) => (
                <div
                  key={columnIdx}
                  className={clsx(
                    (columnGroupIdx === 0 && columnIdx === 0) ||
                      (columnGroupIdx === testimonials.length - 1 &&
                        columnIdx === columnGroup.length - 1)
                      ? 'xl:row-span-2'
                      : 'xl:row-start-1',
                    'space-y-8',
                  )}
                >
                  {column.map((testimonial) => (
                    <figure
                      key={testimonial.author.name}
                      className="rounded-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/5"
                    >
                      <blockquote className="text-gray-900">
                        <p>{`“${testimonial.body}”`}</p>
                      </blockquote>
                      <figcaption className="mt-6 flex items-center gap-x-4">
                        <Image
                          alt=""
                          src={testimonial.author.imageUrl}
                          className="size-10 rounded-full bg-gray-50"
                        />
                        <div>
                          <div className="font-semibold">
                            {testimonial.author.name}
                          </div>
                          <div className="text-gray-600">
                            {testimonial.author.role}
                          </div>
                        </div>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* New CTA section */}
        <div className="mt-16 flex flex-col items-center">
          <p className="mt-4 max-w-2xl text-center text-lg text-gray-600">
            Join thousands of companies using DocsBot to deliver exceptional
            customer experiences.
          </p>
          <div className="mt-8 flex flex-col items-center gap-8 sm:flex-row">
            <Link
              href="/register"
              className="bg-animation rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              Get Started Free
            </Link>
            <SocialFaces />
          </div>
        </div>
      </div>
    </div>
  )
}
