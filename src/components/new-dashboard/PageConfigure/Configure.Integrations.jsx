import IntegrationsGrid from '@/components/IntegrationsGrid'
import Workspace from '@new-dashboard/Workspace'

const PageConfigureIntegrations = ({ team, bot, integrations }) => {
    return (
        <div id="page-deploy" className="h-full overflow-y-auto px-8">
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header title="Integrations & Sharing" />

                <IntegrationsGrid
                    team={team}
                    bot={bot}
                    integrations={integrations}
                    newDashboard={true}
                />
            </div>
        </div>
    )
}

export default PageConfigureIntegrations
