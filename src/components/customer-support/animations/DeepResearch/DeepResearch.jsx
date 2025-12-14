import { useState } from "react"
import { SceneOne } from "./SceneOne"
import { SceneTwo } from "./SceneTwo"

export const DeepResearch = () => {
    const [scene, setScene] = useState(1)

    const data = [
        {
            title: "Compare FAQ vs Documentation",
            isCompleted: false,
        },
        {
            title: "Content Gap Analysis",
            isCompleted: true,
        },
        {
            title: "Deep Market Positioning",
            isCompleted: true,
        },
        {
            title: "Competitive Analysis",
            isCompleted: true,
        },
        {
            title: "Features Recommendations",
            isCompleted: true,
        },
    ]

    return (
        <div className="size-full py-6 lg:py-12">
            <div className="size-full flex flex-col items-center justify-center">
                <div className="w-full h-[620px] justify-center overflow-hidden flex flex-col">
                    {scene === 1 && (
                        <SceneOne onComplete={() => setScene(2)} />
                    )}

                    {scene === 2 && (
                        <SceneTwo
                            data={data}
                            onComplete={() => setScene(1)}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}
