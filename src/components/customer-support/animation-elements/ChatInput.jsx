import { Typewriter } from "@/components/customer-support/animation-elements"
import { PaperAirplaneIcon } from "@heroicons/react/20/solid"

export const ChatInput = ({ placeholder, input }) => {
    return (
        <div
            className="pointer-events-none w-full max-w-[80%] flex items-center px-6 py-4 border border-gray-100 rounded-lg bg-white shadow-xl"
            aria-hidden={true}
        >
            <div className="flex-1">
                <Typewriter
                    placeholder={ placeholder }
                >
                    { input }
                </Typewriter>
            </div>

            <PaperAirplaneIcon className="w-6 text-gray-400" />
        </div>
    )
}
