import ModalPrompt from '@/components/ModalPrompt'

const PageConfigureInstructions = ({ bot, team, integrations }) => {
    return (
        <div className="h-full overflow-y-auto px-8">
            <div className="py-8">
                <ModalPrompt
                    bot={bot}
                    team={team}
                    integrations={integrations}
                />
            </div>
        </div>
    )
}

export default PageConfigureInstructions
