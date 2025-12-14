import clsx from "clsx";

export const Section = ({ theme = 'light', className, children, ...props }) => {
    return (
        <section
            className={clsx(
                'flex flex-col gap-8 lg:gap-16 py-16 lg:py-32',
                {
                    ['bg-white']: theme === 'light',
                    ['bg-gray-100']: theme === 'medium',
                    ['bg-gray-900']: theme === 'dark',
                },
                className,
            )}
            {...props}
        >
            { children }
        </section>
    );
}
