import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import {
    getBot,
    getBots,
    getTeamIntegrations,
    getConversations,
    getConversation,
    getQuestions,
    getQuestion,
} from '@/lib/dbQueries'

import AppShell from '@new-dashboard/AppShell'
import Workspace from '@new-dashboard/Workspace'
import PageChat from '@new-dashboard/PageChat'
import PageResearch from '@new-dashboard/PageResearch'
import Head from 'next/head'
import LoadingSpinner from '@/components/LoadingSpinner'
import { TopicTab, QUESTION_REPORT_TABS } from '@/components/BotReport'

import {
    ArrowLeftIcon,
    BeakerIcon,
    ChartBarSquareIcon,
    ChatBubbleBottomCenterTextIcon,
    Cog6ToothIcon,
    CreditCardIcon,
    HomeIcon,
    ServerStackIcon,
    ShareIcon,
    SwatchIcon,
    UsersIcon,
} from '@heroicons/react/24/outline'
import RobotIcon from '@/components/RobotIcon'
import { auth } from '@/config/firebase-ui.config'
import { canUserManageBotSettings, canUserManageIntegrations, canUserViewBot } from '@/utils/function.utils'

import { useRouter } from 'next/router'
import PageAppearance from '@new-dashboard/PageAppearance'
import PageAnalyticsReports from '@new-dashboard/PageAnalytics/Reports'
import PageAnalyticsQuestions from '@new-dashboard/PageAnalytics/Questions'
import PageAnalyticsConversations from '@new-dashboard/PageAnalytics/Conversations'
import PageConfigure from '@new-dashboard/PageConfigure'
import PageLeads from '@new-dashboard/PageLeads'
import {
    slugToTabControl,
    tabControlToPath,
    TOP_LEVEL_TABS,
} from '@/lib/botRoutes'

function formatMonthLabel(month) {
    if (!month) return null
    const [year, monthPart] = month.split('-')
    if (!year || !monthPart) return null
    const date = new Date(Number(year), Number(monthPart) - 1)
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
    }).format(date)
}

function PrintView({ team, bot, month }) {
    const [report, setReport] = useState(null)
    const [resolvedMonth, setResolvedMonth] = useState(month || null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchReport = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const response = await fetch(
                    `/api/teams/${team.id}/bots/${bot.id}/reports?month=${month || ''}`,
                )

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}))
                    throw new Error(data?.message || 'Unable to load report')
                }

                const data = await response.json()
                setReport(data.report)

                if (
                    Array.isArray(data.availableReports) &&
                    data.availableReports.length > 0
                ) {
                    if (month && data.availableReports.includes(month)) {
                        setResolvedMonth(month)
                    } else {
                        setResolvedMonth(data.availableReports[0])
                    }
                }
            } catch (err) {
                setError(err.message || 'Unable to load report')
            } finally {
                setIsLoading(false)
            }
        }

        fetchReport()
    }, [team.id, bot.id, month])

    useEffect(() => {
        if (!isLoading && report) {
            const timeout = setTimeout(() => {
                window.print()
            }, 600)

            return () => clearTimeout(timeout)
        }
    }, [isLoading, report])

    const monthLabel = formatMonthLabel(resolvedMonth)

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <Head>
                <title>{`${bot.name} Question Topic Report`}</title>
            </Head>

            <main className="mx-auto max-w-5xl p-6 print:p-4">
                <header
                    className="border-b border-gray-200 pb-6"
                    style={{
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                        breakBefore: 'avoid',
                        pageBreakBefore: 'avoid',
                        breakAfter: 'avoid',
                        pageBreakAfter: 'avoid',
                        WebkitColumnBreakInside: 'avoid',
                        WebkitRegionBreakInside: 'avoid',
                    }}
                >
                    <p className="text-sm uppercase tracking-wide text-gray-500">
                        Question Topic Report
                    </p>
                    <h1 className="mt-2 text-3xl font-bold leading-tight">
                        {bot.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        {team?.name && <span>Team: {team.name}</span>}
                        {monthLabel && <span>Period: {monthLabel}</span>}
                    </div>
                    <p className="mt-4 max-w-3xl text-base text-gray-600">
                        Identify problem areas in your products and gaps in your
                        documentation with automated NLP analysis of user
                        questions. This printable report includes
                        visualizations, topic summaries, and representative
                        example questions.
                    </p>
                </header>

                {isLoading && (
                    <div className="flex h-40 items-center justify-center">
                        <LoadingSpinner large={true} className="mr-4" />
                        Loading report...
                    </div>
                )}

                {!isLoading && error && (
                    <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
                        {error}
                    </div>
                )}

                {!isLoading && !error && !report && (
                    <div className="mt-6 rounded-md border border-gray-200 bg-gray-50 p-6 text-center text-gray-600">
                        Sorry, but there were not enough questions in the
                        selected month to generate this report.
                    </div>
                )}

                {!isLoading && !error && report && (
                    <div className="mt-8 space-y-16 print:space-y-12">
                        <section className="print:[page-break-inside:avoid]">
                            <TopicTab
                                tabReport={report.allQuestions}
                                tab={QUESTION_REPORT_TABS[0]}
                                forcePrintPageBreaks
                            />
                        </section>

                        <section className="print:[page-break-inside:avoid]">
                            <TopicTab
                                tabReport={report.poorQuestions}
                                tab={QUESTION_REPORT_TABS[1]}
                                forcePrintPageBreaks
                            />
                        </section>
                    </div>
                )}
            </main>
        </div>
    )
}

