import { useState, useMemo, useEffect } from 'react'
import SaveDiskIcon from '@new-dashboard/SaveDiskIcon'

import Link from 'next/link'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import Alert from '@/components/Alert'
import Glossary from '@/components/Glossary'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@new-dashboard/Button'
import IconButton from '@new-dashboard/IconButton'
import Tooltip from '@/components/Tooltip'
import Box from '@new-dashboard/Box'
import Workspace from '@new-dashboard/Workspace'
import ModalCheckout from '@/components/ModalCheckout'

const ConfigureGlossary = ({ team, bot, setBot }) => {
    const [errorText, setErrorText] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [bounceSave, setBounceSave] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [botSettings, setBotSettings] = useState({
        glossary: bot?.glossary || [],
    })

    const glossary = botSettings.glossary

    const setGlossary = (newGlossary) => {
        setBotSettings((prev) => ({ ...prev, glossary: newGlossary }))
    }

    const isDirty = useMemo(
        () =>
            JSON.stringify(glossary) !==
            JSON.stringify(bot?.glossary || []),
        [glossary, bot?.glossary],
    )
    useUnsavedChangesWarning(isDirty, isUpdating)

    useEffect(() => {
        // Bounce continuously while there are unsaved changes.
        setBounceSave(Boolean(isDirty && !isUpdating))
    }, [isDirty, isUpdating])

    async function updateBot() {
        setErrorText('')
        setIsUpdating(true)

        const urlParams = ['teams', team.id, 'bots', bot.id]
        const apiPath = '/api/' + urlParams.join('/')

        const response = await fetch(apiPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(botSettings),
        })
        if (response.ok) {
            const data = await response.json()
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
        <div
            id="page-configure-glossary"
            className="h-full overflow-y-auto px-8"
        >
            <ModalCheckout
                team={team}
                open={showUpgrade}
                setOpen={setShowUpgrade}
            />
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header
                    title="Glossary"
                    description="Define a list of words and their equivalents in your documentation for the bot to use when finding relevant sources. This can help the bot understand the user's question better when using brand or product-specific terminology or translations."
                    note={
                        <>
                            Words are case-insensitive and only the full word is
                            matched.
                            <Link
                                href="https://docsbot.ai/documentation/doc/glossary-improve-search-relevance-with-smart-term-replacement"
                                target="_blank"
                                className="ml-1 text-cyan-600 hover:text-cyan-500"
                            >
                                Learn more &rarr;
                            </Link>
                        </>
                    }
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
                            onClick={updateBot}
                            disabled={isUpdating}
                        />
                    </Tooltip>
                </Workspace.Header>

                <div id="form-wrapper" className="flex flex-col gap-2">
                    <Alert title={errorText} type="error" />

                    <Box>
                        <Glossary
                            team={team}
                            bot={bot}
                            glossary={glossary}
                            onGlossaryChange={setGlossary}
                            onUpgradeRequired={() => setShowUpgrade(true)}
                            disabled={isUpdating}
                            showTitle={false}
                            showDescription={false}
                        />
                    </Box>
                </div>

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
                        onClick={updateBot}
                        disabled={isUpdating}
                    />
                </div>
            </div>
        </div>
    )
}

export default ConfigureGlossary
