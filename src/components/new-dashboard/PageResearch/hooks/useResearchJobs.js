import { useCallback, useEffect, useRef, useState } from 'react'

export const useResearchJobs = ({ teamId, botId, enabled }) => {
    const [jobs, setJobs] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)
    const [errorText, setErrorText] = useState(null)
    const [currentPage, setCurrentPage] = useState(0)
    const [totalCount, setTotalCount] = useState(0)
    const [perPage, setPerPage] = useState(10)

    const mountedRef = useRef(false)
    const abortControllerRef = useRef(null)

    useEffect(() => {
        mountedRef.current = true
        return () => {
            mountedRef.current = false
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const handleDeleteJob = useCallback((jobId) => {
        setJobs((prev) => prev.filter((job) => job.jobId !== jobId))
        setErrorText(null)
    }, [])

    const handleDeleteError = useCallback((message) => {
        setErrorText(message)
    }, [])

    const fetchJobs = useCallback(
        async (page = 0) => {
            if (!teamId || !botId || !enabled) {
                setLoading(false)
                setHasLoaded(false)
                return
            }

            // Cancel previous request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }

            const controller = new AbortController()
            abortControllerRef.current = controller

            setLoading(true)
            setErrorText(null)

            try {
                const response = await fetch(
                    `/api/teams/${teamId}/bots/${botId}/research?page=${page}&perPage=${perPage}`,
                    {
                        method: 'GET',
                        headers: { 'Content-Type': 'application/json' },
                        signal: controller.signal,
                    },
                )

                if (!response.ok) {
                    let message = 'Failed to load deep research tasks'

                    try {
                        const data = await response.json()
                        message = data.error || data.message || message
                    } catch (_err) {
                        // ignore parsing errors
                    }

                    if (mountedRef.current) setErrorText(message)
                    return
                }

                const data = await response.json()
                const fetchedJobs = data.jobs || []

                if (mountedRef.current) {
                    setJobs(fetchedJobs)

                    const pagination = data.pagination || {}
                    setCurrentPage(pagination.page ?? page)
                    setPerPage(pagination.perPage ?? perPage)
                    setTotalCount(
                        pagination.viewableCount ??
                            pagination.totalCount ??
                            data.totalCount ??
                            (Array.isArray(fetchedJobs)
                                ? fetchedJobs.length
                                : 0),
                    )
                }
            } catch (error) {
                if (error?.name === 'AbortError') return

                if (mountedRef.current)
                    setErrorText('Failed to load deep research tasks')
            } finally {
                if (mountedRef.current) {
                    setLoading(false)
                    setHasLoaded(true)
                }
            }
        },
        [botId, enabled, perPage, teamId],
    )

    useEffect(() => {
        fetchJobs(0)
    }, [fetchJobs])

    const changePage = useCallback(
        (page) => {
            fetchJobs(page)
        },
        [fetchJobs],
    )

    return {
        jobs,
        setJobs,
        loading,
        hasLoaded,
        errorText,
        onDeleteJob: handleDeleteJob,
        onDeleteError: handleDeleteError,
        currentPage,
        totalCount,
        perPage,
        changePage,
    }
}
