import { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Datepicker from 'react-tailwindcss-datepicker'
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import ModalExport from '@/components/ModalExport'
import TableLeads from '@/components/TableLeads'
import Workspace from '@new-dashboard/Workspace'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserManageBotSettings, canUserExportBotLogs } from '@/utils/function.utils'

const buildParams = (dateRange) => {
    if (!dateRange?.startDate || !dateRange?.endDate) {
        return ''
    }

    const startDate = new Date(dateRange.startDate)
    const endDate = new Date(dateRange.endDate)

    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
    })

    return params.toString()
}

const PageLeads = ({ team, bot }) => {
    const [leads, setLeads] = useState(null)
    const [errorText, setErrorText] = useState(null)
    const [dateRange, setDateRange] = useState({
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        endDate: new Date(),
    })
    const [exportOpen, setExportOpen] = useState(false)
    const [exporting, setExporting] = useState(false)
    const router = useRouter()
    const { botId } = router.query
    const [user] = useAuthState(auth)
    const canConfigureWidget = team && user && bot && canUserManageBotSettings(team, user.uid, bot)
    const canExport = team && user && bot && canUserExportBotLogs(team, user.uid, bot)

    async function changePage(page, pageDateRange) {
        setErrorText(null)
        const perPage = leads?.pagination?.perPage ?? 50
        const params = buildParams(pageDateRange)
        const path = `/api/teams/${team.id}/bots/${botId}/leads?page=${page}&perPage=${perPage}${
            params ? `&${params}` : ''
        }`

        const response = await fetch(path, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (response.ok) {
            const data = await response.json()
            setLeads(data)
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message ||
                        'Something went wrong, please try again.',
                )
            } catch (error) {
                setErrorText(
                    'Error ' + response.status + ', please try again.',
                )
            }
        }
    }

    async function downloadLeads() {
        if (exporting) return
        setExporting(true)

        const params = buildParams(dateRange)
        const apiUrl = `/api/teams/${team.id}/bots/${bot.id}/leads/export${
            params ? `?${params}` : ''
        }`

        try {
            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                },
            })

            if (response.ok) {
                const { url } = await response.json()
                const link = document.createElement('a')
                link.href = url
                link.click()
                link.remove()
                setExportOpen(false)
            } else {
                try {
                    const { message } = await response.json()
                    setErrorText(message)
                } catch (error) {
                    setErrorText(
                        'Something went wrong, please try again.',
                    )
                }
            }
        } catch (error) {
            setErrorText('Something went wrong, please try again.')
        }

        setExporting(false)
    }

    if (!bot) return null

    return (
        <div className="h-full overflow-y-auto px-8">
            <div className="mx-auto py-8">
                <Alert title={errorText} type="warning" />

                <div className="mb-4">
                    <Workspace.Header
                        title="Leads"
                        description="The Lead Collection Tool lets you collect user details in your chat widget."
                        note={
                            canConfigureWidget ? (
                                <>
                                    <Link
                                        href={`/app/bots/${bot.id}/widget/actions`}
                                        shallow
                                        className="text-cyan-700 underline hover:text-cyan-900"
                                    >
                                        Configure Lead Collection Tool
                                    </Link>
                                    . Get notified of new leads via{' '}
                                    <Link
                                        href={`/app/bots/${bot.id}/configure/webhooks`}
                                        shallow
                                        className="text-cyan-700 underline hover:text-cyan-900"
                                    >
                                        webhooks
                                    </Link>{' '}
                                    or{' '}
                                    <Link
                                        href="https://zapier.com/apps/docsbot-ai/integrations"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-cyan-700 underline hover:text-cyan-900"
                                    >
                                        Zapier trigger
                                    </Link>
                                    .
                                </>
                            ) : null
                        }
                    >
                        <div className="light w-full overflow-visible sm:w-64">
                            <Datepicker
                                value={dateRange}
                                primaryColor="cyan"
                                onChange={(value) => {
                                    if (
                                        value?.startDate &&
                                        value?.endDate
                                    ) {
                                        setDateRange(value)
                                    }
                                }}
                                useRange={true}
                                showShortcuts={true}
                                classNames={{
                                    container: 'z-10',
                                    input: 'py-2 text-center placeholder:text-center text-base sm:text-sm/6 border-0 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600',
                                }}
                            />
                        </div>

                        {canExport && (
                            <button
                                type="button"
                                onClick={() => setExportOpen(true)}
                                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <ArrowDownTrayIcon className="mr-2 h-4 w-4 text-gray-400" />
                                Export Leads
                            </button>
                        )}
                    </Workspace.Header>
                </div>

                <TableLeads
                    team={team}
                    bot={bot}
                    leads={leads}
                    dateRange={dateRange}
                    changePage={changePage}
                    setErrorText={setErrorText}
                />

                {canExport && (
                    <ModalExport
                        team={team}
                        bot={bot}
                        open={exportOpen}
                        setOpen={setExportOpen}
                        downloadLogs={downloadLeads}
                        isProcessing={exporting}
                    />
                )}
            </div>
        </div>
    )
}

export default PageLeads
