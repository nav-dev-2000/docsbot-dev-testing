import clsx from 'clsx'
import Link from 'next/link'
import Chip from '@new-dashboard/Chip'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

const BoxHeader = ({
    icon,
    title,
    titleHref,
    tag,
    className,
    canToggle = false,
    isOpen = true,
    onToggle,
    buttonId,
    controlsId,
}) => {
    const WrapperComponent = canToggle ? 'h3' : 'div'
    const IconComponent = icon
    const TitleComponent = canToggle ? 'span' : 'h3'

    const titleElement = titleHref ? (
        <Link href={titleHref} className="text-inherit no-underline hover:no-underline">
            {title}
        </Link>
    ) : (
        title
    )

    const wrapperClass = clsx(
        'flex items-center gap-2 text-gray-800',
        {
            ['w-full flex flex-none pt-6 px-6 border border-gray-200 rounded-t-lg bg-white']: canToggle,
            ['mb-4']: !canToggle,
            ['border-b-0']: canToggle && isOpen,
            ['pb-6 rounded-b-lg']: canToggle && !isOpen,
        },
        className,
    )
    const titleClass = 'text-xl font-medium'

    const headerContent = (
        <>
            {icon && <IconComponent className="size-5" />}
            <TitleComponent className={titleClass}>{titleElement}</TitleComponent>
            {tag && (
                <Chip
                    content={tag}
                    className="border-cyan-800 bg-cyan-100 text-cyan-800"
                />
            )}
        </>
    )

    return (
        <>
            {canToggle ? (
                <WrapperComponent>
                    <button
                        type="button"
                        id={buttonId}
                        className={wrapperClass}
                        aria-expanded={isOpen}
                        aria-controls={controlsId}
                        onClick={onToggle}
                    >
                        {headerContent}
                        <ChevronDownIcon
                            className={clsx(
                                'ml-auto size-4 text-gray-500 transition-transform duration-150',
                                isOpen ? 'rotate-180' : 'rotate-0',
                            )}
                            aria-hidden="true"
                        />
                    </button>
                </WrapperComponent>
            ) : (
                <WrapperComponent className={wrapperClass}>
                    {headerContent}
                </WrapperComponent>
            )}
        </>
    )
}

export default BoxHeader
