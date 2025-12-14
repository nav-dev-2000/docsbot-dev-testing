import { HandThumbUpIcon } from "@heroicons/react/24/solid"
import { Typewriter } from "../../animation-elements"

export const SceneThree = ({ onComplete }) => {
    return (
        <div className="size-full flex flex-row items-center justify-center gap-4">
            <div className="size-12 flex items-center justify-center rounded-full bg-white shadow-xl">
                <HandThumbUpIcon className="size-6 text-cyan-900" />
            </div>

            <Typewriter
                className="!text-cyan-100 text-xl md:text-2xl font-semibold"
                onComplete={() => setTimeout(() => onComplete?.(), 1200)}
            >
                97.5% CSAT
            </Typewriter>
        </div>
    )
}
