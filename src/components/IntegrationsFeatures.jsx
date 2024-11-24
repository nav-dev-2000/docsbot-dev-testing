import {
  useRef,
  useCallback,
  useLayoutEffect,
  useState,
  useEffect,
} from 'react'
import Link from 'next/link'
import SocialFaces from '@/components/SocialFaces'
import {
  motion,
  useScroll,
  useSpring,
  useMotionValueEvent,
} from 'framer-motion'
import useMeasure from 'react-use-measure'
import { clsx } from 'clsx'
import { sourceTypes } from '@/constants/sourceTypes.constants'

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

function FeatureCard({
  name,
  description,
  icon: Icon,
  bounds,
  scrollX,
  onClick,
  ...props
}) {
  const ref = useRef(null)

  const computeOpacity = useCallback(() => {
    const element = ref.current
    if (!element || bounds.width === 0) return 1

    const rect = element.getBoundingClientRect()

    if (rect.left < bounds.left) {
      const diff = bounds.left - rect.left
      const percent = diff / rect.width
      return Math.max(0.5, 1 - percent)
    } else if (rect.right > bounds.right) {
      const diff = rect.right - bounds.right
      const percent = diff / rect.width
      return Math.max(0.5, 1 - percent)
    } else {
      return 1
    }
  }, [ref, bounds.width, bounds.left, bounds.right])

  const opacity = useSpring(computeOpacity(), {
    stiffness: 154,
    damping: 23,
  })

  useIsomorphicLayoutEffect(() => {
    opacity.set(computeOpacity())
  }, [computeOpacity, opacity])

  useMotionValueEvent(scrollX, 'change', () => {
    opacity.set(computeOpacity())
  })

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      onClick={onClick}
      {...props}
      className="w-48 shrink-0 cursor-pointer snap-start scroll-ml-[var(--scroll-padding)] pt-6 sm:w-64"
    >
      <div className="relative flow-root h-64 rounded-lg bg-gray-50 px-6 pb-8 pt-12">
        <div className="absolute -top-6 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-500 to-cyan-600 p-3 shadow-lg">
            <Icon className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
        </div>
        <div>
          <h3 className="text-center text-xl font-medium tracking-tight text-gray-900">
            {name}
          </h3>
          <p className="mt-3 text-left text-base text-gray-500">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function IntegrationsFeatures() {
  const scrollRef = useRef(null)
  const { scrollX } = useScroll({ container: scrollRef })
  const [setReferenceWindowRef, bounds] = useMeasure()
  const [activeIndex, setActiveIndex] = useState(0)

  const integrations = sourceTypes
    .filter((type) => !type.coming)
    .map((type) => ({
      name: type.title,
      description: type.description,
      icon: type.icon,
    }))

  useMotionValueEvent(scrollX, 'change', (x) => {
    if (!scrollRef.current) return
    const gap = 32 // matches gap-8 in the className
    const width = scrollRef.current.children[0].clientWidth
    setActiveIndex(Math.round(x / (width + gap)))
  })

  function scrollTo(index) {
    if (!scrollRef.current) return
    const gap = 32 // matches gap-8 in the className
    const width = scrollRef.current.children[0].offsetWidth
    scrollRef.current.scrollTo({
      left: (width + gap) * index,
      behavior: 'smooth',
    })
  }

  return (
    <div className="relative bg-white py-24 sm:py-32">
      <div
        ref={setReferenceWindowRef}
        className="mx-auto max-w-md px-6 text-center sm:max-w-3xl lg:max-w-7xl lg:px-8"
      >
        <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
          Effortless Chatbot Training
        </h2>
        <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Teach your AI{' '}
          <span className="relative whitespace-nowrap text-cyan-700">
            <svg
              aria-hidden="true"
              viewBox="0 0 418 42"
              className="absolute left-0 top-2/3 h-[0.58em] w-full fill-gray-900/50"
              preserveAspectRatio="none"
            >
              <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z"></path>
            </svg>
            <span className="relative">Anything</span>
          </span>{' '}
          with {integrations.length + 9}+ Content Sources
        </p>
        <p className="mx-auto mt-5 max-w-7xl text-xl text-gray-500">
          Our intuitive interface makes it easy to index your documentation,
          websites, knowledge bases, cloud storage, YouTube videos, support
          tickets, or any other content with just a few clicks. Schedule
          automatic updates to keep your assistant up to date.
        </p>
      </div>

      <div
        ref={scrollRef}
        className={clsx([
          'mt-16 flex gap-8 px-[var(--scroll-padding)]',
          'min-h-[22rem] sm:min-h-[18rem] overflow-visible',
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-smooth',
          '[--scroll-padding:max(theme(spacing.6),calc((100vw-theme(maxWidth.2xl))/2))] lg:[--scroll-padding:max(theme(spacing.8),calc((100vw-theme(maxWidth.7xl))/2))]',
        ])}
      >
        {integrations.map((feature, index) => (
          <FeatureCard
            key={feature.name}
            {...feature}
            bounds={bounds}
            scrollX={scrollX}
            onClick={() => scrollTo(index)}
          />
        ))}
        <div className="w-[42rem] shrink-0 sm:w-[54rem]" />
      </div>

      <div className="mt-0 sm:mt-8 hidden justify-center gap-2 md:flex">
        {integrations.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={clsx(
              'h-2.5 w-2.5 rounded-full transition',
              activeIndex === index
                ? 'bg-gray-900'
                : 'bg-gray-300 hover:bg-gray-400',
            )}
            aria-label={`Scroll to integration ${index + 1}`}
          />
        ))}
      </div>

      {/* New CTA section */}
      <div className="mt-8 md:mt-12 flex flex-col items-center">
        <div className="flex gap-4">
          <Link
            href="/register"
            className="bg-animation rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
          >
            Train Your Free Chatbot
          </Link>
        </div>
      </div>
    </div>
  )
}
