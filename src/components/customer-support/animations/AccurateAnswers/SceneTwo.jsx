import { useEffect } from "react"
import clsx from "clsx"

import { DocumentIcon } from "@heroicons/react/24/outline"
import { SonarPulse } from "@/components/customer-support/animation-elements"

export const SceneTwo = ({ onComplete, timeout = 6500 }) => {
    const boxCss = 'flex items-center justify-center rounded-lg shadow-md'
    const boxSize = 16
    const iconSize = boxSize / 2

    const BoxIcon = ({ icon, iconClass, className, ...props }) => {
        const Icon = icon;

        return (
            <div
                className={clsx(boxCss, 'p-4 bg-white', className)}
                {...props}
            >
                <Icon
                    className={clsx(
                        'text-cyan-600',
                        `size-${iconSize}`,
                        iconClass,
                    )}
                />
            </div>
        )
    }

    useEffect(() => {
        if (!onComplete) return

        const timer = setTimeout(() => onComplete(), timeout)

        return () => clearTimeout(timer)
    }, [onComplete, timeout])

    return (
        <div className="size-full relative bg-cyan-600">
            <div className="overflow-hidden size-full max-w-[80%] lg:max-w-[60%] max-h-[100%] flex flex-col items-center justify-center gap-8 mx-auto">
                <div className="flex items-center gap-8">
                    <SonarPulse sizeClass="size-96">
                        <BoxIcon icon={DocumentIcon} />
                    </SonarPulse>
                </div>
            </div>
        </div>
    )
}
