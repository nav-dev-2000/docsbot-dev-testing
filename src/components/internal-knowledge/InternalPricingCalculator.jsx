import clsx from "clsx"
import { useState, useCallback } from "react"
import { SliderField } from "@/components/elements"

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

export const InternalPricingCalculator = ({ className, ...props }) => {
    const [employees, setEmployees] = useState(100)
    const [hoursLost, setHoursLost] = useState(3) // Hours lost per week per employee
    const [hourlyRate, setHourlyRate] = useState(40)
    
    // Assumptions:
    // 50% reduction in search time with AI
    // 4.3 weeks per month
    const timeReduction = 0.50 
    const weeksPerMonth = 4.3
    
    const totalHoursLost = employees * hoursLost * weeksPerMonth
    const timeSavings = Math.round(totalHoursLost * timeReduction)
    const costSavings = Math.round(timeSavings * hourlyRate)
    
    const handleHoursLostChange = useCallback((e) => {
        setHoursLost(e.target.value)
    }, [])
    
    const handleHourlyRateChange = useCallback((e) => {
        setHourlyRate(e.target.value)
    }, [])
    
    const minEmployees = 10
    const maxEmployees = 5000

    const logScale = (position) => {
        const minp = 0
        const maxp = 100
        const minv = Math.log(minEmployees)
        const maxv = Math.log(maxEmployees)
        const scale = (maxv - minv) / (maxp - minp)

        return Math.round(Math.exp(minv + scale * (position - minp)))
    }
    
    const logPosition = (value) => {
        const minp = 0
        const maxp = 100
        const minv = Math.log(minEmployees)
        const maxv = Math.log(maxEmployees)
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
                    Save up to{' '}
                    <TitleHighlight>${costSavings.toLocaleString()}</TitleHighlight>
                    {' '}and{' '}
                    <TitleHighlight>{timeSavings.toLocaleString()} hours</TitleHighlight>
                    {' '}per month!
                </Title>

                <p className="mt-4 text-gray-900/80 text-base/6">
                    Estimating a 50% reduction in time spent searching for internal information and answering repetitive questions.
                </p>
            </div>

            <div className="flex flex-col gap-8 mt-12">
                <SliderField
                    defaultValue={logPosition(employees)}
                    label="Number of Employees"
                    helper={{
                        value: employees,
                        label: 'employees',
                    }}
                    min="0"
                    max="100"
                    onChange={(e) => {
                        setEmployees(logScale(Number(e.target.value)))
                    }}
                />

                <SliderField
                    defaultValue={hoursLost}
                    label="Hours Searching / Answering Questions"
                    helper={{
                        value: hoursLost,
                        label: 'hours / week / employee',
                    }}
                    min="1"
                    max="20"
                    onChange={handleHoursLostChange}
                />

                <SliderField
                    defaultValue={hourlyRate}
                    label="Avg. Hourly Cost"
                    helper={{
                        value: `$${hourlyRate}`,
                        label: 'per hour',
                    }}
                    min="15"
                    max="200"
                    onChange={handleHourlyRateChange}
                />
            </div>
        </div>
    )
}
