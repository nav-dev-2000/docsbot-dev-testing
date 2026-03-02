import { useId, useLayoutEffect, useEffect, useRef, useState, useContext } from 'react'
import clsx from 'clsx'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import { WidgetContext } from './Widget'

import DocsBotLogo from '@/components/DocsBotLogo'
import {
    PaperAirplaneIcon,
    PhotoIcon,
    RectangleStackIcon as RectangleStackIconSolid,
    XMarkIcon,
    StopIcon,
} from '@heroicons/react/24/solid'
import { RectangleStackIcon } from '@heroicons/react/24/outline'

const CustomButton = ({
    icon,
    isSolid = false,
    isActive = false,
    ...props
}) => {
    const CustomIcon = icon

    return (
        <button
            className={clsx(
                'flex size-10 items-center justify-center rounded-xl transition',
                'hover:text-[var(--mybot-color)]',
                'disabled:pointer-events-none',
                {
                    ['bg-[var(--mybot-color)] text-[var(--mybot-text)] hover:bg-[var(--mybot-color-800)] hover:text-[var(--mybot-text)] focus:scale-95 disabled:bg-white disabled:text-slate-300']:
                        isSolid,
                    ['border border-[var(--mybot-color)] bg-[var(--mybot-color-800)]']:
                        isSolid && isActive,
                    ['border border-white bg-white text-slate-400 hover:border-[var(--mybot-color)] focus:outline disabled:text-slate-300']:
                        !isSolid,
                    ['!text-[var(--mybot-color)]']: !isSolid && isActive,
                },
            )}
            {...props}
        >
            <CustomIcon className="size-4" />
        </button>
    )
}

const useIsomorphicLayoutEffect =
    typeof window !== 'undefined' ? useLayoutEffect : useEffect

