import { Fragment, useState, useEffect, useCallback } from 'react'
import { Menu, Transition } from '@headlessui/react'
import clsx from 'clsx'
import * as cookie from 'cookie'
import featureUpdates from '/public/feature-updates.json'
const FEATURE_UPDATES = featureUpdates
import NotificationsButton from './NotificationsButton'
import NotificationsMenu from './NotificationsMenu'

const Notifications = ({ className }) => {
    const getPreferences = useCallback(() => {
        if (typeof window === 'undefined') return {}
        try {
            const cookies = cookie.parse(document.cookie || '')
            const prefsValue = cookies['docsbot-prefs']
            if (!prefsValue) return {}

            const decoded = decodeURIComponent(prefsValue)
            const parsed = JSON.parse(decoded)
            return parsed
        } catch (error) {
            console.error('Failed to parse preferences cookie:', error)
            return {}
        }
    }, [])

    const setPreference = useCallback(
        (key, value) => {
            if (typeof window === 'undefined') return
            try {
                const prefs = getPreferences()
                prefs[key] = value
                const expires = new Date()
                expires.setDate(expires.getDate() + 365)
                document.cookie = cookie.serialize(
                    'docsbot-prefs',
                    JSON.stringify(prefs),
                    {
                        expires,
                        path: '/',
                        sameSite: 'lax',
                    },
                )
            } catch (error) {
                console.error('Failed to set preference:', error)
            }
        },
        [getPreferences],
    )

    const getLastDismissedDate = useCallback(() => {
        const prefs = getPreferences()
        return prefs['dismissed-feature-updates'] || null
    }, [getPreferences])

    const setLastDismissedDate = useCallback(
        (date) => {
            setPreference('dismissed-feature-updates', date)
        },
        [setPreference],
    )

    const sortedUpdates = FEATURE_UPDATES.slice().sort(
        (a, b) => new Date(b.date) - new Date(a.date),
    )
    const latestUpdateDate = sortedUpdates[0]?.date
    const [hasUnreadUpdates, setHasUnreadUpdates] = useState(false)
    const [shouldWiggle, setShouldWiggle] = useState(false)

    useEffect(() => {
        try {
            const lastDismissedDate = getLastDismissedDate()

            // Check if there are any updates newer than the last dismissed date
            if (latestUpdateDate) {
                setHasUnreadUpdates(
                    !lastDismissedDate ||
                        new Date(latestUpdateDate) >
                            new Date(lastDismissedDate),
                )
            }
        } catch (e) {
            // noop
        }
    }, [latestUpdateDate, getLastDismissedDate])

    useEffect(() => {
        if (!hasUnreadUpdates) return
        const intervalId = setInterval(() => {
            setShouldWiggle(true)
            setTimeout(() => setShouldWiggle(false), 1500)
        }, 15000)
        return () => clearInterval(intervalId)
    }, [hasUnreadUpdates])

    const markUpdatesAsRead = () => {
        if (!latestUpdateDate) return
        try {
            setLastDismissedDate(latestUpdateDate)
            setHasUnreadUpdates(false)
        } catch (e) {
            // noop
        }
    }

    return (
        <Menu
            as="div"
            className={clsx('relative', className)}
            data-component="notifications"
        >
            {({ close, open }) => (
                <>
                    <NotificationsButton
                        shouldWiggle={shouldWiggle}
                        hasUnreadUpdates={hasUnreadUpdates}
                        isActive={open}
                    />

                    <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                        afterLeave={markUpdatesAsRead}
                    >
                        <NotificationsMenu
                            close={close}
                            getLastDismissedDate={getLastDismissedDate}
                            sortedUpdates={sortedUpdates}
                        />
                    </Transition>
                </>
            )}
        </Menu>
    )
}

export default Notifications
