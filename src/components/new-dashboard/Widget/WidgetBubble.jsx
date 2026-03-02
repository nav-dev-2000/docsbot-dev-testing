import { useContext } from 'react'
import clsx from 'clsx'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import { WidgetContext } from './Widget'

import { ArrowTopRightOnSquareIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faComment,
  faRobot,
  faLifeRing,
  faInfo,
  faBook,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'

const WidgetBubble = ({
    content,
    isBot = false,
    botIcon = 'robot',
    labels,
    showSources = false,
    showCopyButton = false,
    hideBotIcon = false,
    className,
    children
}) => {
    const { size } = useContext(WidgetContext)
    const isSmall = size === 'sm'

    const cssGlobal = clsx(
        'text-sm leading-snug',
        {
            ['text-slate-800']: isBot,
            ['text-[var(--mybot-text)]']: !isBot,
        }
    )

    const hasBotAvatar = botIcon && botIcon !== 'none' ? true : false
    const botIconMap = {
        none: { icon: false, label: 'None' },
        comment: { icon: faComment, label: 'Comment' },
        robot: { icon: faRobot, label: 'Robot' },
        'life-ring': { icon: faLifeRing, label: 'Life Ring' },
        info: { icon: faInfo, label: 'Info' },
        book: { icon: faBook, label: 'Book' },
        custom: { icon: faPlus, label: 'Custom Icon' },
    }

    return (
        <div
            className={clsx(
                'flex flex-none',
                {
                    ['items-start justify-start gap-2 pr-4']: isBot,
                    ['justify-end pl-4']: !isBot,
                    ['pl-8']: isBot && hasBotAvatar && hideBotIcon
                },
                className,
            )}
        >
            {(isBot && hasBotAvatar && !hideBotIcon) && (
                <div className="flex size-6 flex-none flex-col items-center justify-center rounded-full bg-[var(--mybot-color)] text-[var(--mybot-text)]">
                    {botIcon?.includes('://')
                        ? (
                            <img
                                src={botIcon}
                                alt="icon"
                                className="h-auto w-1/2 object-scale-down"
                            />
                        )
                        : (
                            <FontAwesomeIcon
                                icon={botIconMap[botIcon]?.icon}
                                size="xs"
                            />
                        )}
                </div>
            )}

            <div
                className={clsx(
                    'w-auto max-w-full rounded-xl',
                    isSmall ? 'p-3' : 'p-4',
                    cssGlobal,
                    {
                        ['rounded-tl-[4px] bg-slate-100']: isBot,
                        ['rounded-tr-[4px] bg-[var(--mybot-color)]']: !isBot,
                    }
                )}
            >
                <div className={clsx('w-full prose first:prose-p:my-0', cssGlobal)}>
                    {content && (
                        <div className="w-full">
                            <Streamdown
                                mode="static"
                                isAnimating={false}
                                remarkPlugins={Object.values(defaultRemarkPlugins)}
                            >
                                {content}
                            </Streamdown>
                        </div>
                    )}

                    {showSources && (
                        <>
                            <div className="mb-2 mt-0 flex items-center justify-between border-b border-gray-300 pt-2 text-sm font-semibold text-gray-700">
                                {labels?.sources}

                                {showCopyButton && (
                                    <button
                                        type="button"
                                        className="text-gray-500 transition-colors hover:text-gray-800"
                                        aria-label={labels?.copyResponse || 'Copy response'}
                                        title={labels?.copyResponse || 'Copy response'}
                                    >
                                        <span className="sr-only">
                                            {labels?.copyResponse || 'Copy response'}
                                        </span>
                                        <DocumentDuplicateIcon className="size-3" />
                                    </button>
                                )}
                            </div>

                            <a
                                href="https://docsbot.ai/documentation/developer/embeddable-chat-widget"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between text-sm leading-snug text-gray-700 hover:text-gray-900"
                            >
                                <span>Embeddable Chat Widget - DocsBot</span>
                                <ArrowTopRightOnSquareIcon className="size-4" />
                            </a>
                        </>
                    )}
                </div>

                {children}
            </div>
        </div>
    )
}

export default WidgetBubble
