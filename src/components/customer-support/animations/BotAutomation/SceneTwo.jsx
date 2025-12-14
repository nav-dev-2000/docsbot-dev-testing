import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import clsx from 'clsx'

const itemVariants = {
    hidden: { opacity: 0, height: 0, marginBottom: 0 },
    show: { 
        opacity: 1, 
        height: 'auto',
        marginBottom: 16, // matching gap-4 (1rem = 16px)
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
            opacity: { duration: 0.2 }
        }
    }
}

const Avatar = ({ src, alt, className }) => {
    return (
        <div
            className={clsx(
                'w-[48px] h-[48px] overflow-hidden flex items-center justify-center rounded-xl border',
                className,
            )}
        >
            <Image
                src={src}
                alt={alt}
                width={24}
                height={24}
            />
        </div>
    )
}

const TextLine = ({ className }) => {
    return (
        <div
            className={clsx(
                'w-full h-[12px] rounded-xl bg-gray-200',
                className,
            )}
        />
    )
}

const TextBlock = ({ className }) => {
    return (
        <div className={clsx(
            'flex flex-col gap-1',
            className,
        )}>
            <TextLine />
            <TextLine className="max-w-[60%]" />
        </div>
    )
}

const Toggle = ({ isOn, onComplete }) => {
    return (
        <div
            className={clsx(
                'w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out',
                isOn ? 'bg-blue-600' : 'bg-gray-200'
            )}
        >
            <motion.div
                layout
                className="bg-white w-4 h-4 rounded-full shadow-sm"
                transition={{
                    type: "spring",
                    stiffness: 700,
                    damping: 30
                }}
                animate={{
                    x: isOn ? 20 : 0
                }}
                onAnimationComplete={() => {
                    if (isOn) {
                        onComplete?.()
                    }
                }}
            />
        </div>
    )
}

const Block = ({ label, src, alt, imgClassName, className, isOn, onComplete }) => {
    return (
        <motion.div
            variants={itemVariants}
            className={clsx(
                'p-6 border border-gray-200 rounded-xl overflow-hidden',
                className,
            )}
        >
            <div className="flex items-start justify-between mb-4">
                <Avatar
                    src={src}
                    alt={alt}
                    className={imgClassName}
                />

                <Toggle isOn={isOn} onComplete={onComplete} />
            </div>

            <div className="text-sm/6 font-semibold">{label}</div>

            <TextBlock className="mt-4" />
        </motion.div>
    )
}

export const SceneTwo = ({ onComplete }) => {
    const [isToggled, setIsToggled] = useState(false)

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.3
            }
        }
    }

    return (
        <div className="w-full max-w-[540px] h-full flex flex-col justify-center mx-auto">
            <div className="w-full flex flex-col mx-auto px-8 py-8 rounded-xl bg-white text-gray-900">
                <div className="mb-8 text-xl/6 font-semibold">Automations</div>

                <motion.div 
                    className="flex flex-col"
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    onAnimationComplete={() => {
                        setTimeout(() => setIsToggled(true), 1200)
                    }}
                >
                    <Block
                        label="Answer Questions via Email"
                        src="/images/logo-timeline/zapier.svg"
                        alt="Zapier"
                        imgClassName="border-[#fe4a01]"
                        isOn={isToggled}
                        onComplete={onComplete}
                    />

                    <Block
                        label="Reply to New Conversations"
                        src="/images/logo-timeline/make.svg"
                        alt="Make"
                        imgClassName="border-[#a62ce4]"
                        isOn={false}
                    />
                </motion.div>
            </div>
        </div>
    )
}
