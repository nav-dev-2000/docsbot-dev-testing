import TeamsSelector from '../TeamsSelector'
import Notifications from '../Notifications'
import Profile from '../Profile'

const TopBarRight = ({ team }) => {
    return (
        <div className="flex flex-row items-center gap-6">
            <TeamsSelector team={team} />

            <div className="flex flex-row items-center gap-3">
                <Notifications />
                <Profile />
            </div>
        </div>
    )
}

export default TopBarRight
