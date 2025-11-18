import Image from "next/image"
import clsx from "clsx"
import RobotIconSolid from "@/components/RobotIconSolid"
import human from '@/images/app-demo/docsbot-avatar-human.webp'

const Avatar = ({ avatar, isBot, isInsideChat, shadowSize, shadowColor }) => {
    if ( !avatar ) return null;

    return (
        <div
            className={clsx(
                'flex-none rounded-full',
                `shadow-${shadowSize} shadow-${shadowColor}`,
                {
                    ['size-6']: isInsideChat,
                    ['size-8 sm:size-12']: !isInsideChat,
                    ['flex items-center justify-center bg-cyan-600']: isBot,
                    ['overflow-hidden']: !isBot,
                },
            )}
        >
            { isBot && (
                <RobotIconSolid
                    color="#FFFFFF"
                    className={clsx({
                        ['size-3']: isInsideChat,
                        ['size-4 sm:size-7']: !isInsideChat,
                    })}
                />
            )}

            { !isBot && (
                <Image
                    alt="User avatar"
                    src={avatar}
                    width={48}
                    height={48}
                    className="size-12 object-cover"
                />
            )}
        </div>
    )
}

export const ChatBubble = ({
    isBot = false,
    isInsideChat = false,
    content,
    avatar = human,
    shadowSize = 'lg',
    shadowColor = 'gray-900/40',
    contentClass,
    className,
}) => {
    return (
        <div
            className={clsx(
                'pointer-events-none flex text-sm/5 lg:text-md/6',
                {
                    ['relative']: isBot,
                    ['pr-8 sm:pr-[20%]']: isBot && !isInsideChat,
                    ['pr-8']: isBot && isInsideChat,
                    ['gap-2']: isInsideChat,
                    ['gap-2 sm:gap-4']: !isInsideChat,
                    ['flex-row-reverse']: !isBot,
                    ['pl-8 sm:pl-[20%]']: !isBot && !isInsideChat,
                    ['pl-8']: !isBot && isInsideChat,
                },
                className,
            )}
            aria-hidden={true}
        >
            <Avatar
                avatar={avatar}
                isBot={isBot}
                isInsideChat={isInsideChat}
                shadowSize={shadowSize}
                shadowColor={shadowColor}
            />

            <div
                className={clsx(
                    'rounded-lg',
                    `shadow-${shadowSize} shadow-${shadowColor}`,
                    {
                        ['p-4']: isInsideChat,
                        ['bg-gray-100 text-gray-900']: isInsideChat && isBot,
                        ['bg-cyan-600 text-white']: isInsideChat && !isBot,
                        ['lg:max-w-[272px] px-3 py-2 bg-white text-gray-900']: !isInsideChat,
                        ['rounded-tl-sm']: isBot,
                        ['rounded-tr-sm']: !isBot,
                    },
                    contentClass,
                )}
            >
                {content || 'Some content is required'}
            </div>
        </div>
    )
}
