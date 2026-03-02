import { useEffect } from 'react'
import { useRouter } from 'next/router'

/**
 * Warns before leaving the page when there are unsaved changes.
 * Handles both browser tab close/refresh (beforeunload) and in-app navigation (routeChangeStart).
 * @param {boolean} isDirty - Whether there are unsaved changes
 * @param {boolean} [isUpdating=false] - Whether a save is in progress (skip warning during save)
 */
export function useUnsavedChangesWarning(isDirty, isUpdating = false) {
    const router = useRouter()

    useEffect(() => {
        const handleBrowseAway = () => {
            if (!isDirty || isUpdating) return
            if (
                window.confirm(
                    'You have unsaved changes. Are you sure you want to leave?',
                )
            ) {
                return
            }
            router.events.emit('routeChangeError')
            throw 'routeChange aborted.'
        }

        const handleBeforeUnload = (e) => {
            if (!isDirty || isUpdating) return
            e.preventDefault()
            e.returnValue = ''
        }

        router.events.on('routeChangeStart', handleBrowseAway)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            router.events.off('routeChangeStart', handleBrowseAway)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty, isUpdating, router])
}
