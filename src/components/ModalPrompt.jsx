import { Fragment, useEffect, useState, useRef } from 'react'
import { Dialog, Transition, Listbox } from '@headlessui/react'
import {
  CommandLineIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  XCircleIcon,
  XMarkIcon,
  BeakerIcon,
  ChatBubbleBottomCenterTextIcon,
  PencilSquareIcon,
  ChevronUpDownIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import LoadingSpinner from '@/components/LoadingSpinner'
import ModalCheckout from '@/components/ModalCheckout'
import { checkPlanPermission, isSuperAdmin } from '@/utils/helpers'
import Alert from '@/components/Alert'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { canUserEditBot } from '@/utils/function.utils'
import Tooltip from '@/components/Tooltip'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import PresetPromptSelect from '@/components/PresetPromptSelect'

export default function ModalPrompt({
  team,
  integrations,
  bot,
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

  // Use external open state if provided, otherwise use local state
  const isOpen = open !== undefined ? open : localOpen
  const setIsOpen = setOpen || setLocalOpen

  useEffect(() => {
    if (showGeneratePopover) {
      if (activeTab === 'regular') {
        setActionInput(prompt)
      } else if (activeTab === 'helpscout') {
        setActionInput(hsPrompt)
      }
    }
  }, [showGeneratePopover, activeTab, prompt, hsPrompt])

  useEffect(() => {
    if (!team || !user) return
    setModify(canUserEditBot(team, user.uid))
  }, [team, user])

  // Check if current agentPrompt matches any preset, if not set to "custom"
  useEffect(() => {
    if (!agentPrompt) {
      setSelectedPreset('')
      return
    }

    // Check if agentPrompt matches any preset after variable replacement
    let matchedPreset = ''
    for (const [presetKey, presetData] of Object.entries(PRESET_PROMPTS)) {
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

  // Add beforeunload event handler
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue =
          'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const tabs = [
    { name: 'Agent Prompt', id: 'agent', current: activeTab === 'agent' },
    { name: 'Legacy Prompt', id: 'regular', current: activeTab === 'regular' },
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

    // Don't modify agentPrompt if "custom" is selected
    if (value && value !== 'custom') {
      const presetPrompt = PRESET_PROMPTS[value]?.prompt || ''
      if (activeTab === 'agent') {
        setAgentPrompt(
          presetPrompt
            .replace(/{company_name}/g, bot.name)
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
          for (const [presetKey, presetData] of Object.entries(PRESET_PROMPTS)) {
            const replacedPrompt = presetData.prompt
              .replace(/{company_name}/g, bot.name)
              .replace(/{old_prompt}\n/g, bot.customPrompt ? bot.customPrompt + '\n' : '')
              .replace(/{old_prompt}/g, bot.customPrompt ? bot.customPrompt + '\n' : '')
            
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
        saveButtonRef.current.classList.remove('animate-pulse', 'ring-4')
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

    //show upgrade modal if they are not paid and doing anything other than erasing the prompt
    if (
      prompt &&
      !checkPlanPermission(team, 'hobby').allowed &&
      !isSuperAdmin(user.uid)
    ) {
      setShowUpgrade(true)
      return
    }

    setIsUpdating(true)

    const urlParams = ['teams', team.id, 'bots', bot.id]
    const apiPath = '/api/' + urlParams.join('/')

    let data = {}
    data.customPrompt = prompt
    data.agentPrompt = agentPrompt
    if (helpScoutIntegration) {
      data.helpscoutPrompt = hsPrompt
    }

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (response.ok) {
      const data = await response.json()
      setHasUnsavedChanges(false)
      setIsUpdating(false)
      setSuccessText('Changes saved successfully')

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessText(null)
      }, 3000)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
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

  return (
    <>
      {/* Only show button if setOpen is not provided externally */}
      {!setOpen && (
        <Tooltip content="Customize your bot's behavior">
          <button
            className="flex items-center text-sm text-gray-600 hover:text-gray-800"
            onClick={() => setLocalOpen(true)}
          >
            <CommandLineIcon
              className="mr-1 h-4 w-4 flex-shrink-0"
              aria-hidden="true"
            />
            <p>Custom Instructions</p>
          </button>
        </Tooltip>
      )}
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={handleCloseModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-7xl sm:p-6">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      updatePrompt()
                    }}
                  >
                    <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        onClick={handleCloseModal}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="">
                      <Dialog.Title
                        as="h3"
                        className="mb-4 text-xl font-medium leading-6 text-gray-900"
                      >
                        <div className="flex items-center">
                          <span>Customize Instructions</span>
                          {!checkPlanPermission(team, 'hobby').allowed && (
                            <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                              {
                                checkPlanPermission(team, 'personal')
                                  .requiredPlanLabel
                              }
                            </span>
                          )}
                          <div className="group relative ml-2">
                            <LightBulbIcon className="h-5 w-5 cursor-pointer text-gray-400 hover:text-gray-500" />
                            <span className="absolute left-0 top-8 z-10 flex w-96 scale-0 gap-3 rounded-lg bg-white p-3 shadow-lg transition-all group-hover:scale-100">
                              <div>
                                <InformationCircleIcon className="h-5 w-5" />
                              </div>
                              <div className="text-gray-500">
                                <p className="mb-2 text-sm text-gray-600">
                                  Add some custom instructions to your prompt to
                                  adjust your agents's answer output to your
                                  specific use case. You can use this powerful
                                  tool to change behavior, formatting, and
                                  provide any context that needs to be available
                                  for every response. Start by selecting a
                                  preset, or generate your own.
                                </p>
                                <p className="text-sm font-semibold text-gray-800">
                                  Example Custom Prompts
                                </p>
                                <div className="mt-2">
                                  <ul className="ml-0 list-disc space-y-2 text-sm text-gray-700">
                                    <li className="text-sm text-gray-700">
                                      <code>
                                        Politely refuse to answer questions
                                        unrelated to {bot.name}.
                                      </code>
                                    </li>
                                    <li className="text-sm text-gray-700">
                                      <code>
                                        Use \[...\] for block math and \(...\)
                                        for inline math in your response.
                                      </code>{' '}
                                      (for pretty display of equations)
                                    </li>
                                    <li className="text-sm text-gray-700">
                                      <code>
                                        If relevant to the user's question,
                                        after your answer, suggest my book "
                                        {bot.name} For Dummies".
                                      </code>
                                    </li>
                                    <li className="text-sm text-gray-700">
                                      <code>
                                        If the answer is not in the provided
                                        context, recommend they contact the{' '}
                                        {bot.name} support team and provide a
                                        link to https://mysite.com/support/
                                      </code>
                                    </li>
                                    <li className="text-sm text-gray-700">
                                      <code>
                                        Always respond as if you are Pee-wee
                                        Herman.
                                      </code>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </span>
                          </div>
                        </div>
                      </Dialog.Title>
                      <Alert title={errorText} type="error" />
                      <Alert title={successText} type="success" />
                      <div className="grid grid-cols-1 gap-x-8 lg:grid-cols-3">
                        <div
                          className={clsx(
                            'flex flex-col',
                            (activeTab === 'regular' ||
                              activeTab === 'agent') &&
                              bot.status === 'ready'
                              ? 'lg:col-span-2'
                              : 'lg:col-span-3',
                          )}
                        >
                          <div className="flex justify-between border-b border-gray-200">
                            <nav
                              className="-mb-px flex space-x-8"
                              aria-label="Tabs"
                            >
                              {tabs.map((tab) => (
                                <a
                                  key={tab.name}
                                  onClick={() =>
                                    !tab.disabled && setActiveTab(tab.id)
                                  }
                                  className={clsx(
                                    tab.current
                                      ? 'border-cyan-500 text-cyan-600'
                                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700',
                                    'cursor-pointer whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
                                    tab.disabled &&
                                      'cursor-not-allowed opacity-50',
                                  )}
                                  aria-current={
                                    tab.current ? 'page' : undefined
                                  }
                                >
                                  {tab.name}
                                </a>
                              ))}
                            </nav>
                            <div className="relative">
                              <Tooltip content="Generate or improve your prompt">
                                <button
                                  ref={buttonRef}
                                  type="button"
                                  onClick={() =>
                                    setShowGeneratePopover(!showGeneratePopover)
                                  }
                                  disabled={isGenerating}
                                  className={
                                    'my-2 inline-flex items-center rounded-lg border border-transparent px-2 py-1 text-gray-400 ring-inset hover:text-gray-500 hover:outline-none hover:ring-2 hover:ring-gray-400'
                                  }
                                >
                                  <SparklesIcon
                                    className={clsx(
                                      'mr-1 h-5 w-5',
                                      isGenerating && 'animate-ping',
                                    )}
                                  />{' '}
                                  <span className="hidden sm:inline">
                                    {showGeneratePopover
                                      ? 'Cancel'
                                      : 'Generate'}
                                  </span>
                                </button>
                              </Tooltip>
                              <Transition
                                show={showGeneratePopover}
                                enter="transition ease-out duration-200"
                                enterFrom="opacity-0 translate-y-1"
                                enterTo="opacity-100 translate-y-0"
                                leave="transition ease-in duration-150"
                                leaveFrom="opacity-100 translate-y-0"
                                leaveTo="opacity-0 translate-y-1"
                              >
                                <div
                                  ref={popoverRef}
                                  className="absolute right-0 z-10 mt-0 w-80 rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                >
                                  <div className="rounded-lg bg-gray-50 p-0">
                                    <textarea
                                      className="h-24 w-full resize-none rounded border-0 bg-gray-50 p-0 px-2 pt-2 text-sm leading-snug focus:border-0 focus:ring-0"
                                      placeholder="Describe what you're using the agent for..."
                                      value={actionInput}
                                      onChange={(e) =>
                                        setActionInput(e.target.value)
                                      }
                                      tabIndex={10}
                                    />
                                    <div className="flex items-center justify-between px-2 pb-2">
                                      <span className="flex items-center text-xs text-gray-400">
                                        <ExclamationTriangleIcon className="h-5 w-5 pr-1" />
                                        Replaces custom prompt
                                      </span>
                                      <div className="flex items-center">
                                        <Tooltip content="Clear the prompt">
                                          <button
                                            className="mr-1 rounded px-2 py-1 text-xs font-semibold text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
                                            onClick={() => setActionInput('')}
                                            disabled={!actionInput}
                                            tabIndex={12}
                                          >
                                            <XCircleIcon className="h-5 w-5" />
                                          </button>
                                        </Tooltip>
                                        <button
                                          className="rounded bg-cyan-600 px-2 py-0.5 text-sm font-semibold text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                          onClick={generatePrompt}
                                          disabled={isGenerating}
                                          tabIndex={11}
                                        >
                                          {isGenerating
                                            ? 'Generating...'
                                            : 'Create'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Transition>
                            </div>
                          </div>
                          <div className="-mt-1 flex-grow">
                            {activeTab === 'regular' && (
                              <div className="mt-4 h-fit">
                                <label htmlFor="prompt" className="sr-only">
                                  Legacy Prompt
                                </label>
                                <p className="mt-2 text-sm text-gray-500">
                                  Enter any custom instructions here, this will
                                  be used for non-agent mode responses such as
                                  via the widget (with agent mode disabled),
                                  Slack, Automations, or legacy APIs.
                                </p>
                                <div className="mt-2 h-full">
                                  <textarea
                                    id="prompt"
                                    className="block h-full min-h-[28rem] w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="Enter custom instructions..."
                                    value={prompt}
                                    onChange={handlePromptChange}
                                    disabled={isUpdating || !canModify}
                                  />
                                </div>
                              </div>
                            )}
                            {activeTab === 'agent' && (
                              <div className="mt-4 h-full">
                                <label
                                  htmlFor="agentPrompt"
                                  className="sr-only"
                                >
                                  Agent Prompt
                                </label>
                                <div className="">
                                  <PresetPromptSelect
                                    value={selectedPreset}
                                    onChange={handlePresetChange}
                                    disabled={isUpdating || !canModify}
                                    defaultOptionLabel="Select a preset"
                                    defaultOptionDescription="Choose a default role for your agent to customize"
                                  />
                                  {selectedPreset && (
                                    <p className="mt-2 text-sm text-gray-500">
                                      Customize the template below and replace
                                      any variables in {'{curly_braces}'} with
                                      your specific information.
                                    </p>
                                  )}
                                </div>
                                <div className="mt-2">
                                  <textarea
                                    id="agentPrompt"
                                    className="block h-full min-h-96 w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                    placeholder="You must set an agent prompt to use the agent mode. Please choose and customize a preset or use the prompt generator to create your agent mode prompt."
                                    value={agentPrompt}
                                    onChange={handleAgentPromptChange}
                                    disabled={isUpdating || !canModify}
                                  />
                                </div>
                              </div>
                            )}
                            {activeTab === 'helpscout' &&
                              helpScoutIntegration && (
                                <div className="h-full">
                                  <label
                                    htmlFor="helpscoutPrompt"
                                    className="sr-only"
                                  >
                                    Custom Help Scout Prompt
                                  </label>
                                  <div className="mt-1 h-full">
                                    <textarea
                                      id="helpscoutPrompt"
                                      className="block h-full min-h-96 w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                      placeholder="Enter any custom prompt here, this will be used for helpscout responses."
                                      value={hsPrompt}
                                      onChange={handleHSPromptChange}
                                      disabled={isUpdating || !canModify}
                                    />
                                  </div>
                                </div>
                              )}
                          </div>

                          <div className="mt-12 flex justify-end gap-4 sm:mt-8">
                            <button
                              type="button"
                              onClick={handleReset}
                              className={clsx(
                                'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm',
                                !hasUnsavedChanges &&
                                  'cursor-not-allowed opacity-50',
                                !canModify && 'hidden',
                              )}
                              disabled={!hasUnsavedChanges || !canModify}
                            >
                              <ArrowPathIcon
                                className="mr-2 h-5 w-5"
                                aria-hidden="true"
                              />
                              Reset
                            </button>
                            <button
                              type="submit"
                              name="submit-form"
                              ref={saveButtonRef}
                              className={
                                'inline-flex w-1/4 items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm' +
                                (canModify ? '' : ' hidden')
                              }
                              disabled={isUpdating || !canModify}
                            >
                              {!isUpdating ? (
                                <span>Save</span>
                              ) : (
                                <span>
                                  <LoadingSpinner /> Saving...
                                </span>
                              )}
                            </button>
                          </div>
                        </div>

                        {(activeTab === 'regular' || activeTab === 'agent') &&
                          bot.status === 'ready' && (
                            <div className="hidden mb-4 lg:flex h-full flex-col lg:col-span-1 lg:mb-0">
                              <h3 className="text-md mb-2 font-medium">
                                {activeTab === 'agent'
                                  ? 'Test your agent'
                                  : 'Test your bot'}
                              </h3>
                              <div
                                className="relative flex-1"
                                onClick={handleIframeClick}
                              >
                                {hasUnsavedChanges && (
                                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-900 bg-opacity-40 text-white">
                                    <div className="px-4 text-center">
                                      <span className="text-md font-semibold">
                                        Save your changes before testing
                                      </span>
                                    </div>
                                  </div>
                                )}
                                <iframe
                                  src={`https://docsbot.ai/iframe/${team.id}/${bot.id}?agent=${activeTab === 'agent' ? 'true' : 'false'}&signature=${bot.signature}`}
                                  allowTransparency="true"
                                  className={`h-full w-full ${hasUnsavedChanges ? 'opacity-50' : ''}`}
                                ></iframe>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
