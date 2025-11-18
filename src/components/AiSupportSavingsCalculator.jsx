import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'

// Add this new component for reusability
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
          className="mr-[0.25em] inline-block"
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
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

export const AiSupportSavingsCalculator = ({ 
  title = "AI Customer Support",
  subtitle = "Humans are expensive and hard to scale!",
  description = "AI agents can handle Tier 1 support inquiries instantly, 24/7, at a fraction of the cost of human agents. They can also assist your support team by providing instant access to knowledge, drafting responses, and handling repetitive queries - allowing your agents to focus on complex issues that truly need a human touch.",
  content = null
}) => {
  const [supportTickets, setSupportTickets] = useState(1000)
  const [timePerTicket, setTimePerTicket] = useState(10)
  const [hourlyRate, setHourlyRate] = useState(18)
  const closeRate = 0.75

  const planName =
    supportTickets < 500 ? 'Personal' : supportTickets < 15000 ? 'Standard' : 'Business'
  const planCost = supportTickets < 500 ? 41 : supportTickets < 15000 ? 124 : 416
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
    <div className="bg-gray-50 px-6 py-16 text-center lg:px-8 lg:py-24">
      <div className="mx-auto max-w-7xl pb-0">
        <div className="mx-auto max-w-6xl text-center">
          <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-600">
            {title}
          </h2>
          <TypewriterText
            text={subtitle}
            delay={0.2}
          />
          <p className="mb-12 mt-6 text-lg text-gray-500 sm:text-xl/8">
            {description}
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
              /mo) and our average customer AI agent deflection rate of 75%.
            </p>
          </div>
          <div className="mt-12 flex items-center gap-x-6">
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs sm:w-28 md:text-base">
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
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs sm:w-28 md:text-base">
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
            <div className="text-muted-foreground w-20 flex-shrink-0 text-xs sm:w-28 md:text-base">
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
        
        {/* Custom content section */}
        {content && (
          <div className="mt-12">
            {content}
          </div>
        )}
      </div>
    </div>
  )
}

export default AiSupportSavingsCalculator 