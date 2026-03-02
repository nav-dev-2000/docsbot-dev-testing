import clsx from 'clsx'
import Tooltip from '@/components/Tooltip'

const TaskItem = ({ content, icon, tooltip, theme }) => {
    const TaskIcon = icon

    let color

    switch (theme) {
        case 'active':
            color = 'bg-cyan-100 text-cyan-800'
            break

        default:
            color = 'bg-gray-200 text-gray-600'
            break
    }

    const Element = (
        <li
            className={clsx(
                'relative truncate rounded-lg py-2 text-xs font-medium',
                color,
                {
                    ['pl-10 pr-4']: icon,
                    ['px-4']: !icon,
                },
            )}
        >
            {icon && (
                <TaskIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2" />
            )}
            {content}
        </li>
    )

    if (tooltip) {
        return <Tooltip content={tooltip}>{Element}</Tooltip>
    }

    return Element
}

export default TaskItem
