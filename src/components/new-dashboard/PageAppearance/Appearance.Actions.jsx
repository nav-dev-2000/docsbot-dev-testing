import { checkPlanPermission } from '@/utils/helpers'
import {
    AppearanceToggle,
    AppearanceBlock,
    AppearanceInput,
} from './Appearance.Options'
import LeadCollectionToolSettings from '@/components/LeadCollectionToolSettings'
import { i18n } from '@/constants/strings.constants'

const AppearanceActions = ({
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
}) => {
    return (
        <>
            {/* Options: Collect Feedback, Link Safety, and Image Uploads */}
            <AppearanceBlock className="flex flex-col gap-2">
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
            </AppearanceBlock>

            {/* Options: Escalation Tool (Support Link) */}
            <AppearanceBlock
                title={isAgent ? 'Escalation Tool' : 'Support Link'}
                titleTag="h4"
                description={
                    isAgent
                        ? 'Enable escalation detection tool to allow the bot to detect when a user needs to speak to a human, and ask them to confirm.'
                        : 'Enable a support link button in the widget.'
                }
            >
                <div className="flex flex-col gap-4">
                    <AppearanceToggle
                        label={
                            isAgent
                                ? 'Enable Escalation Tool'
                                : 'Enable Support Link'
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
                        <>
                            <AppearanceBlock
                                title="Button Link"
                                titleTag="label"
                                titleProps={{
                                    htmlFor: 'support-link',
                                }}
                                description={
                                    isAgent
                                        ? 'This link will be used when the user confirms they need to speak to a human. Optional, you can register a JS event instead.'
                                        : 'This link will appear after the bot replies.'
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
                        </>
                    )}
                </div>
            </AppearanceBlock>

            {/* Options: Lead Collection Tool */}
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
        </>
    )
}

export default AppearanceActions
