import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

import { checkPlanPermission } from '@/utils/helpers'
import dynamic from 'next/dynamic'

import Alert from '@/components/Alert'
import LocalStringNum from '@/components/LocalStringNum'
import SourceGrid from '@/components/SourceGrid'
import SourceFailed from '@/components/SourceFailed'
import ModalCheckout from '@/components/ModalCheckout'
import Workspace from '@new-dashboard/Workspace'

const SourceForm = dynamic(() => import('@/components/SourceForm'), {
    ssr: false,
    loading: () => null,
})

const sourcePerPage = 60

const PageConfigureSources = ({
    team,
    bot: initialBot,
    preBot,
    preSources,
    autoOpenSourceId,
    maintenanceActive,
}) => {
    const [sources, setSources] = useState(preSources?.sources || [])
    const [paginationData, setPaginationData] = useState(preSources?.pagination)
    const [page, setPage] = useState(preSources?.pagination?.page || 0)
    const [perPage] = useState(sourcePerPage)
    const [bot, setBot] = useState(initialBot || preBot)
    const [errorText, setErrorText] = useState(null)
    const [isProcessing, setIsProcessing] = useState(true)
    const [hasLoadedSources, setHasLoadedSources] = useState(
        Boolean(preSources?.sources?.length),
    )
    const [autoOpenSourceIdState, setAutoOpenSourceIdState] =
        useState(autoOpenSourceId)
    const [showCheckout, setShowCheckout] = useState(false)
    const router = useRouter()
    const { botId } = router.query

    const [activeId, setActiveId] = useState('sources')

    const getExpirationAlert = () => {
        if (checkPlanPermission(team, 'hobby').allowed) {
            return null
        }

        const createdAt = new Date(bot.createdAt)
        const expirationDate = new Date(
            createdAt.getTime() + 30 * 24 * 60 * 60 * 1000,
        ) // 30 days from creation
        const now = new Date()
        const daysLeft = Math.ceil(
            (expirationDate - now) / (1000 * 60 * 60 * 24),
        )

        if (daysLeft <= 0) {
            return {
                title: 'This free bot has expired and will be deleted shortly. All source data, logs, analytics, and settings will be lost. Upgrade to a paid plan to keep your bot.',
                type: 'warning',
            }
        }

        if (daysLeft < 14) {
            return {
                title: `This free bot will expire in ${daysLeft} days. All source data, logs, analytics, and settings will be lost. Upgrade to a paid plan to keep your bot.`,
                type: 'warning',
            }
        }
        return null
    }

    const expirationAlert = getExpirationAlert()

    async function refreshBot() {
        const urlParams = ['teams', team.id, 'bots', botId]
        let path = '/api/' + urlParams.join('/')
        const response = await fetch(path, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
        if (response.ok) {
            const data = await response.json()
            setBot(data)
            setErrorText('')
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
        }
    }

    async function refreshSources() {
        const urlParams = ['teams', team.id, 'bots', botId, 'sources']
        let path =
            '/api/' + urlParams.join('/') + `?page=${page}&limit=${perPage}`

        try {
            const response = await fetch(path, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (response.ok) {
                const data = await response.json()
                setSources((prevSources) =>
                    data.sources.map((source) => {
                        const existing =
                            prevSources?.find((s) => s.id === source.id) || {}
                        return { ...existing, ...source }
                    }),
                )
                setPaginationData(data.pagination)
            } else {
                try {
                    const data = await response.json()
                    setErrorText(
                        data.message ||
                            'Something went wrong, please try again.',
                    )
                } catch (e) {
                    setErrorText(
                        'Error ' + response.status + ', please try again.',
                    )
                }
            }
        } catch (e) {
            setErrorText('Something went wrong, please try again.')
        } finally {
            setHasLoadedSources(true)
        }
    }

    const handleChangePage = (page) => {
        setPage(page)
    }

    useEffect(() => {
        refreshSources()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page])

    //restart polling when sources change
    useEffect(() => {
        let interval = null
        if (bot) {
            if (isProcessing && !interval) {
                clearInterval(interval)
                interval = setInterval(() => {
                    refreshBot()
                    refreshSources()
                }, 10000)
            }
            if (!isProcessing && interval) {
                clearInterval(interval)
            }
        }

        return () => clearInterval(interval)
    }, [isProcessing])

    useEffect(() => {
        //set processing if there are any sources with status 'indexing'
        if (
            sources.some((source) =>
                ['pending', 'indexing', 'processing'].includes(source.status),
            )
        ) {
            setIsProcessing(true)
        } else {
            setIsProcessing(false)
        }

        refreshBot()
    }, [sources])

    const deleteSource = async (id) => {
        setErrorText('')
        const response = await fetch(
            `/api/teams/${team.id}/bots/${bot.id}/sources/${id}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
        if (response.ok) {
            const data = await response.json()
            setSources((prev) => prev.filter((source) => source.id !== id))
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
        }
    }

    const retrySource = async (id) => {
        setErrorText('')
        const response = await fetch(
            `/api/teams/${team.id}/bots/${bot.id}/sources/${id}`,
            {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
            },
        )
        if (response.ok) {
            const data = await response.json()
            setSources((prev) =>
                prev.map((source) => (source.id === id ? data : source)),
            )
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
        }
    }

    const refreshSourceWithCrawlerJS = async (id) => {
        setErrorText('')
        const response = await fetch(
            `/api/teams/${team.id}/bots/${bot.id}/sources/${id}/reingest`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ crawlerJS: true }),
            },
        )

        if (response.ok) {
            let data = {}
            try {
                data = await response.json()
            } catch (e) {
                data = {}
            }

            setSources((prev) =>
                prev.map((source) =>
                    source.id === id
                        ? {
                              ...source,
                              status: 'pending',
                              refreshing: true,
                              crawlerJS: true,
                              scheduled:
                                  data?.newScheduled !== undefined
                                      ? data.newScheduled
                                      : (source.scheduled ?? null),
                          }
                        : source,
                ),
            )
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText('Error ' + response.status + ', please try again.')
            }
        }
    }

    const menu = [
        {
            id: 'sources',
            title: 'Sources',
            content: <div>hello sources</div>,
        },
        {
            id: 'search',
            title: 'Search',
            content: <div>hello search</div>,
        },
        {
            id: 'starters',
            title: 'Starters',
            content: <div>hello starters</div>,
        },
        {
            id: 'glossary',
            title: 'Glossary',
            content: <div>hello glossary</div>,
        },
        {
            id: 'system',
            title: 'System',
            content: <div>hello system</div>,
        },
    ]

    if (!bot) return null

    const showLoader = !hasLoadedSources
    const sourceCount = bot?.sourceCount ?? paginationData?.totalCount ?? 0
    const sourcePageCount =
        bot?.pageCount ??
        sources.reduce(
            (total, source) => total + Number(source?.pageCount || 0),
            0,
        )

    const stats = [
        {
            label: 'Sources',
            value: sourceCount,
        },
        {
            label: 'Source pages',
            value: sourcePageCount,
        },
    ]

    return (
        <div
            id="page-configure-sources"
            className="h-full overflow-y-auto px-8"
        >
            <div className="flex flex-col gap-8 py-8">
                <Workspace.Header
                    title="Sources"
                    description="Power your bot with reliable information. Upload or link content to control what it knows — and how confidently it answers."
                >
                    <div className="flex flex-wrap items-center justify-start gap-2">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-900 ring-1 ring-inset ring-cyan-100"
                            >
                                <span className="tabular-nums font-semibold">
                                    <LocalStringNum value={stat.value} />
                                </span>
                                <span className="text-cyan-700">
                                    {stat.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </Workspace.Header>

                {showLoader ? (
                    <Workspace.Loader
                        message="Loading sources..."
                        variant="sources"
                    />
                ) : (
                    <>
                        <Alert title={errorText} type="warning" />

                        {expirationAlert && (
                            <Alert
                                title={expirationAlert.title}
                                type={expirationAlert.type}
                            >
                                <button
                                    onClick={() => setShowCheckout(true)}
                                    className="mt-2 inline-flex items-center rounded-md bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800 ring-2 ring-inset ring-yellow-600 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                                >
                                    Upgrade Now
                                </button>
                            </Alert>
                        )}

                        <SourceFailed
                            {...{
                                team,
                                bot,
                                sources,
                                deleteSource,
                                retrySource,
                            }}
                            refreshSourceWithCrawlerJS={
                                refreshSourceWithCrawlerJS
                            }
                        />

                        <SourceGrid
                            {...{
                                team,
                                bot,
                                sources,
                                setSources,
                                autoOpenSourceId: autoOpenSourceIdState,
                                paginationData,
                                handleChangePage,
                                retrySource,
                            }}
                        />

                        <SourceForm
                            {...{
                                team,
                                bot,
                                sources,
                                setSources,
                                setOpenSourceID: setAutoOpenSourceIdState,
                                maintenanceActive,
                            }}
                        />
                    </>
                )}
            </div>

            <ModalCheckout
                team={team}
                open={showCheckout}
                setOpen={setShowCheckout}
            />
        </div>
    )
}

export default PageConfigureSources
