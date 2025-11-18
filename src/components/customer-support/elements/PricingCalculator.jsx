import clsx from "clsx"
import { useState, useCallback, useId } from "react"
import { SliderField } from "./index"

const Title = ({ tag = 'h3', className, children }) => {
    const Component = tag

    return (
        <Component
            className={clsx(
                'text-gray-900 text-primary text-3xl sm:text-4xl/tight font-bold tracking-tight',
                className,
            )}
        >
            {children}
        </Component>
    )
}

const TitleHighlight = ({ children }) => {
    return (
        <span className="text-cyan-600">
            { children }
        </span>
    )
}

export const PricingCalculator = ({ className, ...props }) => {
    const [supportTickets, setSupportTickets] = useState(1000)
    const [timePerTicket, setTimePerTicket] = useState(10)
    const [hourlyRate, setHourlyRate] = useState(18)
    const closeRate = 0.75
    
    const planName = supportTickets < 500 ? 'Personal' : supportTickets < 15000 ? 'Standard' : 'Business'
    const planCost = supportTickets < 500 ? 41 : supportTickets < 15000 ? 124 : 416
    const timeSavings = Math.round(
        (supportTickets * closeRate * timePerTicket) / 60,
    )
    const costSavings = Math.round(timeSavings * hourlyRate - planCost)
    
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
        <div
            className={clsx(
                'w-full max-w-5xl mx-auto px-6 lg:px-8 py-10 rounded-xl ring-1 ring-slate-900/10 bg-white shadow-xl',
                className,
            )}
            { ...props }
        >
            <div className="w-full max-w-2xl mx-auto sm:text-center">
                <Title>
                    You can save{' '}
                    {costSavings > 0 && (
                        <>
                            <TitleHighlight>${costSavings.toLocaleString()}</TitleHighlight>
                            {' '}and{' '}
                        </>
                    )}
                    <TitleHighlight>{timeSavings.toLocaleString()} hours</TitleHighlight>
                    {costSavings > 0 && (
                        <>{' '}every month!</>
                    )}
                </Title>

                <p className="mt-4 text-gray-900/80 text-base/6">
                    Calculated based on the <strong>{planName} Plan ($<span>{planCost}</span>/mo)</strong> and our average customer AI agent deflection rate of 75%.
                </p>
            </div>

            <div className="flex flex-col gap-8 mt-12">
                <SliderField
                    defaultValue={logPosition(supportTickets)}
                    label="Support Tickets / Messages"
                    helper={{
                        value: supportTickets,
                        label: 'per month',
                    }}
                    min="0"
                    max="100"
                    onChange={(e) => {
                        setSupportTickets(logScale(Number(e.target.value)))
                    }}
                />

                <SliderField
                    defaultValue={timePerTicket}
                    label="Time Per Ticket"
                    helper={{
                        value: timePerTicket,
                        label: 'minutes',
                    }}
                    min="5"
                    max="60"
                    onChange={handleTimePerTicketChange}
                />

                <SliderField
                    defaultValue={hourlyRate}
                    label="Hourly Rate"
                    helper={{
                        value: `$${hourlyRate}`,
                        label: 'per hour',
                    }}
                    min="7"
                    max="50"
                    onChange={handleHourlyRateChange}
                />
            </div>
        </div>
    )
}
