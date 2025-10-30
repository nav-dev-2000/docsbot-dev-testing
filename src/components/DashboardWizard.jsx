import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import { XMarkIcon, ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/outline'
import * as cookie from 'cookie'
import Tooltip from '@/components/Tooltip'

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
    document.cookie = cookie.serialize('docsbot-prefs', JSON.stringify(prefs), {
      expires,
      path: '/',
      sameSite: 'lax'
    })
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
  if (prefs['wizard-step'] !== undefined && prefs['wizard-completed'] === false) {
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

// Wizard steps configuration
const WIZARD_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to DocsBot!',
    description: 'Let\'s take a quick tour of the bot dashboard to help you get started.',
    target: null,
    position: 'center'
  },
  {
    id: 'add-sources',
    title: 'Add Knowledge Sources',
    description: 'Add documents, websites, or other content to train your bot.',
    target: '[data-wizard="add-sources"]',
    position: 'top'
  },
  {
    id: 'custom-instructions',
    title: 'Custom Instructions',
    description: 'Set custom instructions to personalize how your bot responds to questions.',
    target: '[data-wizard="custom-instructions"]',
    position: 'bottom'
  },
  {
    id: 'edit-bot',
    title: 'Edit Bot Settings',
    description: 'Click Edit to change your bot\'s AI model, privacy settings, and other important settings.',
    target: '[data-wizard="edit-bot"]',
    position: 'bottom'
  },
  {
    id: 'widget-settings',
    title: 'Widget Settings',
    description: 'Get your widget embed code and customize how it appears on your website.',
    target: '[data-wizard="widget-settings"]',
    position: 'bottom'
  },
  {
    id: 'integrations',
    title: 'Integrations & Sharing',
    description: 'Deploy your bot via API, Slack, or create shareable links.',
    target: '[data-wizard="integrations"]',
    position: 'bottom'
  },
  {
    id: 'conversations',
    title: 'View Conversations',
    description: 'Monitor user conversations and see how your bot is performing.',
    target: '[data-wizard="conversations"]',
    position: 'bottom'
  },
  {
    id: 'questions',
    title: 'Question Logs',
    description: 'Review user questions and fine-tune your bot\'s responses.',
    target: '[data-wizard="questions"]',
    position: 'bottom'
  },
  {
    id: 'reports',
    title: 'Analytics & Reports',
    description: 'View detailed analytics about your bot\'s performance and usage.',
    target: '[data-wizard="reports"]',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'You\'re All Set!',
    description: 'You now know the key features of your DocsBot dashboard. Start building amazing AI experiences!',
    target: null,
    position: 'center'
  }
]

