import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const botServiceMocks = vi.hoisted(() => ({
  sanitizeURL: vi.fn(),
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    sanitizeURL: botServiceMocks.sanitizeURL,
  }
})

import {
  createDefaultLeadCollectOptions,
  createLeadFieldByType,
  getLeadCollectExtraFields,
  isDefaultLeadFieldKey,
  isLeadCollectEnabled,
  sanitizeLeadCollectInputName,
  sanitizeLeadCollectOptions,
  supportsLeadFieldPlaceholder,
} from '@/lib/leadCollect'
import {
  analyzeSiteForBot,
  createBotRequest,
  createSourceRequest,
  getBotRequest,
  normalizeWebsiteUrl,
  updateBotRequest,
} from '@/services/bots'
import {
  deleteSlackWorkspace,
  getBotsForSlackWorkspace,
  getSlackIntegration,
  updateSlackIntegration,
  updateTeamRequest,
} from '@/services/teams'

const createJsonResponse = ({ ok = true, status = 200, payload, jsonImpl } = {}) => ({
  ok,
  status,
  json: jsonImpl || vi.fn(async () => payload),
})

describe('lead collect and service helpers', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    botServiceMocks.sanitizeURL.mockReset()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('creates, sanitizes, and validates lead collection fields', () => {
    expect(createDefaultLeadCollectOptions()).toEqual({
      enabled: true,
      mode: 'before_response',
      fields: [
        {
          key: 'name',
          label: 'Name',
          type: 'text',
          required: true,
          autocomplete: 'name',
        },
        {
          key: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          autocomplete: 'email',
        },
      ],
    })

    expect(sanitizeLeadCollectInputName('My field!*')).toBe('Myfield')
    expect(isDefaultLeadFieldKey(' email ')).toBe(true)
    expect(supportsLeadFieldPlaceholder('select')).toBe(true)
    expect(supportsLeadFieldPlaceholder('date')).toBe(false)

    expect(
      createLeadFieldByType('select', [{ key: 'select' }]),
    ).toEqual({
      key: 'select2',
      label: 'Select',
      type: 'select',
      required: false,
      placeholder: 'Select an option',
      options: [{ value: 'option-1', label: 'Option 1' }],
    })

    const sanitized = sanitizeLeadCollectOptions({
      enabled: true,
      mode: 'before_escalation',
      fields: [
        {
          key: ' name ',
          label: ' Full name ',
          type: 'text',
          required: false,
          placeholder: 'Your name',
          value: 'ignore me',
        },
        {
          key: 'company',
          label: 'Company',
          type: 'select',
          options: ['enterprise', { value: 'startup', label: 'Startup' }],
        },
      ],
    })

    expect(sanitized).toEqual({
      enabled: true,
      mode: 'before_escalation',
      fields: [
        {
          key: 'name',
          label: ' Full name ',
          type: 'text',
          required: false,
          placeholder: 'Your name',
          autocomplete: 'name',
        },
        {
          key: 'company',
          label: 'Company',
          type: 'select',
          required: false,
          autocomplete: 'organization',
          options: ['enterprise', { value: 'startup', label: 'Startup' }],
        },
      ],
    })

    expect(isLeadCollectEnabled(sanitized)).toBe(true)
    expect(getLeadCollectExtraFields(sanitized)).toEqual([
      {
        key: 'company',
        label: 'Company',
        type: 'select',
        required: false,
        autocomplete: 'organization',
        options: ['enterprise', { value: 'startup', label: 'Startup' }],
      },
    ])

    expect(() =>
      sanitizeLeadCollectOptions({
        mode: 'before_response',
        fields: [{ key: 'name' }, { key: 'name' }],
      }),
    ).toThrow('Lead field key "name" is duplicated.')
  })

  it('builds bot service requests and surfaces API errors cleanly', async () => {
    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { id: 'bot-1' } }),
    )
    await expect(createBotRequest('team-1', { name: 'Bot' })).resolves.toEqual({
      id: 'bot-1',
    })
    expect(global.fetch).toHaveBeenLastCalledWith('/api/teams/team-1/bots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Bot' }),
    })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { ok: true } }),
    )
    await expect(
      analyzeSiteForBot('team-1', 'https://docsbot.ai', { color: 'cyan' }),
    ).resolves.toEqual({ ok: true })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { id: 'source-1' } }),
    )
    await expect(
      createSourceRequest('team-1', 'bot-1', { type: 'sitemap' }),
    ).resolves.toEqual({ id: 'source-1' })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { id: 'bot-1', name: 'DocsBot' } }),
    )
    await expect(getBotRequest('team-1', 'bot-1')).resolves.toEqual({
      id: 'bot-1',
      name: 'DocsBot',
    })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({
        ok: false,
        status: 402,
        payload: { message: 'Upgrade required' },
      }),
    )
    await expect(updateBotRequest('team-1', 'bot-1', {})).rejects.toMatchObject({
      message: 'Upgrade required',
      status: 402,
    })
  })

  it('normalizes website URLs using sanitizeURL with graceful fallback', () => {
    botServiceMocks.sanitizeURL.mockReturnValue('https://docsbot.ai/')
    expect(normalizeWebsiteUrl('docsbot.ai')).toBe('https://docsbot.ai/')

    botServiceMocks.sanitizeURL.mockImplementation(() => {
      throw new Error('bad url')
    })
    expect(normalizeWebsiteUrl('docsbot.ai')).toBe('docsbot.ai')
    expect(normalizeWebsiteUrl('')).toBe('')
  })

  it('builds team service requests and propagates structured API failures', async () => {
    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { id: 'team-1' } }),
    )
    await expect(updateTeamRequest('team-1', { name: 'DocsBot' })).resolves.toEqual({
      id: 'team-1',
    })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { connected: true } }),
    )
    await expect(getSlackIntegration('team-1')).resolves.toEqual({
      connected: true,
    })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { success: true } }),
    )
    await expect(
      updateSlackIntegration('team-1', { enabled: true }),
    ).resolves.toEqual({ success: true })

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ payload: { success: true } }),
    )
    await expect(
      deleteSlackWorkspace('team-1', 'T_123'),
    ).resolves.toEqual({ success: true })
    expect(global.fetch).toHaveBeenLastCalledWith(
      '/api/teams/team-1/integrations/slack?slackTeamId=T_123',
      { method: 'DELETE' },
    )

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({ jsonImpl: vi.fn(async () => { throw new Error('no body') }) }),
    )
    await expect(getBotsForSlackWorkspace('team-1')).resolves.toBeNull()

    global.fetch.mockResolvedValueOnce(
      createJsonResponse({
        ok: false,
        status: 500,
        payload: { message: 'Slack exploded' },
      }),
    )
    await expect(
      getSlackIntegration('team-1'),
    ).rejects.toMatchObject({ message: 'Slack exploded', status: 500 })
  })
})
