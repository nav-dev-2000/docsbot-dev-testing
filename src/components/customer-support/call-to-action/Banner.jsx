import Image from "next/image"
import clsx from "clsx"
import { Button, Gradient } from "@/components/elements"
import botJuggling from "@/images/app-demo/docsbot-mascot-juggling.svg"
import botConfetti from "@/images/app-demo/docsbot-mascot-confetti.svg"
import botWaving from "@/images/app-demo/docsbot-mascot-waving.svg"

export const Banner = ({
    variant,
    title,
    content,
    primaryButton,
    secondaryButton,
    isReversed = false,
    className,
    ...props
}) => {
    let mascot

    switch (variant) {
        case 'juggling':
            mascot = botJuggling
            break

        case 'confetti':
            mascot = botConfetti
            break

        case 'wave':
        case 'waving':
            mascot = botWaving
            break

        default:
            mascot = null
            break
    }

    return (
        <aside
            className={clsx(
                'overflow-hidden isolate relative',
                'py-6 md:py-8 lg:py-12',
                'rounded-2xl bg-gray-900 shadow-xl shadow-cyan-900/20',
                className,
            )}
            { ...props }
        >
            <div className="px-6 lg:px-16">
                <div
                    className={clsx(
                        'grid grid-cols-1',
                        {
                            ['md:grid-cols-3 md:items-center md:gap-8 lg:gap-12 gap:mx-auto']: mascot,
                        },
                    )}
                >
                    <div
                        className={clsx(
                            'flex flex-col md:col-span-2 gap-6 md:gap-8',
                            {
                                ['md:max-w-2xl md:justify-center md:mx-auto md:text-center']: !mascot,
                                ['order-2']: isReversed && mascot,
                            },
                        )}
                    >
                        {( title || content ) && (
                            <div className="flex flex-col gap-4">
                                { title && (
                                    <h3 className="text-white text-2xl/tight lg:text-4xl/tight font-semibold text-balance tracking-tight">
                                        { title }
                                    </h3>
                                )}

                                { content && (
                                    <p className="text-white/60 text-base/6 lg:text-lg/8 text-pretty tracking-tight">
                                        { content }
                                    </p>
                                )}
                            </div>
                        )}

                        {( primaryButton || secondaryButton ) && (
                            <div
                                className={clsx(
                                    'flex flex-col gap-4',
                                    'md:flex-none md:flex-row md:items-center md:gap-6',
                                    {
                                        ['justify-center']: !mascot
                                    },
                                )}
                            >
                                {primaryButton && (
                                    <Button
                                        theme="opalite"
                                        variant="primary"
                                        {...primaryButton}
                                    />
                                )}

                                {secondaryButton && (
                                    <Button
                                        theme="light"
                                        variant={mascot ? 'tertiary' : 'secondary'}
                                        {...secondaryButton}
                                    />
                                )}
                            </div>
                        )}
                    </div>

                    {mascot && (
                        <div
                            className={clsx(
                                'h-full relative hidden md:block',
                                {
                                    ['order-1']: isReversed && mascot,
                                },
                            )}
                            aria-hidden={true}
                        >
                            <Image
                                src={mascot}
                                alt={`Docsbot ${variant} mascot`}
                                className="w-auto lg:max-w-96 absolute -top-4 left-1/2 -translate-x-1/2"
                            />
                        </div>
                    )}
                </div>
            </div>

            <Gradient />
        </aside>
    )
}
