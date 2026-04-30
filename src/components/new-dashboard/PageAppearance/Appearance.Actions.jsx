import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import clsx from 'clsx'
import {
    AppearanceToggle,
    AppearanceBlock,
    AppearanceInput,
    AppearanceAccordion,
    AppearanceActionCategory,
} from './Appearance.Options'
import LeadCollectionToolSettings from '@/components/LeadCollectionToolSettings'
import PromptIcon from '@/components/PromptIcon'
import { DEFAULT_CUSTOM_BUTTON_ICON } from '@/constants/heroIcons.constants'
import { i18n } from '@/constants/strings.constants'
import CompanyLogo from '@/components/CompanyLogo'
import SkillListIcon from '@/components/SkillListIcon'
import ModalSelectMcpServer from '@/components/ModalSelectMcpServer'
import ModalSelectSkill from '@/components/ModalSelectSkill'
import Tooltip from '@/components/Tooltip'
import {
    BOOKING_ACTION_KEYS,
    BOOKING_ACTIONS,
    buildCustomButtonFunctionKey,
    createDefaultCustomButtonAction,
    finalizeCustomButtonFunctionKeyInput,
    sanitizeCustomButtonFunctionKeyLiveInput,
    CUSTOM_BUTTON_TOOL_PREFIX,
    DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
    DEFAULT_CUSTOM_BUTTON_TRIGGER_INSTRUCTIONS,
    normalizeBookingPathInput,
} from '@/lib/botActions'
import {
    checkPlanPermission,
    countBillableBotActions,
    countEnabledMcpTools,
    getBotActionSlotLimit,
    getDomainFromUrl,
} from '@/utils/helpers'
import {
    ArrowPathIcon,
    BuildingOffice2Icon,
    ClipboardDocumentListIcon,
    GlobeAltIcon,
    HandThumbUpIcon,
    LifebuoyIcon,
    LinkSlashIcon,
    PlusIcon,
    TrashIcon,
    ServerStackIcon,
} from '@heroicons/react/24/outline'
import {
    DEFAULT_WEB_SEARCH_MODEL,
    WEB_SEARCH_ALLOWED_DOMAINS_MAX,
    WEB_SEARCH_COMPATIBLE_MODELS_LABEL,
    formatDomainListInputText,
    formatWebSearchModelLabel,
    normalizeWebSearchAllowedDomains,
    isWebSearchCompatibleModel,
} from '@/lib/webSearch'

const SCHEDULING_EMBED_OPTION_LABELS = {
    hideEventDetails: {
        default: {
            label: 'Hide event details',
            description: 'Remove event details from the embedded booking view.',
        },
        tidycal: {
            label: 'Hide the profile avatar',
            description: 'Hide the profile avatar in the embedded booking view.',
        },
    },
    hideCookieBanner: {
        default: {
            label: 'Hide cookie banner',
            description: 'Hide the provider cookie notice in the embed.',
        },
    },
}

const CANCELLATION_FEEDBACK_ENUMS = [
    'too_expensive',
    'missing_features',
    'switched_service',
    'unused',
    'low_quality',
    'too_complex',
    'customer_service',
    'other',
]

const CANCELLATION_FEEDBACK_LABELS = {
    too_expensive: 'Too expensive',
    missing_features: 'Missing features',
    switched_service: 'Switched to another service',
    unused: 'Not using it',
    low_quality: 'Low quality',
    too_complex: 'Too complex',
    customer_service: 'Customer service issues',
    other: 'Other',
}

const defaultStripeConfig = {
    enabled: false,
    stripeUserId: '',
    recent_billing: { enabled: false },
    billing_portal: { enabled: false, return_url: '' },
    refund: { enabled: false, rules: '' },
    cancellation: { enabled: false, require_feedback: false },
}

const normalizeStripe = (stripe) => {
    const merged = {
        ...defaultStripeConfig,
        ...(stripe || {}),
        recent_billing: {
            ...defaultStripeConfig.recent_billing,
            ...(stripe?.recent_billing || {}),
        },
        billing_portal: {
            ...defaultStripeConfig.billing_portal,
            ...(stripe?.billing_portal || {}),
        },
        refund: {
            ...defaultStripeConfig.refund,
            ...(stripe?.refund || {}),
        },
        cancellation: {
            ...defaultStripeConfig.cancellation,
            ...(stripe?.cancellation || {}),
        },
    }
    return merged
}

const getStripeStatus = (stripe) => {
    if (!stripe?.enabled) return 'disabled'
    const acct = stripe?.stripeUserId?.trim() ?? ''
    if (!acct) return 'incomplete'
    return 'active'
}

const SchedulingProviderIcon = ({ src }) => (
    <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
        <img src={src} alt="" aria-hidden="true" className="size-6 object-contain" />
    </div>
)

const SchedulingActionToggle = ({
    enabled,
    name,
    iconSrc,
    isUpdating,
    onEnabledChange,
}) => (
    <AppearanceToggle
        enabled={enabled}
        setEnabled={onEnabledChange}
        disabled={isUpdating}
        label={
            <div className="flex items-center gap-3">
                <SchedulingProviderIcon src={iconSrc} />
                <span className="text-sm font-semibold text-gray-900">{name}</span>
            </div>
        }
    />
)

const BuiltInToolLabel = ({ icon: Icon, name }) => (
    <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <Icon className="size-5 text-gray-700" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-gray-900">{name}</span>
    </div>
)

const CustomButtonActionToggle = ({
    enabled,
    displayName,
    icon,
    isUpdating,
    onEnabledChange,
}) => (
    <AppearanceToggle
        enabled={enabled}
        setEnabled={onEnabledChange}
        disabled={isUpdating}
        label={
            <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                    <PromptIcon
                        icon={icon}
                        className="size-6 text-gray-700"
                    />
                </div>
                <span className="text-sm font-semibold text-gray-900">
                    {displayName}
                </span>
            </div>
        }
    />
)

const ADD_CUSTOM_BUTTON_DASHED_CLASS =
    'group flex w-full items-center justify-center gap-2 rounded-lg border-[2pt] border-dashed border-gray-200 bg-white px-4 py-3 text-center transition hover:border-cyan-500/40 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

