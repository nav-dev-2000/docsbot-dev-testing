import { motion } from "framer-motion"
import clsx from "clsx"
import { Title } from "./Title"
import { Subtitle } from "./Subtitle"
import { Content } from "./Content"

export const Container = ({
    tag = 'div',
    theme = 'light',
    title,
    titleClassName,
    subtitle,
    subtitleClassName,
    description,
    cover: Cover,
    coverBackground = 'bg-cyan-500',
    isReversed = false,
    children,
    className
}) => {
    const DynamicTag = motion(tag)

    return (
        <DynamicTag
            initial={{ opacity: 0, x: isReversed ? 50 : -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className={clsx(
                'w-full px-6 lg:px-8 py-16 lg:py-32',
                {
                    ['bg-white']: theme === 'light',
                    ['bg-gray-100']: theme === 'medium',
                    ['bg-gray-900']: theme === 'dark',
                },
                className,
            )}
        >
            <div className="w-full max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="lg:py-8">
                        <div
                            className={clsx(
                                'lg:max-w-lg',
                                {
                                    ['lg:ml-auto']: isReversed,
                                },
                            )}
                        >
                            {title && (
                                <Title className={clsx('mb-2', titleClassName)}>
                                    { title }
                                </Title>
                            )}
                            {subtitle && (
                                <Subtitle className={clsx('mb-6', subtitleClassName)}>
                                    { subtitle }
                                </Subtitle>
                            )}
                            {description && (
                                <Content className="mb-10">
                                    { description }
                                </Content>
                            )}
                            { children }
                        </div>
                    </div>

                    {Cover && (
                        <div
                            className={clsx(
                                'h-full relative isolate pointer-events-none',
                                {
                                    ['lg:order-first']: isReversed,
                                    ['lg:order-last']: !isReversed,
                                },
                            )}
                            aria-hidden="true"
                        >
                            {typeof Cover === 'function' ? (
                                <Cover />
                            ) : (
                                <img 
                                    src={typeof Cover === 'string' ? Cover : (Cover?.src || Cover)} 
                                    alt="" 
                                    className="h-full w-full object-contain"
                                />
                            )}

                            <div
                                className={clsx(
                                    'h-full lg:w-[80rem] md:rounded-2xl',
                                    'absolute -z-20 top-0',
                                    'md:shadow-xl md:shadow-cyan-900/20',
                                    {
                                        ['-left-6 md:left-0 lg:left-auto -right-6 md:right-0 lg:right-0']: isReversed,
                                        ['-left-6 md:left-0 lg:left-0 -right-6 md:right-0 lg:right-auto']: !isReversed,
                                    },
                                    coverBackground,
                                )}
                            />
                        </div>
                    )}
                </div>
            </div>
        </DynamicTag>
    )
}
