import React from 'react'
import TipsButton from '@new-dashboard/TipsButton'

const PageChatHelper = () => {
    return (
        <TipsButton
            title="Improving Chatbot Responses"
            color="yellow"
            position="right"
            action={{
                label: 'Learn more',
                href: '/documentation/doc/improving-response-quality',
                target: '_blank',
            }}
            className="order-3"
        >
            <ol className="list-decimal space-y-2 pl-4">
                <li>
                    Check the matching training data sources in the sidebar,
                    your question logs, or via our search tool.
                </li>
                <li>
                    Revise answers that you don't like to teach the chatbot how
                    to respond to similar questions in the future in your
                    question logs.
                </li>
                <li>
                    Finetune your bot's behavior by adjusting your custom prompt
                    to be clear on it's role, objectives, and context it might
                    need for every interaction.
                </li>
                <li>
                    Enable GPT-4 for your bot which is better at following
                    instructions and understanding the context.
                </li>
            </ol>
        </TipsButton>
    )
}

export default PageChatHelper
