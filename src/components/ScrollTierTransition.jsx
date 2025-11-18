import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useInView, useSpring } from 'framer-motion';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import AnimatedTimeline from '@/components/AnimatedTimeline';

const supportTimelineIcons = [
  [
    {
      label: "Zendesk",
      src: "/images/logo-timeline/zendesk.svg",
      className: "[animation-delay:-26s] [animation-duration:30s]"
    },
    {
      label: "Freshdesk",
      src: "/images/logo-timeline/freshdesk.webp",
      className: "[animation-delay:-8s] [animation-duration:30s]"
    },
    {
      label: "Zoho Desk",
      src: "/images/logo-timeline/zoho_desk.svg",
      className: "[animation-delay:-16s] [animation-duration:30s]"
    }
  ],
  [
    {
      label: "Help Scout",
      src: "/images/logo-timeline/helpscout.svg",
      className: "[animation-delay:-49s] [animation-duration:55s]"
    },
    {
      label: "Intercom",
      src: "/images/logo-timeline/intercom.svg",
      className: "[animation-delay:-5s] [animation-duration:55s]"
    },
    {
      label: "Salesforce",
      src: "/images/logo-timeline/salesforce.svg",
      className: "[animation-delay:-28s] [animation-duration:55s]"
    }
  ],
  [
    {
      label: "HubSpot",
      src: "/images/logo-timeline/hubspot.svg",
      className: "[animation-delay:-10s] [animation-duration:40s]"
    },
    {
      label: "Slack",
      src: "/images/logo-timeline/slack.svg",
      className: "[animation-delay:-32s] [animation-duration:40s]"
    }
  ],
  [
    {
      label: "Microsoft Teams",
      src: "/images/logo-timeline/microsoft-teams.svg",
      className: "[animation-delay:-35s] [animation-duration:45s]"
    },
    {
      label: "Discord",
      src: "/images/logo-timeline/discord.svg",
      className: "[animation-delay:-23s] [animation-duration:45s]"
    }
  ]
];

