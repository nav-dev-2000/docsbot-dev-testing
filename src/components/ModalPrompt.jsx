import { Fragment, useEffect, useState, useRef } from 'react'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import clsx from 'clsx'
import ModalCheckout from '@/components/ModalCheckout'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { canUserEditBot } from '@/utils/function.utils'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import {
    CUSTOM_BUTTON_TOOL_PREFIX,
    getEnabledCustomButtons,
} from '@/lib/botActions'
import {
    DEBUG_LOADING_TEXT,
    InstructionHeader,
    InstructionsForm,
    InstructionsPreview,
    InstructionsDebugModal,
} from '@/components/ModalPromptSections'

// Helper function to get company name from bot metadata, team metadata, or bot name
const getCompanyName = (bot, team) => {
    // Check bot metadata/brandAnalysis first
    if (bot?.brandAnalysis?.businessName) {
        return bot.brandAnalysis.businessName
    }
    // Check team metadata
    if (team?.metadata?.companyName) {
        return team.metadata.companyName
    }
    // Fallback to bot name
    return bot?.name || 'your company'
}

const isToolEnabled = (toolConfig, defaultEnabled = false) => {
    if (toolConfig === true) return true
    if (toolConfig === false || toolConfig === null || toolConfig === undefined) {
        return false
    }
    if (typeof toolConfig === 'object' && !Array.isArray(toolConfig)) {
        if (toolConfig.enabled === undefined) {
            return defaultEnabled
        }
        return toolConfig.enabled === true
    }
    return false
}

const getInstructionToolNames = (tools) => {
    const toolNames = ['search_documentation']
    const enabledTools = tools && typeof tools === 'object' ? tools : {}

    if (isToolEnabled(enabledTools.human_escalation, true)) {
        toolNames.push('human_escalation')
    }
    if (isToolEnabled(enabledTools.web_search, false)) {
        toolNames.push('web_search')
    }
    if (isToolEnabled(enabledTools.calendly, false)) {
        toolNames.push('book_calendly')
    }
    if (isToolEnabled(enabledTools.calcom, false)) {
        toolNames.push('book_calcom')
    }
    if (isToolEnabled(enabledTools.tidycal, false)) {
        toolNames.push('book_tidycal')
    }

    if (isToolEnabled(enabledTools.stripe?.recent_billing, false)) {
        toolNames.push('stripe_recent_invoices')
        toolNames.push('stripe_customer_subscriptions')
    }
    if (isToolEnabled(enabledTools.stripe?.billing_portal, false)) {
        toolNames.push('stripe_billing_portal')
    }
    if (isToolEnabled(enabledTools.stripe?.refund, false)) {
        toolNames.push('stripe_refund_latest_payment')
    }
    if (isToolEnabled(enabledTools.stripe?.cancellation, false)) {
        toolNames.push('stripe_cancel_subscription')
    }

    for (const btn of getEnabledCustomButtons(enabledTools.customButtons)) {
        if (btn.functionKey) {
            toolNames.push(`${CUSTOM_BUTTON_TOOL_PREFIX}${btn.functionKey}`)
        }
    }

    return [...new Set(toolNames)]
}

