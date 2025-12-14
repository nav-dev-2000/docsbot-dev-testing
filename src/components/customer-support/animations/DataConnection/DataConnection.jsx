import clsx from "clsx"
import { motion } from "framer-motion"
import { SonarPulse } from "@/components/customer-support/animation-elements"
import { AcademicCapIcon } from "@heroicons/react/24/solid"
import {
    LinkIcon,
    GlobeAltIcon,
    MapIcon,
    RssIcon,
    DocumentIcon,
    QuestionMarkCircleIcon,
    CircleStackIcon,
    MicrophoneIcon,
    VideoCameraIcon,
} from "@heroicons/react/24/outline"
import ZendeskLogo from "@/components/ZendeskLogo"
import DriveLogo from "@/components/DriveLogo"
import SlackLogo from "@/components/SlackLogo"

const DataTitle = ({ content }) => {
    return (
        <div
            className={clsx(
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
                'flex flex-row flex-nowrap items-center gap-2 px-4 py-2 rounded-xl bg-gray-900',
                'text-sm/6 text-white font-semibold text-nowrap',
            )}
        >
            <AcademicCapIcon
                className="size-6"
            />
            {content}
        </div>
    )
}

const DataBlock = ({ className, children }) => {
    return (
        <div
            className={clsx(
                'flex flex-row flex-nowrap items-center gap-2 px-4 py-2 rounded-xl bg-white shadow-lg',
                'text-gray-900',
                className,
            )}
        >
            {children}
        </div>
    )
}

const SocialBlock = ({ className, children }) => {
    const isHexColor = ( str ) => {
        return /^#([0-9A-F]{3}){1,2}$/i.test( str );
    }

    return (
        <div
            className={clsx(
                'flex flex-row flex-nowrap items-center px-3 py-1 rounded-xl bg-white shadow-lg',
                'text-gray-900',
                className,
            )}
        >
            {children.map((child, index) => {
                const color = child.props.color;
                const background = child.props.background;

                return (
                    <div
                        key={index}
                        className={clsx(
                            'size-9 flex items-center justify-center border-2 border-white rounded-full',
                            {
                                ['-ml-2']: index > 0,
                                [`${background}`]: !isHexColor(background),
                                [`${color}`]: !isHexColor(color),
                            }
                        )}
                        style={{
                            color: isHexColor(color) ? color : undefined,
                            background: isHexColor(background) ? background : undefined,
                        }}
                    >
                        <div className="size-4">
                            {child}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

const ListFiles = () => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
            <motion.div
                className="absolute"
                style={{
                    top: -96,
                    left: -264,
                }}
                initial={{ rotate: 0 }}
                animate={{ rotate: -360 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
                <DataBlock>
                    <GlobeAltIcon className="size-6" />
                    <LinkIcon className="size-6" />
                    <MapIcon className="size-6" />
                    <RssIcon className="size-6" />
                </DataBlock>
            </motion.div>
        </motion.div>
    )
}

const ListDatabases = () => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{ rotate: 180 }}
            animate={{ rotate: 540 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
            <motion.div
                className="absolute"
                style={{
                    top: -96,
                    left: -264,
                }}
                initial={{ rotate: -180 }}
                animate={{ rotate: -540 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
                <DataBlock>
                    <DocumentIcon className="size-6" />
                    <QuestionMarkCircleIcon className="size-6" />
                    <CircleStackIcon className="size-6" />
                </DataBlock>
            </motion.div>
        </motion.div>
    )
}

const ListMedia = () => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{ rotate: 90 }}
            animate={{ rotate: 450 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
            <motion.div
                className="absolute"
                style={{
                    top: -96,
                    left: -264,
                }}
                initial={{ rotate: -90 }}
                animate={{ rotate: -450 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
                <SocialBlock>
                    <VideoCameraIcon background="#E40C10" color="#FFFFFF" />
                    <MicrophoneIcon background="#000000" color="#FFFFFF" />
                </SocialBlock>
            </motion.div>
        </motion.div>
    )
}

const ListIntegrations = () => {
    return (
        <motion.div
            className="absolute top-1/2 left-1/2"
            initial={{ rotate: 270 }}
            animate={{ rotate: 630 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        >
            <motion.div
                className="absolute"
                style={{
                    top: -96,
                    left: -264,
                }}
                initial={{ rotate: -270 }}
                animate={{ rotate: -630 }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
            >
                <SocialBlock>
                    <ZendeskLogo background="#D1F470" color="#11110D" />
                    <DriveLogo background="#FFB803" color="#FFFFFF" />
                    <SlackLogo background="#000000" color="#FFFFFF" />
                </SocialBlock>
            </motion.div>
        </motion.div>
    )
}

export const DataConnection = () => {
    return (
        <div className="size-full py-6 lg:py-12">
            <div className="size-full flex flex-col items-center justify-center px-6 lg:px-12">
                <div className="size-[480px] relative">
                    <SonarPulse
                        sizeClass="size-[480px]"
                        ringColor={[
                            'border-cyan-600/80',
                            'border-cyan-600/60',
                            'border-cyan-600/40',
                        ]}
                        ringShadow="bg-cyan-400/10"
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    />

                    <DataTitle content="AI Continuous Learning" />

                    <ListFiles />
                    <ListMedia />
                    <ListDatabases />
                    <ListIntegrations />
                </div>
            </div>
        </div>
    )
}