// Animated Bento Box Component
const AnimatedBentoBox = ({ children, delay = 0, className = "" }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Tier One Component with Bento Layout
const TierOne = () => {
  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-50px" }}
            className="text-right text-base/7 font-semibold text-cyan-600"
          >
            Tier 1 Support
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, margin: "-50px" }}
            className="ml-auto mt-2 max-w-lg text-balance text-right text-3xl font-semibold tracking-tight text-gray-900 sm:text-4xl mb-8"
          >
            Fully Automated Customer Support
          </motion.p>
          <div className="grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
            <AnimatedBentoBox delay={0.2} className="relative lg:row-span-2">
              <div className="absolute inset-px rounded-lg bg-gray-50 lg:rounded-l-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] lg:rounded-l-[calc(2rem+1px)]">
                <div className="px-6 pb-2 pt-6 sm:px-8 sm:pb-0 sm:pt-8">
                  <p className="mt-1 text-base font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Fully Automated. Always Improving.
                  </p>
                  <p className="mt-2 max-w-lg text-xs/5 text-gray-600 max-lg:text-center">
                    DocsBot automates the repetitive tickets that slow your team down. But it's not static—it learns from your Tier 2 agents, continuously improving based on how your team handles complex cases.
                  </p>
                </div>
                <div className="relative min-h-[20rem] w-full grow [container-type:inline-size] max-lg:mx-auto max-lg:max-w-sm">
                  <div className="absolute inset-x-10 bottom-0 top-10 overflow-hidden rounded-t-[12cqw] border-x-[3cqw] border-t-[3cqw] border-gray-300 bg-white shadow-2xl">
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      src="/video/test.mp4"
                      className="size-full object-cover object-top"
                    />
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-black/10 lg:rounded-l-[2rem]" />
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.3} className="relative max-lg:row-start-1">
              <div className="absolute inset-px rounded-lg bg-gray-50 max-lg:rounded-t-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                  <p className="mt-1 text-base font-medium tracking-tight text-gray-950 max-lg:text-center">Deflect up to 80% of FAQs</p>
                  <p className="mt-2 max-w-lg text-xs/5 text-gray-600 max-lg:text-center">
                    Automatically handle common tickets and frequently asked questions, reducing workload on your team.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center px-8 max-lg:pb-12 max-lg:pt-10 sm:px-10 lg:pb-2">
                  <img
                    alt=""
                    src="https://tailwindcss.com/plus-assets/img/component-images/bento-03-performance.png"
                    className="w-full max-lg:max-w-xs"
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-black/10 max-lg:rounded-t-[2rem]" />
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.5} className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div className="absolute inset-px rounded-lg bg-gray-50" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)]">
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                  <p className="mt-1 text-base font-medium tracking-tight text-gray-950 max-lg:text-center">Instant, On-Brand Answers</p>
                  <p className="mt-2 max-w-lg text-xs/5 text-gray-600 max-lg:text-center">
                    Deliver consistent, branded responses across all channels and in any language your customers speak.
                  </p>
                </div>
                <div className="flex flex-1 items-center [container-type:inline-size] max-lg:py-6 lg:pb-2">
                  <img
                    alt=""
                    src="https://tailwindcss.com/plus-assets/img/component-images/bento-03-security.png"
                    className="h-[min(152px,40cqw)] object-cover"
                  />
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-black/10" />
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.4} className="relative lg:row-span-2">
              <div className="absolute inset-px rounded-lg bg-gray-50 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]" />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(theme(borderRadius.lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]">
                <div className="px-6 pb-2 pt-6 sm:px-8 sm:pb-0 sm:pt-8">
                  <p className="mt-1 text-base font-medium tracking-tight text-gray-950 max-lg:text-center">
                    Seamless Human Handoff
                  </p>
                  <p className="mt-2 max-w-lg text-xs/5 text-gray-600 max-lg:text-center">
                    When AI can't handle a complex issue, smoothly escalate to human agents with full context and no dead ends.
                  </p>
                </div>
                <div className="relative min-h-[20rem] w-full grow">
                  <div className="absolute bottom-0 left-10 right-0 top-10 overflow-hidden rounded-tl-xl bg-gray-900 shadow-2xl outline outline-white/10">
                    <div className="flex bg-gray-900 outline outline-white/5">
                      <div className="-mb-px flex text-sm/6 font-medium text-gray-400">
                        <div className="border-b border-r border-b-white/20 border-r-white/10 bg-white/5 px-4 py-2 text-white">
                          NotificationSetting.jsx
                        </div>
                        <div className="border-r border-gray-600/10 px-4 py-2">App.jsx</div>
                      </div>
                    </div>
                    <div className="px-6 pb-14 pt-6">{/* Your code example */}</div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute inset-px rounded-lg shadow outline outline-black/10 max-lg:rounded-b-[2rem] lg:rounded-r-[2rem]" />
            </AnimatedBentoBox>
          </div>
        </div>
      </div>
    </section>
  );
};

// Parallax Connector Component
const ParallaxConnector = () => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative" style={{ height: '300px' }}>
      <motion.div 
        style={{ y, opacity }}
        className="absolute inset-0 flex flex-col items-center justify-center"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center"
        >
          <ChevronDownIcon className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-sm font-medium text-gray-500 tracking-wide uppercase">
            Escalating to Tier 2 Support
          </p>
          <ChevronDownIcon className="h-6 w-6 text-gray-300 mt-2" />
        </motion.div>
      </motion.div>
    </section>
  );
};

