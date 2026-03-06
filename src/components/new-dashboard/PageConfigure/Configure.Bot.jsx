import { useState, useEffect, useMemo, forwardRef } from 'react'
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
                'gpt-5.1',
                'gpt-5',
                'gpt-4.1',
                'gpt-4o',
            ]

            if (
                !currentModel ||
                modelsThatRequireAPIKey.includes(currentModel)
            ) {
                const defaultModel = 'gpt-4.1-mini'
                setBotSettings({ ...botSettings, model: defaultModel })
            }
        }
    }, [showOpenAI, botSettings.model, bot?.model])

    const isDirty = useMemo(() => {
        const formOnlyKeys = new Set(['classify'])
        // Treat empty string and undefined as equal for optional string fields (avoids false dirty when agent mode is off and agentPrompt is unset)
        const optionalStringKeys = new Set(['agentPrompt', 'agentRole', 'description'])
        const defaultModel = 'gpt-5-mini'
        return Object.keys(botSettings)
            .filter((key) => !formOnlyKeys.has(key))
            .some((key) => {
                const a = botSettings[key]
                const b = bot?.[key]
                if (optionalStringKeys.has(key)) {
                    return (a || undefined) !== (b || undefined)
                }
                if (key === 'model') {
                    const normA = a || defaultModel
                    const normB = b || defaultModel
                    return normA !== normB
                }
                return JSON.stringify(a) !== JSON.stringify(b)
            })
    }, [botSettings, bot])

    useUnsavedChangesWarning(isDirty, isUpdating)

    async function updateBot() {
        setErrorText('')
        setIsUpdating(true)

        const changedSettings = Object.fromEntries(
            Object.entries(botSettings).filter(([key, value]) => {
                if (key === 'classify') return false
                return JSON.stringify(value) !== JSON.stringify(bot?.[key])
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
                            theme="blueSolid"
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
                        theme="blueSolid"
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
