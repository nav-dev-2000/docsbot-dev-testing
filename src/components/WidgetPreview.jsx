import {
  ChevronLeftIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import { ArrowPathIcon } from '@heroicons/react/20/solid'
import {
  faComment,
  faComments,
  faRobot,
  faLifeRing,
  faQuestion,
  faInfo,
  faBook,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from '@/utils/classNames'
import { decideTextColor, getLighterColor } from '@/utils/colors'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { useEffect, useState } from 'react'
import docsbotLogo from '@/images/logos/docsbot-logo.svg'
import Image from 'next/image'
import { isLeadCollectEnabled, supportsLeadFieldPlaceholder } from '@/lib/leadCollect'

const iconMap = {
  default: { icon: faComment, label: 'Comment' },
  comments: { icon: faComments, label: 'Comments' },
  robot: { icon: faRobot, label: 'Robot' },
  'life-ring': { icon: faLifeRing, label: 'Life Ring' },
  question: { icon: faQuestion, label: 'Question Mark' },
  book: { icon: faBook, label: 'Book' },
  custom: { icon: faPlus, label: 'Custom Icon' },
}

const botIconMap = {
  none: { icon: false, label: 'None' },
  comment: { icon: faComment, label: 'Comment' },
  robot: { icon: faRobot, label: 'Robot' },
  'life-ring': { icon: faLifeRing, label: 'Life Ring' },
  info: { icon: faInfo, label: 'Info' },
  book: { icon: faBook, label: 'Book' },
  custom: { icon: faPlus, label: 'Custom Icon' },
}

const streamdownRemarkPlugins = [
  ...Object.values(defaultRemarkPlugins),
  [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

const normalizeLeadColorValue = (value) => {
  if (typeof value !== 'string') return '#000000'

  const normalized = value.trim()
  if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
    return normalized
  }

  if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
    const [r, g, b] = normalized.slice(1).split('')
    return `#${r}${r}${g}${g}${b}${b}`
  }

  return '#000000'
}

export default function WidgetPreview({
  bot,
  color,
  logo,
  headerAlignment,
  alignment,
  branding,
  icon,
  botIcon,
  showButtonLabel,
  labels,
  hideSources,
  showCopyButton,
  supportLink,
  isAgent,
  tools,
  leadCollect,
  imageUploads,
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [previewMode, setPreviewMode] = useState('widget') // 'widget' | 'embed'

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const copyButtonEnabled =
    showCopyButton ?? bot?.showCopyButton ?? false
  const leadCollectEnabled = isLeadCollectEnabled(leadCollect)
  const leadCollectMode = leadCollect?.mode || 'before_response'
  const showLeadCollectBeforeResponse =
    leadCollectEnabled && leadCollectMode === 'before_response'
  const showLeadCollectBeforeEscalation =
    leadCollectEnabled && leadCollectMode === 'before_escalation'

  return (
    <div className="sticky top-20">
      <div className="relative mb-4 flex items-center justify-between">
        <h3 className="text-2xl font-bold">Preview</h3>
        <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-1 py-0.5">
          <button
            type="button"
            onClick={() => setPreviewMode('widget')}
            className={classNames(
              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
              previewMode === 'widget'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Widget
          </button>
          <button
            type="button"
            onClick={() => setPreviewMode('embed')}
            className={classNames(
              'rounded-md px-2 py-1 text-xs font-medium transition-colors',
              previewMode === 'embed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900',
            )}
          >
            Embed
          </button>
        </div>
      </div>
      <div
        className={classNames(
          'overflow-hidden rounded-xl bg-white shadow-xl',
          previewMode === 'widget' ? 'max-w-[448px]' : 'w-full',
        )}
      >
        <div
          className="flex items-center justify-center px-3 py-2 text-xs"
          style={{
            backgroundColor: color,
            color: decideTextColor(color || '#1292EE'),
          }}
        >
          <div className="relative w-full">
            <button
              className="absolute right-0 top-0 font-semibold focus:outline-none"
              title={labels.resetChat}
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <div
              className={classNames(
                headerAlignment === 'left' ? 'text-left' : 'text-center',
              )}
            >
              {logo ? (
                <div
                  className="flex items-center justify-center"
                  style={{
                    justifyContent:
                      headerAlignment === 'left' ? 'start' : 'center',
                  }}
                >
                  <img src={logo} alt={bot.name} className="max-h-7 w-auto" />
                </div>
              ) : (
                <>
                  <h1 className="text-base font-bold">{bot.name}</h1>
                  <span>{bot.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex h-full flex-col overflow-y-scroll px-3 pt-4">
          <BotMessage
            text={labels.firstMessage}
            {...{ botIcon, iconMap, labels, color }}
          />

          <div
            className="mb-3 self-end rounded-2xl rounded-tr-none bg-white px-3 py-3 text-sm text-gray-700"
            style={{
              backgroundColor: color,
              color: decideTextColor(color),
            }}
          >
            Why are you so amazing?
          </div>

          {showLeadCollectBeforeResponse && (
            <>
              <BotMessage
                text={labels?.leadCollectMessage || 'Before we continue, could you share a few details?'}
                {...{
                  botIcon,
                  labels,
                  color,
                  sources: false,
                }}
              />
              <LeadCollectPreview
                leadCollect={leadCollect}
                labels={labels}
                color={color}
              />
            </>
          )}

          <BotMessage
            text={
              "Thanks! Is there anything specific you would like to know about DocsBot or our [Embeddable Chat Widget](https://docsbot.ai/documentation/developer/embeddable-chat-widget)? I'm here to assist you!"
            }
            {...{
              botIcon,
              iconMap,
              labels,
              color,
              sources: true,
              hideSources,
              showCopyButton: copyButtonEnabled,
            }}
          />

          {tools?.followup_rating?.enabled === undefined
            ? true
            : tools?.followup_rating?.enabled && (
                <BotMessage
                  text={labels.feedbackMessage}
                  {...{
                    botIcon,
                    iconMap,
                    labels,
                    color,
                    isAgent,
                    sources: false,
                    feedback: true,
                  }}
                />
              )}

          {tools?.human_escalation?.enabled === undefined
            ? true
            : tools?.human_escalation?.enabled && (
                <>
                  {isAgent && (
                    <div
                      className="mb-3 self-end rounded-2xl rounded-tr-none bg-white px-3 py-3 text-sm text-gray-700"
                      style={{
                        backgroundColor: color,
                        color: decideTextColor(color),
                      }}
                    >
                      Can I talk to someone?
                    </div>
                  )}

                  <BotMessage
                    text={'Sure, can I connect you to the support team?'}
                    {...{
                      botIcon,
                      iconMap,
                      labels,
                      color,
                      isAgent,
                      supportLink,
                      sources: false,
                      support: true,
                    }}
                  />

                  {showLeadCollectBeforeEscalation && (
                    <>
                      <BotMessage
                        text={labels?.leadCollectMessage || 'Before we continue, could you share a few details?'}
                        {...{
                          botIcon,
                          labels,
                          color,
                          isAgent,
                          sources: false,
                        }}
                      />
                      <LeadCollectPreview
                        leadCollect={leadCollect}
                        labels={labels}
                        color={color}
                      />
                    </>
                  )}
                </>
              )}
        </div>

        <div className="relative flex-1 px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder={labels.inputPlaceholder}
              className="w-full rounded-2xl border border-gray-300 bg-white py-3 pl-4 pr-12 text-sm text-gray-700 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
              style={{
                borderColor: color,
              }}
              disabled
            />
            {imageUploads && isAgent && (
              <PhotoIcon className="absolute right-10 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-xl text-gray-300" />
            )}
            <button
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl fill-gray-300"
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = color
                e.currentTarget.style.fill = decideTextColor(color)
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.fill = '#d1d5db'
              }}
              disabled
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="h-3 w-3 fill-inherit"
              >
                <path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"></path>
              </svg>
            </button>
          </div>
          {labels.footerMessage && (
            <div className="mt-0.5 w-full text-center text-xs text-gray-500">
              <Streamdown
                mode="static"
                isAnimating={false}
                remarkPlugins={streamdownRemarkPlugins}
              >
                {labels.footerMessage}
              </Streamdown>
            </div>
          )}
          {isMounted && branding && (
            <div className="mt-1 flex w-full items-center justify-center text-center">
              <button className="flex items-center justify-center text-xs font-semibold text-gray-500 hover:text-gray-800">
                {labels.poweredBy}{' '}
                <Image
                  src={docsbotLogo}
                  alt="DocsBot Logo"
                  className="ml-0.5 h-3 w-auto"
                />
              </button>
            </div>
          )}
        </div>
      </div>
      <div
        className={classNames(
          'mt-6 flex',
          previewMode === 'widget' ? 'max-w-[448px]' : 'w-full',
        )}
      >
        <div
          className={classNames(
            alignment === 'right' ? 'ml-auto' : 'mr-auto',
            showButtonLabel ? 'h-12 rounded-2xl px-5' : 'h-14 w-14 rounded-3xl',
            'text-md inline-flex items-center justify-center font-bold text-white shadow-lg hover:opacity-90',
          )}
          style={{
            backgroundColor: color,
            color: decideTextColor(color),
          }}
        >
          {iconMap[icon] ? (
            <FontAwesomeIcon icon={iconMap[icon].icon} size="xl" />
          ) : icon.includes('://') ? (
            <img src={icon} alt="icon" className="h-7 w-7 object-scale-down" />
          ) : null}
          {showButtonLabel && (
            <span className="text-md ml-3 font-normal">
              {labels.floatingButton}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export function LeadCollectPreview({ leadCollect, labels, color }) {
  const fields = Array.isArray(leadCollect?.fields) ? leadCollect.fields : []
  const [leadFormValues, setLeadFormValues] = useState({})
  const [leadFormTouched, setLeadFormTouched] = useState(false)
  const hasMissingRequired = fields.some(
    (field, index) =>
      field?.required &&
      !String(leadFormValues[field?.key || `field_${index}`] || '').trim(),
  )

  useEffect(() => {
    const nextValues = {}
    fields.forEach((field, index) => {
      const fieldKey = field?.key || `field_${index}`
      nextValues[fieldKey] = leadFormValues[fieldKey] ?? ''
    })
    setLeadFormValues(nextValues)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadCollect?.fields])

  return (
    <>
      <div className="docsbot-chat-lead-message-container mb-3 flex w-full justify-start px-0">
        <div
          className="docsbot-chat-lead-message mr-1 w-full max-w-full overflow-hidden rounded-2xl border border-gray-200 bg-[#f1f3f5] p-4 text-slate-800 shadow-sm"
          style={{ containerType: 'inline-size' }}
        >
          <div className="w-full">
            {fields.length > 0 ? (
              <form
                className="w-full"
                onSubmit={(event) => {
                  event.preventDefault()
                  setLeadFormTouched(true)
                }}
              >
                <div className="docsbot-lead-fields-grid">
                  {fields.map((field, index) => {
                    const fieldKey = field?.key || `field_${index}`
                    const inputId = `preview-${fieldKey}-${index}`
                    const label =
                      field?.label || field?.name || field?.key || `Field ${index + 1}`
                    const inputType = field?.type || 'text'
                    const placeholder = field?.placeholder || ''
                    const selectPlaceholder =
                      field?.placeholder === 'Select an option'
                        ? labels?.selectOption || field.placeholder
                        : field?.placeholder
                    const fieldValue = leadFormValues[fieldKey] ?? ''
                    const supportsPlaceholder =
                      supportsLeadFieldPlaceholder(inputType) &&
                      inputType !== 'select'
                    const sharedClassName =
                      'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-black/20'
                    const sharedProps = {
                      id: inputId,
                      name: field?.key || fieldKey,
                      required: Boolean(field?.required),
                      placeholder: supportsPlaceholder ? placeholder || undefined : undefined,
                      value: fieldValue,
                      min: field?.min,
                      max: field?.max,
                      step: field?.step,
                      minLength: field?.minLength,
                      maxLength: field?.maxLength,
                      pattern: field?.pattern,
                      inputMode: field?.inputMode,
                      onChange: (event) => {
                        setLeadFormTouched(true)
                        setLeadFormValues((prev) => ({
                          ...prev,
                          [fieldKey]: event.target.value,
                        }))
                      },
                    }
                    const isLocked = Boolean(
                      field?.locked || field?.readOnly || field?.disabled,
                    )
                    const normalizedColorValue = normalizeLeadColorValue(
                      fieldValue || field?.value || field?.defaultValue || field?.default,
                    )

                    const isFullWidthField = inputType === 'textarea'

                    return (
                      <label
                        key={inputId}
                        htmlFor={inputId}
                        className={`block text-sm text-slate-800${isFullWidthField ? ' docsbot-lead-field-full' : ''}`}
                      >
                        <span className="mb-1 block font-semibold">
                          {label}
                          {field?.required && (
                            <span className="ml-1 text-red-600" aria-hidden="true">
                              *
                            </span>
                          )}
                        </span>

                        {inputType === 'textarea' ? (
                          <textarea
                            {...sharedProps}
                            rows={2}
                            className={sharedClassName}
                          />
                        ) : inputType === 'select' ? (
                          <select
                            {...sharedProps}
                            className={`${sharedClassName} appearance-none pr-10`}
                            style={{
                              backgroundImage:
                                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M5 7.5L10 12.5L15 7.5' stroke='%23475569' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 12px center',
                              backgroundSize: '16px 16px',
                            }}
                          >
                            {selectPlaceholder && (
                              <option value="" disabled={Boolean(field?.required)}>
                                {selectPlaceholder}
                              </option>
                            )}
                            {(field?.options || []).map((option, optionIndex) => {
                              const optionValue =
                                typeof option === 'string' ? option : option?.value
                              const optionLabel =
                                typeof option === 'string'
                                  ? option
                                  : option?.label || option?.value
                              return (
                                <option
                                  key={`${inputId}-option-${optionIndex}`}
                                  value={optionValue}
                                >
                                  {optionLabel}
                                </option>
                              )
                            })}
                          </select>
                        ) : inputType === 'color' ? (
                          <div
                            className={`docsbot-color-field rounded-lg border border-gray-300 bg-white pl-1.5 pr-3 py-1.5 shadow-sm transition focus-within:border-gray-900 focus-within:ring-2 focus-within:ring-black/20 ${isLocked ? 'cursor-not-allowed opacity-60' : ''}`}
                            style={{ width: 'fit-content', maxWidth: '100%' }}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                id={inputId}
                                name={field?.key || fieldKey}
                                type="color"
                                value={normalizedColorValue}
                                disabled={isLocked}
                                onChange={(event) => {
                                  if (isLocked) return
                                  setLeadFormTouched(true)
                                  setLeadFormValues((prev) => ({
                                    ...prev,
                                    [field?.key || fieldKey]: event.target.value,
                                  }))
                                }}
                                className="docsbot-color-swatch h-7 w-14 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed"
                              />
                              <span className="whitespace-nowrap font-mono text-sm text-slate-700">
                                {normalizedColorValue.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <input
                            {...sharedProps}
                            type={inputType}
                            className={sharedClassName}
                          />
                        )}

                        {field?.help && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {field.help}
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>

                <div
                  className={`mt-4 flex items-center gap-3 pt-2 ${
                    leadFormTouched && hasMissingRequired
                      ? 'justify-between'
                      : 'justify-end'
                  }`}
                >
                  {leadFormTouched && hasMissingRequired && (
                    <div className="text-xs text-red-700">
                      {labels?.requiredField || 'Please fill out required fields.'}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{
                      backgroundColor: color || '#1292ee',
                      opacity: hasMissingRequired ? 0.6 : 1,
                      cursor: hasMissingRequired ? 'not-allowed' : 'pointer',
                    }}
                    disabled={hasMissingRequired}
                  >
                    {labels?.continue || 'Continue'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-xs text-slate-500">
                {labels?.leadCollectEmpty || 'No fields configured.'}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .docsbot-chat-lead-message .docsbot-lead-fields-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }

        .docsbot-chat-lead-message .docsbot-lead-fields-grid > * + * {
          margin-top: 0;
        }

        .docsbot-chat-lead-message .docsbot-lead-field-full {
          grid-column: 1 / -1;
        }

        @container (min-width: 480px) {
          .docsbot-chat-lead-message .docsbot-lead-fields-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .docsbot-color-field {
          display: inline-flex;
        }

        input.docsbot-color-swatch[type='color'] {
          -webkit-appearance: none;
          appearance: none;
          padding: 0;
          border: 0;
          background: transparent;
        }

        input.docsbot-color-swatch[type='color']::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        input.docsbot-color-swatch[type='color']::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }

        input.docsbot-color-swatch[type='color']::-moz-color-swatch {
          border: none;
          border-radius: 6px;
        }
      `}</style>
    </>
  )
}

function BotMessage({
  text,
  botIcon,
  labels,
  color,
  sources,
  hideSources,
  isAgent,
  supportLink,
  feedback,
  support,
  showCopyButton,
}) {
  const avatarBgColor = getLighterColor(color || '#1292EE', 0.6)
  const avatarFontColor = decideTextColor(avatarBgColor)

  const bgColor = getLighterColor(color || '#1292EE')
  const fontColor = decideTextColor(bgColor)

  return (
    <>
      {!(support && !isAgent) && (
        <div className="items-top mb-3 flex justify-start">
          {botIcon !== 'none' && (
            <div
              className="mr-2 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-100"
              style={{
                backgroundColor: avatarBgColor,
                color: avatarFontColor,
              }}
            >
              {botIcon.includes('://') ? (
                <img
                  src={botIcon}
                  alt="icon"
                  className="h-auto w-1/2 object-scale-down"
                />
              ) : (
                <FontAwesomeIcon icon={botIconMap[botIcon].icon} size="xs" />
              )}
            </div>
          )}
          <div className="mr-1 rounded-2xl rounded-tl-none bg-[#f1f3f5] px-3 py-3 text-sm leading-snug text-gray-800">
            <Streamdown
              mode="static"
              isAnimating={false}
              remarkPlugins={streamdownRemarkPlugins}
            >
              {text}
            </Streamdown>
            {sources && !hideSources && (
              <>
                <div className="mt-0 flex items-center justify-between border-b border-gray-300 pt-2 text-sm font-semibold text-gray-700 mb-2">
                  {labels.sources}
                  {showCopyButton && (
                    <button
                      type="button"
                      className="text-gray-500 transition-colors hover:text-gray-800"
                      aria-label={labels?.copyResponse || 'Copy response'}
                      title={labels?.copyResponse || 'Copy response'}
                    >
                      <span className="sr-only">{labels?.copyResponse || 'Copy response'}</span>
                      <DocumentDuplicateIcon className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <div className="">
                  <a
                    href="https://docsbot.ai/documentation/developer/embeddable-chat-widget"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
                  >
                    <span>Embeddable Chat Widget - DocsBot</span>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={classNames(
            '-mt-1 mb-4 ml-1 flex justify-start',
            botIcon !== 'none' ? 'ml-10' : '',
          )}
        >
          <div className="flex space-x-2">
            <button
              title={labels.helpful}
              className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-700 transition-shadow hover:shadow-md"
            >
              {labels.feedbackYes}
            </button>
            <button
              title={labels.unhelpful}
              className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-700 transition-shadow hover:shadow-md"
            >
              {labels.feedbackNo}
            </button>
          </div>
        </div>
      )}

      {support && (
        <div
        className={classNames(
          '-mt-1 mb-4 ml-1 flex justify-start',
          botIcon !== 'none' ? 'ml-10' : '',
        )}
      >
          {isAgent ? (
            <div className="flex space-x-2">
              <a
                href={supportLink}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-700 transition-shadow hover:shadow-md"
              >
                Yes, please
              </a>
              <button className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm text-gray-700 transition-shadow hover:shadow-md">
                No, thanks
              </button>
            </div>
          ) : (
            <a
              href={supportLink}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-gray-300 bg-white px-2 py-0.5 text-sm font-medium text-gray-700 transition-shadow hover:shadow-md"
            >
              {labels.getSupport}
            </a>
          )}
        </div>
      )}
    </>
  )
}
