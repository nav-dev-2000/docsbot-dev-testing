import clsx from 'clsx'

const CustomButton = ({ label, ...props }) => {
    const Element = props.href ? 'a' : 'button'

    return (
        <Element
            className={clsx(
                'p-2 border border-slate-300 rounded-md bg-white shadow-sm text-slate-700 text-sm/none transition',
                'hover:shadow-md hover:scale-105',
            )}
            {...props}
        >
            {label}
        </Element>
    )
}

const WidgetFeedback = ({
    labels,
    supportLink,
    botIcon = 'robot',
    isAgent = true,
    canEscalate = false,
    className,
}) => {
    const hasBotAvatar = botIcon && botIcon !== 'none' ? true : false
    const hasSupportLink = supportLink !== ''

    return (
        <div
            className={clsx(
                'flex items-center justify-start gap-2',
                {
                    ['pl-8']: hasBotAvatar,
                },
                className,
            )}
        >
            {(!isAgent && canEscalate)
                ? (
                    <CustomButton
                        label={labels.getSupport}
                        {...(hasSupportLink && {
                            href: supportLink,
                            target: '_blank',
                            rel: 'noopener noreferrer',
                        })}
                    />
                )
                : (
                    <>
                        <CustomButton
                            label={(canEscalate && isAgent) ? 'Yes, please' : labels.feedbackYes}
                            {...(!hasSupportLink && {title: labels.helpful})}
                            {...(hasSupportLink && {
                                href: supportLink,
                                target: '_blank',
                                rel: 'noopener noreferrer',
                            })}
                        />

                        <CustomButton
                            label={(canEscalate && isAgent) ? 'No, thanks' : labels.feedbackNo}
                            {...(!hasSupportLink && {title: labels.unhelpful})}
                        />
                    </>
                )
            }
        </div>
    )
}

export default WidgetFeedback
