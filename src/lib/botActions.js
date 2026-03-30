const assertPlainObject = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object.`)
  }
}

export const DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS =
  'Use this when the user asks to schedule a meeting, call, office hours, or demo.'

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
      throw new Error(`${label} must be a valid booking URL starting with ${examplePrefix}.`)
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error(`${label} must be a valid booking URL starting with ${examplePrefix}.`)
    }

    const hostname = parsedUrl.hostname.toLowerCase()
    if (!allowedHosts.includes(hostname)) {
      throw new Error(`${label} must start with ${examplePrefix}.`)
    }

    const normalizedPath = parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
    if (!normalizedPath) {
      throw new Error(`${label} must include a booking path after ${examplePrefix}.`)
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
  const label = `bot.actions.${actionKey}`

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

export const buildDisplayBotActions = (actions) => {
  if (!actions || typeof actions !== 'object' || Array.isArray(actions)) {
    return {}
  }

  const nextActions = {}

  for (const [actionName, actionConfig] of Object.entries(actions)) {
    if (!actionConfig || typeof actionConfig !== 'object' || Array.isArray(actionConfig)) {
      continue
    }

    const nextActionConfig = { ...actionConfig }
    const bookingAction = BOOKING_ACTIONS[actionName]

    if (bookingAction) {
      const instructionsSource =
        typeof actionConfig.instructions === 'string'
          ? actionConfig.instructions
          : actionConfig.prompt
      const instructions =
        typeof instructionsSource === 'string' ? instructionsSource.trim() : ''

      nextActionConfig.instructions =
        instructions || DEFAULT_BOOKING_TRIGGER_INSTRUCTIONS
      delete nextActionConfig.prompt
      nextActionConfig.enabled =
        actionConfig.enabled === undefined ? true : Boolean(actionConfig.enabled)
      nextActionConfig[bookingAction.urlKey] = buildBookingDisplayUrl(
        actionName,
        actionConfig[bookingAction.urlKey],
      )
    }

    nextActions[actionName] = nextActionConfig
  }

  return nextActions
}

export const createDefaultBookingAction = (actionKey) => {
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

export const sanitizeCalendlyActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.calendly)
}

export const sanitizeCalComActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.calcom)
}

export const sanitizeTidyCalActionConfig = (config) => {
  return sanitizeSchedulingActionConfig(config, BOOKING_ACTIONS.tidycal)
}

export const sanitizeBotActions = (actions) => {
  assertPlainObject(actions, 'actions')

  const sanitizedActions = {}

  for (const [actionName, actionConfig] of Object.entries(actions)) {
    if (actionName === 'calendly') {
      sanitizedActions.calendly = sanitizeCalendlyActionConfig(actionConfig)
      continue
    }

    if (actionName === 'calcom') {
      sanitizedActions.calcom = sanitizeCalComActionConfig(actionConfig)
      continue
    }

    if (actionName === 'tidycal') {
      sanitizedActions.tidycal = sanitizeTidyCalActionConfig(actionConfig)
      continue
    }

    assertPlainObject(actionConfig, `actions.${actionName}`)
    sanitizedActions[actionName] = { ...actionConfig }
  }

  return sanitizedActions
}
