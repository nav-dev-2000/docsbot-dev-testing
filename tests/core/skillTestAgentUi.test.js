import { describe, expect, it, vi } from 'vitest'

import {
  buildSkillTestFinalMarkdown,
  buildSkillTestReportPrompt,
  createInitialSkillTestState,
  getMissingSkillTestEnvironmentBindings,
  hasMissingSkillTestEnvironmentBindings,
  normalizeMetadataBindings,
  reduceSkillTestStreamEvent,
  skillDraftHasCallableFunctions,
  skillTestEventsToAssistantParts,
} from '@/lib/skill-test-agent-ui'

describe('skill test agent UI helpers', () => {
  it('normalizes metadata bindings and removes duplicates', () => {
    expect(
      normalizeMetadataBindings([
        { envVar: 'CUSTOMER_ID', metadataKey: 'priv_customer_id', description: 'Customer id' },
        { envVar: 'CUSTOMER_ID_2', metadataKey: 'priv_customer_id' },
        { envVar: 'EMPTY', metadataKey: '' },
      ]),
    ).toEqual([
      {
        envVar: 'CUSTOMER_ID',
        metadataKey: 'priv_customer_id',
        description: 'Customer id',
      },
    ])
  })

  it('finds missing env and secret values', () => {
    const draft = {
      envBindings: [
        { envVar: 'WORKSPACE_ID', value: 'workspace-123' },
        { envVar: 'REGION', value: '' },
      ],
      secretBindings: [
        { envVar: 'API_TOKEN', secret: 'enc:abc' },
        { envVar: 'API_SECRET', secret: '' },
      ],
    }

    expect(getMissingSkillTestEnvironmentBindings(draft)).toEqual({
      env: ['REGION'],
      secrets: ['API_SECRET'],
    })
    expect(hasMissingSkillTestEnvironmentBindings(draft)).toBe(true)
  })

  it('detects whether a draft has callable functions for the published skill test', () => {
    expect(
      skillDraftHasCallableFunctions({
        publishedAt: '2026-04-25T00:00:00.000Z',
        validation: { functions: [{ name: 'lookup_weather' }] },
      }),
    ).toBe(true)

    expect(
      skillDraftHasCallableFunctions({
        publishedAt: '2026-04-25T00:00:00.000Z',
        hasFunctions: true,
        validation: { functions: [] },
      }),
    ).toBe(false)

    expect(
      skillDraftHasCallableFunctions({
        publishedAt: '2026-04-25T00:00:00.000Z',
        manifest: { hasFunctions: true },
      }),
    ).toBe(true)
  })

  it('appends stream tokens and activity events in order', () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1000)

    let state = createInitialSkillTestState()
    state = reduceSkillTestStreamEvent(state, { type: 'stream', data: 'Hello' })
    state = reduceSkillTestStreamEvent(state, { type: 'stream', data: '' })
    state = reduceSkillTestStreamEvent(state, { type: 'stream', data: 'world' })
    state = reduceSkillTestStreamEvent(state, {
      type: 'tool_call',
      name: 'call_skill_function',
      params: { name: 'lookup' },
      output: { ok: true },
    })
    state = reduceSkillTestStreamEvent(state, {
      type: 'reasoning',
      reasoningId: 'rs-1',
      text: 'Checking result',
    })

    expect(state.markdown).toBe('Hello\nworld')
    expect(state.events).toMatchObject([
      { type: 'tool_call', name: 'call_skill_function', params: { name: 'lookup' }, output: { ok: true } },
      { type: 'reasoning', reasoningId: 'rs-1', text: 'Checking result' },
    ])

    now.mockRestore()
  })

  it('stores structured final report sections and builds combined markdown', () => {
    let state = createInitialSkillTestState()
    state = reduceSkillTestStreamEvent(state, {
      type: 'final',
      summary: 'The skill passed the main checks.',
      technical: '- Called `lookup_weather`\n- No runtime errors',
      bugs: true,
      improvements: true,
    })

    expect(state.summary).toBe('The skill passed the main checks.')
    expect(state.technical).toContain('lookup_weather')
    expect(state.bugs).toBe(true)
    expect(state.improvements).toBe(true)
    expect(state.markdown).toBe(
      '## Summary\n\nThe skill passed the main checks.\n\n## Technical Details\n\n- Called `lookup_weather`\n- No runtime errors',
    )
    expect(
      buildSkillTestFinalMarkdown({
        summary: 'Readable result',
        technical: 'Raw detail',
      }),
    ).toBe('## Summary\n\nReadable result\n\n## Technical Details\n\nRaw detail')
  })

  it('defaults missing final report flags to false without parsing report text', () => {
    let state = createInitialSkillTestState()
    state = reduceSkillTestStreamEvent(state, {
      type: 'final',
      summary: 'This text says bug and improvement but flags are absent.',
      technical: 'Bugs: yes. Improvements: yes.',
    })

    expect(state.bugs).toBe(false)
    expect(state.improvements).toBe(false)
  })

  it('converts test events into assistant activity parts', () => {
    expect(
      skillTestEventsToAssistantParts([
        { id: 't1', type: 'tool_call', name: 'skills_exec', params: { code: 'return 1' }, output: { result: 1 } },
        { id: 'r1', type: 'reasoning', text: 'Thought' },
      ]),
    ).toEqual([
      {
        type: 'tool-skills_exec',
        state: 'output-available',
        toolCallId: 't1',
        input: { code: 'return 1' },
        output: { result: 1 },
      },
      {
        type: 'reasoning',
        text: 'Thought',
      },
    ])
  })

  it('builds a builder report prompt and redacts private metadata', () => {
    const prompt = buildSkillTestReportPrompt({
      skillName: 'customer-refunds',
      status: 'error',
      metadata: {
        priv_customer_id: 'cust-secret',
        locale: 'en-US',
      },
      events: [
        { type: 'tool_call', name: 'call_skill_function', params: { name: 'refund' } },
        { type: 'reasoning', text: 'The tool failed.' },
      ],
      markdown: '# Report\nFailed.',
      error: 'Boom',
      bugs: true,
      improvements: true,
      testInstructions: 'Try refund edge cases.',
      instructions: 'Fix the refund call.',
    })

    expect(prompt).toContain('published skill "customer-refunds"')
    expect(prompt).toContain('Test result: bugs_found')
    expect(prompt).toContain('Bugs detected: yes')
    expect(prompt).toContain('Improvements suggested: yes')
    expect(prompt).toContain('Try refund edge cases.')
    expect(prompt).toContain('- priv_customer_id: [redacted]')
    expect(prompt).toContain('- locale: en-US')
    expect(prompt).toContain('Tool call: call_skill_function')
    expect(prompt).toContain('Fix the refund call.')
    expect(prompt).not.toContain('cust-secret')
  })

  it('builds an improvement-only report prompt without treating the skill as broken', () => {
    const prompt = buildSkillTestReportPrompt({
      skillName: 'customer-refunds',
      status: 'completed',
      bugs: false,
      improvements: true,
      markdown: '# Report\nWorked with suggestions.',
    })

    expect(prompt).toContain('Test result: improvements_suggested')
    expect(prompt).toContain('make the suggested improvements without treating the skill as broken')
    expect(prompt).toContain('Bugs detected: no')
    expect(prompt).toContain('Improvements suggested: yes')
  })

  it('does not label failed tests as passed when no final flags are true', () => {
    const prompt = buildSkillTestReportPrompt({
      skillName: 'customer-refunds',
      status: 'error',
      error: 'Network failed.',
    })

    expect(prompt).toContain('Test result: error')
    expect(prompt).toContain('investigate the failed or incomplete test run')
    expect(prompt).not.toContain('test passed')
  })
})
