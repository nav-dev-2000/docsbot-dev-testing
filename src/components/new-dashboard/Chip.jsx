import clsx from "clsx"

const Chip = ({ content, className }) => {
    return (
        <span
            title={content}
            className={clsx(
                'inline-flex min-w-0 max-w-full items-center rounded-4xl border px-3 py-1',
                'text-xs/none font-medium',
                className,
            )}
        >
            <span className="truncate">{content}</span>
        </span>
    )
}

export default Chip
