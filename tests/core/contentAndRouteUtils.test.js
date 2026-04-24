import { beforeEach, describe, expect, it, vi } from 'vitest'

const sourceTypeHelperMocks = vi.hoisted(() => ({
  getPlanLevel: vi.fn(),
  getRequiredPlanLevel: vi.fn(),
}))

vi.mock('@/utils/helpers', async () => {
  const actual = await vi.importActual('@/utils/helpers')
  return {
    ...actual,
    getPlanLevel: sourceTypeHelperMocks.getPlanLevel,
    getRequiredPlanLevel: sourceTypeHelperMocks.getRequiredPlanLevel,
  }
})

vi.mock('@headstartwp/core', () => ({
  getWPUrl: () => 'https://wp.example.com',
  getHostUrl: () => 'https://docsbot.ai',
}))

import { preprocessMath } from '@/utils/markdown'
import { replaceATagsWithLinks, replaceUrls } from '@/utils/replaceUrls'
import {
  getIncompatibleSourceTypesForPlan,
  isPlanCompatibleWithSourceTypes,
} from '@/utils/sourceTypePlanChecks'
import {
  parseBotTabControlFromAsPath,
  TAB_DEFAULTS,
  TOP_LEVEL_TABS,
  VALID_CONTROLS,
  parseSkillIdFromBotAppAsPath,
  slugToTabControl,
  tabControlToPath,
} from '@/lib/botRoutes'
import {
  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
  WEBHOOK_EVENT_LEAD_CREATED,
  createWebhookPayload,
  isBlockedWebhookTarget,
  isValidHttpUrl,
  mapWebhookEntries,
  normalizeWebhookDoc,
  normalizeWebhookEvents,
} from '@/lib/webhooks'

