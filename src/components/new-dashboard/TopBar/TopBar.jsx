import Notifications from '../Notifications'
import Profile from '../Profile'
import TopBarBox from './TopBarBox'
import TopBarLeft from './TopBarLeft'
import TopBarRight from './TopBarRight'

import { Bars3Icon } from '@heroicons/react/24/outline'

const TopBarMobile = ({ team, bot, bots }) => {
    return (
        <div className="flex flex-1 items-center justify-between md:hidden">
            <TopBarLeft bot={bot} bots={bots} wizardId="bot-switcher" />

            <div className="flex flex-none items-center gap-4">
                <Notifications />
                <Profile />
            </div>
        </div>
    )
}

const TopBarDesktop = ({ team, bot, bots }) => {
    return (
        <div className="hidden w-full items-center justify-between gap-4 md:flex">
            <TopBarLeft bot={bot} bots={bots} wizardId="bot-switcher" />
            <TopBarRight team={team} />
        </div>
    )
}

const TopBar = ({ team, bot, bots, hasBorder = false, setSidebarOpen }) => {
    return (
        <TopBarBox hasBorder={hasBorder} data-component="top-bar">
            <button
                type="button"
                className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500 md:hidden"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="sr-only">Open sidebar</span>
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 justify-between px-4">
                <TopBarMobile team={team} bot={bot} bots={bots} />
                <TopBarDesktop team={team} bot={bot} bots={bots} />
            </div>
        </TopBarBox>
    )
}

export default TopBar
