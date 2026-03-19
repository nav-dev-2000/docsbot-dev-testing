import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import {
    XMarkIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
} from '@heroicons/react/24/outline'
import * as cookie from 'cookie'
import Tooltip from '@/components/Tooltip'

const DEBUG_WIZARD_STORAGE_KEY = 'docsbot-debug-wizard'

const isDebugWizardEnabled = () => {
    if (typeof window === 'undefined') return false
    try {
        return window.localStorage.getItem(DEBUG_WIZARD_STORAGE_KEY) === 'true'
    } catch (error) {
        console.error('Failed to read debug wizard preference:', error)
        return false
    }
}

const disableDebugWizard = () => {
    if (typeof window === 'undefined') return
    try {
        window.localStorage.setItem(DEBUG_WIZARD_STORAGE_KEY, 'false')
    } catch (error) {
        console.error('Failed to disable debug wizard preference:', error)
    }
}

// Utility functions for managing wizard preferences cookie
const getWizardPreferences = () => {
    if (typeof window === 'undefined') return {}
    try {
        const cookies = cookie.parse(document.cookie || '')
        const prefsValue = cookies['docsbot-prefs']
        if (!prefsValue) return {}

        const decoded = decodeURIComponent(prefsValue)
        const parsed = JSON.parse(decoded)
        return parsed
    } catch (error) {
        console.error('Failed to parse wizard preferences cookie:', error)
        return {}
    }
}

const setWizardPreference = (key, value) => {
    if (typeof window === 'undefined') return
    try {
        const prefs = getWizardPreferences()
        prefs[key] = value
        const expires = new Date()
        expires.setDate(expires.getDate() + 365)
        document.cookie = cookie.serialize(
            'docsbot-prefs',
            JSON.stringify(prefs),
            {
                expires,
                path: '/',
                sameSite: 'lax',
            },
        )
    } catch (error) {
        console.error('Failed to set wizard preference:', error)
    }
}

const isWizardCompleted = () => {
    const prefs = getWizardPreferences()
    return prefs['wizard-completed'] === true
}

const isNewUser = () => {
    if (typeof window === 'undefined') return false

    const prefs = getWizardPreferences()

    // If wizard-step exists and wizard-completed is false, it's a new user
    // This means they were set up during signup but haven't completed the wizard
    if (
        prefs['wizard-step'] !== undefined &&
        prefs['wizard-completed'] === false
    ) {
        return true
    }

    return false
}

const setWizardCompleted = () => {
    setWizardPreference('wizard-completed', true)
}

const getCurrentWizardStep = () => {
    const prefs = getWizardPreferences()
    return prefs['wizard-step'] || 0
}

const setCurrentWizardStep = (step) => {
    setWizardPreference('wizard-step', step)
}

/** Prefer a visible instance when the same selector exists in mobile + desktop markup. */
const queryWizardTarget = (selector) => {
    if (!selector || typeof document === 'undefined') return null
    const nodes = document.querySelectorAll(selector)
    for (const el of nodes) {
        const rect = el.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
            return el
        }
    }
    return nodes[0] ?? null
}

// Wizard steps configuration
const WIZARD_STEPS = [
    {
        id: 'welcome',
        title: 'Welcome to DocsBot!',
        description:
            "Let's take a quick tour of the bot dashboard to help you get started.",
        target: null,
        position: 'center',
    },
    {
        id: 'chat',
        title: 'Chat with your bot',
        description: 'Test responses and see which sources your bot uses.',
        target: '[data-wizard="chat"]',
        position: 'right',
    },
    {
        id: 'research',
        title: 'Research',
        description:
            'Run multi-step research tasks that gather and synthesize information across your docs.',
        target: '[data-wizard="research"]',
        position: 'right',
    },
    {
        id: 'leads',
        title: 'Leads',
        description:
            'Collect user details in your widget and trigger webhook or Zapier notifications.',
        target: '[data-wizard="leads"]',
        position: 'right',
    },
    {
        id: 'analytics-conversations',
        title: 'Conversations',
        description:
            'View full chat history with your users to understand how they interact with your bot.',
        target: '[data-wizard="analytics-conversations"]',
        position: 'bottom',
    },
    {
        id: 'analytics-questions',
        title: 'Question logs',
        description:
            'Debug and fine-tune bot answers by reviewing individual questions and their sources.',
        target: '[data-wizard="analytics-questions"]',
        position: 'bottom',
    },
    {
        id: 'analytics-reports',
        title: 'Reports',
        description:
            'See topic analysis and identify gaps in your documentation with automated insights.',
        target: '[data-wizard="analytics-reports"]',
        position: 'bottom',
    },
    {
        id: 'configure',
        title: 'Configure',
        description:
            'Manage bot settings, manage sources, search your knowledge, glossary, and sample questions.',
        target: '[data-wizard="configure"]',
        position: 'right',
    },
    {
        id: 'configure-sources',
        title: 'Train your sources',
        description:
            'Add and manage your knowledge sources here. Upload docs, connect URLs, or integrate with external tools.',
        target: '[data-wizard="configure-sources"]',
        position: 'bottom',
    },
    {
        id: 'widget',
        title: 'Widget',
        description:
            'Customize the appearance and behavior of your chat widget.',
        target: '[data-wizard="widget"]',
        position: 'right',
    },
    {
        id: 'deploy',
        title: 'Deploy',
        description:
            'Embed widgets, share links, connect Slack, automations, Help Scout, MCP, GPT actions, webhooks, and APIs.',
        target: '[data-wizard="deploy"]',
        position: 'right',
    },
    {
        id: 'bot-switcher',
        title: 'Switch bots quickly',
        description: 'Search and switch between available bots from here.',
        target: '[data-wizard="bot-switcher"]',
        position: 'bottom',
    },
    {
        id: 'complete',
        title: "You're All Set!",
        description:
            'You now know the key features of your DocsBot dashboard. Start building amazing AI experiences!',
        target: null,
        position: 'center',
    },
]