const BotInner = ({
    team,
    bot: initialBot,
    bots,
    integrations,
    preConversations,
    preQuestions,
    openQuestion,
}) => {
    const router = useRouter()
    const [user, authLoading] = useAuthState(auth)
    const { botId } = router.query
    const [bot, setBot] = useState(initialBot)

    useEffect(() => {
        setBot(initialBot)
    }, [initialBot])

    const [canManageSettings, setCanManageSettings] = useState(false)
    const [canManageIntegrations, setCanManageIntegrations] = useState(false)
    const [permissionsResolved, setPermissionsResolved] = useState(false)
    useEffect(() => {
        if (authLoading) return

        setCanManageSettings(canUserManageBotSettings(team, user?.uid, bot))
        setCanManageIntegrations(canUserManageIntegrations(team, user?.uid, bot))
        setPermissionsResolved(true)
    }, [authLoading, user?.uid, team, bot])

    const analyticsControls = useMemo(
        () => ['reports', 'questions', 'conversations'],
        [],
    )
    const configureControls = useMemo(
        () => ['system', 'instructions', 'sources', 'questions', 'glossary', 'webhooks', 'search'],
        [],
    )
    const widgetControls = useMemo(
        () => ['design', 'content', 'actions', 'deploy'],
        [],
    )
    const isConfigureControlRestricted = useCallback((control) => {
        if (['system', 'questions', 'glossary'].includes(control)) {
            return !canManageSettings
        }

        if (control === 'webhooks') {
            return !canManageIntegrations
        }

        return false
    }, [canManageIntegrations, canManageSettings])


    const { tab: derivedTab, control: derivedControl } = useMemo(
        () => slugToTabControl(router.query.slug || []),
        [router.query.slug],
    )

    useEffect(() => {
        if (!router.isReady || authLoading) return

        let correctTab = derivedTab
        let correctControl = derivedControl

        // Widget and deploy are admin-only (canManageIntegrations)
        if (!canManageIntegrations && (correctTab === 'widget' || correctTab === 'deploy')) {
            router.replace(`/app/bots/${Array.isArray(botId) ? botId[0] : botId}`, undefined, { shallow: true })
            return
        }

        if (correctTab === 'configure') {
            if (!configureControls.includes(correctControl) || isConfigureControlRestricted(correctControl)) {
                correctControl = 'sources'
            }
        }

        const correctPath = tabControlToPath(
            Array.isArray(botId) ? botId[0] : botId,
            correctTab,
            correctControl,
        )

        const currentPath = router.asPath.split('?')[0]
        const correctPathClean = correctPath.split('?')[0]

        if (currentPath !== correctPathClean) {
            router.replace(correctPath, undefined, { shallow: true })
        }
    }, [router.isReady, authLoading, derivedTab, derivedControl, botId, configureControls, canManageIntegrations, canManageSettings, isConfigureControlRestricted, router])

    const isBotDisabled = bot?.privacy === 'private' || bot?.status !== 'ready'

    const activeId = derivedTab || 'chat'
    const analyticsControl = analyticsControls.includes(derivedControl)
        ? derivedControl
        : 'reports'
    const configureControl =
        configureControls.includes(derivedControl) &&
        !isConfigureControlRestricted(derivedControl)
            ? derivedControl
            : 'sources'
    const widgetControl = widgetControls.includes(derivedControl)
        ? derivedControl
        : 'design'

    const normalizedBotId = Array.isArray(botId) ? botId[0] : botId

    const analyticsHref = (nextControl) =>
        `/app/bots/${normalizedBotId}/analytics/${nextControl}`
    const analyticsContentMap = {
        reports: <PageAnalyticsReports key={bot.id} team={team} bot={bot} />,
        questions: (
            <PageAnalyticsQuestions
                key={bot.id}
                team={team}
                bot={bot}
                preQuestions={preQuestions || null}
                openQuestion={openQuestion || null}
            />
        ),
        conversations: (
            <PageAnalyticsConversations
                key={bot.id}
                team={team}
                bot={bot}
                preConversations={preConversations}
            />
        ),
    }
    const analyticsContent =
        analyticsContentMap[analyticsControl] || analyticsContentMap.reports

    const configureHref = (nextControl) =>
        `/app/bots/${normalizedBotId}/configure/${nextControl}`
    const widgetHref = (nextControl) =>
        `/app/bots/${normalizedBotId}/widget/${nextControl}`
    const configureContentMap = {
        system: (
            <PageConfigure.General
                key={bot.id}
                team={team}
                bot={bot}
                setBot={setBot}
            />
        ),
        instructions: (
            <PageConfigure.Instructions
                key={bot.id}
                team={team}
                bot={bot}
                integrations={integrations}
            />
        ),
        sources: (
            <PageConfigure.Sources
                key={bot.id}
                team={team}
                bot={bot}
                integrations={integrations}
            />
        ),
        search: <PageConfigure.Search key={bot.id} team={team} bot={bot} />,
        glossary: (
            <PageConfigure.Glossary
                key={bot.id}
                team={team}
                bot={bot}
                setBot={setBot}
            />
        ),
        questions: (
            <PageConfigure.Questions
                key={bot.id}
                team={team}
                bot={bot}
                setBot={setBot}
            />
        ),
        webhooks: <PageConfigure.Webhooks key={bot.id} team={team} bot={bot} />,
    }
    const configureContent =
        configureContentMap[configureControl] || configureContentMap.sources

    const configureMenuOptions = [
        {
            name: 'Sources',
            wizardId: 'configure-sources',
            href: configureHref('sources'),
            shallow: true,
            isActive:
                activeId === 'configure' && configureControl === 'sources',
        },
        {
            name: 'System',
            href: configureHref('system'),
            shallow: true,
            isActive: activeId === 'configure' && configureControl === 'system',
            requiresManageSettings: true,
        },
        {
            name: 'Instructions',
            href: configureHref('instructions'),
            shallow: true,
            isActive:
                activeId === 'configure' && configureControl === 'instructions',
        },
        {
            name: 'Starters',
            href: configureHref('questions'),
            shallow: true,
            isActive:
                activeId === 'configure' && configureControl === 'questions',
            requiresManageSettings: true,
        },
        {
            name: 'Glossary',
            href: configureHref('glossary'),
            shallow: true,
            isActive:
                activeId === 'configure' && configureControl === 'glossary',
            requiresManageSettings: true,
        },
        {
            name: 'Webhooks',
            href: configureHref('webhooks'),
            shallow: true,
            isActive: activeId === 'configure' && configureControl === 'webhooks',
            requiresManageSettings: true,
        },
        {
            name: 'Search',
            href: configureHref('search'),
            shallow: true,
            isActive: activeId === 'configure' && configureControl === 'search',
        },
    ]

    const setActiveId = (id, options = {}) => {
        let path

        if (id === 'analytics') {
            const requestedControl =
                options.control && analyticsControls.includes(options.control)
                    ? options.control
                    : null
            const currentQP = new URLSearchParams(window.location.search)
            const nextControl =
                requestedControl ||
                (analyticsControls.includes(derivedControl)
                    ? derivedControl
                    : 'conversations')
            path = `/app/bots/${normalizedBotId}/analytics/${nextControl}`

            if (
                nextControl === 'conversations' &&
                currentQP.get('conversationId')
            ) {
                path += `?conversationId=${currentQP.get('conversationId')}`
            }
        } else if (id === 'widget') {
            const requestedControl =
                options.control && widgetControls.includes(options.control)
                    ? options.control
                    : null
            const nextControl =
                requestedControl ||
                (widgetControls.includes(derivedControl)
                    ? derivedControl
                    : 'design')
            path = `/app/bots/${normalizedBotId}/widget/${nextControl}`
        } else if (id === 'configure') {
            const nextControl =
                options.control && configureControls.includes(options.control)
                    ? options.control
                    : 'sources'
            path = `/app/bots/${normalizedBotId}/configure/${nextControl}`
        } else if (id === 'research') {
            path = `/app/bots/${normalizedBotId}/research`
            const currentQP = new URLSearchParams(window.location.search)
            if (currentQP.get('jobId')) {
                path += `?jobId=${currentQP.get('jobId')}`
            }
        } else if (TOP_LEVEL_TABS.includes(id)) {
            path = `/app/bots/${normalizedBotId}/${id}`
        } else {
            path = `/app/bots/${normalizedBotId}`
        }

        router.push(path, undefined, { shallow: true })
    }

    const menu = [
        {
            id: 'chat',
            title: 'Chat',
            wizardId: 'chat',
            icon: ChatBubbleBottomCenterTextIcon,
            content: <PageChat key={bot.id} team={team} bot={bot} />,
        },
        {
            id: 'research',
            title: 'Research',
            wizardId: 'research',
            icon: BeakerIcon,
            content: (
                <div className="h-full flex-1">
                    <PageResearch key={bot.id} team={team} bot={bot} />
                </div>
            ),
        },
        {
            id: 'leads',
            title: 'Leads',
            wizardId: 'leads',
            icon: UsersIcon,
            content: <PageLeads key={bot.id} team={team} bot={bot} />,
        },
        {
            id: 'analytics',
            title: 'Analytics',
            wizardId: 'analytics',
            icon: ChartBarSquareIcon,
            content: analyticsContent,
            allowActiveClick: true,
            options: [
                {
                    name: 'Conversations',
                    wizardId: 'analytics-conversations',
                    href: analyticsHref('conversations'),
                    shallow: true,
                    isActive:
                        activeId === 'analytics' &&
                        analyticsControl === 'conversations',
                },
                {
                    name: 'Questions',
                    wizardId: 'analytics-questions',
                    href: analyticsHref('questions'),
                    shallow: true,
                    isActive:
                        activeId === 'analytics' &&
                        analyticsControl === 'questions',
                },
                {
                    name: 'Reports',
                    wizardId: 'analytics-reports',
                    href: analyticsHref('reports'),
                    shallow: true,
                    isActive:
                        activeId === 'analytics' &&
                        analyticsControl === 'reports',
                },
            ],
        },
        {
            id: 'configure',
            title: 'Configure',
            wizardId: 'configure',
            icon: Cog6ToothIcon,
            content: configureContent,
            allowActiveClick: true,
            options: configureMenuOptions.map((option) => ({
                ...option,
                disabled:
                    (option.requiresManageSettings && !canManageSettings) ||
                    (option.name === 'Webhooks' && !canManageIntegrations),
            })),
        },
        {
            id: 'widget',
            title: 'Widget',
            wizardId: 'widget',
            icon: SwatchIcon,
            href: widgetHref('design'),
            content: (
                <PageAppearance
                    key={bot.id}
                    team={team}
                    bot={bot}
                    setBot={setBot}
                    control={widgetControl}
                />
            ),
            allowActiveClick: true,
            options: [
                {
                    name: 'Design',
                    href: widgetHref('design'),
                    shallow: true,
                    isActive:
                        activeId === 'widget' && widgetControl === 'design',
                },
                {
                    name: 'Content',
                    href: widgetHref('content'),
                    shallow: true,
                    isActive:
                        activeId === 'widget' && widgetControl === 'content',
                },
                {
                    name: 'Actions',
                    href: widgetHref('actions'),
                    shallow: true,
                    isActive:
                        activeId === 'widget' && widgetControl === 'actions',
                },
                {
                    name: 'Deploy',
                    href: widgetHref('deploy'),
                    shallow: true,
                    isActive:
                        activeId === 'widget' && widgetControl === 'deploy',
                },
            ],
        },
        {
            id: 'deploy',
            title: 'Deploy',
            wizardId: 'deploy',
            icon: ShareIcon,
            href: `/app/bots/${normalizedBotId}/deploy`,
            content: (
                <PageConfigure.Integrations
                    team={team}
                    bot={bot}
                    integrations={integrations}
                />
            ),
        },
    ]

    const visibleMenu = menu.map((item) => ({
        ...item,
        disabled:
            (item.id === 'widget' || item.id === 'deploy') &&
            (!permissionsResolved || !canManageIntegrations),
    }))

    const botSidebarNavigation = visibleMenu.map((item) => {
        const baseHref = normalizedBotId ? `/app/bots/${normalizedBotId}` : '/app/bots'
        let href
        if (item.id === 'analytics') {
            href = analyticsHref('reports')
        } else if (item.id === 'configure') {
            href = configureHref('instructions')
        } else if (item.href) {
            href = item.href
        } else if (TOP_LEVEL_TABS.includes(item.id)) {
            href = `${baseHref}/${item.id}`
        } else {
            href = baseHref
        }

        return {
            name: item.title,
            href,
            icon: item.icon,
            wizardId: item.wizardId,
            shallow: true,
            disabled: item.disabled,
            tooltip: item.disabled ? `${item.title} (restricted)` : item.title,
            onClick: () => setActiveId(item.id),
        }
    })

    const appSidebarNavigation = [
        { name: 'Dashboard', href: '/app', icon: HomeIcon },
        { name: 'Bots', href: '/app/bots', icon: RobotIcon },
        { name: 'Team', href: '/app/team', icon: UsersIcon },
        { name: 'Account', href: '/app/account', icon: CreditCardIcon },
        { name: 'API/Integrations', href: '/app/api', icon: ServerStackIcon },
    ]

    const sidebarSections = [
        {
            id: 'back',
            variant: 'back',
            items: [
                {
                    name: 'Bots',
                    tooltip: 'Back to Bots',
                    href: '/app/bots',
                    icon: ArrowLeftIcon,
                },
            ],
        },
        {
            id: 'bot',
            items: botSidebarNavigation,
        },
        {
            id: 'app',
            title: 'Main Menu',
            items: appSidebarNavigation,
            collapsible: true,
            defaultCollapsed: true,
        },
    ]

    const activeSidebarPage = visibleMenu.find((item) => item.id === activeId)?.title

    return (
        <AppShell
            team={team}
            bot={bot}
            bots={bots}
            hasTopBarShadow={true}
            page={activeSidebarPage}
            sidebarNavigation={sidebarSections}
        >
            <Workspace
                data={visibleMenu}
                activeId={activeId}
                setActiveId={setActiveId}
            />
        </AppShell>
    )
}

