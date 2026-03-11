import * as cookie from 'cookie'

const PREFS_COOKIE = 'docsbot-prefs'

export const getPreferences = () => {
    if (typeof window === 'undefined') return {}
    try {
        const cookies = cookie.parse(document.cookie || '')
        const prefsValue = cookies[PREFS_COOKIE]
        if (!prefsValue) return {}

        const decoded = decodeURIComponent(prefsValue)
        const parsed = JSON.parse(decoded)
        return parsed
    } catch (error) {
        console.error('Failed to parse preferences cookie:', error)
        return {}
    }
}

export const getPreference = (key) => {
    const prefs = getPreferences()
    return prefs[key]
}

export const setPreference = (key, value) => {
    if (typeof window === 'undefined') return
    try {
        const prefs = getPreferences()
        prefs[key] = value
        const expires = new Date()
        expires.setDate(expires.getDate() + 365)
        document.cookie = cookie.serialize(PREFS_COOKIE, JSON.stringify(prefs), {
            expires,
            path: '/',
            sameSite: 'lax',
        })
    } catch (error) {
        console.error('Failed to set preference:', error)
    }
}
