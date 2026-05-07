import Link from 'next/link'
import { checkPlanPermission } from '@/utils/helpers'
import {
    ClipboardDocumentIcon,
    LinkIcon,
    ListBulletIcon,
    MicrophoneIcon,
    PhotoIcon,
} from '@heroicons/react/24/outline'
import {
    AppearanceToggle,
    AppearanceBlock,
    AppearanceInput,
} from './Appearance.Options'

const DOCSBOT_SQUARE_ICON_SRC = '/branding/docsbot-icon-sq.svg'

const ContentToggleIconLabel = ({ icon: Icon, name }) => (
    <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <Icon className="size-5 text-gray-700" aria-hidden="true" />
        </span>
        <span className="text-sm font-semibold text-gray-900">{name}</span>
    </div>
)

const ContentToggleImageLabel = ({ src, name }) => (
    <div className="flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-gray-200">
            <img
                src={src}
                alt=""
                aria-hidden="true"
                className="size-6 object-contain"
            />
        </span>
        <span className="text-sm font-semibold text-gray-900">{name}</span>
    </div>
)

const AppearanceContent = ({
    isAgent,
    labels,
    setLabels,
    isUpdating,
    hideSources,
    setHideSources,
    showCopyButton,
    setShowCopyButton,
    linkSafetyEnabled,
    setLinkSafetyEnabled,
    imageUploads,
    setImageUploads,
    audioUploads,
    setAudioUploads,
    team,
    branding,
    setBranding,
    keepFooterVisible,
    setKeepFooterVisible,
}) => {
    return (
        <>
            {/* Options: Initial Message */}
            <AppearanceBlock
                title="Initial Message"
                titleTag="label"
                titleProps={{
                    htmlFor: 'message-label',
                    className: '!font-bold',
                }}
                description={
                    <>
                        This text will appear as the first message from the bot
                        displayed to the user. Supports{' '}
                        <Link
                            href="https://www.markdownguide.org/basic-syntax/"
                            target="_blank"
                            className="text-cyan-600 underline hover:font-semibold"
                        >
                            Markdown
                        </Link>
                        . Optional, leave blank to disable.
                    </>
                }
            >
                <AppearanceInput
                    name="message-label"
                    id="message-label"
                    isMultiLine={true}
                    value={labels.firstMessage}
                    onChange={(e) =>
                        setLabels({
                            ...labels,
                            firstMessage: e.target.value,
                        })
                    }
                    disabled={isUpdating}
                    placeholder="Enter your message here..."
                />
            </AppearanceBlock>

            {/* Options: Display Sources and Copy Button */}
            <AppearanceBlock className="flex flex-col gap-2">
                <AppearanceToggle
                    label={
                        <ContentToggleIconLabel
                            icon={ListBulletIcon}
                            name="Display Sources"
                        />
                    }
                    description="Show sources titles and links after answers."
                    enabled={!hideSources}
                    setEnabled={() => setHideSources(!hideSources)}
                    disabled={isUpdating}
                />

                <AppearanceToggle
                    label={
                        <ContentToggleIconLabel
                            icon={ClipboardDocumentIcon}
                            name="Display Copy Button"
                        />
                    }
                    description="Shows a copy-to-clipboard button after answer."
                    enabled={showCopyButton}
                    setEnabled={() => setShowCopyButton(!showCopyButton)}
                    disabled={isUpdating}
                    isNew={true}
                />

                <AppearanceToggle
                    label={
                        <ContentToggleIconLabel
                            icon={LinkIcon}
                            name="Link Safety"
                        />
                    }
                    description="When enabled, clicking links inside the chat widget outside the current site or allowed domains (and their subdomains) will show a confirmation modal."
                    enabled={linkSafetyEnabled}
                    setEnabled={setLinkSafetyEnabled}
                    disabled={isUpdating}
                    isNew={true}
                />

                {isAgent && (
                    <AppearanceToggle
                        label={
                            <ContentToggleIconLabel
                                icon={PhotoIcon}
                                name="Image Uploads"
                            />
                        }
                        description="Allow users to upload images like screenshots to the chat."
                        enabled={imageUploads}
                        setEnabled={setImageUploads}
                        disabled={isUpdating}
                        planLabel={
                            !checkPlanPermission(
                                team,
                                'standard',
                                'imageUploads',
                            ).allowed
                                ? checkPlanPermission(
                                      team,
                                      'standard',
                                      'imageUploads',
                                  ).requiredPlanLabel
                                : null
                        }
                    />
                )}
                {isAgent && (
                    <AppearanceToggle
                        label={
                            <ContentToggleIconLabel
                                icon={MicrophoneIcon}
                                name="Voice input"
                            />
                        }
                        description="Allow users to send voice messages from the widget microphone (requires a supported browser)."
                        enabled={audioUploads}
                        setEnabled={setAudioUploads}
                        disabled={isUpdating}
                        isNew={true}
                        planLabel={
                            !checkPlanPermission(
                                team,
                                'standard',
                                'voiceInputInWidget',
                            ).allowed
                                ? checkPlanPermission(
                                      team,
                                      'standard',
                                      'voiceInputInWidget',
                                  ).requiredPlanLabel
                                : null
                        }
                    />
                )}
            </AppearanceBlock>

            {/* Options: Footer */}
            <AppearanceBlock title="Footer" titleTag="h4" isLast={true}>
                <div className="flex flex-col gap-4">
                    <AppearanceToggle
                        label={
                            <ContentToggleImageLabel
                                src={DOCSBOT_SQUARE_ICON_SRC}
                                name="Display Branding"
                            />
                        }
                        description="If your plan allows you can disable the DocsBot branding in your widget footer."
                        enabled={branding}
                        setEnabled={setBranding}
                        disabled={isUpdating}
                        planLabel={
                            !checkPlanPermission(team, 'business', 'branding')
                                .allowed
                                ? checkPlanPermission(
                                      team,
                                      'business',
                                      'branding',
                                  ).requiredPlanLabel
                                : null
                        }
                    />

                    <AppearanceBlock
                        title="Footer Content"
                        titleTag="label"
                        titleProps={{ htmlFor: 'footer-text' }}
                        description={
                            <>
                                Add optional text that will appear in the widget
                                footer. This is a great place to add a{' '}
                                <button
                                    type="button"
                                    className="text-cyan-600 underline hover:text-cyan-500"
                                    onClick={() => {
                                        setLabels({
                                            ...labels,
                                            footerMessage:
                                                'By starting a conversation, you agree to our [Privacy Policy](/legal/privacy-policy).',
                                        })
                                    }}
                                >
                                    privacy policy disclaimer
                                </button>
                                , etc. Supports{' '}
                                <Link
                                    href="https://www.markdownguide.org/basic-syntax/"
                                    target="_blank"
                                    className="text-cyan-600 underline hover:font-semibold"
                                >
                                    Markdown
                                </Link>
                            </>
                        }
                    >
                        <AppearanceInput
                            id="footer-text"
                            name="footer-text"
                            value={labels.footerMessage}
                            placeholder="Optional footer text"
                            isMultiLine={true}
                            onChange={(e) =>
                                setLabels({
                                    ...labels,
                                    footerMessage: e.target.value,
                                })
                            }
                            disabled={isUpdating}
                        />

                    <AppearanceToggle
                        label="Keep footer visible after conversation starts"
                        description="When enabled, the footer message will remain visible even after the user sends their first message."
                        enabled={keepFooterVisible}
                        setEnabled={() => setKeepFooterVisible(!keepFooterVisible)}
                        disabled={isUpdating}
                        isNew={true}
                        isLast={true}
                        className="mt-4"
                    />
                    </AppearanceBlock>
                </div>
            </AppearanceBlock>
        </>
    )
}

export default AppearanceContent
