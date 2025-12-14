import clsx from "clsx";

export const Description = ({ content, theme = 'light', className }) => {
    let isThemeDark;

    switch (theme) {
        case 'dark':
            isThemeDark = true;
            break;

        default:
            isThemeDark = false;
            break;
    }
    
    return (
        <p
            className={clsx(
                'text-lg/8 lg:text-center text-pretty',
                {
                    ['text-gray-900/80']: !isThemeDark,
                    ['text-neutral-50/80']: isThemeDark,
                },
                className,
            )}
        >
            { content }
        </p>
    );
}
