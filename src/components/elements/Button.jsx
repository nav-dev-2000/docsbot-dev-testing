import Link from 'next/link'
import clsx from 'clsx'

export const Button = ({
    type = 'button',
    label,
    href,
    onClick,
    theme = 'light',
    variant = 'primary',
    className,
    ...props
}) => {
    let isBorder, isRounded
    let isLight, isDark, isOpalite

    switch (variant) {
        case 'primary':
            isRounded = true
            break

        case 'secondary':
            isBorder = true
            isRounded = true
            break

        default:
            isBorder = false
            isRounded = false
            break
    }

    const isSolid = isRounded && !isBorder
    const isOutlined = isRounded && isBorder
    const isGhost = !isRounded && !isBorder

    switch (theme) {
        case 'light':
            isLight = true
            break

        case 'dark':
            isDark = true
            break

        case 'opalite':
            isOpalite = true
            break

        default:
            isLight = false
            isDark = false
            isOpalite = false
            break
    }

    const Element = href ? Link : 'button'
    const propsElement = href
        ? { type, href, onClick, ...props }
        : { type, onClick, ...props }

    return (
        <Element
            type={type}
            href={ href }
            className={clsx(
                'cursor-pointer font-semibold text-center focus:outline-none',
                {
                    ['rounded-md']: isRounded,
                    ['px-0 py-0 text-sm/8 hover:shadow-[0_2px]']: isGhost,
                    ['px-6 py-4 text-base/6']: !isGhost,
                    // Solid
                    ['transition-transform hover:shadow-lg hover:scale-105']: isSolid,
                    ['bg-white text-gray-900']: isLight && isSolid,
                    ['bg-gray-900 text-white']: isDark && isSolid,
                    ['bg-animation hover:from-teal-600 hover:to-cyan-700 text-white']: isOpalite && isSolid,
                    // Outlined
                    ['transition-colors border bg-transparent']: isOutlined,
                    ['hover:bg-white border-white text-white hover:text-gray-900']: isLight && isOutlined,
                    ['hover:bg-gray-900 border-gray-900 text-gray-900 hover:text-white']: isDark && isOutlined,
                    ['hover:bg-teal-600 border-teal-600 text-teal-600 hover:text-white']: isOpalite && isOutlined,
                    // Ghost
                    ['text-white hover:shadow-white/80']: isLight && isGhost,
                    ['text-gray-900 hover:shadow-gray-900/80']: isDark && isGhost,
                    ['text-teal-600 hover:shadow-teal-600/80']: isOpalite && isGhost,
                },
                className,
            )}
            { ...propsElement }
        >
            { label }
        </Element>
    );
}
