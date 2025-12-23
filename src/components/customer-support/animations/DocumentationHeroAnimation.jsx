import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { DocumentTextIcon, ChatBubbleLeftRightIcon, MagnifyingGlassIcon, BoltIcon } from '@heroicons/react/24/outline'
import { Hero } from '@/components/customer-support/Hero'

const DocumentationHeroAnimation = () => {
    return (
        <div className="w-full h-[500px] md:h-[650px] flex items-center justify-center relative overflow-hidden">
            {/* Central Interaction Area */}
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                
                {/* Source Documents (Left Side) */}
                <div className="relative">
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="relative z-10 bg-white rounded-lg shadow-xl p-4 w-48 h-64 border border-gray-200 transform -rotate-6"
                    >
                        <div className="space-y-3">
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-5/6"></div>
                            <div className="mt-4 h-20 bg-gray-50 rounded border border-gray-100 flex items-center justify-center">
                                <DocumentTextIcon className="w-8 h-8 text-gray-300" />
                            </div>
                             <div className="h-2 bg-gray-100 rounded w-full"></div>
                             <div className="h-2 bg-gray-100 rounded w-4/5"></div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                        className="absolute top-4 left-4 -z-0 bg-gray-50 rounded-lg shadow-lg p-4 w-48 h-64 border border-gray-200 transform rotate-3"
                    >
                       <div className="space-y-3 opacity-50">
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                            <div className="h-2 bg-gray-200 rounded w-full"></div>
                        </div>
                    </motion.div>

                    {/* Processing Particles */}
                    <motion.div 
                        className="absolute top-1/2 right-6 transform -translate-y-1/2 md:right-12"
                    >
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ x: 0, opacity: 0, scale: 0 }}
                                animate={{ x: 100, opacity: [0, 1, 0], scale: 1 }}
                                transition={{ 
                                    duration: 2, 
                                    repeat: Infinity, 
                                    delay: i * 0.6,
                                    ease: "easeInOut"
                                }}
                                className="absolute top-0 left-0"
                            >
                                <BoltIcon className="w-6 h-6 text-cyan-400" />
                            </motion.div>
                        ))}
                    </motion.div>
                </div>

                {/* AI Chat Interface (Right Side) */}
                <motion.div 
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
                    className="bg-gray-900 rounded-xl shadow-2xl border border-gray-700 w-[320px] md:w-[380px] overflow-hidden"
                >
                    {/* Header */}
                    <div className="bg-gray-800 px-4 py-3 border-b border-gray-700 flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <div className="ml-auto text-xs text-gray-400 font-mono">DocsBot AI</div>
                    </div>

                    {/* Chat Area */}
                    <div className="p-4 space-y-4 min-h-[280px]">
                        {/* User Query */}
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1.2, duration: 0.5 }}
                            className="flex justify-end"
                        >
                            <div className="bg-cyan-600 text-white px-4 py-2 rounded-lg rounded-tr-none text-sm max-w-[85%]">
                                How do I authenticate with the API?
                            </div>
                        </motion.div>

                        {/* Bot Response */}
                        <motion.div 
                             initial={{ opacity: 0, y: 10 }}
                             animate={{ opacity: 1, y: 0 }}
                             transition={{ delay: 2.2, duration: 0.5 }}
                             className="flex justify-start"
                        >
                            <div className="bg-gray-800 text-gray-200 px-4 py-3 rounded-lg rounded-tl-none text-sm max-w-[90%] border border-gray-700 shadow-sm">
                                <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                                    <MagnifyingGlassIcon className="w-3 h-3" /> 
                                    Found in Authentication.md
                                </div>
                                <p className="mb-2">You can authenticate using a Bearer token in the header:</p>
                                <div className="bg-black/50 rounded p-2 font-mono text-xs text-green-400 overflow-x-auto">
                                    Authorization: Bearer YOUR_API_KEY
                                </div>
                            </div>
                        </motion.div>
                    </div>
                    
                     {/* Input Area Simulation */}
                     <div className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2 items-center">
                        <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
                            <ChatBubbleLeftRightIcon className="w-3 h-3 text-gray-300" />
                        </div>
                        <div className="h-2 bg-gray-600 rounded w-2/3 animate-pulse"></div>
                     </div>
                </motion.div>

            </div>
        </div>
    )
}

export { DocumentationHeroAnimation }

