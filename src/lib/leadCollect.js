export const LEAD_COLLECT_MODES = ['before_response', 'before_escalation']
export const LEAD_FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'url',
  'number',
  'textarea',
  'select',
  'date',
  'datetime-local',
  'time',
  'month',
  'week',
  'color',
]
export const DEFAULT_LEAD_FIELD_KEYS = ['name', 'email']
export const LEAD_FIELD_TYPES_WITH_PLACEHOLDER = [
  'text',
  'email',
  'tel',
  'url',
  'textarea',
  'select',
]

const DEFAULT_LEAD_FIELDS = [
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
]

const isObject = (value) =>
  value && typeof value === 'object' && !Array.isArray(value)

const cleanString = (value) => (typeof value === 'string' ? value.trim() : '')
const INPUT_NAME_SANITIZE_PATTERN = /[^A-Za-z0-9_.:[\]-]+/g

export const sanitizeLeadCollectInputName = (value) => {
  if (typeof value !== 'string') return ''
  return value.replace(INPUT_NAME_SANITIZE_PATTERN, '').trim()
}

const toSafeKeyBase = (value) => {
  const cleaned = cleanString(value)
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()

  if (!cleaned) return 'field'

  const words = cleaned.split(/\s+/)
  return words
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('')
}

const toUniqueKey = (keyBase, fields = []) => {
  const usedKeys = new Set(
    (Array.isArray(fields) ? fields : [])
      .map((field) => sanitizeLeadCollectInputName(field?.key || ''))
      .filter(Boolean),
  )

  let nextKey = keyBase
  let suffix = 2
  while (usedKeys.has(nextKey)) {
    nextKey = `${keyBase}${suffix}`
    suffix += 1
  }
  return nextKey
}

const sanitizeOptionalString = (
  target,
  source,
  key,
  { trim = true } = {},
) => {
  if (!source || source[key] === undefined) return
  if (typeof source[key] !== 'string') return
  const rawValue = source[key]
  const trimmedValue = rawValue.trim()
  if (trimmedValue) {
    target[key] = trim ? trimmedValue : rawValue
  } else {
    delete target[key]
  }
}

const getDefaultAutocomplete = ({ type, key }) => {
  const normalizedType = cleanString(type)
  const normalizedKey = cleanString(key).toLowerCase()

  // Type-based autocomplete (highest priority)
  if (normalizedType === 'email') return 'email'
  if (normalizedType === 'tel') return 'tel'
  if (normalizedType === 'url') return 'url'

  // Key-based autocomplete for text and other types
  // Name fields
  if (normalizedKey === 'name' || normalizedKey === 'fullname' || normalizedKey === 'full-name') return 'name'
  if (normalizedKey === 'firstname' || normalizedKey === 'first-name' || normalizedKey === 'givenname' || normalizedKey === 'given-name') return 'given-name'
  if (normalizedKey === 'lastname' || normalizedKey === 'last-name' || normalizedKey === 'surname' || normalizedKey === 'familyname' || normalizedKey === 'family-name') return 'family-name'
  
  // Contact fields
  if (normalizedKey === 'phone' || normalizedKey === 'mobile' || normalizedKey === 'cell' || normalizedKey === 'cellphone' || normalizedKey === 'cell-phone') return 'tel'
  if (normalizedKey === 'company' || normalizedKey === 'organization' || normalizedKey === 'org' || normalizedKey === 'employer') return 'organization'
  if (normalizedKey === 'jobtitle' || normalizedKey === 'job-title' || normalizedKey === 'title' || normalizedKey === 'position') return 'job-title'
  
  // Address fields
  if (normalizedKey === 'address' || normalizedKey === 'street' || normalizedKey === 'address1' || normalizedKey === 'address-line1' || normalizedKey === 'address-line-1') return 'street-address'
  if (normalizedKey === 'address2' || normalizedKey === 'address-line2' || normalizedKey === 'address-line-2' || normalizedKey === 'apartment' || normalizedKey === 'apt' || normalizedKey === 'suite') return 'address-line2'
  if (normalizedKey === 'city') return 'address-level2'
  if (normalizedKey === 'state' || normalizedKey === 'province' || normalizedKey === 'region') return 'address-level1'
  if (normalizedKey === 'zip' || normalizedKey === 'zipcode' || normalizedKey === 'zip-code' || normalizedKey === 'postal' || normalizedKey === 'postalcode' || normalizedKey === 'postal-code') return 'postal-code'
  if (normalizedKey === 'country') return 'country'
  
  // Date fields
  if (normalizedKey === 'birthday' || normalizedKey === 'birth-date' || normalizedKey === 'date-of-birth' || normalizedKey === 'dob') return 'bday'
  
  // Other common fields
  if (normalizedKey === 'website' || normalizedKey === 'homepage' || normalizedKey === 'url') return 'url'

  return ''
}

