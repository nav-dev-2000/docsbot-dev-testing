import Image from 'next/image'
import {
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  Cog6ToothIcon,
  LifebuoyIcon,
  ChatBubbleLeftEllipsisIcon,
  ShieldCheckIcon,
} from '@heroicons/react/20/solid'

const features = [
  {
    name: 'Embeddable Widgets',
    description:
      'We make it simple to add DocsBot to your website in minute with fully customizable widgets. Just add a script tag or WordPress plugin (coming soon) and you are ready to go.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Reply to Support Tickets',
    description:
      'Tired of writing the same responses to support tickets over and over again? Train your DocBot on your support history and docs so it can reply to new tickets automatically, saving you time and money! Enable our Help Scout integration or create your own.',
    icon: LifebuoyIcon,
  },
  {
    name: 'Question/Answer Bots',
    description:
      'Make your documentation interactive with our Q/A bot. Get detailed and direct answers about your product, including code examples and formatted output.',
    icon: ChatBubbleLeftEllipsisIcon,
  },
  {
    name: 'Internal Knowledge Bots',
    description:
      'Employees spend too much time just searching for what they need. DocsBot can help them find answers instantly by indexing your internal knowledge base and documentation.',
    icon: ShieldCheckIcon,
  },
  {
    name: 'Custom Copywriting',
    description:
      'Need help writing marketing copy and blog posts? With DocsBot, you can do that too. Use a customized ChatGPT that knows everything about your product, so it can help you generate high-quality content in no time.',
    icon: PencilSquareIcon,
  },
  {
    name: 'Powerful API',
    description:
      'Our API allows you to integrate AI chat into your own products. Provide answers to your users from your site, app, or WordPress plugin.',
    icon: Cog6ToothIcon,
  },
]

export default function FeaturedCenter({ screenshot }) {
  return (
    <div id="features" className="bg-gray-50 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 text-center lg:px-8">
        <div className="">
          <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
            ChatGPT-powered customer support
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Train and deploy custom chatbots in minutes!
          </p>
          <p className="mx-auto mt-5 max-w-7xl text-xl text-gray-500">
            Are you tired of answering the same questions over and over again? Do
            you wish you had a way to automate your customer support and give your
            team more time to focus on other tasks? With DocsBot, you can do just
            that. We make it simple to build ChatGPT-powered bots that are trained
            with your content and documentation, so they can provide instant answers
            to your customers' most detailed questions.
          </p>
        </div>
      </div>
      <div className="relative overflow-hidden pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <Image
            src={screenshot}
            alt="Application screenshot"
            className="mb-[-2%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
          />
          <div className="relative" aria-hidden="true">
            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-gray-50 pt-[7%]" />
          </div>
        </div>
      </div>
      <div className="mx-auto mt-16 max-w-7xl px-6 sm:mt-20 md:mt-24 lg:px-8">
        <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
          {features.map((feature) => (
            <div key={feature.name} className="relative pl-9">
              <dt className="inline font-semibold text-gray-900">
                <feature.icon
                  className="absolute left-1 top-1 h-5 w-5 text-cyan-600"
                  aria-hidden="true"
                />
                {feature.name}
              </dt>{' '}
              <dd className="inline">{feature.description}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
} 