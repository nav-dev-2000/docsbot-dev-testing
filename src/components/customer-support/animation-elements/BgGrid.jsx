import clsx from "clsx"

export const BgGrid = ({ color = 'gray-700', className }) => {
    return (
        <svg
            aria-hidden="true"
            className={clsx(
                'hidden lg:block absolute inset-0 -z-10 size-full [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]',
                `stroke-${color}`,
                className,
            )}
        >
            <defs>
            <pattern
                x="50%"
                y={-1}
                id="0787a7c5-978c-4f66-83c7-11c213f99cb7"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
            >
                <path d="M.5 200V.5H200" fill="none" />
            </pattern>
            </defs>
            <rect fill="url(#0787a7c5-978c-4f66-83c7-11c213f99cb7)" width="100%" height="100%" strokeWidth={0} />
        </svg>
    );
}