const getDefaultInputMode = ({ type }) => {
  const normalizedType = cleanString(type)

  if (normalizedType === 'email') return 'email'
  if (normalizedType === 'tel') return 'tel'
  if (normalizedType === 'url') return 'url'
  if (normalizedType === 'number') return 'numeric'

  return ''
}

export const supportsLeadFieldPlaceholder = (type) =>
  LEAD_FIELD_TYPES_WITH_PLACEHOLDER.includes(cleanString(type))

const normalizeLeadFieldType = (type) => {
  const normalizedType = cleanString(type)
  if (normalizedType === 'datetime') {
    return 'datetime-local'
  }
  return LEAD_FIELD_TYPES.includes(normalizedType) ? normalizedType : 'text'
}

const sanitizeConstraintValue = (target, source, key) => {
  if (!source || source[key] === undefined) return

  const rawValue = source[key]
  if (typeof rawValue === 'number') {
    if (Number.isFinite(rawValue)) {
      target[key] = rawValue
    }
    return
  }

  if (typeof rawValue === 'string') {
    const value = rawValue.trim()
    if (value) {
      target[key] = value
    } else {
      delete target[key]
    }
  }
}

const sanitizeIntegerConstraint = (
  target,
  source,
  key,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {},
) => {
  if (!source || source[key] === undefined) return

  const rawValue = source[key]
  const parsed =
    typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10)

  if (!Number.isFinite(parsed)) {
    delete target[key]
    return
  }

  const value = Math.max(min, Math.min(max, Math.floor(parsed)))
  target[key] = value
}

const sanitizeSelectOptions = (options) => {
  if (!Array.isArray(options)) {
    return []
  }

  return options
    .map((option) => {
      if (typeof option === 'string') {
        const value = sanitizeLeadCollectInputName(option)
        return value ? value : null
      }

      if (!isObject(option)) {
        return null
      }

      const value = sanitizeLeadCollectInputName(option.value)
      if (!value) {
        return null
      }

      const normalized = {
        ...option,
        value,
      }

      if (typeof option.label === 'string') {
        if (option.label.length > 0) {
          normalized.label = option.label
        } else {
          delete normalized.label
        }
      }

      return normalized
    })
    .filter(Boolean)
}

export const createDefaultLeadCollectOptions = () => ({
  enabled: true,
  mode: 'before_response',
  fields: DEFAULT_LEAD_FIELDS.map((field) => ({ ...field })),
})

export const isLeadCollectEnabled = (leadCollect) =>
  isObject(leadCollect) &&
  leadCollect.enabled !== false &&
  Array.isArray(leadCollect.fields) &&
  leadCollect.fields.length > 0

export const isDefaultLeadFieldKey = (key) =>
  DEFAULT_LEAD_FIELD_KEYS.includes(cleanString(key))

export const getLeadCollectExtraFields = (leadCollect) => {
  if (!isObject(leadCollect) || !Array.isArray(leadCollect.fields)) {
    return []
  }

  return leadCollect.fields.filter(
    (field) => !isDefaultLeadFieldKey(field?.key),
  )
}

export const limitLeadCollectToDefaultFields = (leadCollect) => {
  if (!isObject(leadCollect) || !Array.isArray(leadCollect.fields)) {
    return leadCollect
  }

  return {
    ...leadCollect,
    fields: leadCollect.fields.filter((field) => isDefaultLeadFieldKey(field?.key)),
  }
}

export const createLeadFieldByType = (type = 'text', fields = []) => {
  const normalizedType = normalizeLeadFieldType(type)
  const keyBase = normalizedType === 'datetime-local' ? 'datetime' : toSafeKeyBase(normalizedType)
  const key = toUniqueKey(keyBase, fields)

  const field = {
    key,
    label:
      normalizedType === 'textarea'
        ? 'Notes'
        : normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1),
    type: normalizedType,
    required: false,
  }

  if (normalizedType === 'email') {
    field.autocomplete = 'email'
  }

  if (normalizedType === 'tel') {
    field.label = 'Phone'
  }

  if (normalizedType === 'url') {
    field.label = 'Website'
    field.placeholder = 'https://example.com'
  }

  if (normalizedType === 'datetime-local') {
    field.label = 'Date & Time'
  }

  if (normalizedType === 'number') {
    field.step = 1
  }

  if (normalizedType === 'select') {
    field.placeholder = 'Select an option'
    field.options = [{ value: 'option-1', label: 'Option 1' }]
  }

  const defaultAutocomplete = getDefaultAutocomplete({
    type: normalizedType,
    key,
  })
  if (defaultAutocomplete) {
    field.autocomplete = defaultAutocomplete
  } else {
    delete field.autocomplete
  }

  const defaultInputMode = getDefaultInputMode({
    type: normalizedType,
  })
  if (defaultInputMode) {
    field.inputMode = defaultInputMode
  } else {
    delete field.inputMode
  }

  return field
}

