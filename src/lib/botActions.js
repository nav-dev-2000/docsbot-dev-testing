import {
  DEFAULT_CUSTOM_BUTTON_ICON,
  normalizeWhitelistedHeroIcon,
} from '@/constants/heroIcons.constants'

const assertPlainObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
}

export const CUSTOM_BUTTON_FUNCTION_KEY_PATTERN =
  /^[a-z0-9]+(?:_[a-z0-9]+)*$/

/**
 * Custom button tools live only under **`bot.tools.customButtons`** (camelCase key).
 * Value must be an **array** of objects. Omit the field or use `[]` when there are none.
 *
 * Persisted shape after `sanitizeCustomButtonsActionConfig` (each element):
 * - `enabled` — boolean (optional, default true)
 * - `name` — non-empty string when enabled
 * - `functionKey` — `^[a-z0-9]+(?:_[a-z0-9]+)*$`, not in reserved built-in suffixes
 * - `instructions` — non-empty when enabled
 * - `buttonText` — non-empty when enabled
 * - `icon` — whitelisted Heroicon name; invalid values become `LinkIcon`
 * - `url` — normalized absolute URL (or mailto/tel/app) when enabled
 *
 * The Chat Agent exposes each enabled entry as an internal tool named `button_<functionKey>`.
 */
export const CUSTOM_BUTTONS_ACTION_KEY = 'customButtons'
export const CUSTOM_BUTTON_TOOL_PREFIX = 'button_'

/**
 * `tools.customButtons` must be an array. Older bugs merged state with `{ ...tools }` while
 * `customButtons` was an array, which produced a dense numeric-key object `{ 0: {...}, 1: {...} }`
 * (arrays spread into objects). Restore a real array so UI + save validation can run.
 *
 * - `undefined` / `null` → `[]` (no custom buttons in form state)
 * - Array → returned as-is
 * - Plain object with only `"0"`, `"1"`, … keys → values in index order
 * - Anything else → `null` (caller shows validation error or skips)
 */
export const coerceCustomButtonsToArray = (value) => {
  if (value === undefined || value === null) {
    return []
  }
  if (Array.isArray(value)) {
    return value
  }
  if (typeof value !== 'object') {
    return null
  }

  const keys = Object.keys(value)
  if (keys.length === 0) {
    return []
  }

  const numericKeys = keys.filter((k) => /^\d+$/.test(k))
  if (numericKeys.length !== keys.length) {
    return null
  }

  numericKeys.sort((a, b) => Number(a) - Number(b))
  for (let i = 0; i < numericKeys.length; i += 1) {
    if (numericKeys[i] !== String(i)) {
      return null
    }
  }

  return numericKeys.map((k) => value[k])
}
export const RESERVED_CUSTOM_BUTTON_TOOL_SUFFIXES = new Set([
  'search_documentation',
  'human_escalation',
  'calendly',
  'calcom',
  'tidycal',
  'search_web',
  'web_search',
  'code_interpreter',
  'stripe_recent_invoices_and_subscriptions',
  'stripe_billing_portal',
  'stripe_refund_latest_payment',
  'stripe_cancel_subscription',
])

export const DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS =
  'Use this when the user asks to schedule a meeting, call, office hours, or demo.'

export const DEFAULT_CUSTOM_BUTTON_TRIGGER_INSTRUCTIONS =
  'Use this when the user asks about this topic and should be given this button.'

export const BOOKING_ACTIONS = {
  calendly: {
    actionKey: 'calendly',
    label: 'Calendly',
    urlKey: 'url',
    embedOptionKeys: ['hideEventDetails', 'hideCookieBanner'],
    allowedHosts: ['calendly.com', 'www.calendly.com'],
    examplePrefix: 'https://calendly.com/',
    defaultInstructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
    examplePath: 'docsbot/demo',
  },
  calcom: {
    actionKey: 'calcom',
    label: 'Cal.com',
    urlKey: 'url',
    embedOptionKeys: ['hideEventDetails'],
    allowedHosts: ['cal.com', 'www.cal.com'],
    examplePrefix: 'https://cal.com/',
    defaultInstructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
    examplePath: 'docsbot/office-hours',
  },
  tidycal: {
    actionKey: 'tidycal',
    label: 'TidyCal',
    urlKey: 'url',
    embedOptionKeys: ['hideEventDetails'],
    allowedHosts: ['tidycal.com', 'www.tidycal.com'],
    examplePrefix: 'https://tidycal.com/',
    defaultInstructions: DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS,
    examplePath: 'docsbot/office-hours',
  },
}

