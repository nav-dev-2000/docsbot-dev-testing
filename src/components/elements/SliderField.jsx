import clsx from "clsx"
import { useId } from "react"
import { Slider } from "./index"

export const SliderField = ({ id, label, helper, defaultValue, className, onChange, ...props }) => {
    const generatedId = useId();
    const uniqueId = id || `slider-${generatedId}`

    return (
        <div
            className={clsx(
                'relative flex flex-col md:flex-row items-center -mx-2 pr-[124px] md:pr-0',
                className,
            )}
        >
            <div className="w-full md:w-auto md:basis-2/12 mb-4 md:mb-0 md:px-2">
                <label
                    id={`${uniqueId}-label`}
                    htmlFor={uniqueId}
                    className="text-gray-900 font-semibold"
                >
                    { label }
                </label>
            </div>
            
            <div className="w-full md:w-auto flex-1 md:px-2">
                <Slider
                    id={uniqueId}
                    defaultValue={defaultValue}
                    onChange={onChange}
                    { ...props }
                />
            </div>

            <span className="w-[100px] absolute md:relative top-0 right-0 block flex-0 px-4 md:px-2 py-2 md:py-0 border md:border-none rounded-xl text-gray-900 text-sm/6 md:text-base/6 break-words">
                {'object' === typeof helper && (
                    <>
                        <span className="block text-lg/tight md:text-2xl/tight font-semibold">
                            { helper.value }
                        </span>
                        { helper.label }
                    </>
                )}

                {'object' !== typeof helper && helper}
            </span>
        </div>
    )
}
