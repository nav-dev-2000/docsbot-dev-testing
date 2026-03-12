import { useEffect, useRef, useState, useCallback } from 'react'
import { checkPlanPermission } from '@/utils/helpers'
import { useModelSelector } from '@/components/ModelSelector/ModelSelector.hooks'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import { i18n } from '@/constants/strings.constants'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { canUserCreateDeleteBot, canUserManageBotSettings } from '@/utils/function.utils'

import Link from 'next/link'
import ModalCheckout from '@/components/ModalCheckout'
import FieldToggle from '@/components/FieldToggle'
import RadioBox from '@new-dashboard/RadioBox'
import Box from '@new-dashboard/Box'
import Note from '@new-dashboard/Note'
import FormField from '@new-dashboard/FormField'

import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import {
    AcademicCapIcon,
    AdjustmentsHorizontalIcon,
    ClockIcon,
    IdentificationIcon,
    QuestionMarkCircleIcon,
    Squares2X2Icon,
} from '@heroicons/react/24/outline'

const AVAILABLE_MODELS = [
    {
        id: 'gpt-5-4',
        value: 'gpt-5.4',
        title: 'GPT-5.4',
        description:
            'Latest flagship with long-context, strong tool use, and adaptive reasoning.',
        status: 'Newest Frontier',
        capabilities: { powerful: true },
        hasVerification: true,
    },
    {
        id: 'gpt-5-2',
        value: 'gpt-5.2',
        title: 'GPT-5.2',
        description:
            'Previous flagship tuned for long-context work, stronger tool use, and adaptive reasoning.',
        status: 'recommended',
        hasVerification: true,
    },
    {
        id: 'gpt-5-1',
        value: 'gpt-5.1',
        title: 'GPT-5.1',
        description:
            'Previous flagship with adaptive reasoning and fast responses for complex tasks.',
        hasVerification: true,
    },
    {
        id: 'gpt-5',
        value: 'gpt-5',
        title: 'GPT-5',
        description:
            'Smartest, fastest, most useful model yet, with thinking built in — so you get the best answer, every time.',
        capabilities: { generalPurpose: true },
        hasVerification: true,
    },
    {
        id: 'gpt-4.1',
        value: 'gpt-4.1',
        title: 'GPT-4.1',
        description: 'Previous generation model good at instruction following.',
    },
    {
        id: 'gpt-5-mini',
        value: 'gpt-5-mini',
        title: 'GPT-5 mini',
        description:
            'Smart, fast, and useful model. Good for most support use cases.',
        status: 'recommended',
        capabilities: { best: true },
        hasVerification: true,
    },
    {
        id: 'gpt-4.1-mini',
        value: 'gpt-4.1-mini',
        title: 'GPT-4.1 mini',
        description:
            'Faster than GPT-4.1 while still good at instruction following.',
    },
    {
        id: 'gpt-5-nano',
        value: 'gpt-5-nano',
        title: 'GPT-5 nano',
        description:
            'Included in all plans. Affordable & extremely fast model.',
        capabilities: {
            fast: true,
            costEffective: true,
        },
    },
    {
        id: 'gpt-4.1-nano',
        value: 'gpt-4.1-nano',
        title: 'GPT-4.1 nano',
        description:
            'Previous generation model. We recommend upgrading to at least GPT-4.1 mini.',
    },
    {
        id: 'gpt-4.5-preview',
        value: 'gpt-4.5-preview',
        title: 'GPT-4.5',
        description:
            'Very slow, expensive ($0.27/question), and low rate limits. Not recommended for most use cases.',
        expirationDate: 'June 2025',
        status: 'notRecommended',
    },
    {
        id: 'gpt-4o',
        value: 'gpt-4o',
        title: 'GPT-4o',
        description:
            'Previous generation general purpose model. Consider upgrading to GPT-4.1.',
    },
    {
        id: 'gpt-4o-mini',
        value: 'gpt-4o-mini',
        title: 'GPT-4o mini',
        description:
            'Previous generation model. Consider upgrading to GPT-4.1 mini.',
    },
    {
        id: 'gpt-4-turbo',
        value: 'gpt-4-turbo',
        title: 'GPT-4 Turbo',
        description:
            'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-4',
        value: 'gpt-4',
        title: 'GPT-4',
        description:
            'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo',
        value: 'gpt-3.5-turbo',
        title: 'GPT 3.5 Turbo',
        description:
            'Previous generation model. Recommend upgrading to GPT-4.1.',
        lifecycle: { legacy: true },
    },
    {
        id: 'gpt-3.5-turbo-0613',
        value: 'gpt-3.5-turbo-0613',
        title: 'GPT 3.5 Turbo',
        description:
            'The legacy June 2023 snapshot of GPT-3.5 Turbo, succeeded by more efficient versions.',
        status: 'notRecommended',
        expirationDate: 'June 2024',
    },
]

