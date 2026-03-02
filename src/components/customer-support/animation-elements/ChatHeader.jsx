import clsx from 'clsx'
import DocsBotLogo from '@/components/DocsBotLogo'
import { ArrowPathIcon } from '@heroicons/react/24/solid'

export const ChatHeader = ({ isActive = false, className }) => {
    const transition = 'transition-all duration-75'

    return (
        <div
            className={clsx(
                'relative flex flex-col bg-cyan-600 text-center',
                transition,
                {
                    ['px-4 py-3']: isActive,
                    ['px-6 py-8']: !isActive,
                },
                className,
            )}
        >
            <DocsBotLogo
                className={clsx(
                    'w-auto mx-auto text-white',
                    transition,
                    {
                        ['h-3']: isActive,
                        ['h-5 lg:h-6 mb-2 lg:mb-4']: !isActive,
                    },
                )}
            />

            <div className={clsx(
                'text-white text-sm/6',
                transition,
                {
                    ['overflow-hidden !h-0 opacity-0']: isActive,
                },
            )}>
                AI-powered chatbot to support your business
            </div>

            <ArrowPathIcon
                className={clsx(
                    'size-3.5 absolute top-1/2 right-3 -translate-y-1/2 text-white',
                    transition,
                    {
                        ['overflow-hidden !h-0 opacity-0']: !isActive,
                    },
                )}
            />
        </div>
    )
}