// Tier Two Component with Bento Layout
const TierTwo = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.section 
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="py-12 sm:py-16"
    >
      <div className="mx-auto max-w-2xl px-6 lg:max-w-7xl lg:px-8">
        <div className="mt-12">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-left text-base/7 font-semibold text-cyan-400"
          >
            Tier 2 Support
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mr-auto mt-2 max-w-lg text-balance text-left text-3xl font-semibold tracking-tight text-white sm:text-4xl mb-8"
          >
            AI-Supercharged Human Agents
          </motion.p>
          <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-16 lg:grid-cols-6 lg:grid-rows-2">
            <AnimatedBentoBox delay={0.4} className="flex p-px lg:col-span-4">
              <div className="w-full overflow-hidden rounded-lg bg-gray-800 outline outline-white/15 max-lg:rounded-t-[2rem] lg:rounded-tl-[2rem]">
                <div className="h-80">
                  <AnimatedTimeline variant="bento" alwaysAnimated={true} icons={supportTimelineIcons} />
                </div>
                <div className="p-10">
                  <h3 className="text-sm/4 font-semibold text-cyan-400">Humans, Supercharged by AI</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-white">Real-time assistant for your Tier 2 team</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-400">
                    DocsBot becomes a real-time assistant for your Tier 2 team—surfacing accurate, contextual suggestions to help agents respond faster and with full confidence.
                  </p>
                </div>
              </div>
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.5} className="flex p-px lg:col-span-2">
              <div className="w-full overflow-hidden rounded-lg bg-gray-800 outline outline-white/15 lg:rounded-tr-[2rem]">
                <img
                  alt="DocsBot Logo"
                  src="/branding/docsbot-logo-white.svg"
                  className="h-80 object-cover"
                />
                <div className="p-10">
                  <h3 className="text-sm/4 font-semibold text-cyan-400">Smart Reply Suggestions</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-white">Faster, more accurate responses</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-400">
                    Suggests replies based on docs, past tickets, and customer intent to help agents respond faster and more accurately.
                  </p>
                </div>
              </div>
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.6} className="flex p-px lg:col-span-2">
              <div className="w-full overflow-hidden rounded-lg bg-gray-800 outline outline-white/15 lg:rounded-bl-[2rem]">
                <img
                  alt=""
                  src="https://tailwindcss.com/plus-assets/img/component-images/bento-03-security.png"
                  className="h-80 object-cover"
                />
                <div className="p-10">
                  <h3 className="text-sm/4 font-semibold text-cyan-400">Lives in Your Tools</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-white">No new interfaces to learn</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-400">
                    Works inside the tools your team already uses: Zendesk, Slack, HelpScout, Freshdesk—no new interfaces to learn.
                  </p>
                </div>
              </div>
            </AnimatedBentoBox>
            
            <AnimatedBentoBox delay={0.7} className="flex p-px lg:col-span-4">
              <div className="w-full overflow-hidden rounded-lg bg-gray-800 outline outline-white/15 max-lg:rounded-b-[2rem] lg:rounded-br-[2rem]">
                <img
                  alt=""
                  src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-02-performance.png"
                  className="h-80 object-cover object-left"
                />
                <div className="p-10">
                  <h3 className="text-sm/4 font-semibold text-cyan-400">Continuous Learning</h3>
                  <p className="mt-2 text-lg font-medium tracking-tight text-white">Virtuous cycle of improvement</p>
                  <p className="mt-2 max-w-lg text-sm/6 text-gray-400">
                    Captures feedback and trends to improve Tier 1 automation, creating a virtuous cycle of improvement.
                  </p>
                </div>
              </div>
            </AnimatedBentoBox>
          </div>
        </div>
      </div>
    </motion.section>
  );
};

// Elastic Scroll Background Wrapper Component
const ScrollBackgroundWrapper = ({ children }) => {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Create elastic spring motion that lags behind scroll position
  // Like dragging a heavy metal ball with an elastic band
  const springProgress = useSpring(scrollYProgress, {
    damping: 30,
    stiffness: 80,
    mass: 1.4, // Heavy ball effect
  });

  // GPU-optimized background color interpolation using individual RGB components
  // From white rgb(255, 255, 255) to dark blue-black rgb(12, 12, 29)
  const r = useTransform(springProgress, [0, 0.3, 0.7, 1], [255, 255, 12, 12]);
  const g = useTransform(springProgress, [0, 0.3, 0.7, 1], [255, 255, 12, 12]);
  const b = useTransform(springProgress, [0, 0.3, 0.7, 1], [255, 255, 29, 29]);

  // Combine RGB values into a color string
  const backgroundColor = useTransform([r, g, b], ([rVal, gVal, bVal]) => {
    return `rgb(${Math.round(rVal)}, ${Math.round(gVal)}, ${Math.round(bVal)})`;
  });

  return (
    <motion.div 
      ref={containerRef}
      style={{ 
        backgroundColor,
        minHeight: '100vh',
        transition: 'none' // No CSS transition needed - GPU handles this
      }}
      className="relative"
    >
      {children}
    </motion.div>
  );
};

// Main Component using the ScrollBackgroundWrapper
const ScrollTierTransition = () => {
  return (
    <ScrollBackgroundWrapper>
      <TierOne />
      <ParallaxConnector />
      <TierTwo />
    </ScrollBackgroundWrapper>
  );
};

export default ScrollTierTransition; 