export default function DashboardWizard({
    team,
    user,
    bot,
    bots,
}) {
    const router = useRouter()
    const [currentStep, setCurrentStep] = useState(0)
    const [isVisible, setIsVisible] = useState(false)
    const [overlayStyle, setOverlayStyle] = useState({})
    const [tooltipStyle, setTooltipStyle] = useState({})
    const [arrowOffset, setArrowOffset] = useState(32) // Default left-8 = 32px
    const [targetRect, setTargetRect] = useState(null)
    const overlayRef = useRef(null)
    const tooltipRef = useRef(null)

    // Check if wizard should be shown
    useEffect(() => {
        if (typeof window === 'undefined') return

        if (isDebugWizardEnabled()) {
            const currentPath =
                typeof window !== 'undefined' ? window.location.pathname : ''
            const isOnBotPage = /\/app\/bots\/[A-Za-z0-9]+/.test(currentPath)

            if (!isOnBotPage) {
                setIsVisible(false)
                return
            }

            // Restore step from cookie on route change so navigation doesn't reset the wizard
            const savedStep = getCurrentWizardStep()
            setCurrentStep(savedStep)
            setIsVisible(true)
            return
        }

        // First bot is created when onboarding finishes; don't overlay the tour before then.
        if ((team?.botCount ?? 0) === 0) {
            setIsVisible(false)
            return
        }

        // Only show for new users who haven't completed the wizard
        if (isNewUser() && !isWizardCompleted()) {
            const savedStep = getCurrentWizardStep()
            setCurrentStep(savedStep)
            setIsVisible(true)
        }
    }, [router.asPath, team?.botCount]) // Re-check when route changes

    // Position overlay and tooltip
    useEffect(() => {
        if (!isVisible) return

        const updatePositions = () => {
            const step = WIZARD_STEPS[currentStep]
            if (!step.target) {
                // Center position for welcome and complete steps
                setTargetRect(null)
                setOverlayStyle({
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 9999,
                    background: 'rgba(0, 0, 0, 0.4)',
                })
                setTooltipStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 10000,
                })
                return
            }

            const targetElement = queryWizardTarget(step.target)
            if (!targetElement) {
                setTargetRect(null)
                // Check if we're on a bot page
                const currentPath =
                    typeof window !== 'undefined'
                        ? window.location.pathname
                        : ''
                const isOnBotPage = /\/app\/bots\/[A-Za-z0-9]+/.test(
                    currentPath,
                )

                if (isOnBotPage) {
                    // If on a bot page but element not found, show centered dialog instead
                    setTargetRect(null)
                    setOverlayStyle({
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        background: 'rgba(0, 0, 0, 0.4)',
                    })
                    setTooltipStyle({
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: 10000,
                    })
                    return
                } else if (
                    currentStep > 0 &&
                    currentStep < WIZARD_STEPS.length - 1
                ) {
                    // If not on a bot page and on a bot-specific step, hide wizard and redirect to first bot
                    setIsVisible(false)
                    if (bots && Array.isArray(bots) && bots.length > 0) {
                        router.push(`/app/bots/${bots[0].id}`)
                    }
                    return
                }
                return
            }

            const rect = targetElement.getBoundingClientRect()
            setTargetRect(rect)
            const padding = 8
            const margin = 16 // Additional margin between highlighted element and dialog
            const tooltipWidth = 384 // max-w-sm = 24rem = 384px
            const viewportPadding = 16 // Padding from viewport edges

            // Create overlay that highlights the target element
            setOverlayStyle({
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 9999,
                background: 'rgba(0, 0, 0, 0.4)',
            })

            // Position tooltip based on step position preference
            let tooltipPosition = {}
            let leftPosition = rect.left

            // Check if tooltip would overflow on the right
            if (
                leftPosition + tooltipWidth >
                window.innerWidth - viewportPadding
            ) {
                // Position from the right edge instead
                leftPosition =
                    window.innerWidth - tooltipWidth - viewportPadding
            }

            // Check if tooltip would overflow on the left
            if (leftPosition < viewportPadding) {
                leftPosition = viewportPadding
            }

            // Calculate arrow offset to point at the target element
            // Arrow should point to the center of the target element
            const targetCenter = rect.left + rect.width / 2
            const arrowPosition = targetCenter - leftPosition
            // Clamp arrow position to stay within dialog bounds (with some padding)
            const clampedArrowPosition = Math.max(
                24,
                Math.min(arrowPosition, tooltipWidth - 24),
            )
            setArrowOffset(clampedArrowPosition)

            switch (step.position) {
                case 'bottom':
                    tooltipPosition = {
                        position: 'fixed',
                        top: rect.bottom + padding + margin + 'px',
                        left: leftPosition + 'px',
                        zIndex: 10000,
                        maxWidth: `${tooltipWidth}px`,
                    }
                    break
                case 'top':
                    tooltipPosition = {
                        position: 'fixed',
                        bottom:
                            window.innerHeight -
                            rect.top +
                            padding +
                            margin +
                            'px',
                        left: leftPosition + 'px',
                        zIndex: 10000,
                        maxWidth: `${tooltipWidth}px`,
                    }
                    break
                case 'left':
                    tooltipPosition = {
                        position: 'fixed',
                        top: rect.top + 'px',
                        right:
                            window.innerWidth -
                            rect.left +
                            padding +
                            margin +
                            'px',
                        zIndex: 10000,
                        maxWidth: `${tooltipWidth}px`,
                    }
                    break
                case 'right':
                    tooltipPosition = {
                        position: 'fixed',
                        top: rect.top + 'px',
                        left: rect.right + padding + margin + 'px',
                        zIndex: 10000,
                        maxWidth: `${tooltipWidth}px`,
                    }
                    break
                default:
                    tooltipPosition = {
                        position: 'fixed',
                        top: rect.bottom + padding + margin + 'px',
                        left: leftPosition + 'px',
                        zIndex: 10000,
                        maxWidth: `${tooltipWidth}px`,
                    }
            }

            setTooltipStyle(tooltipPosition)
        }

        // Initial positioning
        updatePositions()

        // Add event listeners for resize and scroll
        window.addEventListener('resize', updatePositions)
        window.addEventListener('scroll', updatePositions, true) // Use capture phase to catch all scrolls

        // Cleanup
        return () => {
            window.removeEventListener('resize', updatePositions)
            window.removeEventListener('scroll', updatePositions, true)
        }
    }, [currentStep, isVisible])

    const handleNext = async () => {
        // If advancing from welcome step and not on a bot page, redirect to first bot
        if (currentStep === 0 && !bot) {
            // Persist step 1 so the tour resumes after navigation
            setCurrentWizardStep(1)

            // Hide wizard during redirect
            setIsVisible(false)

            // Redirect to first bot if available
            if (bots && Array.isArray(bots) && bots.length > 0) {
                router.push(`/app/bots/${bots[0].id}`)
            }
            return
        }

        const nextStep = currentStep + 1
        if (nextStep >= WIZARD_STEPS.length) {
            handleComplete()
        } else {
            const nextStepConfig = WIZARD_STEPS[nextStep]
            const botId = bot?.id

            // Persist step before navigating so the route-change effect reads the correct value
            setCurrentWizardStep(nextStep)
            setCurrentStep(nextStep)

            // Navigate to the correct page for steps that target sub-pages
            if (botId && nextStepConfig?.id === 'analytics-conversations') {
                await router.push(
                    `/app/bots/${botId}/analytics/conversations`,
                    undefined,
                    { shallow: true },
                )
            } else if (botId && nextStepConfig?.id === 'analytics-questions') {
                await router.push(
                    `/app/bots/${botId}/analytics/questions`,
                    undefined,
                    { shallow: true },
                )
            } else if (botId && nextStepConfig?.id === 'analytics-reports') {
                await router.push(
                    `/app/bots/${botId}/analytics/reports`,
                    undefined,
                    { shallow: true },
                )
            } else if (botId && nextStepConfig?.id === 'configure-sources') {
                await router.push(
                    `/app/bots/${botId}/configure/sources`,
                    undefined,
                    { shallow: true },
                )
            }
        }
    }

    const handlePrevious = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1
            setCurrentStep(prevStep)
            setCurrentWizardStep(prevStep)
        }
    }

    const handleComplete = () => {
        setIsVisible(false)
        setWizardCompleted()
        if (isDebugWizardEnabled()) {
            disableDebugWizard()
        }
    }

    const handleSkip = () => {
        setIsVisible(false)
        setWizardCompleted()
        if (isDebugWizardEnabled()) {
            disableDebugWizard()
        }
    }

    if (!isVisible || !team || !user) {
        return null
    }

    const step = WIZARD_STEPS[currentStep]
    const isFirstStep = currentStep === 0
    const isLastStep = currentStep === WIZARD_STEPS.length - 1

    const padding = 8

    return (
        <>
            {/* Overlay - use box-shadow cutout when highlighting a target so the element stays visible */}
            {step.target && targetRect ? (
                <>
                    <div
                        ref={overlayRef}
                        className="pointer-events-none"
                        style={{
                            position: 'fixed',
                            top: targetRect.top - padding,
                            left: targetRect.left - padding,
                            width: targetRect.width + padding * 2,
                            height: targetRect.height + padding * 2,
                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                            zIndex: 9999,
                        }}
                    />
                    {/* Click-blocking: 4 rects around the highlight (dark area blocks, highlight stays clickable) */}
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: Math.max(0, targetRect.top - padding),
                            zIndex: 9998,
                            pointerEvents: 'auto',
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: targetRect.bottom + padding,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 9998,
                            pointerEvents: 'auto',
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: targetRect.top - padding,
                            left: 0,
                            width: Math.max(0, targetRect.left - padding),
                            height: targetRect.height + padding * 2,
                            zIndex: 9998,
                            pointerEvents: 'auto',
                        }}
                    />
                    <div
                        style={{
                            position: 'fixed',
                            top: targetRect.top - padding,
                            left: targetRect.right + padding,
                            right: 0,
                            height: targetRect.height + padding * 2,
                            zIndex: 9998,
                            pointerEvents: 'auto',
                        }}
                    />
                </>
            ) : (
                <div ref={overlayRef} style={overlayStyle} />
            )}

            {/* Tooltip */}
            <div
                ref={tooltipRef}
                style={tooltipStyle}
                className="pointer-events-auto relative max-w-sm rounded-lg bg-white p-6 shadow-xl"
            >
                {/* Triangle arrow pointing up (when dialog is below target) */}
                {step.target && step.position === 'bottom' && (
                    <div
                        className="absolute"
                        style={{
                            top: '-11px',
                            left: `${arrowOffset}px`,
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '12px solid transparent',
                            borderRight: '12px solid transparent',
                            borderBottom: '12px solid white',
                        }}
                    />
                )}

                {/* Triangle arrow pointing down (when dialog is above target) */}
                {step.target && step.position === 'top' && (
                    <div
                        className="absolute"
                        style={{
                            bottom: '-11px',
                            left: `${arrowOffset}px`,
                            transform: 'translateX(-50%)',
                            width: 0,
                            height: 0,
                            borderLeft: '12px solid transparent',
                            borderRight: '12px solid transparent',
                            borderTop: '12px solid white',
                        }}
                    />
                )}

                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="mb-2 text-lg font-semibold text-gray-900">
                            {step.title}
                        </h3>
                        <p className="mb-4 text-sm text-gray-600">
                            {step.description}
                        </p>

                        {/* Progress indicator */}
                        <div className="mb-4 flex items-center space-x-2">
                            <div className="h-2 flex-1 rounded-full bg-gray-200">
                                <div
                                    className="h-2 rounded-full bg-cyan-600 transition-all duration-300"
                                    style={{
                                        width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%`,
                                    }}
                                />
                            </div>
                            <span className="text-xs text-gray-500">
                                {currentStep + 1} of {WIZARD_STEPS.length}
                            </span>
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-2">
                                {!isFirstStep && (
                                    <button
                                        onClick={handlePrevious}
                                        className="flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        <ChevronLeftIcon className="mr-1 h-4 w-4" />
                                        Previous
                                    </button>
                                )}
                            </div>

                            <div className="flex space-x-2">
                                {isLastStep ? (
                                    <button
                                        onClick={handleComplete}
                                        className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        Get Started
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNext}
                                        className="flex items-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    >
                                        Next
                                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Close button positioned absolutely in top right with tooltip */}
                    <div className="absolute right-4 top-4">
                        <Tooltip content="Skip Tour" zIndex={10001}>
                            <button
                                onClick={handleSkip}
                                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>
        </>
    )
}

// Export utility functions for use in other components
export { isNewUser, isWizardCompleted }
