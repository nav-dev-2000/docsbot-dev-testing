import ModalPrompt from '@/components/ModalPrompt'

const PageConfigureInstructions = ({ bot, setBot, team, integrations }) => {
    return (
        <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8">
            <div className="py-8">
                <ModalPrompt
                    bot={bot}
                    setBot={setBot}
                    team={team}
                    integrations={integrations}
                />
            </div>
        </div>
    )
}

export default PageConfigureInstructions
