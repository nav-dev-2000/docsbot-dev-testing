import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls } from 'ai'
import { Dialog, Transition } from '@headlessui/react'
import { fetchEventSource } from '@microsoft/fetch-event-source'
import clsx from 'clsx'
import remarkExternalLinks from 'remark-external-links'
import Link from 'next/link'
import {
    AcademicCapIcon,
    ArrowDownIcon,
    ArrowLeftIcon,
    ArrowPathIcon,
    ArrowDownTrayIcon,
    BeakerIcon,
    BookOpenIcon,
    BoltIcon,
    BuildingOffice2Icon,
    ChatBubbleLeftRightIcon,
    CheckIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    ClipboardDocumentIcon,
    CodeBracketIcon,
    CommandLineIcon,
    DocumentTextIcon,
    GlobeAltIcon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    PencilSquareIcon,
    PlayCircleIcon,
    PlusIcon,
    PhotoIcon,
    TrashIcon,
    WrenchScrewdriverIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import { PaperAirplaneIcon, StopIcon } from '@heroicons/react/24/solid'

import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Streamdown, defaultRemarkPlugins, defaultRehypePlugins } from '@/components/Streamdown'
import Workspace from '@new-dashboard/Workspace'
import Button from '@new-dashboard/Button'
import Note from '@new-dashboard/Note'
import SaveDiskIcon from '@new-dashboard/SaveDiskIcon'
import { preprocessMath } from '@/utils/markdown'
import Tooltip from '@/components/Tooltip'
import LocaleDateTime from '@/components/LocaleDateTime'
import ModalCheckout from '@/components/ModalCheckout'
import SkillListIcon from '@/components/SkillListIcon'
import {
    RobotAnimation,
    RobotAnimationCongrats,
    RobotAnimationThinking,
    RobotAnimationTraining,
} from '@/components/RobotAnimation'
import { openAiErrorMessage } from '@/lib/openai-error-message'
import { parseSkillIdFromBotAppAsPath } from '@/lib/botRoutes'
import { buildBindingsHelpPrompt } from '@/lib/skills-bindings-help'
import { formatSkillNameDisplay, normalizeSkillName } from '@/lib/skill-name-normalize'
import { buildSkillsBuilderUsageTooltip } from '@/lib/skills-agent-usage'
import {
    filterSkillsLibrary,
    SKILLS_LIBRARY_AUDIENCE_ALL,
    SKILLS_LIBRARY_AUDIENCE_CUSTOMER,
    SKILLS_LIBRARY_AUDIENCE_INTERNAL,
    SKILLS_LIBRARY_CAPABILITY_ALL,
    SKILLS_LIBRARY_CAPABILITY_EXECUTABLE,
    SKILLS_LIBRARY_CAPABILITY_MARKDOWN,
} from '@/lib/skills-library-ui'
import {
    createSkillsBuilderChatCache,
    readSkillsBuilderChatCache,
} from '@/lib/skills-builder-chat-cache'
import {
    buildSkillTestFinalMarkdown,
    buildSkillTestReportPrompt,
    createInitialSkillTestState,
    getMissingSkillTestEnvironmentBindings,
    hasMissingSkillTestEnvironmentBindings,
    normalizeMetadataBindings,
    reduceSkillTestStreamEvent,
    SKILL_TEST_MODEL,
    SKILL_TEST_REASONING_EFFORT,
    skillDraftHasCallableFunctions,
    skillTestEventsToAssistantParts,
} from '@/lib/skill-test-agent-ui'
import { auth } from '@/config/firebase-ui.config'
import { checkPlanPermission, isSuperAdmin } from '@/utils/helpers'
import { useAuthState } from 'react-firebase-hooks/auth'
import { useBlockingNavigationWarning } from '@/hooks/useUnsavedChangesWarning'
import { diffLines, diffWordsWithSpace } from 'diff'

/** useLayoutEffect warns on SSR; use useEffect on the server (effects still do not run until mount). */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

const DETAIL_TABS = [
    { id: 'builder', title: 'Builder' },
    { id: 'advanced', title: 'Advanced details' },
    { id: 'logs', title: 'Logs' },
]

/** Rotating placeholders for the new-skill intent field (cycled every three seconds while the composer is open). */
const CREATE_SKILL_INTENT_PLACEHOLDERS = [
    'e.g. Look up invoices for a customer and summarize what they owe.',
    'e.g. Search our database and return the three most relevant articles for the user’s question.',
    'e.g. Create or update a CRM record for the customer from the conversation so our team can follow up.',
    'e.g. When a chat looks like a support escalation, draft a ticket with context and submit it to our help desk.',
    'e.g. Post a Slack notification when the user asks about pricing, security reviews, or custom enterprise deals.',
    'e.g. Pull open GitHub issues labeled bug from a repo and draft a short triage summary.',
    'e.g. Given an order ID, fetch shipment status from our carrier API and explain any delays.',
    'e.g. Read a pasted CSV of leads and suggest which to contact first, with one-line reasons.',
    'e.g. Turn meeting notes into a checklist of action items with owners and due dates.',
    'e.g. Check our REST inventory endpoint and say whether we can fulfill a SKU in the next 48 hours.',
    'e.g. Draft a polite follow-up email when someone abandons checkout, using our tone guidelines.',
    'e.g. Parse an uploaded PDF contract and list key dates, parties, and termination clauses.',
    'e.g. Call our status page JSON and tell the user if any incidents affect their region.',
    'e.g. Rewrite user questions into on-brand marketing copy for landing pages—no APIs, just our voice and positioning rules.',
    'e.g. Suggest social post angles and hooks for a product launch using only the messaging in our approved brief.',
    'e.g. Answer competitive questions with factual, approved talking points from our battlecard—instructions only, no code.',
    'e.g. Help reps explain our pricing tiers in plain language using the FAQ and policy snippets we provide in the skill.',
]

const defaultDraftState = {
    name: '',
    audience: 'customer',
    draft: null,
}

const SKILL_DRAFT_MISSING_USER_MESSAGE =
    'This skill draft is no longer available. It may have been deleted or the link is out of date.'

function isSkillDraftMissingError(error) {
    const msg = String(error?.message || '').toLowerCase()
    return msg.includes('skill draft not found')
}

/** Default skill audience from bot privacy: private bots default to internal; public bots default to customer-facing. */
function defaultSkillAudienceForBot(bot) {
    if (bot?.privacy === 'private') return 'internal'
    return 'customer'
}

function formatBuilderLogValue(value) {
    if (value == null) return ''
    if (typeof value === 'string') return value.trim()
    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return String(value)
    }
}

function formatRedirectLogValue(value) {
    return typeof value === 'string' && value.trim() ? value.trim() : 'Unknown'
}

const LIVE_REFRESH_TOOL_NAMES = new Set([
    'update_manifest',
    'test_skill_remote',
    'validate_skill_bundle',
    'publish_skill_bundle',
])
const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
]

/** Skills builder: same Streamdown rehype stack as default but without rehype-harden URL prefix filtering. */
const skillsBuilderRehypePlugins = [
    defaultRehypePlugins.raw,
    defaultRehypePlugins.sanitize,
    defaultRehypePlugins.katex,
]

/** Skills builder chat: compact dashboard type (Streamdown → prose). Default `prose` is ~16px with loose lists. */
const SKILLS_BUILDER_MARKDOWN_PROSE =
    'prose prose-sm max-w-none text-gray-800 leading-normal prose-pre:my-0 prose-p:my-1.5 prose-headings:my-1.5 prose-headings:font-semibold prose-h1:text-lg prose-h2:text-base prose-h3:text-sm prose-ul:my-1 prose-ol:my-1 prose-li:leading-snug [&_li>p]:my-0 [&_ul>li+li]:mt-0.5 [&_ol>li+li]:mt-0.5 [&_li_ul]:mt-0.5 [&_li_ol]:mt-0.5'

/** Cap width; bubbles use `w-fit` so short messages stay narrow. */
const BUILDER_CHAT_BUBBLE_MAX_W = 'max-w-[calc(100%-1.5rem)]'
/** Assistant text bubbles: gutter biased left (more `ml`). Spacing 2+4 = 1.5rem total horizontal inset. */
const BUILDER_CHAT_BUBBLE_INSET_ASSISTANT = `ml-2 mr-4 min-w-0 w-fit ${BUILDER_CHAT_BUBBLE_MAX_W}`
/** User bubbles: gutter biased right (more `mr`); use with a `justify-end` row so the block sits on the right. */
const BUILDER_CHAT_BUBBLE_INSET_USER = `ml-4 mr-2 min-w-0 w-fit ${BUILDER_CHAT_BUBBLE_MAX_W}`
/** Assistant UI that should span the chat row (forms, placeholders). */
const BUILDER_CHAT_BUBBLE_WIDE_ASSISTANT = `ml-2 mr-4 min-w-0 w-full ${BUILDER_CHAT_BUBBLE_MAX_W}`

/** Last assistant message: client-side `ask_user_questions` tool awaiting UI (input streaming or form). */
function getAskUserQuestionsUiState(messages) {
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant') return { phase: 'none' }
    let loading = null
    let available = null
    for (const part of last.parts || []) {
        if (part.type !== 'tool-ask_user_questions') continue
        if (part.state === 'input-streaming') loading = part
        if (part.state === 'input-available') available = part
    }
    if (available) return { phase: 'form', part: available }
    if (loading) return { phase: 'loading', part: loading }
    return { phase: 'none' }
}

/** Hydrate selections from tool output for read-only “submitted” display. */
function deriveAskUserSelectionsFromOutput(output, questions) {
    const mcSingle = {}
    const mcMulti = {}
    const openText = {}
    const answers = Array.isArray(output?.answers) ? output.answers : []
    for (const a of answers) {
        if (!a || typeof a !== 'object') continue
        const qid = a.questionId
        if (a.kind === 'multiple_choice' && Array.isArray(a.selectedOptionIds)) {
            const q = questions.find((x) => x.id === qid)
            if (q?.kind === 'multiple_choice' && q.allowMultiple) {
                mcMulti[qid] = [...a.selectedOptionIds]
            } else {
                mcSingle[qid] = a.selectedOptionIds[0]
            }
        } else if (a.kind === 'open_ended' && typeof a.text === 'string') {
            openText[qid] = a.text
        }
    }
    return { mcSingle, mcMulti, openText }
}