const WidgetFooter = ({
    placeholder,
    className,
    value = '',
    onChange,
    onSend,
    onStop,
    isSending = false,
    labels,
    branding = true,
    isPreview = false,
    disabled = false,
    onImageSelect,
    imageUploadDisabled = false,
    selectedImages = [],
    onRemoveImage,
    showContextBoost = false,
    isContextBoost = false,
    onToggleContextBoost,
    contextBoostDisabled = false,
    modelSelector,
    showImageUpload: propShowImageUpload,
    isDemo = true,
    children,
    ...props
}) => {
    const { size } = useContext(WidgetContext)
    const isSmall = size === 'sm'
    const uniqueId = useId()
    const fileInputRef = useRef(null)
    const textareaRef = useRef(null)

    const [isHover, setIsHover] = useState(false)
    const [isActive, setIsActive] = useState(false)

    const isSendDisabled = disabled || !value.trim() || isSending
    const showImageUpload = propShowImageUpload ?? Boolean(onImageSelect)
    const hasSelectedImages = showImageUpload && selectedImages.length > 0

    useIsomorphicLayoutEffect(() => {
        const textarea = textareaRef.current
        if (!textarea) return

        const maxHeight = 140
        textarea.style.height = 'auto'
        const nextHeight = Math.min(textarea.scrollHeight, maxHeight)
        textarea.style.height = `${nextHeight}px`
        textarea.style.overflowY =
            textarea.scrollHeight > maxHeight ? 'auto' : 'hidden'

        if (textarea.scrollHeight > maxHeight) {
            textarea.scrollTop = textarea.scrollHeight
        }
    }, [value, hasSelectedImages])

    const functionalTextarea = !isPreview && {
        onChange: (event) => {
            onChange?.(event.currentTarget.value)
        },
        onKeyDown: (event) => {
            if (event.isComposing || event.keyCode === 229) {
                return
            }

            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()

                if (!isSendDisabled) {
                    onSend?.(value)
                }
            }
        }
    }

    const Container = ({ className, children }) => {
        return (
            <div className={clsx(
                'flex-none relative z-0',
                isSmall ? 'px-4' : 'px-6',
                className
            )} {...props}>
                <div className="-mt-4 pb-6">
                    {children}
                </div>
            </div>
        )
    }

    const Privacy = ({ hasMessage = false, hasBranding = false }) => {
        return (
            <div className="pt-2 text-center text-sm text-slate-500">
                {hasMessage && labels?.footerMessage && (
                    <div className="prose mt-0.5 w-full text-center text-xs text-gray-500 first:prose-p:mt-0 last:prose-p:mb-0">
                        <Streamdown
                            mode="static"
                            isAnimating={false}
                            remarkPlugins={Object.values(defaultRemarkPlugins)}
                        >
                            {labels.footerMessage}
                        </Streamdown>
                    </div>
                )}

                {hasBranding && (
                    <div className="flex items-center justify-center gap-1.5 text-[11px]/[14px] font-semibold text-slate-700">
                        Powered by{' '}
                        <DocsBotLogo
                            className="h-2.5 w-auto"
                            style={{ color: 'var(--mybot-logo-on-light, var(--mybot-color, #374151))' }}
                        />
                    </div>
                )}
            </div>
        )
    }

    if (!isDemo) {
        return (
            <Container className={className} {...props}>
                {children}

                {/* Privacy */}
                {(branding || labels?.footerMessage) && (
                    <Privacy
                        hasMessage={Boolean(labels?.footerMessage)}
                        hasBranding={Boolean(branding)}
                    />
                )}
            </Container>
        )
    }

    return (
        <Container className={className} {...props}>
                {/* Form */}
                <div className="flex w-full flex-col">
                    <div
                        className={clsx(
                            'relative flex flex-1 rounded-2xl border border-slate-300 bg-white transition',
                            {
                                ['hover:border-[var(--mybot-color)]']:
                                    isHover || isActive,
                            },
                        )}
                    >
                        <div className="flex flex-1 flex-col">
                            <textarea
                                ref={textareaRef}
                                id={`docsbot-widget-${uniqueId}`}
                                rows={1}
                                maxLength={500}
                                value={value}
                                placeholder={placeholder ?? 'Send a message...'}
                                disabled={disabled}
                                className={clsx(
                                    'h-auto max-h-[140px] min-h-[50px] resize-none rounded-2xl border-none p-4 text-sm/[20px] text-slate-800',
                                    'placeholder:text-slate-400',
                                    'hover:ring-0 focus:ring-0 focus-visible:ring-0',
                                    'disabled:bg-slate-50 disabled:text-slate-400',
                                    {
                                        ['pb-2']: !isPreview && hasSelectedImages,
                                        ['pb-[52px]']: !isPreview && !hasSelectedImages,
                                    },
                                )}
                                onMouseEnter={() => setIsHover(true)}
                                onMouseLeave={() => setIsHover(false)}
                                onFocus={() => setIsActive(true)}
                                onBlur={() => setIsActive(false)}
                                {...functionalTextarea}
                                readOnly={isPreview}
                            />

                            {hasSelectedImages && (
                                <div className="flex flex-wrap gap-1.5 p-4 pt-2">
                                    {selectedImages.map((imageUrl, index) => (
                                        <div
                                            key={`${imageUrl}-${index}`}
                                            className="relative"
                                        >
                                            <img
                                                src={imageUrl}
                                                alt={`Selected ${index + 1}`}
                                                className="size-12 rounded-lg object-cover shadow-sm ring-1 ring-slate-200"
                                            />
                                            <button
                                                type="button"
                                                className={clsx(
                                                    'absolute -right-1 -top-1 rounded-full bg-slate-600/90 p-1 text-white shadow transition hover:bg-slate-700',
                                                    'disabled:cursor-not-allowed disabled:opacity-60',
                                                )}
                                                onClick={() =>
                                                    onRemoveImage?.(index)
                                                }
                                                disabled={disabled}
                                                aria-label="Remove image"
                                            >
                                                <XMarkIcon className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div
                            className={clsx(
                                'absolute flex flex-none items-center justify-end gap-1',
                                {
                                    ['top-1/2 right-1.5 -translate-y-1/2']: isPreview,
                                    ['bottom-4 right-4']: !isPreview && hasSelectedImages,
                                    ['bottom-0 left-0 right-0 rounded-b-2xl p-1.5']: !isPreview && !hasSelectedImages,
                                    ['bg-white']: !isPreview,
                                },
                            )}
                        >
                            <div className="flex items-center gap-1">
                                {showImageUpload && (
                                    <>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={(event) => {
                                                onImageSelect?.(event)
                                            }}
                                        />
                                        <CustomButton
                                            icon={PhotoIcon}
                                            disabled={
                                                disabled || imageUploadDisabled
                                            }
                                            onClick={() => {
                                                if (
                                                    disabled ||
                                                    imageUploadDisabled
                                                ) {
                                                    return
                                                }

                                                fileInputRef.current?.click()
                                            }}
                                            aria-label="Upload image"
                                        />
                                    </>
                                )}
                                {showContextBoost && (
                                    <CustomButton
                                        icon={
                                            isContextBoost
                                                ? RectangleStackIconSolid
                                                : RectangleStackIcon
                                        }
                                        isActive={isContextBoost}
                                        disabled={
                                            disabled || contextBoostDisabled
                                        }
                                        onClick={() => {
                                            if (
                                                disabled ||
                                                contextBoostDisabled
                                            ) {
                                                return
                                            }

                                            onToggleContextBoost?.()
                                        }}
                                        aria-label="Toggle context boost"
                                    />
                                )}
                                {modelSelector && (
                                    <div className="flex items-center">
                                        {modelSelector}
                                    </div>
                                )}
                            </div>

                            <div className="flex-none">
                                {isSending && onStop ? (
                                    <CustomButton
                                        icon={StopIcon}
                                        isSolid={true}
                                        onClick={onStop}
                                        aria-label="Stop generating"
                                    />
                                ) : (
                                    <CustomButton
                                        icon={PaperAirplaneIcon}
                                        isSolid={true}
                                        disabled={isSendDisabled}
                                        onClick={() => {
                                            if (!isSendDisabled) {
                                                onSend?.(value)
                                            }
                                        }}
                                        aria-label="Send message"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Privacy */}
                {(branding || labels?.footerMessage) && (
                    <Privacy
                        hasMessage={Boolean(labels?.footerMessage)}
                        hasBranding={branding}
                    />
                )}
        </Container>
    )
}

export default WidgetFooter