describe('content and route utilities', () => {
  beforeEach(() => {
    sourceTypeHelperMocks.getPlanLevel.mockReset()
    sourceTypeHelperMocks.getRequiredPlanLevel.mockReset()
  })

  it('preserves code while normalizing markdown math delimiters', () => {
    const input = [
      'Equation: \\(a+b\\)',
      '`$dont-touch$`',
      '```js',
      'const price = "$100"',
      '```',
      'Also $ x^2 $ and \\[y=z\\].',
    ].join('\n')

    expect(preprocessMath(input)).toContain('Equation: $$a+b$$')
    expect(preprocessMath(input)).toContain('`$dont-touch$`')
    expect(preprocessMath(input)).toContain('const price = "$100"')
    expect(preprocessMath(input)).toContain('$$ y^2 $$'.replace('y', 'x'))
    expect(preprocessMath(input)).toContain('Also $$ x^2 $$ and $$y=z$$.')
  })

  it('returns a string from preprocessMath even when given non-string input (avoids React rendering objects)', () => {
    expect(preprocessMath({ id: 'x' })).toBe('')
    expect(preprocessMath(['a'])).toBe('')
    expect(preprocessMath(null)).toBe('')
    expect(preprocessMath(undefined)).toBe('')
    expect(preprocessMath(42)).toBe('42')
  })

  it('rewrites WordPress URLs recursively and normalizes anchor tags', () => {
    expect(
      replaceUrls({
        url: 'https://wp.example.com/article/post',
        nested: ['https://wp.example.com/docs'],
      }),
    ).toEqual({
      url: 'https://docsbot.ai/article/post',
      nested: ['https://docsbot.ai/docs'],
    })

    expect(
      replaceATagsWithLinks(
        '<p><a href="https://wp.example.com/docs/" target="_blank" class="cta">Read</a></p>',
      ),
    ).toBe(
      '<p><a href="https://docsbot.ai/docs" target="_blank" class="cta">Read</a></p>',
    )
  })

  it('filters incompatible source types based on required plan levels', () => {
    sourceTypeHelperMocks.getPlanLevel.mockReturnValue(2)
    sourceTypeHelperMocks.getRequiredPlanLevel.mockImplementation(
      (_team, minPlan, sourceId) => {
        if (sourceId === 'notion') return 3
        if (sourceId === 'helpscout') return 4
        if (minPlan === 'free') return 1
        return 2
      },
    )

    expect(
      getIncompatibleSourceTypesForPlan({
        team: { createdAt: '2026-01-01' },
        targetPlanId: 'hobby',
        usedSourceTypeIds: ['helpscout', 'notion', 'helpscout'],
      }),
    ).toEqual([
      {
        id: 'helpscout',
        title: 'Help Scout Tickets',
        minPlan: 'pro',
        unknown: false,
      },
      {
        id: 'notion',
        title: 'Notion',
        minPlan: 'personal',
        unknown: false,
      },
    ])

    expect(
      isPlanCompatibleWithSourceTypes({
        team: {},
        targetPlanId: 'hobby',
        usedSourceTypeIds: ['sitemap'],
      }),
    ).toBe(true)
  })

  it('parses bot route slugs and rebuilds canonical paths', () => {
    expect(TAB_DEFAULTS.analytics).toBe('reports')
    expect(TOP_LEVEL_TABS).toContain('chat')
    expect(VALID_CONTROLS.configure).toContain('sources')

    expect(slugToTabControl([])).toEqual({ tab: 'chat', control: null })
    expect(slugToTabControl(['search'])).toEqual({
      tab: 'configure',
      control: 'search',
    })
    expect(slugToTabControl(['analytics', 'questions', 'q-1'])).toEqual({
      tab: 'analytics',
      control: 'questions',
      questionId: 'q-1',
    })
    expect(slugToTabControl(['analytics', 'reports', 'print'])).toEqual({
      tab: 'analytics',
      control: 'reports',
      print: true,
    })
    expect(slugToTabControl(['configure', 'skills'])).toEqual({
      tab: 'configure',
      control: 'skills',
    })
    expect(slugToTabControl(['configure', 'skills', 'pdf-tools'])).toEqual({
      tab: 'configure',
      control: 'skills',
      skillId: 'pdf-tools',
    })
    expect(slugToTabControl(['configure', 'skills', 'bad_slug!!!'])).toEqual({
      tab: 'configure',
      control: 'skills',
    })

    expect(tabControlToPath('bot-1', 'chat')).toBe('/app/bots/bot-1')
    expect(
      tabControlToPath('bot-1', 'analytics', 'reports', {
        print: true,
        month: '2026-02',
      }),
    ).toBe('/app/bots/bot-1/analytics/reports/print?month=2026-02')
    expect(
      tabControlToPath('bot-1', 'research', null, { jobId: 'job-1' }),
    ).toBe('/app/bots/bot-1/research?jobId=job-1')
    expect(
      tabControlToPath('bot-1', 'configure', 'skills', { skillId: 'pdf-tools' }),
    ).toBe('/app/bots/bot-1/configure/skills/pdf-tools')
    expect(tabControlToPath('bot-1', 'configure', 'skills')).toBe(
      '/app/bots/bot-1/configure/skills',
    )

    expect(
      parseSkillIdFromBotAppAsPath('/app/bots/bot-1/configure/skills/pdf-tools'),
    ).toBe('pdf-tools')
    expect(
      parseSkillIdFromBotAppAsPath('/app/bots/bot-1/configure/skills/pdf-tools?x=1'),
    ).toBe('pdf-tools')
    expect(parseSkillIdFromBotAppAsPath('/app/bots/bot-1/configure/skills')).toBe(null)
    expect(parseSkillIdFromBotAppAsPath('/app/bots/bot-1/configure/skills/bad!!!')).toBe(
      null,
    )

    expect(parseBotTabControlFromAsPath('/app/bots/bot-1')).toEqual({
      tab: 'chat',
      control: null,
    })
    expect(parseBotTabControlFromAsPath('/app/bots/bot-1/configure/skills/pdf-tools')).toEqual({
      tab: 'configure',
      control: 'skills',
      skillId: 'pdf-tools',
    })
    expect(
      parseBotTabControlFromAsPath('/app/bots/bot-1/configure/skills/pdf-tools?x=1'),
    ).toEqual({
      tab: 'configure',
      control: 'skills',
      skillId: 'pdf-tools',
    })
  })

  it('normalizes webhook docs, payloads, and SSRF checks', () => {
    const timestamp = {
      now: () => 'NOW',
      fromDate: (date) => `FROM:${date.toISOString()}`,
    }

    expect(
      normalizeWebhookEvents(
        [WEBHOOK_EVENT_LEAD_CREATED, 'bad', WEBHOOK_EVENT_LEAD_CREATED],
        null,
      ),
    ).toEqual([WEBHOOK_EVENT_LEAD_CREATED])
    expect(normalizeWebhookEvents([], WEBHOOK_EVENT_CONVERSATION_ESCALATED)).toEqual([
      WEBHOOK_EVENT_CONVERSATION_ESCALATED,
    ])

    expect(
      normalizeWebhookDoc('wh_1', {
        event: WEBHOOK_EVENT_LEAD_CREATED,
        targetUrl: 'https://hooks.example.com',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      }),
    ).toMatchObject({
      id: 'wh_1',
      targetUrl: 'https://hooks.example.com',
      events: [WEBHOOK_EVENT_LEAD_CREATED],
      createdAt: '2026-01-01T00:00:00.000Z',
    })

    expect(
      createWebhookPayload(
        {
          targetUrl: 'https://hooks.example.com',
          event: WEBHOOK_EVENT_CONVERSATION_ESCALATED,
          expirationDate: '2026-03-01T00:00:00Z',
          filters: { teamId: 'team-1' },
        },
        'user-1',
        timestamp,
      ),
    ).toEqual({
      label: null,
      targetUrl: 'https://hooks.example.com',
      events: [WEBHOOK_EVENT_CONVERSATION_ESCALATED],
      status: 'active',
      source: 'admin',
      secret: null,
      filters: { teamId: 'team-1' },
      expirationDate: 'FROM:2026-03-01T00:00:00.000Z',
      createdBy: 'user-1',
      createdAt: 'NOW',
      updatedAt: 'NOW',
    })

    expect(
      Object.keys(
        mapWebhookEntries({
          old: {
            targetUrl: 'https://hooks.example.com/1',
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
          newer: {
            targetUrl: 'https://hooks.example.com/2',
            createdAt: new Date('2026-02-01T00:00:00Z'),
          },
        }),
      ),
    ).toEqual(['newer', 'old'])

    expect(isValidHttpUrl('https://hooks.example.com')).toBe(true)
    expect(isValidHttpUrl('mailto:test@example.com')).toBe(false)
    expect(isBlockedWebhookTarget('https://docsbot.ai/webhook')).toBe(true)
    expect(isBlockedWebhookTarget('https://hooks.example.com')).toBe(false)
  })
})
