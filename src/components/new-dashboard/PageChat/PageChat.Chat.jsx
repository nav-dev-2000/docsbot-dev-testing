import React from 'react'
import clsx from 'clsx'

import Link from 'next/link'
import Alert from '@/components/Alert'
import ChatAgent from '@/components/ChatAgent'
import PageChatSources from './PageChat.Sources'
import PageChatOverview from './PageChat.Overview'
import PageChatHelper from './PageChat.Helper'

const PageChatChat = ({ team, bot }) => {
    const botId = bot?.id

    return (
        <div className={clsx('relative flex h-full min-h-0 flex-col')}>
            <div
                className={clsx(
                    'mb-4 flex shrink-0 items-center justify-between gap-4',
                    'md:absolute md:left-0 md:right-0 md:top-0 md:z-10 md:mb-0',
                )}
            >
                <div className="ml-auto flex items-end gap-2">
                    <PageChatSources teamId={team?.id} botId={botId} />

                    <PageChatOverview team={team} bot={bot} />

                    <PageChatHelper />
                </div>
            </div>

            {!bot?.isAgent && botId && (
                <div className="mb-4 flex w-full shrink-0 justify-center pt-2 md:pt-16">
                    <div className="w-full max-w-5xl md:w-[80%]">
                        <Alert title="Agent Mode is here!" type="info" className="mt-0 mb-0">
                            Please enable our new{' '}
                            <Link
                                href="https://docsbot.ai/article/docsbot-goes-agentic-ai-agents-for-your-team-customers"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline hover:text-blue-500"
                            >
                                Agentic mode
                            </Link>{' '}
                            for better results and to use all our new features.
                            It provides more intelligent and contextual
                            responses, tool calling to perform actions,
                            conversation view, and more. When enabling, set your
                            agent instructions and please test.
                            <span className="mt-2 block">
                                <Link
                                    href={`/app/bots/${botId}/widget/design`}
                                    className="inline-block rounded-lg border border-blue-600 px-4 py-2 font-medium transition hover:bg-blue-100"
                                >
                                    Enable Agent Mode
                                </Link>
                            </span>
                        </Alert>
                    </div>
                </div>
            )}

            <div
                className={clsx('min-h-0 w-full flex-1', {
                    ['pt-2 md:pt-16']: bot?.isAgent && botId,
                })}
            >
                <ChatAgent team={team} bot={bot} showResearchMode={true} />
            </div>
        </div>
    )
}

export default PageChatChat
