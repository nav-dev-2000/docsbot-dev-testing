import { useState } from 'react'
import Alert from '@/components/Alert'
import BotHistory from '@/components/BotHistory'
import BotReport from '@/components/BotReport'
import ModalTopicManagement from '@/components/ModalTopicManagement'
import { TagIcon } from '@heroicons/react/24/outline'

const PageAnalyticsReports = ({ team, bot }) => {
    const [errorText, setErrorText] = useState(null)
    const [infoText, setInfoText] = useState(null)
    const [showTopicModal, setShowTopicModal] = useState(false)

    if (!bot) return null

    return (
        <div className="h-full overflow-y-auto px-8">
            <div className="py-8">
                <Alert title={infoText} type="info" />
                <Alert title={errorText} type="warning" />

                <div className="mb-4 flex justify-end">
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowTopicModal(true)}
                            className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                        >
                            <TagIcon
                                className="mr-2 h-5 w-5 text-gray-400"
                                aria-hidden="true"
                            />
                            Manage Topics
                        </button>
                    </div>
                </div>

                <BotHistory team={team} bot={bot} />
                <BotReport team={team} bot={bot} />

                <ModalTopicManagement
                    team={team}
                    bot={bot}
                    open={showTopicModal}
                    setOpen={setShowTopicModal}
                />
            </div>
        </div>
    )
}

export default PageAnalyticsReports
