import clsx from "clsx"

export const Gradient = ({ className }) => {
    return (
        <svg
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            className={clsx(
                'absolute left-1/2 top-1/2 -z-10 size-[64rem] -translate-y-1/2 [mask-image:radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0',
                className,
            )}
        >
            <circle r={512} cx={512} cy={512} fill="url(#759c1415-0410-454c-8f7c-9a820de03641)" fillOpacity="0.7" />

            <defs>
                <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
                    <stop stopColor="#06B6D4" />
                    <stop offset={1} stopColor="#0891B2" />
                </radialGradient>
            </defs>
        </svg>
    )
}