export const BOOKING_ACTION_KEYS = Object.keys(BOOKING_ACTIONS)

const cleanActionString = (value) =>
  typeof value === 'string' ? value.trim() : ''

export const buildCustomButtonFunctionKey = (value) => {
  const asciiValue = cleanActionString(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()

  const normalizedValue = asciiValue
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')

  return normalizedValue.replace(/^button(?:_|$)/, '').replace(/^_+|_+$/g, '')
}

const normalizeCustomButtonFunctionKeyInput = (value) => {
  const normalizedValue = cleanActionString(value).toLowerCase()

  return normalizedValue.replace(/^button(?:_|$)/, '')
}

/** Manual Key field: spaces/dashes become `_`; allow a-z, 0-9, `_`; preserves trailing `_` while typing. */
export const sanitizeCustomButtonFunctionKeyLiveInput = (value) => {
  // Do not trim: spaces at the cursor must become underscores (cleanActionString would drop them).
  const raw = (typeof value === 'string' ? value : '').toLowerCase()
  const ascii = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '')
  const withSeparators = ascii
    .replace(/[\s\-–—]+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')

  return normalizeCustomButtonFunctionKeyInput(withSeparators)
}

const stripCustomButtonFunctionKeyEdgeUnderscores = (value) =>
  typeof value === 'string' ? value.replace(/^_+|_+$/g, '') : ''

/** After blur or when persisting: trim leading/trailing underscores (live input keeps them while typing). */
export const finalizeCustomButtonFunctionKeyInput = (value) =>
  stripCustomButtonFunctionKeyEdgeUnderscores(
    sanitizeCustomButtonFunctionKeyLiveInput(value),
  )

const deriveCustomButtonFunctionKeyFromConfig = (config, name) => {
  const fallbackFunctionKey = buildCustomButtonFunctionKey(name)
  const rawFunctionKey = stripCustomButtonFunctionKeyEdgeUnderscores(
    normalizeCustomButtonFunctionKeyInput(config.functionKey) ||
      fallbackFunctionKey,
  )

  return cleanActionString(rawFunctionKey)
}

/** Same idea as support / escalation links: any parsable navigable scheme, block XSS vectors. */
const BLOCKED_CUSTOM_BUTTON_LINK_PROTOCOLS = new Set([
  'javascript:',
  'data:',
  'vbscript:',
])

const normalizeCustomButtonUrl = (value) => {
  const rawValue = cleanActionString(value)

  if (!rawValue) {
    throw new Error(
      'Enter a link for the button (web, mailto, tel, or app link).',
    )
  }

  let parsedUrl
  try {
    parsedUrl = new URL(rawValue)
  } catch (error) {
    throw new Error(
      'Enter a valid link (for example https://…, mailto:…, or myapp://…).',
    )
  }

  const protocol = parsedUrl.protocol.toLowerCase()
  if (BLOCKED_CUSTOM_BUTTON_LINK_PROTOCOLS.has(protocol)) {
    throw new Error(
      'This link type is not allowed for security reasons.',
    )
  }

  return parsedUrl.href
}

const sanitizeCustomButtonConfig = (config) => {
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new Error('Configuration must be a valid object.')
  }

  const enabled =
    config.enabled === undefined ? true : Boolean(config.enabled)
  const name = cleanActionString(config.name)
  const instructions = cleanActionString(config.instructions)
  const buttonText = cleanActionString(config.buttonText)
  const icon = normalizeWhitelistedHeroIcon(config.icon)
  const functionKey = deriveCustomButtonFunctionKeyFromConfig(config, name)

  if (functionKey && !CUSTOM_BUTTON_FUNCTION_KEY_PATTERN.test(functionKey)) {
    throw new Error(
      'Key must use only lowercase letters, numbers, and underscores.',
    )
  }

  if (
    functionKey &&
    RESERVED_CUSTOM_BUTTON_TOOL_SUFFIXES.has(functionKey)
  ) {
    throw new Error(
      'This key is reserved for a built-in tool. Choose another.',
    )
  }

  const sanitizedConfig = {
    enabled,
    name,
    functionKey,
    instructions,
    buttonText,
    icon,
    url: '',
  }

  const rawUrlValue = cleanActionString(config.url)
  if (enabled) {
    if (!name) {
      throw new Error('Enter a name for this button.')
    }
    if (!functionKey) {
      throw new Error(
        'Enter a key using lowercase letters, numbers, and underscores.',
      )
    }
    if (!instructions) {
      throw new Error('Describe when this button should appear.')
    }
    if (!buttonText) {
      throw new Error('Enter the text shown on the button.')
    }

    sanitizedConfig.url = normalizeCustomButtonUrl(rawUrlValue)
  } else if (rawUrlValue) {
    sanitizedConfig.url = normalizeCustomButtonUrl(rawUrlValue)
  }

  return sanitizedConfig
}

