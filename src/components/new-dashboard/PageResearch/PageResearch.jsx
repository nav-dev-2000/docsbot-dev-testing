import { useState, useEffect } from 'react'
import { Research } from '@/components/Research/Research'
import { buildUsageSnapshot } from '@/components/Research'
import { useResearchJobs } from './PageResearch.hooks'
import Workspace from '@new-dashboard/Workspace'

const PageResearch = ({ team, bot }) => {
    const [selectedJob, setSelectedJob] = useState(null)
    const [researchUsage, setResearchUsage] = useState(() =>
        buildUsageSnapshot(team),
    )

    useEffect(() => {
        setResearchUsage(buildUsageSnapshot(team))
    }, [team])

    const { jobs, setJobs, hasLoaded } = useResearchJobs({
        teamId: team?.id,
        botId: bot?.id,
        enabled: true,
    })

    if (!hasLoaded) {
        return (
            <Workspace.Loader
                message="Loading research..."
                variant="research"
            />
        )
    }

    return (
        <Research
            team={team}
            bot={bot}
            newDashboard={true}
            selectedJob={selectedJob}
            setSelectedJob={setSelectedJob}
            researchJobs={jobs}
            setResearchJobs={setJobs}
            researchUsage={researchUsage}
            setResearchUsage={setResearchUsage}
        />
    )
}

export default PageResearch
