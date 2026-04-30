export const SKILL_TEST_MODEL = 'gpt-5.4-nano'
export const SKILL_TEST_REASONING_EFFORT = 'medium'

export function normalizeMetadataBindings(bindings = []) {
  const seen = new Set()
  const rows = []
  for (const binding of Array.isArray(bindings) ? bindings : []) {
    const metadataKey = String(binding?.metadataKey || '').trim()
    if (!metadataKey || seen.has(metadataKey)) continue
    seen.add(metadataKey)
    rows.push({
      envVar: String(binding?.envVar || '').trim(),
      metadataKey,
      description: String(binding?.description || '').trim(),
    })
  }
  return rows
}

export function getMissingSkillTestEnvironmentBindings(draft = {}) {
  const envRows = Array.isArray(draft?.envBindings) && draft.envBindings.length
    ? draft.envBindings
    : Array.isArray(draft?.manifest?.envBindings)
      ? draft.manifest.envBindings
      : []
  const secretRows = Array.isArray(draft?.secretBindings) && draft.secretBindings.length
    ? draft.secretBindings
    : Array.isArray(draft?.manifest?.secretBindings)
      ? draft.manifest.secretBindings
      : []

  return {
    env: envRows
      .filter((row) => !String(row?.value || '').trim())
      .map((row) => String(row?.envVar || '').trim())
      .filter(Boolean),
    secrets: secretRows
      .filter((row) => !String(row?.secret || '').trim())
      .map((row) => String(row?.envVar || '').trim())
      .filter(Boolean),
  }
}

export function hasMissingSkillTestEnvironmentBindings(draft = {}) {
  const missing = getMissingSkillTestEnvironmentBindings(draft)
  return missing.env.length > 0 || missing.secrets.length > 0
}

function hasNamedFunctionEntry(entry) {
  if (typeof entry === 'string') return entry.trim().length > 0
  if (!entry || typeof entry !== 'object') return false
  return String(
    entry.name ||
      entry.functionName ||
      entry.function_name ||
      entry.key ||
      entry.id ||
      '',
  ).trim().length > 0
}

export function skillDraftHasCallableFunctions(draft = {}) {
  const candidateLists = [
    draft?.validation?.functions,
    draft?.validation?.callableFunctions,
    draft?.validation?.callable_functions,
    draft?.manifest?.functions,
    draft?.functions,
  ].filter(Array.isArray)

  if (candidateLists.length > 0) {
    return candidateLists.some((list) => list.some(hasNamedFunctionEntry))
  }

  return Boolean(draft?.manifest?.hasFunctions ?? draft?.hasFunctions)
}

export function createInitialSkillTestState() {
  return {
    status: 'idle',
    markdown: '',
    summary: '',
    technical: '',
    bugs: false,
    improvements: false,
    events: [],
    error: '',
    startedAt: null,
    finishedAt: null,
  }
}

export function buildSkillTestFinalMarkdown({ summary = '', technical = '', markdown = '' } = {}) {
  const summaryText = String(summary || '').trim()
  const technicalText = String(technical || '').trim()

  if (!summaryText && !technicalText) {
    return String(markdown || '').trim()
  }

  const parts = []
  if (summaryText) {
    parts.push(`## Summary\n\n${summaryText}`)
  }
  if (technicalText) {
    parts.push(`## Technical Details\n\n${technicalText}`)
  }
  return parts.join('\n\n')
}

export function reduceSkillTestStreamEvent(state, event) {
  const current = state || createInitialSkillTestState()
  if (!event || !event.type) return current

  if (event.type === 'stream') {
    return {
      ...current,
      markdown: `${current.markdown || ''}${event.data === '' ? '\n' : String(event.data || '')}`,
    }
  }

  if (event.type === 'final') {
    const summary = String(event.summary || '').trim()
    const technical = String(event.technical || '').trim()
    const bugs = event.bugs === true
    const improvements = event.improvements === true
    return {
      ...current,
      summary,
      technical,
      bugs,
      improvements,
      markdown: buildSkillTestFinalMarkdown({
        summary,
        technical,
        markdown: current.markdown,
      }),
    }
  }

  if (event.type === 'tool_call') {
    return {
      ...current,
      events: [
        ...(current.events || []),
        {
          id: event.id || `tool-${Date.now()}-${current.events?.length || 0}`,
          type: 'tool_call',
          name: event.name || 'tool',
          params: event.params || {},
          output: event.output,
          timestamp: event.timestamp || Date.now(),
        },
      ],
    }
  }

  if (event.type === 'reasoning') {
    const nextEvent = {
      id: event.id || `reasoning-${Date.now()}-${current.events?.length || 0}`,
      reasoningId: event.reasoningId || null,
      type: 'reasoning',
      text: event.text || '',
      timestamp: event.timestamp || Date.now(),
    }
    const existingIndex = (current.events || []).findIndex(
      (item) =>
        item.type === 'reasoning' &&
        item.reasoningId &&
        nextEvent.reasoningId &&
        item.reasoningId === nextEvent.reasoningId,
    )
    if (existingIndex >= 0) {
      const events = [...current.events]
      events[existingIndex] = {
        ...events[existingIndex],
        ...nextEvent,
        text: nextEvent.text || events[existingIndex].text || '',
      }
      return { ...current, events }
    }
    return {
      ...current,
      events: [...(current.events || []), nextEvent],
    }
  }

  if (event.type === 'error') {
    return {
      ...current,
      status: 'error',
      error: String(event.error || event.data || 'Skill test failed.'),
      finishedAt: event.finishedAt || Date.now(),
    }
  }

  return current
}

