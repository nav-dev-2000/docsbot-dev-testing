import { useState, useMemo } from 'react'
import { CloudArrowUpIcon } from '@heroicons/react/24/outline'

import Alert from '@/components/Alert'
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning'
import SuggestedQuestions from '@/components/SuggestedQuestions'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@new-dashboard/Button'
import IconButton from '@new-dashboard/IconButton'
import Tooltip from '@/components/Tooltip'
import Box from '@new-dashboard/Box'
import Workspace from '@new-dashboard/Workspace'

const ConfigureQuestions = ({ team, bot, setBot }) => {
    const [errorText, setErrorText] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [botSettings, setBotSettings] = useState({
        questions: bot?.questions || [],
    })

    const questions = botSettings.questions

    const updateQuestion = (index, newQuestion) => {
        setBotSettings((prev) => {
            const newQuestions = [...prev.questions]
            newQuestions[index] = newQuestion
            return { ...prev, questions: newQuestions }
        })
    }

    const removeQuestion = (index) => {
        setBotSettings((prev) => {
            const newQuestions = [...prev.questions]
            newQuestions.splice(index, 1)
            return { ...prev, questions: newQuestions }
        })
    }

    const addQuestion = () => {
        setBotSettings((prev) => {
            const newQuestions = [...prev.questions]
            newQuestions.push('')
            return { ...prev, questions: newQuestions }
        })
    }

    const isDirty = useMemo(
        () =>
            JSON.stringify(questions) !==
            JSON.stringify(bot?.questions || []),
        [questions, bot?.questions],
    )
    useUnsavedChangesWarning(isDirty, isUpdating)

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
            id="page-configure-questions"
            className="h-full overflow-y-auto px-8"
        >
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header
                    title="Suggested Questions"
                    description="Shape the conversation from the start by surfacing curated questions directly in your chat interface."
                >
                    <Tooltip content="Save Changes">
                        <IconButton
                            icon={isUpdating ? LoadingSpinner : CloudArrowUpIcon}
                            label="Save Changes"
                            theme="blueSolid"
                            size="sm"
                            onClick={updateBot}
                            disabled={isUpdating}
                        />
                    </Tooltip>
                </Workspace.Header>

                <div id="form-wrapper" className="flex flex-col gap-2">
                    <Alert title={errorText} type="error" />

                    <Box>
                        <SuggestedQuestions
                            questions={questions}
                            addQuestion={addQuestion}
                            updateQuestion={updateQuestion}
                            removeQuestion={removeQuestion}
                            placeholder={`What is ${bot?.name}?`}
                            showTitle={false}
                            showDescription={false}
                        />
                    </Box>
                </div>

                <div className="col-start-1 row-start-3 flex justify-end md:sticky md:top-0 md:col-start-2 md:row-start-1 md:h-min">
                    <Button
                        label={isUpdating ? 'Saving' : 'Save Changes'}
                        icon={isUpdating ? LoadingSpinner : CloudArrowUpIcon}
                        theme="blueSolid"
                        size="md"
                        onClick={updateBot}
                        disabled={isUpdating}
                    />
                </div>
            </div>
        </div>
    )
}

export default ConfigureQuestions
