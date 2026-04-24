import * as cookie from 'cookie'
import crypto from 'crypto'
import { getFirestore } from 'firebase-admin/firestore'

import { authDefaults } from '@/constants/auth.constants'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { verifySessionCookie } from '@/middleware/verifySessionCookie'
import { getTeam } from '@/lib/dbQueries'
import {
  canUserManageBotSettings,
  canUserViewBot,
} from '@/utils/function.utils'
import { isSuperAdmin } from '@/utils/helpers'

configureFirebaseApp()

const firestore = getFirestore()

async function getAuthorizedUserFromRequest(request) {
  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const token = authHeader.split(' ')[1] || authHeader
    const hash = crypto.createHash('sha256').update(token).digest('hex')
    const snapshot = await firestore
      .collection('users')
      .where('apiKey', '==', hash)
      .limit(1)
      .get()

    if (!snapshot.empty) {
      return { uid: snapshot.docs[0].id }
    }

    const error = new Error('Invalid API key')
    error.status = 401
    throw error
  }

  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader) {
    const error = new Error('Please login or provide an API key')
    error.status = 401
    throw error
  }

  const parsedCookies = cookie.parse(cookieHeader)
  const accessToken = parsedCookies[authDefaults.COOKIE_NAME]
  if (!accessToken) {
    const error = new Error('Please login or provide an API key')
    error.status = 401
    throw error
  }

  return verifySessionCookie(accessToken)
}

export async function getAuthorizedBotContext(request, params) {
  const { teamId, botId } = await params
  const { uid } = await getAuthorizedUserFromRequest(request)

  const team = await getTeam(teamId)
  if (!team || (!team.roles?.[uid] && !isSuperAdmin(uid))) {
    const error = new Error('User does not have access to team')
    error.status = 403
    throw error
  }

  const botRef = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .get()

  if (!botRef.exists) {
    const error = new Error('Bot not found')
    error.status = 404
    throw error
  }

  const bot = {
    id: botRef.id,
    ...botRef.data(),
  }

  if (!canUserViewBot(team, bot, uid)) {
    const error = new Error('You are not allowed to view this bot.')
    error.status = 403
    throw error
  }

  return {
    userId: uid,
    team,
    teamId,
    bot,
    botId,
    firestore,
  }
}

export async function getAuthorizedTeamForAppRoute(request, params) {
  return getAuthorizedBotContext(request, params)
}

export async function requireAppRouteTeamAccess(request, context, options = {}) {
  const auth = await getAuthorizedBotContext(request, context.params)

  if (
    options.requireManageSettings &&
    !canUserManageBotSettings(auth.team, auth.userId, auth.bot)
  ) {
    const error = new Error('You are not allowed to manage bot skills.')
    error.status = 403
    throw error
  }

  return {
    ...auth,
    params: await context.params,
  }
}

export async function authenticateAppRouteTeamAccess(request, params) {
  return getAuthorizedBotContext(request, params)
}

export async function getAuthorizedTeamBotRequest(request, params) {
  return getAuthorizedBotContext(request, params)
}

export async function getAuthorizedAppRouteContext(request, params) {
  return getAuthorizedBotContext(request, params)
}

export async function parseJsonBody(request) {
  try {
    return await request.json()
  } catch (_error) {
    return {}
  }
}

export function jsonError(message, status = 500) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
