import * as cookie from 'cookie'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { authDefaults } from '@/constants/auth.constants'

export default async function handler(req, res) {
  configureFirebaseApp()

  // If no cookies, user is already logged out
  if (!req.headers.cookie) {
    return res.status(204).end()
  }

  const parsedCookies = cookie.parse(req.headers.cookie)
  const accessToken = parsedCookies[authDefaults.COOKIE_NAME]

  // If our auth cookie doesn't exist, user is already logged out
  if (!accessToken) {
    return res.status(204).end()
  }

  try {
    const serializedCookie = cookie.serialize(authDefaults.COOKIE_NAME, accessToken, {
      ...authDefaults.COOKIE_OPTIONS,
      maxAge: 0,
    })
    res.setHeader('Set-Cookie', serializedCookie)
  } catch (error) {
    return res.status(500).end()
  }

  return res.status(204).end()
}
