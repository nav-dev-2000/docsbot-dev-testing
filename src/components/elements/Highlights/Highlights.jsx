import { useId } from "react"
import clsx from "clsx"
import { Item } from "./Item"

export const Highlights = ({ data, className }) => {
    const uniqueId = useId()

    return (
        <dl
            className={clsx(
                'max-w-xl lg:max-w-none mt-10 space-y-8 text-gray-600 text-base/7',
                className,
            )}
        >
            {data.map((item, index) => {
                return (
                    <Item
                        key={`highlight-${uniqueId}-${index}`}
                        title={item.title}
                        content={item.content}
                        icon={item.icon}
                    />
                )
            })}
        </dl>
    )
}
