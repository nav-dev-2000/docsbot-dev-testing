import { useState } from 'react'

import Alert from '@/components/Alert'
import BotSearch from '@/components/BotSearch'
import Workspace from '../Workspace'

const PageConfigureSearch = ({ team, bot }) => {
    const [errorText, setErrorText] = useState(null)

    return (
        <div id="page-configure-search" className="h-full overflow-y-auto px-8">
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header
                    title="Search"
                    description="Search your bot's training data. This is a great way to test what documentation source chunks are being used to answer specific questions."
                />

                <div className="space-y-4">
                    <Alert title={errorText} type="warning" className="!my-0" />

                    <BotSearch
                        team={team}
                        bot={bot}
                        fullWidth={true}
                        setErrorText={setErrorText}
                    />
                </div>
            </div>
        </div>
    )
}

export default PageConfigureSearch