export default function DashboardWizard({ team, user, bot, bots }) {
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
    
    // Only show for new users who haven't completed the wizard
    if (isNewUser() && !isWizardCompleted()) {
      const savedStep = getCurrentWizardStep()
      setCurrentStep(savedStep)
      setIsVisible(true)
    }
  }, [router.asPath]) // Re-check when route changes

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
          background: 'rgba(0, 0, 0, 0.5)'
        })
        setTooltipStyle({
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10000
        })
        return
      }

      const targetElement = document.querySelector(step.target)
      if (!targetElement) {
        setTargetRect(null)
        // Check if we're on a bot page
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
        const isOnBotPage = /\/app\/bots\/[A-Za-z0-9]+/.test(currentPath)
        
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
            background: 'rgba(0, 0, 0, 0.5)'
          })
          setTooltipStyle({
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 10000
          })
          return
        } else if (currentStep > 0 && currentStep < WIZARD_STEPS.length - 1) {
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
        background: 'rgba(0, 0, 0, 0.5)'
      })

      // Position tooltip based on step position preference
      let tooltipPosition = {}
      let leftPosition = rect.left
      
      // Check if tooltip would overflow on the right
      if (leftPosition + tooltipWidth > window.innerWidth - viewportPadding) {
        // Position from the right edge instead
        leftPosition = window.innerWidth - tooltipWidth - viewportPadding
      }
      
      // Check if tooltip would overflow on the left
      if (leftPosition < viewportPadding) {
        leftPosition = viewportPadding
      }

      // Calculate arrow offset to point at the target element
      // Arrow should point to the center of the target element
      const targetCenter = rect.left + (rect.width / 2)
      const arrowPosition = targetCenter - leftPosition
      // Clamp arrow position to stay within dialog bounds (with some padding)
      const clampedArrowPosition = Math.max(24, Math.min(arrowPosition, tooltipWidth - 24))
      setArrowOffset(clampedArrowPosition)

      switch (step.position) {
        case 'bottom':
          tooltipPosition = {
            position: 'fixed',
            top: rect.bottom + padding + margin + 'px',
            left: leftPosition + 'px',
            zIndex: 10000,
            maxWidth: `${tooltipWidth}px`
          }
          break
        case 'top':
          tooltipPosition = {
            position: 'fixed',
            bottom: window.innerHeight - rect.top + padding + margin + 'px',
            left: leftPosition + 'px',
            zIndex: 10000,
            maxWidth: `${tooltipWidth}px`
          }
          break
        case 'left':
          tooltipPosition = {
            position: 'fixed',
            top: rect.top + 'px',
            right: window.innerWidth - rect.left + padding + margin + 'px',
            zIndex: 10000,
            maxWidth: `${tooltipWidth}px`
          }
          break
        case 'right':
          tooltipPosition = {
            position: 'fixed',
            top: rect.top + 'px',
            left: rect.right + padding + margin + 'px',
            zIndex: 10000,
            maxWidth: `${tooltipWidth}px`
          }
          break
        default:
          tooltipPosition = {
            position: 'fixed',
            top: rect.bottom + padding + margin + 'px',
            left: leftPosition + 'px',
            zIndex: 10000,
            maxWidth: `${tooltipWidth}px`
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

  const handleNext = () => {
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
      setCurrentStep(nextStep)
      setCurrentWizardStep(nextStep)
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
  }

  const handleSkip = () => {
    setIsVisible(false)
    setWizardCompleted()
  }

  if (!isVisible || !team || !user) {
    return null
  }

  const step = WIZARD_STEPS[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === WIZARD_STEPS.length - 1

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
        style={overlayStyle}
      >
        {/* Highlight cutout for target element */}
        {step.target && targetRect && (
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.3)',
              clipPath: `polygon(
                0% 0%, 
                0% 100%, 
                ${targetRect.left - 8}px 100%, 
                ${targetRect.left - 8}px ${targetRect.top - 8}px, 
                ${targetRect.right + 8}px ${targetRect.top - 8}px, 
                ${targetRect.right + 8}px ${targetRect.bottom + 8}px, 
                ${targetRect.left - 8}px ${targetRect.bottom + 8}px, 
                ${targetRect.left - 8}px 100%, 
                100% 100%, 
                100% 0%
              )`
            }}
          />
        )}
        {/* Transparent overlay to allow clicks through target element */}
        {step.target && targetRect && (
          <div
            className="pointer-events-none"
            style={{
              position: 'absolute',
              top: `${targetRect.top - 8}px`,
              left: `${targetRect.left - 8}px`,
              width: `${targetRect.width + 16}px`,
              height: `${targetRect.height + 16}px`,
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        className="pointer-events-auto max-w-sm rounded-lg bg-white p-6 shadow-xl relative"
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {step.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {step.description}
            </p>
            
            {/* Progress indicator */}
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-cyan-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentStep + 1) / WIZARD_STEPS.length) * 100}%` }}
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
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <ChevronLeftIcon className="w-4 h-4 mr-1" />
                    Previous
                  </button>
                )}
              </div>
              
            <div className="flex space-x-2">
              {isLastStep ? (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  Get Started
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </button>
              )}
            </div>
            </div>
          </div>
          
          {/* Close button positioned absolutely in top right with tooltip */}
          <div className="absolute top-4 right-4">
            <Tooltip content="Skip Tour" zIndex={10001}>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <XMarkIcon className="w-5 h-5" />
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
