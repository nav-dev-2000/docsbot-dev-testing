import Image from 'next/future/image'

import { Container } from '@/components/Container'
import image1 from '@/images/avatars/testimony1.jpeg'
import image2 from '@/images/avatars/testimony2.jpeg'
import image3 from '@/images/avatars/testimony3.jpeg'
import image4 from '@/images/avatars/testimony4.jpeg'
import image5 from '@/images/avatars/testimony5.jpeg'
import image6 from '@/images/avatars/testimony6.png'
import image7 from '@/images/avatars/testimony-sg.jpeg'
import image8 from '@/images/avatars/avatar-default.jpg'
import sony from '@/images/avatars/sony-logo.jpg'
import wingarc from '@/images/avatars/wingarc.png'
import sentry from '@/images/avatars/sentry.png'
import aoyagi from '@/images/avatars/aoyagi.jpg'
import davidf from '@/images/avatars/davidf.jpeg'
import davids from '@/images/avatars/davids.jpeg'
import jasonc from '@/images/avatars/jasonc.jpeg'

const testimonials = [
  [
    {
      content:
        'Within just one month of deployment, DocsBot successfully handled over 30,000 customer inquiries, demonstrating its ability to handle a high volume of interactions. The chatbot achieved an impressive resolution rate of approximately 80%.',
      author: {
        name: 'NURO 光',
        role: 'Sony Network Communications Inc.',
        image: sony,
      },
    },

    {
      content:
        'AIチャットボット系のツールでNo.1ですね。テキスト、ファイル、URLを読み込んで簡単にチャットボットが作れます。LINEの連携もできて非常に便利です！！',
      author: {
        name: 'MASAHIRO CHAEN',
        role: 'チャエン | 重要AIニュースを毎日発信',
        image: image6,
      },
    },

    {
      content:
        "Really excited to see what this can do for WordPress support. The chat responses are already saving us time, I'm looking forward to getting it integrated with Help Scout as well. Very promising, worth a watch!",
      author: {
        name: 'Jack Arturo',
        role: 'Founder and CEO of Very Good Plugins',
        image: image1,
      },
    },

    {
      content:
        'This is a product that will save time for a lot of startups and indie hackers that are usually short of staff.',
      author: {
        name: 'Igor Benić',
        role: 'Soloprenuer/Web Developer',
        image: image5,
      },
    },
    {
      content:
        "AI assistants are now doing the work of 700 full-time agents at Klarna. They moved issue resolving times from 11 minutes with humans to two minutes with AI. And customer satisfaction is on par with human agents. And it said its resolutions are more accurate than humans, creating a 25% drop in repeat inquiries.",
      author: {
        name: 'Jason Calacanis',
        role: 'All-In Podcast Host, Investor',
        image: jasonc,
      },
    },
  ],
  [
    {
      content:
        '企業のビジネスにとって、運用ループを構築することは非常に重要です。AIボットにおいても同様であり、そこには回答を提供するだけでなく、顧客の質問を素早くキャッチして、質問の細部にまで目を通すことが含まれます。DocsBotは、AIボット運用における私たちのニーズを完璧に把握し、信じられないほどの速さで新機能を追加しています。この素晴らしいパートナーシップに心から感謝します！',
      author: {
        name: 'Yukitoshi Aoyagi',
        role: 'Customer Success 部長 @ ウイングアーク1st株式会社',
        image: wingarc,
      },
    },
    {
      content:
        'While there seem to be a ton of these types of "bots" getting launched all the time, few of them are so well designed from a UI and a usability perspective. The ability to train the bot on your own content library in really intuitive ways sets DocsBot apart. Love it!',
      author: {
        name: 'Matt Cromwell',
        role: 'Customer Experience at StellarWP',
        image: image4,
      },
    },

    {
      content:
        "I have tested it in the beta phase; it's an amazing tool to create your own ai bot that will give answers based on your training materials; I mean; you can train this bot to answer your common queries.",
      author: {
        name: 'Gobinda Tarafdar',
        role: 'Senior Digital Strategist - Product Co-Ordinator',
        image: image2,
      },
    },
    {
      content:
        "I think this is a very natural application for AI. It was already the case that you could pretty much find answers to questions by searching the FAQ. This is an even better way of doing that. I believe that this will be a big area for AI, saving on frontline customer support... and I think the AI will do a really good job eliminating level one, it'll start to eating into level two.",
      author: {
        name: 'David Sacks',
        role: 'All-In Podcast, VC Craft Ventures',
        image: davids,
      },
    },
  ],
  [
    {
      content:
        "Huge fan of this.. We're using it for our product Dollie, to index our knowledge base and our site to provide first line of support for our customers and help them get started faster with our product using the embedded widget.",
      author: {
        name: 'Bowe Frankema',
        role: 'Founder Dollie',
        image: image3,
      },
    },
    {
      content:
        "We've had DocsBot on our docs site for the last couple of months and our users are definitely engaging with it. It's been a great tool for understanding what our users are interested in learning from our docs!",
      author: {
        name: 'Liza Mock',
        role: 'Manager Docs & Technical Writing @ Sentry.io',
        image: sentry,
      },
    },
    {
      content:
        'DocsBot is amazing! I want to thank you for your great work on this product. I have tried a few others, and nothing compares.',
      author: {
        name: 'Gareth P.',
        role: 'IT & Marketing Manager',
        image: image8,
      },
    },
    {
      content:
        'DocsBot has perfectly understood our needs in AI bot operations and is adding new features at an incredible speed. We are truly grateful for this wonderful partnership!',
      author: {
        name: 'Yukitoshi Aoyagi',
        role: 'GM, Customer Success @ WingArc1st Inc.',
        image: aoyagi,
      },
    },
    {
      content:
        "If all the level one support people, some chunk of them can now do level two support...the customers are going to get greater hands on care, more customers will get access to a higher level of service. The organization can afford to do that. They'll be more competitive in the marketplace because customers feel better taken care of.",
      author: {
        name: 'David Friedberg',
        role: 'All-In Podcast, Investor, Founder/CEO of TPB',
        image: davidf,
      },
    },
  ],
]

