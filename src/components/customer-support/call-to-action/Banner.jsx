import Image from "next/image"
import clsx from "clsx"
import { Button, Gradient } from "@/components/customer-support/elements"
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
                'overflow-hidden isolate relative flex flex-col gap-8 lg:gap-16 py-16 lg:py-12 rounded-2xl bg-gray-900 shadow-xl shadow-cyan-900/20',
                className,
            )}
            { ...props }
        >
            <div className="px-4 lg:px-16">
                <div className="grid grid-cols-2 gap-12 mx-auto">
                    <div
                        className={clsx(
                            'flex flex-col gap-8',
                            {
                                ['max-w-2xl col-span-2 justify-center mx-auto text-center']: !mascot,
                                ['order-2']: isReversed && mascot,
                            },
                        )}
                    >
                        {( title || content ) && (
                            <div className="flex flex-col gap-4">
                                { title && (
                                    <h3 className="text-white text-4xl/tight font-semibold text-balance tracking-tight">
                                        { title }
                                    </h3>
                                )}

                                { content && (
                                    <p className="text-white/60 text-lg/8 text-pretty">
                                        { content }
                                    </p>
                                )}
                            </div>
                        )}

                        {( primaryButton || secondaryButton ) && (
                            <div
                                className={clsx(
                                    'flex flex-none items-center gap-x-6',
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
                                'relative',
                                {
                                    ['order-1']: isReversed && mascot,
                                },
                            )}
                            aria-hidden={true}
                        >
                            <Image
                                src={mascot}
                                alt={`Docsbot ${variant} mascot`}
                                className="w-full max-w-96 absolute -top-4 left-1/2 -translate-x-1/2"
                            />
                        </div>
                    )}
                </div>
            </div>

            <Gradient />
        </aside>
    )
}
