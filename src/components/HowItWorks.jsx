import Image from 'next/image'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import {
  PlusCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
  PlayIcon,
} from '@heroicons/react/20/solid'
import React from 'react'
import { Container } from '@/components/Container'
import { HOW_IT_WORKS_FEATURES } from '@/data/howItWorks'

const featureIcons = [
  PlusCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  RocketLaunchIcon,
]

const features = HOW_IT_WORKS_FEATURES.map((feature, index) => ({
  ...feature,
  icon: featureIcons[index],
}))

function Feature({ feature, isActive, className, ...props }) {
  return (
    <div
      className={clsx(className, !isActive && 'opacity-75 hover:opacity-100')}
      {...props}
    >
      <div
        className={clsx(
          'w-9 rounded-lg',
          isActive ? 'bg-cyan-600' : 'bg-slate-500',
        )}
      >
        <feature.icon className="h-9 w-9 p-1.5 text-white" />
      </div>
      <h3
        className={clsx(
          'mt-6 font-mono text-sm/5 font-semibold uppercase tracking-widest',
          isActive ? 'text-cyan-400' : 'text-slate-400',
        )}
      >
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
          <Feature feature={feature} className="mx-auto max-w-2xl" isActive />
          <div className="relative mt-10 pb-10">
            <div className="absolute -inset-x-4 bottom-0 top-8 bg-slate-800 sm:-inset-x-6" />
            <div className="relative mx-auto w-[52.75rem] max-w-full overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-500/10">
              <div className="relative">
                <video
                  className="h-full w-full object-contain"
                  loop
                  muted
                  playsInline
                  poster={feature.poster}
                  key={feature.video}
                  preload="metadata"
                >
                  <source src={feature.video} type="video/mp4" />
                </video>
                <button
                  onClick={(e) => {
                    const video = e.target.closest('.relative').querySelector('video');
                    video.play();
                    e.target.closest('button').style.display = 'none';
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900/20 p-2 backdrop-blur-sm hover:bg-gray-900/30"
                >
                  <PlayIcon className="h-12 w-12 text-white" aria-hidden="true" />
                  <span className="sr-only">Play video</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function FeaturesDesktop() {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const videoRefs = React.useRef([])
  const [firstVideoButtonVisible, setFirstVideoButtonVisible] = React.useState(true)
  const isInitialMount = React.useRef(true)

  const playVideo = (index) => {
    const video = videoRefs.current[index]
    if (video?.paused) {
      video.play()
      if (index === 0) {
        setFirstVideoButtonVisible(false)
      }
    }
  }

  const handlePanelClick = (clickedIndex) => {
    setSelectedIndex(clickedIndex)
    if (clickedIndex === selectedIndex) {
      playVideo(clickedIndex)
    }
  }

  React.useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (selectedIndex !== 0) {
      playVideo(selectedIndex)
    }
  }, [selectedIndex])

  return (
    <Tab.Group
      as="div"
      className="hidden lg:mt-20 lg:block"
      selectedIndex={selectedIndex}
      onChange={setSelectedIndex}
    >
      <Tab.List className="grid grid-cols-4 gap-x-8">
        {features.map((feature, featureIndex) => (
          <Feature
            key={feature.name}
            feature={{
              ...feature,
              name: (
                <Tab className="uppercase focus:outline-none [&:not(:focus-visible)]:focus:outline-none">
                  <span className="absolute inset-0" />
                  {feature.name}
                </Tab>
              ),
            }}
            isActive={featureIndex === selectedIndex}
            className="relative"
          />
        ))}
      </Tab.List>
      <Tab.Panels className="relative mt-20 overflow-hidden rounded-4xl bg-slate-800 px-10 py-12 xl:px-12">
        <div className="-mx-5 flex">
          {features.map((feature, featureIndex) => (
            <Tab.Panel
              static
              key={feature.name}
              className={clsx(
                'cursor-pointer px-5 transition duration-500 ease-in-out [&:not(:focus-visible)]:focus:outline-none',
                featureIndex !== selectedIndex && 'opacity-60',
              )}
              style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
              aria-hidden={featureIndex !== selectedIndex}
              onClick={() => handlePanelClick(featureIndex)}
            >
              <div className="w-[52.75rem] max-w-full overflow-hidden rounded-xl bg-white shadow-lg shadow-slate-900/5 ring-1 ring-slate-500/10">
                <div className="relative">
                  <video
                    ref={el => videoRefs.current[featureIndex] = el}
                    className="h-full w-full object-contain"
                    loop
                    muted
                    playsInline
                    autoPlay={false}
                    poster={feature.poster}
                    key={feature.video}
                    preload="metadata"
                  >
                    <source src={feature.video} type="video/mp4" />
                  </video>
                  {featureIndex === 0 && firstVideoButtonVisible && (
                    <button
                      onClick={(e) => {
                        playVideo(0)
                      }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-900/20 p-6 backdrop-blur-sm hover:bg-gray-900/30"
                    >
                      <PlayIcon className="h-16 w-16 text-white" aria-hidden="true" />
                      <span className="sr-only">Play video</span>
                    </button>
                  )}
                </div>
              </div>
            </Tab.Panel>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 rounded-4xl ring-1 ring-inset ring-slate-900/10" />
      </Tab.Panels>
    </Tab.Group>
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