function SkillsBuilderAskUserQuestionsForm({
    part,
    addToolOutput,
    chatStarted,
    readOnly = false,
    onBeforeSubmitAnswers,
}) {
    const input = part?.input
    const questions = useMemo(() => (Array.isArray(input?.questions) ? input.questions : []), [input?.questions])
    const intro = typeof input?.intro === 'string' ? input.intro.trim() : ''

    const [mcSingle, setMcSingle] = useState({})
    const [mcMulti, setMcMulti] = useState({})
    const [openText, setOpenText] = useState({})
    const [error, setError] = useState(null)

    const submittedSelections = useMemo(
        () => (readOnly ? deriveAskUserSelectionsFromOutput(part?.output, questions) : null),
        [readOnly, part?.output, questions],
    )

    useEffect(() => {
        if (readOnly) return
        setMcSingle({})
        setMcMulti({})
        setOpenText({})
        setError(null)
    }, [part?.toolCallId, readOnly])

    const controlsDisabled = readOnly || !chatStarted

    const validateAndSubmit = () => {
        if (readOnly) return
        setError(null)
        const answers = []
        for (const q of questions) {
            if (q.kind === 'multiple_choice') {
                const multi = Boolean(q.allowMultiple)
                if (multi) {
                    const ids = Array.isArray(mcMulti[q.id]) ? mcMulti[q.id] : []
                    if (ids.length === 0) {
                        setError('Please select at least one option for each question.')
                        return
                    }
                    answers.push({
                        questionId: q.id,
                        kind: 'multiple_choice',
                        selectedOptionIds: ids,
                    })
                } else {
                    const sel = mcSingle[q.id]
                    if (!sel) {
                        setError('Please select an option for each question.')
                        return
                    }
                    answers.push({
                        questionId: q.id,
                        kind: 'multiple_choice',
                        selectedOptionIds: [sel],
                    })
                }
            } else if (q.kind === 'open_ended') {
                const text = String(openText[q.id] ?? '').trim()
                if (!text && !q.optional) {
                    setError('Please answer each required question.')
                    return
                }
                answers.push({
                    questionId: q.id,
                    kind: 'open_ended',
                    text,
                })
            }
        }

        onBeforeSubmitAnswers?.()
        addToolOutput({
            tool: 'ask_user_questions',
            toolCallId: part.toolCallId,
            output: { answers },
        })
    }

    return (
        <div
            className={clsx(
                'rounded-md border border-gray-200 bg-white text-left shadow-sm sm:rounded-lg',
                BUILDER_CHAT_BUBBLE_WIDE_ASSISTANT,
            )}
        >
            <div className="space-y-4 p-5 text-start sm:p-6 sm:px-8">
            {intro ? (
                <p className="text-sm text-gray-700" dir="auto">
                    {intro}
                </p>
            ) : null}
            <div className="space-y-5">
                {questions.map((q) => {
                    if (q.kind === 'multiple_choice') {
                        const multi = Boolean(q.allowMultiple)
                        return (
                            <fieldset key={q.id} className="min-w-0 space-y-2">
                                <legend className="text-sm font-medium text-gray-900">{q.prompt}</legend>
                                <div className="flex flex-wrap gap-2">
                                    {q.options.map((opt) => {
                                        const selected = readOnly
                                            ? multi
                                                ? (submittedSelections.mcMulti[q.id] || []).includes(opt.id)
                                                : submittedSelections.mcSingle[q.id] === opt.id
                                            : multi
                                              ? (mcMulti[q.id] || []).includes(opt.id)
                                              : mcSingle[q.id] === opt.id
                                        return (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                disabled={controlsDisabled}
                                                onClick={() => {
                                                    setError(null)
                                                    if (multi) {
                                                        setMcMulti((prev) => {
                                                            const cur = new Set(prev[q.id] || [])
                                                            if (cur.has(opt.id)) cur.delete(opt.id)
                                                            else cur.add(opt.id)
                                                            return { ...prev, [q.id]: [...cur] }
                                                        })
                                                    } else {
                                                        setMcSingle((prev) => ({ ...prev, [q.id]: opt.id }))
                                                    }
                                                }}
                                                className={clsx(
                                                    'rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors',
                                                    !readOnly &&
                                                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1',
                                                    selected
                                                        ? 'border-cyan-600 bg-cyan-50 text-cyan-950 shadow-sm'
                                                        : readOnly
                                                          ? 'border-gray-200 bg-gray-100/80 text-gray-500'
                                                          : 'border-cyan-600 bg-white text-cyan-800 hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-900 active:bg-cyan-100/80',
                                                    controlsDisabled && !readOnly && 'cursor-not-allowed opacity-50',
                                                    readOnly && 'cursor-default',
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </fieldset>
                        )
                    }
                    if (q.kind === 'open_ended') {
                        const openValue = readOnly
                            ? (submittedSelections.openText[q.id] ?? '')
                            : (openText[q.id] ?? '')
                        return (
                            <div key={q.id} className="space-y-2">
                                <label
                                    className="block text-sm font-medium text-gray-900"
                                    htmlFor={`skills-builder-ask-open-${part?.toolCallId}-${q.id}`}
                                >
                                    {q.prompt}
                                    {q.optional ? (
                                        <span className="ml-1 font-normal text-gray-500">(optional)</span>
                                    ) : null}
                                </label>
                                <textarea
                                    id={`skills-builder-ask-open-${part?.toolCallId}-${q.id}`}
                                    name={`skills-builder-ask-open-${part?.toolCallId}-${q.id}`}
                                    rows={3}
                                    maxLength={2000}
                                    disabled={!readOnly && controlsDisabled}
                                    readOnly={readOnly}
                                    placeholder={q.placeholder || ''}
                                    value={openValue}
                                    onChange={(e) => {
                                        setError(null)
                                        setOpenText((prev) => ({ ...prev, [q.id]: e.target.value }))
                                    }}
                                    className={clsx(
                                        'text-md block w-full resize-y rounded-lg border border-gray-300 px-3 py-2 outline-none ring-0',
                                        readOnly
                                            ? 'cursor-default bg-white text-gray-800'
                                            : 'focus:border-cyan-600 disabled:opacity-50',
                                    )}
                                />
                            </div>
                        )
                    }
                    return null
                })}
            </div>
            {error && !readOnly ? <p className="text-sm text-red-600">{error}</p> : null}
            {!readOnly ? (
                <div className="flex justify-end pt-1">
                    <Button
                        type="button"
                        theme="blue"
                        label="Submit answers"
                        className="hover:bg-cyan-50"
                        onClick={validateAndSubmit}
                        disabled={controlsDisabled}
                    />
                </div>
            ) : null}
            </div>
        </div>
    )
}

/** Safe text for React children from API / model payloads (never render plain objects). */
function displayText(value, fallback = '—') {
    if (value == null || value === '') return fallback
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return fallback
}

function skillListDescription(value) {
    if (typeof value !== 'string') return ''
    return value.trim()
}

function alertString(value) {
    if (value == null || value === '') return null
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    return 'Something went wrong.'
}

/** Omitted from skill file listings (generated output, not authored source). */
function isHiddenCompiledArtifact(path) {
    return String(path || '').replace(/^\/+/, '') === '.docsbot/bundle/index.js'
}

const SKILL_FILE_BINARY_PREFIX = '[Binary or non-UTF8 content,'
const SKILL_FILE_SKIPPED_PREFIX = '[Skipped: object is'

function isSkillFileBinaryOrSkippedPlaceholder(content) {
    const s = String(content ?? '')
    return s.startsWith(SKILL_FILE_BINARY_PREFIX) || s.startsWith(SKILL_FILE_SKIPPED_PREFIX)
}

/** True when R2 layer stored a placeholder (binary, non-UTF8, or over max preview size). */
function isSkillFileNonTextForUi(file) {
    return Boolean(file?.truncated) || isSkillFileBinaryOrSkippedPlaceholder(file?.content)
}

/** Line count without `split` (avoids huge allocations on large text). Empty file → 0 lines. */
function countLinesInSkillTextContentSafe(content) {
    const s = String(content ?? '')
    if (s.length === 0) return 0
    let n = 0
    for (let i = 0; i < s.length; i++) {
        if (s.charCodeAt(i) === 10) n++
    }
    return n + 1
}

/**
 * Total lines for file list badges. Non-text placeholders → Binary / Large (no fake line count).
 * @returns {{ kind: 'lines', lines: number } | { kind: 'nonText', label: string }}
 */
function getSkillFileLineTotalLabel(file) {
    if (!file) {
        return { kind: 'lines', lines: 0 }
    }
    if (isSkillFileNonTextForUi(file)) {
        const isLarge = String(file.content ?? '').startsWith(SKILL_FILE_SKIPPED_PREFIX)
        return { kind: 'nonText', label: isLarge ? 'Large' : 'Binary' }
    }
    return { kind: 'lines', lines: countLinesInSkillTextContentSafe(file.content) }
}

function skillFileLineCountNavSuffix(lineLabel) {
    if (lineLabel.kind === 'nonText') {
        return (
            <span className="shrink-0 text-xs font-medium text-gray-500">{lineLabel.label}</span>
        )
    }
    const n = lineLabel.lines
    return (
        <span className="shrink-0 text-xs text-gray-500">
            <span className="font-mono tabular-nums">{n.toLocaleString()}</span>
            <span className="font-sans">{` ${n === 1 ? 'line' : 'lines'}`}</span>
        </span>
    )
}

function sortSkillFilesSkillMdFirst(files) {
    const list = Array.isArray(files) ? [...files] : []
    const isSkillMd = (p) => {
        const n = String(p || '').replace(/^\/+/, '').toLowerCase()
        return n === 'skill.md' || n.endsWith('/skill.md')
    }
    list.sort((a, b) => {
        const ap = a?.path
        const bp = b?.path
        const aFirst = isSkillMd(ap)
        const bFirst = isSkillMd(bp)
        if (aFirst !== bFirst) return aFirst ? -1 : 1
        return String(ap || '').localeCompare(String(bp || ''), undefined, { sensitivity: 'base' })
    })
    return list
}

function isScriptLikeFile(path) {
    const normalized = String(path || '').replace(/^\/+/, '')
    return (
        normalized.startsWith('scripts/') ||
        /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(normalized)
    )
}

function codeLanguageForPath(path) {
    const normalized = String(path || '').toLowerCase()
    if (normalized.endsWith('.tsx')) return 'tsx'
    if (normalized.endsWith('.ts')) return 'typescript'
    if (normalized.endsWith('.jsx')) return 'jsx'
    if (normalized.endsWith('.mjs') || normalized.endsWith('.cjs') || normalized.endsWith('.js')) {
        return 'javascript'
    }
    return ''
}

function isMarkdownSkillPath(path) {
    return /\.md$/i.test(String(path || '').replace(/^\/+/, ''))
}

function isTypeScriptLikePath(path) {
    const n = String(path || '').toLowerCase()
    return n.endsWith('.ts') || n.endsWith('.tsx')
}

/** Word-level diff for markdown: published → draft. */
function SkillFileWordInlineDiff({ publishedText, draftText }) {
    const spans = useMemo(() => {
        const parts = diffWordsWithSpace(publishedText ?? '', draftText ?? '')
        return parts.map((part, i) => {
            if (part.added) {
                return { key: i, className: 'bg-emerald-100/90 text-emerald-950', text: part.value }
            }
            if (part.removed) {
                return {
                    key: i,
                    className: 'bg-rose-100/90 text-rose-950 line-through decoration-rose-700/70',
                    text: part.value,
                }
            }
            return { key: i, className: 'text-gray-800', text: part.value }
        })
    }, [publishedText, draftText])

    return (
        <div className="whitespace-pre-wrap break-words font-sans text-xs leading-relaxed">
            {spans.map((s) => (
                <span key={s.key} className={s.className}>
                    {s.text}
                </span>
            ))}
        </div>
    )
}

/** Inline line diff with old/new line numbers (published = old, draft = new). */
function SkillFileLineInlineDiff({ publishedText, draftText, filePath }) {
    const rows = useMemo(() => {
        const parts = diffLines(publishedText ?? '', draftText ?? '')
        const out = []
        let oldLine = 1
        let newLine = 1
        parts.forEach((part, partIdx) => {
            if (part.value === '') return
            const trailingNl = part.value.endsWith('\n')
            const lines = part.value.split('\n')
            lines.forEach((line, lineIdx) => {
                const isLast = lineIdx === lines.length - 1
                if (isLast && line === '' && trailingNl) return
                const rowCls = part.added
                    ? 'bg-emerald-50 text-emerald-950'
                    : part.removed
                      ? 'bg-rose-50 text-rose-950'
                      : 'bg-white text-gray-800'
                if (part.removed) {
                    out.push({
                        key: `${partIdx}-${lineIdx}`,
                        oldNum: oldLine++,
                        newNum: null,
                        rowCls,
                        line,
                    })
                } else if (part.added) {
                    out.push({
                        key: `${partIdx}-${lineIdx}`,
                        oldNum: null,
                        newNum: newLine++,
                        rowCls,
                        line,
                    })
                } else {
                    out.push({
                        key: `${partIdx}-${lineIdx}`,
                        oldNum: oldLine++,
                        newNum: newLine++,
                        rowCls,
                        line,
                    })
                }
            })
        })
        return out
    }, [publishedText, draftText])

    return (
        <div
            className={clsx(
                'overflow-x-auto font-mono leading-relaxed',
                // Match Streamdown code blocks (`pre` uses `text-sm` in node_modules/streamdown)
                isTypeScriptLikePath(filePath) ? 'text-sm' : 'text-xs',
            )}
        >
            <div className="min-w-max">
                {rows.map((row) => (
                    <div
                        key={row.key}
                        className={clsx('flex min-w-0 items-stretch py-0.5', row.rowCls)}
                    >
                        <span
                            className="w-10 shrink-0 self-stretch select-none border-r border-gray-100 py-0.5 pr-2 text-right tabular-nums text-gray-400"
                            aria-hidden
                        >
                            {row.oldNum != null ? row.oldNum : ''}
                        </span>
                        <span
                            className="w-10 shrink-0 self-stretch select-none border-r border-gray-200 py-0.5 pr-2 text-right tabular-nums text-gray-400"
                            aria-hidden
                        >
                            {row.newNum != null ? row.newNum : ''}
                        </span>
                        <span className="min-w-0 flex-1 self-stretch whitespace-pre-wrap py-0.5 pl-0.5 pr-1">
                            {row.line}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

function SkillFileInlineDiff({ publishedText, draftText, filePath }) {
    if (isMarkdownSkillPath(filePath)) {
        return <SkillFileWordInlineDiff publishedText={publishedText} draftText={draftText} />
    }
    return (
        <SkillFileLineInlineDiff
            publishedText={publishedText}
            draftText={draftText}
            filePath={filePath}
        />
    )
}

function mergeDraftPublishedFilePaths(draftPkg, publishedPkg) {
    const paths = new Set()
    for (const f of draftPkg?.files || []) {
        if (f?.path && !isHiddenCompiledArtifact(f.path)) paths.add(f.path)
    }
    for (const f of publishedPkg?.files || []) {
        if (f?.path && !isHiddenCompiledArtifact(f.path)) paths.add(f.path)
    }
    return sortSkillFilesSkillMdFirst([...paths].map((path) => ({ path })))
}

function getSkillPackageFileEntry(pkg, path) {
    return (pkg?.files || []).find((x) => x.path === path) || null
}

function getSkillPackageFileContent(pkg, path) {
    const f = getSkillPackageFileEntry(pkg, path)
    return f != null ? String(f.content ?? '') : ''
}

/** True when at least one non-artifact file body differs between draft and published. */
function skillPackagesHaveDraftPublishedFileDiff(draftPkg, publishedPkg) {
    if (!draftPkg?.configured || !publishedPkg?.configured) return false
    const fileEntries = mergeDraftPublishedFilePaths(draftPkg, publishedPkg)
    for (const { path } of fileEntries) {
        if (getSkillPackageFileContent(publishedPkg, path) !== getSkillPackageFileContent(draftPkg, path)) {
            return true
        }
    }
    return false
}

function skillDiffFileSectionId(path) {
    return `skill-diff-file-${encodeURIComponent(path)}`
}

function skillPreviewFileSectionId(path) {
    return `skill-preview-file-${encodeURIComponent(path)}`
}

function BuilderSkillFilesDiffPreview({ draftPkg, publishedPkg }) {
    const [collapsedPaths, setCollapsedPaths] = useState({})

    const fileEntries = useMemo(() => {
        if (!draftPkg || !publishedPkg) return []
        return mergeDraftPublishedFilePaths(draftPkg, publishedPkg)
    }, [draftPkg, publishedPkg])

    const fileDiffRows = useMemo(() => {
        if (!draftPkg || !publishedPkg) return []
        return fileEntries.map(({ path }) => {
            const pub = getSkillPackageFileContent(publishedPkg, path)
            const draft = getSkillPackageFileContent(draftPkg, path)
            const draftEntry = getSkillPackageFileEntry(draftPkg, path)
            const lineLabel = getSkillFileLineTotalLabel(
                draftEntry || { content: draft, truncated: false },
            )
            return { path, pub, draft, lineLabel, identical: pub === draft }
        })
    }, [fileEntries, publishedPkg, draftPkg])

    if (!draftPkg || !publishedPkg) return null

    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-gray-900">Draft vs published</h3>
                <p className="mt-0.5 text-xs text-gray-500">
                    All files are listed. Markdown uses a word-level diff; other files use line-by-line. Green =
                    added, red = removed (published → draft). Line counts are draft totals. Jump to a file from the
                    list below.
                </p>
            </div>
            {draftPkg.configured && fileDiffRows.length > 0 ? (
                <nav
                    aria-label="Skill files in this diff"
                    className="rounded-lg border border-gray-200 bg-white px-2 py-1.5"
                >
                    <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto text-sm">
                        {fileDiffRows.map(({ path, lineLabel }) => {
                            const anchor = skillDiffFileSectionId(path)
                            return (
                                <li key={path}>
                                    <a
                                        href={`#${anchor}`}
                                        className="flex min-w-0 items-center gap-2 px-2 py-1.5 text-left text-gray-800 transition-colors hover:bg-gray-50"
                                        onClick={() => {
                                            setCollapsedPaths((prev) => ({
                                                ...prev,
                                                [path]: false,
                                            }))
                                        }}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-mono text-xs">{path}</span>
                                        {skillFileLineCountNavSuffix(lineLabel)}
                                    </a>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            ) : null}
            {!draftPkg.configured && draftPkg.message ? (
                <Alert title={alertString(draftPkg.message)} type="info" />
            ) : null}
            {!publishedPkg.configured && publishedPkg.message ? (
                <Alert title={alertString(publishedPkg.message)} type="info" />
            ) : null}
            {draftPkg.configured ? (
                <div className="space-y-3">
                    {fileDiffRows.map(({ path, pub, draft, lineLabel, identical }) => {
                        const isCollapsed = Boolean(collapsedPaths[path])
                        return (
                            <div
                                key={path}
                                id={skillDiffFileSectionId(path)}
                                className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 bg-white"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setCollapsedPaths((prev) => ({
                                            ...prev,
                                            [path]: !prev[path],
                                        }))
                                    }
                                    className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100/90"
                                    aria-expanded={!isCollapsed}
                                    aria-controls={`skill-diff-${encodeURIComponent(path)}`}
                                    id={`skill-diff-toggle-${encodeURIComponent(path)}`}
                                >
                                    {isCollapsed ? (
                                        <ChevronRightIcon
                                            className="h-4 w-4 shrink-0 text-gray-500"
                                            aria-hidden
                                        />
                                    ) : (
                                        <ChevronDownIcon
                                            className="h-4 w-4 shrink-0 text-gray-500"
                                            aria-hidden
                                        />
                                    )}
                                    <span className="min-w-0 flex-1 truncate">{path}</span>
                                    {identical ? (
                                        <span className="shrink-0 text-xs font-normal text-gray-400">
                                            No changes
                                        </span>
                                    ) : null}
                                    {skillFileLineCountNavSuffix(lineLabel)}
                                </button>
                                {!isCollapsed ? (
                                    <div
                                        id={`skill-diff-${encodeURIComponent(path)}`}
                                        role="region"
                                        aria-labelledby={`skill-diff-toggle-${encodeURIComponent(path)}`}
                                        className={clsx(
                                            'text-xs text-gray-800',
                                            isMarkdownSkillPath(path) && 'p-2',
                                        )}
                                    >
                                        <SkillFileInlineDiff
                                            filePath={path}
                                            publishedText={pub}
                                            draftText={draft}
                                        />
                                    </div>
                                ) : null}
                            </div>
                        )
                    })}
                </div>
            ) : null}
        </div>
    )
}

function BuilderSkillFilesPreview({ title, subtitle, pkg }) {
    const [collapsedPaths, setCollapsedPaths] = useState({})
    if (!pkg) return null
    const files = sortSkillFilesSkillMdFirst(
        (pkg.files || []).filter((file) => !isHiddenCompiledArtifact(file?.path)),
    )
    return (
        <div className="space-y-3">
            <div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                {subtitle ? <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p> : null}
            </div>
            {!pkg.configured && pkg.message ? (
                <Alert title={alertString(pkg.message)} type="info" />
            ) : null}
            {pkg.configured ? (
                <>
                    {files.length > 0 ? (
                        <nav
                            aria-label="Skill files in this package"
                            className="rounded-lg border border-gray-200 bg-white px-2 py-1.5"
                        >
                            <ul className="max-h-60 divide-y divide-gray-100 overflow-y-auto text-sm">
                                {files.map((file) => {
                                    const anchor = skillPreviewFileSectionId(file.path)
                                    const lineLabel = getSkillFileLineTotalLabel(file)
                                    return (
                                        <li key={file.path}>
                                            <a
                                                href={`#${anchor}`}
                                                className="flex min-w-0 items-center gap-2 px-2 py-1.5 text-left text-gray-800 transition-colors hover:bg-gray-50"
                                                onClick={() => {
                                                    setCollapsedPaths((prev) => ({
                                                        ...prev,
                                                        [file.path]: false,
                                                    }))
                                                }}
                                            >
                                                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                                                    {file.path}
                                                </span>
                                                {skillFileLineCountNavSuffix(lineLabel)}
                                            </a>
                                        </li>
                                    )
                                })}
                            </ul>
                        </nav>
                    ) : null}
                    <div className="space-y-3">
                        {files.map((file) => {
                            const isCollapsed = Boolean(collapsedPaths[file.path])
                            return (
                                <div
                                    key={file.path}
                                    id={skillPreviewFileSectionId(file.path)}
                                    className="scroll-mt-24 overflow-hidden rounded-lg border border-gray-200 bg-white"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setCollapsedPaths((prev) => ({
                                                ...prev,
                                                [file.path]: !prev[file.path],
                                            }))
                                        }
                                        className="flex w-full items-center gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-800 transition-colors hover:bg-gray-100/90"
                                        aria-expanded={!isCollapsed}
                                        aria-controls={`skill-file-${encodeURIComponent(file.path)}`}
                                        id={`skill-file-toggle-${encodeURIComponent(file.path)}`}
                                    >
                                        {isCollapsed ? (
                                            <ChevronRightIcon
                                                className="h-4 w-4 shrink-0 text-gray-500"
                                                aria-hidden
                                            />
                                        ) : (
                                            <ChevronDownIcon
                                                className="h-4 w-4 shrink-0 text-gray-500"
                                                aria-hidden
                                            />
                                        )}
                                        <span className="min-w-0 flex-1 truncate">{file.path}</span>
                                        {skillFileLineCountNavSuffix(getSkillFileLineTotalLabel(file))}
                                    </button>
                                    {!isCollapsed ? (
                                        <div
                                            id={`skill-file-${encodeURIComponent(file.path)}`}
                                            role="region"
                                            aria-labelledby={`skill-file-toggle-${encodeURIComponent(file.path)}`}
                                            className="min-h-0 overflow-x-auto text-xs text-gray-800"
                                        >
                                            {isSkillFileNonTextForUi(file) ? (
                                                <p className="m-0 px-3 py-2 text-xs leading-relaxed text-gray-600">
                                                    {file.content}
                                                </p>
                                            ) : isScriptLikeFile(file.path) ? (
                                                renderToolCodeBlock(
                                                    `\`\`\`${codeLanguageForPath(file.path)}\n${String(file.content || '')}\n\`\`\``,
                                                    { layout: 'skillFilesPreview', filePath: file.path },
                                                )
                                            ) : (
                                                <pre className="m-0 whitespace-pre-wrap rounded-none py-0 pl-2 pr-0 text-xs text-gray-800">
                                                    {file.content}
                                                </pre>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                            )
                        })}
                    </div>
                </>
            ) : null}
        </div>
    )
}

function getToolPartName(part) {
    if (!part?.type?.startsWith('tool-')) return null
    return part.type.replace(/^tool-/, '')
}

function isCompletedToolPart(part) {
    return (
        part?.output !== undefined ||
        part?.result !== undefined ||
        part?.errorText !== undefined ||
        ['output-available', 'output', 'result', 'completed', 'error'].includes(part?.state)
    )
}

/** Drives the small builder-header mascot from chat transport + latest assistant parts. */
function resolveBuilderChatRobotVariant(messages, status) {
    const last = messages[messages.length - 1]
    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')

    if (status === 'submitted') return 'thinking'

    if (status === 'streaming') {
        const parts = lastAssistant?.parts || []
        const lastPart = parts[parts.length - 1]
        if (lastPart?.type?.startsWith('tool-') && !isCompletedToolPart(lastPart)) {
            return 'tools'
        }
        return 'thinking'
    }

    if (status === 'ready' && last?.role === 'assistant') {
        const parts = last.parts || []
        const lastPart = parts[parts.length - 1]
        if (lastPart?.type?.startsWith('tool-') && isCompletedToolPart(lastPart)) {
            const toolName = getToolPartName(lastPart)
            const hadError =
                lastPart?.errorText != null ||
                lastPart?.state === 'error' ||
                lastPart?.output?.validation?.valid === false
            if (!hadError && toolName && LIVE_REFRESH_TOOL_NAMES.has(toolName)) {
                return 'success'
            }
        }
    }

    return 'idle'
}

function getPartText(part) {
    const raw = part?.text ?? part?.reasoning
    if (raw == null) return ''
    if (typeof raw === 'string') return raw.trim()
    if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw).trim()
    return ''
}

function stripTrailingMarkdownMarkers(text) {
    return String(text || '')
        .replace(/\*+$/, '')
        .replace(/_+$/, '')
        .replace(/#+$/, '')
        .trim()
}

/** Drop the first line when it is a bold markdown title (already echoed in the Thought summary). */
function stripFirstBoldHeaderLine(text) {
    const lines = String(text || '').split('\n')
    if (!lines.length) return text
    const first = lines[0].trim()
    if (/^\*\*.+\*\*/.test(first)) {
        return lines.slice(1).join('\n').replace(/^\n+/, '')
    }
    return text
}

function reasoningBodyForDisplay(text) {
    return stripFirstBoldHeaderLine(String(text || ''))
}

function getFirstLine(text) {
    const line = String(text || '')
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean)
    if (!line) return ''
    const cleaned = line
        .replace(/^[-*#>\s]+/, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
    return stripTrailingMarkdownMarkers(cleaned)
}

function truncateSingleLine(text, maxLength = 80) {
    const oneLine = String(text || '').replace(/\s+/g, ' ').trim()
    if (!oneLine) return ''
    if (oneLine.length <= maxLength) return oneLine
    return `${oneLine.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function formatToolLabel(part) {
    return (part?.type || '').replace(/^tool-/, '').replace(/-/g, ' ')
}

function stringifyShellCommand(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value, null, 2)
        } catch {
            return String(value)
        }
    }
    return String(value)
}

/** Prefer a real command string; never use JSON dumps of tool output as the "command" label. */
function getShellCommand(part) {
    const input = part?.input || {}
    const output = part?.output ?? part?.result

    const toCommandString = (value) => {
        if (typeof value === 'string' && value.trim()) return value.trim()
        if (Array.isArray(value)) {
            const joined = value
                .filter((item) => typeof item === 'string' && item.trim())
                .join(' ')
                .trim()
            return joined || ''
        }
        if (value && typeof value === 'object') {
            if (typeof value.command === 'string' && value.command.trim()) return value.command.trim()
            if (typeof value.cmd === 'string' && value.cmd.trim()) return value.cmd.trim()
            if (typeof value.script === 'string' && value.script.trim()) return value.script.trim()
        }
        return ''
    }

    const candidates = [
        input?.action?.commands,
        input.command,
        input.cmd,
        input.script,
        input.action?.command,
        input.action?.cmd,
        input.shell_call?.command,
        output?.shell_call?.command,
        output?.shell_call?.cmd,
        Array.isArray(output) && output[0]?.command,
        Array.isArray(output) && output[0]?.cmd,
        output?.command,
        output?.cmd,
    ]

    for (const c of candidates) {
        const parsed = toCommandString(c)
        if (parsed) return parsed
    }

    return ''
}

function normalizeShellOutput(value) {
    if (value === null || value === undefined) return ''
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (typeof value !== 'object') return String(value)

    const out = []
    if (typeof value.stdout === 'string' && value.stdout.trim()) out.push(value.stdout)
    if (typeof value.stderr === 'string' && value.stderr.trim()) out.push(value.stderr)
    if (out.length) return out.join('\n')

    if (typeof value.outputText === 'string') return value.outputText
    if (typeof value.text === 'string') return value.text

    if (value.output !== undefined) {
        const nested = normalizeShellOutput(value.output)
        if (nested) return nested
    }
    if (value.result !== undefined) {
        const nested = normalizeShellOutput(value.result)
        if (nested) return nested
    }
    if (value.content !== undefined) {
        const nested = normalizeShellOutput(value.content)
        if (nested) return nested
    }
    if (value.outcome !== undefined) {
        const nested = normalizeShellOutput(value.outcome)
        if (nested) return nested
    }

    try {
        return JSON.stringify(value, null, 2)
    } catch {
        return ''
    }
}

/** Collect stdout / stderr from shell tool payloads (including arrays of chunks with outcome). */
function collectShellStreams(value) {
    const stdoutParts = []
    const stderrParts = []

    function walk(v) {
        if (v === null || v === undefined) return
        if (typeof v === 'string') {
            stdoutParts.push(v)
            return
        }
        if (typeof v === 'number' || typeof v === 'boolean') {
            stdoutParts.push(String(v))
            return
        }
        if (Array.isArray(v)) {
            v.forEach(walk)
            return
        }
        if (typeof v !== 'object') {
            stdoutParts.push(String(v))
            return
        }
        if (typeof v.errorText === 'string') stderrParts.push(v.errorText)
        if (typeof v.stdout === 'string') stdoutParts.push(v.stdout)
        if (typeof v.stderr === 'string') stderrParts.push(v.stderr)
        if (typeof v.outputText === 'string') stdoutParts.push(v.outputText)
        if (typeof v.text === 'string') stdoutParts.push(v.text)
        if (v.output !== undefined) walk(v.output)
        if (v.result !== undefined) walk(v.result)
        if (v.content !== undefined) walk(v.content)
    }

    walk(value)
    return {
        stdout: stdoutParts.join(''),
        stderr: stderrParts.join(''),
    }
}

function getShellStreams(part) {
    const raw =
        part?.output ??
        part?.result ??
        (typeof part?.errorText === 'string' ? { errorText: part.errorText } : undefined)
    const { stdout, stderr } = collectShellStreams(raw)
    if (stdout.trim() || stderr.trim()) {
        return { stdout, stderr }
    }
    // Do not fall back to normalizeShellOutput(raw): for structured shell output with only
    // empty stdout/stderr, that becomes a JSON.stringify of the whole payload and looks
    // like non-empty "stdout", which wrongly expands the row and fills code blocks.
    if (typeof raw === 'string' && raw.trim()) {
        return { stdout: raw, stderr: '' }
    }
    return { stdout: '', stderr: '' }
}

function getShellOutputBlocks(part) {
    const raw =
        part?.output ??
        part?.result ??
        (typeof part?.errorText === 'string' ? { errorText: part.errorText } : undefined)
    const stdoutBlocks = []
    const stderrBlocks = []

    function pushIfText(target, value) {
        if (typeof value !== 'string') return
        if (!value.trim()) return
        target.push(value)
    }

    function walk(v) {
        if (v === null || v === undefined) return

        if (Array.isArray(v)) {
            v.forEach(walk)
            return
        }

        if (typeof v === 'string') {
            if (v.trim()) stdoutBlocks.push(v)
            return
        }

        if (typeof v !== 'object') return

        let addedFromCurrent = false
        if (typeof v.errorText === 'string' && v.errorText.trim()) {
            stderrBlocks.push(v.errorText)
            addedFromCurrent = true
        }
        if (typeof v.stdout === 'string' && v.stdout.trim()) {
            stdoutBlocks.push(v.stdout)
            addedFromCurrent = true
        }
        if (typeof v.stderr === 'string' && v.stderr.trim()) {
            stderrBlocks.push(v.stderr)
            addedFromCurrent = true
        }
        if (typeof v.outputText === 'string' && v.outputText.trim()) {
            stdoutBlocks.push(v.outputText)
            addedFromCurrent = true
        }
        if (typeof v.text === 'string' && v.text.trim()) {
            stdoutBlocks.push(v.text)
            addedFromCurrent = true
        }

        // When this node contains actual stream text, keep it as a block boundary and
        // avoid recursing into nested payload keys that may duplicate content.
        if (addedFromCurrent) return

        walk(v.output)
        walk(v.result)
        walk(v.content)
    }

    walk(raw)

    if (!stdoutBlocks.length && !stderrBlocks.length && typeof raw === 'string' && raw.trim()) {
        pushIfText(stdoutBlocks, raw)
    }

    return { stdoutBlocks, stderrBlocks }
}

function shellPreviewFromCommand(command, maxLength = 90) {
    const normalized = String(command || '')
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join(' ; ')
    return truncateSingleLine(normalized, maxLength)
}

function getWebSearchAction(part) {
    return part?.output?.action || part?.result?.action || null
}

function getWebSearchSummary(part) {
    const action = getWebSearchAction(part)
    if (action?.type === 'search') {
        const query = action.query || part?.input?.query || part?.output?.query || ''
        return { label: 'Searching web', detail: query }
    }
    if (action?.type === 'openPage') {
        return { label: 'Opening page', detail: action.url || '' }
    }
    if (action?.type === 'findInPage') {
        const detail = [action.url, action.pattern].filter(Boolean).join(' — ')
        return { label: 'Finding in page', detail }
    }
    const fallback = part?.input?.query || part?.output?.query || ''
    return { label: 'Searching web', detail: fallback }
}

function getWebSearchQuery(part) {
    return getWebSearchSummary(part).detail
}

function getApplyPatchOperation(part) {
    return part?.input?.operation || part?.output?.operation || part?.result?.operation || null
}

function getApplyPatchSummary(part) {
    const operation = getApplyPatchOperation(part)
    const path = operation?.path || ''
    if (operation?.type === 'create_file') {
        return path ? `Create file: ${path}` : 'Create file'
    }
    if (operation?.type === 'update_file') {
        return path ? `Update file: ${path}` : 'Update file'
    }
    if (operation?.type === 'delete_file') {
        return path ? `Delete file: ${path}` : 'Delete file'
    }
    return 'Apply patch'
}

function firstNonEmptySkillToolValue(...values) {
    for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim()
        if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    }
    return ''
}

function parseSkillToolJsonValue(value) {
    if (typeof value !== 'string') return value
    const trimmed = value.trim()
    if (!trimmed || !/^[{[]/.test(trimmed)) return value
    try {
        return JSON.parse(trimmed)
    } catch {
        return value
    }
}

function normalizeSkillToolValue(value) {
    const parsed = parseSkillToolJsonValue(value)
    if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        parsed.name &&
        typeof parsed.name === 'object'
    ) {
        return {
            ...parsed.name,
            ...parsed,
            name: parsed.name.name || parsed.name.skillName || parsed.name.skill_name || parsed.name.id,
        }
    }
    return parsed
}

function getSkillToolOutput(part) {
    return part?.output ?? part?.result ?? part?.response ?? null
}

function getSkillToolFunctionName(input = {}) {
    input = normalizeSkillToolValue(input) || {}
    return firstNonEmptySkillToolValue(
        input.functionName,
        input.function_name,
        input.function,
        input['function name'],
        input['function Name'],
        input['function_name'],
        input.name,
        input.tool_name,
        input.call?.name,
        input.call?.functionName,
        input.call?.function_name,
        input.call?.function?.name,
        input.request?.name,
        input.request?.functionName,
        input.request?.function_name,
        input.params?.functionName,
        input.params?.function_name,
        input.args?.functionName,
        input.args?.function_name,
    )
}

function getSkillToolSkillNameFromValue(value) {
    value = normalizeSkillToolValue(value)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (!value || typeof value !== 'object') return ''
    if (Array.isArray(value)) {
        for (const item of value) {
            const next = getSkillToolSkillNameFromValue(item)
            if (next) return next
        }
        return ''
    }
    return firstNonEmptySkillToolValue(
        value.skillName,
        value.skill_name,
        value.skill,
        value.name,
        value.id,
        value.activated_skill,
        value['activated skill'],
        value['skill key'],
        value['skill Key'],
        value.request?.skillName,
        value.request?.skill_name,
    )
}

function getSkillToolSkillName(input = {}, output = null) {
    return (
        getSkillToolSkillNameFromValue(input) ||
        getSkillToolSkillNameFromValue(input.activated_skills) ||
        getSkillToolSkillNameFromValue(input.activatedSkills) ||
        getSkillToolSkillNameFromValue(output) ||
        getSkillToolSkillNameFromValue(output?.activated_skills) ||
        getSkillToolSkillNameFromValue(output?.activatedSkills) ||
        ''
    )
}

function getSkillExecPreview(input = {}) {
    return input.code || input.input || input.query || input.prompt || input.expression || ''
}

function getSkillFunctionNameFromValue(value) {
    value = normalizeSkillToolValue(value)
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (!value || typeof value !== 'object') return ''
    return firstNonEmptySkillToolValue(
        value.functionName,
        value.function_name,
        value['function name'],
        value['function Name'],
        value.name,
        value.id,
        value.tool_name,
        value.schema?.name,
        value.function?.name,
    )
}

function getDescribedSkillFunctionNames(part) {
    const input = normalizeSkillToolValue(part?.input || {}) || {}
    const output = normalizeSkillToolValue(getSkillToolOutput(part)) || {}
    const candidates = [
        output?.functions,
        output?.callable_functions,
        output?.callableFunctions,
        output?.function_names,
        output?.functionNames,
        output?.['function names'],
        output?.['function Names'],
        output?.tools,
        output?.result?.functions,
        output?.data?.functions,
        output?.schema?.functions,
        input.functions,
        input.function_names,
        input.functionNames,
        input['function names'],
        input['function Names'],
        input.name?.function_names,
        input.name?.functionNames,
        input.name?.['function names'],
        input.name?.['function Names'],
    ]
    const names = []
    for (const candidate of candidates) {
        const rows = Array.isArray(candidate) ? candidate : candidate ? Object.values(candidate) : []
        for (const row of rows) {
            const name = getSkillFunctionNameFromValue(row)
            if (name && !names.includes(name)) names.push(name)
        }
    }
    return names
}

function getSkillTestToolSummaryParts(part) {
    const input = part?.input || {}
    const output = getSkillToolOutput(part)
    if (part?.type === 'tool-activate_skill') {
        const skillName = getSkillToolSkillName(input, output)
        return {
            label: 'Activated skill',
            detail: skillName || '',
        }
    }
    if (part?.type === 'tool-describe_skill_functions') {
        const functions = getDescribedSkillFunctionNames(part)
        return {
            label: 'Described skill functions',
            detail: functions.length ? functions.join(', ') : '',
        }
    }
    if (part?.type === 'tool-call_skill_function') {
        const functionName = getSkillToolFunctionName(input)
        return {
            label: 'Called skill function',
            detail: functionName || '',
        }
    }
    return null
}

function summarizeValidationIssue(issue) {
    if (typeof issue === 'string') return truncateSingleLine(issue, 600)
    if (!issue || typeof issue !== 'object') return displayText(issue, '[Invalid validation entry]')

    const path = issue.path || issue.file || issue.filePath || issue.loc || issue.location
    const message = issue.message || issue.error || issue.detail || issue.reason || issue.title
    const code = issue.code || issue.type
    const pieces = []
    if (path) pieces.push(String(path))
    if (code) pieces.push(`[${String(code)}]`)
    if (message) pieces.push(String(message))
    if (pieces.length) return truncateSingleLine(pieces.join(' '), 600)

    try {
        return truncateSingleLine(JSON.stringify(issue), 600)
    } catch {
        return displayText(issue, '[Invalid validation entry]')
    }
}

function getToolSummary(part) {
    const label = formatToolLabel(part)
    const input = part?.input
    const output = part?.output ?? part?.result

    if (part?.type === 'tool-shell') {
        return 'Shell call'
    }

    if (part?.type === 'tool-web_search' || part?.type === 'tool-search') {
        const { label, detail } = getWebSearchSummary(part)
        const text = detail || input?.q || ''
        if (!text) return label
        return text.length > 80 ? `${label}: ${text.slice(0, 77)}…` : `${label}: ${text}`
    }

    if (part?.type === 'tool-apply_patch') {
        return getApplyPatchSummary(part)
    }

    if (part?.type === 'tool-fetch') {
        const url = input?.url
        return url ? `Fetch: ${url}` : `Used ${label}`
    }

    if (part?.type === 'tool-load_context') {
        return 'Read manifest'
    }

    if (part?.type === 'tool-update_manifest') {
        return 'Updated manifest'
    }

    if (part?.type === 'tool-test_skill_remote') {
        const valid = output?.valid ?? output?.validation?.valid
        if (valid === true) return 'Remote test: passed'
        if (valid === false) return 'Remote test: failed'
        return 'Remote test'
    }

    if (part?.type === 'tool-validate_skill_bundle') {
        const valid = output?.ok ?? output?.valid ?? output?.validation?.valid
        if (valid === true) return 'Validate skill: passed'
        if (valid === false) return 'Validate skill: failed'
        return 'Validate skill'
    }

    if (part?.type === 'tool-publish_skill_bundle') {
        const ok = output?.ok
        if (ok === true) return 'Publish skill: published'
        if (ok === false) return 'Publish skill: failed'
        return 'Publish skill'
    }

    if (part?.type === 'tool-activate_skill') {
        const summary = getSkillTestToolSummaryParts(part)
        return summary?.detail ? `${summary.label}: ${summary.detail}` : summary.label
    }

    if (part?.type === 'tool-describe_skill_functions') {
        const summary = getSkillTestToolSummaryParts(part)
        return summary?.detail ? `${summary.label}: ${summary.detail}` : summary.label
    }

    if (part?.type === 'tool-call_skill_function') {
        const summary = getSkillTestToolSummaryParts(part)
        return summary?.detail ? `${summary.label}: ${summary.detail}` : summary.label
    }

    if (part?.type === 'tool-skills_exec') {
        const preview = truncateSingleLine(getSkillExecPreview(input), 72)
        return preview ? `Ran skill code: ${preview}` : 'Ran skill code'
    }

    if (part?.type === 'tool-ask_user_questions') {
        const n = part?.input?.questions?.length
        if (part.state === 'output-available') return 'Your answers were sent to the agent'
        if (part.state === 'input-available') {
            return typeof n === 'number' && n > 0 ? `Questions for you (${n})` : 'Questions for you'
        }
        if (part.state === 'input-streaming') return 'Preparing questions…'
    }

    if (typeof output === 'string' && output.trim()) {
        return `${label}: ${getFirstLine(output) || 'Completed'}`
    }

    return `Used ${label}`
}

function renderMarkdown(text, mode = 'static') {
    return (
        <Streamdown
            mode={mode}
            isAnimating={false}
            remarkPlugins={streamdownRemarkPlugins}
            rehypePlugins={skillsBuilderRehypePlugins}
            showMermaidActions={true}
        >
            {preprocessMath(text || '')}
        </Streamdown>
    )
}

function renderToolCodeBlock(text, options = {}) {
    const skillFilesPreview = options.layout === 'skillFilesPreview'
    const tsStylePreview = skillFilesPreview && isTypeScriptLikePath(options.filePath)
    const skillFilesCodeBlockBodyClass = tsStylePreview
        ? "[&_[data-streamdown='code-block-body']]:rounded-none [&_[data-streamdown='code-block-body']]:py-1.5 [&_[data-streamdown='code-block-body']]:pl-2 [&_[data-streamdown='code-block-body']]:pr-1"
        : "[&_[data-streamdown='code-block-body']]:rounded-none [&_[data-streamdown='code-block-body']]:py-0 [&_[data-streamdown='code-block-body']]:pl-2 [&_[data-streamdown='code-block-body']]:pr-0"
    return (
        <div
            className={clsx(
                !skillFilesPreview && '[&_pre]:max-h-56 [&_pre]:overflow-auto',
                skillFilesPreview && [
                    '[&_pre]:max-h-none [&_pre]:overflow-visible [&_pre]:rounded-none',
                    "[&_[data-streamdown='code-block']]:my-0 [&_[data-streamdown='code-block']]:rounded-none [&_[data-streamdown='code-block']]:border-0",
                    skillFilesCodeBlockBodyClass,
                ],
                // Hide Streamdown code header/language bar in tool-output blocks.
                "[&_[data-streamdown='code-block-header']]:hidden",
                "[&_[data-streamdown='code-header']]:hidden",
                "[&_[data-streamdown='code-block']>header]:hidden",
                "[&_[data-streamdown='code-block']>div:first-child:not(pre)]:hidden",
                '[&_.streamdown-code-header]:hidden',
                '[&_.sd-code-header]:hidden',
            )}
        >
            <Streamdown
                mode="static"
                isAnimating={false}
                remarkPlugins={streamdownRemarkPlugins}
                rehypePlugins={skillsBuilderRehypePlugins}
                showMermaidActions={true}
                controls={{ code: false }}
            >
                {preprocessMath(text || '')}
            </Streamdown>
        </div>
    )
}

/** Matches ChatAgent brain icon for reasoning rows */
function BrainIcon({ className }) {
    return (
        <svg
            viewBox="18 58 115 98"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden
        >
            <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M129.49 114.51C129.121 116.961 128.187 119.293 126.762 121.322C125.337 123.351 123.461 125.021 121.28 126.2C120.676 126.535 120.043 126.816 119.39 127.04C120.22 138.04 102.74 142.04 93.32 139.42L96.82 151.66L87.82 151.98L72.07 129.43C66.76 130.93 60.49 131.65 56.44 125.15C56.0721 124.553 55.7382 123.935 55.44 123.3C54.4098 123.51 53.3614 123.617 52.31 123.62C49.31 123.62 44.31 122.72 41.77 120.96C39.7563 119.625 38.1588 117.75 37.16 115.55C31.75 116.29 27.16 115.02 24.16 111.88C20.36 107.97 19.28 101.51 21.26 94.58C23.87 85.33 31.81 74.91 47.59 71C48.9589 69.2982 50.5972 67.8322 52.44 66.66C62.35 60.31 78.44 59.76 90.65 65.79C95.3836 64.9082 100.27 65.376 104.75 67.14C113.53 70.43 119.91 77.31 121.11 84.3C123.487 85.5317 125.433 87.4568 126.69 89.82C129.32 94.76 129.69 99.71 127.92 103.71C129.587 107.049 130.138 110.835 129.49 114.51ZM123.01 109.31C121.612 110.048 120.056 110.434 118.475 110.434C116.894 110.434 115.338 110.048 113.94 109.31L114.67 104.46C117.75 104.76 120.26 103.8 121.57 101.83C123.04 99.64 122.81 96.39 120.95 92.9C118.87 88.99 114.38 88.37 111.89 88.34H111.73C105.49 88.34 99.13 91.89 96.56 96.52L92.82 94.73C93.5553 92.3449 94.8046 90.15 96.48 88.3C95.0376 87.0754 93.9474 85.4887 93.3217 83.703C92.696 81.9173 92.5574 79.9971 92.92 78.14L96.61 77.8C96.7789 79.302 97.4 80.7172 98.3911 81.8583C99.3822 82.9994 100.697 83.8125 102.16 84.19C105.238 82.8161 108.58 82.1335 111.95 82.19C112.43 82.19 112.89 82.24 113.36 82.27C110.969 78.0312 107.18 74.7545 102.64 73C91.56 68.7 84.09 75.37 82.38 77.67C78.26 83.19 80.9 88.41 82.91 91.8L79.61 94.8C76.736 92.314 74.8075 88.9127 74.15 85.17C69.92 86.44 64.24 86.17 61.06 80.74L64.06 78.68C67.43 81.2 72.78 80.98 75.32 77.87C75.9252 76.4949 76.6905 75.1959 77.6 74C79.044 72.093 80.7864 70.4316 82.76 69.08C74.47 66.82 62.76 67.19 55.68 71.73C53.7668 72.841 52.192 74.4517 51.1244 76.3895C50.0569 78.3274 49.5368 80.5192 49.62 82.73C49.62 86.3 52.42 91.94 56.19 92.82L54 97.07C51.5946 96.5129 49.4109 95.2487 47.73 93.44L44.48 97.58L41.23 96L44.41 87.68C43.8904 86.064 43.624 84.3774 43.62 82.68C43.628 81.3361 43.7687 79.9963 44.04 78.68C34.04 82.81 29.1 89.68 27.29 95.96C25.9 100.79 26.44 105.15 28.72 107.49C30.53 109.35 33.3 109.79 35.91 109.62L42.91 104.17L45.21 106.11L43.13 112.93C44.22 116.4 47.79 118.19 54.3 116.93C54.6375 114.169 55.7272 111.554 57.45 109.37C58.7133 107.552 60.3846 106.056 62.33 105L65.75 95.79L69.17 95.64L68.8 103.19C74.55 102.6 80.98 103.77 86.97 102.87L88.07 106.87C79.29 110.93 70.3 104.31 62.15 113.04C59.22 116.18 60.34 118.91 62.15 121.66C64.76 125.59 69.66 123.23 74.67 121.66C82.26 119.34 87.77 117.66 98.16 118.51C95.68 113.8 95.92 108.11 99.24 101.85L104.13 103.78C100.7 111.69 103.91 116.27 106.13 118.29C109.56 121.41 114.72 122.35 118.13 120.47C119.436 119.749 120.559 118.737 121.412 117.513C122.265 116.289 122.825 114.885 123.05 113.41C123.275 112.051 123.258 110.663 123 109.31H123.01Z"
            />
        </svg>
    )
}

function toolIconForPart(part) {
    const t = part?.type || ''
    if (t === 'tool-shell') return CommandLineIcon
    if (t === 'tool-web_search' || t === 'tool-search') return MagnifyingGlassIcon
    if (t === 'tool-load_context') return DocumentTextIcon
    if (t === 'tool-update_manifest') return PencilSquareIcon
    if (t === 'tool-test_skill_remote') return BeakerIcon
    if (t === 'tool-validate_skill_bundle') return BeakerIcon
    if (t === 'tool-publish_skill_bundle') return ArrowPathIcon
    if (t === 'tool-ask_user_questions') return ChatBubbleLeftRightIcon
    if (t === 'tool-activate_skill') return BoltIcon
    if (t === 'tool-describe_skill_functions') return ListBulletIcon
    if (t === 'tool-call_skill_function') return PlayCircleIcon
    if (t === 'tool-skills_exec') return CodeBracketIcon
    if (t === 'tool-apply_patch') {
        const operation = getApplyPatchOperation(part)
        if (operation?.type === 'create_file') return PlusIcon
        if (operation?.type === 'delete_file') return TrashIcon
        return PencilSquareIcon
    }
    return WrenchScrewdriverIcon
}

function UserMessageBubble({ message, isStreaming, isLatestMessage }) {
    const parts = message.parts || []
    const textParts = parts.filter((p) => p.type === 'text')
    const combined = textParts
        .map((p) => {
            const t = p.text
            if (typeof t === 'string') return t
            if (t == null) return ''
            if (typeof t === 'number' || typeof t === 'boolean') return String(t)
            return ''
        })
        .join('\n\n')
    const isStreamingText = isLatestMessage && isStreaming && textParts.length > 0

    return (
        <div className="mt-4 flex w-full justify-end" data-builder-chat-role="user">
            <div
                className={clsx(
                    'rounded-md bg-teal-50 text-left shadow-sm sm:rounded-lg',
                    BUILDER_CHAT_BUBBLE_INSET_USER,
                )}
            >
                <div
                    dir="auto"
                    className={clsx('p-4 px-5 text-start sm:px-6', SKILLS_BUILDER_MARKDOWN_PROSE)}
                >
                    {combined ? (
                        renderMarkdown(combined, isStreamingText ? 'streaming' : 'static')
                    ) : (
                        <span className="text-sm text-gray-500">…</span>
                    )}
                </div>
            </div>
        </div>
    )
}

function formatWorkedDurationLabel(durationMs) {
    if (durationMs == null || !Number.isFinite(durationMs)) {
        return 'Worked for a while...'
    }
    const totalSec = Math.max(0, Math.floor(durationMs / 1000))
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    if (mins <= 0) {
        return `Worked for ${secs}s...`
    }
    return `Worked for ${mins}m ${secs}s...`
}

function CollapsedAssistantToolCalls({ durationMs, runCostTooltipContent, children }) {
    const [open, setOpen] = useState(false)
    const label = formatWorkedDurationLabel(durationMs)
    const labelInner = runCostTooltipContent ? (
        <Tooltip content={runCostTooltipContent} placement="top">
            <span className="block truncate">{label}</span>
        </Tooltip>
    ) : (
        <span className="block truncate">{label}</span>
    )
    return (
        <div className="space-y-1">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="w-full rounded-md border border-transparent px-2 py-1.5 text-left text-sm text-gray-600 transition-colors hover:border-gray-300"
            >
                <span className="flex items-center justify-between gap-2">
                    <span className="min-w-0 flex-1">{labelInner}</span>
                    <ChevronDownIcon
                        className={clsx(
                            'h-4 w-4 shrink-0 text-gray-500 transition-transform',
                            open && 'rotate-180',
                        )}
                        aria-hidden
                    />
                </span>
            </button>
            {open ? <div className="border-t border-gray-100 pt-2">{children}</div> : null}
        </div>
    )
}

/** Interleave "normal" activity (can collapse) with `ask_user_questions`, which is shown as a separate message. */
function splitActivityPartsForAskMessages(parts) {
    const list = Array.isArray(parts) ? parts : []
    const segments = []
    let i = 0
    while (i < list.length) {
        if (list[i]?.type === 'tool-ask_user_questions') {
            const askParts = []
            while (i < list.length && list[i]?.type === 'tool-ask_user_questions') {
                askParts.push(list[i])
                i += 1
            }
            segments.push({ kind: 'ask_message', parts: askParts })
        } else {
            const activityParts = []
            while (i < list.length && list[i]?.type !== 'tool-ask_user_questions') {
                activityParts.push(list[i])
                i += 1
            }
            if (activityParts.length) {
                segments.push({ kind: 'activity', parts: activityParts })
            }
        }
    }
    return segments
}

function AssistantActivityCollapseSegment({
    parts,
    isStreaming,
    messageDurationMs,
    runCostTooltipContent,
    ...contentProps
}) {
    const hasActivityContent = useMemo(
        () =>
            parts.some(
                (p) =>
                    p.type === 'reasoning' ||
                    (typeof p.type === 'string' && p.type.startsWith('tool-')),
            ),
        [parts],
    )

    /** After the assistant finishes, collapse reasoning + tool rows into one summary (same order as streamed). */
    const shouldCollapseActivity = !isStreaming && hasActivityContent

    if (shouldCollapseActivity) {
        return (
            <CollapsedAssistantToolCalls
                durationMs={messageDurationMs}
                runCostTooltipContent={runCostTooltipContent}
            >
                <AssistantActivityRowsContent
                    {...contentProps}
                    parts={parts}
                    isStreaming={isStreaming}
                />
            </CollapsedAssistantToolCalls>
        )
    }

    return <AssistantActivityRowsContent {...contentProps} parts={parts} isStreaming={isStreaming} />
}

/** White card, same family as `AssistantTextBubble`, wide enough for the MCQ form. */
function AssistantAskUserQuestionsMessageBubble({ children }) {
    return (
        <div
            className={clsx(
                'rounded-md border border-gray-200 bg-white text-left shadow-sm sm:rounded-lg',
                BUILDER_CHAT_BUBBLE_WIDE_ASSISTANT,
            )}
        >
            <div className="p-5 sm:p-6 sm:px-8">{children}</div>
        </div>
    )
}

function AssistantActivityRows(props) {
    const { parts, isStreaming, messageDurationMs, runCostTooltipContent, message, ...contentProps } = props
    const segments = useMemo(() => splitActivityPartsForAskMessages(parts), [parts])

    if (segments.length === 0) {
        return null
    }

    return (
        <div className="space-y-1">
            {segments.map((seg, segIndex) => {
                if (seg.kind === 'ask_message') {
                    return (
                        <div key={`${message.id}-ask-msg-${segIndex}`}>
                            <AssistantAskUserQuestionsMessageBubble>
                                <AssistantActivityRowsContent
                                    message={message}
                                    parts={seg.parts}
                                    isStreaming={isStreaming}
                                    {...contentProps}
                                />
                            </AssistantAskUserQuestionsMessageBubble>
                        </div>
                    )
                }
                return (
                    <AssistantActivityCollapseSegment
                        key={`${message.id}-act-seg-${segIndex}`}
                        parts={seg.parts}
                        isStreaming={isStreaming}
                        messageDurationMs={messageDurationMs}
                        runCostTooltipContent={runCostTooltipContent}
                        message={message}
                        {...contentProps}
                    />
                )
            })}
        </div>
    )
}

function AssistantActivityRowsContent({
    message,
    parts,
    isLatestMessage,
    isStreaming,
    addToolOutput,
    chatStarted,
    onStopComposer,
    onBeforeSubmitAnswers,
}) {
    const allParts = useMemo(() => message.parts || [], [message.parts])
    const lastReasoningIndex = allParts.reduce((acc, p, i) => (p.type === 'reasoning' ? i : acc), -1)
    const [expandedRows, setExpandedRows] = useState({})

    useEffect(() => {
        // Reset manual row expansion when this is a different assistant message.
        setExpandedRows({})
    }, [message.id])

    const getRowKey = useCallback(
        (part, index) => {
            const globalIndex = allParts.indexOf(part)
            return `${message.id}-${globalIndex}-${part.type || 'part'}-${part.toolCallId || part.callId || index}`
        },
        [allParts, message.id],
    )

    const isRowExpanded = useCallback(
        (rowKey) => Boolean(expandedRows[rowKey]),
        [expandedRows],
    )

    const toggleRowExpanded = useCallback((rowKey) => {
        setExpandedRows((prev) => ({
            ...prev,
            [rowKey]: !prev[rowKey],
        }))
    }, [])

    return (
        <div className="space-y-0.5 text-sm text-gray-600">
            {parts.map((part, index) => {
                const globalIndex = allParts.indexOf(part)
                const isLatestPart = isLatestMessage && globalIndex === allParts.length - 1
                const rowKey = getRowKey(part, index)
                const hasFutureEvent = globalIndex < allParts.length - 1

                if (part.type === 'reasoning') {
                    const reasoningText = getPartText(part)
                    const isThinkingPlaceholder =
                        !reasoningText && isStreaming && globalIndex === lastReasoningIndex
                    const title = getFirstLine(reasoningText) || 'Thought'
                    const body = reasoningBodyForDisplay(reasoningText)
                    const canExpand = Boolean(body)
                    const isExpanded = canExpand && isRowExpanded(rowKey)

                    if (!reasoningText && hasFutureEvent) {
                        return null
                    }

                    if (isThinkingPlaceholder) {
                        return (
                            <div
                                key={`${message.id}-reasoning-${index}`}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100"
                            >
                                <ActivityTimelineIcon>
                                    <BrainIcon
                                        className={clsx('h-4 w-4 text-gray-400', isStreaming && 'animate-pulse')}
                                    />
                                </ActivityTimelineIcon>
                                <span className="font-medium text-gray-500">Thinking...</span>
                            </div>
                        )
                    }

                    return (
                        <div
                            key={`${message.id}-reasoning-${index}`}
                            className={clsx(
                                'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                isExpanded ? 'items-start' : 'items-center',
                            )}
                        >
                            <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                <BrainIcon className="h-4 w-4 text-gray-400" />
                            </ActivityTimelineIcon>
                            <div className="min-w-0 flex-1 text-gray-700 [&_p]:text-left [&_*]:text-left">
                                <button
                                    type="button"
                                    className={clsx(
                                        'flex w-full items-center gap-2 rounded text-left',
                                        canExpand && 'hover:text-gray-900',
                                    )}
                                    onClick={() => {
                                        if (canExpand) toggleRowExpanded(rowKey)
                                    }}
                                >
                                    <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                        {title}
                                    </span>
                                    {canExpand ? (
                                        isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )
                                    ) : (
                                        <span className="inline-block h-3.5 w-3.5 shrink-0" aria-hidden />
                                    )}
                                </button>
                                {isExpanded ? (
                                    <div className="mt-1">
                                        {renderMarkdown(
                                            body,
                                            isLatestPart && isStreaming ? 'streaming' : 'static',
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                }

                if (part.type?.startsWith('tool-')) {
                    const toolSummary = getToolSummary(part)
                    const skillTestToolSummary = getSkillTestToolSummaryParts(part)
                    const isShell = part.type === 'tool-shell'
                    const isWebSearch = part.type === 'tool-web_search' || part.type === 'tool-search'
                    const shellCommand = getShellCommand(part)
                    const { stdout: shellStdout, stderr: shellStderr } = getShellStreams(part)
                    const { stdoutBlocks: shellStdoutBlocks, stderrBlocks: shellStderrBlocks } =
                        getShellOutputBlocks(part)
                    const webSources = part?.output?.sources || part?.result?.sources || []
                    const Icon = toolIconForPart(part)
                    const formatToolDetailValue = (value) => {
                        if (value == null || value === '') return ''
                        if (typeof value === 'string') return value.trim()
                        try {
                            return JSON.stringify(value, null, 2)
                        } catch {
                            return String(value)
                        }
                    }
                    const renderToolInputDetails = () => {
                        if (part.type === 'tool-skills_exec') {
                            const parsedInput = normalizeSkillToolValue(part.input)
                            const code =
                                typeof parsedInput?.code === 'string'
                                    ? parsedInput.code
                                    : typeof part.input?.code === 'string'
                                      ? part.input.code
                                      : ''
                            if (code.trim()) {
                                return renderToolCodeBlock(`\`\`\`js\n${code.trim()}\n\`\`\``)
                            }
                            const fallbackCode =
                                typeof parsedInput === 'string'
                                    ? parsedInput
                                    : formatToolDetailValue(parsedInput)
                            if (fallbackCode.trim()) {
                                return renderToolCodeBlock(`\`\`\`js\n${fallbackCode.trim()}\n\`\`\``)
                            }
                            return null
                        }
                        const inputText = formatToolDetailValue(part.input)
                        if (!inputText) return null
                        return renderToolCodeBlock(`\`\`\`json\n${inputText}\n\`\`\``)
                    }
                    const getSkillsExecOutputValue = (value) => {
                        const parsed = normalizeSkillToolValue(value)
                        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return parsed
                        return (
                            parsed.output ??
                            parsed.result ??
                            parsed.response ??
                            parsed.stdout ??
                            parsed.value ??
                            parsed.data ??
                            parsed
                        )
                    }
                    const renderToolOutputDetails = () => {
                        const rawOutput = part.output ?? part.result
                        if (part.type === 'tool-skills_exec') {
                            const outputValue = getSkillsExecOutputValue(rawOutput)
                            if (typeof outputValue === 'string') {
                                const text = outputValue.trim()
                                if (!text) return null
                                return renderToolCodeBlock(`\`\`\`\n${text}\n\`\`\``)
                            }
                            const outputText = formatToolDetailValue(outputValue)
                            if (!outputText) return null
                            return renderToolCodeBlock(`\`\`\`json\n${outputText}\n\`\`\``)
                        }
                        const outputText = formatToolDetailValue(rawOutput)
                        if (!outputText) return null
                        return renderToolCodeBlock(`\`\`\`json\n${outputText}\n\`\`\``)
                    }

                    if (isWebSearch) {
                        const { label: webLabel, detail: webDetail } = getWebSearchSummary(part)
                        const sources = Array.isArray(webSources) ? webSources : []
                        const searchPreview = truncateSingleLine(webDetail, 72)
                        const isExpanded = isRowExpanded(rowKey)
                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className={clsx(
                                    'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                    isExpanded ? 'items-start' : 'items-center',
                                )}
                            >
                                <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            <span>{webLabel}{searchPreview ? ':' : ''}</span>
                                            {searchPreview ? (
                                                <span className="ml-1 text-gray-500">{searchPreview}</span>
                                            ) : null}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded && sources.length > 0 ? (
                                        <ul className="space-y-0.5">
                                            {sources.map((src, sourceIndex) => {
                                                const url = src?.url || src?.href
                                                if (!url) return null
                                                return (
                                                    <li key={`${message.id}-ws-${index}-${sourceIndex}`}>
                                                        <Link
                                                            href={url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex max-w-full min-w-0 items-start gap-2 break-all text-xs text-cyan-700 hover:underline"
                                                        >
                                                            <span className="inline-flex h-3 w-3 shrink-0 overflow-hidden rounded-full bg-gray-100">
                                                                <img
                                                                    alt=""
                                                                    width={12}
                                                                    height={12}
                                                                    className="h-3 w-3"
                                                                    src={`https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=32`}
                                                                />
                                                            </span>
                                                            <span>{url}</span>
                                                        </Link>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    if (isShell) {
                        const hasStdout = Boolean(shellStdout.trim())
                        const hasStderr = Boolean(shellStderr.trim())
                        const hasShellStreams =
                            hasStdout ||
                            hasStderr ||
                            shellStdoutBlocks.length > 0 ||
                            shellStderrBlocks.length > 0
                        const shellCommandPreview = shellPreviewFromCommand(shellCommand, 90)
                        const isExpanded = hasShellStreams && isRowExpanded(rowKey)
                        const trimmedShellCommand = String(shellCommand || '').trim()

                        if (!hasShellStreams) {
                            return (
                                <div
                                    key={`${message.id}-tool-${index}`}
                                    className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left"
                                >
                                    <ActivityTimelineIcon>
                                        <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                    </ActivityTimelineIcon>
                                    <div className="min-w-0 flex-1 space-y-1 text-gray-800">
                                        <div className="truncate font-medium text-gray-700">
                                            <span>Shell call:</span>
                                            {shellCommandPreview ? (
                                                <span className="ml-1 text-gray-400">
                                                    {shellCommandPreview}
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className={clsx(
                                    'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                    isExpanded ? 'items-start' : 'items-center',
                                )}
                            >
                                <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 space-y-1 text-gray-800">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            <span>Shell call:</span>
                                            {shellCommandPreview ? (
                                                <span className="ml-1 text-gray-400">
                                                    {shellCommandPreview}
                                                </span>
                                            ) : null}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded && trimmedShellCommand ? (
                                        <div className="text-xs">
                                            {renderToolCodeBlock(
                                                `\`\`\`bash\n${trimmedShellCommand}\n\`\`\``,
                                            )}
                                        </div>
                                    ) : null}
                                    {isExpanded
                                        ? (shellStdoutBlocks.length ? shellStdoutBlocks : hasStdout ? [shellStdout] : []).map(
                                              (chunk, chunkIndex) => (
                                                  <div
                                                      key={`${rowKey}-stdout-${chunkIndex}`}
                                                      className="text-xs"
                                                  >
                                                      {renderToolCodeBlock(
                                                          `\`\`\`bash\n${String(chunk || '').trim()}\n\`\`\``,
                                                      )}
                                                  </div>
                                              ),
                                          )
                                        : null}
                                    {isExpanded
                                        ? (shellStderrBlocks.length ? shellStderrBlocks : hasStderr ? [shellStderr] : []).map(
                                              (chunk, chunkIndex) => (
                                                  <div
                                                      key={`${rowKey}-stderr-${chunkIndex}`}
                                                      className="text-xs rounded-md border border-pink-200 bg-pink-50 p-2 text-pink-950"
                                                  >
                                                      {renderToolCodeBlock(
                                                          `\`\`\`bash\n${String(chunk || '').trim()}\n\`\`\``,
                                                      )}
                                                  </div>
                                              ),
                                          )
                                        : null}
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-apply_patch') {
                        const isExpanded = isRowExpanded(rowKey)
                        const patchSummary = getApplyPatchSummary(part)
                        const patchOutput =
                            part?.output?.output || part?.result?.output || part?.errorText || ''

                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className={clsx(
                                    'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                    isExpanded ? 'items-start' : 'items-center',
                                )}
                            >
                                <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            {patchSummary}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded && patchOutput ? (
                                        <div className="mt-1 text-xs text-gray-600">{patchOutput}</div>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-test_skill_remote') {
                        const validation = part?.output?.validation
                        const isExpanded = isRowExpanded(rowKey)
                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100"
                            >
                                <ActivityTimelineIcon>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            {toolSummary}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded && validation?.errors?.length ? (
                                        <ul className="mt-2 list-inside list-disc text-xs text-red-700">
                                            {validation.errors.map((err, errIndex) => (
                                                <li key={`${message.id}-err-${index}-${errIndex}`}>
                                                    {displayText(err, '[Invalid error entry]')}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-validate_skill_bundle') {
                        const output = part?.output ?? part?.result ?? {}
                        const validation = output?.validation || output || {}
                        const errors = Array.isArray(validation?.errors) ? validation.errors : []
                        const warnings = Array.isArray(validation?.warnings) ? validation.warnings : []
                        const fileTree = Array.isArray(output?.fileTree) ? output.fileTree : []
                        const isExpanded = isRowExpanded(rowKey)
                        const valid = output?.ok ?? validation?.valid
                        const visibleErrors = errors.slice(0, 25)
                        const visibleWarnings = warnings.slice(0, 10)

                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className={clsx(
                                    'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                    isExpanded ? 'items-start' : 'items-center',
                                )}
                            >
                                <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            {toolSummary}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded ? (
                                        <div className="mt-2 space-y-2 text-xs text-gray-600">
                                            <div>
                                                <span className="font-semibold uppercase tracking-wide text-gray-500">
                                                    Output
                                                </span>
                                                <div className="mt-1">
                                                    Status:{' '}
                                                    <span
                                                        className={clsx(
                                                            'font-medium',
                                                            valid === false
                                                                ? 'text-red-700'
                                                                : valid === true
                                                                  ? 'text-emerald-700'
                                                                  : 'text-gray-700',
                                                        )}
                                                    >
                                                        {valid === false
                                                            ? 'failed'
                                                            : valid === true
                                                              ? 'passed'
                                                              : 'completed'}
                                                    </span>
                                                </div>
                                            </div>
                                            {visibleErrors.length ? (
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-red-700">
                                                        Errors
                                                    </div>
                                                    <ul className="mt-1 list-inside list-disc space-y-1 text-red-700">
                                                        {visibleErrors.map((err, errIndex) => (
                                                            <li key={`${message.id}-validate-error-${index}-${errIndex}`}>
                                                                {summarizeValidationIssue(err)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {errors.length > visibleErrors.length ? (
                                                        <div className="mt-1 text-gray-500">
                                                            {errors.length - visibleErrors.length} more errors hidden.
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                            {visibleWarnings.length ? (
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-amber-700">
                                                        Warnings
                                                    </div>
                                                    <ul className="mt-1 list-inside list-disc space-y-1 text-amber-700">
                                                        {visibleWarnings.map((warning, warningIndex) => (
                                                            <li
                                                                key={`${message.id}-validate-warning-${index}-${warningIndex}`}
                                                            >
                                                                {summarizeValidationIssue(warning)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {warnings.length > visibleWarnings.length ? (
                                                        <div className="mt-1 text-gray-500">
                                                            {warnings.length - visibleWarnings.length} more warnings hidden.
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                            {fileTree.length ? (
                                                <div className="text-gray-500">
                                                    Checked {fileTree.length} {fileTree.length === 1 ? 'file' : 'files'}.
                                                </div>
                                            ) : null}
                                            {!visibleErrors.length && !visibleWarnings.length && !fileTree.length ? (
                                                <div className="text-gray-500">No validation details returned.</div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-publish_skill_bundle') {
                        const output = part?.output ?? part?.result ?? {}
                        const validation = output?.validation || {}
                        const errors = Array.isArray(validation?.errors) ? validation.errors : []
                        const visibleErrors = errors.slice(0, 10)
                        const publishedAt = output?.publishedAt
                        const result = output?.result || {}
                        const promoted = Number(result?.promoted)
                        const deleted = Number(result?.deleted)
                        const messageText = String(output?.message || '').trim()
                        const isExpanded = isRowExpanded(rowKey)

                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className={clsx(
                                    'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                    isExpanded ? 'items-start' : 'items-center',
                                )}
                            >
                                <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <button
                                        type="button"
                                        className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                        onClick={() => toggleRowExpanded(rowKey)}
                                    >
                                        <span className="min-w-0 flex-1 truncate font-medium text-gray-700">
                                            {toolSummary}
                                        </span>
                                        {isExpanded ? (
                                            <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        ) : (
                                            <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                        )}
                                    </button>
                                    {isExpanded ? (
                                        <div className="mt-2 space-y-2 text-xs text-gray-600">
                                            <div>
                                                <span className="font-semibold uppercase tracking-wide text-gray-500">
                                                    Output
                                                </span>
                                                <div className="mt-1">
                                                    Status:{' '}
                                                    <span
                                                        className={clsx(
                                                            'font-medium',
                                                            output?.ok === false
                                                                ? 'text-red-700'
                                                                : output?.ok === true
                                                                  ? 'text-emerald-700'
                                                                  : 'text-gray-700',
                                                        )}
                                                    >
                                                        {output?.ok === false
                                                            ? 'failed'
                                                            : output?.ok === true
                                                              ? 'published'
                                                              : 'completed'}
                                                    </span>
                                                </div>
                                            </div>
                                            {publishedAt ? (
                                                <div className="text-gray-500">
                                                    Published at {String(publishedAt)}
                                                </div>
                                            ) : null}
                                            {Number.isFinite(promoted) || Number.isFinite(deleted) ? (
                                                <div className="text-gray-500">
                                                    {Number.isFinite(promoted) ? `${promoted} promoted` : null}
                                                    {Number.isFinite(promoted) && Number.isFinite(deleted) ? ' · ' : null}
                                                    {Number.isFinite(deleted) ? `${deleted} deleted` : null}
                                                </div>
                                            ) : null}
                                            {messageText ? (
                                                <div className="text-gray-600">
                                                    {truncateSingleLine(messageText, 600)}
                                                </div>
                                            ) : null}
                                            {visibleErrors.length ? (
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-red-700">
                                                        Errors
                                                    </div>
                                                    <ul className="mt-1 list-inside list-disc space-y-1 text-red-700">
                                                        {visibleErrors.map((err, errIndex) => (
                                                            <li key={`${message.id}-publish-error-${index}-${errIndex}`}>
                                                                {summarizeValidationIssue(err)}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                    {errors.length > visibleErrors.length ? (
                                                        <div className="mt-1 text-gray-500">
                                                            {errors.length - visibleErrors.length} more errors hidden.
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                            {!publishedAt &&
                                            !Number.isFinite(promoted) &&
                                            !Number.isFinite(deleted) &&
                                            !messageText &&
                                            !visibleErrors.length ? (
                                                <div className="text-gray-500">No publish details returned.</div>
                                            ) : null}
                                        </div>
                                    ) : null}
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-load_context') {
                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left"
                            >
                                <ActivityTimelineIcon>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <div className="truncate font-medium text-gray-700">Read manifest</div>
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-update_manifest') {
                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left"
                            >
                                <ActivityTimelineIcon>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <div className="truncate font-medium text-gray-700">Updated manifest</div>
                                </div>
                            </div>
                        )
                    }

                    if (part.type === 'tool-ask_user_questions') {
                        const isLastPart = globalIndex === allParts.length - 1
                        const showInline =
                            isLatestMessage &&
                            isLastPart &&
                            (part.state === 'input-available' || part.state === 'input-streaming')

                        if (part.state === 'output-available') {
                            return (
                                <div
                                    key={`${message.id}-tool-${index}`}
                                    className="w-full"
                                >
                                    <SkillsBuilderAskUserQuestionsForm
                                        part={part}
                                        addToolOutput={addToolOutput}
                                        chatStarted={false}
                                        readOnly
                                    />
                                </div>
                            )
                        }

                        if (showInline && part.state === 'input-available') {
                            return (
                                <div
                                    key={`${message.id}-tool-${index}`}
                                    className="w-full"
                                >
                                    <SkillsBuilderAskUserQuestionsForm
                                        part={part}
                                        addToolOutput={addToolOutput}
                                        chatStarted={chatStarted}
                                        onBeforeSubmitAnswers={onBeforeSubmitAnswers}
                                    />
                                </div>
                            )
                        }

                        if (showInline && part.state === 'input-streaming') {
                            return (
                                <div
                                    key={`${message.id}-tool-${index}`}
                                    className={clsx('space-y-3', BUILDER_CHAT_BUBBLE_WIDE_ASSISTANT)}
                                >
                                    <div className="flex min-h-16 w-full flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-gray-200 bg-gray-50 px-5 py-4 text-sm text-gray-600 sm:px-8 sm:py-6">
                                        <span>Preparing choices…</span>
                                        {isStreaming ? (
                                            <button
                                                type="button"
                                                onClick={(e) => onStopComposer?.(e)}
                                                className="shrink-0 rounded-md border border-cyan-600 bg-white px-3 py-1.5 text-sm font-medium text-cyan-800 shadow-sm transition-colors hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1 active:bg-cyan-100/80"
                                            >
                                                Stop
                                            </button>
                                        ) : null}
                                    </div>
                                </div>
                            )
                        }

                        const summary =
                            part.state === 'input-available'
                                ? 'Questions for you'
                                : part.state === 'input-streaming'
                                  ? 'Preparing questions…'
                                  : toolSummary
                        return (
                            <div
                                key={`${message.id}-tool-${index}`}
                                className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left"
                            >
                                <ActivityTimelineIcon>
                                    <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                                </ActivityTimelineIcon>
                                <div className="min-w-0 flex-1 text-gray-700">
                                    <div className="truncate font-medium text-gray-700">{summary}</div>
                                </div>
                            </div>
                        )
                    }

                    const isExpanded = isRowExpanded(rowKey)
                    const inputDetails = isExpanded ? renderToolInputDetails() : null
                    const outputDetails = isExpanded ? renderToolOutputDetails() : null
                    return (
                        <div
                            key={`${message.id}-tool-${index}`}
                            className={clsx(
                                'flex gap-1.5 rounded-md px-1.5 py-0.5 text-left hover:bg-gray-100',
                                isExpanded ? 'items-start' : 'items-center',
                            )}
                        >
                            <ActivityTimelineIcon className={isExpanded && 'mt-1'}>
                                <Icon className="h-4 w-4 text-gray-400" aria-hidden />
                            </ActivityTimelineIcon>
                            <div className="min-w-0 flex-1 text-gray-700">
                                <button
                                    type="button"
                                    className="flex w-full items-center gap-2 rounded text-left hover:text-gray-900"
                                    onClick={() => toggleRowExpanded(rowKey)}
                                >
                                    <span className="min-w-0 flex-1 truncate">
                                        {skillTestToolSummary ? (
                                            <>
                                                <span className="font-medium text-gray-700">
                                                    {skillTestToolSummary.label}
                                                </span>
                                                {skillTestToolSummary.detail ? (
                                                    <span className="font-normal text-gray-400">
                                                        : {skillTestToolSummary.detail}
                                                    </span>
                                                ) : null}
                                            </>
                                        ) : (
                                            toolSummary
                                        )}
                                    </span>
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                    ) : (
                                        <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-gray-500" />
                                    )}
                                </button>
                                {isExpanded ? (
                                    <div className="mt-2 space-y-2 text-xs">
                                        {inputDetails ? (
                                            <div>
                                                <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">
                                                    Input
                                                </div>
                                                {inputDetails}
                                            </div>
                                        ) : null}
                                        {outputDetails ? (
                                            <div>
                                                <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">
                                                    Response
                                                </div>
                                                {outputDetails}
                                            </div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )
                }

                return null
            })}
        </div>
    )
}

function AssistantTextBubble({ parts, isStreaming, isLatestMessage }) {
    const combined = parts
        .map((p) => {
            const t = p.text
            if (typeof t === 'string') return t
            if (t == null) return ''
            if (typeof t === 'number' || typeof t === 'boolean') return String(t)
            return ''
        })
        .join('\n\n')
    const isStreamingText = isLatestMessage && isStreaming && parts.length > 0

    return (
        <div
            className={clsx(
                'rounded-md border border-gray-200 bg-white text-left shadow-sm sm:rounded-lg',
                BUILDER_CHAT_BUBBLE_INSET_ASSISTANT,
            )}
        >
            <div
                dir="auto"
                className={clsx('p-5 text-start sm:p-6 sm:px-8', SKILLS_BUILDER_MARKDOWN_PROSE)}
            >
                {renderMarkdown(combined, isStreamingText ? 'streaming' : 'static')}
            </div>
        </div>
    )
}

/** Collapse consecutive activity segments (e.g. tools split only by empty text parts in the stream). */
function mergeAdjacentActivityGroups(groups) {
    const merged = []
    for (const g of groups) {
        const prev = merged[merged.length - 1]
        if (g.kind === 'activity' && prev?.kind === 'activity') {
            prev.parts = prev.parts.concat(g.parts)
        } else {
            merged.push(
                g.kind === 'text'
                    ? { kind: 'text', parts: [...g.parts] }
                    : { kind: 'activity', parts: [...g.parts] },
            )
        }
    }
    return merged
}

/** Preserve assistant message part order so text and tool/reasoning rows interleave like the model stream. */
function groupAssistantPartsForDisplay(parts) {
    const list = Array.isArray(parts) ? parts : []
    const groups = []
    let i = 0
    while (i < list.length) {
        const p = list[i]
        const t = p?.type
        if (t === 'text') {
            const chunk = []
            while (i < list.length && list[i]?.type === 'text') {
                chunk.push(list[i])
                i++
            }
            if (chunk.some((tp) => getPartText({ text: tp.text }).length > 0)) {
                groups.push({ kind: 'text', parts: chunk })
            }
        } else if (t === 'reasoning' || (typeof t === 'string' && t.startsWith('tool-'))) {
            const chunk = []
            while (
                i < list.length &&
                (list[i]?.type === 'reasoning' ||
                    (typeof list[i]?.type === 'string' && list[i].type.startsWith('tool-')))
            ) {
                chunk.push(list[i])
                i++
            }
            if (chunk.length) {
                groups.push({ kind: 'activity', parts: chunk })
            }
        } else {
            i++
        }
    }
    return mergeAdjacentActivityGroups(groups)
}

function AssistantMessageBlock({
    message,
    isLatestMessage,
    isStreaming,
    addToolOutput,
    chatStarted,
    onStopComposer,
    onBeforeSubmitAnswers,
    assistantMessageDurationMs,
    isSuperAdminViewer,
}) {
    const parts = message.parts || []
    const groups = groupAssistantPartsForDisplay(parts)

    if (groups.length === 0) {
        return null
    }

    const runCostTooltipContent =
        isSuperAdminViewer &&
        typeof message.metadata?.skillsBuilderAgentUsage?.estimatedCostUsd === 'number'
            ? `Est. this turn: ~$${message.metadata.skillsBuilderAgentUsage.estimatedCostUsd.toFixed(4)}`
            : null

    return (
        <div className="space-y-1">
            {groups.map((segment, segIndex) =>
                segment.kind === 'activity' ? (
                    <div key={`${message.id}-seg-${segIndex}`}>
                        <AssistantActivityRows
                            message={message}
                            parts={segment.parts}
                            isLatestMessage={isLatestMessage}
                            isStreaming={isStreaming}
                            addToolOutput={addToolOutput}
                            chatStarted={chatStarted}
                            onStopComposer={onStopComposer}
                            onBeforeSubmitAnswers={onBeforeSubmitAnswers}
                            messageDurationMs={assistantMessageDurationMs}
                            runCostTooltipContent={runCostTooltipContent}
                        />
                    </div>
                ) : (
                    <AssistantTextBubble
                        key={`${message.id}-seg-${segIndex}`}
                        parts={segment.parts}
                        isStreaming={isStreaming}
                        isLatestMessage={isLatestMessage && segIndex === groups.length - 1}
                    />
                ),
            )}
        </div>
    )
}

function createSkillTestConversationId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID()
    }
    return `skill-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function SkillTestRunningSpinner({
    className = 'h-6 w-6',
    showStopIcon = false,
    spinnerClassName = 'border-t-cyan-600',
    iconClassName = 'text-cyan-600',
}) {
    return (
        <div className={clsx('group flex items-center justify-center', className)}>
            <div className="relative flex h-full w-full items-center justify-center">
                <div className="absolute inset-0 rounded-full opacity-25"></div>
                <div
                    className={clsx(
                        'absolute inset-0 animate-spin rounded-full border-2 border-transparent',
                        spinnerClassName,
                    )}
                ></div>
                {showStopIcon ? (
                    <StopIcon
                        className={clsx(
                            'relative z-10 h-1/2 w-1/2 transition-transform duration-200 group-hover:scale-125',
                            iconClassName,
                        )}
                    />
                ) : null}
            </div>
        </div>
    )
}

function SkillTestLoadingDots() {
    return (
        <span className="inline-flex items-center gap-1" aria-label="Loading">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.2s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400 [animation-delay:-0.1s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" />
        </span>
    )
}

function ActivityTimelineIcon({ children, className }) {
    return (
        <span className={clsx('relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white', className)}>
            {children}
        </span>
    )
}

const SKILL_TEST_ACTIVITY_TIMELINE_CLASS =
    'relative ml-3 space-y-1 text-left before:absolute before:bottom-2 before:left-[15px] before:top-2 before:z-0 before:border-l before:border-gray-200 before:content-[""]'

function SkillTestActivityLog({ events, isStreaming, durationMs, showWaitingDots = false }) {
    const parts = useMemo(() => skillTestEventsToAssistantParts(events), [events])
    const message = useMemo(
        () => ({
            id: 'skill-test-activity',
            role: 'assistant',
            parts,
        }),
        [parts],
    )

    if (!parts.length && !showWaitingDots) return null

    return (
        <div className="px-1 py-1">
            <div className={SKILL_TEST_ACTIVITY_TIMELINE_CLASS}>
                {parts.length ? (
                    <AssistantActivityRows
                        message={message}
                        parts={parts}
                        isLatestMessage
                        isStreaming={isStreaming}
                        addToolOutput={() => {}}
                        chatStarted={false}
                        messageDurationMs={durationMs}
                    />
                ) : null}
                {showWaitingDots ? (
                    <div className="relative flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-left">
                        <span className="relative z-10 h-5 w-5 shrink-0 rounded-full bg-white" aria-hidden />
                        <SkillTestLoadingDots />
                    </div>
                ) : null}
            </div>
        </div>
    )
}

function SkillTestModal({
    open,
    draft,
    team,
    bot,
    tokenUrl,
    onClose,
    onSendReportToBuilder,
}) {
    const metadataBindings = useMemo(
        () =>
            normalizeMetadataBindings(
                Array.isArray(draft?.metadataBindings) && draft.metadataBindings.length
                    ? draft.metadataBindings
                    : draft?.manifest?.metadataBindings || [],
            ),
        [draft],
    )
    const [metadataValues, setMetadataValues] = useState({})
    const [testState, setTestState] = useState(() => createInitialSkillTestState())
    const [reportInstructions, setReportInstructions] = useState('')
    const [sentToBuilder, setSentToBuilder] = useState(false)
    const [reportCopied, setReportCopied] = useState(false)
    const [technicalExpanded, setTechnicalExpanded] = useState(false)
    const abortRef = useRef(null)
    const resetOnAbortRef = useRef(false)
    const scrollRef = useRef(null)

    const isRunning = testState.status === 'running'
    const hasResult = Boolean(
        testState.summary ||
            testState.technical ||
            testState.markdown ||
            testState.error ||
            ['completed', 'error', 'stopped'].includes(testState.status),
    )
    const finalReportMarkdown = useMemo(
        () =>
            buildSkillTestFinalMarkdown({
                summary: testState.summary,
                technical: testState.technical,
                markdown: testState.markdown,
            }),
        [testState.markdown, testState.summary, testState.technical],
    )
    const hasStructuredReport = Boolean(testState.summary || testState.technical)
    const summaryMarkdown = hasStructuredReport ? testState.summary : testState.markdown
    const technicalMarkdown = hasStructuredReport ? testState.technical : ''
    const canSendReportToBuilder = hasResult && testState.status !== 'running'
    const lastTestEvent = testState.events[testState.events.length - 1]
    const lastEventIsThinking =
        lastTestEvent?.type === 'reasoning' && !String(lastTestEvent.text || '').trim()

    useEffect(() => {
        if (!open) return
        const next = {}
        for (const binding of metadataBindings) {
            next[binding.metadataKey] = ''
        }
        setMetadataValues(next)
        setTestState(createInitialSkillTestState())
        setReportInstructions('')
        setSentToBuilder(false)
        setReportCopied(false)
        setTechnicalExpanded(false)
    }, [metadataBindings, open])

    useEffect(() => {
        if (!open || !scrollRef.current) return
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, [open, testState.events, testState.markdown, testState.summary, testState.technical, testState.error])

    const metadataReady = metadataBindings.every((binding) =>
        String(metadataValues[binding.metadataKey] || '').trim(),
    )

    const metadataPayload = useMemo(() => {
        const out = {}
        for (const binding of metadataBindings) {
            const value = String(metadataValues[binding.metadataKey] || '').trim()
            if (value) out[binding.metadataKey] = value
        }
        return out
    }, [metadataBindings, metadataValues])

    const abortRunningTest = useCallback((nextStatus = 'stopped') => {
        const ctrl = abortRef.current
        if (ctrl) {
            ctrl.abort()
        }
        abortRef.current = null
        if (nextStatus === 'idle') {
            setReportInstructions('')
            setSentToBuilder(false)
            setReportCopied(false)
            setTechnicalExpanded(false)
            setTestState(createInitialSkillTestState())
            return
        }
        setTestState((prev) => ({
            ...prev,
            status: nextStatus,
            finishedAt: Date.now(),
        }))
    }, [])

    const closeExplicitly = useCallback(() => {
        if (isRunning) {
            if (!window.confirm('Stop the running skill test and close this report?')) return
            resetOnAbortRef.current = false
            abortRunningTest('stopped')
            onClose?.()
            return
        }
        if (hasResult && !sentToBuilder) {
            if (!window.confirm('Close this skill test report without sending it to the builder?')) return
        }
        onClose?.()
    }, [abortRunningTest, hasResult, isRunning, onClose, sentToBuilder])

    const handleDialogClose = useCallback(() => {
        if (isRunning || hasResult) return
        onClose?.()
    }, [hasResult, isRunning, onClose])

    const stopRunningTest = useCallback(() => {
        if (!isRunning) return
        if (!window.confirm('Stop the running skill test?')) return
        resetOnAbortRef.current = true
        abortRunningTest('idle')
    }, [abortRunningTest, isRunning])

    const startTest = useCallback(async () => {
        if (!tokenUrl || isRunning || !metadataReady) return
        const ctrl = new AbortController()
        abortRef.current = ctrl
        resetOnAbortRef.current = false
        const startedAt = Date.now()
        setSentToBuilder(false)
        setReportCopied(false)
        setReportInstructions('')
        setTechnicalExpanded(false)
        setTestState({
            ...createInitialSkillTestState(),
            status: 'running',
            startedAt,
        })

        class FatalError extends Error {}

        try {
            const tokenResponse = await fetch(tokenUrl, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    metadata: metadataPayload,
                }),
                signal: ctrl.signal,
            })
            const tokenData = await tokenResponse.json().catch(() => ({}))
            if (!tokenResponse.ok) {
                throw new FatalError(
                    tokenData?.message || tokenData?.error || 'Unable to create signed test token.',
                )
            }

            const apiBaseUrl = process.env.NEXT_PUBLIC_BOT_API_URL
            if (!apiBaseUrl) {
                throw new FatalError('NEXT_PUBLIC_BOT_API_URL is not configured.')
            }

            const skillName = tokenData.skillName || draft?.skillName || draft?.name
            const directTestUrl = `${apiBaseUrl.replace(/\/$/, '')}/teams/${encodeURIComponent(team.id)}/bots/${encodeURIComponent(bot.id)}/skills/${encodeURIComponent(skillName)}/test-agent`

            await fetchEventSource(directTestUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokenData.token}`,
                },
                body: JSON.stringify({
                    conversationId: createSkillTestConversationId(),
                    metadata: tokenData.metadata || metadataPayload,
                    model: SKILL_TEST_MODEL,
                    reasoning_effort: SKILL_TEST_REASONING_EFFORT,
                }),
                signal: ctrl.signal,
                openWhenHidden: true,
                async onopen(response) {
                    if (response.ok) return
                    let message = `Skill test failed with status ${response.status}.`
                    try {
                        const data = await response.json()
                        message = data?.message || data?.error || message
                    } catch {
                        // keep generic response status
                    }
                    throw new FatalError(message)
                },
                onmessage(msg) {
                    if (msg.event === 'stream') {
                        setTestState((prev) =>
                            reduceSkillTestStreamEvent(prev, { type: 'stream', data: msg.data }),
                        )
                        return
                    }
                    if (msg.event === 'tool_call') {
                        try {
                            const parsed = JSON.parse(msg.data || '{}')
                            setTestState((prev) =>
                                reduceSkillTestStreamEvent(prev, {
                                    type: 'tool_call',
                                    name: parsed.name,
                                    params: parsed.params || parsed.input || parsed.args,
                                    output: parsed.output ?? parsed.result ?? parsed.response,
                                    id: `skill-test-tool-${Date.now()}-${prev.events?.length || 0}`,
                                    timestamp: Date.now(),
                                }),
                            )
                        } catch {
                            // Ignore malformed progress events.
                        }
                        return
                    }
                    if (msg.event === 'reasoning') {
                        try {
                            const parsed = JSON.parse(msg.data || '{}')
                            setTestState((prev) =>
                                reduceSkillTestStreamEvent(prev, {
                                    type: 'reasoning',
                                    reasoningId: parsed.id || null,
                                    text: parsed.text || '',
                                    id: `skill-test-reasoning-${Date.now()}-${prev.events?.length || 0}`,
                                    timestamp: Date.now(),
                                }),
                            )
                        } catch {
                            // Ignore malformed progress events.
                        }
                        return
                    }
                    if (msg.event === 'final') {
                        try {
                            const parsed = JSON.parse(msg.data || '{}')
                            setTestState((prev) =>
                                reduceSkillTestStreamEvent(prev, {
                                    type: 'final',
                                    summary: parsed.summary,
                                    technical: parsed.technical,
                                }),
                            )
                        } catch {
                            // Ignore malformed final events.
                        }
                        return
                    }
                    if (msg.event === 'error') {
                        const message = msg.data || 'Skill test failed.'
                        setTestState((prev) =>
                            reduceSkillTestStreamEvent(prev, {
                                type: 'error',
                                error: message,
                                finishedAt: Date.now(),
                            }),
                        )
                        throw new FatalError(message)
                    }
                },
                onerror(error) {
                    throw error
                },
            })

            if (!ctrl.signal.aborted) {
                setTestState((prev) => ({
                    ...prev,
                    status: 'completed',
                    finishedAt: Date.now(),
                }))
            }
        } catch (error) {
            if (ctrl.signal.aborted) {
                if (resetOnAbortRef.current) {
                    setReportInstructions('')
                    setSentToBuilder(false)
                    setReportCopied(false)
                    setTechnicalExpanded(false)
                    setTestState(createInitialSkillTestState())
                } else {
                    setTestState((prev) => ({
                        ...prev,
                        status: 'stopped',
                        finishedAt: Date.now(),
                    }))
                }
            } else {
                setTestState((prev) =>
                    reduceSkillTestStreamEvent(prev, {
                        type: 'error',
                        error: error?.message || 'Skill test failed.',
                        finishedAt: Date.now(),
                    }),
                )
            }
        } finally {
            if (abortRef.current === ctrl) {
                abortRef.current = null
            }
            if (ctrl.signal.aborted) {
                resetOnAbortRef.current = false
            }
        }
    }, [bot.id, draft?.name, draft?.skillName, isRunning, metadataPayload, metadataReady, team.id, tokenUrl])

    const sendReport = useCallback(() => {
        if (!hasResult) return
        onSendReportToBuilder?.(
            buildSkillTestReportPrompt({
                skillName: draft?.skillName || draft?.name,
                metadata: metadataPayload,
                events: testState.events,
                markdown: finalReportMarkdown,
                status: testState.status,
                error: testState.error,
                instructions: reportInstructions,
            }),
        )
        setSentToBuilder(true)
        onClose?.()
    }, [
        draft?.name,
        draft?.skillName,
        hasResult,
        metadataPayload,
        onClose,
        onSendReportToBuilder,
        reportInstructions,
        finalReportMarkdown,
        testState.error,
        testState.events,
        testState.status,
    ])

    const copyReport = useCallback(async () => {
        const text = String(finalReportMarkdown || '').trim()
        if (!text) return
        try {
            await navigator.clipboard.writeText(text)
            setReportCopied(true)
            window.setTimeout(() => setReportCopied(false), 1500)
        } catch {
            setReportCopied(false)
        }
    }, [finalReportMarkdown])

    const statusLabel =
        testState.status === 'running'
            ? 'Running'
            : testState.status === 'completed'
              ? 'Completed'
              : testState.status === 'error'
                ? 'Failed'
                : testState.status === 'stopped'
                  ? 'Stopped'
                  : 'Ready'

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-modal" onClose={handleDialogClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-200"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-150"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-200"
                            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-150"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel
                                className={clsx(
                                    'relative flex w-full transform flex-col overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all duration-300 ease-out',
                                    testState.status === 'idle'
                                        ? 'max-h-[82vh] max-w-xl'
                                        : 'h-[90vh] max-w-5xl',
                                )}
                            >
                                <div className="flex shrink-0 items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
                                    <div className="min-w-0">
                                        <Dialog.Title className="truncate text-base font-semibold text-gray-900">
                                            Test {formatSkillNameDisplay(draft?.skillName || draft?.name, 'skill')}
                                        </Dialog.Title>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Spins up an agent to strategically test every part of this skill, then
                                            provides a report you can use to improve it.
                                        </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span
                                            className={clsx(
                                                'rounded-full border px-2.5 py-1 text-xs font-medium',
                                                testState.status === 'running'
                                                    ? 'border-cyan-200 bg-cyan-50 text-cyan-800'
                                                    : testState.status === 'completed'
                                                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                      : testState.status === 'error'
                                                        ? 'border-red-200 bg-red-50 text-red-800'
                                                        : 'border-gray-200 bg-gray-50 text-gray-700',
                                            )}
                                        >
                                            {statusLabel}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={closeExplicitly}
                                            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            aria-label="Close skill test"
                                        >
                                            <XMarkIcon className="h-5 w-5" aria-hidden />
                                        </button>
                                    </div>
                                </div>

                                <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
                                    {metadataBindings.length > 0 && testState.status === 'idle' ? (
                                        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <div className="text-sm font-semibold text-gray-900">
                                                Test metadata
                                            </div>
                                            <p className="mt-1 text-sm text-gray-500">
                                                These values are signed server-side for this test run.
                                            </p>
                                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                {metadataBindings.map((binding) => (
                                                    <div key={binding.metadataKey}>
                                                        <label
                                                            htmlFor={`skill-test-metadata-${binding.metadataKey}`}
                                                            className="block text-xs font-medium text-gray-700"
                                                        >
                                                            {binding.metadataKey}
                                                            {binding.envVar ? (
                                                                <span className="ml-1 font-mono text-[11px] text-gray-500">
                                                                    ({binding.envVar})
                                                                </span>
                                                            ) : null}
                                                        </label>
                                                        <input
                                                            id={`skill-test-metadata-${binding.metadataKey}`}
                                                            type="text"
                                                            autoComplete="off"
                                                            spellCheck={false}
                                                            value={metadataValues[binding.metadataKey] || ''}
                                                            onChange={(event) =>
                                                                setMetadataValues((prev) => ({
                                                                    ...prev,
                                                                    [binding.metadataKey]: event.target.value,
                                                                }))
                                                            }
                                                            className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-0"
                                                        />
                                                        {binding.description ? (
                                                            <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                                                {binding.description}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}

                                    {testState.status === 'idle' ? (
                                        <div className="flex flex-1 items-center justify-center py-10">
                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => void startTest()}
                                                    disabled={!metadataReady || !tokenUrl}
                                                    className={clsx(
                                                        'inline-flex items-center justify-center gap-1.5 rounded-md border-2 bg-white px-3 py-1.5 text-sm font-semibold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2',
                                                        metadataReady && tokenUrl
                                                            ? 'border-cyan-600 text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800'
                                                            : 'cursor-not-allowed border-gray-300 text-gray-400 hover:bg-white',
                                                    )}
                                                >
                                                    <BeakerIcon className="h-4 w-4" aria-hidden />
                                                    Start test
                                                </button>
                                                {!metadataReady ? (
                                                    <p className="mt-3 text-sm text-gray-500">
                                                        Enter the required metadata values to start.
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}

                                    {testState.events.length || testState.status === 'running' ? (
                                        <div className="mb-4 space-y-2">
                                            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Activity
                                            </div>
                                            <SkillTestActivityLog
                                                events={testState.events}
                                                isStreaming={testState.status === 'running'}
                                                showWaitingDots={
                                                    testState.status === 'running' &&
                                                    !finalReportMarkdown &&
                                                    !lastEventIsThinking
                                                }
                                                durationMs={
                                                    testState.startedAt
                                                        ? (testState.finishedAt || Date.now()) - testState.startedAt
                                                        : null
                                                }
                                            />
                                        </div>
                                    ) : null}

                                    {summaryMarkdown || technicalMarkdown ? (
                                        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                                            {summaryMarkdown ? (
                                                <>
                                                    <div className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-500">
                                                        Summary
                                                    </div>
                                                    <div className={SKILLS_BUILDER_MARKDOWN_PROSE}>
                                                        {renderMarkdown(
                                                            summaryMarkdown,
                                                            hasStructuredReport || testState.status !== 'running'
                                                                ? 'static'
                                                                : 'streaming',
                                                        )}
                                                    </div>
                                                </>
                                            ) : null}
                                            {technicalMarkdown ? (
                                                <div className={clsx(summaryMarkdown && 'mt-5 border-t border-gray-100 pt-4')}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setTechnicalExpanded((value) => !value)}
                                                        className="inline-flex items-center gap-1.5 text-left focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                                    >
                                                        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                            Technical Details
                                                        </span>
                                                        {technicalExpanded ? (
                                                            <ChevronDownIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                                                        ) : (
                                                            <ChevronRightIcon className="h-4 w-4 shrink-0 text-gray-500" aria-hidden />
                                                        )}
                                                    </button>
                                                    {technicalExpanded ? (
                                                        <div className={clsx('mt-3', SKILLS_BUILDER_MARKDOWN_PROSE)}>
                                                            {renderMarkdown(technicalMarkdown, 'static')}
                                                        </div>
                                                    ) : null}
                                                </div>
                                            ) : null}
                                            {testState.status !== 'running' ? (
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => void copyReport()}
                                                        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                                    >
                                                        {reportCopied ? (
                                                            <CheckIcon className="h-4 w-4" aria-hidden />
                                                        ) : (
                                                            <ClipboardDocumentIcon className="h-4 w-4" aria-hidden />
                                                        )}
                                                        {reportCopied ? 'Copied' : 'Copy'}
                                                    </button>
                                                </div>
                                            ) : null}
                                        </div>
                                    ) : null}

                                    {testState.error ? (
                                        <div className="mt-4">
                                            <Alert title={alertString(testState.error)} type="error" />
                                        </div>
                                    ) : null}

                                </div>

                                {isRunning || canSendReportToBuilder ? (
                                    <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-end sm:justify-end">
                                        {canSendReportToBuilder ? (
                                            <div className="min-w-0 flex-1">
                                                <label
                                                    htmlFor="skill-test-report-instructions"
                                                    className="block text-xs font-medium uppercase tracking-wide text-gray-500"
                                                >
                                                    Instructions for the builder
                                                </label>
                                                <div className="relative mt-1">
                                                    <textarea
                                                        id="skill-test-report-instructions"
                                                        value={reportInstructions}
                                                        onChange={(event) => setReportInstructions(event.target.value)}
                                                        rows={2}
                                                        className="w-full resize-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-12 text-sm outline-none focus:border-cyan-600 focus:ring-0"
                                                        placeholder="Optional: tell the builder what to change based on this report."
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={sendReport}
                                                        disabled={sentToBuilder}
                                                        className="absolute bottom-3 right-3 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        <span className="sr-only">
                                                            {sentToBuilder
                                                                ? 'Sent to builder'
                                                                : 'Send report to builder'}
                                                        </span>
                                                        <PaperAirplaneIcon className="h-6 w-6" aria-hidden />
                                                    </button>
                                                </div>
                                                {sentToBuilder ? (
                                                    <p className="mt-1 text-sm text-emerald-700">
                                                        Sent to the builder.
                                                    </p>
                                                ) : null}
                                            </div>
                                        ) : null}
                                        <div className="flex shrink-0 items-center justify-end gap-2">
                                            {isRunning ? (
                                                <button
                                                    type="button"
                                                    onClick={stopRunningTest}
                                                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                                >
                                                    <SkillTestRunningSpinner className="h-6 w-6" showStopIcon />
                                                    <span>Stop</span>
                                                </button>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

function SkillStatusDot({ publishedAt, compact = false }) {
    const isPublished = Boolean(publishedAt)
    const dot = (
        <span
            className={clsx(
                'inline-block h-2 w-2 shrink-0 rounded-full',
                isPublished ? 'bg-emerald-600' : 'bg-gray-600',
            )}
            aria-hidden
        />
    )
    if (compact) {
        return (
            <Tooltip content={isPublished ? 'Published' : 'Draft'}>
                <span
                    className="inline-flex cursor-default items-center rounded-md p-1 text-gray-600 transition-colors hover:bg-gray-100"
                    role="img"
                    aria-label={isPublished ? 'Published' : 'Draft'}
                >
                    {dot}
                </span>
            </Tooltip>
        )
    }
    return (
        <span
            className={clsx(
                'inline-flex items-center gap-1.5 text-xs font-medium',
                isPublished ? 'text-emerald-700' : 'text-gray-600',
            )}
        >
            {dot}
            {isPublished ? 'Published' : 'Draft'}
        </span>
    )
}

function isExecutableSkillMode(mode, hasFunctions) {
    if (Boolean(hasFunctions)) return true
    const m = String(mode ?? '').toLowerCase()
    return m === 'executable'
}

/** Markdown / instructional vs executable scripts (list + detail tooltips). */
function SkillCapabilityIcon({ mode, hasFunctions, size = 'md', className, tooltipZIndex }) {
    const executable = isExecutableSkillMode(mode, hasFunctions)
    const label = executable ? 'Includes scripts to perform actions' : 'Instructional (markdown)'
    const tip = executable
        ? 'This skill includes scripts to perform actions.'
        : 'Instructional — markdown instructions and references; no custom code runtime.'
    const Icon = executable ? CommandLineIcon : AcademicCapIcon
    const dim = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
        <Tooltip content={tip} zIndex={tooltipZIndex}>
            <span
                className={clsx(
                    'inline-flex cursor-default rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800',
                    size === 'sm' ? 'p-0.5' : 'p-1',
                    className,
                )}
                aria-label={label}
            >
                <Icon className={dim} aria-hidden />
            </span>
        </Tooltip>
    )
}

/** Customer-facing vs internal audience (list + detail tooltips). */
function SkillAudienceIcon({ internal, size = 'md', className, tooltipZIndex }) {
    const isInternal = Boolean(internal)
    const label = isInternal ? 'Internal-only' : 'Customer-facing'
    const tip = isInternal
        ? 'Internal-only — for your team and authenticated use, not aimed at end users in the widget.'
        : 'Customer-facing — available in the widget and public chats.'
    const Icon = isInternal ? BuildingOffice2Icon : GlobeAltIcon
    const dim = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    return (
        <Tooltip content={tip} zIndex={tooltipZIndex}>
            <span
                className={clsx(
                    'inline-flex cursor-default rounded-md text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800',
                    size === 'sm' ? 'p-0.5' : 'p-1',
                    className,
                )}
                aria-label={label}
            >
                <Icon className={dim} aria-hidden />
            </span>
        </Tooltip>
    )
}

function formatNetworkPolicySummary(policy) {
    const p = policy && typeof policy === 'object' ? policy : {}
    const domains = Array.isArray(p.allowedDomains) ? p.allowedDomains.filter(Boolean) : []
    const schemes = Array.isArray(p.allowedSchemes)
        ? p.allowedSchemes.filter(Boolean)
        : ['https']
    return { domains, schemes }
}

function NetworkPolicyReadable({ policy }) {
    const { domains, schemes } = formatNetworkPolicySummary(policy)
    return (
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-800">
            <div>
                <div className="font-medium text-gray-700">Allowed hostnames</div>
                {domains.length ? (
                    <ul className="mt-1 space-y-1">
                        {domains.map((host) => (
                            <li key={host}>
                                <code className="break-all rounded bg-gray-100 px-1 py-0.5 text-[11px] text-gray-800">
                                    {host}
                                </code>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-1 text-gray-500">
                        No extra domains yet. Outbound requests are limited to what the agent adds here.
                    </p>
                )}
            </div>
            <div>
                <div className="font-medium text-gray-700">Allowed URL schemes</div>
                {schemes.length ? (
                    <ul className="mt-1 list-inside list-disc text-gray-600">
                        {schemes.map((s) => (
                            <li key={s}>
                                <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">{s}</code>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="mt-1 text-gray-500">None specified (defaults to HTTPS).</p>
                )}
            </div>
        </div>
    )
}

function MetadataBindingsReadable({ bindings }) {
    const rows = Array.isArray(bindings) ? bindings : []
    if (!rows.length) {
        return (
            <p className="text-xs text-gray-500">
                No metadata keys for this skill yet. When the skill needs customer or page context from the widget,
                identifiers will appear here.
            </p>
        )
    }
    return (
        <ul className="space-y-1.5 text-xs">
            {rows.map((row, i) => (
                <li
                    key={`${row.metadataKey || ''}-${i}`}
                    className="rounded-md border border-gray-100 bg-gray-50/80 px-2 py-1.5"
                >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <code className="font-mono text-[11px] text-gray-900">
                            {displayText(row.envVar, '—')}
                        </code>
                        <span className="text-[11px] text-gray-600">
                            {displayText(row.metadataKey, '—')}
                        </span>
                    </div>
                    {row.description ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                            {row.description}
                        </p>
                    ) : null}
                </li>
            ))}
        </ul>
    )
}

function EnvironmentBindingsForm({
    envBindings = [],
    secretBindings = [],
    skillUpdateUrl,
    onSkillUpdated,
    setErrorText,
    setInfoText,
    testSkillButton = null,
}) {
    const envRows = useMemo(() => (Array.isArray(envBindings) ? envBindings : []), [envBindings])
    const secretRows = useMemo(
        () => (Array.isArray(secretBindings) ? secretBindings : []),
        [secretBindings],
    )
    const [envValuesByVar, setEnvValuesByVar] = useState({})
    const [secretValuesByVar, setSecretValuesByVar] = useState({})
    const [saving, setSaving] = useState(false)

    const bindingsSyncKey = useMemo(
        () =>
            JSON.stringify({
                env: envRows.map((row) => [
                    row.envVar,
                    row.value == null ? '' : String(row.value),
                    row.description == null ? '' : String(row.description),
                ]),
                secrets: secretRows.map((row) => [
                    row.envVar,
                    row.secret == null ? '' : String(row.secret),
                    row.description == null ? '' : String(row.description),
                ]),
            }),
        [envRows, secretRows],
    )

    useEffect(() => {
        const nextEnv = {}
        for (const row of envRows) {
            nextEnv[row.envVar] = row.value == null ? '' : String(row.value)
        }

        const nextSecrets = {}
        for (const row of secretRows) {
            nextSecrets[row.envVar] = row.secret == null ? '' : String(row.secret)
        }

        setEnvValuesByVar(nextEnv)
        setSecretValuesByVar(nextSecrets)
        // eslint-disable-next-line react-hooks/exhaustive-deps -- bindingsSyncKey tracks env + secret names, values, and descriptions
    }, [bindingsSyncKey])

    if (!envRows.length && !secretRows.length && !testSkillButton) {
        return (
            <p className="text-xs text-gray-500">
                No environment variables or secrets for this skill yet. When the manifest lists them, you can manage both here.
            </p>
        )
    }

    const canSave = Boolean(skillUpdateUrl)

    const save = async () => {
        if (!skillUpdateUrl) return
        setSaving(true)
        setErrorText?.(null)
        try {
            const response = await fetch(skillUpdateUrl, {
                method: 'PUT',
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    manifest: {
                        envBindings: envRows.map((row) => ({
                            envVar: row.envVar,
                            value: (envValuesByVar[row.envVar] ?? '').trim(),
                            ...(row.description ? { description: row.description } : {}),
                        })),
                        secretBindings: secretRows.map((row) => ({
                            envVar: row.envVar,
                            secret: (secretValuesByVar[row.envVar] ?? '').trim(),
                            ...(row.description ? { description: row.description } : {}),
                        })),
                    },
                }),
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to save environment settings.')
            }
            if (data.skill) onSkillUpdated(data.skill)
            setInfoText?.('Environment settings saved.')
        } catch (err) {
            setErrorText?.(err?.message || 'Unable to save environment settings.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="space-y-4">
            {envRows.length ? (
                <div>
                    <div className="text-xs font-medium text-gray-700">Variables</div>
                    <div className="mt-2 space-y-4">
                        {envRows.map((row, i) => (
                            <div
                                key={`${row.envVar || ''}-${i}`}
                                className="rounded-md border border-gray-100 bg-gray-50/80 px-2 py-2"
                            >
                                <label
                                    className="block text-[11px] font-medium text-gray-700"
                                    htmlFor={`skill-env-${row.envVar}`}
                                >
                                    {displayText(row.envVar, 'Variable')}
                                </label>
                                <input
                                    id={`skill-env-${row.envVar}`}
                                    type="text"
                                    aria-invalid={!String(envValuesByVar[row.envVar] ?? '').trim()}
                                    autoComplete="off"
                                    spellCheck={false}
                                    disabled={!canSave || saving}
                                    value={envValuesByVar[row.envVar] ?? ''}
                                    onChange={(e) =>
                                        setEnvValuesByVar((prev) => ({
                                            ...prev,
                                            [row.envVar]: e.target.value,
                                        }))
                                    }
                                    className={clsx(
                                        'mt-2 w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none transition disabled:opacity-50',
                                        String(envValuesByVar[row.envVar] ?? '').trim()
                                            ? 'border-gray-300 hover:border-cyan-500 focus:border-cyan-500 focus:shadow-md focus:shadow-cyan-500/20 focus:ring-0'
                                            : 'border-red-500 hover:border-red-500 focus:border-red-600 focus:shadow-md focus:shadow-red-500/25 focus:ring-0',
                                    )}
                                />
                                {row.description ? (
                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                        {row.description}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="text-xs font-medium text-gray-700">Variables</div>
                    <p className="mt-2 text-xs text-gray-500">
                        No fixed environment values for this skill yet.
                    </p>
                </div>
            )}

            {secretRows.length ? (
                <div>
                    <div className="text-xs font-medium text-gray-700">Secrets</div>
                    <div className="mt-2 space-y-4">
                        {secretRows.map((row, i) => (
                            <div
                                key={`${row.envVar || ''}-${i}`}
                                className="rounded-md border border-gray-100 bg-gray-50/80 px-2 py-2"
                            >
                                <label
                                    className="block text-[11px] font-medium text-gray-700"
                                    htmlFor={`skill-secret-${row.envVar}`}
                                >
                                    {displayText(row.envVar, 'Variable')}
                                </label>
                                <input
                                    id={`skill-secret-${row.envVar}`}
                                    type="text"
                                    aria-invalid={!String(secretValuesByVar[row.envVar] ?? '').trim()}
                                    autoComplete="off"
                                    spellCheck={false}
                                    disabled={!canSave || saving}
                                    value={secretValuesByVar[row.envVar] ?? ''}
                                    onChange={(e) =>
                                        setSecretValuesByVar((prev) => ({
                                            ...prev,
                                            [row.envVar]: e.target.value,
                                        }))
                                    }
                                    className={clsx(
                                        'mt-2 w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none transition disabled:opacity-50',
                                        String(secretValuesByVar[row.envVar] ?? '').trim()
                                            ? 'border-gray-300 hover:border-cyan-500 focus:border-cyan-500 focus:shadow-md focus:shadow-cyan-500/20 focus:ring-0'
                                            : 'border-red-500 hover:border-red-500 focus:border-red-600 focus:shadow-md focus:shadow-red-500/25 focus:ring-0',
                                    )}
                                />
                                {row.description ? (
                                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                                        {row.description}
                                    </p>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div>
                    <div className="text-xs font-medium text-gray-700">Secrets</div>
                    <p className="mt-2 text-xs text-gray-500">
                        No secret bindings for this skill yet.
                    </p>
                </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
                {testSkillButton}
                {(envRows.length || secretRows.length) ? (
                    <Button
                        type="button"
                        theme="blueSolid"
                        size="sm"
                        label={saving ? 'Saving' : 'Save'}
                        icon={saving ? LoadingSpinner : SaveDiskIcon}
                        disabled={!canSave || saving}
                        onClick={() => void save()}
                    />
                ) : null}
            </div>
        </div>
    )
}

function LiveManifestSidebar({
    draft,
    skillUpdateUrl,
    onSkillUpdated,
    setErrorText,
    setInfoText,
    onAskWhereToGetBindings,
    onOpenSkillTest,
}) {
    if (!draft) {
        return (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                Skill details will appear here as the agent updates the manifest.
            </div>
        )
    }

    const m = draft.manifest || {}
    const rawDescription =
        m.description ||
        m.frontmatter?.description ||
        draft.description ||
        draft.skillDescription ||
        '—'
    const description = displayText(rawDescription, '—')
    const hasFunctions = m.hasFunctions ?? draft.hasFunctions ?? false
    const networkPolicy = m.networkPolicy || draft.networkPolicy
    const envBindings = m.envBindings ?? draft.envBindings ?? []
    const metadataBindings = m.metadataBindings ?? draft.metadataBindings ?? []
    const secretBindings = m.secretBindings ?? draft.secretBindings ?? []
    const hasManifestEnvBindings = Array.isArray(m.envBindings) && m.envBindings.length > 0
    const hasManifestSecretBindings =
        Array.isArray(m.secretBindings) && m.secretBindings.length > 0
    const hasManifestMetadataBindings =
        Array.isArray(m.metadataBindings) && m.metadataBindings.length > 0
    const hasMissingTestBindings = hasMissingSkillTestEnvironmentBindings(draft)
    const missingTestBindingsMessage = hasMissingTestBindings
        ? 'Save all required environment settings first.'
        : ''
    const hasCallableFunctions = skillDraftHasCallableFunctions(draft)
    const canRunPublishedTest = Boolean(draft.publishedAt) && hasCallableFunctions && !hasMissingTestBindings
    const testSkillButton =
        draft.publishedAt && hasCallableFunctions ? (
            <Tooltip content={missingTestBindingsMessage || 'Test the published skill'}>
                <span className="inline-flex">
                    <button
                        type="button"
                        disabled={!canRunPublishedTest}
                        onClick={() => onOpenSkillTest?.()}
                        className="inline-flex items-center justify-center gap-1.5 rounded-md border-2 border-cyan-600 bg-white px-3 py-1.5 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-cyan-50 hover:text-cyan-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 disabled:hover:bg-white"
                    >
                        <BeakerIcon className="h-4 w-4" aria-hidden />
                        Test skill
                    </button>
                </span>
            </Tooltip>
        ) : null

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-100 pb-3">
                <SkillStatusDot publishedAt={draft.publishedAt} compact />
                <SkillAudienceIcon internal={Boolean(m.internal ?? draft.internal)} size="sm" className="shrink-0" />
                <SkillCapabilityIcon mode={draft.mode} hasFunctions={hasFunctions} size="sm" className="shrink-0" />
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-600">
                    <span className="text-gray-400">Updated</span>
                    {draft.updatedAt ? (
                        <LocaleDateTime date={draft.updatedAt} className="text-gray-800" />
                    ) : (
                        '—'
                    )}
                </span>
            </div>

            <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Description</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-gray-700">{description}</div>
            </div>

            <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Network policy</div>
                <div className="mt-2">
                    <NetworkPolicyReadable policy={networkPolicy} />
                </div>
            </div>

            <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">User metadata</div>
                {hasManifestMetadataBindings ? (
                    <p className="mt-1 text-[11px] text-gray-500">
                        Keys to pass from the widget into this skill. Each key is the identifier you add to your embed
                        code.
                    </p>
                ) : null}
                <div className="mt-2">
                    <MetadataBindingsReadable bindings={metadataBindings} />
                </div>
            </div>

            <div>
                <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">Environment</div>
                {hasManifestEnvBindings || hasManifestSecretBindings ? (
                    <button
                        type="button"
                        onClick={() =>
                            onAskWhereToGetBindings?.({
                                envBindings,
                                secretBindings,
                            })
                        }
                        className="mt-1 text-xs font-medium text-cyan-700 hover:text-cyan-800 hover:underline"
                    >
                        Tell me where to find these values
                    </button>
                ) : null}
                <div className="mt-2">
                    <EnvironmentBindingsForm
                        envBindings={envBindings}
                        secretBindings={secretBindings}
                        skillUpdateUrl={skillUpdateUrl}
                        onSkillUpdated={onSkillUpdated}
                        setErrorText={setErrorText}
                        setInfoText={setInfoText}
                        testSkillButton={testSkillButton}
                    />
                </div>
            </div>
        </div>
    )
}

function SkillsPageWorkspaceTitle() {
    return (
        <span className="inline-flex flex-wrap items-center gap-2 text-inherit">
            Skills
            <span className="bg-animate inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                New!
            </span>
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Beta
            </span>
        </span>
    )
}

const SKILLS_LIBRARY_MODAL_TOOLTIP_Z_INDEX = 1000001

function SkillsLibraryModal({
    open,
    onClose,
    skills,
    loading,
    errorText,
    search,
    setSearch,
    capabilityFilter,
    setCapabilityFilter,
    audienceFilter,
    setAudienceFilter,
    importingSkillId,
    deletingLibrarySkillId,
    isSuperAdminViewer,
    onImportSkill,
    onDeleteLibrarySkill,
}) {
    const filteredSkills = useMemo(
        () =>
            filterSkillsLibrary(skills, {
                query: '',
                capability: capabilityFilter,
                audience: audienceFilter,
            }),
        [audienceFilter, capabilityFilter, skills],
    )

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-modal" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-150"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-900/40" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-150"
                            enterFrom="translate-y-2 opacity-0 sm:scale-95"
                            enterTo="translate-y-0 opacity-100 sm:scale-100"
                            leave="ease-in duration-100"
                            leaveFrom="translate-y-0 opacity-100 sm:scale-100"
                            leaveTo="translate-y-2 opacity-0 sm:scale-95"
                        >
                            <Dialog.Panel className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
                                    <div className="min-w-0">
                                        <Dialog.Title className="text-base font-semibold text-gray-900">
                                            Add from skills library
                                        </Dialog.Title>
                                        <p className="mt-1 text-sm text-gray-500">
                                            Import a disconnected copy into this bot.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex shrink-0 items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <XMarkIcon className="h-5 w-5" aria-hidden />
                                        <span className="sr-only">Close</span>
                                    </button>
                                </div>
                                <div className="shrink-0 border-b border-gray-100 px-5 py-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-center">
                                        <label className="relative min-w-0 flex-1">
                                            <MagnifyingGlassIcon
                                                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                                                aria-hidden
                                            />
                                            <input
                                                type="search"
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                                placeholder="Search by name or description"
                                                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-cyan-600 focus:ring-0"
                                            />
                                        </label>
                                        <div className="flex shrink-0 flex-wrap gap-2">
                                            <select
                                                value={capabilityFilter}
                                                onChange={(e) => setCapabilityFilter(e.target.value)}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-0"
                                            >
                                                <option value={SKILLS_LIBRARY_CAPABILITY_ALL}>All capabilities</option>
                                                <option value={SKILLS_LIBRARY_CAPABILITY_MARKDOWN}>Instructions only</option>
                                                <option value={SKILLS_LIBRARY_CAPABILITY_EXECUTABLE}>Executable</option>
                                            </select>
                                            <select
                                                value={audienceFilter}
                                                onChange={(e) => setAudienceFilter(e.target.value)}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600 focus:ring-0"
                                            >
                                                <option value={SKILLS_LIBRARY_AUDIENCE_ALL}>All audiences</option>
                                                <option value={SKILLS_LIBRARY_AUDIENCE_CUSTOMER}>Customer-facing</option>
                                                <option value={SKILLS_LIBRARY_AUDIENCE_INTERNAL}>Internal-only</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                                    {errorText ? <Alert title={alertString(errorText)} type="error" /> : null}
                                    {loading ? (
                                        <Workspace.Loader message="Loading skills library…" />
                                    ) : filteredSkills.length === 0 ? (
                                        <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                                            No library skills match the current search and filters.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                            {filteredSkills.map((skill) => {
                                                const isImporting = importingSkillId === skill.id
                                                const isDeleting = deletingLibrarySkillId === skill.id
                                                return (
                                                    <div
                                                        key={skill.id}
                                                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                                    >
                                                        <div className="flex min-w-0 items-start gap-3">
                                                            <SkillListIcon
                                                                icon={skill.icon}
                                                                networkPolicy={skill.networkPolicy}
                                                            />
                                                            <div className="min-w-0 flex-1">
                                                                <div className="text-sm font-semibold text-gray-900">
                                                                    {formatSkillNameDisplay(skill.name, 'Skill')}
                                                                </div>
                                                                <p className="mt-1 line-clamp-3 text-sm text-gray-600">
                                                                    {skillListDescription(skill.description) ||
                                                                        'No description yet.'}
                                                                </p>
                                                                <div className="mt-3 flex items-center justify-between gap-2">
                                                                    <div className="flex min-w-0 items-center gap-0.5">
                                                                        <SkillAudienceIcon
                                                                            internal={skill.internal}
                                                                            size="sm"
                                                                            tooltipZIndex={SKILLS_LIBRARY_MODAL_TOOLTIP_Z_INDEX}
                                                                        />
                                                                        <SkillCapabilityIcon
                                                                            mode={skill.mode}
                                                                            hasFunctions={skill.hasFunctions}
                                                                            size="sm"
                                                                            tooltipZIndex={SKILLS_LIBRARY_MODAL_TOOLTIP_Z_INDEX}
                                                                        />
                                                                    </div>
                                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                                        {isSuperAdminViewer ? (
                                                                            <Tooltip
                                                                                content={isDeleting ? 'Deleting…' : 'Delete from library'}
                                                                                zIndex={SKILLS_LIBRARY_MODAL_TOOLTIP_Z_INDEX}
                                                                            >
                                                                                <span className="inline-flex">
                                                                                    <button
                                                                                        type="button"
                                                                                        disabled={isDeleting || isImporting}
                                                                                        onClick={() => onDeleteLibrarySkill(skill)}
                                                                                        className="inline-flex items-center justify-center rounded-lg border border-transparent p-2 text-red-700 hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                                                    >
                                                                                        {isDeleting ? (
                                                                                            <LoadingSpinner className="h-4 w-4" aria-hidden />
                                                                                        ) : (
                                                                                            <TrashIcon className="h-4 w-4" aria-hidden />
                                                                                        )}
                                                                                        <span className="sr-only">Delete from library</span>
                                                                                    </button>
                                                                                </span>
                                                                            </Tooltip>
                                                                        ) : null}
                                                                        <button
                                                                            type="button"
                                                                            disabled={isImporting || isDeleting}
                                                                            onClick={() => onImportSkill(skill)}
                                                                            className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-700 bg-cyan-700 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            {isImporting ? (
                                                                                <LoadingSpinner className="h-4 w-4" aria-hidden />
                                                                            ) : (
                                                                                <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                                                                            )}
                                                                            Import
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}

const PageConfigureSkills = ({ team, bot, routeSkillSlug = null }) => {
    const router = useRouter()
    const [detailTab, setDetailTab] = useState('builder')
    const [createMode, setCreateMode] = useState(false)
    const [draftState, setDraftState] = useState(defaultDraftState)
    const [drafts, setDrafts] = useState([])
    const [formDescription, setFormDescription] = useState('')
    const [formTask, setFormTask] = useState('')
    const [chatStarted, setChatStarted] = useState(false)
    const [input, setInput] = useState('')
    const [errorText, setErrorText] = useState(null)
    const [infoText, setInfoText] = useState(null)
    const [isBootstrapping, setIsBootstrapping] = useState(true)
    const [isCreatingDraft, setIsCreatingDraft] = useState(false)
    const [isSuggestingMetadata, setIsSuggestingMetadata] = useState(false)
    const [createIntentPlaceholderIndex, setCreateIntentPlaceholderIndex] = useState(0)
    const [r2Tick, setR2Tick] = useState(0)
    const [skillPackages, setSkillPackages] = useState(null)
    const [loadingPkg, setLoadingPkg] = useState(false)
    const [pkgError, setPkgError] = useState(null)
    const [advancedPackageView, setAdvancedPackageView] = useState('diff')
    const [workersLogs, setWorkersLogs] = useState(null)
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [expandedLogIds, setExpandedLogIds] = useState(() => new Set())
    const [selectedImages, setSelectedImages] = useState([])
    const [pendingInitialMessage, setPendingInitialMessage] = useState(null)
    const [pendingUpgrade, setPendingUpgrade] = useState(false)
    const [showUpgrade, setShowUpgrade] = useState(false)
    /** Bumped to recreate the @ai-sdk `useChat` instance so the next request omits prior thread + stream state. */
    const [builderChatSessionEpoch, setBuilderChatSessionEpoch] = useState(0)
    const [isDeletingSkill, setIsDeletingSkill] = useState(false)
    const [isPromotingLibrarySkill, setIsPromotingLibrarySkill] = useState(false)
    const [libraryOpen, setLibraryOpen] = useState(false)
    const [librarySkills, setLibrarySkills] = useState([])
    const [loadingLibrary, setLoadingLibrary] = useState(false)
    const [libraryErrorText, setLibraryErrorText] = useState(null)
    const [librarySearch, setLibrarySearch] = useState('')
    const [libraryCapabilityFilter, setLibraryCapabilityFilter] = useState(SKILLS_LIBRARY_CAPABILITY_ALL)
    const [libraryAudienceFilter, setLibraryAudienceFilter] = useState(SKILLS_LIBRARY_AUDIENCE_ALL)
    const [importingLibrarySkillId, setImportingLibrarySkillId] = useState(null)
    const [deletingLibrarySkillId, setDeletingLibrarySkillId] = useState(null)
    const [similarLibrarySkills, setSimilarLibrarySkills] = useState([])
    const [loadingSimilarLibrarySkills, setLoadingSimilarLibrarySkills] = useState(false)
    const [similarLibraryErrorText, setSimilarLibraryErrorText] = useState(null)
    const fileInputRef = useRef(null)
    const textareaRef = useRef(null)
    const chatScrollRef = useRef(null)
    const chatMessagesContentRef = useRef(null)
    const builderComposerRef = useRef(null)
    const [builderChatShowScrollDown, setBuilderChatShowScrollDown] = useState(false)
    const [skillTestOpen, setSkillTestOpen] = useState(false)
    const builderChatPrevMessageCountRef = useRef(0)
    const builderChatPrevSkillRef = useRef(null)
    const processedToolEventKeysRef = useRef(new Set())
    const hydratedChatSkillRef = useRef(null)
    /** While true, new assistant content keeps the thread pinned to the bottom until the user scrolls. */
    const builderChatFollowStreamRef = useRef(false)
    /** Epoch ms; while now < this value, skip follow-to-bottom (cleared on send / skill change). */
    const builderChatSuppressFollowUntilRef = useRef(0)
    const chatStatusForScrollRef = useRef('ready')
    /** Same truth as `loading` (agent turn in progress); kept on a ref for navigators declared below `useChat`. */
    const builderAgentTurnInProgressRef = useRef(false)

    const apiBase = `/api/teams/${team.id}/bots/${bot.id}/skills`
    const workersLogsApi = `${apiBase}/workers-logs`

    const toggleExpandedLog = useCallback((logId) => {
        if (!logId) return
        setExpandedLogIds((prev) => {
            const next = new Set(prev)
            if (next.has(logId)) {
                next.delete(logId)
            } else {
                next.add(logId)
            }
            return next
        })
    }, [])

    const updateBuilderChatScrollDownVisibility = useCallback(() => {
        const el = chatScrollRef.current
        if (!el) {
            setBuilderChatShowScrollDown(false)
            return
        }
        const gap = Math.ceil(el.scrollHeight - el.scrollTop - el.clientHeight)
        setBuilderChatShowScrollDown(gap > 8)
    }, [])

    const shouldBuilderChatFollow = useCallback(() => {
        if (!builderChatFollowStreamRef.current) return false
        if (Date.now() < builderChatSuppressFollowUntilRef.current) return false
        const st = chatStatusForScrollRef.current
        return st === 'submitted' || st === 'streaming'
    }, [])

    /** Scroll the messages pane to the true end; repeat on rAF so late layout (wrapping, fonts) does not leave a gap. */
    const flushBuilderChatScrollToEnd = useCallback((el) => {
        if (!el) return
        const snap = () => {
            el.scrollTop = el.scrollHeight
        }
        snap()
        requestAnimationFrame(() => {
            snap()
            requestAnimationFrame(snap)
        })
    }, [])

    const scrollBuilderChatToBottom = useCallback(() => {
        const el = chatScrollRef.current
        if (!el) return
        builderChatFollowStreamRef.current = true
        builderChatSuppressFollowUntilRef.current = 0
        flushBuilderChatScrollToEnd(el)
        requestAnimationFrame(() => {
            updateBuilderChatScrollDownVisibility()
        })
    }, [flushBuilderChatScrollToEnd, updateBuilderChatScrollDownVisibility])


    // Seed from either the SSR prop or (for bookmarked URLs where the prop may
    // momentarily be null on the first render) by parsing the visible path.
    const initialSelectedSkill = useMemo(() => {
        const fromProp =
            routeSkillSlug && typeof routeSkillSlug === 'string' && routeSkillSlug.trim()
                ? routeSkillSlug.trim()
                : null
        if (fromProp) return fromProp
        if (typeof window !== 'undefined') {
            return parseSkillIdFromBotAppAsPath(router.asPath)
        }
        return null
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    /**
     * Selected skill lives entirely in local state. Prior implementations derived it
     * from `router.asPath` / the `routeSkillSlug` prop and changed it by calling
     * `router.replace(nextUrl, undefined, { shallow: true })`. In Next 14 pages
     * router, `shallow: true` is only reliably honored when the pathname stays
     * identical and only query params change. Moving from
     * `/app/bots/:botId/configure/skills` (no slug) to
     * `/app/bots/:botId/configure/skills/:slug` — adding a segment to the
     * optional catch-all `[[...slug]]` — changes the pathname, so Next treats
     * it as a new URL, re-runs `getServerSideProps` and forces a full page
     * render. That wipes the in-flight `useChat` stream the user just started,
     * which was the root cause of "I sent a message and the page refreshed with
     * no reply".
     *
     * We instead update the URL bar via `window.history.replaceState` so the URL
     * stays bookmarkable, but Next's router is never involved for in-component
     * skill transitions, so it cannot decide to SSR the page.
     */
    const [selectedSkillName, setSelectedSkillNameState] = useState(
        initialSelectedSkill,
    )

    // When the parent genuinely hands us a new `routeSkillSlug` (fresh page
    // load, or the user navigated here from another tab via the sidebar),
    // sync local state. This effect does NOT fire for our own history.replaceState
    // updates because those don't propagate through Next's router, so the parent
    // prop stays stable.
    useEffect(() => {
        const next =
            routeSkillSlug && typeof routeSkillSlug === 'string' && routeSkillSlug.trim()
                ? routeSkillSlug.trim()
                : null
        setSelectedSkillNameState((prev) => (prev === next ? prev : next))
    }, [routeSkillSlug])

    const isShellDetail = Boolean(selectedSkillName) || createMode

    const skillsIndexPath = `/app/bots/${bot.id}/configure/skills`

    const replaceHistoryUrl = useCallback((url) => {
        if (typeof window === 'undefined') return
        try {
            const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
            if (current === url) return
            window.history.replaceState(window.history.state, '', url)
        } catch {
            // swallow; URL sync is best-effort
        }
    }, [])

    const SKILLS_BUILDER_LEAVE_AGENT_MESSAGE =
        'The builder agent is still working on a response. If you leave now, that work may be lost. Continue?'

    const navigateToSkillsIndex = useCallback(
        (opts = {}) => {
            const force = opts.force === true
            if (!force && builderAgentTurnInProgressRef.current) {
                if (!window.confirm(SKILLS_BUILDER_LEAVE_AGENT_MESSAGE)) return
            }
            setSelectedSkillNameState(null)
            replaceHistoryUrl(skillsIndexPath)
        },
        [replaceHistoryUrl, skillsIndexPath],
    )

    const navigateToSkill = useCallback(
        (slug, opts = {}) => {
            if (!slug) return
            const force = opts.force === true
            if (!force && builderAgentTurnInProgressRef.current) {
                if (!window.confirm(SKILLS_BUILDER_LEAVE_AGENT_MESSAGE)) return
            }
            setSelectedSkillNameState(slug)
            replaceHistoryUrl(`${skillsIndexPath}/${encodeURIComponent(slug)}`)
        },
        [replaceHistoryUrl, skillsIndexPath],
    )

    useEffect(() => {
        if (selectedSkillName) {
            setCreateMode(false)
            setChatStarted(true)
        } else {
            setChatStarted(false)
        }
    }, [selectedSkillName])

    // Dev-only pre-warm: the skills builder's backend is in the app router
    // (src/app/api/.../skills/**/route.js) while this page is in the pages
    // router. The very first time an app router route is compiled in a dev
    // session, Next fires a SERVER_COMPONENT_CHANGES HMR event that the pages
    // router HMR client unconditionally handles with
    // `window.location.reload()`. If that happens while a `useChat` stream is
    // mid-flight (e.g. right after submitting the first skill message), the
    // stream is aborted and the reply is lost. Pinging the routes at mount
    // time triggers that one-time compile up front, so the reload (if any)
    // lands on an empty builder instead of on top of an in-flight stream.
    // Noop in production — routes are pre-built, no HMR, no reload.
    useEffect(() => {
        if (process.env.NODE_ENV === 'production') return
        const ctrl =
            typeof AbortController !== 'undefined' ? new AbortController() : null
        const warm = async (url) => {
            try {
                await fetch(url, {
                    method: 'HEAD',
                    credentials: 'same-origin',
                    signal: ctrl?.signal,
                })
            } catch {
                // best-effort; any response (including 405) still warms the compile
            }
        }
        warm(apiBase)
        warm(`${apiBase}/_library`)
        warm(`${apiBase}/__warmup/agent`)
        return () => ctrl?.abort()
        // Only on mount — warming once per bot is enough; the `onDemandEntries`
        // bump in next.config.js keeps the route hot for an hour after that.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bot.id, team.id])

    const refreshDraft = useCallback(
        async (skillName = selectedSkillName) => {
            if (!skillName) return null

            const response = await fetch(`${apiBase}/${encodeURIComponent(skillName)}`, {
                credentials: 'same-origin',
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                throw new Error(data.message || 'Unable to load the skill draft.')
            }

            const data = await response.json()
            setDraftState((prev) => ({
                ...prev,
                draft: data.skill,
            }))
            return data.skill
        },
        [apiBase, selectedSkillName],
    )

    const loadDrafts = useCallback(async () => {
        const response = await fetch(apiBase, {
            credentials: 'same-origin',
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            throw new Error(data.message || 'Unable to load bot skills.')
        }

        const data = await response.json()
        setDrafts(data.skills || [])
        return data.skills || []
    }, [apiBase])

    const loadLibrarySkills = useCallback(async (query = '') => {
        setLoadingLibrary(true)
        setLibraryErrorText(null)
        try {
            const trimmedQuery = String(query || '').trim()
            const params = trimmedQuery
                ? `?${new URLSearchParams({ query: trimmedQuery, limit: '24' }).toString()}`
                : ''
            const response = await fetch(`${apiBase}/_library${params}`, {
                credentials: 'same-origin',
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to load the skills library.')
            }
            setLibrarySkills(data.skills || [])
            return data.skills || []
        } catch (error) {
            setLibraryErrorText(error.message || 'Unable to load the skills library.')
            setLibrarySkills([])
            return []
        } finally {
            setLoadingLibrary(false)
        }
    }, [apiBase])

    const refreshDraftUi = useCallback(
        async (skillName = selectedSkillName) => {
            if (!skillName) return

            await refreshDraft(skillName)
            await loadDrafts()
        },
        [loadDrafts, refreshDraft, selectedSkillName],
    )

    const clearPersistedChatLog = useCallback(
        (skillName) => {
            const name = String(skillName || '').trim()
            if (!name || typeof window === 'undefined') return
            try {
                window.localStorage.removeItem(
                    `docsbot:skills-builder-chat:${team.id}:${bot.id}:${name}`,
                )
            } catch {
                // ignore localStorage errors
            }
        },
        [bot.id, team.id],
    )

    const handleSkillDraftMissing = useCallback(
        async (skillName) => {
            const name = String(skillName || '').trim()
            if (name) clearPersistedChatLog(name)
            navigateToSkillsIndex({ force: true })
            setCreateMode(false)
            setDraftState(defaultDraftState)
            setFormDescription('')
            setFormTask('')
            setSelectedImages([])
            setPendingInitialMessage(null)
            setSkillPackages(null)
            setPkgError(null)
            try {
                await loadDrafts()
            } catch {
                // best-effort list refresh
            }
        },
        [clearPersistedChatLog, loadDrafts, navigateToSkillsIndex],
    )

    const bumpR2Refresh = useCallback(() => {
        setR2Tick((n) => n + 1)
    }, [])

    const chatTransport = useMemo(() => {
        if (!selectedSkillName) return undefined
        const enc = encodeURIComponent(selectedSkillName)
        return new DefaultChatTransport({
            api: `${apiBase}/${enc}/agent`,
            credentials: 'same-origin',
            body: {
                draftContext: {
                    selectedSkillName,
                },
            },
        })
    }, [apiBase, selectedSkillName])

    const chat = useChat({
        id: selectedSkillName
            ? `skills-builder-${team.id}-${bot.id}-${encodeURIComponent(selectedSkillName)}-${builderChatSessionEpoch}`
            : undefined,
        messages: [],
        transport: chatTransport,
        sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
        onFinish: async () => {
            if (!selectedSkillName) return
            const slug = selectedSkillName
            try {
                await refreshDraftUi(slug)
                bumpR2Refresh()
            } catch (error) {
                if (isSkillDraftMissingError(error)) {
                    await handleSkillDraftMissing(slug)
                    setErrorText(SKILL_DRAFT_MISSING_USER_MESSAGE)
                    return
                }
                setErrorText(error.message || 'Unable to refresh the skill draft.')
            }
        },
        onError: (error) => {
            const msg = openAiErrorMessage(error)
            const trimmed = msg.trim()
            const isConversationDesync =
                /out of sync|no tool call found|no tool output found/i.test(trimmed) ||
                (/call_id/i.test(trimmed) &&
                    /function call output|tool call|shell call/i.test(trimmed))
            if (isConversationDesync) {
                // Recover the just-typed user message so resetting the chat does not lose it.
                let lastUserText = ''
                try {
                    const msgs = chat.messages || []
                    for (let i = msgs.length - 1; i >= 0; i--) {
                        if (msgs[i]?.role !== 'user') continue
                        const textPart = (msgs[i].parts || []).find(
                            (p) => p?.type === 'text' && typeof p.text === 'string',
                        )
                        lastUserText = String(textPart?.text || msgs[i].content || '')
                        break
                    }
                } catch {
                    // best-effort capture
                }
                try {
                    chat.setMessages([])
                } catch {
                    // best-effort reset so the next send does not replay orphan tool outputs
                }
                clearPersistedChatLog(selectedSkillName)
                setErrorText(null)
                const trimmedUserText = lastUserText.trim()
                if (trimmedUserText) {
                    // Resend on the now-fresh conversation; without this the user's
                    // followup vanishes after a long idle (container/conversation expiry).
                    try {
                        builderChatFollowStreamRef.current = true
                        builderChatSuppressFollowUntilRef.current = 0
                        const maybePromise = chat.sendMessage({ text: trimmedUserText })
                        if (maybePromise && typeof maybePromise.then === 'function') {
                            void maybePromise.catch(() => {})
                        }
                    } catch {
                        // best-effort resend
                    }
                }
                return
            }
            setErrorText(trimmed ? trimmed : 'The builder agent failed to respond.')
        },
    })

    const [authUser] = useAuthState(auth)
    const isSuperAdminViewer = Boolean(authUser?.uid && isSuperAdmin(authUser.uid))

    const builderAgentUsageTooltipContent = useMemo(() => {
        if (!isSuperAdminViewer) return null
        return buildSkillsBuilderUsageTooltip({
            persistedUsage: draftState.draft?.agent?.builderUsageTotals,
            messages: chat.messages || [],
        })
    }, [isSuperAdminViewer, draftState.draft?.agent?.builderUsageTotals, chat.messages])

    const [assistantMessageDurationsMs, setAssistantMessageDurationsMs] = useState(() => new Map())

    useEffect(() => {
        const messages = chat.messages || []
        const last = messages[messages.length - 1]
        if (!last || last.role !== 'assistant') return

        const id = last.id

        if (chat.status === 'streaming') {
            setAssistantMessageDurationsMs((prev) => {
                if (prev.has(id)) return prev
                const next = new Map(prev)
                next.set(id, { start: Date.now() })
                return next
            })
        } else if (chat.status === 'ready') {
            setAssistantMessageDurationsMs((prev) => {
                const cur = prev.get(id)
                if (!cur?.start || cur.durationMs != null) return prev
                const next = new Map(prev)
                next.set(id, {
                    ...cur,
                    durationMs: Math.max(0, Date.now() - cur.start),
                })
                return next
            })
        }
    }, [chat.messages, chat.status])

    const addToolOutput = chat.addToolOutput

    const loading = chat.status === 'submitted' || chat.status === 'streaming'

    builderAgentTurnInProgressRef.current = loading

    const handleResetBuilderChat = useCallback(() => {
        if (!selectedSkillName) return
        if (builderAgentTurnInProgressRef.current) {
            try {
                chat.stop()
            } catch {
                // best-effort
            }
        }
        clearPersistedChatLog(selectedSkillName)
        setErrorText(null)
        setInfoText(null)
        setAssistantMessageDurationsMs(new Map())
        builderChatPrevMessageCountRef.current = 0
        processedToolEventKeysRef.current = new Set()
        builderChatFollowStreamRef.current = false
        builderChatSuppressFollowUntilRef.current = 0
        setBuilderChatSessionEpoch((e) => e + 1)
    }, [chat, clearPersistedChatLog, selectedSkillName])

    useBlockingNavigationWarning(loading, SKILLS_BUILDER_LEAVE_AGENT_MESSAGE)

    chatStatusForScrollRef.current = chat.status

    const askUi = getAskUserQuestionsUiState(chat.messages)

    const builderChatStorageKey = useMemo(() => {
        if (!selectedSkillName) return null
        return `docsbot:skills-builder-chat:${team.id}:${bot.id}:${selectedSkillName}`
    }, [bot.id, selectedSkillName, team.id])

    const normalizeChatSendError = useCallback((error) => {
        const parsed = openAiErrorMessage(error)
        if (parsed.trim()) return parsed
        if (typeof error?.message === 'string') return error.message
        if (
            error != null &&
            (typeof error === 'string' || typeof error === 'number' || typeof error === 'boolean')
        ) {
            return String(error)
        }
        return 'The builder agent failed to respond.'
    }, [])

    const sendBuilderMessageSafely = useCallback(
        (text) => {
            const content = String(text || '').trim()
            if (!content) return

            setErrorText(null)
            setInfoText(null)
            builderChatFollowStreamRef.current = true
            builderChatSuppressFollowUntilRef.current = 0

            try {
                const maybePromise = chat.sendMessage({ text: content })
                if (maybePromise && typeof maybePromise.then === 'function') {
                    void maybePromise.catch((error) => {
                        setErrorText(normalizeChatSendError(error))
                    })
                }
            } catch (error) {
                setErrorText(normalizeChatSendError(error))
            }
        },
        [chat, normalizeChatSendError],
    )

    const handleFixLogInBuilder = useCallback(
        (entry) => {
            if (!selectedSkillName || !entry) return

            const lines = [
                `Analyze the runtime error found in the logs for the skill "${selectedSkillName}" and fix it if it is caused by a bug or problem in the skill scripts.`,
                '',
                `Event type: ${entry.kind || 'unknown'}`,
                `Status: ${entry.status || 'unknown'}`,
                `Title: ${entry.title || 'Skill runtime error'}`,
            ]

            if (entry.functionName) {
                lines.push(`Function: ${entry.functionName}`)
            }
            if (Number.isFinite(entry.durationMs)) {
                lines.push(`Duration: ${Math.round(entry.durationMs)} ms`)
            }
            if (entry.summary) {
                lines.push(`Summary: ${entry.summary}`)
            }
            if (entry.error) {
                lines.push(`Error: ${entry.error}`)
            }

            const inputText = formatBuilderLogValue(entry.input)
            if (inputText) {
                lines.push('', 'Logged input:', inputText)
            }

            const outputText = formatBuilderLogValue(entry.output)
            if (outputText) {
                lines.push('', 'Logged output:', outputText)
            }

            lines.push(
                '',
                'Use the current draft files and validation tools to determine whether the issue is in the skill code or instructions. If it is a skill bug, make the fix, validate it, and summarize what changed.',
            )

            setDetailTab('builder')
            sendBuilderMessageSafely(lines.join('\n'))
        },
        [selectedSkillName, sendBuilderMessageSafely],
    )

    const handleAskWhereToGetBindings = useCallback(
        ({ envBindings = [], secretBindings = [] } = {}) => {
            const prompt = buildBindingsHelpPrompt({ envBindings, secretBindings })
            if (!prompt) return

            setErrorText(null)
            setInfoText(null)

            if (loading) {
                setInput((prev) => {
                    const current = String(prev || '').trim()
                    if (!current) return prompt
                    if (current.includes(prompt)) return prev
                    return `${current}\n\n${prompt}`
                })
                requestAnimationFrame(() => {
                    textareaRef.current?.focus()
                })
                return
            }

            sendBuilderMessageSafely(prompt)
        },
        [loading, sendBuilderMessageSafely],
    )

    const handleBuilderChatBeforeAskAnswers = useCallback(() => {
        builderChatFollowStreamRef.current = true
        builderChatSuppressFollowUntilRef.current = 0
    }, [])

    const builderRobotVariant = useMemo(
        () => resolveBuilderChatRobotVariant(chat.messages, chat.status),
        [chat.messages, chat.status],
    )

    const builderRobotGraphic = useMemo(() => {
        const cls = 'h-12 w-auto max-w-[4rem] sm:h-14 sm:max-w-[4.5rem]'
        switch (builderRobotVariant) {
            case 'thinking':
                return <RobotAnimationThinking className={cls} />
            case 'tools':
                return <RobotAnimationTraining className={cls} />
            case 'success':
                return <RobotAnimationCongrats className={cls} />
            case 'idle':
                return <RobotAnimation className={cls} />
            default:
                return null
        }
    }, [builderRobotVariant])

    useEffect(() => {
        if (!selectedSkillName || !builderChatStorageKey) return
        if (hydratedChatSkillRef.current === selectedSkillName) return
        hydratedChatSkillRef.current = selectedSkillName
        if (typeof window === 'undefined') return

        try {
            const raw = window.localStorage.getItem(builderChatStorageKey)
            if (!raw) return
            const cachedMessages = readSkillsBuilderChatCache(raw)
            if (Array.isArray(cachedMessages)) {
                chat.setMessages(cachedMessages)
                // If the hydrated chat ends on a user message, an in-flight agent stream
                // was interrupted (e.g. page reload mid-turn). Resume generation so the
                // user isn't stranded with their message and no assistant reply.
                const last = cachedMessages[cachedMessages.length - 1]
                const isSimplifiedExpiredBuildLog = cachedMessages.some(
                    (message) => message?.metadata?.simplifiedFromExpiredBuildLog,
                )
                if (
                    !isSimplifiedExpiredBuildLog &&
                    last?.role === 'user' &&
                    typeof chat.regenerate === 'function'
                ) {
                    try {
                        const maybePromise = chat.regenerate()
                        if (maybePromise && typeof maybePromise.then === 'function') {
                            void maybePromise.catch(() => {})
                        }
                    } catch {
                        // best-effort resume
                    }
                }
            } else {
                window.localStorage.removeItem(builderChatStorageKey)
            }
        } catch {
            window.localStorage.removeItem(builderChatStorageKey)
        }
    }, [builderChatStorageKey, chat, selectedSkillName])

    useEffect(() => {
        if (!selectedSkillName || !builderChatStorageKey) return
        if (hydratedChatSkillRef.current !== selectedSkillName) return
        if (typeof window === 'undefined') return

        try {
            if (chat.messages.length > 0) {
                window.localStorage.setItem(
                    builderChatStorageKey,
                    createSkillsBuilderChatCache(chat.messages),
                )
            } else {
                window.localStorage.removeItem(builderChatStorageKey)
            }
        } catch {
            // best-effort cache only
        }
    }, [builderChatStorageKey, chat.messages, selectedSkillName])

    useIsomorphicLayoutEffect(() => {
        if (!selectedSkillName) return
        const scrollEl = chatScrollRef.current
        if (!scrollEl) return

        const skillChanged = builderChatPrevSkillRef.current !== selectedSkillName
        if (skillChanged) {
            builderChatPrevSkillRef.current = selectedSkillName
            builderChatPrevMessageCountRef.current = chat.messages.length
            builderChatFollowStreamRef.current = false
            builderChatSuppressFollowUntilRef.current = 0
            flushBuilderChatScrollToEnd(scrollEl)
            updateBuilderChatScrollDownVisibility()
            return
        }

        const messageCount = chat.messages.length
        const lastMessage = messageCount > 0 ? chat.messages[messageCount - 1] : null
        const prevCount = builderChatPrevMessageCountRef.current
        const persistedHydrationJump =
            messageCount > 0 &&
            prevCount === 0 &&
            lastMessage?.role === 'assistant'
        const userMessageJustAdded =
            messageCount > prevCount && lastMessage?.role === 'user'
        builderChatPrevMessageCountRef.current = messageCount

        if (userMessageJustAdded) {
            builderChatSuppressFollowUntilRef.current = 0
            flushBuilderChatScrollToEnd(scrollEl)
        } else if (persistedHydrationJump || shouldBuilderChatFollow()) {
            flushBuilderChatScrollToEnd(scrollEl)
        }

        updateBuilderChatScrollDownVisibility()
    }, [
        chat.messages,
        chat.status,
        selectedSkillName,
        flushBuilderChatScrollToEnd,
        updateBuilderChatScrollDownVisibility,
        shouldBuilderChatFollow,
    ])

    useEffect(() => {
        if (!selectedSkillName) return
        const contentEl = chatMessagesContentRef.current
        if (!contentEl) return
        const ro = new ResizeObserver(() => {
            updateBuilderChatScrollDownVisibility()
            if (!shouldBuilderChatFollow()) return
            const el = chatScrollRef.current
            if (!el) return
            flushBuilderChatScrollToEnd(el)
        })
        ro.observe(contentEl)
        return () => ro.disconnect()
        // chat.messages.length lets the observer re-bind after the first content node mounts post-hydration.
    }, [
        selectedSkillName,
        flushBuilderChatScrollToEnd,
        updateBuilderChatScrollDownVisibility,
        shouldBuilderChatFollow,
        chat.messages.length,
    ])

    useEffect(() => {
        if (!selectedSkillName) return
        const el = chatScrollRef.current
        if (!el) return
        const clearFollow = () => {
            builderChatFollowStreamRef.current = false
            builderChatSuppressFollowUntilRef.current = 0
        }
        const onKeyDown = (event) => {
            const key = event.key
            if (
                key === 'PageUp' ||
                key === 'PageDown' ||
                key === 'ArrowUp' ||
                key === 'ArrowDown' ||
                key === 'Home' ||
                key === 'End' ||
                key === ' ' ||
                key === 'Spacebar'
            ) {
                clearFollow()
            }
        }
        el.addEventListener('wheel', clearFollow, { passive: true })
        el.addEventListener('touchstart', clearFollow, { passive: true })
        el.addEventListener('touchmove', clearFollow, { passive: true })
        el.addEventListener('keydown', onKeyDown)
        return () => {
            el.removeEventListener('wheel', clearFollow)
            el.removeEventListener('touchstart', clearFollow)
            el.removeEventListener('touchmove', clearFollow)
            el.removeEventListener('keydown', onKeyDown)
        }
    }, [selectedSkillName])

    function handleStopComposer(e) {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }
        void chat.stop()
    }

    const resizeTextarea = useCallback(() => {
        const textarea = textareaRef.current
        if (!textarea) return
        textarea.style.height = 'auto'
        textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }, [])

    useEffect(() => {
        resizeTextarea()
    }, [input, formTask, selectedImages.length, createMode, chatStarted, resizeTextarea])

    useEffect(() => {
        if (pendingUpgrade) {
            setShowUpgrade(true)
            setPendingUpgrade(false)
        }
    }, [pendingUpgrade])

    useEffect(() => {
        if (!libraryOpen) return
        const id = setTimeout(() => {
            void loadLibrarySkills(librarySearch)
        }, 250)
        return () => clearTimeout(id)
    }, [libraryOpen, librarySearch, loadLibrarySkills])

    useEffect(() => {
        if (!createMode || chatStarted) {
            setSimilarLibrarySkills([])
            setSimilarLibraryErrorText(null)
            setLoadingSimilarLibrarySkills(false)
            return
        }

        const query = formTask.trim()
        if (query.length < 8) {
            setSimilarLibrarySkills([])
            setSimilarLibraryErrorText(null)
            setLoadingSimilarLibrarySkills(false)
            return
        }

        let ignore = false
        const id = setTimeout(async () => {
            setLoadingSimilarLibrarySkills(true)
            setSimilarLibraryErrorText(null)
            try {
                const params = new URLSearchParams({ query, limit: '3' })
                const response = await fetch(`${apiBase}/_library?${params.toString()}`, {
                    credentials: 'same-origin',
                })
                const data = await response.json().catch(() => ({}))
                if (!response.ok) {
                    throw new Error(data.message || 'Unable to search the skills library.')
                }
                if (!ignore) {
                    setSimilarLibrarySkills(data.skills || [])
                }
            } catch (error) {
                if (!ignore) {
                    setSimilarLibrarySkills([])
                    setSimilarLibraryErrorText(error.message || 'Unable to search the skills library.')
                }
            } finally {
                if (!ignore) {
                    setLoadingSimilarLibrarySkills(false)
                }
            }
        }, 350)

        return () => {
            ignore = true
            clearTimeout(id)
        }
    }, [apiBase, chatStarted, createMode, formTask])

    useEffect(() => {
        if (!createMode || chatStarted) return
        setCreateIntentPlaceholderIndex(0)
        const id = setInterval(() => {
            setCreateIntentPlaceholderIndex((i) => (i + 1) % CREATE_SKILL_INTENT_PLACEHOLDERS.length)
        }, 3000)
        return () => clearInterval(id)
    }, [createMode, chatStarted])

    useEffect(() => {
        if (!pendingInitialMessage) return
        if (!selectedSkillName || !chatStarted || loading) return

        sendBuilderMessageSafely(pendingInitialMessage)
        setPendingInitialMessage(null)
    }, [
        chatStarted,
        loading,
        pendingInitialMessage,
        selectedSkillName,
        sendBuilderMessageSafely,
    ])

    const handleImageSelect = (e) => {
        if (!checkPlanPermission(team, 'personal').allowed) {
            setPendingUpgrade(true)
            return
        }

        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (selectedImages.length + files.length > 4) {
            setErrorText('Maximum 4 images allowed')
            return
        }

        files.forEach((file) => {
            if (!file.type.startsWith('image/')) {
                setErrorText('Please select only image files')
                return
            }

            const reader = new FileReader()
            reader.onload = (loadEvent) => {
                const img = new Image()
                img.onload = () => {
                    let width = img.width
                    let height = img.height
                    const maxSize = 1200

                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }

                    const canvas = document.createElement('canvas')
                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx.drawImage(img, 0, 0, width, height)

                    const base64 = canvas.toDataURL('image/jpeg', 0.8)
                    setSelectedImages((prev) => [...prev, { url: base64, file }])
                }
                img.src = loadEvent.target.result
            }
            reader.readAsDataURL(file)
        })
        e.target.value = ''
    }

    const removeImage = (index) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index))
    }

    useEffect(() => {
        let ignore = false

        async function bootstrap() {
            setIsBootstrapping(true)
            setErrorText(null)

            try {
                await loadDrafts()
                if (ignore) return
            } catch (error) {
                if (!ignore) {
                    setErrorText(error.message || 'Unable to initialize the skills builder.')
                }
            } finally {
                if (!ignore) {
                    setIsBootstrapping(false)
                }
            }
        }

        bootstrap()

        return () => {
            ignore = true
        }
    }, [loadDrafts])

    useEffect(() => {
        if (!selectedSkillName) return

        refreshDraft(selectedSkillName).catch((error) => {
            if (isSkillDraftMissingError(error)) {
                void handleSkillDraftMissing(selectedSkillName).then(() => {
                    setErrorText(SKILL_DRAFT_MISSING_USER_MESSAGE)
                })
                return
            }
            setErrorText(error.message || 'Unable to refresh the selected skill.')
        })
    }, [handleSkillDraftMissing, selectedSkillName, refreshDraft])

    useEffect(() => {
        if (!selectedSkillName || !drafts.length) return

        const selectedFromList = drafts.find((skill) => skill.name === selectedSkillName)
        if (!selectedFromList) return

        setDraftState((prev) => {
            if (
                prev.draft?.name === selectedFromList.name &&
                prev.draft?.updatedAt === selectedFromList.updatedAt &&
                prev.draft?.publishedAt === selectedFromList.publishedAt
            ) {
                return prev
            }

            return {
                ...prev,
                name: selectedFromList.name,
                draft: prev.draft ? { ...selectedFromList, ...prev.draft } : selectedFromList,
            }
        })
    }, [drafts, selectedSkillName])

    useEffect(() => {
        processedToolEventKeysRef.current = new Set()
    }, [selectedSkillName])

    useEffect(() => {
        setExpandedLogIds(new Set())
    }, [selectedSkillName])

    useEffect(() => {
        if (!selectedSkillName || !chat.messages.length) return

        const nextRefreshKeys = []

        chat.messages.forEach((message) => {
            message.parts?.forEach((part, index) => {
                const toolName = getToolPartName(part)
                if (!toolName || !LIVE_REFRESH_TOOL_NAMES.has(toolName)) return
                if (!isCompletedToolPart(part)) return

                const eventKey = [
                    selectedSkillName,
                    message.id,
                    index,
                    toolName,
                    part.toolCallId || part.callId || part.state || 'completed',
                ].join(':')

                if (processedToolEventKeysRef.current.has(eventKey)) return

                processedToolEventKeysRef.current.add(eventKey)
                nextRefreshKeys.push(toolName)
            })
        })

        if (!nextRefreshKeys.length) return

        // Sidebar skill details read `draftState` from GET …/skills/:name — list-only refresh is not enough.
        refreshDraftUi(selectedSkillName).catch((error) => {
            if (isSkillDraftMissingError(error)) {
                void handleSkillDraftMissing(selectedSkillName).then(() => {
                    setErrorText(SKILL_DRAFT_MISSING_USER_MESSAGE)
                })
                return
            }
            setErrorText(error.message || 'Unable to refresh skill details.')
        })
    }, [chat.messages, handleSkillDraftMissing, refreshDraftUi, selectedSkillName])

    const loadPublishedPackage = useCallback(async () => {
        if (!selectedSkillName) return
        setLoadingPkg(true)
        setPkgError(null)
        try {
            const response = await fetch(
                `${apiBase}/${encodeURIComponent(selectedSkillName)}/published-package`,
                {
                    credentials: 'same-origin',
                },
            )
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to load published package.')
            }
            if (!data || typeof data.draft !== 'object') {
                throw new Error('Invalid package response.')
            }
            setSkillPackages(data)
        } catch (e) {
            setPkgError(e.message || 'Failed to load published package.')
            setSkillPackages(null)
        } finally {
            setLoadingPkg(false)
        }
    }, [apiBase, selectedSkillName])

    const loadWorkersLogs = useCallback(async () => {
        if (!selectedSkillName) return
        setLoadingLogs(true)
        try {
            const params = new URLSearchParams({
                hours: '24',
                limit: '80',
                skillName: selectedSkillName,
            })
            const response = await fetch(`${workersLogsApi}?${params.toString()}`, {
                credentials: 'same-origin',
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to load logs.')
            }
            setWorkersLogs(data)
        } catch (e) {
            setWorkersLogs({
                configured: false,
                message: e.message,
                events: [],
            })
        } finally {
            setLoadingLogs(false)
        }
    }, [workersLogsApi, selectedSkillName])

    useEffect(() => {
        if (!isShellDetail || detailTab !== 'advanced' || !selectedSkillName) return
        loadPublishedPackage()
    }, [isShellDetail, detailTab, selectedSkillName, loadPublishedPackage, r2Tick])

    const advancedPanelHasFileDiff = useMemo(() => {
        if (!skillPackages?.hasPublished) return false
        return skillPackagesHaveDraftPublishedFileDiff(
            skillPackages.draft,
            skillPackages.published,
        )
    }, [skillPackages])

    useEffect(() => {
        if (detailTab !== 'advanced' || !skillPackages) return
        if (advancedPackageView === 'diff' && !advancedPanelHasFileDiff) {
            setAdvancedPackageView('draft')
        }
    }, [detailTab, skillPackages, advancedPackageView, advancedPanelHasFileDiff])

    useEffect(() => {
        if (!isShellDetail || detailTab !== 'logs') return
        loadWorkersLogs()
    }, [isShellDetail, detailTab, loadWorkersLogs])

    const selectedDraft = draftState.draft
    const skillTestTokenUrl =
        selectedSkillName && selectedDraft?.publishedAt && skillDraftHasCallableFunctions(selectedDraft)
            ? `${apiBase}/${encodeURIComponent(selectedSkillName)}/test-agent-token`
            : null

    const handleSendSkillTestReportToBuilder = useCallback(
        (prompt) => {
            if (!prompt) return
            setDetailTab('builder')
            sendBuilderMessageSafely(prompt)
        },
        [sendBuilderMessageSafely],
    )

    useEffect(() => {
        if (!isShellDetail) {
            setDetailTab('builder')
        }
    }, [isShellDetail])

    async function createDraftAndStart() {
        setErrorText(null)
        setInfoText(null)

        const task = formTask.trim()
        if (!task && !selectedImages.length) {
            setErrorText('Describe what you want the skill to do, or attach an image.')
            return
        }

        setIsSuggestingMetadata(true)
        setIsCreatingDraft(true)

        try {
            const suggestRes = await fetch(apiBase, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt: task,
                    audience: draftState.audience,
                    images: selectedImages.map((img) => ({ url: img.url })),
                }),
            })

            const suggestData = await suggestRes.json().catch(() => ({}))

            if (!suggestRes.ok) {
                throw new Error(suggestData.message || 'Unable to generate skill name and description.')
            }

            const skill = suggestData.skill
            if (!skill) {
                throw new Error('The server did not return a new skill draft.')
            }

            const generatedDescription = String(skill.description || '').trim()

            const createdSlug = String(
                skill.draftId ||
                    skill.id ||
                    normalizeSkillName(String(skill.name ?? '')),
            ).trim()

            setDraftState((prev) => ({
                ...prev,
                name: createdSlug,
                draft: skill,
            }))
            setFormDescription(generatedDescription)
            setCreateMode(false)
            setSelectedImages([])

            // Use the state-only navigator so this transition doesn't invoke
            // Next's router. See the comment on selectedSkillName — a pathname
            // change on the `[[...slug]]` catch-all re-runs getServerSideProps
            // even with shallow: true, which would remount this component and
            // abort the agent stream we're about to start.
            navigateToSkill(createdSlug)

            setChatStarted(true)
            await loadDrafts()
            setPendingInitialMessage(task)
        } catch (error) {
            setErrorText(error.message || 'Unable to create the skill draft.')
        } finally {
            setIsSuggestingMetadata(false)
            setIsCreatingDraft(false)
        }
    }

    function openList(options = {}) {
        const { clearMessages = true, forceNavigation = false } = options
        navigateToSkillsIndex({ force: forceNavigation })
        setCreateMode(false)
        setDraftState(defaultDraftState)
        setFormDescription('')
        setFormTask('')
        setSelectedImages([])
        setPendingInitialMessage(null)
        if (clearMessages) {
            setErrorText(null)
            setInfoText(null)
        }
    }

    async function deleteSelectedSkill() {
        if (!selectedSkillName || createMode || isDeletingSkill) return
        const label = formatSkillNameDisplay(selectedSkillName, selectedSkillName)
        if (
            !window.confirm(
                `Delete skill "${label}"? This removes the draft from the database and the published skill. This cannot be undone.`,
            )
        ) {
            return
        }
        setIsDeletingSkill(true)
        setErrorText(null)
        try {
            const response = await fetch(
                `${apiBase}/${encodeURIComponent(selectedSkillName)}`,
                {
                    method: 'DELETE',
                    credentials: 'same-origin',
                },
            )
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to delete this skill.')
            }
            setSkillPackages(null)
            setPkgError(null)
            await loadDrafts()
            clearPersistedChatLog(selectedSkillName)
            openList({ clearMessages: false, forceNavigation: true })
            setErrorText(null)
        } catch (error) {
            setErrorText(error.message || 'Unable to delete this skill.')
        } finally {
            setIsDeletingSkill(false)
        }
    }

    async function promoteSelectedSkillToLibrary() {
        if (!selectedSkillName || createMode || isPromotingLibrarySkill || !isSuperAdminViewer) return
        const label = formatSkillNameDisplay(selectedSkillName, selectedSkillName)
        if (
            !window.confirm(
                `Add "${label}" to the global skills library? This copies the currently published package.`,
            )
        ) {
            return
        }
        setIsPromotingLibrarySkill(true)
        setErrorText(null)
        setInfoText(null)
        try {
            const response = await fetch(
                `${apiBase}/${encodeURIComponent(selectedSkillName)}/library`,
                {
                    method: 'POST',
                    credentials: 'same-origin',
                },
            )
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to add this skill to the library.')
            }
            setInfoText('Skill added to the global skills library.')
        } catch (error) {
            setErrorText(error.message || 'Unable to add this skill to the library.')
        } finally {
            setIsPromotingLibrarySkill(false)
        }
    }

    function openCreateSkill() {
        navigateToSkillsIndex()
        setCreateMode(true)
        setDraftState({ ...defaultDraftState, audience: defaultSkillAudienceForBot(bot) })
        setFormDescription('')
        setFormTask('')
        setSelectedImages([])
        setPendingInitialMessage(null)
        setDetailTab('builder')
    }

    function openSkillsLibrary() {
        setLibraryOpen(true)
        setLibraryErrorText(null)
        void loadLibrarySkills()
    }

    function openExistingSkill(skill) {
        navigateToSkill(skill.name)
        setDraftState((prev) => ({
            ...prev,
            name: skill.name,
            draft: skill,
        }))
        setDetailTab('builder')
    }

    async function importLibrarySkill(skill) {
        if (!skill?.id || importingLibrarySkillId) return
        setImportingLibrarySkillId(skill.id)
        setLibraryErrorText(null)
        setErrorText(null)
        try {
            const response = await fetch(
                `${apiBase}/_library/${encodeURIComponent(skill.id)}/import`,
                {
                    method: 'POST',
                    credentials: 'same-origin',
                },
            )
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to import this library skill.')
            }
            const importedSkill = data.skill
            if (!importedSkill?.name) {
                throw new Error('The server did not return the imported skill.')
            }
            setLibraryOpen(false)
            setDraftState((prev) => ({
                ...prev,
                name: importedSkill.name,
                draft: importedSkill,
            }))
            await loadDrafts()
            navigateToSkill(importedSkill.name)
            setDetailTab('builder')
            setInfoText('Library skill imported into this bot.')
        } catch (error) {
            setLibraryErrorText(error.message || 'Unable to import this library skill.')
        } finally {
            setImportingLibrarySkillId(null)
        }
    }

    async function deleteLibrarySkillFromModal(skill) {
        if (!skill?.id || deletingLibrarySkillId || !isSuperAdminViewer) return
        const label = formatSkillNameDisplay(skill.name, skill.id)
        if (!window.confirm(`Delete "${label}" from the global skills library? This cannot be undone.`)) {
            return
        }
        setDeletingLibrarySkillId(skill.id)
        setLibraryErrorText(null)
        try {
            const response = await fetch(`${apiBase}/_library/${encodeURIComponent(skill.id)}`, {
                method: 'DELETE',
                credentials: 'same-origin',
            })
            const data = await response.json().catch(() => ({}))
            if (!response.ok) {
                throw new Error(data.message || 'Unable to delete this library skill.')
            }
            setLibrarySkills((prev) => prev.filter((entry) => entry.id !== skill.id))
        } catch (error) {
            setLibraryErrorText(error.message || 'Unable to delete this library skill.')
        } finally {
            setDeletingLibrarySkillId(null)
        }
    }

    const listPanel = (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-gray-200/80 bg-gray-50">
                <div className="px-8 pt-8 pb-4">
                    <Workspace.Header
                        title={<SkillsPageWorkspaceTitle />}
                        description={
                            <>
                                Skills are reusable instructions and tools that add capabilities to your bot. Describe
                                what you need and our coding agent will build one for you! After you publish a skill,
                                enable it on the{' '}
                                <Link
                                    href={`/app/bots/${bot.id}/widget/actions`}
                                    shallow
                                    className="text-cyan-700 underline hover:text-cyan-900"
                                >
                                    chat widget Actions tab
                                </Link>{' '}
                                so visitors can use skills in the widget. To register skills and other actions with the
                                embed, see the{' '}
                                <Link
                                    href="/documentation/developer/embeddable-chat-widget"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-700 underline hover:text-cyan-900"
                                >
                                    embeddable chat widget
                                </Link>{' '}
                                guide.
                            </>
                        }
                    />
                </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
                <div className="flex flex-col gap-8">
                    <Alert title={alertString(errorText)} type="error" />
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {drafts.map((skill) => (
                            <button
                                key={skill.name}
                                type="button"
                                onClick={() => openExistingSkill(skill)}
                                className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-cyan-300 hover:shadow-md"
                            >
                                <div className="flex items-start gap-3">
                                    <SkillListIcon icon={skill.icon} networkPolicy={skill.networkPolicy} />
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="text-base font-semibold text-gray-900">
                                                {formatSkillNameDisplay(skill.name, '—')}
                                            </div>
                                            <SkillStatusDot publishedAt={skill.publishedAt} />
                                        </div>
                                        <p className="mt-2 line-clamp-3 flex-1 text-sm text-gray-600">
                                            {skillListDescription(skill.description) || 'No description yet.'}
                                        </p>
                                        <div className="mt-4 flex items-center gap-0.5">
                                            <SkillAudienceIcon internal={skill.internal} size="sm" />
                                            <SkillCapabilityIcon mode={skill.mode} hasFunctions={skill.hasFunctions} size="sm" />
                                        </div>
                                    </div>
                                </div>
                            </button>
                        ))}
                        <button
                            type="button"
                            onClick={openSkillsLibrary}
                            className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
                        >
                            <BookOpenIcon className="h-10 w-10 text-cyan-600" aria-hidden />
                            <span className="mt-3 text-sm font-semibold text-cyan-800">Add from library</span>
                            <span className="mt-1 text-xs text-gray-500">
                                Search reusable skills and import a copy into this bot
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={openCreateSkill}
                            className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-5 text-center transition hover:border-cyan-400 hover:bg-cyan-50/40"
                        >
                            <PlusIcon className="h-10 w-10 text-cyan-600" aria-hidden />
                            <span className="mt-3 text-sm font-semibold text-cyan-800">Create new skill</span>
                            <span className="mt-1 text-xs text-gray-500">
                                Tell us what you need and the coding agent will build the skill for you
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )

    const createSkillComposerBusy = isSuggestingMetadata || isCreatingDraft

    const builderPanel = (
        <>
            {createMode && !chatStarted ? (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-gradient-to-b from-slate-50/90 to-white">
                    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pb-12 pt-2 sm:px-6 lg:flex-row lg:items-start lg:gap-10">
                        <div className="flex min-w-0 flex-col lg:flex-1">
                            <h2 className="text-center text-xl font-semibold text-gray-900 sm:text-2xl lg:text-left">
                                What kind of skill can I build for you?
                            </h2>
                            <p className="mt-2 text-center text-sm text-gray-500 lg:text-left">
                                Describe the capability in your own words. We generate a short name and description, then
                                start the builder with your message.
                            </p>

                        <label className="mt-8 block text-xs font-medium uppercase tracking-wide text-gray-500">
                            Audience
                        </label>
                        {draftState.audience === 'internal' && bot?.privacy === 'public' ? (
                            <Note color="yellow" size="sm" className="mt-2 leading-relaxed">
                                <p>
                                    This bot is <strong>public</strong> (embeddable on sites). Internal-only skills are
                                    meant for private or authenticated bots. If you continue, keep this skill
                                    instructional or read-only so it does not enable actions that users are not allowed
                                    to perform.
                                </p>
                            </Note>
                        ) : null}
                        <select
                            value={draftState.audience}
                            onChange={(e) =>
                                setDraftState((prev) => ({ ...prev, audience: e.target.value }))
                            }
                            disabled={createSkillComposerBusy}
                            className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-600 disabled:opacity-50"
                        >
                            <option value="customer">
                                Customer-facing — widget and public chats
                            </option>
                            <option value="internal">
                                Internal-only — team and authenticated use
                            </option>
                        </select>

                        <form
                            noValidate
                            className="mt-6"
                            onSubmit={(e) => {
                                e.preventDefault()
                                if (createSkillComposerBusy) return
                                void createDraftAndStart()
                            }}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                onChange={handleImageSelect}
                                accept="image/*"
                                multiple
                                className="hidden"
                            />
                            <div className="relative w-full rounded-xl border border-gray-300 bg-white shadow-sm sm:shadow-md">
                                <div className="absolute bottom-0 left-0 z-10 flex items-center gap-0 pl-2">
                                    <Tooltip
                                        content={
                                            createSkillComposerBusy
                                                ? 'Wait until name and description are ready'
                                                : checkPlanPermission(team, 'personal').allowed
                                                  ? 'Add an image'
                                                  : 'Upgrade to the Personal plan to enable image uploads'
                                        }
                                    >
                                        <div>
                                            <button
                                                type="button"
                                                disabled={createSkillComposerBusy}
                                                className={clsx(
                                                    'rounded-md p-2 text-gray-600 hover:text-cyan-600',
                                                    createSkillComposerBusy ||
                                                        selectedImages.length >= 4 ||
                                                        !checkPlanPermission(team, 'personal').allowed
                                                        ? 'cursor-not-allowed opacity-50'
                                                        : 'cursor-pointer',
                                                )}
                                                onClick={(ev) => {
                                                    ev.stopPropagation()
                                                    setErrorText(null)
                                                    if (createSkillComposerBusy) return
                                                    if (!checkPlanPermission(team, 'personal').allowed) {
                                                        setPendingUpgrade(true)
                                                        return
                                                    }
                                                    if (selectedImages.length < 4) {
                                                        fileInputRef.current?.click()
                                                    }
                                                }}
                                            >
                                                <PhotoIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </Tooltip>
                                </div>
                                {selectedImages.length > 0 && (
                                    <div className="absolute left-0 right-0 top-0 z-[1] flex flex-wrap gap-2 p-3 pb-2">
                                        {selectedImages.map((image, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={image.url}
                                                    alt={`Selected ${index + 1}`}
                                                    className="m-0 h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute -right-1 -top-1 rounded-full bg-gray-500 p-1 text-white hover:bg-gray-600"
                                                >
                                                    <XMarkIcon className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <textarea
                                    ref={textareaRef}
                                    name="skills-create-intent"
                                    id="skills-create-intent"
                                    value={formTask}
                                    maxLength={2000}
                                    rows={1}
                                    onChange={(e) => {
                                        setFormTask(e.target.value)
                                        resizeTextarea()
                                    }}
                                    onFocus={() => setErrorText(null)}
                                    onKeyDown={(e) => {
                                        if (e.isComposing || e.keyCode === 229) {
                                            return
                                        }
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault()
                                            if (
                                                !createSkillComposerBusy &&
                                                (formTask.trim() || selectedImages.length > 0)
                                            ) {
                                                void createDraftAndStart()
                                            }
                                        }
                                    }}
                                    tabIndex={1}
                                    autoComplete="off"
                                    className={clsx(
                                        'text-md placeholder:text-sm block min-h-16 w-full resize-none rounded-xl border-0 px-2 pb-12 outline-none ring-0 focus:ring-0 focus:outline-none disabled:opacity-50 sm:px-4',
                                        selectedImages.length > 0 ? 'pt-24' : 'pt-3',
                                    )}
                                    placeholder={
                                        CREATE_SKILL_INTENT_PLACEHOLDERS[createIntentPlaceholderIndex]
                                    }
                                    disabled={createSkillComposerBusy}
                                />
                                <div className="absolute bottom-0 right-0 z-10 p-2">
                                    <button
                                        type="submit"
                                        tabIndex={2}
                                        disabled={
                                            createSkillComposerBusy ||
                                            (!formTask.trim() && !selectedImages.length)
                                        }
                                        className="inline-flex items-center justify-center rounded-lg p-2 text-cyan-600 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <span className="sr-only">
                                            {createSkillComposerBusy ? 'Working…' : 'Continue'}
                                        </span>
                                        {createSkillComposerBusy ? (
                                            <LoadingSpinner className="h-6 w-6" />
                                        ) : (
                                            <PaperAirplaneIcon className="h-6 w-6" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </form>

                        {loadingSimilarLibrarySkills ||
                        similarLibraryErrorText ||
                        similarLibrarySkills.length > 0 ? (
                            <div className="mt-5 rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <div className="text-sm font-semibold text-gray-900">
                                            Similar skills in the library
                                        </div>
                                        <p className="mt-1 text-xs text-gray-600">
                                            Import a copy to skip the builder setup, then customize it for this bot.
                                        </p>
                                    </div>
                                    {loadingSimilarLibrarySkills ? (
                                        <LoadingSpinner className="h-4 w-4 text-cyan-700" aria-hidden />
                                    ) : null}
                                </div>
                                {similarLibraryErrorText ? (
                                    <div className="mt-3 text-xs text-red-700">{similarLibraryErrorText}</div>
                                ) : null}
                                {similarLibrarySkills.length > 0 ? (
                                    <div className="mt-3 space-y-2">
                                        {similarLibrarySkills.map((skill) => {
                                            const isImporting = importingLibrarySkillId === skill.id
                                            return (
                                                <div
                                                    key={skill.id}
                                                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm"
                                                >
                                                    <SkillListIcon
                                                        icon={skill.icon}
                                                        networkPolicy={skill.networkPolicy}
                                                    />
                                                    <div className="min-w-0 flex-1">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {formatSkillNameDisplay(skill.name, 'Skill')}
                                                        </div>
                                                        <p className="mt-1 line-clamp-2 text-xs text-gray-600">
                                                            {skillListDescription(skill.description) ||
                                                                'No description yet.'}
                                                        </p>
                                                        <div className="mt-2 flex items-center justify-between gap-2">
                                                            <div className="flex min-w-0 items-center gap-0.5">
                                                                <SkillAudienceIcon internal={skill.internal} size="sm" />
                                                                <SkillCapabilityIcon
                                                                    mode={skill.mode}
                                                                    hasFunctions={skill.hasFunctions}
                                                                    size="sm"
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                disabled={isImporting || createSkillComposerBusy}
                                                                onClick={() => void importLibrarySkill(skill)}
                                                                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-cyan-700 bg-cyan-700 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                            >
                                                                {isImporting ? (
                                                                    <LoadingSpinner className="h-4 w-4" aria-hidden />
                                                                ) : (
                                                                    <ArrowDownTrayIcon className="h-4 w-4" aria-hidden />
                                                                )}
                                                                Import
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) : null}
                            </div>
                        ) : null}

                        <div className="mt-10 space-y-6 text-sm leading-relaxed text-gray-600">
                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900">What are skills?</p>
                                <p>
                                    Skills are add-ons for your bot: extra instructions, checklists, or small TypeScript
                                    tools with code that help the AI handle specific jobs better—for example refund and
                                    billing
                                    workflows (eligibility, steps, escalations) and actions and webhooks via external
                                    APIs (calling your stack or partners to look up data, submit tickets, or update
                                    records).
                                    You describe what you want, and our agent helps build the skill for you.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900">Start from scratch or from a link</p>
                                <p>
                                    Write your idea in plain language above, or paste a link to a skill that&apos;s
                                    already published somewhere public—many teams share them on{' '}
                                    <span className="text-gray-800">GitHub</span> and similar sites. We can use that as a
                                    starting point to install and adapt it for your DocsBot bot.
                                </p>
                            </div>
                            <div className="space-y-3">
                                <p className="font-semibold text-gray-900">What happens next</p>
                                <p>
                                    The bot only pulls in the full instructions when a conversation actually needs them,
                                    so answers stay quick. If your skill includes code for actions (like calling an
                                    API), that runs in a secure environment when the agent uses it.
                                </p>
                            </div>
                        </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-center justify-start lg:sticky lg:top-4 lg:w-[min(320px,42%)] lg:max-w-sm lg:self-start">
                            {isSuggestingMetadata ? (
                                <RobotAnimationThinking
                                    className="h-auto w-full max-w-[220px] sm:max-w-xs lg:max-w-none"
                                    aria-hidden
                                />
                            ) : (
                                <RobotAnimation
                                    className="h-auto w-full max-w-[220px] sm:max-w-xs lg:max-w-none"
                                    aria-hidden
                                />
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden">
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3 lg:flex-row lg:items-stretch">
                        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:order-2 lg:min-w-0">
                {!selectedSkillName ? (
                    <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-gray-500">
                        Select or create a skill to use the builder chat.
                    </div>
                ) : (
                    <>
                        <div className="shrink-0 border-b border-gray-200 bg-gray-50 px-4 py-1.5 sm:px-5">
                            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-0">
                                <div className="flex min-w-0 flex-1 flex-col justify-center sm:w-3/4 sm:flex-none sm:pr-3">
                                    <div className="text-sm font-semibold leading-tight text-gray-900">Builder chat</div>
                                    <p className="mt-0 text-xs leading-snug text-gray-500">
                                        The DocsBot agent handles all research, building, validation, and publishing of
                                        skills.
                                    </p>
                                </div>
                                <div
                                    className="flex w-full min-w-0 flex-1 items-center justify-end border-t border-gray-100 pt-1.5 sm:w-1/4 sm:flex-none sm:border-l sm:border-t-0 sm:pl-3 sm:pt-0"
                                    aria-hidden={!builderAgentUsageTooltipContent}
                                >
                                    {builderAgentUsageTooltipContent ? (
                                        <Tooltip
                                            content={builderAgentUsageTooltipContent}
                                            placement="left"
                                        >
                                            <span className="inline-flex">{builderRobotGraphic}</span>
                                        </Tooltip>
                                    ) : (
                                        builderRobotGraphic
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
                        <div
                            ref={chatScrollRef}
                            className="min-h-0 flex-1 overflow-y-auto p-4"
                            onScroll={updateBuilderChatScrollDownVisibility}
                        >
                            {chat.messages.length > 0 ? (
                                <div ref={chatMessagesContentRef} className="space-y-4">
                                    {chat.messages.map((message, messageIndex) => {
                                        const isLatestMessage = messageIndex === chat.messages.length - 1
                                        const chatIsActive =
                                            chat.status === 'submitted' || chat.status === 'streaming'
                                        const isThisMessageStreaming = chatIsActive && isLatestMessage
                                        if (message.role === 'user') {
                                            return (
                                                <UserMessageBubble
                                                    key={message.id}
                                                    message={message}
                                                    isStreaming={isThisMessageStreaming}
                                                    isLatestMessage={isLatestMessage}
                                                />
                                            )
                                        }
                                        return (
                                            <AssistantMessageBlock
                                                key={message.id}
                                                message={message}
                                                isLatestMessage={isLatestMessage}
                                                isStreaming={isThisMessageStreaming}
                                                addToolOutput={addToolOutput}
                                                chatStarted={chatStarted}
                                                onStopComposer={handleStopComposer}
                                                onBeforeSubmitAnswers={handleBuilderChatBeforeAskAnswers}
                                                assistantMessageDurationMs={assistantMessageDurationsMs.get(
                                                    message.id,
                                                )?.durationMs}
                                                isSuperAdminViewer={isSuperAdminViewer}
                                            />
                                        )
                                    })}
                                </div>
                            ) : null}
                        </div>
                        <div
                            className="pointer-events-none absolute bottom-0 left-0 right-0 z-[5] h-4 bg-gradient-to-t from-white to-transparent"
                            aria-hidden
                        />
                        {chat.messages.length > 0 && builderChatShowScrollDown ? (
                            <button
                                type="button"
                                aria-label="Scroll to latest messages"
                                className="pointer-events-auto absolute bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-gray-200/90 bg-white/90 p-2.5 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
                                onClick={scrollBuilderChatToBottom}
                            >
                                <ArrowDownIcon className="h-5 w-5 text-gray-700" aria-hidden />
                            </button>
                        ) : null}
                        </div>
                        {askUi.phase === 'none' ? (
                            <div className="shrink-0 bg-white px-0 pb-1.5 pt-0 sm:pb-2">
                            <form
                                ref={builderComposerRef}
                                noValidate
                                className="flex flex-col justify-center bg-white px-3 pb-0 pt-0 sm:px-4"
                                translate="no"
                                onSubmit={(event) => {
                                    event.preventDefault()
                                    if (loading) return
                                    const nextInput = input.trim()
                                    if (!nextInput && !selectedImages.length) return
                                    const textWithImageHint = selectedImages.length
                                        ? `${nextInput}${nextInput ? '\n\n' : ''}[Attached images: ${selectedImages.length}]`
                                        : nextInput
                                    sendBuilderMessageSafely(textWithImageHint)
                                    setInput('')
                                    setSelectedImages([])
                                }}
                                disabled={loading}
                            >
                                <div className="mb-1 w-full rounded-xl sm:flex sm:shadow-sm">
                                    <div className="relative flex w-full flex-grow items-stretch shadow-sm sm:shadow-inherit">
                                        <>
                                            <div className="absolute bottom-0 left-0 z-10 flex items-center gap-0 pl-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    onChange={handleImageSelect}
                                                    accept="image/*"
                                                    multiple
                                                    className="hidden"
                                                />
                                                <Tooltip
                                                    content={
                                                        checkPlanPermission(team, 'personal').allowed
                                                            ? 'Add an image'
                                                            : 'Upgrade to the Personal plan to enable image uploads'
                                                    }
                                                >
                                                    <div>
                                                        <button
                                                            type="button"
                                                            className={clsx(
                                                                'cursor-pointer rounded-md p-2 text-gray-600 hover:text-cyan-600',
                                                                selectedImages.length >= 4 &&
                                                                    'cursor-not-allowed opacity-50',
                                                                !checkPlanPermission(team, 'personal').allowed &&
                                                                    'opacity-50',
                                                            )}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                setErrorText(null)
                                                                if (!checkPlanPermission(team, 'personal').allowed) {
                                                                    setPendingUpgrade(true)
                                                                    return
                                                                }
                                                                if (selectedImages.length < 4) {
                                                                    fileInputRef.current?.click()
                                                                }
                                                            }}
                                                        >
                                                            <PhotoIcon className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                </Tooltip>
                                            </div>
                                            {selectedImages.length > 0 && (
                                                <div className="absolute left-0 right-0 top-0 flex flex-wrap gap-2 p-3 pb-2">
                                                    {selectedImages.map((image, index) => (
                                                        <div key={index} className="relative">
                                                            <img
                                                                src={image.url}
                                                                alt={`Selected ${index + 1}`}
                                                                className="m-0 h-16 w-16 rounded-lg object-cover sm:h-20 sm:w-20"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => removeImage(index)}
                                                                className="absolute -right-1 -top-1 rounded-full bg-gray-500 p-1 text-white hover:bg-gray-600"
                                                            >
                                                                <XMarkIcon className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                            <textarea
                                                ref={textareaRef}
                                                name="skills-builder-query"
                                                id="skills-builder-query"
                                                value={input}
                                                maxLength={2000}
                                                rows={1}
                                                onChange={(e) => {
                                                    setInput(e.target.value)
                                                    resizeTextarea()
                                                }}
                                                onFocus={() => setErrorText(null)}
                                                onKeyDown={(e) => {
                                                    if (e.isComposing || e.keyCode === 229) {
                                                        return
                                                    }
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault()
                                                        if (e.shiftKey) {
                                                            const ta = textareaRef.current
                                                            if (ta) {
                                                                const start = ta.selectionStart
                                                                const end = ta.selectionEnd
                                                                const val = ta.value
                                                                ta.value = `${val.slice(0, start)}\n${val.slice(end)}`
                                                                setInput(ta.value)
                                                                ta.selectionStart = ta.selectionEnd = start + 1
                                                                resizeTextarea()
                                                            }
                                                        } else if (!loading) {
                                                            const value = input.trim()
                                                            if (
                                                                (value.length >= 2 || selectedImages.length > 0) &&
                                                                chatStarted &&
                                                                selectedSkillName
                                                            ) {
                                                                const textWithImageHint = selectedImages.length
                                                                    ? `${value}${value ? '\n\n' : ''}[Attached images: ${selectedImages.length}]`
                                                                    : value
                                                                sendBuilderMessageSafely(textWithImageHint)
                                                                setInput('')
                                                                setSelectedImages([])
                                                            }
                                                        }
                                                    }
                                                }}
                                                tabIndex={1}
                                                autoComplete="off"
                                                className={clsx(
                                                    'block min-h-16 w-full resize-none rounded-xl border border-gray-300 px-2 pb-10 text-sm outline-none ring-0 focus:ring-0 focus:border-cyan-600 disabled:opacity-50 sm:px-4',
                                                    selectedImages.length > 0 ? 'pt-24' : 'pt-3',
                                                )}
                                                placeholder="Follow up..."
                                                disabled={!chatStarted}
                                            />
                                            <button
                                                type={loading ? 'button' : 'submit'}
                                                tabIndex={2}
                                                onClick={(e) => {
                                                    if (loading) {
                                                        handleStopComposer(e)
                                                    }
                                                }}
                                                className="absolute bottom-0 right-0 my-3 mr-4 rounded-sm px-1 text-cyan-600 hover:text-cyan-700 hover:ring-cyan-600 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:opacity-50"
                                                disabled={!chatStarted || !selectedSkillName}
                                            >
                                                <span className="sr-only">
                                                    {loading ? 'Working…' : 'Send message'}
                                                </span>
                                                {loading ? (
                                                    <div className="group flex cursor-pointer items-center justify-center">
                                                        <div className="relative flex h-6 w-6 items-center justify-center">
                                                            <div className="absolute inset-0 rounded-full opacity-25" />
                                                            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-cyan-600" />
                                                            <StopIcon className="relative z-10 h-3 w-3 text-cyan-600 transition-transform duration-200 group-hover:scale-125" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <PaperAirplaneIcon className="h-6 w-6" />
                                                )}
                                            </button>
                                        </>
                                    </div>
                                </div>
                            </form>
                            <div className="mx-2 flex w-[calc(100%-1rem)] max-w-full items-start justify-between gap-2 bg-white px-1 pb-0 pt-1 sm:mx-3 sm:w-[calc(100%-1.5rem)] sm:px-2">
                                <p className="min-w-0 text-xs text-gray-500">
                                    Use Shift + Enter to skip to a new line.
                                </p>
                                <div className="flex shrink-0 items-center justify-end text-xs text-gray-500">
                                    <button
                                        type="button"
                                        className="ml-1 flex items-center text-gray-600 hover:text-cyan-700 focus:outline-none focus:ring-1 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        onClick={handleResetBuilderChat}
                                        disabled={loading}
                                    >
                                        <ArrowPathIcon
                                            className="mr-0.5 h-3 w-3"
                                            aria-hidden="true"
                                        />
                                        Reset
                                    </button>
                                </div>
                            </div>
                            </div>
                        ) : null}
                        </div>
                    </>
                )}
                        </div>

                        <div className="order-2 flex w-full min-h-0 shrink-0 flex-col lg:order-1 lg:w-[min(360px,40%)] lg:max-w-md lg:flex-none lg:self-start">
                            <div className="flex w-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                                <div className="shrink-0 border-b border-gray-100 px-3 py-2.5">
                                    <div className="text-sm font-semibold leading-tight text-gray-900">Skill details</div>
                                    <p className="mt-1 text-xs leading-snug text-gray-500">
                                        Updates live as the agent edits the manifest.
                                    </p>
                                </div>
                                <div className="px-3 pb-3 pt-3.5">
                                    <LiveManifestSidebar
                                        draft={selectedDraft}
                                        skillUpdateUrl={
                                            selectedSkillName
                                                ? `${apiBase}/${encodeURIComponent(selectedSkillName)}`
                                                : null
                                        }
                                        onSkillUpdated={(skill) =>
                                            setDraftState((prev) => ({ ...prev, draft: skill }))
                                        }
                                        setErrorText={setErrorText}
                                        setInfoText={setInfoText}
                                        onAskWhereToGetBindings={handleAskWhereToGetBindings}
                                        onOpenSkillTest={() => setSkillTestOpen(true)}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )

    const advancedPanel = (
        <div className="min-h-[400px] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                    Skill files refresh when the agent finishes a turn while you stay on this view, or when you click
                    refresh.
                </p>
                <div className="flex items-center gap-2">
                    <div className="inline-flex flex-wrap rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
                        {advancedPanelHasFileDiff ? (
                            <button
                                type="button"
                                onClick={() => setAdvancedPackageView('diff')}
                                className={clsx(
                                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1',
                                    advancedPackageView === 'diff'
                                        ? 'border border-cyan-700 bg-cyan-700 text-white shadow-sm hover:bg-cyan-800'
                                        : 'border border-transparent bg-white text-cyan-800 hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-900 active:bg-cyan-100/80',
                                )}
                            >
                                Diff
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={() => setAdvancedPackageView('draft')}
                            className={clsx(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1',
                                advancedPackageView === 'draft'
                                    ? 'border border-cyan-700 bg-cyan-700 text-white shadow-sm hover:bg-cyan-800'
                                    : 'border border-transparent bg-white text-cyan-800 hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-900 active:bg-cyan-100/80',
                            )}
                        >
                            Draft
                        </button>
                        <button
                            type="button"
                            onClick={() => setAdvancedPackageView('published')}
                            className={clsx(
                                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-1',
                                advancedPackageView === 'published'
                                    ? 'border border-cyan-700 bg-cyan-700 text-white shadow-sm hover:bg-cyan-800'
                                    : 'border border-transparent bg-white text-cyan-800 hover:border-cyan-600 hover:bg-cyan-50 hover:text-cyan-900 active:bg-cyan-100/80',
                            )}
                        >
                            Live
                        </button>
                    </div>
                    <Tooltip content="Refresh draft and published files from storage">
                        <span className="inline-flex shrink-0">
                            <button
                                type="button"
                                onClick={() => {
                                    bumpR2Refresh()
                                    loadPublishedPackage()
                                }}
                                disabled={loadingPkg || !selectedSkillName}
                                className="inline-flex items-center justify-center rounded-lg p-0 text-gray-600 transition hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label={
                                    loadingPkg ? 'Refreshing skill files…' : 'Refresh skill files'
                                }
                            >
                                <ArrowPathIcon
                                    className={clsx('h-5 w-5', loadingPkg && 'animate-spin')}
                                    aria-hidden
                                />
                            </button>
                        </span>
                    </Tooltip>
                </div>
            </div>
            {pkgError ? <Alert title={alertString(pkgError)} type="error" /> : null}
            {loadingPkg && !skillPackages ? (
                <Workspace.Loader message="Loading skill files…" />
            ) : null}
            {skillPackages ? (
                <>
                    {advancedPackageView === 'draft' ||
                    (advancedPackageView === 'diff' && !advancedPanelHasFileDiff) ? (
                        <BuilderSkillFilesPreview
                            title="Draft"
                            subtitle="Working copy the agent reads and writes."
                            pkg={skillPackages.draft}
                        />
                    ) : advancedPackageView === 'diff' && advancedPanelHasFileDiff ? (
                        <BuilderSkillFilesDiffPreview
                            draftPkg={skillPackages.draft}
                            publishedPkg={skillPackages.published}
                        />
                    ) : advancedPackageView === 'published' && !skillPackages.hasPublished ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                            This skill has not been published yet. Switch to Draft to inspect the working copy.
                        </div>
                    ) : (
                        <BuilderSkillFilesPreview
                            title="Live"
                            subtitle="Latest successful publish."
                            pkg={skillPackages.published}
                        />
                    )}
                </>
            ) : null}
        </div>
    )

    const formatLogTimestamp = (timestamp) => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        if (Number.isNaN(date.getTime())) return ''
        return date.toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        })
    }

    const getLogStatusLabel = (status) => {
        if (status === 'success') return 'Success'
        if (status === 'error') return 'Failed'
        return 'Info'
    }

    const getLogStatusClasses = (status) => {
        if (status === 'success') {
            return 'border-emerald-200 bg-emerald-50 text-emerald-800'
        }
        if (status === 'error') {
            return 'border-red-200 bg-red-50 text-red-800'
        }
        return 'border-gray-200 bg-gray-50 text-gray-700'
    }

    const hasLogDetails = (entry) =>
        Boolean(
            entry?.redirectChain ||
                entry?.error ||
                typeof entry?.input !== 'undefined' ||
                typeof entry?.output !== 'undefined',
        )

    const logsPanel = (
        <div className="min-h-[400px] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                    Recent runtime logs for this skill.
                </p>
                <Button
                    label={loadingLogs ? 'Loading…' : 'Refresh'}
                    onClick={loadWorkersLogs}
                    disabled={loadingLogs}
                    icon={loadingLogs ? LoadingSpinner : undefined}
                />
            </div>
            {loadingLogs && !workersLogs ? <Workspace.Loader message="Loading logs…" /> : null}
            {workersLogs && !workersLogs.configured ? (
                <Alert
                    title={
                        typeof workersLogs.message === 'string' && workersLogs.message.trim()
                            ? workersLogs.message
                            : 'Workers logs API is not configured for this environment.'
                    }
                    type="info"
                />
            ) : null}
            {workersLogs?.configured && workersLogs.message ? (
                <Alert title={alertString(workersLogs.message)} type="error" />
            ) : null}
            <div className="space-y-2">
                {(workersLogs?.events || []).length === 0 && workersLogs?.configured ? (
                    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
                        No recent skill runs were found in the selected time window.
                    </div>
                ) : null}
                {(workersLogs?.events || []).map((ev, i) => (
                    <div key={ev?.id || i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        {(() => {
                            const isExpanded = Boolean(ev?.id && expandedLogIds.has(ev.id))
                            const canExpand = hasLogDetails(ev)
                            return (
                                <>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900">{ev?.title || 'Skill event'}</p>
                                    {ev?.timestamp ? (
                                        <span className="text-xs text-gray-500">
                                            {formatLogTimestamp(ev.timestamp)}
                                        </span>
                                    ) : null}
                                </div>
                                <p className="mt-1 text-sm text-gray-700">
                                    {ev?.summary || 'Skill runtime event.'}
                                </p>
                            </div>
                            <span
                                className={clsx(
                                    'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium',
                                    getLogStatusClasses(ev?.status),
                                )}
                            >
                                {getLogStatusLabel(ev?.status)}
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                            {ev?.functionName ? (
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                    Function: {ev.functionName}
                                </span>
                            ) : null}
                            {Number.isFinite(ev?.durationMs) ? (
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                    Duration: {Math.round(ev.durationMs)} ms
                                </span>
                            ) : null}
                            {Number.isFinite(ev?.logCount) ? (
                                <span className="rounded-full bg-gray-100 px-2 py-1">
                                    Runtime logs: {ev.logCount}
                                </span>
                            ) : null}
                        </div>
                        {canExpand ? (
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={() => toggleExpandedLog(ev.id)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                                >
                                    {isExpanded ? (
                                        <ChevronDownIcon className="h-4 w-4" aria-hidden />
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4" aria-hidden />
                                    )}
                                    {isExpanded ? 'Hide details' : 'Show details'}
                                </button>
                            </div>
                        ) : null}
                        {ev?.status === 'error' ? (
                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={() => handleFixLogInBuilder(ev)}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-medium text-cyan-800 transition hover:bg-cyan-100"
                                >
                                    <WrenchScrewdriverIcon className="h-4 w-4" aria-hidden />
                                    Fix in builder
                                </button>
                            </div>
                        ) : null}
                        {ev?.error && !isExpanded ? (
                            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                {ev.error}
                            </div>
                        ) : null}
                        {isExpanded ? (
                            <div className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                {ev?.redirectChain ? (
                                    <div>
                                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Redirect Chain
                                        </div>
                                        <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3 text-xs text-gray-700">
                                            <div className="grid gap-2 sm:grid-cols-3">
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-gray-500">
                                                        Redirects
                                                    </div>
                                                    <div className="mt-0.5">
                                                        {Number.isFinite(ev.redirectChain.redirectCount)
                                                            ? ev.redirectChain.redirectCount
                                                            : ev.redirectChain.chain?.length || 0}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-gray-500">
                                                        Final Status
                                                    </div>
                                                    <div className="mt-0.5">
                                                        {Number.isFinite(ev.redirectChain.finalStatus)
                                                            ? ev.redirectChain.finalStatus
                                                            : 'Unknown'}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-semibold uppercase tracking-wide text-gray-500">
                                                        Final URL
                                                    </div>
                                                    <div className="mt-0.5 break-all">
                                                        {formatRedirectLogValue(ev.redirectChain.finalUrl)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-semibold uppercase tracking-wide text-gray-500">
                                                    Initial URL
                                                </div>
                                                <div className="mt-0.5 break-all">
                                                    {formatRedirectLogValue(ev.redirectChain.initialUrl)}
                                                </div>
                                            </div>
                                            {Array.isArray(ev.redirectChain.chain) && ev.redirectChain.chain.length ? (
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200 text-left">
                                                        <thead>
                                                            <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                                                                <th className="py-2 pr-3 font-semibold">Hop</th>
                                                                <th className="py-2 pr-3 font-semibold">Status</th>
                                                                <th className="py-2 pr-3 font-semibold">Method</th>
                                                                <th className="py-2 pr-3 font-semibold">Request URL</th>
                                                                <th className="py-2 font-semibold">Location</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {ev.redirectChain.chain.map((hop, hopIndex) => (
                                                                <tr key={`${ev.id}-redirect-hop-${hopIndex}`}>
                                                                    <td className="py-2 pr-3 align-top text-gray-500">
                                                                        {hopIndex + 1}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {Number.isFinite(hop?.status)
                                                                            ? hop.status
                                                                            : 'Unknown'}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {formatRedirectLogValue(hop?.method)}
                                                                    </td>
                                                                    <td className="max-w-xs break-all py-2 pr-3 align-top">
                                                                        {formatRedirectLogValue(hop?.requestUrl)}
                                                                    </td>
                                                                    <td className="max-w-xs break-all py-2 align-top">
                                                                        {formatRedirectLogValue(hop?.location)}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : null}
                                            {Array.isArray(ev.redirectChain.templateValueShapes) &&
                                            ev.redirectChain.templateValueShapes.length ? (
                                                <div className="overflow-x-auto">
                                                    <div className="mb-1 font-semibold uppercase tracking-wide text-gray-500">
                                                        Template Value Shapes
                                                    </div>
                                                    <table className="min-w-full divide-y divide-gray-200 text-left">
                                                        <thead>
                                                            <tr className="text-[11px] uppercase tracking-wide text-gray-500">
                                                                <th className="py-2 pr-3 font-semibold">Key</th>
                                                                <th className="py-2 pr-3 font-semibold">Length</th>
                                                                <th className="py-2 pr-3 font-semibold">Slashes</th>
                                                                <th className="py-2 pr-3 font-semibold">Segments</th>
                                                                <th className="py-2 pr-3 font-semibold">HTTP Scheme</th>
                                                                <th className="py-2 font-semibold">Whitespace</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                            {ev.redirectChain.templateValueShapes.map((shape, shapeIndex) => (
                                                                <tr key={`${ev.id}-template-shape-${shapeIndex}`}>
                                                                    <td className="py-2 pr-3 align-top font-medium text-gray-700">
                                                                        {formatRedirectLogValue(shape?.key)}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {Number.isFinite(shape?.length) ? shape.length : 'Unknown'}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {Number.isFinite(shape?.slashCount) ? shape.slashCount : 'Unknown'}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {Number.isFinite(shape?.segmentCount) ? shape.segmentCount : 'Unknown'}
                                                                    </td>
                                                                    <td className="py-2 pr-3 align-top">
                                                                        {shape?.startsWithHttpScheme === true
                                                                            ? 'Yes'
                                                                            : shape?.startsWithHttpScheme === false
                                                                              ? 'No'
                                                                              : 'Unknown'}
                                                                    </td>
                                                                    <td className="py-2 align-top">
                                                                        {shape?.hasWhitespace === true
                                                                            ? 'Yes'
                                                                            : shape?.hasWhitespace === false
                                                                              ? 'No'
                                                                              : 'Unknown'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                ) : null}
                                {ev?.error ? (
                                    <div>
                                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Error
                                        </div>
                                        <pre className="overflow-auto rounded-lg border border-red-200 bg-red-50 p-3 text-[11px] text-red-800">
                                            {formatBuilderLogValue(ev.error)}
                                        </pre>
                                    </div>
                                ) : null}
                                {typeof ev?.input !== 'undefined' ? (
                                    <div>
                                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Input
                                        </div>
                                        <pre className="overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-800">
                                            {formatBuilderLogValue(ev.input)}
                                        </pre>
                                    </div>
                                ) : null}
                                {typeof ev?.output !== 'undefined' ? (
                                    <div>
                                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                            Output
                                        </div>
                                        <pre className="overflow-auto rounded-lg border border-gray-200 bg-white p-3 text-[11px] text-gray-800">
                                            {formatBuilderLogValue(ev.output)}
                                        </pre>
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                                </>
                            )
                        })()}
                    </div>
                ))}
            </div>
        </div>
    )

    const detailPanel = (
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-end gap-x-2 gap-y-1.5 px-6 pt-3 pb-2 md:px-8">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <Tooltip content="Back to skills list">
                            <button
                                type="button"
                                onClick={openList}
                                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-2 text-gray-700 shadow-sm hover:bg-gray-50"
                            >
                                <ArrowLeftIcon className="h-4 w-4" aria-hidden />
                                <span className="sr-only">Back</span>
                            </button>
                        </Tooltip>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {!createMode && selectedSkillName && draftState.draft ? (
                                <SkillListIcon
                                    icon={draftState.draft.icon}
                                    networkPolicy={
                                        draftState.draft.networkPolicy ??
                                        draftState.draft.manifest?.networkPolicy
                                    }
                                    sizeClass="size-9"
                                />
                            ) : null}
                            <h1 className="min-w-0 truncate text-base font-semibold text-gray-900 md:text-lg">
                                {createMode && !selectedSkillName
                                    ? 'New skill'
                                    : formatSkillNameDisplay(selectedSkillName, 'Skill')}
                            </h1>
                            {!createMode && selectedSkillName ? (
                                <>
                                    {isSuperAdminViewer ? (
                                        <Tooltip
                                            content={
                                                isPromotingLibrarySkill
                                                    ? 'Adding to library…'
                                                    : 'Add to global skills library'
                                            }
                                        >
                                            <span className="inline-flex shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={() => void promoteSelectedSkillToLibrary()}
                                                    disabled={isPromotingLibrarySkill}
                                                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-transparent p-2 text-cyan-700 hover:border-cyan-200 hover:bg-cyan-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                    aria-label={
                                                        isPromotingLibrarySkill
                                                            ? 'Adding skill to library'
                                                            : 'Add skill to library'
                                                    }
                                                >
                                                    {isPromotingLibrarySkill ? (
                                                        <LoadingSpinner className="h-4 w-4" aria-hidden />
                                                    ) : (
                                                        <BookOpenIcon className="h-4 w-4" aria-hidden />
                                                    )}
                                                </button>
                                            </span>
                                        </Tooltip>
                                    ) : null}
                                    <Tooltip content={isDeletingSkill ? 'Deleting…' : 'Delete skill'}>
                                        <span className="inline-flex shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => void deleteSelectedSkill()}
                                                disabled={isDeletingSkill}
                                                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-transparent p-2 text-red-700 hover:border-red-200 hover:bg-red-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
                                                aria-label={isDeletingSkill ? 'Deleting skill' : 'Delete skill'}
                                            >
                                                {isDeletingSkill ? (
                                                    <LoadingSpinner className="h-4 w-4" aria-hidden />
                                                ) : (
                                                    <TrashIcon className="h-4 w-4" aria-hidden />
                                                )}
                                            </button>
                                        </span>
                                    </Tooltip>
                                </>
                            ) : null}
                        </div>
                    </div>
                    {!(createMode && !chatStarted) ? (
                        <nav
                            className="flex w-full shrink-0 justify-end gap-0.5 sm:ml-auto sm:w-auto"
                            aria-label="Skill section"
                        >
                            {DETAIL_TABS.map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setDetailTab(tab.id)}
                                    className={clsx(
                                        '-mb-px border-b-2 px-2.5 py-1 text-xs font-medium transition sm:px-3 sm:text-sm',
                                        detailTab === tab.id
                                            ? 'border-cyan-600 text-cyan-800'
                                            : 'border-transparent text-gray-500 hover:text-gray-800',
                                    )}
                                >
                                    {tab.title}
                                </button>
                            ))}
                        </nav>
                    ) : null}
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pb-10 md:px-8">
                <Alert title={alertString(errorText)} type="error" />
                <Alert title={alertString(infoText)} type="info" />

                {detailTab === 'builder' ? (
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden pt-2">
                        {builderPanel}
                    </div>
                ) : (
                    <div className="flex flex-col pt-2">
                        {detailTab === 'advanced' ? advancedPanel : null}
                        {detailTab === 'logs' ? logsPanel : null}
                    </div>
                )}
            </div>
        </div>
    )

    if (isBootstrapping) {
        return (
            <div className="flex min-h-0 w-full flex-1 flex-col">
                <div className="shrink-0 border-b border-gray-200/80 bg-gray-50">
                    <div className="px-8 pt-8 pb-4">
                        <Workspace.Header
                            title={<SkillsPageWorkspaceTitle />}
                            description="Build and manage bot-scoped skills."
                        />
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-8 pb-8">
                    <Workspace.Loader message="Loading skills…" variant="skills" />
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-0 w-full flex-1 flex-col overflow-x-hidden">
            <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
            <SkillsLibraryModal
                open={libraryOpen}
                onClose={() => setLibraryOpen(false)}
                skills={librarySkills}
                loading={loadingLibrary}
                errorText={libraryErrorText}
                search={librarySearch}
                setSearch={setLibrarySearch}
                capabilityFilter={libraryCapabilityFilter}
                setCapabilityFilter={setLibraryCapabilityFilter}
                audienceFilter={libraryAudienceFilter}
                setAudienceFilter={setLibraryAudienceFilter}
                importingSkillId={importingLibrarySkillId}
                deletingLibrarySkillId={deletingLibrarySkillId}
                isSuperAdminViewer={isSuperAdminViewer}
                onImportSkill={(skill) => void importLibrarySkill(skill)}
                onDeleteLibrarySkill={(skill) => void deleteLibrarySkillFromModal(skill)}
            />
            <SkillTestModal
                open={skillTestOpen}
                draft={selectedDraft}
                team={team}
                bot={bot}
                tokenUrl={skillTestTokenUrl}
                onClose={() => setSkillTestOpen(false)}
                onSendReportToBuilder={handleSendSkillTestReportToBuilder}
            />
            <div
                className={clsx(
                    'flex min-h-0 w-[200%] flex-1 items-stretch transition-transform duration-300 ease-out',
                    !isShellDetail ? 'translate-x-0' : '-translate-x-1/2',
                )}
            >
                <div className="flex w-1/2 min-h-0 shrink-0 flex-col self-stretch overflow-x-hidden">
                    {listPanel}
                </div>
                <div className="flex w-1/2 min-h-0 shrink-0 min-w-0 flex-col self-stretch">
                    {detailPanel}
                </div>
            </div>
        </div>
    )
}

export default PageConfigureSkills
