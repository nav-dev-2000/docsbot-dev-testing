import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  canUserCreateDeleteBot,
  canUserEditBot,
  canUserManageBotSettings,
  canUserViewBot,
  getEffectiveRoleForBot,
  getUserBotRole,
  getUserRole,
} from '@/utils/function.utils'

describe('function.utils permissions', () => {
  const previousSuperAdmins = process.env.NEXT_PUBLIC_SUPER_ADMINS

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPER_ADMINS = JSON.stringify(['super-user'])
  })

  afterEach(() => {
    if (previousSuperAdmins === undefined) {
      delete process.env.NEXT_PUBLIC_SUPER_ADMINS
      return
    }

    process.env.NEXT_PUBLIC_SUPER_ADMINS = previousSuperAdmins
  })

  it('reads team roles and bot-specific overrides', () => {
    const team = {
      roles: {
        owner: 'owner',
        editor: 'editor',
      },
    }
    const bot = {
      roles: {
        editor: 'viewer',
      },
    }

    expect(getUserRole(team, 'owner')).toBe('owner')
    expect(getUserBotRole(team, bot, 'editor')).toBe('viewer')
    expect(getUserBotRole(team, bot, 'missing-user')).toBe('default')
  })

  it('uses the bot override when present and falls back to the team role otherwise', () => {
    const team = {
      roles: {
        owner: 'owner',
        editor: 'editor',
        suspended: 'none',
      },
    }

    expect(
      getEffectiveRoleForBot(team, { roles: { editor: 'viewer' } }, 'editor'),
    ).toBe('viewer')
    expect(
      getEffectiveRoleForBot(team, { roles: { owner: 'default' } }, 'owner'),
    ).toBe('owner')
    expect(
      getEffectiveRoleForBot(team, { roles: { suspended: 'default' } }, 'suspended'),
    ).toBe('none')
  })

  it('grants super admins full access regardless of stored team role', () => {
    const team = {
      roles: {
        member: 'viewer',
      },
    }
    const bot = {
      roles: {
        member: 'none',
      },
    }

    expect(getUserRole(team, 'super-user')).toBe('admin')
    expect(getEffectiveRoleForBot(team, bot, 'super-user')).toBe('admin')
    expect(canUserViewBot(team, bot, 'super-user')).toBe(true)
    expect(canUserEditBot(team, 'super-user', bot)).toBe(true)
    expect(canUserManageBotSettings(team, 'super-user', bot)).toBe(true)
  })

  it('limits create and edit permissions for viewer and none roles', () => {
    const team = {
      roles: {
        owner: 'owner',
        viewer: 'viewer',
        disabled: 'none',
      },
    }
    const bot = { roles: {} }

    expect(canUserCreateDeleteBot(team, 'owner')).toBe(true)
    expect(canUserCreateDeleteBot(team, 'viewer')).toBe(false)
    expect(canUserEditBot(team, 'viewer', bot)).toBe(false)
    expect(canUserViewBot(team, bot, 'viewer')).toBe(true)
    expect(canUserViewBot(team, bot, 'disabled')).toBe(false)
  })
})