const Bot = (props) => {
    if (props.isPrintView) {
        return (
            <PrintView
                team={props.team}
                bot={props.bot}
                month={props.printMonth}
            />
        )
    }

    return <BotInner {...props} />
}

export const getServerSideProps = async (context) => {
    const data = await getAuthorizedUserCurrentTeam(context)
    const { botId } = context.params
    const slug = context.params.slug || []

    if (data?.props?.team) {
        data.props.bot = await getBot(data.props.team.id, botId)

        if (!data.props.bot) {
            return {
                notFound: true,
            }
        }

        if (!canUserViewBot(data.props.team, data.props.bot, data.props.userId)) {
            return {
                notFound: true,
            }
        }

        data.props.integrations = await getTeamIntegrations(data.props.team.id)
        const allBots = await getBots(data.props.team)
        data.props.bots = allBots.filter((b) =>
            canUserViewBot(data.props.team, b, data.props.userId),
        )

        const {
            tab,
            control,
            questionId,
            print: isPrint,
        } = slugToTabControl(slug)

        // Redirect non-admins away from webhooks, widget, and deploy (admin-only via canManageIntegrations)
        const canManageIntegrations = canUserManageIntegrations(data.props.team, data.props.userId, data.props.bot)
        if (!canManageIntegrations) {
            const normalizedBotId = Array.isArray(botId) ? botId[0] : botId
            if (tab === 'widget' || tab === 'deploy') {
                return {
                    redirect: {
                        destination: `/app/bots/${normalizedBotId}`,
                        permanent: false,
                    },
                }
            }
            if (tab === 'configure' && control === 'webhooks') {
                return {
                    redirect: {
                        destination: `/app/bots/${normalizedBotId}/configure/sources`,
                        permanent: false,
                    },
                }
            }
        }

        if (isPrint) {
            data.props.isPrintView = true
            data.props.printMonth = context.query.month || null
            return data
        }

        if (tab === 'analytics' && control === 'conversations') {
            const { conversationId } = context.query
            data.props.preConversations = await getConversations(
                data.props.team,
                botId,
                25,
            )

            if (
                conversationId &&
                !data.props.preConversations.conversations.find(
                    (c) => c.id === conversationId,
                )
            ) {
                try {
                    const specificConversation = await getConversation(
                        data.props.team.id,
                        botId,
                        conversationId,
                    )
                    if (specificConversation) {
                        data.props.preConversations.conversations.unshift(
                            specificConversation,
                        )
                    }
                } catch (error) {
                    console.warn('Error fetching specific conversation:', error)
                }
            }
        }

        if (tab === 'analytics' && control === 'questions') {
            data.props.preQuestions = await getQuestions(data.props.team, botId)
            if (questionId) {
                data.props.openQuestion = await getQuestion(
                    data.props.team.id,
                    botId,
                    questionId,
                )
            }
        }
    }

    return data
}

export default Bot
