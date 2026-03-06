import { Fragment, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import Widget from '@new-dashboard/Widget'
import { LeadCollectPreview } from '@/components/WidgetPreview'
import { isLeadCollectEnabled } from '@/lib/leadCollect'
import SegmentedControl from '../SegmentedControl'

const isExternalImage = (value) =>
    typeof value === 'string' && value.includes('://')

const ApperancePreview = ({
    bot,
    logo,
    headerAlignment,
    alignment,
    branding,
    icon,
    botIcon,
    showButtonLabel,
    labels,
    hideSources,
    showCopyButton,
    supportLink,
    isAgent,
    tools,
    imageUploads,
    leadCollect,
    color,
    size,
    containerWidth,
}) => {
    const [previewMode, setPreviewMode] = useState('widget') // 'widget' | 'embed'
    const leadCollectEnabled = isLeadCollectEnabled(leadCollect)
    const leadCollectMode = leadCollect?.mode || 'before_response'
    const showLeadCollectBeforeResponse =
        leadCollectEnabled && leadCollectMode === 'before_response'
    const showLeadCollectBeforeEscalation =
        leadCollectEnabled && leadCollectMode === 'before_escalation'

    const canEscalate = tools?.human_escalation?.enabled === true
    const canCollectFeedback = tools?.followup_rating?.enabled === true
    const FeedbackWrapper = canCollectFeedback ? 'div' : Fragment

    const imageUrls = useMemo(() => {
        const urls = [logo, botIcon, icon].filter(isExternalImage)
        return Array.from(new Set(urls))
    }, [logo, botIcon, icon])

    const [isLoadingImages, setIsLoadingImages] = useState(imageUrls.length > 0)

    useEffect(() => {
        if (imageUrls.length === 0) {
            setIsLoadingImages(false)
            return
        }

        let isActive = true
        const loaded = new Set()
        let remaining = imageUrls.length

        const markLoaded = (url) => {
            if (!isActive || loaded.has(url)) return
            loaded.add(url)
            remaining -= 1
            if (remaining <= 0) {
                setIsLoadingImages(false)
            }
        }

        setIsLoadingImages(true)

        imageUrls.forEach((url) => {
            const image = new Image()
            image.onload = () => markLoaded(url)
            image.onerror = () => markLoaded(url)
            image.src = url

            if (image.complete) {
                markLoaded(url)
            }
        })

        return () => {
            isActive = false
        }
    }, [imageUrls])

    const previewSkeleton = (
        <>
            <div className="min-h-0 w-full flex-1 overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="bg-[var(--mybot-color)] px-6 py-8">
                    <div className="mx-auto h-4 w-32 animate-pulse rounded bg-white/50" />
                    <div className="mx-auto mt-2 h-3 w-44 animate-pulse rounded bg-white/40" />
                </div>
                <div className="flex flex-col gap-4 p-6">
                    <div className="flex items-start gap-2">
                        <div className="size-6 animate-pulse rounded-full bg-gray-200/80" />
                        <div className="h-14 w-3/4 animate-pulse rounded-xl bg-gray-100" />
                    </div>
                    <div className="flex justify-end">
                        <div className="h-12 w-2/3 animate-pulse rounded-xl bg-gray-100" />
                    </div>
                    <div className="flex items-start gap-2">
                        <div className="size-6 animate-pulse rounded-full bg-gray-200/80" />
                        <div className="h-16 w-4/5 animate-pulse rounded-xl bg-gray-100" />
                    </div>
                    <div className="mt-2 h-12 w-full animate-pulse rounded-2xl bg-gray-100" />
                </div>
            </div>
            <div className="mt-6 flex">
                <div
                    className={clsx(
                        alignment === 'right' ? 'ml-auto' : 'mr-auto',
                        showButtonLabel
                            ? 'h-12 w-32 rounded-2xl'
                            : 'h-14 w-14 rounded-3xl',
                        'animate-pulse bg-gray-200/80',
                    )}
                />
            </div>
        </>
    )

    return (
        <div className="flex h-full w-full flex-col items-center">
            <div className="-mt-10 mb-4 flex w-full justify-end">
                <SegmentedControl
                    value={previewMode}
                    onChange={setPreviewMode}
                    options={[
                        { value: 'widget', label: 'Widget' },
                        { value: 'embed', label: 'Embed' },
                    ]}
                />
            </div>
            <div
                className={clsx(
                    'flex h-full w-full flex-col items-center',
                    previewMode === 'widget' ? 'w-[448px]' : 'w-full',
                )}
            >
                {isLoadingImages ? (
                    previewSkeleton
                ) : (
                    <>
                        <Widget
                            className="min-h-0 w-full flex-1"
                            size={size}
                            containerWidth={containerWidth}
                        >
                        <Widget.Header
                            title={bot.name}
                            subtitle={bot.description}
                            logo={logo}
                            alignment={headerAlignment}
                        />

                        <Widget.Body className="flex flex-col gap-4">
                            <Widget.Bubble
                                content={labels.firstMessage}
                                isBot={true}
                                botIcon={botIcon}
                                showCopyButton={showCopyButton}
                            />

                                <Widget.Bubble
                                    content={'Why are you so amazing?'}
                                />

                            {showLeadCollectBeforeResponse && (
                                <Fragment>
                                    <Widget.Bubble
                                        content={
                                            labels?.leadCollectMessage ||
                                            'Before we continue, could you share a few details?'
                                        }
                                        isBot={true}
                                        botIcon={botIcon}
                                        labels={labels}
                                    />
                                    <LeadCollectPreview
                                        leadCollect={leadCollect}
                                        labels={labels}
                                        color={color}
                                    />
                                </Fragment>
                            )}

                            <FeedbackWrapper
                                {...(canCollectFeedback && {
                                    className: 'flex flex-col gap-2',
                                })}
                            >
                                <Widget.Bubble
                                    content={
                                        "Thanks! Is there anything specific you would like to know about DocsBot or our [Embeddable Chat Widget](https://docsbot.ai/documentation/developer/embeddable-chat-widget)? I'm here to assist you!"
                                    }
                                    isBot={true}
                                    botIcon={botIcon}
                                    labels={labels}
                                    showSources={!hideSources}
                                    showCopyButton={showCopyButton}
                                />

                                {canCollectFeedback && (
                                    <>
                                        <Widget.Bubble
                                            content={labels.feedbackMessage}
                                            isBot={true}
                                            botIcon={botIcon}
                                            hideBotIcon={true}
                                        />

                                        <Widget.Feedback
                                            labels={labels}
                                            botIcon={botIcon}
                                        />
                                    </>
                                )}
                            </FeedbackWrapper>

                            {canEscalate && isAgent && (
                                <Fragment>
                                    <Widget.Bubble
                                        content={'Can I talk to someone?'}
                                    />

                                    <div
                                        {...(canEscalate && {
                                            className: 'flex flex-col gap-2',
                                        })}
                                    >
                                        <Widget.Bubble
                                            content={
                                                'Sure, can I connect you to the support team?'
                                            }
                                            isBot={true}
                                            botIcon={botIcon}
                                        />

                                        {showLeadCollectBeforeEscalation && (
                                            <Fragment>
                                                <Widget.Bubble
                                                    content={
                                                        labels?.leadCollectMessage ||
                                                        'Before we continue, could you share a few details?'
                                                    }
                                                    isBot={true}
                                                    botIcon={botIcon}
                                                    labels={labels}
                                                    hideBotIcon={true}
                                                />
                                                <LeadCollectPreview
                                                    leadCollect={leadCollect}
                                                    labels={labels}
                                                    color={color}
                                                />
                                            </Fragment>
                                        )}

                                        <Widget.Feedback
                                            labels={labels}
                                            botIcon={botIcon}
                                            supportLink={supportLink}
                                            isAgent={isAgent}
                                            canEscalate={canEscalate}
                                        />
                                    </div>
                                </Fragment>
                            )}

                            {canEscalate && !isAgent && (
                                <Widget.Feedback
                                    labels={labels}
                                    botIcon={botIcon}
                                    supportLink={supportLink}
                                    isAgent={isAgent}
                                    canEscalate={canEscalate}
                                    className="-mt-2"
                                />
                            )}
                        </Widget.Body>

                        <Widget.Footer
                            placeholder="Send a message..."
                            labels={labels}
                            branding={branding}
                            isPreview={true}
                            showImageUpload={imageUploads && isAgent}
                        />
                    </Widget>

                    {previewMode === 'widget' && (
                        <Widget.Trigger
                            label={labels.floatingButton}
                            icon={icon === 'default' ? 'comment' : icon}
                            alignment={alignment}
                            showLabel={showButtonLabel}
                        />
                    )}
                </>
            )}
            </div>
        </div>
    )
}

export default ApperancePreview
