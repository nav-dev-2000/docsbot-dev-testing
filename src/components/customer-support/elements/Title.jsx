import clsx from "clsx";

export const Title = ({ content, theme = 'light', className }) => {
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
        <h2
            className={clsx(
                'text-5xl/[3.5rem] font-bold lg:text-center',
                {
                    ['text-gray-900']: !isThemeDark,
                    ['text-neutral-50']: isThemeDark,
                },
                className,
            )}
        >
            { content }
        </h2>
    );
}
