import clsx from 'clsx'

const AccordionsBody = ({ id, children, isOpen = false, isLast = false }) => {
    return (
        <div
            id={`accordion-content-${id}`}
            role="region"
            aria-labelledby={`accordion-tab-${id}`}
            hidden={!isOpen}
            className={clsx('bg-gray-50 px-6 pb-4', {
                ['border-b border-gray-200']: !isLast,
            })}
        >
            {isOpen ? children : null}
        </div>
    )
}

export default AccordionsBody
