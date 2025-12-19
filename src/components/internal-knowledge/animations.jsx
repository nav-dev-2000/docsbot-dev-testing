import { ChatBubble, ChatHeader, SonarPulse } from "@/components/customer-support/animation-elements";
import { DocumentTextIcon, UserGroupIcon, UserIcon, CheckCircleIcon, ExclamationCircleIcon, MagnifyingGlassIcon, AcademicCapIcon, CheckBadgeIcon, FolderIcon, BoltIcon, ChartBarIcon, ClockIcon } from "@heroicons/react/24/solid";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import avatar from "@/images/app-demo/internal-knowledge-avatar.png";

// -----------------------------------------------------------------------------
// Animation 1: Consistent Info
// Visual: Central Hub (Doc) updating and syncing to multiple Users
// -----------------------------------------------------------------------------

const ConnectionLine = ({ angle, delay }) => {
    return (
        <motion.div
            style={{ 
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100px',
                height: '2px',
                originX: 0,
                rotate: angle,
                zIndex: 0,
            }}
        >
            <motion.div 
                className="w-full h-full bg-cyan-400"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                    scaleX: [0, 1, 0],
                    opacity: [0, 1, 0],
                    x: [0, 50, 100] // Move the line outward effectively
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut",
                    repeatDelay: 2
                }}
            />
        </motion.div>
    );
};

const UserNode = ({ angle, delay }) => {
    const radius = 100; // Distance from center
    const x = Math.cos(angle * (Math.PI / 180)) * radius;
    const y = Math.sin(angle * (Math.PI / 180)) * radius;

    return (
        <motion.div
            className="absolute flex items-center justify-center size-12 bg-white rounded-full shadow-lg z-10"
            style={{ x, y }}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ 
                scale: [0.8, 1.1, 0.8],
                opacity: [0.5, 1, 0.5],
                backgroundColor: ["#ffffff", "#d1fae5", "#ffffff"] // flash green
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: delay + 0.5, // Sync with line arrival
                ease: "easeInOut",
                repeatDelay: 2
            }}
        >
            <UserIcon className="size-6 text-slate-600" />
            <motion.div
                className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0] }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: delay + 0.6,
                    repeatDelay: 2
                }}
            >
                <CheckCircleIcon className="size-3 text-white" />
            </motion.div>
        </motion.div>
    );
};

export const ConsistentInfo = () => {
    return (
        <div className="relative w-full h-[28rem] flex items-center justify-center overflow-hidden">
            {/* Central Node */}
            <div className="relative z-20">
                <SonarPulse sizeClass="size-48">
                    <div className="flex items-center justify-center size-20 bg-white rounded-2xl shadow-xl">
                        <DocumentTextIcon className="size-10 text-cyan-600" />
                        <motion.div 
                            className="absolute inset-0 border-4 border-cyan-300 rounded-2xl"
                            animate={{ opacity: [0, 1, 0], scale: [1, 1.2, 1.5] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "easeOut" }}
                        />
                    </div>
                </SonarPulse>
            </div>

            {/* Connections */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[0, 90, 180, 270].map((angle, i) => (
                    <ConnectionLine key={i} angle={angle} delay={0.2 * i} />
                ))}
            </div>

            {/* Satellite Nodes */}
            <div className="absolute inset-0 flex items-center justify-center">
                {[0, 90, 180, 270].map((angle, i) => (
                    <UserNode key={i} angle={angle} delay={0.2 * i} />
                ))}
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Animation 2: Fast Responses
// Visual: Chat UI with instant replies
// -----------------------------------------------------------------------------

const FastChatSequence = () => {
    const bubbleBot = { isBot: true, isInsideChat: true, shadowSize: 'none' };
    const bubbleUser = { isBot: false, isInsideChat: true, shadowSize: 'none' };

    const sequence = [
        { text: "How do I request PTO?", type: 'user', delay: 0.5 },
        { text: "Log into Workday, go to 'Time Off', and select 'Request Absence'.", type: 'bot', delay: 1.0 }, // Very fast response
        { text: "What's the wifi password?", type: 'user', delay: 3.5 },
        { text: "It's 'OfficeSecure2024!'", type: 'bot', delay: 4.0 }, // Very fast response
    ];

    const [visibleCount, setVisibleCount] = useState(0);

    useEffect(() => {
        let timeouts = [];
        let accumulatedDelay = 0;

        // Reset loop
        const loopDuration = 7000; // Total loop time
        
        const runSequence = () => {
            setVisibleCount(0);
            
            sequence.forEach((item, index) => {
                const t = setTimeout(() => {
                    setVisibleCount(index + 1);
                }, item.delay * 1000);
                timeouts.push(t);
            });
        };

        runSequence();
        const interval = setInterval(runSequence, loopDuration);

        return () => {
            clearInterval(interval);
            timeouts.forEach(clearTimeout);
        };
    }, []);

    return (
        <div className="flex flex-1 flex-col gap-4 p-6">
            {sequence.map((msg, idx) => (
                <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10, display: 'none' }}
                    animate={idx < visibleCount ? { opacity: 1, y: 0, display: 'block' } : { opacity: 0, y: 10, display: 'none' }}
                    transition={{ duration: 0.3 }}
                >
                    <ChatBubble content={msg.text} {...(msg.type === 'bot' ? bubbleBot : bubbleUser)} />
                </motion.div>
            ))}
        </div>
    );
};

