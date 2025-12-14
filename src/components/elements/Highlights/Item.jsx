import clsx from "clsx"

export const Item = ({ title, content, icon: Icon, className }) => {
    return (
        <div
            className={clsx(
                'relative pl-9',
                className,
            )}
        >
            <dt className="inline font-semibold text-gray-900">
                {Icon && (
                    <Icon
                        aria-hidden="true"
                        className="absolute left-1 top-1 size-5 text-cyan-600"
                    />
                )}
                {title}
            </dt>
            {content && ' '}
            {content && (
                <dd className="inline">{content}</dd>
            )}
        </div>
    )
}
