import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/react'
import { PlusIcon } from '@heroicons/react/20/solid'
import {
  Bars3Icon,
  Bars3BottomLeftIcon,
  CalendarDaysIcon,
  ClockIcon,
  DocumentTextIcon,
  EnvelopeIcon,
  HashtagIcon,
  LinkIcon,
  ListBulletIcon,
  PhoneIcon,
  QuestionMarkCircleIcon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import FieldToggle from '@/components/FieldToggle'
import Tooltip from '@/components/Tooltip'
import { checkPlanPermission } from '@/utils/helpers'
import {
  LEAD_COLLECT_MODES,
  LEAD_FIELD_TYPES,
  DEFAULT_LEAD_FIELD_KEYS,
  createDefaultLeadCollectOptions,
  createLeadFieldByType,
  getLeadCollectExtraFields,
  isLeadCollectEnabled,
  sanitizeLeadCollectInputName,
  supportsLeadFieldPlaceholder,
  sanitizeLeadCollectOptions,
} from '@/lib/leadCollect'
import { AppearanceBlock } from '@new-dashboard/PageAppearance/Appearance.Options'
import { AppearanceAccordion, AppearanceInput, AppearanceSelect, AppearanceToggle } from '@new-dashboard/PageAppearance/Appearance.Options'

const FIELD_TYPE_LABELS = {
  text: 'Text',
  email: 'Email',
  tel: 'Phone',
  url: 'URL',
  number: 'Number',
  textarea: 'Textarea',
  select: 'Select',
  date: 'Date',
  'datetime-local': 'Date & Time',
  month: 'Month',
  time: 'Time',
  week: 'Week',
  color: 'Color',
}

const FIELD_TYPE_ICONS = {
  text: DocumentTextIcon,
  email: EnvelopeIcon,
  tel: PhoneIcon,
  url: LinkIcon,
  number: HashtagIcon,
  textarea: Bars3BottomLeftIcon,
  select: ListBulletIcon,
  date: CalendarDaysIcon,
  'datetime-local': CalendarDaysIcon,
  month: CalendarDaysIcon,
  time: ClockIcon,
  week: CalendarDaysIcon,
  color: SwatchIcon,
}

const MODE_LABELS = {
  before_response: 'Before Response',
  before_escalation: 'Before Escalation',
}

const getFieldTypeMeta = (type) => {
  const value = LEAD_FIELD_TYPES.includes(type) ? type : 'text'
  return {
    value,
    label: FIELD_TYPE_LABELS[value] || value,
    Icon: FIELD_TYPE_ICONS[value] || DocumentTextIcon,
  }
}

const normalizeOptionsForEditor = (field) => {
  const options = Array.isArray(field?.options) ? field.options : []
  const normalized = options
    .map((option) => {
      if (typeof option === 'string') {
        const value = sanitizeLeadCollectInputName(option)
        if (!value) return null
        return { value, label: '' }
      }

      if (!option || typeof option !== 'object') {
        return null
      }

      const value = sanitizeLeadCollectInputName(option?.value || '')
      if (!value) return null

      return {
        value,
        label: typeof option.label === 'string' ? option.label : '',
      }
    })
    .filter(Boolean)

  return normalized.length > 0 ? normalized : [{ value: '', label: '' }]
}

const getNextOptionValue = (options) => {
  const usedValues = new Set(
    (Array.isArray(options) ? options : [])
      .map((option) => sanitizeLeadCollectInputName(option?.value || ''))
      .filter(Boolean),
  )

  let index = usedValues.size + 1
  let candidate = `option-${index}`

  while (usedValues.has(candidate)) {
    index += 1
    candidate = `option-${index}`
  }

  return candidate
}

const getRangeInputType = (fieldType) => {
  if (fieldType === 'number') return 'number'
  if (
    ['date', 'time', 'datetime-local', 'month', 'week'].includes(fieldType)
  ) {
    return fieldType
  }
  return 'text'
}

const getRangeStepUnitLabel = (fieldType) => {
  if (fieldType === 'date') return 'days'
  if (fieldType === 'time') return 'seconds'
  if (fieldType === 'datetime-local') return 'seconds'
  if (fieldType === 'month') return 'months'
  if (fieldType === 'week') return 'weeks'
  return 'value'
}

const getRangeFormatHint = (fieldType) => {
  if (fieldType === 'date') return 'Use YYYY-MM-DD.'
  if (fieldType === 'time') return 'Use 24-hour HH:MM.'
  if (fieldType === 'datetime-local') return 'Use YYYY-MM-DDTHH:MM.'
  if (fieldType === 'month') return 'Use YYYY-MM.'
  if (fieldType === 'week') return 'Use YYYY-Www (example: 2026-W06).'
  return 'Use a numeric value.'
}

const getRangeConstraintHint = (fieldType, constraint) => {
  if (constraint === 'step') {
    if (fieldType === 'number') {
      return 'Increment size between valid numbers. Example: 1 or 0.5.'
    }
    return `Increment size in ${getRangeStepUnitLabel(fieldType)}.`
  }

  const boundText =
    constraint === 'min' ? 'Earliest or smallest allowed value.' : 'Latest or largest allowed value.'
  return `${boundText} ${getRangeFormatHint(fieldType)}`
}

function FieldTypeListbox({
  value,
  onChange,
  disabled,
  id,
  placeholder = 'Add new field',
}) {
  const hasSelection = typeof value === 'string' && LEAD_FIELD_TYPES.includes(value)
  const selectedMeta = hasSelection ? getFieldTypeMeta(value) : null
  const SelectedIcon = selectedMeta?.Icon

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      <div className="relative mt-1">
        <ListboxButton
          id={id}
          className="relative w-full rounded-md bg-white py-2.5 pl-3 pr-10 text-left text-sm font-semibold text-cyan-700 shadow-sm ring-1 ring-inset ring-cyan-600 hover:ring-2 hover:ring-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2 truncate pr-2">
            {SelectedIcon && (
              <SelectedIcon className="h-4 w-4 text-cyan-700" aria-hidden="true" />
            )}
            <span className={selectedMeta ? 'text-cyan-700' : 'text-cyan-600'}>
              {selectedMeta?.label || placeholder}
            </span>
          </span>
          <PlusIcon
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-700"
          />
        </ListboxButton>

        <ListboxOptions className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black/5 focus:outline-none">
          {/* Filter out 'month' and 'week' field types as they are not supported natively in some browsers */}
          {LEAD_FIELD_TYPES.filter((type) => type !== 'month' && type !== 'week')
            .sort((a, b) => {
              // Custom order: time should come before date and datetime-local
              const dateTimeOrder = ['time', 'date', 'datetime-local']
              const aIndex = dateTimeOrder.indexOf(a)
              const bIndex = dateTimeOrder.indexOf(b)
              
              // If both are in the dateTimeOrder, sort by that order
              if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
              // If only one is in dateTimeOrder, it comes after others
              if (aIndex !== -1) return 1
              if (bIndex !== -1) return -1
              // Maintain original order for other types
              return LEAD_FIELD_TYPES.indexOf(a) - LEAD_FIELD_TYPES.indexOf(b)
            })
            .map((type) => {
            const { Icon, label } = getFieldTypeMeta(type)
            return (
              <ListboxOption
                key={type}
                value={type}
                className="group cursor-default select-none px-3 py-1.5 text-gray-900 data-[focus]:bg-cyan-600 data-[focus]:text-white"
              >
                <div className="flex items-center gap-2">
                  <Icon
                    className="h-4 w-4 text-gray-500 group-data-[focus]:text-white"
                    aria-hidden="true"
                  />
                  <span className="truncate">{label}</span>
                </div>
              </ListboxOption>
            )
          })}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}

export default function LeadCollectionToolSettings({
  team,
  value,
  onChange,
  leadCollectMessage = '',
  onLeadCollectMessageChange,
  disabled = false,
  onRequireUpgrade,
}) {
  const [newFieldType, setNewFieldType] = useState(null)
  const [isFormFieldsOpen, setIsFormFieldsOpen] = useState(false)
  const [draggedFieldIndex, setDraggedFieldIndex] = useState(null)
  const [dragOverFieldIndex, setDragOverFieldIndex] = useState(null)
  const lastEnabledConfigRef = useRef(null)

  const personalPlanCheck = checkPlanPermission(team, 'personal', 'leadCollect')
  const standardPlanCheck = checkPlanPermission(
    team,
    'standard',
    'leadCollectFields',
  )

  const config = useMemo(() => {
    if (!value || typeof value !== 'object') {
      return lastEnabledConfigRef.current || createDefaultLeadCollectOptions()
    }

    try {
      return sanitizeLeadCollectOptions(value)
    } catch (error) {
      if (value && typeof value === 'object' && Array.isArray(value.fields)) {
        return value
      }
      return lastEnabledConfigRef.current || createDefaultLeadCollectOptions()
    }
  }, [value])

  useEffect(() => {
    if (!value || typeof value !== 'object' || !Array.isArray(value.fields)) {
      return
    }

    try {
      lastEnabledConfigRef.current = sanitizeLeadCollectOptions(value)
    } catch (error) {
      lastEnabledConfigRef.current = value
    }
  }, [value])

  const enabled = isLeadCollectEnabled(value)
  const hasExtraFields = getLeadCollectExtraFields(config).length > 0
  const missingDefaultFieldKeys = DEFAULT_LEAD_FIELD_KEYS.filter(
    (defaultKey) =>
      !config.fields.some((field) => (field?.key || '').trim() === defaultKey),
  )

  const keyCounts = config.fields.reduce((result, field) => {
    const key = (field?.key || '').trim()
    if (!key) return result
    result[key] = (result[key] || 0) + 1
    return result
  }, {})
  const hasDuplicateKeys = Object.values(keyCounts).some((count) => count > 1)

  const toPersistedLeadCollect = (nextConfig) => {
    if (!nextConfig) {
      return false
    }

    try {
      const sanitized = sanitizeLeadCollectOptions(nextConfig)
      if (!isLeadCollectEnabled(sanitized)) {
        return false
      }
      const { enabled, ...persistedConfig } = sanitized
      return persistedConfig
    } catch (error) {
      return nextConfig
    }
  }

  const updateConfig = (nextConfig) => {
    onChange(toPersistedLeadCollect(nextConfig))
  }

  const updateField = (fieldIndex, changes) => {
    const nextFields = config.fields.map((field, index) =>
      index === fieldIndex ? { ...field, ...changes } : field,
    )
    updateConfig({
      ...config,
      fields: nextFields,
    })
  }

  const addField = (fieldType) => {
    if (!standardPlanCheck.allowed) {
      onRequireUpgrade?.()
      return
    }

    updateConfig({
      ...config,
      fields: [...config.fields, createLeadFieldByType(fieldType, config.fields)],
    })
  }

  const handleNewFieldTypeSelect = (fieldType) => {
    if (!fieldType) return
    addField(fieldType)
    setNewFieldType(null)
  }

  const restoreDefaultField = (fieldKey) => {
    if (!fieldKey) return
    if (config.fields.some((field) => (field?.key || '').trim() === fieldKey)) {
      return
    }

    const defaultField = createDefaultLeadCollectOptions().fields.find(
      (field) => field.key === fieldKey,
    )
    if (!defaultField) return

    updateConfig({
      ...config,
      fields: [...config.fields, { ...defaultField }],
    })
  }

  const removeField = (fieldIndex) => {
    if (config.fields.length <= 1) {
      return
    }

    updateConfig({
      ...config,
      fields: config.fields.filter((_, index) => index !== fieldIndex),
    })
  }

  const updateSelectOption = (fieldIndex, optionIndex, optionChanges) => {
    const field = config.fields[fieldIndex]
    const options = normalizeOptionsForEditor(field)

    const nextOptions = options.map((option, index) =>
      index === optionIndex ? { ...option, ...optionChanges } : option,
    )

    updateField(fieldIndex, { ...field, options: nextOptions })
  }

  const addSelectOption = (fieldIndex) => {
    const field = config.fields[fieldIndex]
    const options = normalizeOptionsForEditor(field)
    const nextOptionValue = getNextOptionValue(options)

    updateField(fieldIndex, {
      ...field,
      options: [...options, { value: nextOptionValue, label: '' }],
    })
  }

  const removeSelectOption = (fieldIndex, optionIndex) => {
    const field = config.fields[fieldIndex]
    const options = normalizeOptionsForEditor(field)
    if (options.length <= 1) {
      return
    }

    updateField(fieldIndex, {
      ...field,
      options: options.filter((_, index) => index !== optionIndex),
    })
  }

  const moveField = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= config.fields.length || toIndex >= config.fields.length) {
      return
    }

    const nextFields = [...config.fields]
    const [movedField] = nextFields.splice(fromIndex, 1)
    nextFields.splice(toIndex, 0, movedField)

    updateConfig({
      ...config,
      fields: nextFields,
    })
  }

  const handleToggle = (nextEnabled) => {
    if (nextEnabled) {
      if (!personalPlanCheck.allowed) {
        onRequireUpgrade?.()
        return
      }

      const restoredConfig =
        toPersistedLeadCollect(lastEnabledConfigRef.current) ||
        toPersistedLeadCollect(config) ||
        toPersistedLeadCollect(createDefaultLeadCollectOptions())
      setIsFormFieldsOpen(true)
      onChange(
        restoredConfig || toPersistedLeadCollect(createDefaultLeadCollectOptions()),
      )
      return
    }

    lastEnabledConfigRef.current = config
    setIsFormFieldsOpen(false)
    onChange(false)
  }

  const leadCollectModes = LEAD_COLLECT_MODES.map(mode => ({
    id: mode,
    label: MODE_LABELS[mode] || mode
  }))

  return (
    <AppearanceBlock
      title="Lead Collection Tool"
      titleTag="h4"
      description="Collect lead data from users in the widget with a customizable form."
      isLast={true}
    >
      <div className="flex flex-col gap-4">
        <AppearanceToggle
          label="Enable Lead Collection Tool"
          enabled={enabled}
          setEnabled={handleToggle}
          disabled={disabled}
          isNew={true}
          planLabel={
            !personalPlanCheck.allowed ? personalPlanCheck.requiredPlanLabel : null
          }
        />

        {enabled && (
          <div className="ml-4 flex flex-col gap-4">
            <AppearanceBlock
              title="Trigger Mode"
              titleTag="label"
              titleProps={{
                htmlFor: 'lead-collect-trigger-mode',
              }}
              description="Controls whether lead fields are requested before first response or before escalation."
              isLast={true}
            >
              <AppearanceSelect
                id="lead-collect-trigger-mode"
                data={leadCollectModes}
                value={config.mode}
                disabled={disabled}
                onChange={(event) =>
                  updateConfig({
                    ...config,
                    mode: event.target.value,
                  })
                }
              />
            </AppearanceBlock>

            <AppearanceBlock
              title="Prompt Message"
              htmlFor="lead-collect-message"
              description={
                <>
                  This message will appear before the lead collection form. Supports{' '}
                  <a
                    href="https://www.markdownguide.org/basic-syntax/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-600 underline hover:text-cyan-500"
                  >
                    Markdown
                  </a>
                  .
                </>
              }
              isLast={true}
            >
              <AppearanceInput
                type="text"
                id="lead-collect-message"
                value={leadCollectMessage}
                placeholder="Before we continue, could you share a few details?"
                disabled={disabled}
                onChange={(event) =>
                  onLeadCollectMessageChange?.(event.target.value)
                }
              />
            </AppearanceBlock>

            <AppearanceAccordion
              title="Form Fields"
              titleTag="h5"
              open={isFormFieldsOpen}
              onOpenChange={setIsFormFieldsOpen}
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                      {!standardPlanCheck.allowed && (
                        <Tooltip
                          content={`${standardPlanCheck.requiredPlanLabel} plan required to add fields beyond ${DEFAULT_LEAD_FIELD_KEYS.join(' + ')}.`}
                        >
                          <button
                            type="button"
                            onClick={() => onRequireUpgrade?.()}
                            disabled={disabled}
                            className="inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {standardPlanCheck.requiredPlanLabel}
                          </button>
                        </Tooltip>
                      )}
                      <div className="w-36">
                        <FieldTypeListbox
                          value={newFieldType}
                          onChange={handleNewFieldTypeSelect}
                          disabled={disabled}
                          id="lead-new-field-type"
                          placeholder="Add new field"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="text-[11px] text-gray-500">
                      Name and email are recommended minimum. Keep your form as short
                      as possible to reduce user friction.
                    </p>
                    <p className="ml-auto text-right text-[11px] text-gray-500">
                      Drag fields by the handle to reorder them.
                    </p>
                  </div>
                  {missingDefaultFieldKeys.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] text-gray-500">
                        Restore recommended defaults:
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {missingDefaultFieldKeys.map((fieldKey) => (
                          <button
                            key={fieldKey}
                            type="button"
                            onClick={() => restoreDefaultField(fieldKey)}
                            disabled={disabled}
                            className="rounded border border-cyan-200 px-2 py-0.5 text-[11px] font-semibold text-cyan-700 hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Add {fieldKey}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {config.fields.map((field, fieldIndex) => {
                      const duplicateKeyCount = keyCounts[(field.key || '').trim()] || 0
                      const selectOptions = normalizeOptionsForEditor(field)
                      const fieldIdBase = `lead-field-${fieldIndex}`
                      const normalizedFieldKey = (field?.key || '').trim()
                      const isDefaultKeyField = DEFAULT_LEAD_FIELD_KEYS.includes(
                        normalizedFieldKey,
                      )
                      const isKeyLockedByPlan =
                        !standardPlanCheck.allowed && isDefaultKeyField
                      const fieldType = field.type || 'text'
                      const typeMeta = getFieldTypeMeta(fieldType)
                      const FieldTypeIcon = typeMeta.Icon
                      const supportsPattern = ['text', 'email', 'tel', 'url'].includes(fieldType)
                      const supportsLength = ['text', 'email', 'tel', 'url', 'textarea'].includes(fieldType)
                      const supportsRange = [
                        'number',
                        'date',
                        'time',
                        'datetime-local',
                        'month',
                        'week',
                      ].includes(fieldType)
                      const rangeInputType = getRangeInputType(fieldType)
                      const showPlaceholder = supportsLeadFieldPlaceholder(fieldType)
                      const hasValidationData =
                        Boolean(field.pattern) ||
                        field.min !== undefined ||
                        field.max !== undefined ||
                        field.step !== undefined ||
                        field.minLength !== undefined ||
                        field.maxLength !== undefined
                      const isDragging = draggedFieldIndex === fieldIndex
                      const isDragOver =
                        dragOverFieldIndex === fieldIndex &&
                        draggedFieldIndex !== null &&
                        draggedFieldIndex !== fieldIndex

                      return (
                        <div
                          key={`${field.key || 'field'}-${fieldIndex}`}
                          className={`rounded-md border p-2.5 transition ${
                            isDragOver
                              ? 'border-cyan-400 bg-cyan-50/40'
                              : 'border-gray-200'
                          } ${isDragging ? 'opacity-75' : ''}`}
                          onDragOver={(event) => {
                            if (disabled || draggedFieldIndex === null) return
                            event.preventDefault()
                            setDragOverFieldIndex(fieldIndex)
                          }}
                          onDrop={(event) => {
                            event.preventDefault()
                            if (disabled || draggedFieldIndex === null) return
                            moveField(draggedFieldIndex, fieldIndex)
                            setDraggedFieldIndex(null)
                            setDragOverFieldIndex(null)
                          }}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">
                              <span className="inline-flex items-center gap-1.5">
                                <FieldTypeIcon
                                  className="h-4 w-4 text-gray-500"
                                  aria-hidden="true"
                                />
                                <span>{field.label || field.key || 'Untitled field'}</span>
                              </span>
                            </p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                draggable={!disabled}
                                onDragStart={(event) => {
                                  if (disabled) return
                                  event.dataTransfer.effectAllowed = 'move'
                                  event.dataTransfer.setData('text/plain', String(fieldIndex))
                                  setDraggedFieldIndex(fieldIndex)
                                }}
                                onDragEnd={() => {
                                  setDraggedFieldIndex(null)
                                  setDragOverFieldIndex(null)
                                }}
                                disabled={disabled}
                                className="inline-flex cursor-grab items-center rounded border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Drag to reorder"
                                aria-label="Drag to reorder field"
                              >
                                <Bars3Icon className="h-4 w-4" aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeField(fieldIndex)}
                                disabled={disabled || config.fields.length <= 1}
                                className="inline-flex items-center rounded border border-red-200 p-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Remove field"
                                aria-label="Remove field"
                              >
                                <TrashIcon className="h-4 w-4" aria-hidden="true" />
                              </button>
                            </div>
                          </div>

                          <div
                            className={`grid gap-2 ${
                              showPlaceholder ? 'md:grid-cols-3' : 'md:grid-cols-2'
                            }`}
                          >
                            <div>
                              <label
                                htmlFor={`${fieldIdBase}-key`}
                                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                              >
                                Key
                              </label>
                              <input
                                id={`${fieldIdBase}-key`}
                                type="text"
                                value={field.key || ''}
                                onChange={(event) =>
                                  updateField(fieldIndex, {
                                    key: sanitizeLeadCollectInputName(event.target.value),
                                  })
                                }
                                disabled={disabled || isKeyLockedByPlan}
                                className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                              />
                              {isKeyLockedByPlan && (
                                <p className="mt-1 text-[11px] text-gray-500">
                                  {standardPlanCheck.requiredPlanLabel} required to edit
                                  default field keys.
                                </p>
                              )}
                              {duplicateKeyCount > 1 && (
                                <p className="mt-1 text-[11px] text-red-600">
                                  Field keys must be unique.
                                </p>
                              )}
                            </div>

                            <div>
                              <label
                                htmlFor={`${fieldIdBase}-label`}
                                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                              >
                                Label
                              </label>
                              <input
                                id={`${fieldIdBase}-label`}
                                type="text"
                                value={field.label || ''}
                                onChange={(event) =>
                                  updateField(fieldIndex, {
                                    label: event.target.value,
                                  })
                                }
                                disabled={disabled}
                                className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                              />
                            </div>

                            {showPlaceholder && (
                              <div>
                                <label
                                  htmlFor={`${fieldIdBase}-placeholder`}
                                  className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                                >
                                  Placeholder
                                </label>
                                <input
                                  id={`${fieldIdBase}-placeholder`}
                                  type="text"
                                  value={field.placeholder || ''}
                                  onChange={(event) =>
                                    updateField(fieldIndex, {
                                      placeholder: event.target.value,
                                    })
                                  }
                                  disabled={disabled}
                                  className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                />
                              </div>
                            )}
                          </div>

                          <div className="mt-2 grid gap-2 md:grid-cols-2">
                            <div>
                              <label
                                htmlFor={`${fieldIdBase}-help`}
                                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                              >
                                Help Text
                              </label>
                              <input
                                id={`${fieldIdBase}-help`}
                                type="text"
                                value={field.help || ''}
                                onChange={(event) =>
                                  updateField(fieldIndex, {
                                    help: event.target.value,
                                  })
                                }
                                disabled={disabled}
                                className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label
                                htmlFor={`${fieldIdBase}-required`}
                                className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                              >
                                Required
                              </label>
                              <div className="mt-1">
                                <input
                                  id={`${fieldIdBase}-required`}
                                  type="checkbox"
                                  checked={Boolean(field.required)}
                                  onChange={(event) =>
                                    updateField(fieldIndex, {
                                      required: event.target.checked,
                                    })
                                  }
                                  disabled={disabled}
                                  className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-600"
                                />
                              </div>
                            </div>
                          </div>

                          {(supportsPattern || supportsLength || supportsRange) && (
                            <details className="mt-2 rounded-md border border-gray-200 bg-gray-50/50 px-2 py-1.5">
                              <summary className="cursor-pointer text-xs font-medium uppercase tracking-wide text-gray-600">
                                Validation
                                {hasValidationData && (
                                  <span className="ml-2 rounded-full bg-cyan-100 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-800">
                                    Set
                                  </span>
                                )}
                              </summary>

                              <div className="mt-2 grid gap-2 md:grid-cols-3">
                                {supportsPattern && (
                                  <div>
                                    <label
                                      htmlFor={`${fieldIdBase}-pattern`}
                                      className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                      Pattern
                                    </label>
                                    <input
                                      id={`${fieldIdBase}-pattern`}
                                      type="text"
                                      value={field.pattern || ''}
                                      onChange={(event) =>
                                        updateField(fieldIndex, {
                                          pattern: event.target.value,
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder="^\\+?[0-9\\s\\-()]{7,20}$"
                                      className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                    />
                                  </div>
                                )}

                                {supportsRange && (
                                  <>
                                    <div>
                                      <label
                                        htmlFor={`${fieldIdBase}-min`}
                                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"
                                      >
                                        <span>Min</span>
                                        <Tooltip content={getRangeConstraintHint(fieldType, 'min')}>
                                          <button
                                            type="button"
                                            className="inline-flex items-center text-gray-400 hover:text-gray-600"
                                            aria-label="Min format help"
                                          >
                                            <QuestionMarkCircleIcon
                                              className="h-3.5 w-3.5"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </Tooltip>
                                      </label>
                                      <input
                                        id={`${fieldIdBase}-min`}
                                        type={rangeInputType}
                                        value={field.min ?? ''}
                                        onChange={(event) =>
                                          updateField(fieldIndex, {
                                            min: event.target.value,
                                          })
                                        }
                                        disabled={disabled}
                                        placeholder={getRangeFormatHint(fieldType)}
                                        className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                      />
                                    </div>
                                    <div>
                                      <label
                                        htmlFor={`${fieldIdBase}-max`}
                                        className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"
                                      >
                                        <span>Max</span>
                                        <Tooltip content={getRangeConstraintHint(fieldType, 'max')}>
                                          <button
                                            type="button"
                                            className="inline-flex items-center text-gray-400 hover:text-gray-600"
                                            aria-label="Max format help"
                                          >
                                            <QuestionMarkCircleIcon
                                              className="h-3.5 w-3.5"
                                              aria-hidden="true"
                                            />
                                          </button>
                                        </Tooltip>
                                      </label>
                                      <input
                                        id={`${fieldIdBase}-max`}
                                        type={rangeInputType}
                                        value={field.max ?? ''}
                                        onChange={(event) =>
                                          updateField(fieldIndex, {
                                            max: event.target.value,
                                          })
                                        }
                                        disabled={disabled}
                                        placeholder={getRangeFormatHint(fieldType)}
                                        className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                      />
                                    </div>
                                  </>
                                )}
                                {supportsRange && (
                                  <div>
                                    <label
                                      htmlFor={`${fieldIdBase}-step`}
                                      className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-gray-500"
                                    >
                                      <span>Step</span>
                                      <Tooltip content={getRangeConstraintHint(fieldType, 'step')}>
                                        <button
                                          type="button"
                                          className="inline-flex items-center text-gray-400 hover:text-gray-600"
                                          aria-label="Step format help"
                                        >
                                          <QuestionMarkCircleIcon
                                            className="h-3.5 w-3.5"
                                            aria-hidden="true"
                                          />
                                        </button>
                                      </Tooltip>
                                    </label>
                                    <input
                                      id={`${fieldIdBase}-step`}
                                      type="number"
                                      value={field.step ?? ''}
                                      onChange={(event) =>
                                        updateField(fieldIndex, {
                                          step: event.target.value,
                                        })
                                      }
                                      disabled={disabled}
                                      placeholder={getRangeStepUnitLabel(fieldType)}
                                      className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                    />
                                  </div>
                                )}

                                {supportsLength && (
                                  <>
                                    <div>
                                      <label
                                        htmlFor={`${fieldIdBase}-minlength`}
                                        className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                                      >
                                        Min Length
                                      </label>
                                      <input
                                        id={`${fieldIdBase}-minlength`}
                                        type="number"
                                        min={0}
                                        value={field.minLength ?? ''}
                                        onChange={(event) =>
                                          updateField(fieldIndex, {
                                            minLength: event.target.value,
                                          })
                                        }
                                        disabled={disabled}
                                        className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                      />
                                    </div>
                                    <div>
                                      <label
                                        htmlFor={`${fieldIdBase}-maxlength`}
                                        className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                                      >
                                        Max Length
                                      </label>
                                      <input
                                        id={`${fieldIdBase}-maxlength`}
                                        type="number"
                                        min={1}
                                        value={field.maxLength ?? ''}
                                        onChange={(event) =>
                                          updateField(fieldIndex, {
                                            maxLength: event.target.value,
                                          })
                                        }
                                        disabled={disabled}
                                        className="mt-1 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                            </details>
                          )}

                          {field.type === 'select' && (
                            <div className="mt-2">
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                  Options
                                </p>
                                <button
                                  type="button"
                                  onClick={() => addSelectOption(fieldIndex)}
                                  disabled={disabled}
                                  className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed disabled:text-gray-400"
                                >
                                  Add Option
                                </button>
                              </div>
                              <div className="space-y-2">
                                {selectOptions.map((option, optionIndex) => (
                                  <div
                                    key={`${field.key}-option-${optionIndex}`}
                                    className="grid gap-2 md:grid-cols-12"
                                  >
                                    <label
                                      htmlFor={`${fieldIdBase}-option-value-${optionIndex}`}
                                      className="sr-only"
                                    >
                                      Option value
                                    </label>
                                    <input
                                      id={`${fieldIdBase}-option-value-${optionIndex}`}
                                      type="text"
                                      value={option.value}
                                      onChange={(event) =>
                                        updateSelectOption(
                                          fieldIndex,
                                          optionIndex,
                                          {
                                            value: sanitizeLeadCollectInputName(
                                              event.target.value,
                                            ),
                                          },
                                        )
                                      }
                                      disabled={disabled}
                                      placeholder="Value"
                                      className="md:col-span-5 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                    />
                                    <label
                                      htmlFor={`${fieldIdBase}-option-label-${optionIndex}`}
                                      className="sr-only"
                                    >
                                      Option label
                                    </label>
                                    <input
                                      id={`${fieldIdBase}-option-label-${optionIndex}`}
                                      type="text"
                                      value={option.label}
                                      onChange={(event) =>
                                        updateSelectOption(
                                          fieldIndex,
                                          optionIndex,
                                          { label: event.target.value },
                                        )
                                      }
                                      disabled={disabled}
                                      placeholder="Label (optional)"
                                      className="md:col-span-5 block w-full rounded-md border-gray-300 px-2.5 py-1.5 text-xs shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:opacity-50"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeSelectOption(fieldIndex, optionIndex)}
                                      disabled={disabled || selectOptions.length <= 1}
                                      className="md:col-span-2 inline-flex items-center justify-center rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                      title="Remove option"
                                      aria-label="Remove option"
                                    >
                                      <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {hasDuplicateKeys && (
                  <p className="text-[11px] text-red-600">
                    Field keys must be unique before saving.
                  </p>
                )}

                {hasExtraFields && !standardPlanCheck.allowed && (
                  <p className="text-[11px] text-gray-500">
                    Extra fields are configured. Adding more requires the{' '}
                    {standardPlanCheck.requiredPlanLabel} plan.
                  </p>
                )}
              </div>
            </AppearanceAccordion>
          </div>
        )}
      </div>
    </AppearanceBlock>
  )
}