/**
 * Client-side validation for enabled custom buttons (save blocked + inline errors).
 * Returns per-row field messages; includes duplicate key conflicts across rows.
 */
export const getCustomButtonsFormValidationErrors = (customButtons) => {
  const byIndex = {}

  const coerced = coerceCustomButtonsToArray(customButtons)
  if (coerced === null) {
    return {
      byIndex: {},
      listError: 'Custom buttons must be provided as a list.',
    }
  }

  const derivedKeys = new Array(coerced.length).fill(null)

  for (let index = 0; index < coerced.length; index += 1) {
    const config = coerced[index]

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      byIndex[index] = {
        _row: 'Configuration must be a valid object.',
      }
      continue
    }

    const enabled =
      config.enabled === undefined ? true : Boolean(config.enabled)
    if (!enabled) {
      continue
    }

    const name = cleanActionString(config.name)
    const instructions = cleanActionString(config.instructions)
    const buttonText = cleanActionString(config.buttonText)
    const functionKey = deriveCustomButtonFunctionKeyFromConfig(config, name)

    const fieldErrors = {}
    let fkForDup = null

    if (!name) {
      fieldErrors.name = 'Enter a name for this button.'
    }
    if (!functionKey) {
      fieldErrors.functionKey =
        'Enter a key using lowercase letters, numbers, and underscores.'
    } else if (!CUSTOM_BUTTON_FUNCTION_KEY_PATTERN.test(functionKey)) {
      fieldErrors.functionKey =
        'Key must use only lowercase letters, numbers, and underscores.'
    } else if (RESERVED_CUSTOM_BUTTON_TOOL_SUFFIXES.has(functionKey)) {
      fieldErrors.functionKey =
        'This key is reserved for a built-in tool. Choose another.'
    } else {
      fkForDup = functionKey
    }

    if (!instructions) {
      fieldErrors.instructions = 'Describe when this button should appear.'
    }
    if (!buttonText) {
      fieldErrors.buttonText = 'Enter the text shown on the button.'
    }

    const rawUrlValue = cleanActionString(config.url)
    try {
      normalizeCustomButtonUrl(rawUrlValue)
    } catch (e) {
      fieldErrors.url = e.message
    }

    if (Object.keys(fieldErrors).length > 0) {
      byIndex[index] = fieldErrors
    }

    derivedKeys[index] = fkForDup
  }

  const keyToIndices = new Map()
  derivedKeys.forEach((fk, idx) => {
    if (!fk) {
      return
    }
    if (!keyToIndices.has(fk)) {
      keyToIndices.set(fk, [])
    }
    keyToIndices.get(fk).push(idx)
  })

  for (const indices of keyToIndices.values()) {
    if (indices.length < 2) {
      continue
    }
    const fk = derivedKeys[indices[0]]
    const msg = `Two custom buttons cannot use the same key ("${fk}"). Give each button a unique key.`
    for (const idx of indices) {
      byIndex[idx] = { ...(byIndex[idx] || {}), functionKey: msg }
    }
  }

  return { byIndex }
}

export const hasCustomButtonsFormValidationErrors = (result) => {
  if (result?.listError) {
    return true
  }
  const rows = result?.byIndex || {}
  return Object.values(rows).some(
    (fields) => fields && Object.keys(fields).length > 0,
  )
}

export const sanitizeCustomButtonsActionConfig = (config) => {
  const coerced = coerceCustomButtonsToArray(config)
  if (coerced === null) {
    throw new Error('Custom buttons must be provided as a list.')
  }

  const sanitizedButtons = coerced.map((buttonConfig) =>
    sanitizeCustomButtonConfig(buttonConfig),
  )
  const seenFunctionKeys = new Set()

  for (const buttonConfig of sanitizedButtons) {
    if (!buttonConfig.functionKey) {
      continue
    }

    if (seenFunctionKeys.has(buttonConfig.functionKey)) {
      throw new Error(
        `Two custom buttons cannot use the same key ("${buttonConfig.functionKey}"). Give each button a unique key.`,
      )
    }

    seenFunctionKeys.add(buttonConfig.functionKey)
  }

  return sanitizedButtons
}

