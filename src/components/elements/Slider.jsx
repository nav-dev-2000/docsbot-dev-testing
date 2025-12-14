import clsx from "clsx"

export const Slider = ({
    id,
    defaultValue,
    className,
    onChange,
    ...props
}) => {
    const onChangeEvent = (e) => {
        onChange && onChange(e)
    }

    return (
        <input
            id={id}
            type="range"
            value={defaultValue || '0'}
            min={props.min || '0'}
            max={props.max || '100'}
            step={props.step || '1'}
            className={clsx(
                'cursor-pointer appearance-none w-full h-2 rounded-lg bg-gray-200 accent-cyan-600',
                className,
            )}
            onChange={onChangeEvent}
            { ...props }
        />
    )
}
