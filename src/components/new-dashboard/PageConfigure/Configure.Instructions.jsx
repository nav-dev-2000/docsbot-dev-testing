import ModalPrompt from '@/components/ModalPrompt'

const PageConfigureInstructions = ({ bot, setBot, team, integrations }) => {
    return (
        <div className="h-full overflow-y-auto p-4">
            {/* <div className="py-8"> */}
                <ModalPrompt
                    bot={bot}
                    setBot={setBot}
                    team={team}
                    integrations={integrations}
                />
            {/* </div> */}
        </div>
    )
}

export default PageConfigureInstructions
