import clsx from "clsx"
import { Title, Description } from '@/components/customer-support/elements'

export const SectionContent = ({ theme = 'light', title, titleClass, description, descriptionClass, isBoxed = true, isBoxedHeader = true, className, children }) => {
    return (
        <div className={clsx(
            'flex flex-col gap-8 px-6 lg:px-8',
            {
                ['w-full max-w-7xl mx-auto']: isBoxed,
            },
            className,
        )}>
            {( title || description ) && (
                <div
                    className={clsx(
                        'flex flex-col gap-4',
                        {
                            ['lg:max-w-2xl mx-auto']: isBoxedHeader,
                        },
                    )}
                >
                    { title && (
                        <Title
                            theme={ theme }
                            content={ title }
                            className={ titleClass }
                        />
                    )}
                    { description && (
                        <Description
                            theme={ theme }
                            content={ description }
                            className={ descriptionClass }
                        />
                    )}
                </div>
            )}

            { children }
        </div>
    );
}
