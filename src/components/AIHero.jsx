import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function AIHero() {
  return (
    <div className="relative bg-gray-900">
      <div className="relative h-80 overflow-hidden bg-cyan-800 md:absolute md:left-0 md:h-full md:w-1/3 lg:w-1/2">
        <Image
          alt=""
          src="https://images.unsplash.com/photo-1525130413817-d45c1d127c42?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1057&q=60&blend=0e7490&sat=-100&blend-mode=multiply"
          className="size-full object-cover"
          width={1057}
          height={760}
        />
        <svg
          viewBox="0 0 926 676"
          aria-hidden="true"
          className="absolute -bottom-24 left-24 w-[57.875rem] transform-gpu blur-[118px]"
        >
          <path
            d="m254.325 516.708-90.89 158.331L0 436.427l254.325 80.281 163.691-285.15c1.048 131.759 36.144 345.144 168.149 144.613C751.171 125.508 707.17-93.823 826.603 41.15c95.546 107.978 104.766 294.048 97.432 373.585L685.481 297.694l16.974 360.474-448.13-141.46Z"
            fill="url(#60c3c621-93e0-4a09-a0e6-4c228a0116d8)"
            fillOpacity=".4"
          />
          <defs>
            <linearGradient
              id="60c3c621-93e0-4a09-a0e6-4c228a0116d8"
              x1="926.392"
              x2="-109.635"
              y1=".176"
              y2="321.024"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#06B6D4" />
              <stop offset={1} stopColor="#0891B2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="relative mx-auto max-w-7xl py-24 sm:py-32 lg:px-8 lg:py-40">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="pl-6 pr-6 md:ml-auto md:w-2/3 md:pl-16 lg:w-1/2 lg:pl-24 lg:pr-0 xl:pl-32"
        >
          <p className="font-mono text-base/7 font-semibold uppercase text-cyan-400">
            Stay Relevant in the Age of AI
          </p>
          <h2 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Be the AI Hero On Your Team
          </h2>
          <p className="mt-6 text-base/7 text-gray-300">
            DocsBot makes it easy for anyone to harness the power of
            ChatGPT-powered chatbots to enhance customer and employee
            experiences while boosting your company's bottom line.
          </p>
          <div className="mt-8">
            <Link
              href="/register"
              className="inline-flex rounded-md bg-white/10 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Become an AI Hero
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 