export const normalizeBookingPathInput = (
  value,
  label,
  {
    allowedHosts,
    examplePrefix,
  },
) => {
  const rawValue = typeof value === 'string' ? value.trim() : ''

  if (!rawValue) {
    throw new Error(`${label} is required.`)
  }

  const lowerValue = rawValue.toLowerCase().replace(/^\/+/, '')
  if (
    allowedHosts.some((host) =>
      lowerValue === host || lowerValue.startsWith(`${host}/`),
    )
  ) {
    throw new Error(`${label} must start with ${examplePrefix}.`)
  }

  if (/^https?:\/\//i.test(rawValue)) {
    let parsedUrl
    try {
      parsedUrl = new URL(rawValue)
    } catch (error) {
      throw new Error(
        `${label} must be a valid booking URL starting with ${examplePrefix}.`,
      )
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(
        `${label} must be a valid booking URL starting with ${examplePrefix}.`,
      )
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    if (!allowedHosts.includes(hostname)) {
      throw new Error(`${label} must start with ${examplePrefix}.`)
    }

    const normalizedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
    if (!normalizedPath) {
      throw new Error(
        `${label} must include a booking path after ${examplePrefix}.`,
      )
    }

    return normalizedPath
  }

  const normalizedPath = rawValue.replace(/^\/+|\/+$/g, '')
  if (!normalizedPath) {
    throw new Error(`${label} is required.`)
  }

  return normalizedPath
}

const sanitizeSchedulingActionConfig = (
  config,
  actionConfig,
) => {
  const {
    actionKey,
    urlKey,
    embedOptionKeys = [],
    allowedHosts,
    examplePrefix,
  } = actionConfig
  const label = `bot.tools.${actionKey}`

  assertPlainObject(config, label)

  const enabled =
    config.enabled === undefined ? true : Boolean(config.enabled)

  const instructionsSource =
    typeof config.instructions === 'string' ? config.instructions : config.prompt
  const instructions =
    typeof instructionsSource === 'string' ? instructionsSource.trim() : ''

  if (enabled && !instructions) {
    throw new Error(`${label}.instructions is required.`)
  }

  const sanitizedConfig = {
    ...config,
    enabled,
    instructions: instructions || actionConfig.defaultInstructions,
  }

  delete sanitizedConfig.prompt

  const rawUrlValue = typeof config[urlKey] === 'string' ? config[urlKey].trim() : ''
  if (enabled || rawUrlValue) {
    sanitizedConfig[urlKey] = normalizeBookingPathInput(
      config[urlKey],
      `${label}.${urlKey}`,
      {
        allowedHosts,
        examplePrefix,
      },
    )
  } else {
    sanitizedConfig[urlKey] = ''
  }

  for (const optionKey of embedOptionKeys) {
    if (config[optionKey] !== undefined) {
      sanitizedConfig[optionKey] = Boolean(config[optionKey])
    }
  }

  return sanitizedConfig
}

export const buildBookingDisplayUrl = (actionKey, value) => {
  const actionConfig = BOOKING_ACTIONS[actionKey]
  const rawValue = typeof value === 'string' ? value.trim() : ''

  if (!actionConfig || !rawValue) {
    return ''
  }

  if (/^https?:\/\//i.test(rawValue)) {
    return rawValue
  }

  const normalizedValue = rawValue.replace(/^\/+/, '')
  const lowerValue = normalizedValue.toLowerCase()
  if (
    actionConfig.allowedHosts.some(
      (host) => lowerValue === host || lowerValue.startsWith(`${host}/`),
    )
  ) {
    return `https://${normalizedValue}`
  }

  return `${actionConfig.examplePrefix}${normalizedValue}`
}

export const buildDisplayBotTools = (tools) => {
  if (!tools || typeof tools !== 'object' || Array.isArray(tools)) {
    return {}
  }

  const nextTools = {}

  for (const [toolName, toolConfig] of Object.entries(tools)) {
    if (toolName === CUSTOM_BUTTONS_ACTION_KEY) {
      const coerced = coerceCustomButtonsToArray(toolConfig)
      if (coerced === null) {
        continue
      }

      nextTools[toolName] = coerced
        .filter((buttonConfig) => buttonConfig && typeof buttonConfig === 'object')
        .map((buttonConfig) => {
          const name = cleanActionString(buttonConfig.name)
          const functionKey =
            deriveCustomButtonFunctionKeyFromConfig(buttonConfig, name)

          return {
            enabled:
              buttonConfig.enabled === undefined
                ? true
                : Boolean(buttonConfig.enabled),
            name,
            functionKey,
            instructions: cleanActionString(buttonConfig.instructions),
            buttonText: cleanActionString(buttonConfig.buttonText),
            icon: normalizeWhitelistedHeroIcon(buttonConfig.icon),
            url: cleanActionString(buttonConfig.url),
            __manualFunctionKey:
              functionKey !== buildCustomButtonFunctionKey(name),
          }
        })
      continue
    }

    if (!toolConfig || typeof toolConfig !== 'object' || Array.isArray(toolConfig)) {
      nextTools[toolName] = toolConfig
      continue
    }

    const nextToolConfig = { ...toolConfig }
    const bookingAction = BOOKING_ACTIONS[toolName]

    if (bookingAction) {
      const instructionsSource =
        typeof toolConfig.instructions === 'string'
          ? toolConfig.instructions
          : toolConfig.prompt
      const instructions =
        typeof instructionsSource === 'string' ? instructionsSource.trim() : ''

      nextToolConfig.instructions =
        instructions || DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS
      delete nextToolConfig.prompt
      nextToolConfig.enabled =
        toolConfig.enabled === undefined ? true : Boolean(toolConfig.enabled)
      nextToolConfig[bookingAction.urlKey] = buildBookingDisplayUrl(
        toolName,
        toolConfig[bookingAction.urlKey],
      )
    }

    nextTools[toolName] = nextToolConfig
  }

  return nextTools
}

export const createDefaultBookingTool = (actionKey) => {
  const actionConfig = BOOKING_ACTIONS[actionKey]
  if (!actionConfig) {
    return {}
  }

  return {
    enabled: false,
    instructions: actionConfig.defaultInstructions,
    [actionConfig.urlKey]: '',
  }
}

export const createDefaultCustomButtonAction = () => ({
  enabled: false,
  name: '',
  functionKey: '',
  instructions: '',
  buttonText: '',
  icon: DEFAULT_CUSTOM_BUTTON_ICON,
  url: '',
  __manualFunctionKey: false,
})

export const getEnabledCustomButtons = (customButtons) => {
  if (!Array.isArray(customButtons)) {
    return []
  }

  const enabledButtons = []
  const seenFunctionKeys = new Set()

  for (const [index, buttonConfig] of customButtons.entries()) {
    try {
      const sanitizedButton = sanitizeCustomButtonConfig(buttonConfig)
      if (!sanitizedButton.enabled || !sanitizedButton.functionKey) {
        continue
      }
      if (seenFunctionKeys.has(sanitizedButton.functionKey)) {
        continue
      }

      seenFunctionKeys.add(sanitizedButton.functionKey)
      enabledButtons.push({
        functionKey: sanitizedButton.functionKey,
        name: sanitizedButton.name,
        buttonText: sanitizedButton.buttonText,
        icon: sanitizedButton.icon,
        url: sanitizedButton.url,
      })
    } catch (error) {
      continue
    }
  }

  return enabledButtons
}

export const sanitizeCalendlyActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.calendly)
}

export const sanitizeCalComActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.calcom)
}

export const sanitizeTidyCalActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.tidycal)
}

export const sanitizeBotTools = (tools) => {
  assertPlainObject(tools, 'tools')

  const sanitizedTools = {}

  for (const [toolName, toolConfig] of Object.entries(tools)) {
    if (toolName === CUSTOM_BUTTONS_ACTION_KEY) {
      sanitizedTools.customButtons =
        sanitizeCustomButtonsActionConfig(toolConfig)
      continue
    }

    if (toolName === 'calendly') {
      sanitizedTools.calendly = sanitizeCalendlyActionConfig(toolConfig)
      continue
    }

    if (toolName === 'calcom') {
      sanitizedTools.calcom = sanitizeCalComActionConfig(toolConfig)
      continue
    }

    if (toolName === 'tidycal') {
      sanitizedTools.tidycal = sanitizeTidyCalActionConfig(toolConfig)
      continue
    }

    if (typeof toolConfig === 'boolean') {
      sanitizedTools[toolName] = toolConfig
      continue
    }

    assertPlainObject(toolConfig, `tools.${toolName}`)
    sanitizedTools[toolName] = { ...toolConfig }
  }

  return sanitizedTools
}
