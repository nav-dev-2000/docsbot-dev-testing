import Image from 'next/future/image'
import { Container } from '@/components/Container'
import image1 from '@/images/avatars/testimony1.jpeg'
import image2 from '@/images/avatars/avatar-default.jpg'
import image3 from '@/images/avatars/testimony3.jpeg'
import image4 from '@/images/avatars/testimony4.jpeg'
import image5 from '@/images/avatars/testimony5.jpeg'
import image6 from '@/images/avatars/testimony6.png'

const testimonials = [
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
        'DocsBot is amazing! I want to thank you for your great work on this product. I have tried a few others, and nothing compares.',
      author: {
        name: 'Gareth P.',
        role: 'IT & Marketing Manager',
        image: image2,
      },
    },
  ],
  [
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
        'While there seem to be a ton of these types of "bots" getting launched all the time, few of them are so well designed from a UI and a usability perspective. The ability to train the bot on your own content library in really intuitive ways sets DocsBot apart. Love it!',
      author: {
        name: 'Matt Cromwell',
        role: 'Customer Experience at StellarWP',
        image: image4,
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

export function Testimonials({ teamCount }) {
  return (
    <section id="testimonials" aria-label="What our customers are saying" className="p-12 hidden lg:block my-auto">
      <div className="mx-auto max-w-2xl text-white md:text-center">
        <h2 className="font-display text-xl tracking-tight sm:text-3xl">
          Join <span className="font-medium text-teal-100">{teamCount}+</span> other happy DocsBot users!
        </h2>
      </div>
      <Container>
        <ul
          role="list"
          className="mx-auto mt-12 grid grid-cols-1 gap-6 xl:mt-14 xl:max-w-none xl:grid-cols-2"
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
                      <figcaption className="relative mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                        <div>
                          <div className="font-display text-base text-slate-900">
                            {testimonial.author.name}
                          </div>
                          <div className="mt-1 text-sm text-slate-500">
                            {testimonial.author.role}
                          </div>
                        </div>
                        <div className="overflow-hidden rounded-full bg-slate-50">
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