export default function ModalPrompt({
    team,
    integrations,
    bot,
    setBot,
    open,
    setOpen,
}) {
    const [localOpen, setLocalOpen] = useState(false)
    const [errorText, setErrorText] = useState(null)
    const [successText, setSuccessText] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [prompt, setPrompt] = useState(bot.customPrompt || '')
    const [agentPrompt, setAgentPrompt] = useState(bot.agentPrompt || '')
    const [hsPrompt, setHSPrompt] = useState(bot.helpscoutPrompt || '')
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
    const saveButtonRef = useRef(null)
    const [user] = useAuthState(auth)
    const [canModify, setModify] = useState(false)
    const [activeTab, setActiveTab] = useState('agent')
    const [selectedPreset, setSelectedPreset] = useState('')
    const helpScoutIntegration = integrations.find((i) => i.id === 'helpscout')
    const [actionInput, setActionInput] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [showGeneratePopover, setShowGeneratePopover] = useState(false)
    const popoverRef = useRef(null)
    const buttonRef = useRef(null)
    const agentPromptRef = useRef(null)

    // Debug functionality state
    const [showDebugModal, setShowDebugModal] = useState(false)
    const [debugDesiredBehavior, setDebugDesiredBehavior] = useState('')
    const [debugUndesiredBehavior, setDebugUndesiredBehavior] = useState('')
    const [debugAnalysis, setDebugAnalysis] = useState('')
    const [isDebugging, setIsDebugging] = useState(false)

    // Debug image upload state
    const [debugSelectedImages, setDebugSelectedImages] = useState([])
    const debugFileInputRef = useRef(null)

    const [debugLoadingIndex, setDebugLoadingIndex] = useState(0)

    // Use external open state if provided, otherwise use local state
    const isOpen = open !== undefined ? open : localOpen
    const setIsOpen = setOpen || setLocalOpen

    useEffect(() => {
        if (!bot?.id) return
        setPrompt(bot.customPrompt || '')
        setAgentPrompt(bot.agentPrompt || '')
        setHSPrompt(bot.helpscoutPrompt || '')
        setHasUnsavedChanges(false)
        setSuccessText(null)
        setErrorText(null)
        setShowGeneratePopover(false)
        setActionInput('')
    }, [bot?.id])

    useEffect(() => {
        if (showGeneratePopover) {
            if (activeTab === 'regular') {
                setActionInput(prompt)
            } else if (activeTab === 'helpscout') {
                setActionInput(hsPrompt)
            }
        }
    }, [showGeneratePopover, activeTab, prompt, hsPrompt])

    // Debug loading text effect
    useEffect(() => {
        if (isDebugging) {
            const interval = setInterval(() => {
                setDebugLoadingIndex((prevIndex) => {
                    if (prevIndex < DEBUG_LOADING_TEXT.length - 1) {
                        return prevIndex + 1
                    }
                    clearInterval(interval)
                    return prevIndex
                })
            }, 8000) // 8 seconds per text, total 48 seconds

            return () => clearInterval(interval)
        } else {
            setDebugLoadingIndex(0)
        }
    }, [isDebugging])

    useEffect(() => {
        if (!team || !user) return
        setModify(canUserEditBot(team, user.uid, bot))
    }, [team, user, bot])

    // Check if current agentPrompt matches any preset, if not set to "custom"
    useEffect(() => {
        if (!agentPrompt) {
            setSelectedPreset('')
            return
        }

        // Check if agentPrompt matches any preset after variable replacement
        let matchedPreset = ''
        for (const [presetKey, presetData] of Object.entries(PRESET_PROMPTS)) {
            // Skip HELPSCOUT preset for agent prompt matching
            if (presetKey === 'HELPSCOUT') continue

            const replacedPrompt = presetData.prompt
                .replace(/{company_name}/g, bot.name)
                .replace(/{old_prompt}\n/g, prompt ? prompt + '\n' : '')
                .replace(/{old_prompt}/g, prompt ? prompt + '\n' : '')

            if (agentPrompt.trim() === replacedPrompt.trim()) {
                matchedPreset = presetKey
                break
            }
        }

        if (matchedPreset) {
            setSelectedPreset(matchedPreset)
        } else {
            // If agentPrompt exists but doesn't match any preset, set to "custom"
            setSelectedPreset('custom')
        }
    }, [agentPrompt, bot.name, prompt])

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                popoverRef.current &&
                !popoverRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setShowGeneratePopover(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    useEffect(() => {
        // Track unsaved changes when prompts are modified
        const hasChanges =
            prompt !== (bot.customPrompt || '') ||
            hsPrompt !== (bot.helpscoutPrompt || '') ||
            agentPrompt !== (bot.agentPrompt || '')
        setHasUnsavedChanges(hasChanges)
    }, [prompt, hsPrompt, agentPrompt, bot])

    useUnsavedChangesWarning(hasUnsavedChanges, false)

    const tabs = [
        { name: 'Agent Prompt', id: 'agent', current: activeTab === 'agent' },
        {
            name: 'Legacy Prompt',
            id: 'regular',
            current: activeTab === 'regular',
        },
        ...(helpScoutIntegration
            ? [
                  {
                      name: 'Help Scout Prompt',
                      id: 'helpscout',
                      current: activeTab === 'helpscout',
                  },
              ]
            : []),
    ]

    const handlePresetChange = (value) => {
        setSelectedPreset(value)

        // Don't modify agentPrompt if "custom" is selected or if HELPSCOUT is selected
        if (value && value !== 'custom' && value !== 'HELPSCOUT') {
            const presetPrompt = PRESET_PROMPTS[value]?.prompt || ''
            if (activeTab === 'agent') {
                // Get product info from brandAnalysis if available
                const productInfo =
                    bot?.brandAnalysis?.businessDescription || ''
                const productInfoWithNewline = productInfo
                    ? '\n' + productInfo
                    : ''
                setAgentPrompt(
                    presetPrompt
                        .replace(/{company_name}/g, bot.name)
                        .replace(/{product_info}/g, productInfoWithNewline)
                        .replace(/{old_prompt}\n/g, prompt ? prompt + '\n' : '')
                        .replace(/{old_prompt}/g, prompt ? prompt + '\n' : ''),
                )
            }
        }
    }

    const handlePromptChange = (e) => {
        setPrompt(e.target.value)
    }

    const handleAgentPromptChange = (e) => {
        setAgentPrompt(e.target.value)
    }

    const handleHSPromptChange = (e) => {
        setHSPrompt(e.target.value)
    }

    const handleUseHelpScoutTemplate = () => {
        const companyName = getCompanyName(bot, team)
        // Get product info from brandAnalysis if available, otherwise use empty string
        const productInfo = bot?.brandAnalysis?.businessDescription || ''
        const productInfoWithNewline = productInfo ? '\n' + productInfo : ''
        const template = PRESET_PROMPTS.HELPSCOUT?.prompt || ''
        const filledTemplate = template
            .replace(/{company_name}/g, companyName)
            .replace(/{product_info}/g, productInfoWithNewline)
            .replace(/{old_prompt}\n/g, '')
            .replace(/{old_prompt}/g, '')
        setHSPrompt(filledTemplate)
    }

    const handleReset = () => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                'Are you sure you want to reset all changes?',
            )
            if (confirmed) {
                setPrompt(bot.customPrompt || '')
                setAgentPrompt(bot.agentPrompt || '')
                setHSPrompt(bot.helpscoutPrompt || '')

                // Reset selectedPreset based on original bot agentPrompt
                if (!bot.agentPrompt) {
                    setSelectedPreset('')
                } else {
                    // Check if original agentPrompt matches any preset
                    let matchedPreset = ''
                    for (const [presetKey, presetData] of Object.entries(
                        PRESET_PROMPTS,
                    )) {
                        // Skip HELPSCOUT preset for agent prompt matching
                        if (presetKey === 'HELPSCOUT') continue

                        const replacedPrompt = presetData.prompt
                            .replace(/{company_name}/g, bot.name)
                            .replace(
                                /{old_prompt}\n/g,
                                bot.customPrompt ? bot.customPrompt + '\n' : '',
                            )
                            .replace(
                                /{old_prompt}/g,
                                bot.customPrompt ? bot.customPrompt + '\n' : '',
                            )

                        if (bot.agentPrompt.trim() === replacedPrompt.trim()) {
                            matchedPreset = presetKey
                            break
                        }
                    }
                    setSelectedPreset(matchedPreset || 'custom')
                }
            }
        }
    }

    const handleIframeClick = (e) => {
        if (hasUnsavedChanges && saveButtonRef.current) {
            e.preventDefault()
            saveButtonRef.current.focus()
            saveButtonRef.current.classList.add('animate-pulse', 'ring-4')
            setTimeout(() => {
                saveButtonRef.current.classList.remove(
                    'animate-pulse',
                    'ring-4',
                )
            }, 1000)
        }
    }

    const handleCloseModal = () => {
        if (hasUnsavedChanges) {
            const confirmed = window.confirm(
                'You have unsaved changes. Are you sure you want to close?',
            )
            if (confirmed) {
                setIsOpen(false)
            }
        } else {
            setIsOpen(false)
        }
    }

    async function updatePrompt() {
        setErrorText('')
        setSuccessText('')

        setIsUpdating(true)

        const urlParams = ['teams', team.id, 'bots', bot.id]
        const apiPath = '/api/' + urlParams.join('/')

        let data = {}
        data.customPrompt = prompt
        data.agentPrompt = agentPrompt
        if (helpScoutIntegration) {
            data.helpscoutPrompt = hsPrompt.trim()
        }

        const response = await fetch(apiPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        if (response.ok) {
            const updatedBot = await response.json()
            setPrompt(updatedBot.customPrompt || '')
            setAgentPrompt(updatedBot.agentPrompt || '')
            setHSPrompt(updatedBot.helpscoutPrompt || '')
            setHasUnsavedChanges(false)
            setIsUpdating(false)
            setSuccessText('Changes saved successfully')
            if (setBot && typeof setBot === 'function') {
                setBot(updatedBot)
            }

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessText(null)
            }, 3000)
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
            setIsUpdating(false)
        }
    }

    async function generatePrompt() {
        setIsGenerating(true)
        setShowGeneratePopover(false)
        const urlParams = ['teams', team.id, 'bots', bot.id, 'prompt']
        const apiPath = '/api/' + urlParams.join('/')
        try {
            const response = await fetch(apiPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ input: actionInput, activeTab }),
            })
            if (response.ok) {
                const data = await response.json()
                if (activeTab === 'regular') {
                    setPrompt(data.prompt)
                } else if (activeTab === 'agent') {
                    setAgentPrompt(data.prompt)
                } else if (activeTab === 'helpscout') {
                    setHSPrompt(data.prompt)
                }
                setActionInput('') // Clear the input
            } else {
                setErrorText('Failed to generate prompt. Please try again.')
            }
        } catch (error) {
            setErrorText('An error occurred. Please try again.')
        }
        setIsGenerating(false)
    }

    async function debugPrompt() {
        if (!debugDesiredBehavior.trim() && !debugUndesiredBehavior.trim()) {
            setErrorText(
                'Please fill in at least one of the behavior fields (desired or undesired).',
            )
            return
        }

        setIsDebugging(true)
        setErrorText('')

        // Get the current prompt based on active tab
        let currentPrompt = ''
        if (activeTab === 'regular') {
            currentPrompt = prompt
        } else if (activeTab === 'agent') {
            currentPrompt = agentPrompt
        } else if (activeTab === 'helpscout') {
            currentPrompt = hsPrompt
        }

        if (!currentPrompt.trim()) {
            setErrorText('Please enter a prompt before debugging.')
            setIsDebugging(false)
            return
        }

        try {
            const imageUrls = debugSelectedImages.map((img) => img.url)
            const response = await fetch(
                `/api/teams/${team.id}/bots/${bot.id}/prompt-debug`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: currentPrompt,
                        desiredBehavior: debugDesiredBehavior,
                        undesiredBehavior: debugUndesiredBehavior,
                        image_urls: imageUrls,
                    }),
                },
            )

            if (response.ok) {
                const data = await response.json()
                setDebugAnalysis(data.analysis)
            } else {
                const errorData = await response.json()
                setErrorText(
                    errorData.message ||
                        'Failed to analyze prompt. Please try again.',
                )
            }
        } catch (error) {
            setErrorText('An error occurred while analyzing the prompt.')
        }
        setIsDebugging(false)
    }

    const resetDebugModal = () => {
        setShowDebugModal(false)
        setDebugDesiredBehavior('')
        setDebugUndesiredBehavior('')
        setDebugAnalysis('')
        setDebugSelectedImages([])
        setErrorText('')
    }

    const handleDebugImageSelect = (e) => {
        const files = Array.from(e.target.files)
        if (files.length === 0) return

        // Check if adding these files would exceed the limit
        if (debugSelectedImages.length + files.length > 4) {
            setErrorText('Maximum 4 images allowed')
            return
        }

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                setErrorText('Please select only image files')
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const img = new Image()
                img.onload = () => {
                    // Calculate new dimensions while maintaining aspect ratio
                    let width = img.width
                    let height = img.height
                    const maxSize = 1200

                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }

                    // Create canvas and resize image
                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)

                    // Convert to base64
                    const base64 = canvas.toDataURL('image/jpeg', 0.8)
                    setDebugSelectedImages((prev) => [
                        ...prev,
                        { url: base64, file },
                    ])
                }
                img.src = e.target.result
            }
            reader.readAsDataURL(file)
        })
    }

    const removeDebugImage = (index) => {
        setDebugSelectedImages((prev) => prev.filter((_, i) => i !== index))
    }

    const triggerDebugFileInput = () => {
        debugFileInputRef.current.click()
    }

    const isModalMode = open !== undefined
    const instructionToolNames = getInstructionToolNames(bot?.tools)

    const canEditInstructions = (activeTab === 'regular' || activeTab === 'agent') && bot.status === 'ready'

    const insertAgentToolReference = (toolName) => {
        const textarea = agentPromptRef.current
        const insertion = `\`${toolName}\``
        const currentValue = agentPrompt || ''

        if (!textarea) {
            setAgentPrompt(currentValue + insertion)
            return
        }

        const start = textarea.selectionStart ?? currentValue.length
        const end = textarea.selectionEnd ?? currentValue.length
        textarea.focus()

        // Prefer the browser editing command so Cmd-Z treats this like normal typing.
        textarea.setSelectionRange(start, end)
        const inserted = document.execCommand('insertText', false, insertion)

        if (!inserted) {
            textarea.setRangeText(insertion, start, end, 'end')
        }

        textarea.dispatchEvent(new Event('input', { bubbles: true }))
    }


    const mainContent = (
        <div
            className="flex h-full min-h-0 flex-col gap-4 xl:flex-row xl:gap-6"
            data-component="instructions-modal"
        >
            <div
                className={clsx(
                    'flex min-h-[900px] flex-1 flex-col xl:h-full',
                    {
                        ['rounded-lg bg-white shadow']: !isModalMode,
                    },
                )}
            >
                <InstructionHeader
                    bot={bot}
                    className={clsx('flex-none', {
                        ['p-4']: !isModalMode,
                    })}
                />

                <InstructionsForm
                    isModalMode={isModalMode}
                    activeTab={activeTab}
                    helpScoutIntegration={helpScoutIntegration}
                    onSubmit={updatePrompt}
                    tabs={tabs}
                    onSelectTab={setActiveTab}
                    errorText={errorText}
                    successText={successText}
                    prompt={prompt}
                    onPromptChange={handlePromptChange}
                    selectedPreset={selectedPreset}
                    onPresetChange={handlePresetChange}
                    agentPrompt={agentPrompt}
                    onAgentPromptChange={handleAgentPromptChange}
                    agentPromptRef={agentPromptRef}
                    instructionToolNames={instructionToolNames}
                    onInsertAgentTool={insertAgentToolReference}
                    hsPrompt={hsPrompt}
                    onHSPromptChange={handleHSPromptChange}
                    onUseHelpScoutTemplate={handleUseHelpScoutTemplate}
                    isUpdating={isUpdating}
                    canModify={canModify}
                    onOpenDebugModal={() => setShowDebugModal(true)}
                    showGeneratePopover={showGeneratePopover}
                    onToggleGeneratePopover={() =>
                        setShowGeneratePopover(!showGeneratePopover)
                    }
                    buttonRef={buttonRef}
                    popoverRef={popoverRef}
                    actionInput={actionInput}
                    onActionInputChange={(e) =>
                        setActionInput(e.target.value)
                    }
                    onClearActionInput={() => setActionInput('')}
                    isGenerating={isGenerating}
                    onGeneratePrompt={generatePrompt}
                    canEditInstructions={canEditInstructions}
                    onReset={handleReset}
                    hasUnsavedChanges={hasUnsavedChanges}
                    saveButtonRef={saveButtonRef}
                />
            </div>

            {activeTab !== 'helpscout' && (
                <InstructionsPreview
                    team={team}
                    bot={bot}
                    activeTab={activeTab}
                    hasUnsavedChanges={hasUnsavedChanges}
                    onIframeClick={handleIframeClick}
                />
            )}
        </div>
    )

    return (
        <>
            <ModalCheckout
                team={team}
                open={showUpgrade}
                setOpen={setShowUpgrade}
            />

            {isModalMode ? (
                <Transition.Root show={isOpen} as={Fragment}>
                    <Dialog
                        as="div"
                        className="relative z-modal"
                        onClose={handleCloseModal}
                    >
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0"
                            enterTo="opacity-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0"
                        >
                            <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                        </Transition.Child>

                        <div className="fixed inset-0">
                            <div className="flex h-full min-h-0 items-end justify-center p-4 text-center sm:items-center sm:p-0">
                                <Transition.Child
                                    as={Fragment}
                                    enter="ease-out duration-300"
                                    enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                    enterTo="opacity-100 translate-y-0 sm:scale-100"
                                    leave="ease-in duration-200"
                                    leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                                    leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                                >
                                    <Dialog.Panel
                                        className="w-full max-w-[90%] h-full min-h-0 max-h-[90vh] relative p-4 rounded-lg bg-white shadow-xl text-left transition-all"
                                        data-component="instructions-modal"
                                    >
                                        <div className="absolute right-0 top-0 pr-4 pt-4 sm:block">
                                            <button
                                                type="button"
                                                className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                                onClick={handleCloseModal}
                                            >
                                                <span className="sr-only">Close</span>
                                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                            </button>
                                        </div>

                                        <Dialog.Title className="sr-only">Custom Instructions</Dialog.Title>

                                        {mainContent}
                                    </Dialog.Panel>
                                </Transition.Child>
                            </div>
                        </div>
                    </Dialog>
                </Transition.Root>
            ) : (
                mainContent
            )}

            <InstructionsDebugModal
                show={showDebugModal}
                onClose={resetDebugModal}
                errorText={errorText}
                debugDesiredBehavior={debugDesiredBehavior}
                onDebugDesiredBehaviorChange={(e) =>
                    setDebugDesiredBehavior(e.target.value)
                }
                debugUndesiredBehavior={debugUndesiredBehavior}
                onDebugUndesiredBehaviorChange={(e) =>
                    setDebugUndesiredBehavior(e.target.value)
                }
                debugSelectedImages={debugSelectedImages}
                onDebugImageSelect={handleDebugImageSelect}
                onRemoveDebugImage={removeDebugImage}
                debugFileInputRef={debugFileInputRef}
                onTriggerFileInput={triggerDebugFileInput}
                isDebugging={isDebugging}
                debugLoadingIndex={debugLoadingIndex}
                debugAnalysis={debugAnalysis}
                onAnalyzeAnother={() => {
                    setDebugAnalysis('')
                    setDebugDesiredBehavior('')
                    setDebugUndesiredBehavior('')
                }}
                onAnalyze={debugPrompt}
            />
        </>
    )
}
