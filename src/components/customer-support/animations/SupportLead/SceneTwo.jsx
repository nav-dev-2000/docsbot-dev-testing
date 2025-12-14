import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Typewriter } from '@/components/customer-support/animation-elements'
import { FaceSmileIcon } from "@heroicons/react/24/outline";
import { PhotoIcon } from "@heroicons/react/24/solid";
import clsx from 'clsx'

const FormHeader = () => {
    return (
        <div className="flex-none px-8 py-4 bg-cyan-600 text-white text-sm/6 text-center">
            <div className="mb-4">
                Send a message
            </div>

            <div className="mb-1 text-lg/6 font-bold">
                How can we help?
            </div>

            <div className="text-white/80">
                We usually respond in a few hours
            </div>
        </div>
    )
}

const FormField = ({ label, content, isTextarea = false }) => {
    return (
        <div className="flex flex-col gap-1">
            <div className="text-slate-500 text-sm/6 font-medium">
                {label}
            </div>

            <div
                className={clsx(
                    'overflow-hidden min-h-[38px] max-h-[125px] relative px-4 border border-slate-200 rounded-md bg-white text-slate-800',
                    {
                        ['py-4 text-sm/5']: isTextarea,
                        ['text-sm/9 whitespace-nowrap']: !isTextarea,
                    },
                )}
            >
                {content}
                <div className="w-4 h-full absolute top-0 right-0 bg-white" />

                {isTextarea && (
                    <div className="w-full absolute bottom-0 left-0 flex items-center justify-end gap-2 px-4 py-2 bg-white text-slate-500">
                        <PhotoIcon className="size-6" />
                        <FaceSmileIcon className="size-6" />
                    </div>
                )}
            </div>
        </div>
    )
}

const FormSubmit = ({ onMouseOver, onComplete }) => {
    return (
        <motion.div
            animate={{
                backgroundColor: onMouseOver ? '#155E75' : '#0891B2',
            }}
            transition={{
                duration: 0.1,
                ease: "easeInOut",
                delay: 5,
            }}
            onAnimationComplete={() => {
                setTimeout(() => onComplete?.(), 1200)
            }}
            className={clsx(
                'py-2 rounded-md text-white bg-cyan-600 text-sm/8 font-semibold text-center',
            )}
        >
            Send a message
        </motion.div>
    )
}

const FormBody = ({ onComplete }) => {
    const name = 'John Doe'
    const email = 'johndoe@email.com'

    const [isNameTyping, setIsNameTyping] = useState(false)
    const [isNameFilled, setIsNameFilled] = useState(false)
    const [isEmailTyping, setIsEmailTyping] = useState(false)
    const [isEmailFilled, setIsEmailFilled] = useState(false)

    useEffect(() => {
        if (!isNameFilled) {
            setIsNameTyping(true)
        }
    }, [isNameFilled])

    return (
        <div className="overflow-hidden flex flex-1 flex-col gap-2 sm:gap-4 p-3 sm:p-6 bg-slate-100">
            <FormField
                label="Name"
                content={
                    <>
                        {isNameTyping && (
                            <Typewriter
                                onComplete={() => {
                                    setTimeout(() => {
                                        setIsNameFilled(true)
                                        setIsNameTyping(false)
                                    }, 500)

                                    setTimeout(() => {
                                        setIsEmailTyping(true)
                                    }, 800)
                                }}
                            >
                                {name}
                            </Typewriter>
                        )}

                        {isNameFilled && name}
                    </>
                }
            />

            <FormField
                label="Subject"
                content="Product images failing to load on storefront due to possible CDN issue"
            />

            <FormField
                label="Email"
                content={
                    <>
                        {isEmailTyping && (
                            <Typewriter
                                onComplete={() => {
                                    setTimeout(() => {
                                        setIsEmailFilled(true)
                                        setIsEmailTyping(false)
                                        onComplete?.()
                                    }, 500)
                                }}
                            >
                                {email}
                            </Typewriter>
                        )}

                        {isEmailFilled && email}
                    </>
                }
            />

            <FormField
                label="How can we help?"
                content="I'm experiencing an issue where product images on my storefront are not loading. The bot detected that the CDN is returning a 403 - Access Denied error for multiple image URLs, even though my configuration appears correct."
                isTextarea
            />
        </div>
    )
}

export const SceneTwo = ({ onComplete }) => {
    const [isButtonHovered, setIsButtonHovered] = useState(false)

    return (
        <>
            <FormHeader />

            <FormBody
                onComplete={onComplete}
            />

            <div className="p-3 sm:p-6 bg-slate-100">
                <FormSubmit
                    onMouseOver={isButtonHovered}
                    onComplete={onComplete}
                />
            </div>
        </>
    )
}