const AddCustomButtonDashedButton = ({ onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={ADD_CUSTOM_BUTTON_DASHED_CLASS}
    >
        <PlusIcon
            className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-cyan-600"
            aria-hidden="true"
        />
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-800 group-hover:text-cyan-700">
            Add new
            <span className="rounded border border-gray-300 bg-gray-50 px-1.5 py-0.5 text-sm font-medium leading-none shadow-sm transition group-hover:border-cyan-400 group-hover:bg-cyan-50/60 group-hover:text-cyan-800">
                button
            </span>
        </span>
    </button>
)

const AddMcpServerDashedButton = ({ onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={ADD_CUSTOM_BUTTON_DASHED_CLASS}
    >
        <PlusIcon
            className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-cyan-600"
            aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-800 group-hover:text-cyan-700">
            Add MCP server
        </span>
    </button>
)

const AddSkillDashedButton = ({ onClick, disabled }) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={ADD_CUSTOM_BUTTON_DASHED_CLASS}
    >
        <PlusIcon
            className="h-5 w-5 shrink-0 text-gray-500 group-hover:text-cyan-600"
            aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-800 group-hover:text-cyan-700">
            Add skill
        </span>
    </button>
)

const hasMissingSkillSecrets = (skill) =>
    Array.isArray(skill?.secretBindings) &&
    skill.secretBindings.some(
        (binding) =>
            typeof binding?.secret !== 'string' || binding.secret.trim().length === 0,
    )

const hasMissingSkillEnvBindings = (skill) =>
    Array.isArray(skill?.envBindings) &&
    skill.envBindings.some(
        (binding) =>
            typeof binding?.value !== 'string' || binding.value.trim().length === 0,
    )

const skillRecordId = (skill) =>
    String(skill?.skillName || skill?.draftId || skill?.id || skill?.name || '').trim()

const buildWidgetSkillDisabledReasons = ({ skill, botId, isPublicBot }) => {
    const id = skillRecordId(skill)
    const skillHref = `/app/bots/${botId}/configure/skills/${encodeURIComponent(id)}`
    const reasons = []

    if (!skill?.publishedAt) {
        reasons.push({
            key: 'unpublished',
            message: 'Publish this skill before using it in the widget.',
            href: skillHref,
            linkLabel: 'Open skill',
        })
    }

    if (hasMissingSkillSecrets(skill)) {
        reasons.push({
            key: 'missing-secrets',
            message: 'This skill is missing one or more required secret values.',
            href: skillHref,
            linkLabel: 'Add secrets',
        })
    }

    if (hasMissingSkillEnvBindings(skill)) {
        reasons.push({
            key: 'missing-env-bindings',
            message: 'This skill is missing one or more required environment values.',
            href: skillHref,
            linkLabel: 'Open skill',
        })
    }

    if (isPublicBot && skill?.internal) {
        reasons.push({
            key: 'internal-public',
            message: 'Internal-only skills are disabled for public bots.',
            href: skillHref,
            linkLabel: 'Change audience',
        })
    }

    return reasons
}

const AppearanceActions = ({
    bot,
    toggleSchedulingAction,
    isAgent,
    labels,
    setLabels,
    isUpdating,
    tools,
    team,
    setTools,
    webSearchAllowedDomainsText,
    setWebSearchAllowedDomainsText,
    supportLink,
    setSupportLink,
    leadCollect,
    setLeadCollect,
    toWidgetLeadCollectState,
    setShowUpgrade,
    onRequireOpenAIKey,
    stripeOAuthLoading,
    setStripeOAuthLoading,
    stripeOAuthError,
    setStripeOAuthError,
    onStripeOAuthPopupClosed,
    canManageStripeActions = false,
    setMcpServers,
    mcpServers,
    widgetSkills,
    setWidgetSkills,
    availableSkills = [],
    skillsLoading = false,
    skillsError = '',
    customButtonFieldErrors = {},
    onClearCustomButtonFieldError,
    onClearCustomButtonRowErrors,
    onClearAllCustomButtonFieldErrors,
}) => {
    const [showMcpModal, setShowMcpModal] = useState(false)
    const [showSkillsModal, setShowSkillsModal] = useState(false)
    const [customButtonPrompt, setCustomButtonPrompt] = useState('')
    const [customButtonPromptOpen, setCustomButtonPromptOpen] = useState(false)
    const [customButtonPromptLoading, setCustomButtonPromptLoading] = useState(false)
    const [customButtonPromptError, setCustomButtonPromptError] = useState('')
    const stripe = normalizeStripe(tools?.stripe)
    const stripeStatus = getStripeStatus(stripe)
    const webSearchPlanCheck = checkPlanPermission(team, 'standard')
    const webSearchDomainsPlanCheck = checkPlanPermission(team, 'business', 'webSearchAllowedDomains')
    const webSearchAllowedDomainsCount =
        normalizeWebSearchAllowedDomains(webSearchAllowedDomainsText).length
    const isPublicBot = bot?.privacy !== 'private'
    const stripePlanCheck = checkPlanPermission(team, 'standard', 'stripeActions')
    const schedulingPlanCheck = checkPlanPermission(team, 'personal', 'bookingActions')
    const hasOpenAIKey = Boolean(team?.openAIKey)
    const webSearchModel = bot?.model || DEFAULT_WEB_SEARCH_MODEL
    const webSearchModelCompatible = isWebSearchCompatibleModel(webSearchModel)
    const webSearchEnabled = tools?.web_search?.enabled === true
    const webSearchLiveEnabled =
        tools?.web_search?.enabled === true &&
        tools?.web_search?.live === true &&
        !isPublicBot
    const connectLoading = stripeOAuthLoading
    const connectError = stripeOAuthError
    const customButtons = Array.isArray(tools?.customButtons)
        ? tools.customButtons
        : []
    const actionSlotLimit = getBotActionSlotLimit(team)
    const billableActionCount = countBillableBotActions({
        tools,
        leadCollect,
        mcpServers,
        widgetSkills,
    })
    const actionSlotsFull = billableActionCount >= actionSlotLimit
    const customButtonsPlanCheck = checkPlanPermission(
        team,
        'personal',
        'customButtons',
    )
    const canUseCustomButtons =
        customButtonsPlanCheck.allowed && actionSlotLimit > 0
    const canAddAnotherCustomButton = canUseCustomButtons && !actionSlotsFull
    const rawMcpServersPlanCheck = checkPlanPermission(team, 'personal', 'mcpServers')
    const mcpServersPlanCheck = {
        ...rawMcpServersPlanCheck,
        allowed: rawMcpServersPlanCheck.allowed && actionSlotLimit > 0,
    }
    const enabledWidgetSkillIds = Array.isArray(widgetSkills) ? widgetSkills : []
    const widgetSkillsPlanCheck = checkPlanPermission(team, 'standard')
    const schedulingActions = BOOKING_ACTION_KEYS.map((key) => {
        const meta = BOOKING_ACTIONS[key]
        const active = tools?.[key]
        const bookingValue = active?.[meta.urlKey] || ''
        const isEnabled =
            active?.enabled === undefined ? Boolean(active) : Boolean(active.enabled)
        let normalizedBookingPath = ''
        try {
            normalizedBookingPath = bookingValue
                ? normalizeBookingPathInput(
                    bookingValue,
                    meta.label,
                    meta,
                )
                : ''
        } catch (error) {
            normalizedBookingPath = ''
        }

        return {
            key,
            name: meta.label,
            urlKey: meta.urlKey,
            embedOptionKeys: meta.embedOptionKeys || [],
            examplePrefix: meta.examplePrefix,
            examplePath: meta.examplePath,
            enabled: isEnabled,
            instructions: active?.instructions || '',
            bookingValue,
            normalizedBookingPath,
            embedOptions: Object.fromEntries(
                (meta.embedOptionKeys || []).map((optionKey) => [
                    optionKey,
                    Boolean(active?.[optionKey]),
                ]),
            ),
            iconSrc: `/branding/scheduling-icons/${key}.svg`,
        }
    })

    const updateSchedulingActionField = (actionKey, field, value) => {
        setTools((prev) => ({
            ...(prev || {}),
            [actionKey]: {
                ...(prev?.[actionKey] || {}),
                [field]: value,
            },
        }))
    }

    const handleSchedulingToggle = (actionKey, nextEnabled) => {
        if (nextEnabled && (!schedulingPlanCheck.allowed || actionSlotsFull)) {
            setShowUpgrade(true)
            return
        }

        toggleSchedulingAction(actionKey, nextEnabled)
    }

    const updateCustomButton = (index, field, value) => {
        onClearCustomButtonFieldError?.(index, field)
        if (field === 'name') {
            onClearCustomButtonFieldError?.(index, 'functionKey')
        }
        setTools((prev) => {
            const currentButtons = Array.isArray(prev?.customButtons)
                ? prev.customButtons
                : []

            return {
                ...(prev || {}),
                customButtons: currentButtons.map((buttonConfig, buttonIndex) => {
                    if (buttonIndex !== index) {
                        return buttonConfig
                    }

                    const nextButton = {
                        ...buttonConfig,
                    }

                    if (field === 'name') {
                        nextButton.name = value
                        if (!nextButton.__manualFunctionKey) {
                            nextButton.functionKey =
                                buildCustomButtonFunctionKey(value)
                        }
                        return nextButton
                    }

                    if (field === 'functionKey') {
                        nextButton.functionKey =
                            sanitizeCustomButtonFunctionKeyLiveInput(value)
                        nextButton.__manualFunctionKey = true
                        return nextButton
                    }

                    nextButton[field] = value
                    return nextButton
                }),
            }
        })
    }

    const finalizeCustomButtonFunctionKeyAtIndex = (index) => {
        setTools((prev) => {
            const currentButtons = Array.isArray(prev?.customButtons)
                ? prev.customButtons
                : []
            const current = currentButtons[index]?.functionKey ?? ''
            const finalized = finalizeCustomButtonFunctionKeyInput(current)
            if (finalized === current) {
                return prev
            }
            return {
                ...(prev || {}),
                customButtons: currentButtons.map((buttonConfig, buttonIndex) => {
                    if (buttonIndex !== index) {
                        return buttonConfig
                    }
                    return {
                        ...buttonConfig,
                        functionKey: finalized,
                        __manualFunctionKey: true,
                    }
                }),
            }
        })
    }

    const createCustomButtonDraft = async () => {
        const input = customButtonPrompt.trim()

        if (!input || !team?.id || !bot?.id) {
            return
        }

        if (!canUseCustomButtons || !canAddAnotherCustomButton) {
            setCustomButtonPromptError(
                !canUseCustomButtons
                    ? 'Custom CTA buttons require the Personal plan or higher.'
                    : `Your plan includes up to ${String(actionSlotLimit)} actions per bot. Disable an action or upgrade for a higher limit.`,
            )
            return
        }

        setCustomButtonPromptLoading(true)
        setCustomButtonPromptError('')

        try {
            const response = await fetch(
                `/api/teams/${team.id}/bots/${bot.id}/custom-button-draft`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ input }),
                },
            )
            const data = await response.json()

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    'Unable to generate a custom button draft.',
                )
            }

            setTools((prev) => ({
                ...(prev || {}),
                customButtons: [
                    ...(Array.isArray(prev?.customButtons)
                        ? prev.customButtons
                        : []),
                    {
                        ...createDefaultCustomButtonAction(),
                        enabled: true,
                        name: data?.name || '',
                        functionKey: buildCustomButtonFunctionKey(
                            data?.functionKey || data?.name || '',
                        ),
                        instructions: data?.instructions || '',
                        buttonText: data?.buttonText || '',
                        icon: data?.icon || DEFAULT_CUSTOM_BUTTON_ICON,
                    },
                ],
            }))

            setCustomButtonPrompt('')
            setCustomButtonPromptOpen(false)
            onClearAllCustomButtonFieldErrors?.()
        } catch (error) {
            setCustomButtonPromptError(
                error?.message ||
                'Unable to generate a custom button draft.',
            )
        } finally {
            setCustomButtonPromptLoading(false)
        }
    }

    const removeCustomButton = (index) => {
        onClearAllCustomButtonFieldErrors?.()
        setTools((prev) => ({
            ...(prev || {}),
            customButtons: (Array.isArray(prev?.customButtons)
                ? prev.customButtons
                : []
            ).filter((_, buttonIndex) => buttonIndex !== index),
        }))
    }

    const openAddCustomButton = () => {
        if (!canUseCustomButtons) {
            setShowUpgrade(true)
            return
        }
        if (!canAddAnotherCustomButton) {
            setShowUpgrade(true)
            return
        }
        setCustomButtonPromptOpen(true)
        setCustomButtonPromptError('')
    }

    const handleCustomButtonToggle = (index, nextEnabled) => {
        if (nextEnabled && !canUseCustomButtons) {
            setShowUpgrade(true)
            return
        }
        const currentButtons = Array.isArray(tools?.customButtons)
            ? tools.customButtons
            : []
        const currentlyEnabled =
            currentButtons[index]?.enabled === undefined
                ? Boolean(currentButtons[index])
                : Boolean(currentButtons[index]?.enabled)
        if (nextEnabled && !currentlyEnabled && actionSlotsFull) {
            setShowUpgrade(true)
            return
        }

        if (!nextEnabled) {
            onClearCustomButtonRowErrors?.(index)
        }
        setTools((prev) => {
            const currentButtons = Array.isArray(prev?.customButtons)
                ? prev.customButtons
                : []
            return {
                ...(prev || {}),
                customButtons: currentButtons.map((buttonConfig, buttonIndex) =>
                    buttonIndex === index
                        ? { ...buttonConfig, enabled: nextEnabled }
                        : buttonConfig,
                ),
            }
        })
    }

    const setStripe = (nextStripe) =>
        setTools({
            ...(tools || {}),
            stripe: normalizeStripe(nextStripe),
        })

    const handleStripeConnect = useCallback(async () => {
        if (!team?.id || !bot?.id) return
        setStripeOAuthLoading(true)
        setStripeOAuthError('')
        try {
            const response = await fetch(
                `/api/teams/${team.id}/bots/${bot.id}/stripe/oauth/authorize`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ popup: true }),
                },
            )
            const data = await response.json()
            if (!response.ok) {
                throw new Error(data?.message || 'Failed to start Stripe OAuth')
            }
            if (data?.url) {
                const popup = window.open(
                    data.url,
                    'docsbot_stripe_oauth',
                    'width=600,height=720,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no',
                )
                if (!popup) {
                    const fallback = await fetch(
                        `/api/teams/${team.id}/bots/${bot.id}/stripe/oauth/authorize`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ popup: false }),
                        },
                    )
                    const fallbackData = await fallback.json()
                    if (!fallback.ok || !fallbackData?.url) {
                        throw new Error(
                            fallbackData?.message ||
                            'Popup blocked and redirect URL could not be created.',
                        )
                    }
                    window.location.href = fallbackData.url
                    return
                }
                popup.focus()
                const checkClosed = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(checkClosed)
                        setStripeOAuthLoading(false)
                        onStripeOAuthPopupClosed?.()
                    }
                }, 500)
            } else {
                throw new Error('Stripe OAuth URL missing in response')
            }
        } catch (error) {
            setStripeOAuthError(
                error?.message || 'Unable to connect with Stripe',
            )
            setStripeOAuthLoading(false)
        }
    }, [
        team?.id,
        bot?.id,
        setStripeOAuthError,
        setStripeOAuthLoading,
        onStripeOAuthPopupClosed,
    ])

    const handleStripeDisconnect = () => {
        setStripeOAuthError('')
        setStripe({
            ...stripe,
            enabled: false,
            clearOAuthConnection: true,
        })
    }
    // In widget actions, only healthy connected servers are available; enabled controls visibility in widget.
    const connectedMcpServers = (mcpServers || []).filter(
        (s) => s?.isConnected && !s?.tokenExpired,
    )
    const enabledMcpServers = connectedMcpServers.filter((s) => s?.enabled)
    // Get the ids of enabled servers.
    const enabledMcpServerIds = enabledMcpServers.map((s) => s.id)

    // Handle enabling a server
    const handleEnableMcpServer = (serverId) => {
        if (enabledMcpServerIds.includes(serverId)) return
        if (!mcpServersPlanCheck.allowed || actionSlotsFull) {
            setShowUpgrade(true)
            return
        }
        const newServers = (mcpServers || []).map((s) =>
            s.id === serverId ? { ...s, enabled: true } : s,
        )
        setMcpServers(newServers)
    }

    const handleRemoveMcpServer = (serverId) => {
        const newServers = (mcpServers || []).map((s) =>
            s.id === serverId ? { ...s, enabled: false } : s,
        )
        setMcpServers(newServers)
    }

    const handleEnableWidgetSkill = (skillName) => {
        const nextSkills = Array.isArray(widgetSkills) ? widgetSkills : []
        if (nextSkills.includes(skillName)) return
        if (!widgetSkillsPlanCheck.allowed || actionSlotsFull) {
            setShowUpgrade(true)
            return
        }
        setWidgetSkills([...nextSkills, skillName])
    }

    const handleRemoveWidgetSkill = (skillName) => {
        const nextSkills = Array.isArray(widgetSkills)
            ? widgetSkills.filter((name) => name !== skillName)
            : []
        setWidgetSkills(nextSkills)
    }

    const availableWidgetSkills = useMemo(
        () =>
            (availableSkills || []).map((skill) => ({
                ...skill,
                disabledReasons: buildWidgetSkillDisabledReasons({
                    skill,
                    botId: bot.id,
                    isPublicBot,
                }),
            })),
        [availableSkills, bot.id, isPublicBot],
    )

    const enabledWidgetSkills = useMemo(() => {
        const selected = Array.isArray(widgetSkills) ? widgetSkills : []
        return selected.map((skillName) => {
            const skill = availableWidgetSkills.find((item) => skillRecordId(item) === skillName)
            if (skill) return skill
            return {
                name: skillName,
                description: 'This skill could not be loaded.',
                internal: false,
            }
        })
    }, [availableWidgetSkills, widgetSkills])

    return (
        <>
            <AppearanceBlock className="flex flex-col gap-4" isLast={true}>
                <AppearanceToggle
                    label={
                        <BuiltInToolLabel
                            icon={HandThumbUpIcon}
                            name="Collect Feedback"
                        />
                    }
                    description="Collect ratings (CSAT) from users after they interact with the bot."
                    enabled={
                        tools?.followup_rating?.enabled === undefined
                            ? true
                            : tools?.followup_rating?.enabled
                    }
                    setEnabled={(enabled) =>
                        setTools({
                            ...tools,
                            followup_rating: {
                                enabled,
                            },
                        })
                    }
                    disabled={isUpdating}
                    isNew={false}
                />
                <AppearanceToggle
                    label={
                        <BuiltInToolLabel
                            icon={LifebuoyIcon}
                            name={
                                isAgent
                                    ? 'Human Support Escalation'
                                    : 'Enable Support Link'
                            }
                        />
                    }
                    description={
                        isAgent
                            ? 'Enable escalation detection tool to allow the bot to detect when a user needs to speak to a human, and ask them to confirm.'
                            : 'Enable a support link button in the widget.'
                    }
                    enabled={
                        tools?.human_escalation?.enabled === undefined
                            ? true
                            : tools?.human_escalation?.enabled
                    }
                    setEnabled={(enabled) =>
                        setTools({
                            ...tools,
                            human_escalation: {
                                enabled,
                            },
                        })
                    }
                    disabled={isUpdating}
                    isNew={false}
                />
                {tools?.human_escalation?.enabled && (
                    <div className="ml-4 flex flex-col gap-4">
                        <AppearanceBlock
                            title="Button Link"
                            titleTag="label"
                            titleProps={{
                                htmlFor: 'support-link',
                            }}
                            description={
                                isAgent ? (
                                    <>
                                        This link will be used when the user confirms they need to speak to a human. Optional, you can{' '}
                                        <a href="/documentation/developer/embeddable-chat-widget#support-callback" target="_blank" rel="noopener noreferrer" className="text-cyan-600 underline hover:text-cyan-800">register a JS event</a>
                                        {' '}instead.
                                    </>
                                ) : (
                                    'This link will appear after the bot replies.'
                                )
                            }
                            isLast={true}
                        >
                            <AppearanceInput
                                id="support-link"
                                name="support-link"
                                type="text"
                                value={supportLink}
                                onChange={(e) =>
                                    setSupportLink(e.target.value)
                                }
                                disabled={
                                    isUpdating ||
                                    !tools?.human_escalation?.enabled
                                }
                                placeholder="https://example.com/support/"
                            />
                        </AppearanceBlock>

                        {!isAgent && (
                            <AppearanceBlock
                                title="Button Label"
                                titleTag="label"
                                titleProps={{
                                    htmlFor: 'support-label',
                                }}
                                description="This text will appear on the support link button if a link has been set."
                                isLast={true}
                            >
                                <AppearanceInput
                                    id="support-label"
                                    name="support-label"
                                    type="text"
                                    value={labels.getSupport}
                                    onChange={(e) =>
                                        setLabels({
                                            ...labels,
                                            getSupport: e.target.value,
                                        })
                                    }
                                    disabled={isUpdating}
                                    placeholder="Support text"
                                />
                            </AppearanceBlock>
                        )}
                    </div>
                )}
                <LeadCollectionToolSettings
                    team={team}
                    value={leadCollect}
                    onChange={(nextValue) => {
                        const nextLeadCollect = toWidgetLeadCollectState(nextValue)
                        if (!leadCollect && nextLeadCollect && actionSlotsFull) {
                            setShowUpgrade(true)
                            return
                        }
                        setLeadCollect(nextLeadCollect)
                    }}
                    leadCollectMessage={
                        labels?.leadCollectMessage ||
                        i18n.en.labels.leadCollectMessage ||
                        ''
                    }
                    onLeadCollectMessageChange={(message) =>
                        setLabels((prev) => ({
                            ...prev,
                            leadCollectMessage: message,
                        }))
                    }
                    disabled={isUpdating}
                    onRequireUpgrade={() => setShowUpgrade(true)}
                    inline={true}
                    toggleLabel={
                        <BuiltInToolLabel
                            icon={ClipboardDocumentListIcon}
                            name="Lead Collection"
                        />
                    }
                    toggleDescription="Collect lead data from users in the widget with a customizable form."
                />
            </AppearanceBlock>

            {isAgent && (
                <AppearanceActionCategory
                    title="Scheduling Tools"
                    isNew={true}
                    planLabel={
                        !schedulingPlanCheck.allowed
                            ? schedulingPlanCheck.requiredPlanLabel
                            : null
                    }
                    description="Trigger an embedded calendar booking widget to book a meeting with you. When available, the user’s name and email are prefilled. Booking details are also added to metadata so you can see them in logs and the AI can use them for future responses."
                >
                    <div className="flex flex-col gap-3">
                        {schedulingActions.map((action) => (
                            <div
                                key={action.key}
                                className="flex flex-col gap-3"
                            >
                                <SchedulingActionToggle
                                    enabled={action.enabled}
                                    name={action.name}
                                    iconSrc={action.iconSrc}
                                    isUpdating={isUpdating}
                                    onEnabledChange={(next) =>
                                        handleSchedulingToggle(
                                            action.key,
                                            next,
                                        )
                                    }
                                />
                                {action.enabled ? (
                                    <div className="ml-4 flex flex-col gap-2 pb-3">
                                        <label
                                            htmlFor={`${action.key}-booking-url`}
                                            className="text-xs font-semibold text-gray-900"
                                        >
                                            Booking URL
                                        </label>
                                        <AppearanceInput
                                            id={`${action.key}-booking-url`}
                                            name={`${action.key}-booking-url`}
                                            type="text"
                                            value={action.bookingValue}
                                            onChange={(e) =>
                                                updateSchedulingActionField(
                                                    action.key,
                                                    action.urlKey,
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                isUpdating ||
                                                !schedulingPlanCheck.allowed
                                            }
                                            placeholder={`${action.examplePrefix}${action.examplePath}`}
                                        />
                                        <div className="text-xs text-gray-500">
                                            Full URL or path only. Example path:{' '}
                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                {action.examplePath}
                                            </code>
                                        </div>
                                        {action.normalizedBookingPath ? (
                                            <div className="text-[11px] text-gray-400">
                                                Saved as:{' '}
                                                <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                    {action.normalizedBookingPath}
                                                </code>
                                            </div>
                                        ) : null}
                                        <label
                                            htmlFor={`${action.key}-instructions`}
                                            className="text-xs font-semibold text-gray-900"
                                        >
                                            When to trigger
                                        </label>
                                        <AppearanceInput
                                            id={`${action.key}-instructions`}
                                            name={`${action.key}-instructions`}
                                            isMultiLine={true}
                                            value={action.instructions}
                                            onChange={(e) =>
                                                updateSchedulingActionField(
                                                    action.key,
                                                    'instructions',
                                                    e.target.value,
                                                )
                                            }
                                            disabled={
                                                isUpdating ||
                                                !schedulingPlanCheck.allowed
                                            }
                                            placeholder={DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS}
                                        />
                                        {action.embedOptionKeys.map((optionKey) => {
                                            const optionMetaConfig =
                                                SCHEDULING_EMBED_OPTION_LABELS[
                                                optionKey
                                                ]
                                            const optionMeta =
                                                optionMetaConfig?.[
                                                action.key
                                                ] ||
                                                optionMetaConfig?.default
                                            if (!optionMeta) return null

                                            return (
                                                <AppearanceToggle
                                                    key={`${action.key}-${optionKey}`}
                                                    enabled={
                                                        action.embedOptions[
                                                        optionKey
                                                        ]
                                                    }
                                                    setEnabled={(next) =>
                                                        updateSchedulingActionField(
                                                            action.key,
                                                            optionKey,
                                                            next,
                                                        )
                                                    }
                                                    disabled={
                                                        isUpdating ||
                                                        !schedulingPlanCheck.allowed
                                                    }
                                                    label={optionMeta.label}
                                                    description={
                                                        optionMeta.description
                                                    }
                                                    className="mt-1"
                                                />
                                            )
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </AppearanceActionCategory>
            )}

            {isAgent && (
                <AppearanceActionCategory
                    title="Custom Buttons"
                    titleTag="h4"
                    isNew={true}
                    planLabel={
                        !canUseCustomButtons
                            ? customButtonsPlanCheck.requiredPlanLabel
                            : null
                    }
                    description="Let your bot trigger a clickable button to show to users based on your instructions. Use it for pricing and plans, booking or demos, signup or downloads, or any page you want visitors to reach in one click."
                >
                    <div className="flex flex-col gap-3">
                        {canUseCustomButtons &&
                            !canAddAnotherCustomButton &&
                            customButtons.length > 0 ? (
                            <p className="text-xs text-gray-600">
                                Your plan includes up to {actionSlotLimit} actions
                                per bot. Disable an action or upgrade for a higher limit.
                            </p>
                        ) : null}
                        {!customButtonPromptOpen &&
                            customButtons.length === 0 ? (
                            <AddCustomButtonDashedButton
                                onClick={openAddCustomButton}
                                disabled={isUpdating}
                            />
                        ) : null}

                        {customButtons.length > 0 ? (
                            <div className="flex flex-col gap-3">
                                {customButtons.map((buttonConfig, index) => {
                                    const functionKey = buttonConfig?.functionKey || ''
                                    const displayName =
                                        buttonConfig?.name?.trim() || `Button ${index + 1}`
                                    const buttonEnabled =
                                        buttonConfig?.enabled === undefined
                                            ? true
                                            : Boolean(buttonConfig.enabled)
                                    const btnErr = customButtonFieldErrors[index]
                                    const rowConfigAlert = btnErr?._row

                                    return (
                                        <div
                                            key={`custom-button-${index}`}
                                            className="flex flex-col gap-3"
                                        >
                                            {rowConfigAlert ? (
                                                <p
                                                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
                                                    role="alert"
                                                >
                                                    {rowConfigAlert}
                                                </p>
                                            ) : null}
                                            <CustomButtonActionToggle
                                                enabled={buttonEnabled}
                                                displayName={displayName}
                                                icon={buttonConfig?.icon}
                                                isUpdating={isUpdating}
                                                onEnabledChange={(next) =>
                                                    handleCustomButtonToggle(
                                                        index,
                                                        next,
                                                    )
                                                }
                                            />
                                            {buttonEnabled ? (
                                                <div className="ml-4 flex flex-col gap-2 pb-3">
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div className="flex min-w-0 flex-col gap-1">
                                                            <label
                                                                htmlFor={`custom-button-name-${index}`}
                                                                className={clsx(
                                                                    'text-xs font-semibold',
                                                                    btnErr?.name
                                                                        ? 'text-red-800'
                                                                        : 'text-gray-900',
                                                                )}
                                                            >
                                                                Name
                                                            </label>
                                                            <AppearanceInput
                                                                id={`custom-button-name-${index}`}
                                                                name={`custom-button-name-${index}`}
                                                                type="text"
                                                                value={
                                                                    buttonConfig?.name || ''
                                                                }
                                                                onChange={(e) =>
                                                                    updateCustomButton(
                                                                        index,
                                                                        'name',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                disabled={isUpdating}
                                                                placeholder="Pricing"
                                                                errorMessage={btnErr?.name}
                                                            />
                                                        </div>
                                                        <div className="flex min-w-0 flex-col gap-1">
                                                            <label
                                                                htmlFor={`custom-button-function-key-${index}`}
                                                                className={clsx(
                                                                    'text-xs font-semibold',
                                                                    btnErr?.functionKey
                                                                        ? 'text-red-800'
                                                                        : 'text-gray-900',
                                                                )}
                                                            >
                                                                Key
                                                            </label>
                                                            <AppearanceInput
                                                                id={`custom-button-function-key-${index}`}
                                                                name={`custom-button-function-key-${index}`}
                                                                type="text"
                                                                value={functionKey}
                                                                onChange={(e) =>
                                                                    updateCustomButton(
                                                                        index,
                                                                        'functionKey',
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    finalizeCustomButtonFunctionKeyAtIndex(
                                                                        index,
                                                                    )
                                                                }
                                                                disabled={isUpdating}
                                                                errorMessage={
                                                                    btnErr?.functionKey
                                                                }
                                                            />
                                                            <div className="text-xs text-gray-500">
                                                                Lowercase letters, numbers, and
                                                                underscores only.
                                                            </div>
                                                            <div className="text-[11px] text-gray-400">
                                                                Internal tool name:{' '}
                                                                <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                                    {functionKey
                                                                        ? `${CUSTOM_BUTTON_TOOL_PREFIX}${functionKey}`
                                                                        : `${CUSTOM_BUTTON_TOOL_PREFIX}pricing`}
                                                                </code>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <label
                                                            htmlFor={`custom-button-instructions-${index}`}
                                                            className={clsx(
                                                                'text-xs font-semibold',
                                                                btnErr?.instructions
                                                                    ? 'text-red-800'
                                                                    : 'text-gray-900',
                                                            )}
                                                        >
                                                            When to use
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            Describe the topics, questions, or
                                                            situations where the agent should offer
                                                            this button.
                                                        </p>
                                                        <AppearanceInput
                                                            id={`custom-button-instructions-${index}`}
                                                            name={`custom-button-instructions-${index}`}
                                                            isMultiLine
                                                            rows={4}
                                                            value={
                                                                buttonConfig?.instructions ||
                                                                ''
                                                            }
                                                            onChange={(e) =>
                                                                updateCustomButton(
                                                                    index,
                                                                    'instructions',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            placeholder={
                                                                DEFAULT_CUSTOM_BUTTON_TRIGGER_INSTRUCTIONS
                                                            }
                                                            errorMessage={
                                                                btnErr?.instructions
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <label
                                                            htmlFor={`custom-button-text-${index}`}
                                                            className={clsx(
                                                                'text-xs font-semibold',
                                                                btnErr?.buttonText
                                                                    ? 'text-red-800'
                                                                    : 'text-gray-900',
                                                            )}
                                                        >
                                                            Button text
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            Label shown on the button in the chat
                                                            widget.
                                                        </p>
                                                        <AppearanceInput
                                                            id={`custom-button-text-${index}`}
                                                            name={`custom-button-text-${index}`}
                                                            type="text"
                                                            value={
                                                                buttonConfig?.buttonText || ''
                                                            }
                                                            onChange={(e) =>
                                                                updateCustomButton(
                                                                    index,
                                                                    'buttonText',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            placeholder="View pricing"
                                                            errorMessage={
                                                                btnErr?.buttonText
                                                            }
                                                        />
                                                    </div>

                                                    <div className="flex flex-col gap-1">
                                                        <label
                                                            htmlFor={`custom-button-url-${index}`}
                                                            className={clsx(
                                                                'text-xs font-semibold',
                                                                btnErr?.url
                                                                    ? 'text-red-800'
                                                                    : 'text-gray-900',
                                                            )}
                                                        >
                                                            URL
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            This is the link the button will take the user to when
                                                            they click. Optionally{' '}
                                                            <a
                                                                href="/documentation/developer/embeddable-chat-widget#custom-action-buttons"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-cyan-600 underline hover:text-cyan-800"
                                                            >
                                                                register a JS event
                                                            </a>
                                                            {' '}
                                                            to intercept the click.
                                                        </p>
                                                        <AppearanceInput
                                                            id={`custom-button-url-${index}`}
                                                            name={`custom-button-url-${index}`}
                                                            type="text"
                                                            value={buttonConfig?.url || ''}
                                                            onChange={(e) =>
                                                                updateCustomButton(
                                                                    index,
                                                                    'url',
                                                                    e.target.value,
                                                                )
                                                            }
                                                            disabled={isUpdating}
                                                            placeholder="https://example.com/path"
                                                            errorMessage={btnErr?.url}
                                                        />
                                                        <div className="text-xs text-gray-500">
                                                            Use a full link: https:// or http://,{' '}
                                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                                mailto:
                                                            </code>
                                                            ,{' '}
                                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                                tel:
                                                            </code>
                                                            , or an app deep link (e.g.{' '}
                                                            <code className="rounded bg-gray-100 px-1 py-0.5 text-gray-600">
                                                                myapp://…
                                                            </code>
                                                            ).
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end pt-1">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeCustomButton(index)
                                                            }
                                                            disabled={isUpdating}
                                                            className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-50 hover:text-red-800 disabled:pointer-events-none disabled:opacity-50"
                                                        >
                                                            <TrashIcon
                                                                className="h-4 w-4"
                                                                aria-hidden="true"
                                                            />
                                                            Remove button
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    )
                                })}
                            </div>
                        ) : null}

                        {customButtonPromptOpen ? (
                            <div
                                className={clsx(
                                    'rounded-lg border border-gray-200 bg-gray-50 transition-colors',
                                    !customButtonPromptLoading && 'p-4',
                                )}
                                aria-busy={customButtonPromptLoading}
                            >
                                {customButtonPromptLoading ? (
                                    <div
                                        role="status"
                                        aria-live="polite"
                                        className="flex w-full flex-col items-center justify-center gap-2 px-4 py-4 text-center sm:flex-row sm:gap-3 sm:py-3"
                                    >
                                        <ArrowPathIcon
                                            className="h-6 w-6 shrink-0 animate-spin text-gray-500"
                                            aria-hidden
                                        />
                                        <p className="max-w-sm text-sm font-medium leading-snug text-gray-700">
                                            Drafting your button—this usually takes a few
                                            seconds.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        <p className="text-xs text-gray-500">
                                            Tell us what the button is for and when it
                                            should be triggered. We will draft the details
                                            for you to edit before saving.
                                        </p>
                                        <AppearanceInput
                                            id="custom-button-ai-prompt"
                                            name="custom-button-ai-prompt"
                                            isMultiLine
                                            rows={3}
                                            value={customButtonPrompt}
                                            onChange={(e) =>
                                                setCustomButtonPrompt(
                                                    e.target.value,
                                                )
                                            }
                                            disabled={isUpdating}
                                            placeholder="Example: Send users to our pricing page whenever they ask about plan differences, pricing tiers, or what is included in each plan."
                                        />
                                        {customButtonPromptError ? (
                                            <div className="text-xs text-red-600">
                                                {customButtonPromptError}
                                            </div>
                                        ) : null}
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={createCustomButtonDraft}
                                                disabled={
                                                    isUpdating ||
                                                    !customButtonPrompt.trim() ||
                                                    !canAddAnotherCustomButton
                                                }
                                                className="inline-flex min-h-[40px] min-w-[8.5rem] items-center justify-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                Generate
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setCustomButtonPromptOpen(
                                                        false,
                                                    )
                                                    setCustomButtonPrompt('')
                                                    setCustomButtonPromptError('')
                                                }}
                                                disabled={isUpdating}
                                                className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:border-gray-400 hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : null}

                        {!customButtonPromptOpen &&
                            customButtons.length > 0 ? (
                            <AddCustomButtonDashedButton
                                onClick={openAddCustomButton}
                                disabled={isUpdating}
                            />
                        ) : null}
                    </div>
                </AppearanceActionCategory>
            )}

            {isAgent && (
                <AppearanceActionCategory
                    title="Skills"
                    titleTag="h4"
                    isNew={true}
                    planLabel={
                        !widgetSkillsPlanCheck.allowed
                            ? widgetSkillsPlanCheck.requiredPlanLabel
                            : null
                    }
                    description={
                        <>
                            Enable{' '}
                            <Link
                                href={`/app/bots/${bot.id}/configure/skills`}
                                className="font-medium text-cyan-600 underline hover:text-cyan-800"
                            >
                                bot skills
                            </Link>{' '}
                            to give your bot special abilities.
                        </>
                    }
                >
                    <div className="flex flex-col gap-3">
                        {enabledWidgetSkills?.map((skill) => (
                            <div
                                key={skillRecordId(skill)}
                                className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-100 px-4 py-3"
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                    <SkillListIcon
                                        icon={skill.icon}
                                        networkPolicy={skill.networkPolicy}
                                    />
                                    <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
                                        {skill.name}
                                    </span>
                                </div>
                                <Tooltip
                                    content={skill.internal ? 'Internal team use only' : 'Customer-facing'}
                                    zIndex={1000001}
                                >
                                    <span
                                        className={clsx(
                                            'inline-flex h-8 w-8 shrink-0 cursor-help items-center justify-center',
                                            skill.internal ? 'text-gray-600' : 'text-cyan-700',
                                        )}
                                        role="img"
                                        aria-label={skill.internal ? 'Internal team use only' : 'Customer-facing'}
                                    >
                                        {skill.internal ? (
                                            <BuildingOffice2Icon className="h-4 w-4" aria-hidden />
                                        ) : (
                                            <GlobeAltIcon className="h-4 w-4" aria-hidden />
                                        )}
                                    </span>
                                </Tooltip>
                                <Tooltip content="Remove skill" zIndex={1000001}>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveWidgetSkill(skillRecordId(skill))}
                                        disabled={isUpdating}
                                        className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                        aria-label={`Remove ${skill.name}`}
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </Tooltip>
                            </div>
                        ))}

                        <AddSkillDashedButton
                            onClick={() => {
                                if (!widgetSkillsPlanCheck.allowed) {
                                    setShowUpgrade(true)
                                    return
                                }
                                setShowSkillsModal(true)
                            }}
                            disabled={isUpdating}
                        />
                    </div>
                </AppearanceActionCategory>
            )}

            {isAgent && (
                <AppearanceActionCategory
                    title="MCP Servers"
                    titleTag="h4"
                    isNew={true}
                    planLabel={
                        !mcpServersPlanCheck.allowed
                            ? mcpServersPlanCheck.requiredPlanLabel
                            : null
                    }
                    description={
                        <>
                            Enable{' '}
                            <Link
                                href={`/app/bots/${bot.id}/configure/mcp-connections`}
                                className="font-medium text-cyan-600 underline hover:text-cyan-800"
                            >
                                connected MCP servers
                            </Link>
                            . MCP servers connect your bot to external tools and data from your services.
                        </>
                    }
                >
                    <div className="flex flex-col gap-3">
                        {enabledMcpServers?.map((server) => {
                            const domain = getDomainFromUrl(server.serverUrl)
                            const enabledTools = countEnabledMcpTools(server)

                            return (
                                <div
                                    key={server.id}
                                    className="flex w-full items-center justify-between gap-3 rounded-lg bg-gray-100 px-4 py-3"
                                >
                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                        {domain ? (
                                            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                                                <CompanyLogo
                                                    domain={domain}
                                                    className="size-6 object-contain"
                                                    alt=""
                                                />
                                            </span>
                                        ) : (
                                            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
                                                <ServerStackIcon className="size-5 text-gray-400" />
                                            </span>
                                        )}
                                        <span className="min-w-0 truncate text-sm font-semibold text-gray-900">
                                            {server.serverLabel}
                                        </span>
                                    </div>
                                    <span className="shrink-0 text-xs font-medium tabular-nums text-gray-700">
                                        {enabledTools === 1
                                            ? '1 Tool'
                                            : `${enabledTools} Tools`}
                                    </span>
                                    <Tooltip
                                        content="Remove server"
                                        zIndex={1000001}
                                    >
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRemoveMcpServer(server.id)
                                            }
                                            disabled={isUpdating}
                                            className="rounded-md p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                            aria-label={`Remove ${server.serverLabel}`}
                                        >
                                            <TrashIcon className="h-4 w-4" />
                                        </button>
                                    </Tooltip>
                                </div>
                            )
                        })}

                        <AddMcpServerDashedButton
                            onClick={() => {
                                if (!mcpServersPlanCheck.allowed) {
                                    setShowUpgrade(true)
                                    return
                                }
                                setShowMcpModal(true)
                            }}
                            disabled={isUpdating}
                        />
                    </div>
                </AppearanceActionCategory>
            )}

            {canManageStripeActions ? (
                <AppearanceActionCategory
                    title={
                        <span className="inline-flex items-center gap-3 align-middle">
                            <img
                                src="/branding/stripe-wordmark-blurple.svg"
                                alt=""
                                aria-hidden="true"
                                className="h-5 w-auto"
                            />
                            <span>Billing support</span>
                        </span>
                    }
                    description="If you use Stripe for billing, enable this action to help customers with invoices, subscriptions, billing portal, and refunds."
                    isNew={true}
                    beta={true}
                    planLabel={
                        !stripePlanCheck.allowed
                            ? stripePlanCheck.requiredPlanLabel
                            : null
                    }
                    planTooltipContent={
                        !stripePlanCheck.allowed
                            ? `The Stripe Billing Support Action is available on the ${stripePlanCheck.requiredPlanLabel} plan or higher.`
                            : undefined
                    }
                >
                    <AppearanceToggle
                        label="Enable Stripe Tools"
                        enabled={stripe.enabled}
                        setEnabled={(nextEnabled) => {
                            if (
                                nextEnabled &&
                                (!stripePlanCheck.allowed ||
                                    (!stripe.enabled && actionSlotsFull))
                            ) {
                                setShowUpgrade(true)
                                return
                            }
                            if (nextEnabled && !stripe.enabled) {
                                setStripe({
                                    ...stripe,
                                    enabled: true,
                                    recent_billing: {
                                        ...stripe.recent_billing,
                                        enabled: true,
                                    },
                                })
                            } else {
                                setStripe({ ...stripe, enabled: nextEnabled })
                            }
                        }}
                        disabled={isUpdating}
                    />
                    {stripe.enabled && (
                        <div className="mt-4 rounded-lg border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex flex-col gap-1">
                                <p className="text-sm font-medium text-gray-900">
                                    Status:{' '}
                                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs uppercase tracking-wide text-gray-700">
                                        {stripeStatus}
                                    </span>
                                </p>
                                {stripe.stripeUserId?.trim() ? (
                                    <p className="text-xs text-gray-600">
                                        Connected account:{' '}
                                        <code className="rounded bg-gray-100 px-1 text-gray-800">
                                            {stripe.stripeUserId.trim()}
                                        </code>
                                    </p>
                                ) : null}
                            </div>

                            <AppearanceAccordion
                                title="Connection & Security"
                                description="Authorize DocsBot with Stripe OAuth to enable billing support actions."
                                defaultOpen={stripeStatus === 'incomplete'}
                                isLast={false}
                            >
                                <div className="flex flex-col gap-3">
                                    <p
                                        id="stripe-oauth-steps"
                                        className="text-xs text-gray-600"
                                    >
                                        Click the button below to open Stripe and grant
                                        access. When you return, save changes if prompted.
                                        Install the DocsBot Stripe app from the marketplace
                                        if Stripe asks you to.
                                    </p>
                                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                        <button
                                            type="button"
                                            className="inline-flex min-w-[180px] items-center justify-center gap-1.5 whitespace-nowrap rounded-md bg-[#635BFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5145cd] disabled:pointer-events-none disabled:opacity-50"
                                            disabled={
                                                connectLoading ||
                                                isUpdating ||
                                                !stripe.enabled
                                            }
                                            onClick={handleStripeConnect}
                                            aria-describedby="stripe-oauth-steps"
                                        >
                                            {connectLoading ? (
                                                'Connecting…'
                                            ) : stripe.stripeUserId?.trim() ? (
                                                <>
                                                    Reconnect to
                                                    <img
                                                        src="/branding/stripe-wordmark-white.svg"
                                                        alt="Stripe"
                                                        className="h-4 w-auto shrink-0 align-middle"
                                                    />
                                                </>
                                            ) : (
                                                <>
                                                    Connect with
                                                    <img
                                                        src="/branding/stripe-wordmark-white.svg"
                                                        alt="Stripe"
                                                        className="h-4 w-auto shrink-0 align-middle"
                                                    />
                                                </>
                                            )}
                                        </button>
                                        {stripe.stripeUserId?.trim() ? (
                                            <button
                                                type="button"
                                                className="inline-flex items-center justify-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-sm font-medium text-red-700 shadow-sm transition hover:border-red-400 hover:bg-red-50 hover:text-red-800 disabled:pointer-events-none disabled:opacity-50"
                                                disabled={isUpdating || !stripe.enabled}
                                                onClick={handleStripeDisconnect}
                                            >
                                                <LinkSlashIcon
                                                    className="h-5 w-5 shrink-0 text-red-600"
                                                    aria-hidden
                                                />
                                                Disconnect
                                            </button>
                                        ) : null}
                                    </div>
                                    {connectError ? (
                                        <p className="text-xs text-red-600">
                                            {connectError}
                                        </p>
                                    ) : null}
                                    <div className="rounded-md bg-amber-50 p-3 text-xs text-amber-900">
                                        For Stripe tools to work, you must pass the Stripe customer ID in your{' '}
                                        <a href="/documentation/developer/embeddable-chat-widget#trusted-private-metadata-with-bearer-jwt" target="_blank" rel="noopener noreferrer" className="font-medium text-amber-800 underline hover:text-amber-900">widget embed</a>
                                        {' '}or API (as <code>priv_stripe_customer_id</code> in signed metadata). See the linked docs for JWT setup.
                                    </div>
                                </div>
                            </AppearanceAccordion>

                            <AppearanceAccordion
                                title="Subtools"
                                description="Enable customer-scoped support tools."
                                defaultOpen={stripe.enabled}
                                isLast
                            >
                                <div className="flex flex-col">
                                    <div className="border-t border-gray-200 pt-3 first:border-t-0 first:pt-0">
                                        <AppearanceToggle
                                            label="Recent invoices + subscriptions"
                                            description="Agent can look up the customer's recent invoices and subscription status."
                                            enabled={stripe.recent_billing.enabled}
                                            setEnabled={(enabled) =>
                                                setStripe({
                                                    ...stripe,
                                                    recent_billing: { enabled },
                                                })
                                            }
                                            disabled={isUpdating || !stripe.enabled}
                                        />
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <AppearanceToggle
                                            label="Billing portal"
                                            description="Agent can send the customer a link to manage payment method and subscription in Stripe's hosted portal."
                                            enabled={stripe.billing_portal.enabled}
                                            setEnabled={(enabled) =>
                                                setStripe({
                                                    ...stripe,
                                                    billing_portal: {
                                                        ...stripe.billing_portal,
                                                        enabled,
                                                    },
                                                })
                                            }
                                            disabled={isUpdating || !stripe.enabled}
                                        />
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex flex-col gap-3">
                                        <AppearanceToggle
                                            label="Refund latest payment"
                                            description="Agent can refund the customer's most recent payment. Optional rules (below) can restrict when refunds are allowed."
                                            enabled={stripe.refund.enabled}
                                            setEnabled={(enabled) =>
                                                setStripe({
                                                    ...stripe,
                                                    refund: {
                                                        ...stripe.refund,
                                                        enabled,
                                                    },
                                                })
                                            }
                                            disabled={isUpdating || !stripe.enabled}
                                        />
                                        {stripe.refund.enabled && (
                                            <div className="ml-4 flex flex-col gap-3 pb-3">
                                                <AppearanceInput
                                                    id="stripe-refund-rules"
                                                    name="stripe-refund-rules"
                                                    isMultiLine
                                                    rows={4}
                                                    value={stripe.refund.rules}
                                                    onChange={(e) =>
                                                        setStripe({
                                                            ...stripe,
                                                            refund: {
                                                                ...stripe.refund,
                                                                rules: e.target.value,
                                                            },
                                                        })
                                                    }
                                                    disabled={isUpdating || !stripe.enabled}
                                                    placeholder="Approve only if..."
                                                />
                                                <p className="text-xs text-gray-500">
                                                    <a href="/documentation/developer/stripe-actions#refund-guardrails" target="_blank" rel="noopener noreferrer" className="font-medium text-gray-600 underline hover:text-gray-800">
                                                        How refund guardrails work
                                                    </a>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="border-t border-gray-200 pt-3 flex flex-col gap-3">
                                        <AppearanceToggle
                                            label="Cancel subscription"
                                            description="Agent can cancel the customer's active subscription. Optionally require a reason (below)."
                                            enabled={stripe.cancellation.enabled}
                                            setEnabled={(enabled) =>
                                                setStripe({
                                                    ...stripe,
                                                    cancellation: {
                                                        ...stripe.cancellation,
                                                        enabled,
                                                    },
                                                })
                                            }
                                            disabled={isUpdating || !stripe.enabled}
                                        />
                                        {stripe.cancellation.enabled && (
                                            <AppearanceToggle
                                                label="Require cancellation feedback"
                                                description={`Allowed values: ${CANCELLATION_FEEDBACK_ENUMS.map((k) => CANCELLATION_FEEDBACK_LABELS[k]).join(', ')}`}
                                                enabled={stripe.cancellation.require_feedback}
                                                setEnabled={(enabled) =>
                                                    setStripe({
                                                        ...stripe,
                                                        cancellation: {
                                                            ...stripe.cancellation,
                                                            require_feedback: enabled,
                                                        },
                                                    })
                                                }
                                                disabled={isUpdating || !stripe.enabled}
                                            />
                                        )}
                                    </div>
                                </div>
                            </AppearanceAccordion>
                        </div>
                    )}
                </AppearanceActionCategory>
            ) : null}

            {isAgent ? (
                <div className="mt-6 flex flex-col gap-4 border-t border-gray-200 pt-6">
                    <AppearanceToggle
                        label={
                            <BuiltInToolLabel
                                icon={GlobeAltIcon}
                                name="Web Search"
                            />
                        }
                        description={
                            !webSearchModelCompatible
                                ? `Requires ${WEB_SEARCH_COMPATIBLE_MODELS_LABEL}. Current model: ${formatWebSearchModelLabel(webSearchModel)}.`
                                : hasOpenAIKey
                                    ? (
                                        <>
                                            Give your bot the ability to search the web for up to date information.{' '}
                                            <a
                                                href="https://developers.openai.com/api/docs/pricing#built-in-tools"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-cyan-600 underline hover:text-cyan-800"
                                            >
                                                Additional OpenAI API costs apply
                                            </a>
                                            .
                                        </>
                                    )
                                    : 'Give your bot the ability to search the web for up to date information. Requires a team OpenAI API key.'
                        }
                        enabled={webSearchEnabled}
                        setEnabled={(enabled) => {
                            if (enabled && !webSearchModelCompatible) {
                                return
                            }

                            if (
                                enabled &&
                                (!webSearchPlanCheck.allowed ||
                                    (!webSearchEnabled && actionSlotsFull))
                            ) {
                                setShowUpgrade(true)
                                return
                            }

                            if (enabled && !hasOpenAIKey) {
                                onRequireOpenAIKey?.()
                                return
                            }

                            setTools({
                                ...tools,
                                web_search: {
                                    ...(tools?.web_search || {}),
                                    enabled,
                                    live:
                                        enabled && isPublicBot
                                            ? false
                                            : Boolean(tools?.web_search?.live),
                                },
                            })
                        }}
                        disabled={
                            isUpdating ||
                            (!webSearchModelCompatible && !webSearchEnabled)
                        }
                        switchTooltipContent={
                            !webSearchModelCompatible && !webSearchEnabled
                                ? `Requires ${WEB_SEARCH_COMPATIBLE_MODELS_LABEL}. Current model: ${formatWebSearchModelLabel(webSearchModel)}.`
                                : !hasOpenAIKey &&
                                    webSearchPlanCheck.allowed &&
                                    webSearchModelCompatible
                                  ? 'Add your team OpenAI API key in the dialog before enabling web search.'
                                  : undefined
                        }
                        planLabel={
                            !webSearchPlanCheck.allowed
                                ? webSearchPlanCheck.requiredPlanLabel
                                : null
                        }
                        isNew={true}
                    />
                    {!webSearchEnabled &&
                    !hasOpenAIKey &&
                    webSearchPlanCheck.allowed &&
                    webSearchModelCompatible ? (
                        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            Add your team OpenAI API key on the{' '}
                            <Link
                                href="/app/api"
                                className="font-medium underline hover:text-amber-950"
                            >
                                API & Integrations
                            </Link>
                            {' '}page before enabling web search.
                        </div>
                    ) : null}

                    {webSearchEnabled ? (
                        <div className="ml-4 flex flex-col gap-4">
                            <AppearanceToggle
                                label="Live web crawling"
                                description="When enabled, can crawl live external web pages. Slower, best for deeper research tasks."
                                enabled={webSearchLiveEnabled}
                                setEnabled={(enabled) =>
                                    setTools({
                                        ...tools,
                                        web_search: {
                                            ...(tools?.web_search || {}),
                                            enabled: true,
                                            live: enabled,
                                        },
                                    })
                                }
                                disabled={isUpdating || isPublicBot}
                                switchTooltipContent={
                                    isPublicBot
                                        ? 'Public bots use cached web search only for speed. Switch this bot to private to enable live web crawling or override in embed code.'
                                        : undefined
                                }
                            />

                            <div className="flex flex-col gap-2">
                                <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-1">
                                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                                        <label
                                            htmlFor="web-search-allowed-domains"
                                            className="text-xs font-semibold text-gray-900"
                                        >
                                            Allowed domains (optional)
                                        </label>
                                        {!webSearchDomainsPlanCheck.allowed ? (
                                            <Tooltip
                                                content={`Allowed domains for web search are available on the ${webSearchDomainsPlanCheck.requiredPlanLabel} plan or higher.`}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setShowUpgrade(true)}
                                                    className="relative -top-0.5 inline-flex cursor-pointer items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800 hover:bg-cyan-200/80"
                                                >
                                                    {webSearchDomainsPlanCheck.requiredPlanLabel}
                                                </button>
                                            </Tooltip>
                                        ) : null}
                                    </div>
                                    <div className="ml-auto flex shrink-0 items-center">
                                        {webSearchAllowedDomainsCount === 0 ? (
                                            <Tooltip
                                                content="With no domains listed, web search can use results from any site. Add one or more domains below to limit crawling and search to only those sites and their pages."
                                            >
                                                <span className="relative -top-0.5 inline-flex cursor-help items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                                                    All allowed
                                                </span>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip
                                                content="Web search is limited to the domains you listed. The bot will only use pages on those sites when searching the web. Remove every domain (or clear the field) to allow any site again."
                                            >
                                                <span className="relative -top-0.5 inline-flex cursor-help items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-800">
                                                    Restricted
                                                </span>
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                                <div className="relative">
                                    <AppearanceInput
                                        id="web-search-allowed-domains"
                                        name="web-search-allowed-domains"
                                        value={
                                            webSearchDomainsPlanCheck.allowed
                                                ? webSearchAllowedDomainsText
                                                : ''
                                        }
                                        onChange={
                                            webSearchDomainsPlanCheck.allowed
                                                ? (e) => {
                                                      const formattedDomains =
                                                          formatDomainListInputText(
                                                              e.target.value,
                                                          )
                                                      setWebSearchAllowedDomainsText(
                                                          formattedDomains,
                                                      )
                                                      setTools({
                                                          ...tools,
                                                          web_search: {
                                                              ...(tools?.web_search ||
                                                                  {}),
                                                              enabled: true,
                                                              allowed_domains:
                                                                  normalizeWebSearchAllowedDomains(
                                                                      formattedDomains,
                                                                  ).slice(
                                                                      0,
                                                                      WEB_SEARCH_ALLOWED_DOMAINS_MAX,
                                                                  ),
                                                          },
                                                      })
                                                  }
                                                : undefined
                                        }
                                        disabled={
                                            isUpdating ||
                                            !webSearchDomainsPlanCheck.allowed
                                        }
                                        placeholder="example.com, docs.yoursite.com"
                                    />
                                    {!webSearchDomainsPlanCheck.allowed ? (
                                        <button
                                            type="button"
                                            aria-label={`Upgrade to ${webSearchDomainsPlanCheck.requiredPlanLabel} or higher to set allowed web search domains`}
                                            className="absolute inset-0 z-10 cursor-pointer rounded-md bg-transparent"
                                            onClick={() => setShowUpgrade(true)}
                                        />
                                    ) : null}
                                </div>
                                <div className="text-xs text-gray-500">
                                    Full hostnames only, comma-separated. Leave
                                    empty to allow results from any site; when
                                    set, search results & crawling are limited to those domains and
                                    their pages.
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            ) : null}

            <ModalSelectMcpServer
                bot={bot}
                mcpServers={connectedMcpServers}
                open={showMcpModal}
                setOpen={setShowMcpModal}
                enabledServerIds={enabledMcpServerIds}
                onEnableServer={handleEnableMcpServer}
            />

            <ModalSelectSkill
                bot={bot}
                skills={availableWidgetSkills}
                open={showSkillsModal}
                setOpen={setShowSkillsModal}
                enabledSkillIds={enabledWidgetSkillIds}
                onEnableSkill={handleEnableWidgetSkill}
                loading={skillsLoading}
                errorText={skillsError}
            />

        </>
    )
}

export default AppearanceActions
