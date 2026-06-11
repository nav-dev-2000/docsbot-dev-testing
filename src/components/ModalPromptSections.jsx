import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import {
    ExclamationTriangleIcon,
    SparklesIcon,
    XCircleIcon,
    XMarkIcon,
    ArrowPathIcon,
    BugAntIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline'
import SaveDiskIcon from '@new-dashboard/SaveDiskIcon'
import clsx from 'clsx'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'
import Tooltip from '@/components/Tooltip'
import PresetPromptSelect from '@/components/PresetPromptSelect'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import Workspace from '@new-dashboard/Workspace'
import TipsButton from '@new-dashboard/TipsButton'

export const STREAMDOWN_REMARK_PLUGINS = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

export const DEBUG_LOADING_TEXT = [
    'Analyzing prompt structure...',
    'Identifying behavioral patterns...',
    'Evaluating instruction clarity...',
    'Detecting potential improvements...',
    'Generating optimization suggestions...',
    'Finalizing recommendations...',
]

export function InstructionHeader({ bot, className }) {
    return (
        <Workspace.Header
            title="Custom Instructions"
            description="Adjust how your agent responds — set its tone, behavior, and context for every answer. Start by selecting a preset, or generate your own."
            className={className}
        >
            <TipsButton position="right">
                <div className="text-gray-500">
                    <p className="text-sm font-semibold text-gray-800">
                        Example Custom Prompts
                    </p>
                    <div className="mt-2">
                        <ul className="ml-0 list-disc space-y-2 pl-4 text-sm text-gray-700">
                            <li className="text-sm text-gray-700">
                                <code>
                                    Politely refuse to answer questions
                                    unrelated to {bot.name}.
                                </code>
                            </li>
                            <li className="text-sm text-gray-700">
                                <code>
                                    Use \[...\] for block math and \(...\) for
                                    inline math in your response.
                                </code>{' '}
                                (for pretty display of equations)
                            </li>
                            <li className="text-sm text-gray-700">
                                <code>
                                    If relevant to the user&apos;s question,
                                    after your answer, suggest my book &quot;
                                    {bot.name} For Dummies&quot;.
                                </code>
                            </li>
                            <li className="text-sm text-gray-700">
                                <code>
                                    If the answer is not in the provided context,
                                    recommend they contact the {bot.name}{' '}
                                    support team and provide a link to
                                    https://mysite.com/support/
                                </code>
                            </li>
                            <li className="text-sm text-gray-700">
                                <code>
                                    Always respond as if you are Pee-wee Herman.
                                </code>
                            </li>
                        </ul>
                    </div>
                </div>
            </TipsButton>
        </Workspace.Header>
    )
}

export function InstructionsAlert({ errorText, successText, className }) {
    if (!errorText && !successText) return null

    return (
        <div className={clsx('flex flex-col gap-4', className)}>
            {errorText && <Alert title={errorText} type="error" />}
            {successText && <Alert title={successText} type="success" />}
        </div>
    )
}

export function InstructionsTabs({ tabs, onSelectTab, className }) {
    return (
        <nav
            className={clsx('-mb-px flex space-x-8', className)}
            aria-label="Tabs"
        >
            {tabs.map((tab) => (
                <a
                    key={tab.name}
                    onClick={() => !tab.disabled && onSelectTab(tab.id)}
                    className={clsx(
                        {
                            ['border-cyan-500 text-cyan-600']: tab.current,
                            ['border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700']:
                                !tab.current,
                        },
                        'cursor-pointer whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium',
                        {
                            ['cursor-not-allowed opacity-50']: tab.disabled,
                        },
                    )}
                    aria-current={tab.current ? 'page' : undefined}
                >
                    {tab.name}
                </a>
            ))}
        </nav>
    )
}

export function InstructionsRegular({
    className,
    prompt,
    onPromptChange,
    isUpdating,
    canModify,
}) {
    return (
        <div
            className={clsx('flex min-h-0 flex-1 flex-col', className)}
        >
            <label htmlFor="prompt" className="sr-only">
                Legacy Prompt
            </label>

            <p className="mt-2 shrink-0 text-sm text-gray-500">
                Enter any custom instructions here, this will be used for
                non-agent mode responses such as via the widget (with agent mode
                disabled), Slack, Automations, or legacy APIs.
            </p>

            <div className="mt-2 flex min-h-0 flex-1 flex-col">
                <textarea
                    id="prompt"
                    className="block min-h-[14rem] w-full flex-1 resize-y rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                    placeholder="Enter custom instructions..."
                    value={prompt}
                    onChange={onPromptChange}
                    disabled={isUpdating || !canModify}
                />
            </div>
        </div>
    )
}

export function InstructionsAgent({
    className,
    selectedPreset,
    onPresetChange,
    agentPrompt,
    onAgentPromptChange,
    agentPromptRef,
    instructionToolNames,
    onInsertTool,
    isUpdating,
    canModify,
    isModalMode,
}) {
    return (
        <div
            className={clsx('flex min-h-0 flex-1 flex-col', className)}
        >
            <label htmlFor="agentPrompt" className="sr-only">
                Agent Prompt
            </label>

            <div className="shrink-0">
                <PresetPromptSelect
                    value={selectedPreset}
                    onChange={onPresetChange}
                    disabled={isUpdating || !canModify}
                    defaultOptionLabel="Select a preset"
                    defaultOptionDescription="Choose a default role for your agent to customize"
                />

                {selectedPreset && (
                    <p className="mt-2 text-sm text-gray-500">
                        Customize the template below and replace any variables in{' '}
                        {'{curly_braces}'} with your specific information.
                    </p>
                )}
            </div>

            <div className="mt-4 shrink-0">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Enabled Tools
                </p>

                <p className="mt-1 text-xs text-gray-500">
                    Reference these enabled tools in your instructions to customize
                    when the agent should call them. Click a tool name to insert it
                    at the cursor.
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                    {instructionToolNames.map((toolName) => (
                        <button
                            key={toolName}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => onInsertTool(toolName)}
                            className="inline-flex shrink-0 items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-medium text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        >
                            <code>{toolName}</code>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 flex-col">
                <textarea
                    id="agentPrompt"
                    ref={agentPromptRef}
                    className={clsx(
                        'block w-full flex-1 resize-y rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm',
                        {
                            ['min-h-[10rem]']: isModalMode,
                            ['min-h-[14rem]']: !isModalMode,
                        },
                    )}
                    placeholder="You must set an agent prompt to use the agent mode. Please choose and customize a preset or use the prompt generator to create your agent mode prompt."
                    value={agentPrompt}
                    onChange={onAgentPromptChange}
                    disabled={isUpdating || !canModify}
                />
            </div>
        </div>
    )
}

export function InstructionsHelpscout({
    className,
    hsPrompt,
    onHSPromptChange,
    onUseTemplate,
    isUpdating,
    canModify,
}) {
    return (
        <div
            className={clsx('flex min-h-0 flex-1 flex-col', className)}
        >
            <label htmlFor="helpscoutPrompt" className="sr-only">
                Custom Help Scout Prompt
            </label>

            <div className="mb-2 flex shrink-0 items-center justify-between">
                <Tooltip
                    content='<div class="text-sm"><p class="mb-2 font-semibold">Simply prompt for what it should not respond to</p><p class="text-gray-300">For example: Vacation or ticket auto-responders, spam emails, sales emails</p></div>'
                    placement="top"
                >
                    <span className="inline-flex cursor-help items-center gap-1.5 rounded-full bg-cyan-100 px-3 py-1 text-xs font-medium text-cyan-800">
                        <span className="relative flex h-2 w-2">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75"></span>
                            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-500"></span>
                        </span>

                        New: Ability to prompt the AI when it should not respond
                    </span>
                </Tooltip>

                <button
                    type="button"
                    onClick={onUseTemplate}
                    disabled={isUpdating || !canModify}
                    className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Use Recommended Template
                </button>
            </div>

            <div className="mt-2 flex min-h-0 flex-1 flex-col">
                <textarea
                    id="helpscoutPrompt"
                    className="block min-h-48 w-full flex-1 resize-y rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                    placeholder="Enter any custom prompt here, this will be used for helpscout responses."
                    value={hsPrompt}
                    onChange={onHSPromptChange}
                    disabled={isUpdating || !canModify}
                />
            </div>
        </div>
    )
}

export function InstructionsDebugAction({ onOpen, className }) {
    return (
        <Tooltip content="Debug your prompt behavior">
            <button
                type="button"
                onClick={onOpen}
                className={clsx(
                    'my-2 inline-flex items-center rounded-lg border border-transparent px-2 py-1 text-gray-400 ring-inset hover:text-gray-500 hover:outline-none hover:ring-2 hover:ring-gray-400',
                    className,
                )}
            >
                <BugAntIcon className="mr-1 h-5 w-5" />

                <span className="hidden sm:inline">Debug</span>
            </button>
        </Tooltip>
    )
}

export function InstructionsGenerateAction({
    className,
    activeTab,
    showGeneratePopover,
    onToggleGeneratePopover,
    buttonRef,
    popoverRef,
    actionInput,
    onActionInputChange,
    onClearActionInput,
    isGenerating,
    onGeneratePrompt,
}) {
    if (activeTab !== 'agent' && activeTab !== 'helpscout') {
        return (
            <>
                <Tooltip content="Generate or improve your prompt">
                    <button
                        ref={buttonRef}
                        type="button"
                        onClick={onToggleGeneratePopover}
                        disabled={isGenerating}
                        className={clsx(
                            'my-2 inline-flex items-center rounded-lg border border-transparent px-2 py-1 text-gray-400 ring-inset hover:text-gray-500 hover:outline-none hover:ring-2 hover:ring-gray-400',
                            className,
                        )}
                    >
                        <SparklesIcon
                            className={clsx(
                                'mr-1 h-5 w-5',
                                isGenerating && 'animate-ping',
                            )}
                        />{' '}

                        <span className="hidden sm:inline">
                            {showGeneratePopover ? 'Cancel' : 'Generate'}
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
                                onChange={onActionInputChange}
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
                                            onClick={onClearActionInput}
                                            disabled={!actionInput}
                                            tabIndex={12}
                                        >
                                            <XCircleIcon className="h-5 w-5" />
                                        </button>
                                    </Tooltip>

                                    <button
                                        className="rounded bg-cyan-600 px-2 py-0.5 text-sm font-semibold text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                        onClick={onGeneratePrompt}
                                        disabled={isGenerating}
                                        tabIndex={11}
                                    >
                                        {isGenerating ? 'Generating...' : 'Create'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Transition>
            </>
        )
    }

    return null
}

export function InstructionsFooter({
    className,
    canEditInstructions,
    isModalMode,
    onReset,
    hasUnsavedChanges,
    canModify,
    isUpdating,
    saveButtonRef,
}) {
    return (
        <div
            className={clsx(
                'flex justify-end gap-4 border-t border-gray-200',
                {
                    ['xl:col-start-1 xl:row-start-2']: canEditInstructions,
                    ['pt-4']: isModalMode,
                    ['p-4']: !isModalMode,
                },
                className,
            )}
        >
            <button
                type="button"
                onClick={onReset}
                className={clsx(
                    'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm',
                    !hasUnsavedChanges && 'cursor-not-allowed opacity-50',
                    !canModify && 'hidden',
                )}
                disabled={!hasUnsavedChanges || !canModify}
            >
                <ArrowPathIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Reset
            </button>

            <button
                type="submit"
                name="submit-form"
                ref={saveButtonRef}
                className={
                    'inline-flex w-auto min-w-[9.5rem] items-center justify-center gap-2 whitespace-nowrap rounded-md border border-cyan-600 bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm transition-all duration-200 hover:bg-cyan-700 hover:border-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-75 sm:text-sm' +
                    (canModify ? '' : ' hidden')
                }
                disabled={isUpdating || !canModify}
            >
                {!isUpdating ? (
                    <>
                        <SaveDiskIcon className="size-4 shrink-0" aria-hidden />
                        Save Changes
                    </>
                ) : (
                    <>
                        <LoadingSpinner /> Saving...
                    </>
                )}
            </button>
        </div>
    )
}

export function InstructionsForm(props) {
    const {
        isModalMode,
        activeTab,
        helpScoutIntegration,
        onSubmit,
        tabs,
        onSelectTab,
        errorText,
        successText,
        prompt,
        onPromptChange,
        selectedPreset,
        onPresetChange,
        agentPrompt,
        onAgentPromptChange,
        agentPromptRef,
        instructionToolNames,
        onInsertAgentTool,
        hsPrompt,
        onHSPromptChange,
        onUseHelpScoutTemplate,
        isUpdating,
        canModify,
        onOpenDebugModal,
        showGeneratePopover,
        onToggleGeneratePopover,
        buttonRef,
        popoverRef,
        actionInput,
        onActionInputChange,
        onClearActionInput,
        isGenerating,
        onGeneratePrompt,
        canEditInstructions,
        onReset,
        hasUnsavedChanges,
        saveButtonRef,
    } = props

    return (
        <form
            className="h-full min-h-0 flex flex-1 flex-col gap-4 md:gap-6"
            onSubmit={(e) => {
                e.preventDefault()
                onSubmit()
            }}
        >
            <div
                className={clsx(
                    'h-full min-h-0 flex flex-1 flex-col',
                    isModalMode && 'pt-4',
                )}
            >
                <div
                    className={clsx(
                        'flex flex-none justify-between border-b border-gray-200',
                        !isModalMode && 'px-4',
                    )}
                >
                    <InstructionsTabs tabs={tabs} onSelectTab={onSelectTab} />

                    <div className="relative flex items-center space-x-2">
                        <InstructionsDebugAction onOpen={onOpenDebugModal} />
                        <InstructionsGenerateAction
                            activeTab={activeTab}
                            showGeneratePopover={showGeneratePopover}
                            onToggleGeneratePopover={onToggleGeneratePopover}
                            buttonRef={buttonRef}
                            popoverRef={popoverRef}
                            actionInput={actionInput}
                            onActionInputChange={onActionInputChange}
                            onClearActionInput={onClearActionInput}
                            isGenerating={isGenerating}
                            onGeneratePrompt={onGeneratePrompt}
                        />
                    </div>
                </div>

                <InstructionsAlert
                    errorText={errorText}
                    successText={successText}
                    className="flex-none"
                />

                <div
                    className={clsx(
                        'flex min-h-0 flex-1 flex-col overflow-y-auto',
                        {
                            ['gap-4 py-2']: isModalMode,
                            ['gap-4 p-4']: !isModalMode,
                        },
                    )}
                >
                    {activeTab === 'regular' && (
                        <InstructionsRegular
                            prompt={prompt}
                            onPromptChange={onPromptChange}
                            isUpdating={isUpdating}
                            canModify={canModify}
                        />
                    )}
                    {activeTab === 'agent' && (
                        <InstructionsAgent
                            selectedPreset={selectedPreset}
                            onPresetChange={onPresetChange}
                            agentPrompt={agentPrompt}
                            onAgentPromptChange={onAgentPromptChange}
                            agentPromptRef={agentPromptRef}
                            instructionToolNames={instructionToolNames}
                            onInsertTool={onInsertAgentTool}
                            isUpdating={isUpdating}
                            canModify={canModify}
                            isModalMode={isModalMode}
                        />
                    )}
                    {activeTab === 'helpscout' && helpScoutIntegration && (
                        <InstructionsHelpscout
                            hsPrompt={hsPrompt}
                            onHSPromptChange={onHSPromptChange}
                            onUseTemplate={onUseHelpScoutTemplate}
                            isUpdating={isUpdating}
                            canModify={canModify}
                        />
                    )}
                </div>
            </div>

            <InstructionsFooter
                canEditInstructions={canEditInstructions}
                isModalMode={isModalMode}
                onReset={onReset}
                hasUnsavedChanges={hasUnsavedChanges}
                canModify={canModify}
                isUpdating={isUpdating}
                saveButtonRef={saveButtonRef}
            />
        </form>
    )
}

export function InstructionsPreview({
    team,
    bot,
    activeTab,
    hasUnsavedChanges,
    onIframeClick,
}) {
    const frameMask = (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-gray-900 bg-opacity-40 text-white">
            <div className="px-4 text-center">
                <span className="text-md font-semibold">
                    Save your changes before testing
                </span>
            </div>
        </div>
    )

    const frameContent = (
        <iframe
            src={`${
                process.env.NODE_ENV === 'development'
                    ? `http://localhost:3000/iframe/${team.id}/${bot.id}`
                    : `https://docsbot.ai/iframe/${team.id}/${bot.id}`
            }?agent=${
                activeTab === 'agent' ? 'true' : 'false'
            }&signature=${bot.signature}&testing=true`}
            allow="microphone; camera"
            className={clsx('h-full min-h-0 w-full', {
                ['pointer-events-none opacity-50']: hasUnsavedChanges,
            })}
        />
    )

    return (
        <div className="flex w-full min-h-[600px] flex-none flex-col xl:h-full xl:max-w-[448px]">
            <h3 className="text-md mb-2 shrink-0 flex-none font-medium">
                {activeTab === 'agent' ? 'Test your agent' : 'Test your bot'}
            </h3>

            <div
                className="relative flex min-h-[600px] flex-1 flex-col xl:h-full"
                onClick={onIframeClick}
            >
                {hasUnsavedChanges && frameMask}
                {frameContent}
            </div>
        </div>
    )
}

export function InstructionsDebugModal({
    show,
    onClose,
    errorText,
    debugDesiredBehavior,
    onDebugDesiredBehaviorChange,
    debugUndesiredBehavior,
    onDebugUndesiredBehaviorChange,
    debugSelectedImages,
    onDebugImageSelect,
    onRemoveDebugImage,
    debugFileInputRef,
    onTriggerFileInput,
    isDebugging,
    debugLoadingIndex,
    debugAnalysis,
    onAnalyzeAnother,
    onAnalyze,
}) {
    return (
        <Transition.Root show={show} as={Fragment}>
            <Dialog as="div" className="relative z-modal" onClose={onClose}>
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

                <div className="fixed inset-0 z-modal overflow-y-auto">
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
                            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                        onClick={onClose}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon
                                            className="h-6 w-6"
                                            aria-hidden="true"
                                        />
                                    </button>
                                </div>

                                <div className="">
                                    <Dialog.Title
                                        as="h3"
                                        className="mb-4 text-xl font-medium leading-6 text-gray-900"
                                    >
                                        <div className="flex items-center">
                                            <BugAntIcon className="mr-2 h-6 w-6 text-cyan-600" />
                                            <span>Debug Prompt Behavior</span>
                                        </div>
                                    </Dialog.Title>

                                    <Alert title={errorText} type="error" />

                                    {!debugAnalysis ? (
                                        <div className="space-y-4">
                                            {!isDebugging ? (
                                                <>
                                                    <p className="text-sm text-gray-600">
                                                        Describe what you want your
                                                        agent to do versus what
                                                        it&apos;s actually doing.
                                                        Our AI will analyze your
                                                        prompt/instructions and
                                                        suggest specific
                                                        improvements.
                                                    </p>

                                                    <div>
                                                        <label
                                                            htmlFor="desired-behavior"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            What should your bot
                                                            do?{' '}
                                                            <span className="text-gray-400">
                                                                (Optional)
                                                            </span>
                                                        </label>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Describe the desired
                                                            behavior (e.g.,
                                                            &quot;answer questions
                                                            professionally and
                                                            cite sources&quot;)
                                                        </p>
                                                        <textarea
                                                            id="desired-behavior"
                                                            rows={3}
                                                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                                            placeholder="Describe what you want your bot to do (optional)..."
                                                            value={debugDesiredBehavior}
                                                            onChange={
                                                                onDebugDesiredBehaviorChange
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor="undesired-behavior"
                                                            className="block text-sm font-medium text-gray-700"
                                                        >
                                                            What is your bot doing
                                                            wrong?{' '}
                                                            <span className="text-gray-400">
                                                                (Optional)
                                                            </span>
                                                        </label>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Describe the
                                                            problematic behavior
                                                            (e.g., &quot;gives
                                                            generic answers
                                                            without using provided
                                                            context&quot;)
                                                        </p>
                                                        <textarea
                                                            id="undesired-behavior"
                                                            rows={3}
                                                            className="mt-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                                                            placeholder="Describe what your bot is doing wrong (optional)..."
                                                            value={
                                                                debugUndesiredBehavior
                                                            }
                                                            onChange={
                                                                onDebugUndesiredBehaviorChange
                                                            }
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            Screenshots (Optional)
                                                        </label>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            Upload any conversation
                                                            screenshots to help
                                                            illustrate the issue
                                                        </p>

                                                        <input
                                                            type="file"
                                                            ref={debugFileInputRef}
                                                            onChange={
                                                                onDebugImageSelect
                                                            }
                                                            accept="image/*"
                                                            multiple
                                                            className="hidden"
                                                        />

                                                        <div className="mt-2">
                                                            <button
                                                                type="button"
                                                                onClick={
                                                                    onTriggerFileInput
                                                                }
                                                                disabled={
                                                                    debugSelectedImages.length >=
                                                                    4
                                                                }
                                                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50"
                                                            >
                                                                <PhotoIcon className="mr-2 h-4 w-4" />
                                                                Add Screenshot
                                                            </button>
                                                            {debugSelectedImages.length >
                                                                0 && (
                                                                <p className="mt-1 text-xs text-gray-500">
                                                                    {
                                                                        debugSelectedImages.length
                                                                    }
                                                                    /4 images
                                                                    selected
                                                                </p>
                                                            )}
                                                        </div>

                                                        {debugSelectedImages.length >
                                                            0 && (
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {debugSelectedImages.map(
                                                                    (
                                                                        image,
                                                                        index,
                                                                    ) => (
                                                                        <div
                                                                            key={
                                                                                index
                                                                            }
                                                                            className="relative"
                                                                        >
                                                                            <img
                                                                                src={
                                                                                    image.url
                                                                                }
                                                                                alt={`Screenshot ${index + 1}`}
                                                                                className="h-20 w-20 rounded-lg object-cover"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    onRemoveDebugImage(
                                                                                        index,
                                                                                    )
                                                                                }
                                                                                className="absolute -right-1 -top-1 rounded-full bg-gray-500 p-1 text-white hover:bg-gray-600"
                                                                            >
                                                                                <XMarkIcon className="h-3 w-3" />
                                                                            </button>
                                                                        </div>
                                                                    ),
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex justify-end space-x-3 pt-4">
                                                        <button
                                                            type="button"
                                                            className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:text-sm"
                                                            onClick={onClose}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 align-middle text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:opacity-50 sm:text-sm"
                                                            onClick={onAnalyze}
                                                            disabled={
                                                                isDebugging ||
                                                                (!debugDesiredBehavior.trim() &&
                                                                    !debugUndesiredBehavior.trim())
                                                            }
                                                        >
                                                            Analyze Prompt
                                                        </button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-8 text-center">
                                                    <LoadingSpinner />
                                                    <p className="mt-4 animate-pulse text-gray-600">
                                                        {
                                                            DEBUG_LOADING_TEXT[
                                                                debugLoadingIndex
                                                            ]
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div>
                                                <h4 className="mb-3 text-lg font-medium text-gray-900">
                                                    Analysis & Suggestions
                                                </h4>
                                                <div className="max-w-none rounded-lg border bg-gray-50 p-4">
                                                    <Streamdown
                                                        mode="static"
                                                        isAnimating={false}
                                                        remarkPlugins={
                                                            STREAMDOWN_REMARK_PLUGINS
                                                        }
                                                    >
                                                        {preprocessMath(
                                                            debugAnalysis,
                                                        )}
                                                    </Streamdown>
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-3 pt-4">
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:text-sm"
                                                    onClick={onClose}
                                                >
                                                    Close
                                                </button>
                                                <button
                                                    type="button"
                                                    className="inline-flex justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 sm:text-sm"
                                                    onClick={onAnalyzeAnother}
                                                >
                                                    Analyze Another Issue
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
