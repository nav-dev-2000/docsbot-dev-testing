import { useState, useEffect } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { isSuperAdmin } from '@/utils/helpers'
import DashboardWizard from '@/components/DashboardWizard'
import {
    HomeIcon,
    UsersIcon,
    ServerStackIcon,
    CreditCardIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline'
import RobotIcon from '@/components/RobotIcon'

import MainArea from './MainArea'
import Sidebar from './Sidebar'
import clsx from 'clsx'

const navigation = [
    { name: 'Dashboard', href: '/app', icon: HomeIcon },
    { name: 'Bots', href: '/app/bots', icon: RobotIcon },
    { name: 'Team', href: '/app/team', icon: UsersIcon },
    { name: 'Account', href: '/app/account', icon: CreditCardIcon },
    { name: 'API/Integrations', href: '/app/api', icon: ServerStackIcon },
]

const AppShell = ({
    team,
    bot,
    bots,
    hasTopBarShadow,
    children,
    page,
    sidebarNavigation,
}) => {
    const [user] = useAuthState(auth)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dashboardNavigation, setDashboardNavigation] = useState(() =>
        Array.isArray(sidebarNavigation) ? sidebarNavigation : [],
    )

    useEffect(() => {
        const finalNavigation = isSuperAdmin(user?.uid)
            ? [
                  ...navigation,
                  {
                      name: 'Staff Tools',
                      href: '/app/staff',
                      icon: UserGroupIcon,
                  },
              ]
            : navigation
        const nextNavigation = Array.isArray(sidebarNavigation)
            ? sidebarNavigation
            : finalNavigation
        setDashboardNavigation(nextNavigation)
    }, [user, sidebarNavigation])

    const cssGlobal = 'bg-gray-50'
    const cssMobile = ''
    const cssDesktop = 'md:h-screen md:overflow-hidden md:flex md:flex-row'

    return (
        <div className={clsx(cssGlobal, cssMobile, cssDesktop)}>
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                dashboardNavigation={dashboardNavigation}
                page={page}
            />

            <MainArea
                team={team}
                bot={bot}
                bots={bots}
                hasTopBarShadow={hasTopBarShadow}
                setSidebarOpen={setSidebarOpen}
                className="md:flex-1"
            >
                {children}
            </MainArea>
            <DashboardWizard
                team={team}
                user={user}
                bot={bot}
                bots={bots}
            />
        </div>
    )
}

export default AppShell
