import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
  buildBookingDisplayUrl,
  buildDisplayBotTools,
  coerceCustomButtonsToArray,
  createDefaultBookingTool,
  sanitizeCalComActionConfig,
  sanitizeBotTools,
  sanitizeCalendlyActionConfig,
  sanitizeTidyCalActionConfig,
} from '@/lib/botActions'

describe('bot tools sanitization', () => {
  it('accepts a valid calendly tool config and stores only the booking path', () => {
    expect(
      sanitizeCalendlyActionConfig({
        instructions: '  Offer booking for demos.  ',
        url: 'https://calendly.com/acme/demo?month=2026-03',
      }),
    ).toEqual({
      enabled: true,
      instructions: 'Offer booking for demos.',
      url: 'acme/demo',
    })
  })

  it('accepts a cal.com config and stores only the booking path', () => {
    expect(
      sanitizeCalComActionConfig({
        instructions: ' Use this when the user wants office hours. ',
        url: 'docsbot/office-hours',
      }),
    ).toEqual({
      enabled: true,
      instructions: 'Use this when the user wants office hours.',
      url: 'docsbot/office-hours',
    })
  })

  it('accepts a tidycal config with prompt alias and stores only the booking path', () => {
    expect(
      sanitizeTidyCalActionConfig({
        prompt: ' Use this when the user wants to book office hours. ',
        url: 'https://tidycal.com/team/docsbot/office-hours?ref=widget',
      }),
    ).toEqual({
      enabled: true,
      instructions: 'Use this when the user wants to book office hours.',
      url: 'team/docsbot/office-hours',
    })
  })

  it('allows disabled booking tools to persist without a configured url yet', () => {
    expect(
      sanitizeCalendlyActionConfig({
        enabled: false,
      }),
    ).toEqual({
      enabled: false,
      instructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
      url: '',
    })
  })

  it('rejects calendly configs without instructions', () => {
    expect(() =>
      sanitizeCalendlyActionConfig({
        url: 'https://calendly.com/acme/demo',
      }),
    ).toThrow('bot.tools.calendly.instructions is required.')
  })

  it('requires a booking url for each provider', () => {
    expect(() =>
      sanitizeCalComActionConfig({
        instructions: 'Use this when the user wants office hours.',
      }),
    ).toThrow('bot.tools.calcom.url is required.')
  })

  it('rejects provider urls with the wrong prefix', () => {
    expect(() =>
      sanitizeCalComActionConfig({
        instructions: 'Use this when the user wants office hours.',
        url: 'https://example.com/docsbot/office-hours',
      }),
    ).toThrow('bot.tools.calcom.url must start with https://cal.com/.')
  })

  it('rejects host-like provider inputs without a URL scheme', () => {
    expect(() =>
      sanitizeCalComActionConfig({
        instructions: 'Use this when the user wants office hours.',
        url: 'cal.com/docsbot/office-hours',
      }),
    ).toThrow('bot.tools.calcom.url must start with https://cal.com/.')
  })

  it('sanitizes the tools payload and preserves unknown tool configs', () => {
    expect(
      sanitizeBotTools({
        calendly: {
          enabled: true,
          instructions: 'Offer booking for demos.',
          url: 'https://calendly.com/acme/demo',
          hideEventDetails: true,
          hideCookieBanner: 1,
        },
        calcom: {
          enabled: false,
          instructions: 'Use this when the user wants office hours or a meeting.',
          url: 'https://cal.com/docsbot/office-hours',
          hideEventDetails: 'yes',
        },
        tidycal: {
          enabled: true,
          instructions: 'Use this when the user wants to book office hours.',
          url: 'https://tidycal.com/team/docsbot/office-hours',
          hideEventDetails: true,
        },
        custom_action: {
          mode: 'manual',
        },
      }),
    ).toEqual({
      calendly: {
        enabled: true,
        instructions: 'Offer booking for demos.',
        url: 'acme/demo',
        hideEventDetails: true,
        hideCookieBanner: true,
      },
      calcom: {
        enabled: false,
        instructions: 'Use this when the user wants office hours or a meeting.',
        url: 'docsbot/office-hours',
        hideEventDetails: true,
      },
      tidycal: {
        enabled: true,
        instructions: 'Use this when the user wants to book office hours.',
        url: 'team/docsbot/office-hours',
        hideEventDetails: true,
      },
      custom_action: {
        mode: 'manual',
      },
    })
  })


  it('sanitizes web_search live mode and allowed domains', () => {
    expect(
      sanitizeBotTools({
        web_search: {
          enabled: 1,
          live: 'yes',
          allowed_domains:
            'Docs.OpenAI.com, example.com https://foo.bar/docs invalid example.com',
        },
      }),
    ).toEqual({
      web_search: {
        enabled: true,
        live: true,
        allowed_domains: ['docs.openai.com', 'example.com', 'foo.bar'],
      },
    })
  })

  it('builds full display urls from stored booking paths', () => {
    expect(buildBookingDisplayUrl('calendly', 'docsbot/demo')).toBe(
      'https://calendly.com/docsbot/demo',
    )
    expect(buildBookingDisplayUrl('calcom', 'cal.com/docsbot/office-hours')).toBe(
      'https://cal.com/docsbot/office-hours',
    )
    expect(
      buildDisplayBotTools({
        calendly: {
          enabled: true,
          instructions: 'Book a demo.',
          url: 'docsbot/demo',
        },
      }),
    ).toEqual({
      calendly: {
        enabled: true,
        instructions: 'Book a demo.',
        url: 'https://calendly.com/docsbot/demo',
      },
    })
  })

  it('fills missing booking instructions with the generic fallback in display state', () => {
    expect(
      buildDisplayBotTools({
        calendly: {
          enabled: false,
          url: 'docsbot/demo',
        },
        calcom: {
          prompt: '  Offer office hours booking.  ',
          url: 'docsbot/office-hours',
        },
      }),
    ).toEqual({
      calendly: {
        enabled: false,
        instructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
        url: 'https://calendly.com/docsbot/demo',
      },
      calcom: {
        enabled: true,
        instructions: 'Offer office hours booking.',
        url: 'https://cal.com/docsbot/office-hours',
      },
    })
  })

  it('creates default booking tools with the shared trigger instructions', () => {
    expect(createDefaultBookingTool('tidycal')).toEqual({
      enabled: false,
      instructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
      url: '',
    })
  })

  it('coerces array-like objects (from spread corruption) back to arrays', () => {
    expect(coerceCustomButtonsToArray(undefined)).toEqual([])
    expect(coerceCustomButtonsToArray(null)).toEqual([])
    expect(coerceCustomButtonsToArray([])).toEqual([])
    const corrupted = {
      0: { enabled: false, name: 'a' },
      1: { enabled: false, name: 'b' },
    }
    expect(coerceCustomButtonsToArray(corrupted)).toEqual([
      { enabled: false, name: 'a' },
      { enabled: false, name: 'b' },
    ])
    expect(coerceCustomButtonsToArray({ enabled: true })).toBe(null)
    expect(coerceCustomButtonsToArray({ 0: {}, 2: {} })).toBe(null)
  })

  it('buildDisplayBotTools restores customButtons from spread-corrupted objects', () => {
    const corrupted = {
      0: {
        enabled: false,
        name: ' Docs ',
        instructions: ' When ',
        buttonText: ' Go ',
        url: '',
      },
    }
    const out = buildDisplayBotTools({ customButtons: corrupted })
    expect(Array.isArray(out.customButtons)).toBe(true)
    expect(out.customButtons).toHaveLength(1)
    expect(out.customButtons[0].name).toBe('Docs')
  })

  it('sanitizeBotTools accepts spread-corrupted customButtons and returns a sanitized array', () => {
    const corrupted = {
      0: {
        enabled: false,
        name: 'Test',
        instructions: 'x',
        buttonText: 'y',
        url: '',
      },
    }
    const sanitized = sanitizeBotTools({ customButtons: corrupted })
    expect(Array.isArray(sanitized.customButtons)).toBe(true)
    expect(sanitized.customButtons).toHaveLength(1)
  })
})
