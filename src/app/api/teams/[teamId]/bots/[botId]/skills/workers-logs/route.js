import { NextResponse } from 'next/server'

import { getAuthorizedBotContext, jsonError } from '@/lib/appRouteAuth'
import { buildScopeKey, eventMatchesScopeKey, normalizeRuntimeEvent } from './events'

export const dynamic = 'force-dynamic'

/**
 * Fetches Workers Observability events for this team/bot using the Cloudflare telemetry query API.
 * Auth: CLOUDFLARE_API_TOKEN (Bearer). Requires a saved dashboard query (queryId) — env WORKERS_OBSERVABILITY_EVENTS_QUERY_ID (Logs tab).
 * Returns a simplified user-facing event list derived from structured runtime logs.
 */
export async function GET(request, { params }) {
  try {
    const { teamId, botId } = await getAuthorizedBotContext(request, params)

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    const token = process.env.CLOUDFLARE_API_TOKEN
    const queryId = process.env.WORKERS_OBSERVABILITY_EVENTS_QUERY_ID

    if (!accountId || !token || !queryId) {
      const missing = [
        !accountId ? 'CLOUDFLARE_ACCOUNT_ID' : null,
        !token ? 'CLOUDFLARE_API_TOKEN' : null,
        !queryId ? 'WORKERS_OBSERVABILITY_EVENTS_QUERY_ID' : null,
      ].filter(Boolean)
      return NextResponse.json({
        configured: false,
        message: `Missing required logs configuration: ${missing.join(', ')}. Optional: WORKERS_LOG_SCOPE_KEY (default scope_key) and WORKERS_LOG_SOURCE_KEY (default source).`,
        events: [],
        raw: null,
      })
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(Number(searchParams.get('limit')) || 50, 1), 200)
    const hours = Math.min(Math.max(Number(searchParams.get('hours')) || 24, 1), 168)
    const skillName = String(searchParams.get('skillName') || '').trim()
    const scopeKey = skillName ? buildScopeKey(teamId, botId, skillName) : ''

    const now = Date.now()
    const from = now - hours * 60 * 60 * 1000

    const scopeFilterKey = process.env.WORKERS_LOG_SCOPE_KEY || 'scope_key'
    const sourceFilterKey = process.env.WORKERS_LOG_SOURCE_KEY || 'source'

    const filters = scopeKey
      ? [
          {
            kind: 'filter',
            key: scopeFilterKey,
            operation: 'eq',
            type: 'string',
            value: scopeKey,
          },
        ]
      : [
          {
            kind: 'filter',
            key: 'team_id',
            operation: 'eq',
            type: 'string',
            value: teamId,
          },
          {
            kind: 'filter',
            key: 'bot_id',
            operation: 'eq',
            type: 'string',
            value: botId,
          },
        ]

    const body = {
      queryId,
      timeframe: { from, to: now },
      view: 'events',
      limit,
      parameters: {
        filterCombination: 'and',
        filters: [
          {
            kind: 'group',
            filterCombination: 'and',
            filters: [
              {
                kind: 'filter',
                key: sourceFilterKey,
                operation: 'eq',
                type: 'string',
                value: 'skills-runtime',
              },
              ...filters,
            ],
          },
        ],
      },
    }

    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/observability/telemetry/query`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    )

    const payload = await res.json().catch(() => ({}))

    if (!res.ok) {
      return NextResponse.json(
        {
          configured: true,
          message:
            payload?.errors?.[0]?.message ||
            payload?.message ||
            'Cloudflare observability query failed.',
          events: [],
          raw: payload,
        },
        { status: 200 },
      )
    }

    const rawEv = payload?.result?.events
    let events = []
    if (Array.isArray(rawEv)) {
      events = rawEv
    } else if (rawEv && Array.isArray(rawEv.events)) {
      events = rawEv.events
    } else if (payload?.result?.invocations && Array.isArray(payload.result.invocations)) {
      events = payload.result.invocations
    }

    if (scopeKey) {
      events = events.filter((event) => eventMatchesScopeKey(event, scopeKey))
    }

    const normalizedEvents = events
      .map((event, index) => normalizeRuntimeEvent(event, index))
      .filter(Boolean)
    const terminalErrorKeys = new Set(
      normalizedEvents
        .filter((entry) => entry.status === 'error' && (entry.kind === 'function_call' || entry.kind === 'workflow'))
        .map((entry) => `${entry.sessionId || 'none'}:${entry.kind}:${Math.round(entry.timestamp / 1000)}`),
    )
    const dedupedEvents = normalizedEvents
      .filter((entry) => {
        if (entry.kind !== 'function_error' && entry.kind !== 'workflow_error') return true
        const counterpartKind = entry.kind === 'function_error' ? 'function_call' : 'workflow'
        const dedupeKey = `${entry.sessionId || 'none'}:${counterpartKind}:${Math.round(entry.timestamp / 1000)}`
        return !terminalErrorKeys.has(dedupeKey)
      })
      .sort((a, b) => b.timestamp - a.timestamp)

    return NextResponse.json({
      configured: true,
      message: null,
      events: dedupedEvents,
      raw: process.env.NODE_ENV === 'development' ? payload?.result : undefined,
    })
  } catch (error) {
    return jsonError(error?.message || 'Unable to load Workers logs.', error?.status || 500)
  }
}
