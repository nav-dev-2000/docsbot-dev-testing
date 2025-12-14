import { useState } from "react"
import { SceneOne } from "./SceneOne"
import { SceneTwo } from "./SceneTwo"
import { SceneThree } from "./SceneThree"

export const BotAutomation = () => {
    const [scene, setScene] = useState(1)

    return (
        <div className="size-full py-6 lg:py-12">
            <div className="size-full flex flex-col items-center justify-center sm:px-6 lg:px-12">
                <div className="w-full h-[620px] overflow-hidden flex flex-col">
                    {scene === 1 && (
                        <SceneOne onComplete={() => setScene(2)} />
                    )}

                    {scene === 2 && (
                        <SceneThree onComplete={() => setScene(1)} />
                    )}
                </div>
            </div>
        </div>
    )
}
