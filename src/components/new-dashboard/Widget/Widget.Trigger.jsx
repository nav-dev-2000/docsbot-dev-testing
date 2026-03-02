import clsx from 'clsx'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
    faComment,
    faRobot,
    faLifeRing,
    faBook,
    faPlus,
    faComments,
    faQuestion,
} from '@fortawesome/free-solid-svg-icons'

const WidgetTrigger = ({
    label,
    icon = 'robot',
    alignment = 'left',
    showLabel = true,
    ...props
}) => {
    const Wrapper = 'div'
    const Component = props.onClick ? 'button' : 'div'

    const iconMap = {
        comment: { icon: faComment, label: 'Comment' },
        comments: { icon: faComments, label: 'Comments' },
        robot: { icon: faRobot, label: 'Robot' },
        'life-ring': { icon: faLifeRing, label: 'Life Ring' },
        question: { icon: faQuestion, label: 'Info' },
        book: { icon: faBook, label: 'Book' },
        custom: { icon: faPlus, label: 'Custom Icon' },
    }

    return (
        <Wrapper
            className={clsx(
                'flex items-center mt-6',
                {
                    ['justify-end']: alignment === 'right',
                    ['justify-start']: alignment === 'left',
                },
            )}
        >
            <Component
                className={clsx(
                    'items-center',
                    'rounded-3xl',
                    'bg-[var(--mybot-color)] text-[var(--mybot-text)]',
                    {
                        ['inline-flex px-6 py-4']: showLabel,
                        ['flex size-14 justify-center']: !showLabel,
                    },
                )}
            >
                <div className="flex items-center justify-center size-6">
                    {icon?.includes('://') ? (
                        <img
                            src={icon}
                            alt="icon"
                            className="w-auto max-w-7 h-auto max-h-7 object-scale-down"
                        />
                    ) : (
                        <FontAwesomeIcon icon={iconMap[icon]?.icon} size="xl" />
                    )}
                </div>
                {showLabel && (
                    <span className="block ml-2 text-sm/none font-semibold">
                        {label}
                    </span>
                )}
            </Component>
        </Wrapper>
    )
}

export default WidgetTrigger
