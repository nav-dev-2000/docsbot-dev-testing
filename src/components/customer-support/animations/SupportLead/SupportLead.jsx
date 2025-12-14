import { useState } from "react"
import { SceneOne } from "./SceneOne"
import { SceneTwo } from "./SceneTwo"

export const SupportLead = () => {
    const [scene, setScene] = useState(1)

    return (
        <div className="size-full py-6 lg:py-12">
            <div className="size-full flex flex-col items-center justify-center sm:px-6 lg:px-12">
                <div className="w-full max-w-[540px] h-[620px] overflow-hidden flex flex-col rounded-xl bg-white shadow-lg">
                    {scene === 1 && (
                        <SceneOne onComplete={() => setScene(2)} />
                    )}

                    {scene === 2 && (
                        <SceneTwo onComplete={() => setScene(1)} />
                    )}
                </div>
            </div>
        </div>
    )
}
