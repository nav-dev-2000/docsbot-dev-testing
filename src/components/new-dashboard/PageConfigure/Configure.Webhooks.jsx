import WebhooksContent from '@/components/WebhooksContent'

const PageConfigureWebhooks = ({ team, bot }) => {
    return (
        <div
            id="page-configure-webhooks"
            className="h-full overflow-y-auto px-8"
        >
            <div className="flex flex-col gap-8 py-8">
                <WebhooksContent team={team} bot={bot} />
            </div>
        </div>
    )
}

export default PageConfigureWebhooks
