import { useState } from 'react'
import { useRouter } from 'next/router'
import Alert from '@/components/Alert'
import TableQuestions from '@/components/TableQuestions'

const buildParams = (ipFilter, rating, escalated, couldAnswer, dateRange) => {
    const params = new URLSearchParams()
    if (ipFilter !== null && ipFilter !== undefined)
        params.set('ip', ipFilter)
    if (rating !== null && rating !== undefined)
        params.set('rating', rating)
    if (escalated !== null && escalated !== undefined)
        params.set('escalated', escalated)
    if (couldAnswer !== null && couldAnswer !== undefined)
        params.set('couldAnswer', couldAnswer)
    if (dateRange !== null && dateRange !== undefined) {
        const startDate = new Date(dateRange.startDate)
        const endDate = new Date(dateRange.endDate)
        startDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)
        params.set('startDate', startDate.toISOString())
        params.set('endDate', endDate.toISOString())
    }
    return params.toString()
}

const emptyQuestions = {
    questions: [],
    pagination: {
        perPage: 50,
        page: 0,
        viewableCount: 0,
        totalCount: 0,
        hasMorePages: false,
        planLimit: 10,
    },
}

const PageAnalyticsQuestions = ({ team, bot, preQuestions, openQuestion }) => {
    const [questions, setQuestions] = useState(preQuestions || emptyQuestions)
    const [errorText, setErrorText] = useState(null)
    const router = useRouter()
    const { botId } = router.query
    const [searchInput, setSearchInput] = useState('')

    async function changePage(
        page,
        ipFilter,
        rating,
        escalated,
        couldAnswer,
        dateRange,
        search = '',
    ) {
        setErrorText(null)

        const urlParams = [
            'teams',
            team.id,
            'bots',
            botId,
            'questions?page=' +
                page +
                '&' +
                buildParams(ipFilter, rating, escalated, couldAnswer, dateRange),
        ]
        let path = '/api/' + urlParams.join('/')

        if (search && search.trim() !== '') {
            path += '&search=' + encodeURIComponent(search.trim())
        }

        const response = await fetch(path, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (response.ok) {
            const data = await response.json()
            setQuestions(data)
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
    }

    if (!bot) return null

    return (
        <div className="h-full overflow-y-auto px-8">
            <div className="py-8">
                <Alert title={errorText} type="warning" />
                <TableQuestions
                    team={team}
                    questions={questions}
                    setQuestions={setQuestions}
                    bot={bot}
                    changePage={changePage}
                    buildParams={buildParams}
                    openQuestion={openQuestion || null}
                    searchInput={searchInput}
                    setSearchInput={setSearchInput}
                />
            </div>
        </div>
    )
}

export default PageAnalyticsQuestions