function QuoteIcon(props) {
  return (
    <svg aria-hidden="true" width={105} height={78} {...props}>
      <path d="M25.086 77.292c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622C1.054 58.534 0 53.411 0 47.686c0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C28.325 3.917 33.599 1.507 39.324 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Zm54.24 0c-4.821 0-9.115-1.205-12.882-3.616-3.767-2.561-6.78-6.102-9.04-10.622-2.11-4.52-3.164-9.643-3.164-15.368 0-5.273.904-10.396 2.712-15.368 1.959-4.972 4.746-9.567 8.362-13.786a59.042 59.042 0 0 1 12.43-11.3C82.565 3.917 87.839 1.507 93.564 0l11.074 13.786c-6.479 2.561-11.677 5.951-15.594 10.17-3.767 4.219-5.65 7.835-5.65 10.848 0 1.356.377 2.863 1.13 4.52.904 1.507 2.637 3.089 5.198 4.746 3.767 2.41 6.328 4.972 7.684 7.684 1.507 2.561 2.26 5.5 2.26 8.814 0 5.123-1.959 9.19-5.876 12.204-3.767 3.013-8.588 4.52-14.464 4.52Z" />
    </svg>
  )
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      aria-label="What our customers are saying"
      className="bg-slate-50 py-20 sm:py-32"
    >
      <Container>
        <div className="mx-auto max-w-2xl md:text-center">
          <h2 className="font-display text-3xl tracking-tight text-slate-900 sm:text-4xl">
            Don&apos;t just take our word for it!
          </h2>
          <p className="mt-4 text-lg tracking-tight text-slate-700">
            Here&apos;s what people have to say about DocsBot.
          </p>
        </div>
        <ul
          role="list"
          className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:gap-8 lg:mt-20 lg:max-w-none lg:grid-cols-3"
        >
          {testimonials.map((column, columnIndex) => (
            <li key={columnIndex}>
              <ul role="list" className="flex flex-col gap-y-6 sm:gap-y-8">
                {column.map((testimonial, testimonialIndex) => (
                  <li key={testimonialIndex}>
                    <figure className="relative rounded-2xl bg-white p-6 shadow-xl shadow-slate-900/10">
                      <QuoteIcon className="absolute left-6 top-6 fill-slate-100" />
                      <blockquote className="relative">
                        <p className="text-lg tracking-tight text-slate-900">
                          {testimonial.content}
                        </p>
                      </blockquote>
                      <figcaption className="relative mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <div className="font-display text-base text-slate-900">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="flex-shrink-0 overflow-hidden rounded-full bg-slate-50">
                          <Image
                            className="h-14 w-14 object-cover"
                            src={testimonial.author.image}
                            alt=""
                            width={56}
                            height={56}
                          />
                        </div>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
