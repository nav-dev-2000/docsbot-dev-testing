import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import classNames from '@/utils/classNames'
import { getIsPublicRoute } from '@/utils/auth.utils'
import {
  getIsNewGmailUser,
  hasAuthenticationError,
  hasRegistrationError,
} from '@/utils/firebase.utils'
import { resolveBatch } from '@/utils/promises'
import {
  decideTextColor,
  getColorForLightBackground,
  getLighterColor,
} from '@/utils/colors'
import { detectRegionFromHeaders } from '@/lib/regionUtils'
import {
  getBotIdFromChannelMapping,
  getChannelDisplayName,
  getValidChannelEntries,
} from '@/lib/slackHelpers'
import {
  freezeSourcesResponse,
  isBotSourcesFrozen,
  isVectorDbMaintenanceEnabled,
  vectorDbMaintenanceResponse,
} from '@/lib/maintenance'
import { decryptKey, encryptKey } from '@/lib/encryption'

describe('general helper modules', () => {
  const previousEncryptionPassword = process.env.OPENAI_KEY_ENCRYPTION_PASSWORD

  beforeEach(() => {
    process.env.OPENAI_KEY_ENCRYPTION_PASSWORD = '12345678901234567890123456789012'
  })

  afterEach(() => {
    if (previousEncryptionPassword === undefined) {
      delete process.env.OPENAI_KEY_ENCRYPTION_PASSWORD
      return
    }

    process.env.OPENAI_KEY_ENCRYPTION_PASSWORD = previousEncryptionPassword
  })

  it('joins truthy class names and checks public routes', () => {
    expect(classNames('alpha', false, 'beta', null, 'gamma')).toBe(
      'alpha beta gamma',
    )
    expect(getIsPublicRoute('/login')).toBe(true)
    expect(getIsPublicRoute('/app')).toBe(false)
  })

  it('recognizes firebase auth and registration errors', () => {
    expect(
      hasAuthenticationError({ code: 'auth/wrong-password' }),
    ).toBe(true)
    expect(hasAuthenticationError({ code: 'auth/invalid-email' })).toBe(false)
    expect(
      hasRegistrationError({ code: 'auth/email-already-in-use' }),
    ).toBe(true)
    expect(
      getIsNewGmailUser({ _tokenResponse: { isNewUser: true } }),
    ).toBe(true)
  })

  it('resolves promise batches and optionally ignores rejected entries', async () => {
    await expect(
      resolveBatch([
        { func: Promise.resolve('first') },
        { func: Promise.resolve('second') },
      ]),
    ).resolves.toEqual(['first', 'second'])

    await expect(
      resolveBatch([
        { func: Promise.resolve('ok') },
        { func: Promise.reject(new Error('boom')), throw: false },
      ]),
    ).resolves.toEqual(['ok'])

    await expect(
      resolveBatch([
        { func: Promise.resolve('ok') },
        { func: Promise.reject(new Error('fail')) },
      ]),
    ).rejects.toThrow('fail')
  })

  it('derives contrasting and lighter colors from hex and rgb inputs', () => {
    expect(decideTextColor('#ffffff')).toBe('rgb(102,102,102)')
    expect(decideTextColor('rgb(10, 20, 30)')).toBe('#fff')
    expect(getColorForLightBackground('#ffffff')).toBe('rgb(102,102,102)')
    expect(getColorForLightBackground('#123456')).toBe('#123456')
    expect(getColorForLightBackground('bad-value')).toBe('#374151')
    expect(getLighterColor('#000000', 0.5)).toBe('rgb(127,127,127)')
  })

  it('maps cloudflare country headers to the expected region', () => {
    expect(detectRegionFromHeaders({ 'cf-ipcountry': 'DE' })).toBe('EU')
    expect(detectRegionFromHeaders({ 'cf-ipcountry': ['us'] })).toBe('US')
    expect(detectRegionFromHeaders({})).toBe('US')
  })

  it('normalizes slack channel mappings for bot configuration', () => {
    expect(getBotIdFromChannelMapping({ botId: 'bot-1' })).toBe('bot-1')
    expect(getBotIdFromChannelMapping('bot-1')).toBeNull()
    expect(getChannelDisplayName('C123', { channelName: 'general' })).toBe(
      '#general',
    )
    expect(getChannelDisplayName('C123', {})).toBe('C123')
    expect(
      getValidChannelEntries({
        C1: { botId: 'bot-1' },
        C2: { botId: 123 },
        C3: 'invalid',
      }),
    ).toEqual([['C1', { botId: 'bot-1' }]])
  })

  it('returns maintenance responses and frozen-source state', () => {
    expect(typeof isVectorDbMaintenanceEnabled()).toBe('boolean')
    expect(vectorDbMaintenanceResponse()).toEqual({
      message: expect.any(String),
      statusPage: expect.any(String),
    })
    expect(isBotSourcesFrozen({ freezeSources: true })).toBe(true)
    expect(isBotSourcesFrozen({ freezeSources: false })).toBe(false)
    expect(freezeSourcesResponse()).toEqual({
      message: 'This bot is undergoing short maintenance. Please try again later.',
    })
  })

  it('encrypts and decrypts API keys symmetrically', () => {
    const encrypted = encryptKey('sk-test-secret')
    expect(encrypted).not.toBe('sk-test-secret')
    expect(decryptKey(encrypted)).toBe('sk-test-secret')
  })
})