export const FastResponses = () => {
    return (
        <div className="relative w-full h-[28rem]">
             <div className="overflow-hidden size-full max-w-[90%] sm:max-w-[80%] lg:max-w-[50%] max-h-[100%] relative mx-auto pt-10">
                <div className="overflow-hidden flex flex-col rounded-t-lg bg-white shadow-lg h-full">
                    <ChatHeader className="flex-none" isActive={true} />
                    <FastChatSequence />
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Animation 3: Multilingual Internal
// Visual: Chat UI with internal queries in different languages
// -----------------------------------------------------------------------------

const MultiLangInternalSequence = () => {
    const bubbleBot = { isBot: true, isInsideChat: true, shadowSize: 'none' };
    const bubbleUser = { isBot: false, isInsideChat: true, shadowSize: 'none', avatar };

    const bubbles = [
        "Where can I find the brand assets?",
        "Check the Marketing folder in Google Drive.",
        "¿Dónde puedo encontrar los recursos de marca?",
        "Revisa la carpeta de Marketing en Google Drive.",
        "Où puis-je trouver les ressources de marque?",
        "Consultez le dossier Marketing sur Google Drive."
    ];

    // Reuse a similar logic to MultilingualChat but customized
    // We want a continuous scroll effect or fading stack
    
    // Simple stacking fading approach
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % (bubbles.length / 2));
        }, 3000); // Switch language pair every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const currentPairBase = index * 2;

    return (
        <div className="flex flex-1 flex-col gap-4 p-6 justify-center h-full">
            <motion.div
                key={index} // Re-render on index change
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col gap-4"
            >
                <ChatBubble content={bubbles[currentPairBase]} {...bubbleUser} />
                
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <ChatBubble content={bubbles[currentPairBase + 1]} {...bubbleBot} />
                </motion.div>
            </motion.div>
        </div>
    );
};

export const MultilingualInternal = () => {
    return (
        <div className="relative w-full h-[28rem]">
             <div className="overflow-hidden size-full max-w-[90%] sm:max-w-[80%] lg:max-w-[50%] max-h-[100%] relative mx-auto pt-10">
                <div className="overflow-hidden flex flex-col rounded-t-lg bg-white shadow-lg h-full">
                    <ChatHeader className="flex-none" isActive={true} />
                    <MultiLangInternalSequence />
                </div>
            </div>
        </div>
    );
};

// -----------------------------------------------------------------------------
// Animation 4: Productivity
// Visual: Chaos (searching files) -> Clarity (Answer + Stats)
// -----------------------------------------------------------------------------

