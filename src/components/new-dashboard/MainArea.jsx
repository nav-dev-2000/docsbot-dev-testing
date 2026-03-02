import clsx from 'clsx'
import TopBar from './TopBar'

const MainArea = ({
    team,
    bot,
    bots,
    hasTopBarShadow,
    setSidebarOpen,
    className,
    children,
}) => {
    return (
        // <div className="flex flex-1 flex-col overflow-y-auto focus:outline-none md:pl-48">
        <div
            className={clsx(
                'relative flex min-h-0 min-w-0 flex-col',
                className,
            )}
        >
            <TopBar
                team={team}
                bot={bot}
                bots={bots}
                hasBorder={hasTopBarShadow}
                setSidebarOpen={setSidebarOpen}
            />

            <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </div>
    )
}

export default MainArea
