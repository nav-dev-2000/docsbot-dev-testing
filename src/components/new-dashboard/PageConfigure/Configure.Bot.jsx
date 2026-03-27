import { useState, useEffect, useMemo, useRef, forwardRef } from 'react'
import { i18n } from '@/constants/strings.constants'
import clsx from 'clsx'

import Link from 'next/link'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import Alert from '@/components/Alert'
import FormBot from '@/components/FormBotNew'
import ModalOpenAI from '@/components/ModalOpenAI'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@new-dashboard/Button'
import IconButton from '@new-dashboard/IconButton'
import Tooltip from '@/components/Tooltip'
import Workspace from '@new-dashboard/Workspace'

import SaveDiskIcon from '@new-dashboard/SaveDiskIcon'

/** Keys managed only in the form UI, not persisted with bot settings. */
const SYSTEM_FORM_ONLY_KEYS = new Set(['classify'])
/** Optional strings where empty and undefined compare equal (matches dirty detection). */
const SYSTEM_OPTIONAL_STRING_KEYS = new Set([
    'agentPrompt',
    'agentRole',
    'description',
])
/** Array fields where missing/undefined on the bot equals an empty form default. */
const SYSTEM_OPTIONAL_ARRAY_KEYS = new Set([
    'glossary',
    'questions',
    'rateLimitIPAllowlist',
])
const SYSTEM_DEFAULT_MODEL = 'gpt-5.4-nano'

/** Stable stringify so label maps compare equal regardless of key insertion order (Firestore / spread vs i18n object). */
const stableStringify = (value) => {
    const seen = new WeakSet()
    const walk = (v) => {
        if (v === null || typeof v !== 'object') {
            return v
        }
        if (seen.has(v)) {
            return '[Circular]'
        }
        seen.add(v)
        if (Array.isArray(v)) {
            return v.map(walk)
        }
        const out = {}
        for (const key of Object.keys(v).sort()) {
            out[key] = walk(v[key])
        }
        return out
    }
    try {
        return JSON.stringify(walk(value))
    } catch {
        return JSON.stringify(value)
    }
}

function systemSettingValuesDiffer(key, formValue, savedValue) {
    if (SYSTEM_OPTIONAL_STRING_KEYS.has(key)) {
        return (formValue || undefined) !== (savedValue || undefined)
    }
    if (key === 'model') {
        const normA = formValue || SYSTEM_DEFAULT_MODEL
        const normB = savedValue || SYSTEM_DEFAULT_MODEL
        return normA !== normB
    }
    if (key === 'labels') {
        return stableStringify(formValue) !== stableStringify(savedValue)
    }
    if (SYSTEM_OPTIONAL_ARRAY_KEYS.has(key)) {
        const normA = Array.isArray(formValue) ? formValue : []
        const normB = Array.isArray(savedValue) ? savedValue : []
        return JSON.stringify(normA) !== JSON.stringify(normB)
    }
    return JSON.stringify(formValue) !== JSON.stringify(savedValue)
}

const Block = forwardRef(function Block(
    { tagName, title, icon, value, ...props },
    ref,
) {
    const MainComponent = tagName || 'div'
    const SubComponent = props.href ? Link : 'button'
    const IconComponent = icon

    const Content = () => {
        return (
            <>
                <div className="flex items-center gap-2 text-gray-500">
                    {icon && <IconComponent className="size-4 flex-none" />}
                    <span className="block flex-1 truncate text-sm font-medium">
                        {title}
                    </span>
                </div>

                <div className="mt-2 truncate text-2xl font-medium text-gray-800">
                    {value}
                </div>
            </>
        )
    }

    const cssDefault =
        'block rounded-lg border border-gray-200 bg-white px-6 py-4'
    const cssHover = 'transition hover:border-cyan-500'

    if (props.href || props.onClick) {
        return (
            <MainComponent className="block" ref={ref}>
                <SubComponent {...props} className={clsx(cssDefault, cssHover)}>
                    <Content />
                </SubComponent>
            </MainComponent>
        )
    }

    return (
        <MainComponent className={cssDefault} ref={ref}>
            <Content />
        </MainComponent>
    )
})

