import * as cookie from 'cookie'

// Utility functions for managing banner dismissal cookie (7-day expiration)
export const getBannerPreferences = () => {
  if (typeof window === 'undefined') return {}
  try {
    const cookies = cookie.parse(document.cookie || '')
    const prefsValue = cookies['docsbot-banner-prefs']
    if (!prefsValue) return {}

    const decoded = decodeURIComponent(prefsValue)
    const parsed = JSON.parse(decoded)
    return parsed
  } catch (error) {
    console.error('Failed to parse banner preferences cookie:', error)
    return {}
  }
}

export const setBannerPreference = (key, value, days = 7) => {
  if (typeof window === 'undefined') return
  try {
    const prefs = getBannerPreferences()
    prefs[key] = value
    const expires = new Date()
    expires.setDate(expires.getDate() + days)
    document.cookie = cookie.serialize('docsbot-banner-prefs', JSON.stringify(prefs), {
      expires,
      path: '/',
      sameSite: 'lax',
    })
  } catch (error) {
    console.error('Failed to set banner preference:', error)
  }
}

export const isBannerDismissed = (dismissKey) => {
  if (!dismissKey) return false
  const prefs = getBannerPreferences()
  return prefs[`dismissed-${dismissKey}`] === true
}
