import { useCallback } from 'react'
import {
    AppearanceToggle,
    AppearanceBlock,
    AppearanceInput,
    AppearanceAccordion,
} from './Appearance.Options'
import LeadCollectionToolSettings from '@/components/LeadCollectionToolSettings'
import Tooltip from '@/components/Tooltip'
import { i18n } from '@/constants/strings.constants'
import {
    BOOKING_ACTION_KEYS,
    BOOKING_ACTIONS,
    DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
    normalizeBookingPathInput,
} from '@/lib/botActions'
import { checkPlanPermission } from '@/utils/helpers'
import { LinkSlashIcon } from '@heroicons/react/24/outline'

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

const AppearanceActions = ({
    bot,
    actions,
    setActions,
    toggleSchedulingAction,
    isAgent,
    labels,
    setLabels,
    isUpdating,
    tools,
    team,
    setTools,
    supportLink,
    setSupportLink,
    leadCollect,
    setLeadCollect,
    toWidgetLeadCollectState,
    setShowUpgrade,
    stripeOAuthLoading,
    setStripeOAuthLoading,
    stripeOAuthError,
    setStripeOAuthError,
    onStripeOAuthPopupClosed,
    canManageStripeActions = false,
}) => {
    const stripe = normalizeStripe(tools?.stripe)
    const stripeStatus = getStripeStatus(stripe)
    const stripePlanCheck = checkPlanPermission(team, 'standard', 'stripeActions')
    const schedulingPlanCheck = checkPlanPermission(team, 'personal', 'bookingActions')
    const connectLoading = stripeOAuthLoading
    const connectError = stripeOAuthError
    const schedulingActions = BOOKING_ACTION_KEYS.map((key) => {
        const meta = BOOKING_ACTIONS[key]
        const active = actions?.[key]
        const bookingValue = active?.[meta.urlKey] || ''
        const isEnabled =
            active?.enabled === undefined ? Boolean(active) : Boolean(active.enabled)
        let normalizedBookingPath = ''
        try {
            normalizedBookingPath = bookingValue
                ? normalizeBookingPathInput(
                      bookingValue,
                      `bot.actions.${key}.${meta.urlKey}`,
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
        setActions((prev) => ({
            ...(prev || {}),
            [actionKey]: {
                ...(prev?.[actionKey] || {}),
                [field]: value,
            },
        }))
    }

    const handleSchedulingToggle = (actionKey, nextEnabled) => {
        if (nextEnabled && !schedulingPlanCheck.allowed) {
            setShowUpgrade(true)
            return
        }

        toggleSchedulingAction(actionKey, nextEnabled)
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

    return (
        <>
            <AppearanceBlock className="flex flex-col gap-4">
                <AppearanceToggle
                    label="Collect Feedback"
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
                        isAgent
                            ? 'Enable Escalation Tool'
                            : 'Enable Support Link'
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
            </AppearanceBlock>

            <LeadCollectionToolSettings
                team={team}
                value={leadCollect}
                onChange={(nextValue) =>
                    setLeadCollect(toWidgetLeadCollectState(nextValue))
                }
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
            />

            {isAgent && (
                <div className="mt-5 border-t border-gray-200 pt-5">
                    <AppearanceBlock
                        title="Scheduling Tools"
                        titleTag="h4"
                        isNew={true}
                        planLabel={
                            !schedulingPlanCheck.allowed
                                ? schedulingPlanCheck.requiredPlanLabel
                                : null
                        }
                        description="Trigger an embedded calendar booking widget to book a meeting with you. When available, the user’s name and email are prefilled. Booking details are also added to metadata so you can see them in logs and the AI can use them for future responses."
                    >
                        <div className="flex flex-col">
                            {schedulingActions.map((action) => (
                                <div
                                    key={action.key}
                                    className="border-t border-gray-200 pt-3 first:border-t-0 first:pt-0 flex flex-col gap-3"
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
                                                className="text-xs font-medium text-gray-700"
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
                                                className="text-xs font-medium text-gray-700"
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
                    </AppearanceBlock>
                </div>
            )}

            {canManageStripeActions ? (
            <div className="mt-5 border-t border-gray-200 pt-5">
                <AppearanceBlock
                    title={
                        <>
                            <span className="inline-flex items-center gap-3 align-middle">
                                <img
                                    src="/branding/stripe-wordmark-blurple.svg"
                                    alt=""
                                    aria-hidden="true"
                                    className="h-5 w-auto"
                                />
                                <span>Billing support</span>
                            </span>
                            <span className="relative -top-0.5 ml-2 inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                                Beta
                            </span>
                            {!stripePlanCheck.allowed && (
                                <Tooltip content={`The Stripe Billing Support Action is available on the ${stripePlanCheck.requiredPlanLabel} plan or higher.`}>
                                    <span className="relative -top-0.5 ml-2 inline-flex cursor-help items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                                        {stripePlanCheck.requiredPlanLabel}
                                    </span>
                                </Tooltip>
                            )}
                        </>
                    }
                    titleTag="h4"
                    description="If you use Stripe for billing, enable this action to help customers with invoices, subscriptions, billing portal, and refunds."
                >
                <AppearanceToggle
                    label="Enable Stripe Tools"
                    enabled={stripe.enabled}
                    setEnabled={(nextEnabled) => {
                        if (nextEnabled && !stripePlanCheck.allowed) {
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
            </AppearanceBlock>
            </div>
            ) : null}
        </>
    )
}

export default AppearanceActions