export function skillTestEventsToAssistantParts(events = []) {
  return (Array.isArray(events) ? events : []).map((event, index) => {
    if (event?.type === 'reasoning') {
      return {
        type: 'reasoning',
        text: event.text || '',
      }
    }
    const name = String(event?.name || 'tool').replace(/[^A-Za-z0-9_-]/g, '_')
    return {
      type: `tool-${name}`,
      state: 'output-available',
      toolCallId: event?.id || `skill-test-tool-${index}`,
      input: event?.params || {},
      output: event?.output ?? event?.result ?? event?.response ?? '',
    }
  })
}

function redactMetadataValue(key, value) {
  if (String(key || '').startsWith('priv_')) return '[redacted]'
  return value
}

function formatJson(value) {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function buildSkillTestReportPrompt({
  skillName,
  metadata = {},
  events = [],
  markdown = '',
  status = 'completed',
  error = '',
  bugs = false,
  improvements = false,
  testInstructions = '',
  instructions = '',
} = {}) {
  const hasBugs = bugs === true
  const hasImprovements = improvements === true
  const normalizedStatus = String(status || '').toLowerCase()
  const hasCompletedResult = normalizedStatus === 'completed'
  const resultStatus = hasBugs
    ? 'bugs_found'
    : hasImprovements
      ? 'improvements_suggested'
      : hasCompletedResult
        ? 'passed'
        : normalizedStatus || 'unknown'
  const lines = [
    hasBugs
      ? `Review the test agent report for the published skill "${skillName || 'unknown'}" and fix the detected bugs or problems in the draft skill.`
      : hasImprovements
        ? `Review the test agent report for the published skill "${skillName || 'unknown'}" and make the suggested improvements without treating the skill as broken.`
        : hasCompletedResult
          ? `Review the test agent report for the published skill "${skillName || 'unknown'}". The test passed without detected bugs or improvements.`
          : `Review the test agent report for the published skill "${skillName || 'unknown'}" and investigate the failed or incomplete test run.`,
    '',
    `Test status: ${status || 'unknown'}`,
    `Test result: ${resultStatus}`,
    `Bugs detected: ${hasBugs ? 'yes' : 'no'}`,
    `Improvements suggested: ${hasImprovements ? 'yes' : 'no'}`,
  ]

  const metadataKeys = Object.keys(metadata || {})
  if (metadataKeys.length) {
    lines.push('', 'Metadata supplied to the test:')
    for (const key of metadataKeys) {
      lines.push(`- ${key}: ${redactMetadataValue(key, metadata[key])}`)
    }
  } else {
    lines.push('', 'Metadata supplied to the test: none')
  }

  if (Array.isArray(events) && events.length) {
    lines.push('', 'Test activity:')
    for (const event of events) {
      if (event?.type === 'reasoning') {
        const text = String(event.text || '').trim()
        if (text) lines.push(`- Thought: ${text}`)
      } else if (event?.type === 'tool_call') {
        lines.push(`- Tool call: ${event.name || 'tool'} ${formatJson(event.params || {})}`)
      }
    }
  }

  if (error) {
    lines.push('', 'Error:', String(error))
  }

  if (testInstructions && String(testInstructions).trim()) {
    lines.push('', 'User guidance for the test:', String(testInstructions).trim())
  }

  if (markdown) {
    lines.push('', 'Final test report:', String(markdown))
  }

  if (instructions && String(instructions).trim()) {
    lines.push('', 'User instructions for changes:', String(instructions).trim())
  }

  if (hasBugs) {
    lines.push(
      '',
      'Use the current draft files and validation tools to determine whether each detected problem is in the skill code, manifest, environment assumptions, or instructions. Make the needed fixes and validate them.',
    )
  } else if (hasImprovements) {
    lines.push(
      '',
      'Use the current draft files and validation tools to make worthwhile improvements from the report while preserving the working behavior. Validate any changes.',
    )
  } else if (hasCompletedResult) {
    lines.push(
      '',
      'Use the current draft files and validation tools only if the user instructions above request a change. Do not invent bugs or improvements from the report text.',
    )
  } else {
    lines.push(
      '',
      'Use the current draft files and validation tools to determine whether the failed or incomplete test run was caused by the skill code, manifest, environment assumptions, instructions, or the test setup. If a skill change is needed, make it and validate it.',
    )
  }

  return lines.join('\n')
}
