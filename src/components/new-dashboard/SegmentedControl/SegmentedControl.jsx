import clsx from 'clsx'

import SegmentedButton from './SegmentedButton.jsx'
import SegmentedContainer from './SegmentedContainer.jsx'

const SegmentedControl = ({
    options = [],
    value,
    onChange,
    disabled = false,
    className,
    buttonClassName,
    children,
    ...props
}) => {
    const hasOptions = options.length > 0

    return (
        <SegmentedContainer className={className} {...props}>
            {hasOptions
                ? options.map((option) => (
                      <SegmentedButton
                          key={option.value}
                          isActive={option.value === value}
                          disabled={disabled || option.disabled}
                          onClick={() => onChange?.(option.value)}
                          className={clsx(buttonClassName, option.className)}
                      >
                          {option.label}
                      </SegmentedButton>
                  ))
                : children}
        </SegmentedContainer>
    )
}

export default SegmentedControl
