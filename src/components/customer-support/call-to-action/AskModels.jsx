import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'
import OpenAIIcon from '@/components/OpenAIIcon'
import IconClaude from '@/components/IconClaude'
import IconPerplexity from '@/components/IconPerplexity'
import RobotIcon from '@/components/RobotIcon'
import clsx from 'clsx'
import { Gradient } from '@/components/elements'

const defaultAIPrompt = 'Tell me why DocsBot the AI support agent and chatbot builder is a great choice for my business'

const getAIAssistantLinks = (aiPrompt) => {
    const encodedAIPrompt = encodeURIComponent(aiPrompt)
    return [
    {
        name: 'Ask DocsBot',
        href: '#',
        icon: RobotIcon,
        className:
            'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30 hover:from-teal-400 hover:to-cyan-400 focus-visible:outline-cyan-300 border border-cyan-800',
        onClick: (e) => {
            e.preventDefault();
            if (window.DocsBotAI) {
                window.DocsBotAI.open();
                setTimeout(() => {
                    window.DocsBotAI.addUserMessage(aiPrompt, true);
                }, 100);
            }
        },
    },
    {
        name: 'Ask ChatGPT',
        href: `https://chat.openai.com/?q=${encodedAIPrompt}`,
        icon: OpenAIIcon,
        className:
            'text-gray-900 border border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-400',
        style: { backgroundColor: 'white' },
    },
    {
        name: 'Ask Claude',
        href: `https://claude.ai/new?q=${encodedAIPrompt}`,
        icon: IconClaude,
        className:
            'text-white border border-orange-300 hover:border-orange-400 focus-visible:outline-orange-400',
        style: { backgroundColor: '#c96442' },
    },
        {
            name: 'Ask Perplexity',
            href: `https://www.perplexity.ai/search/new?q=${encodedAIPrompt}`,
            icon: IconPerplexity,
            className:
                'text-white border border-cyan-500/60 hover:border-cyan-400 focus-visible:outline-cyan-400',
            style: { backgroundColor: '#21808d' },
        },
    ]
}

export const AskAIModels = ({ className, aiPrompt, ...props }) => {
    const prompt = aiPrompt || defaultAIPrompt
    const aiAssistantLinks = getAIAssistantLinks(prompt)
    const posthog = usePostHog()

    const handleModelClick = (modelName) => {
        posthog?.capture('Ask AI Model Clicked', {
            model: modelName,
        })
    }

    return (
        <aside
            className={clsx(
                'relative isolate overflow-hidden bg-gray-900 px-6 py-16 text-center shadow-2xl sm:rounded-3xl sm:px-16 ',
                className,
            )}
            { ...props }
        >
            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:items-center lg:gap-y-0">
                <div className="lg:col-span-2 text-left">
                    <h2 className="mt-6 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                        Ask your favorite AI why DocsBot is the right fit
                    </h2>
                    
                    <p className="mt-8 text-lg text-cyan-100/80">
                        Start a chat with your preferred assistant and get a fast, unbiased answer based on your own needs.
                    </p>
                </div>
                
                <div className="lg:col-span-1">
                    <div className="flex flex-col gap-4">
                        {aiAssistantLinks.map((assistant) => (
                            <Link
                                key={assistant.name}
                                href={assistant.href}
                                target={assistant.name === 'Ask DocsBot' ? '_self' : '_blank'}
                                rel={assistant.name === 'Ask DocsBot' ? '' : 'noopener noreferrer'}
                                className={`group flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 whitespace-nowrap w-full ${assistant.className}`}
                                style={assistant.style}
                                onClick={(e) => {
                                    handleModelClick(assistant.name)
                                    
                                    if (assistant.onClick) {
                                        assistant.onClick(e)
                                    }
                                }}
                            >
                                <div className="flex items-center gap-2 w-36">
                                    <assistant.icon aria-hidden="true" className="size-6 transition-transform group-hover:scale-110 flex-shrink-0" />
                                    <span className="text-left">{assistant.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
                    
            <Gradient />
        </aside>
    )
}