export const getModelLabel = (modelId) =>
    AVAILABLE_MODELS.find((m) => m.value === modelId)?.title ?? modelId

const MODELS_REQUIRING_OPENAI_KEY = [
    'gpt-5.4',
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5',
    'gpt-4.1',
    'gpt-4o',
]

/** Models available without an OpenAI API key (show "Included" label when no key is set) */
const MODELS_INCLUDED_WITHOUT_KEY = [
    'gpt-5-nano',
    'gpt-5-mini',
    'gpt-4o-mini',
    'gpt-4.1-mini',
    'gpt-4.1-nano',
]

export default function FormBot({
    team,
    bot,
    setBotSettings,
    disabled,
    short = false,
    onOpenAIKeyRequired,
}) {
    const [user] = useAuthState(auth)

    const defaultModel = 'gpt-5-mini'
    const [language, setLanguage] = useState(bot?.language || 'en')
    const [botName, setBotName] = useState(bot?.name || '')
    const [botDescription, setBotDescription] = useState(bot?.description || '')
    const [privacy, setPrivacy] = useState(bot?.privacy || 'public')
    const [model, setModel] = useState(bot?.model || defaultModel)
    const [questions, setQuestions] = useState(bot?.questions || [])
    const [glossary, setGlossary] = useState(bot?.glossary || [])
    const [rateLimitMessages, setRateLimitMessages] = useState(
        bot?.rateLimitMessages || 10,
    )
    const [labels, setLabels] = useState(
        bot?.labels || i18n[bot?.language]?.labels || null,
    )
    const [rateLimitSeconds, setRateLimitSeconds] = useState(
        bot?.rateLimitSeconds || 60,
    )
    const [rateLimitIPAllowlist, setRateLimitIPAllowlist] = useState(
        bot?.rateLimitIPAllowlist || [],
    )
    const [rateLimitIPField, setRateLimitIPField] = useState(
        bot?.rateLimitIPAllowlist?.join(', ') || '',
    )
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [recordIP, setRecordIP] = useState(bot?.recordIP || false)
    const [temperature, setTemperature] = useState(bot?.temperature || 0)
    const [agentPrompt, setAgentPrompt] = useState(bot?.agentPrompt || '')
    const [agentRole, setAgentRole] = useState(bot?.agentRole || '')

    const { modelVisibility, setModel: applyModelChange } = useModelSelector({
        team,
        model,
        defaultModel,
        onModelChange: setModel,
        short,
    })

    // Sync labels to new language when user changes language (skip initial mount to preserve custom labels)
    const isInitialMount = useRef(true)
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false
            return
        }
        if (language && i18n[language]?.labels) {
            setLabels(i18n[language].labels)
        }
    }, [language])

    useEffect(() => {
        setBotSettings({
            language,
            name: botName,
            description: botDescription,
            privacy,
            model,
            questions,
            glossary,
            rateLimitMessages,
            rateLimitSeconds,
            rateLimitIPAllowlist,
            labels,
            recordIP,
            classify: true,
            temperature,
            agentPrompt,
        })
    }, [
        language,
        botName,
        botDescription,
        privacy,
        model,
        questions,
        glossary,
        rateLimitMessages,
        rateLimitSeconds,
        rateLimitIPAllowlist,
        labels,
        recordIP,
        temperature,
        agentPrompt,
    ])

    // Update agentPrompt when botName changes if a preset role is selected
    useEffect(() => {
        // Don't allow HELPSCOUT preset for agent prompts
        if (
            agentRole &&
            agentRole !== 'HELPSCOUT' &&
            PRESET_PROMPTS[agentRole]
        ) {
            setAgentPrompt(
                (PRESET_PROMPTS[agentRole]?.prompt || '')
                    .replace(/{company_name}/g, botName)
                    .replace(/{old_prompt}\n/g, '')
                    .replace(/{old_prompt}/g, ''),
            )
        }
    }, [botName, agentRole])

    //show upgrade if they change privacy to private
    useEffect(() => {
        if (
            privacy === 'private' &&
            !checkPlanPermission(team, 'hobby').allowed
        ) {
            setShowUpgrade(true)
            setPrivacy('public')
        }
    }, [privacy])

    // Revert model and/or show upgrade when selecting a model that requires OpenAI key or higher plan
    useEffect(() => {
        // For users on the personal plan:
        // - They should be able to select gpt-5-mini, gpt-5-nano, gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini without any issues
        // - Only show upgrade for key-required models if they don't have supportsGPT4
        if (!checkPlanPermission(team, 'personal').allowed) {
            // free or hobby plan
            if (
                [
                    ...MODELS_REQUIRING_OPENAI_KEY,
                    'gpt-5-nano',
                ].includes(model)
            ) {
                setShowUpgrade(true)
                setModel('gpt-4.1-mini')
                console.log(
                    'Setting default free/hobby plan model to gpt-4.1-mini',
                )
            }
        } else {
            // For paid plan users (personal and above): if they select a model that requires an OpenAI key but they don't have one, revert and open the add-key modal
            if (
                MODELS_REQUIRING_OPENAI_KEY.includes(model) &&
                !team.openAIKey
            ) {
                setModel('gpt-5-mini')
                onOpenAIKeyRequired?.()
                console.log(
                    'Reverting to gpt-5-mini for paid plan user without OpenAI key',
                )
            }
        }
    }, [model, team, checkPlanPermission, onOpenAIKeyRequired])

    useEffect(() => {
        //check for valid IPv4 and IPv6 addresses
        const ipArray = rateLimitIPField
            .split(',')
            .map((ip) => ip.trim())
            .filter((ip) => {
                if (ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
                    return true
                } else if (
                    ip.match(/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
                ) {
                    //does not support shorthand notation
                    return true
                }
                return false
            })
        setRateLimitIPAllowlist(ipArray)
    }, [rateLimitIPField])

    return (
        <>
            <ModalCheckout
                team={team}
                open={showUpgrade}
                setOpen={setShowUpgrade}
            />

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Box
                    title="Basic Information"
                    icon={IdentificationIcon}
                    canToggle="md"
                    className="col-span-1"
                >
                    <FormField
                        label="Name"
                        note="What would you like to call your bot?"
                        htmlFor="project-name"
                    >
                        <input
                            type="text"
                            name="project-name"
                            id="project-name"
                            value={botName}
                            onChange={(e) => setBotName(e.target.value)}
                            disabled={disabled}
                            placeholder="What would you like to call your bot?"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                        />
                    </FormField>

                    <FormField
                        label="Description (optional)"
                        note="This is an internal description of your bot, not a prompt or instructions."
                        htmlFor="description"
                    >
                        <textarea
                            id="description"
                            name="description"
                            placeholder="This is an internal description of your bot, not a prompt or instructions."
                            rows={4}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
                            value={botDescription}
                            disabled={disabled}
                            onChange={(e) => setBotDescription(e.target.value)}
                        />
                    </FormField>

                    <FormField
                        label="Language"
                        note="Sets the default language for prompts and widget labels. The bot will still detect and respond in the language used in messages."
                        htmlFor="language"
                    >
                        <select
                            id="language"
                            name="language"
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-600 sm:text-sm sm:leading-6"
                            defaultValue={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            disabled={disabled}
                        >
                            {Object.keys(i18n).map((key) => (
                                <option key={key} value={key}>
                                    {i18n[key].name}
                                </option>
                            ))}
                        </select>
                    </FormField>

                </Box>

                <Box
                    title="Agent Setup"
                    icon={AdjustmentsHorizontalIcon}
                    canToggle="md"
                    className="col-span-1"
                >
                    <FormField
                        label="Privacy"
                        note="Sets the bot visibility for the users."
                        htmlFor="privacy"
                    >
                        <select
                            id="privacy"
                            name="privacy"
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-600 sm:text-sm sm:leading-6"
                            value={privacy}
                            onChange={(e) => setPrivacy(e.target.value)}
                            disabled={disabled}
                        >
                            <option value="public">Public access</option>
                            <option value="private">
                                Private
                                {!checkPlanPermission(team, 'hobby').allowed
                                    ? ' (Paid)'
                                    : ''}
                            </option>
                        </select>

                        <Note>
                            {privacy === 'public' &&
                                'The chosen settings allows for embedding on the frontend of websites.'}

                            {privacy === 'private' && (
                                <>
                                    The chosen settings requires{' '}
                                    <strong>Authenticated API</strong> access
                                    only. Good for internal company content.
                                </>
                            )}
                        </Note>
                    </FormField>

                    <FormField
                        label="Temperature"
                        labelTag="h4"
                        note="Controls how creative vs precise the bot’s responses are. Lower values (closer to 0) make responses more focused and predictable, while higher values make them more creative and varied."
                    >
                        {model.startsWith('gpt-5') && (
                            <Note>
                                This settings are not available for the chosen
                                model.
                            </Note>
                        )}

                        {!model.startsWith('gpt-5') && (
                            <div className="mt-2">
                                <input
                                    type="range"
                                    name="temperature"
                                    id="temperature"
                                    min="0"
                                    max="1"
                                    step="0.1"
                                    value={temperature}
                                    onChange={(e) =>
                                        setTemperature(
                                            parseFloat(e.target.value),
                                        )
                                    }
                                    disabled={disabled}
                                    className="transparent h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-600"
                                />
                                <div className="mt-1 flex justify-between text-xs text-gray-500">
                                    <span>Predictable</span>
                                    <span className="text-center font-semibold">
                                        {temperature === Math.floor(temperature)
                                            ? temperature.toFixed(0)
                                            : temperature.toFixed(1)}
                                    </span>
                                    <span>Creative</span>
                                </div>
                            </div>
                        )}
                    </FormField>
                </Box>

                <Box
                    icon={ClockIcon}
                    title="Rate Limiting"
                    tag={
                        !checkPlanPermission(team, 'business').allowed
                            ? checkPlanPermission(team, 'business')
                                  .requiredPlanLabel
                            : ''
                    }
                    description="Through rate limiting you can prevent the abouse of your bot and excessive OpenAI usage costs."
                    canToggle="md"
                    className="col-span-1"
                >
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-4">
                            <FormField
                                label="Max Messages"
                                htmlFor="rateLimitMessages"
                            >
                                <input
                                    type="number"
                                    min={1}
                                    name="rateLimitMessages"
                                    id="rateLimitMessages"
                                    value={rateLimitMessages}
                                    onChange={(e) =>
                                        setRateLimitMessages(e.target.value)
                                    }
                                    disabled={
                                        disabled ||
                                        !checkPlanPermission(team, 'business')
                                            .allowed
                                    }
                                    aria-describedby="rateLimitMessages-description"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                                />
                            </FormField>

                            <FormField
                                label="Seconds"
                                htmlFor="rateLimitSeconds"
                            >
                                <input
                                    type="number"
                                    min={1}
                                    name="rateLimitSeconds"
                                    id="rateLimitSeconds"
                                    value={rateLimitSeconds}
                                    onChange={(e) =>
                                        setRateLimitSeconds(e.target.value)
                                    }
                                    disabled={
                                        disabled ||
                                        !checkPlanPermission(team, 'business')
                                            .allowed
                                    }
                                    aria-describedby="rateLimitSeconds-description"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                                />
                            </FormField>
                        </div>

                        <Note>
                            <p>
                                <strong>{rateLimitMessages}</strong> messages
                                (questions) allowed every{' '}
                                <strong>{rateLimitSeconds}</strong> seconds
                            </p>
                        </Note>
                    </div>

                    <FormField
                        label="IP Whitelist"
                        note="Comma separated list of IP addresses to exclude from rate limiting."
                        htmlFor="rateLimitIPAllowlist"
                    >
                        <input
                            type="text"
                            name="rateLimitIPAllowlist"
                            id="rateLimitIPAllowlist"
                            value={rateLimitIPField}
                            onChange={(e) =>
                                setRateLimitIPField(e.target.value)
                            }
                            disabled={
                                disabled ||
                                !checkPlanPermission(team, 'business').allowed
                            }
                            aria-describedby="rateLimitMessages-description"
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                        />
                    </FormField>

                    <FormField
                        label="Warning Message"
                        htmlFor="rateLimitMessage"
                    >
                        <input
                            type="text"
                            name="rateLimitMessage"
                            id="rateLimitMessage"
                            value={labels?.rateLimitMessage}
                            onChange={(e) =>
                                setLabels({
                                    ...labels,
                                    rateLimitMessage: e.target.value,
                                })
                            }
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                        />
                    </FormField>

                    <FieldToggle
                        label="Record IP Addresses"
                        description="Record unhashed IP addresses of users to help monitor abuse. Has privacy implications."
                        enabled={recordIP}
                        setEnabled={setRecordIP}
                        disabled={
                            !checkPlanPermission(team, 'business').allowed
                        }
                    />
                </Box>

                <Box
                    title="Choose Your Model"
                    icon={Squares2X2Icon}
                    canToggle="all"
                    className="col-span-1 lg:col-span-3"
                    scrollId="model-section"
                    titleHref={
                        bot?.id
                            ? `/app/bots/${bot.id}/configure/system#model-section`
                            : '#model-section'
                    }
                >
                    <fieldset className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <legend className="sr-only">OpenAI Models</legend>

                        {AVAILABLE_MODELS.map(
                            (modelItem) =>
                                modelVisibility[modelItem.value] && (
                                    <RadioBox
                                        key={modelItem.id}
                                        id={modelItem.id}
                                        name="model"
                                        value={modelItem.value}
                                        checked={model === modelItem.value}
                                        onChange={() =>
                                            applyModelChange(modelItem.value)
                                        }
                                        disabled={disabled}
                                        title={modelItem.title}
                                        description={modelItem.description}
                                        status={modelItem.status}
                                        capabilities={modelItem.capabilities}
                                        hasVerification={
                                            modelItem.value === 'gpt-5-mini'
                                                ? team?.openAIKey &&
                                                  modelItem.hasVerification
                                                : modelItem.hasVerification
                                        }
                                        expirationDate={
                                            modelItem.expirationDate
                                        }
                                        lifecycle={modelItem.lifecycle}
                                        included={
                                            !team?.openAIKey &&
                                            MODELS_INCLUDED_WITHOUT_KEY.includes(
                                                modelItem.value,
                                            )
                                        }
                                    />
                                ),
                        )}
                    </fieldset>
                </Box>
            </div>
        </>
    )
}