const ProductivitySequence = () => {
    // Phase state: 'chaos' | 'converge' | 'clarity'
    const [phase, setPhase] = useState('chaos');

    useEffect(() => {
        let mounted = true;
        const loop = async () => {
            while(mounted) {
                setPhase('chaos');
                await new Promise(r => setTimeout(r, 3000));
                if (!mounted) break;
                setPhase('converge');
                await new Promise(r => setTimeout(r, 1000));
                if (!mounted) break;
                setPhase('clarity');
                await new Promise(r => setTimeout(r, 3000));
            }
        };
        loop();
        return () => { mounted = false; };
    }, []);

    // Chaos items
    const chaosItems = Array.from({ length: 8 }).map((_, i) => ({
        id: i,
        // Distribute in a circle/cloud
        angle: (i / 8) * 360,
        radius: 100 + Math.random() * 40,
        Icon: i % 2 === 0 ? DocumentTextIcon : FolderIcon,
        color: i % 2 === 0 ? "text-slate-300" : "text-slate-400"
    }));

    return (
        <div className="relative size-full flex items-center justify-center overflow-hidden">
            {/* User Center */}
            <motion.div
                className={clsx(
                    "relative z-20 size-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 border-4",
                    phase === 'clarity' ? "bg-white border-emerald-400" : "bg-white border-slate-100"
                )}
                animate={{ scale: phase === 'converge' ? 1.1 : 1 }}
            >
                <UserIcon className={clsx("size-12 transition-colors duration-500", phase === 'clarity' ? "text-emerald-500" : "text-slate-400")} />
                
                {/* Status Indicator */}
                <motion.div
                    className={clsx(
                        "absolute -top-1 -right-1 rounded-full p-2 text-white shadow-md border-2 border-white",
                        phase === 'clarity' ? "bg-emerald-500" : "bg-amber-400"
                    )}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                >
                    {phase === 'clarity' ? <BoltIcon className="size-5" /> : <ClockIcon className="size-5" />} 
                </motion.div>
            </motion.div>

            {/* Chaos Floating Items */}
            <AnimatePresence>
                {phase !== 'clarity' && chaosItems.map((item, i) => {
                    const x = Math.cos(item.angle * Math.PI / 180) * item.radius;
                    const y = Math.sin(item.angle * Math.PI / 180) * item.radius;
                    
                    return (
                        <motion.div
                            key={item.id}
                            className={`absolute ${item.color}`}
                            initial={{ x, y, opacity: 0, scale: 0.5 }}
                            animate={phase === 'chaos' ? { 
                                x: [x, x + (Math.random() * 20 - 10)],
                                y: [y, y + (Math.random() * 20 - 10)],
                                opacity: 1,
                                scale: 1,
                                rotate: [0, 10, -10, 0]
                            } : {
                                x: 0,
                                y: 0,
                                opacity: 0,
                                scale: 0
                            }}
                            transition={phase === 'chaos' ? {
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            } : {
                                duration: 0.8,
                                ease: "backIn"
                            }}
                        >
                            <item.Icon className="size-10" />
                        </motion.div>
                    )
                })}
            </AnimatePresence>

            {/* Clarity Elements */}
            <AnimatePresence>
                {phase === 'clarity' && (
                    <>
                         {/* Radiating Rings */}
                        <motion.div
                            className="absolute z-10 size-full flex items-center justify-center pointer-events-none"
                        >
                             <motion.div 
                                className="absolute size-40 border-2 border-emerald-200 rounded-full"
                                initial={{ opacity: 1, scale: 0.8 }}
                                animate={{ opacity: 0, scale: 2.5 }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                             />
                        </motion.div>

                        {/* Stock Chart Graph */}
                        <motion.div
                            className="absolute inset-x-0 bottom-0 h-48 z-10"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                             <svg className="w-full h-full" viewBox="0 0 400 150" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="productivityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                {/* Fill area */}
                                <motion.path
                                    d="M0 150 L 40 130 L 80 135 L 120 100 L 160 110 L 200 70 L 240 80 L 280 40 L 320 50 L 360 15 L 400 25 V 150 H 0 Z"
                                    fill="url(#productivityGradient)"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2, duration: 1 }}
                                />
                                {/* Line */}
                                <motion.path
                                    d="M0 150 L 40 130 L 80 135 L 120 100 L 160 110 L 200 70 L 240 80 L 280 40 L 320 50 L 360 15 L 400 25"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                />
                             </svg>
                        </motion.div>

                        {/* Label */}
                        <motion.div
                            className="absolute bottom-6 bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm border border-emerald-200 z-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ delay: 1 }}
                        >
                            Increased productivity
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export const Productivity = () => {
    return (
        <div className="relative w-full h-[28rem] flex items-center justify-center">
             <ProductivitySequence />
        </div>
    );
};

// -----------------------------------------------------------------------------
// Animation 5: Reduce Frustration
// Visual: Comparison of "Search Error" vs "DocsBot Answer"
// -----------------------------------------------------------------------------

const FrustrationSequence = () => {
    const [step, setStep] = useState(0); // 0: start, 1: type-search, 2: show-no-results, 3: switch-bot, 4: type-bot, 5: show-answer
    const [searchText, setSearchText] = useState("");
    const [botUserText, setBotUserText] = useState("");
    
    const querySearch = "What is the remote work policy?";
    const queryBot = "What is the remote work policy?";

    useEffect(() => {
        let timer;
        let mounted = true;
        
        const typeSearch = async () => {
            for (let i = 1; i <= querySearch.length; i++) {
                if (!mounted) return;
                setSearchText(querySearch.slice(0, i));
                await new Promise(r => setTimeout(r, 40));
            }
            if (!mounted) return;
            timer = setTimeout(() => setStep(2), 500);
        };

        const typeBot = async () => {
            for (let i = 1; i <= queryBot.length; i++) {
                if (!mounted) return;
                setBotUserText(queryBot.slice(0, i));
                await new Promise(r => setTimeout(r, 40));
            }
            if (!mounted) return;
            timer = setTimeout(() => setStep(5), 500);
        };

        if (step === 0) {
            setSearchText("");
            setBotUserText("");
            timer = setTimeout(() => setStep(1), 1000);
        } else if (step === 1) {
            typeSearch();
        } else if (step === 2) {
            timer = setTimeout(() => setStep(3), 3500);
        } else if (step === 3) {
            timer = setTimeout(() => setStep(4), 500);
        } else if (step === 4) {
            typeBot();
        } else if (step === 5) {
            timer = setTimeout(() => setStep(0), 5000);
        }

        return () => {
            mounted = false;
            clearTimeout(timer);
        };
    }, [step]);

    return (
        <div className="relative w-full h-full p-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
                {step < 3 ? (
                    <motion.div 
                        key="search"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm bg-white rounded-lg border border-slate-200 p-4 shadow-sm h-[20rem] flex flex-col"
                    >
                        <div className="flex-none flex items-center gap-2 bg-white px-3 py-2 rounded-full border border-slate-200 mb-4 shadow-sm">
                            <MagnifyingGlassIcon className="size-5 text-slate-400" />
                            <span className={clsx("text-sm truncate", searchText ? "text-slate-700" : "text-slate-300")}>
                                {searchText || "Search..."}
                                {step === 1 && <span className="animate-pulse border-r-2 border-slate-400 ml-0.5 h-4 inline-block align-middle">&nbsp;</span>}
                            </span>
                        </div>
                        
                        <div className="flex-1 relative overflow-hidden">
                            {step >= 2 ? (
                                <motion.div 
                                    className="flex flex-col gap-4"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="text-xs text-slate-500 pb-2 border-b border-slate-100">
                                        About 15,300 results (0.42 seconds)
                                    </div>
                                    <div className="flex flex-col gap-5">
                                        {[
                                            { t: "Remote Work Policy Update 2023", u: "intranet.company.com/hr/policies/remote-2023", d: "...regarding the new remote work guidelines that were established in early 2023 for all employees..." },
                                            { t: "Manager Approval Guidelines", u: "intranet.company.com/managers/approval-process", d: "...how to approve remote work requests for your direct reports..." },
                                            { t: "IT Equipment for Remote Work", u: "intranet.company.com/it/equipment", d: "...requesting laptops and monitors for home offices..." },
                                            { t: "WFH Best Practices", u: "intranet.company.com/culture/wfh", d: "...tips for staying productive while working from home..." }
                                        ].map((item, i) => (
                                             <div key={i} className="flex flex-col gap-0.5 opacity-60 hover:opacity-100 transition-opacity">
                                                <div className="text-[#1a0dab] text-sm font-medium hover:underline cursor-pointer truncate">{item.t}</div>
                                                <div className="text-[#006621] text-xs truncate">{item.u}</div>
                                                <div className="text-slate-600 text-xs leading-tight line-clamp-2">{item.d}</div>
                                             </div>
                                        ))}
                                    </div>
                                    {/* Fade at bottom */}
                                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none" />
                                </motion.div>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 text-sm">
                                    <div className="flex flex-col items-center gap-2">
                                        <MagnifyingGlassIcon className="size-8 text-slate-200" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="bot"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.5 }}
                        className="w-full max-w-sm relative"
                    >
                         <div className="bg-white rounded-lg shadow-md border border-slate-100 overflow-hidden">
                            <ChatHeader isActive={true} />
                            <div className="p-4 flex flex-col gap-3 min-h-[16rem]">
                                <div className="flex justify-end w-full">
                                    <div className="bg-cyan-600 text-white px-4 py-2 rounded-2xl rounded-tr-none max-w-[85%] shadow-sm relative text-sm">
                                        {botUserText}
                                        {step === 4 && <span className="animate-pulse border-r-2 border-white ml-0.5 h-4 inline-block align-middle">&nbsp;</span>}
                                        {!botUserText && step === 4 && <span className="opacity-0">.</span>} 
                                    </div>
                                </div>

                                {step === 5 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <ChatBubble 
                                            content="Employees can work remotely up to 3 days a week with manager approval." 
                                            isBot={true} 
                                            isInsideChat={true} 
                                            shadowSize="none" 
                                        />
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* Flash Message */}
                        <AnimatePresence>
                            {step === 5 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ delay: 1.5, duration: 0.5 }}
                                    className="absolute -bottom-12 left-0 right-0 mx-auto w-max bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold shadow-sm border border-emerald-200 flex items-center gap-2"
                                >
                                    <CheckBadgeIcon className="size-5" />
                                    Answers, not searches
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ReduceFrustration = () => {
    return (
        <div className="relative w-full h-[28rem] flex items-center justify-center">
            <FrustrationSequence />
        </div>
    );
};

// -----------------------------------------------------------------------------
// Animation 6: Onboarding
// Visual: User filling up with knowledge particles
// -----------------------------------------------------------------------------

const OnboardingSequence = () => {
    // Icons flying in
    return (
        <div className="relative size-full flex flex-col items-center justify-center">
            <div className="relative">
                <motion.div
                    className="size-24 bg-white rounded-full shadow-xl flex items-center justify-center z-10 relative overflow-hidden"
                    animate={{ 
                        boxShadow: ["0 0 0 0px rgba(20, 184, 166, 0)", "0 0 0 20px rgba(20, 184, 166, 0.1)", "0 0 0 40px rgba(20, 184, 166, 0)"]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    {/* Empty State */}
                    <UserIcon className="size-12 text-slate-200 absolute" />
                    
                    {/* Filled State (Clipped) */}
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center text-teal-500"
                        initial={{ clipPath: "inset(100% 0 0 0)" }}
                        animate={{ clipPath: "inset(0% 0 0 0)" }}
                        transition={{ duration: 4, ease: "linear", repeat: Infinity, repeatDelay: 1 }}
                    >
                        <UserIcon className="size-12" />
                    </motion.div>
                </motion.div>
                
                {/* Orbiting Knowledge */}
                {[0, 72, 144, 216, 288].map((angle, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-1/2 left-1/2 size-8 bg-white rounded-full shadow-md flex items-center justify-center text-teal-600"
                        initial={{ x: 0, y: 0, opacity: 0 }}
                        animate={{ 
                            x: [Math.cos(angle * Math.PI/180) * 80, 0],
                            y: [Math.sin(angle * Math.PI/180) * 80, 0],
                            opacity: [1, 0],
                            scale: [1, 0.5]
                        }}
                        transition={{ 
                            duration: 1, 
                            delay: i * 0.8,
                            repeat: Infinity,
                            repeatDelay: 3.2 // 5 items * 0.8 = 4s total cycle
                        }}
                        style={{ marginLeft: -16, marginTop: -16 }} // Center offset
                    >
                        <DocumentTextIcon className="size-5" />
                    </motion.div>
                ))}

                {/* Badge */}
                 <motion.div
                    className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full p-1.5 shadow-lg z-20"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 3.8, duration: 0.5, repeat: Infinity, repeatDelay: 4.5 }}
                >
                    <AcademicCapIcon className="size-6" />
                </motion.div>
            </div>
            
            <div className="mt-12 w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                <motion.div 
                    className="h-full bg-teal-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 4, ease: "linear", repeat: Infinity, repeatDelay: 1 }}
                />
            </div>
            <motion.div 
                className="mt-2 text-sm font-semibold text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity, repeatDelay: 1 }}
            >
                Onboarding...
            </motion.div>
        </div>
    );
};

export const Onboarding = () => {
    return (
        <div className="relative w-full h-[28rem] flex items-center justify-center">
            <OnboardingSequence />
        </div>
    );
};