export const sanitizeLeadCollectOptions = (leadCollect) => {
  if (!leadCollect) {
    return false
  }

  if (!isObject(leadCollect)) {
    throw new Error('Lead collection config must be an object.')
  }

  const mode = cleanString(leadCollect.mode)
  const enabled =
    leadCollect.enabled === undefined ? true : Boolean(leadCollect.enabled)
  if (!LEAD_COLLECT_MODES.includes(mode)) {
    throw new Error(
      `Lead collection mode must be one of: ${LEAD_COLLECT_MODES.join(', ')}.`,
    )
  }

  if (!Array.isArray(leadCollect.fields) || leadCollect.fields.length === 0) {
    throw new Error('Lead collection fields must be a non-empty array.')
  }

  const usedKeys = new Set()
  const fields = leadCollect.fields.map((field, index) => {
    if (!isObject(field)) {
      throw new Error(`Lead field at index ${index} must be an object.`)
    }

    const sanitizedField = { ...field }
    delete sanitizedField.value

    const key = sanitizeLeadCollectInputName(field.key)
    if (!key) {
      throw new Error(`Lead field at index ${index} is missing a valid key.`)
    }

    if (usedKeys.has(key)) {
      throw new Error(`Lead field key "${key}" is duplicated.`)
    }

    usedKeys.add(key)

    const type = normalizeLeadFieldType(field.type)
    sanitizedField.key = key
    sanitizedField.type = type
    sanitizedField.required =
      field.required === undefined
        ? isDefaultLeadFieldKey(key)
        : Boolean(field.required)

    sanitizeOptionalString(sanitizedField, field, 'label', { trim: false })
    sanitizeOptionalString(sanitizedField, field, 'placeholder', {
      trim: false,
    })
    sanitizeOptionalString(sanitizedField, field, 'help', { trim: false })
    sanitizeOptionalString(sanitizedField, field, 'pattern')

    const defaultAutocomplete = getDefaultAutocomplete({
      type,
      key,
    })
    if (defaultAutocomplete) {
      sanitizedField.autocomplete = defaultAutocomplete
    } else {
      delete sanitizedField.autocomplete
    }

    const defaultInputMode = getDefaultInputMode({
      type,
    })
    if (defaultInputMode) {
      sanitizedField.inputMode = defaultInputMode
    } else {
      delete sanitizedField.inputMode
    }

    delete sanitizedField.rows
    if (!supportsLeadFieldPlaceholder(type)) {
      delete sanitizedField.placeholder
    }

    if (type === 'select') {
      const options = sanitizeSelectOptions(field.options)
      if (options.length === 0) {
        throw new Error(`Lead field "${key}" requires at least one option.`)
      }
      sanitizedField.options = options
    } else {
      delete sanitizedField.options
    }

    const supportsRangeConstraints = [
      'number',
      'date',
      'time',
      'datetime-local',
      'month',
      'week',
    ].includes(type)
    if (supportsRangeConstraints) {
      sanitizeConstraintValue(sanitizedField, field, 'min')
      sanitizeConstraintValue(sanitizedField, field, 'max')
      sanitizeConstraintValue(sanitizedField, field, 'step')
    } else {
      delete sanitizedField.min
      delete sanitizedField.max
      delete sanitizedField.step
    }

    const supportsLengthConstraints = [
      'text',
      'email',
      'tel',
      'url',
      'textarea',
    ].includes(type)
    if (supportsLengthConstraints) {
      sanitizeIntegerConstraint(sanitizedField, field, 'minLength', {
        min: 0,
        max: 100000,
      })
      sanitizeIntegerConstraint(sanitizedField, field, 'maxLength', {
        min: 1,
        max: 100000,
      })
    } else {
      delete sanitizedField.minLength
      delete sanitizedField.maxLength
    }

    const supportsPattern = ['text', 'email', 'tel', 'url'].includes(type)
    if (!supportsPattern) {
      delete sanitizedField.pattern
    }

    return sanitizedField
  })

  return {
    ...leadCollect,
    enabled,
    mode,
    fields,
  }
}