const PageConfigureBot = ({ team, bot, setBot }) => {
    const [open, setOpen] = useState(false)
    const [errorText, setErrorText] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [bounceSave, setBounceSave] = useState(false)
    const [botSettings, setBotSettings] = useState({})
    const [showOpenAI, setShowOpenAI] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash === '#model-section') {
            const el = document.getElementById('model-section')
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }, [bot])

    useEffect(() => {
        if (
            open &&
            !showOpenAI &&
            !team.openAIKey &&
            ![
                'gpt-5.4-nano',
                'gpt-5-nano',
                'gpt-5-mini',
                'gpt-4o-mini',
                'gpt-4.1-mini',
                'gpt-4.1-nano',
            ].includes(botSettings.model)
        ) {
            setShowOpenAI(true)
        }
    }, [botSettings])

    useEffect(() => {
        if (!showOpenAI && !team.openAIKey) {
            // Only set default model if no model is already set or if the current model requires an API key
            const currentModel = botSettings.model || bot?.model
            const modelsThatRequireAPIKey = [
                'gpt-5.4-mini',
                'gpt-5.1',
                'gpt-5',
                'gpt-4.1',
                'gpt-4o',
            ]

            if (
                !currentModel ||
                modelsThatRequireAPIKey.includes(currentModel)
            ) {
                const defaultModel = 'gpt-5.4-nano'
                setBotSettings({ ...botSettings, model: defaultModel })
            }
        }
    }, [showOpenAI, botSettings.model, bot?.model])

    const systemDirtySnapshot = useMemo(() => {
        const reasons = []
        for (const key of Object.keys(botSettings)) {
            if (SYSTEM_FORM_ONLY_KEYS.has(key)) continue
            const a = botSettings[key]
            const b = bot?.[key]
            if (systemSettingValuesDiffer(key, a, b)) {
                reasons.push({ field: key, current: a, saved: b })
            }
        }
        return { dirty: reasons.length > 0, reasons }
    }, [botSettings, bot])

    const isDirty = systemDirtySnapshot.dirty

    useUnsavedChangesWarning(isDirty, isUpdating)

    useEffect(() => {
        // Bounce continuously while there are unsaved changes.
        setBounceSave(Boolean(isDirty && !isUpdating))
    }, [isDirty, isUpdating])

    const lastSystemBounceLogKey = useRef('')
    useEffect(() => {
        if (!bounceSave) {
            lastSystemBounceLogKey.current = ''
            return
        }
        const key = JSON.stringify(systemDirtySnapshot.reasons)
        if (lastSystemBounceLogKey.current === key) return
        lastSystemBounceLogKey.current = key
        console.log(
            '[PageConfigure.General] Save button bouncing — unsaved changes:',
            systemDirtySnapshot.reasons,
        )
    }, [bounceSave, systemDirtySnapshot])

    async function updateBot() {
        setErrorText('')
        setIsUpdating(true)

        const changedSettings = Object.fromEntries(
            Object.entries(botSettings).filter(([key, value]) => {
                if (key === 'classify') return false
                return systemSettingValuesDiffer(key, value, bot?.[key])
            }),
        )

        const urlParams = ['teams', team.id, 'bots', bot.id]
        const apiPath = '/api/' + urlParams.join('/')

        const response = await fetch(apiPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(changedSettings),
        })
        if (response.ok) {
            const data = await response.json()
            setOpen(false)
            setIsUpdating(false)
            setBot(data)
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText(response.status + ', please try again.')
            }
            setIsUpdating(false)
        }
    }

    return (
        <div id="page-configure-bot" className="h-full overflow-y-auto px-8">
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header
                    title="System"
                    description="Power your bot with the right model, fine-tune performance limits, and configure its core intelligence."
                >
                    <Tooltip content="Save Changes">
                        <IconButton
                            icon={isUpdating ? LoadingSpinner : SaveDiskIcon}
                            label="Save Changes"
                            theme={isDirty && !isUpdating ? 'blueSolid' : undefined}
                            className={
                                bounceSave && isDirty && !isUpdating
                                    ? 'animate-bounce'
                                    : undefined
                            }
                            size="sm"
                            type="submit"
                            name="submit-form"
                            form="bot-settings-form"
                            disabled={isUpdating}
                        />
                    </Tooltip>
                </Workspace.Header>

                <div
                    id="form-wrapper"
                    className="col-span-1 col-start-1 row-start-2 flex flex-col md:col-span-2"
                >
                    <Alert title={errorText} type="error" />

                    <form
                        id="bot-settings-form"
                        onSubmit={(e) => {
                            e.preventDefault()
                            updateBot()
                        }}
                        className="flex flex-col gap-6"
                    >
                        <FormBot
                            {...{ team, setBotSettings }}
                            bot={{ ...bot, ...botSettings }}
                            disabled={isUpdating}
                            newDashboard={true}
                            onOpenAIKeyRequired={() => setShowOpenAI(true)}
                        />
                    </form>
                </div>

                {/* Save Button - Placed last in DOM for accessibility, positioned via Grid */}
                <div className="col-start-1 row-start-3 flex justify-end md:sticky md:top-0 md:col-start-2 md:row-start-1 md:h-min">
                    <Button
                        label={isUpdating ? 'Saving' : 'Save Changes'}
                        icon={isUpdating ? LoadingSpinner : SaveDiskIcon}
                        theme={isDirty && !isUpdating ? 'blueSolid' : undefined}
                        className={
                            isDirty && !isUpdating ? 'animate-pulse'
                                : undefined
                        }
                        size="md"
                        type="submit"
                        name="submit-form"
                        form="bot-settings-form"
                        disabled={isUpdating}
                    />
                </div>

                <ModalOpenAI
                    team={team}
                    open={showOpenAI}
                    setOpen={setShowOpenAI}
                    onKey={(key) => {
                        team.openAIKey = key
                        setOpen(true)
                    }}
                />
            </div>
        </div>
    )
}

export default PageConfigureBot
