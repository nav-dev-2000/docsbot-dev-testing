#!/usr/bin/env node
/**
 * Merge widget locale packs (export default { name, isRTL?, labels }) into
 * src/constants/strings.constants.js.
 *
 * Usage (from repo root, or adjust path — script lives at scripts/merge-widget-locales.mjs under the skill):
 *   node .agents/skills/widget-locale-merge/scripts/merge-widget-locales.mjs
 *   node .../merge-widget-locales.mjs /path/to/widget/locales
 *   node .../merge-widget-locales.mjs --locales-dir /path/to/locales
 *
 * Default locales directory: <repo>/locales
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function findRepoRoot(fromDir) {
  let dir = fromDir
  for (;;) {
    const marker = path.join(dir, 'src', 'constants', 'strings.constants.js')
    if (fs.existsSync(marker)) return dir
    const parent = path.dirname(dir)
    if (parent === dir) {
      throw new Error(
        'Could not find repo root (expected src/constants/strings.constants.js in an ancestor of the script)',
      )
    }
    dir = parent
  }
}

const root = findRepoRoot(__dirname)
const defaultLocalesDir = path.join(root, 'locales')
const outPath = path.join(root, 'src', 'constants', 'strings.constants.js')

function parseLocalesDirArg(argv) {
  const args = argv.slice(2)
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--locales-dir' && args[i + 1]) {
      return args[++i]
    }
    if (!args[i].startsWith('-')) {
      return args[i]
    }
  }
  return null
}

function resolveLocalesDir(arg) {
  if (!arg) return defaultLocalesDir
  return path.isAbsolute(arg) ? arg : path.resolve(process.cwd(), arg)
}

function parseDefaultExportObject(content) {
  const marker = 'export default '
  const idx = content.indexOf(marker)
  if (idx === -1) throw new Error('No export default in locale file')
  let i = idx + marker.length
  while (content[i] === ' ' || content[i] === '\n') i++
  if (content[i] !== '{') throw new Error('Expected { after export default')
  let depth = 0
  const start = i
  for (; i < content.length; i++) {
    const c = content[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        return eval(`(${content.slice(start, i + 1)})`)
      }
    }
  }
  throw new Error('Unbalanced braces in locale default export')
}

function parseI18nFromSource(content) {
  const marker = 'export const i18n = '
  const start = content.indexOf(marker)
  if (start === -1) throw new Error('Could not find export const i18n')
  let i = start + marker.length
  while (content[i] === ' ' || content[i] === '\n') i++
  if (content[i] !== '{') throw new Error('Expected { after i18n =')
  let depth = 0
  const objStart = i
  for (; i < content.length; i++) {
    const c = content[i]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) {
        const jsonish = content.slice(objStart, i + 1)
        return eval(`(${jsonish})`)
      }
    }
  }
  throw new Error('Unbalanced braces in i18n object')
}

/** Widget uses ja.js; this codebase uses jp */
const FILE_TO_I18N = { ja: 'jp' }

const EN_EXTRA = {
  submit: 'Submit',
  cancel: 'Cancel',
  stripeAmount: 'Amount',
  stripeInvoice: 'Invoice',
  stripeAmountDue: 'Due',
  stripeAmountPaid: 'Paid',
  stripeDate: 'Date',
  stripeViewInvoice: 'View invoice',
  stripeHideLineItems: 'Hide line items',
  stripeViewLineItems: 'View {count} line item(s)',
  stripeItem: 'Item',
  stripeQty: 'Qty',
  stripeSubscription: 'Subscription',
  stripeCurrentPeriod: 'Current period',
  stripeTrialEnds: 'Trial ends',
  stripeTrialDayLeft: 'day left',
  stripeTrialDaysLeft: 'days left',
  stripeCancelsAtPeriodEnd: 'Cancels at period end',
  stripeIntervalDay: 'day',
  stripeIntervalWeek: 'week',
  stripeIntervalMonth: 'month',
  stripeIntervalYear: 'year',
  stripeIntervalDays: 'days',
  stripeIntervalWeeks: 'weeks',
  stripeIntervalMonths: 'months',
  stripeIntervalYears: 'years',
  stripeStatusDraft: 'Draft',
  stripeStatusOpen: 'Open',
  stripeStatusPaid: 'Paid',
  stripeStatusUncollectible: 'Uncollectible',
  stripeStatusVoid: 'Void',
  stripeStatusIncomplete: 'Incomplete',
  stripeStatusIncompleteExpired: 'Incomplete expired',
  stripeStatusTrialing: 'Trialing',
  stripeStatusActive: 'Active',
  stripeStatusPastDue: 'Past due',
  stripeStatusPastDueUnresolved: 'Past due (unresolved)',
  stripeStatusCanceled: 'Canceled',
  stripeStatusUnpaid: 'Unpaid',
  stripeStatusPaused: 'Paused',
}

function normalizePackLabels(raw) {
  const out = { ...raw }
  const fetchMsg =
    out.agentActivityStripeRecentInvoicesAndSubscriptions ||
    out.agentActivityStripeRecentInvoices ||
    out.agentActivityStripeCustomerSubscriptions
  if (fetchMsg) {
    out.agentActivityStripeRecentInvoicesAndSubscriptions = fetchMsg
  }
  delete out.agentActivityStripeRecentInvoices
  delete out.agentActivityStripeCustomerSubscriptions
  return out
}

function buildCanonicalKeys(baseEnLabels, widgetNormalized) {
  const enKeys = Object.keys(baseEnLabels)
  const set = new Set([...enKeys, ...Object.keys(widgetNormalized), ...Object.keys(EN_EXTRA)])
  const ordered = []
  const push = (k) => {
    if (set.has(k)) {
      ordered.push(k)
      set.delete(k)
    }
  }
  for (const k of enKeys) {
    push(k)
    if (k === 'create') {
      push('submit')
      push('cancel')
    }
    if (k === 'agentActivityStripeCancelSubscription') {
      for (const wk of Object.keys(widgetNormalized)) {
        if (wk.startsWith('stripe')) push(wk)
      }
    }
  }
  for (const k of [...set].sort()) push(k)
  return ordered
}

function escapeJsString(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function fmtLabelValue(v) {
  return `'${escapeJsString(v)}'`
}

function serializeLang(key, entry, canonicalKeys) {
  const lines = [`  ${key}: {`]
  lines.push(`    name: ${fmtLabelValue(entry.name)},`)
  if (entry.isRTL === true) {
    lines.push(`    isRTL: true,`)
  }
  lines.push(`    labels: {`)
  for (const lk of canonicalKeys) {
    const v = entry.labels[lk]
    if (v === undefined) continue
    const q = lk.match(/^[a-zA-Z_]\w*$/) ? lk : JSON.stringify(lk)
    lines.push(`      ${q}: ${fmtLabelValue(v)},`)
  }
  lines.push(`    },`)
  lines.push(`  },`)
  return lines.join('\n')
}

function pickReferenceBasename(localeBasenames) {
  if (localeBasenames.includes('de')) return 'de'
  if (localeBasenames.includes('en')) return 'en'
  if (localeBasenames.length === 0) {
    throw new Error('No .js locale files found in the given directory')
  }
  return [...localeBasenames].sort()[0]
}

function main() {
  const localesDir = resolveLocalesDir(parseLocalesDirArg(process.argv))
  if (!fs.existsSync(localesDir) || !fs.statSync(localesDir).isDirectory()) {
    console.error(`Not a directory: ${localesDir}`)
    process.exit(1)
  }

  const loadLocaleSync = (basename) => {
    const p = path.join(localesDir, `${basename}.js`)
    return parseDefaultExportObject(fs.readFileSync(p, 'utf8'))
  }

  const existingI18n = parseI18nFromSource(fs.readFileSync(outPath, 'utf8'))

  const localeFiles = fs
    .readdirSync(localesDir)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.basename(f, '.js'))

  const refCode = pickReferenceBasename(localeFiles)
  const refPack = loadLocaleSync(refCode)
  const widgetNorm = normalizePackLabels(refPack.labels || {})

  const baseEnLabels = { ...existingI18n.en.labels, ...EN_EXTRA }
  const canonicalKeys = buildCanonicalKeys(
    { ...existingI18n.en.labels },
    widgetNorm,
  )

  const packsByI18nKey = new Map()
  for (const fileCode of localeFiles) {
    const i18nKey = FILE_TO_I18N[fileCode] || fileCode
    const pack = loadLocaleSync(fileCode)
    packsByI18nKey.set(i18nKey, pack)
  }

  const merged = {}

  function buildEntry(i18nKey, pack) {
    const prev = existingI18n[i18nKey]
    const norm = normalizePackLabels(pack.labels || {})
    const labels = {}
    for (const k of canonicalKeys) {
      if (Object.prototype.hasOwnProperty.call(norm, k)) {
        labels[k] = norm[k]
      } else if (prev && Object.prototype.hasOwnProperty.call(prev.labels || {}, k)) {
        labels[k] = prev.labels[k]
      } else {
        labels[k] = baseEnLabels[k] ?? existingI18n.en.labels[k] ?? EN_EXTRA[k] ?? ''
      }
    }
    const isRTL = pack.isRTL === true || prev?.isRTL === true
    return {
      name: pack.name || prev?.name || i18nKey,
      ...(isRTL ? { isRTL: true } : {}),
      labels,
    }
  }

  const enPack = {
    name: existingI18n.en.name,
    labels: { ...existingI18n.en.labels, ...EN_EXTRA },
  }
  merged.en = buildEntry('en', enPack)

  for (const i18nKey of packsByI18nKey.keys()) {
    if (i18nKey === 'en') continue
    const pack = packsByI18nKey.get(i18nKey)
    merged[i18nKey] = buildEntry(i18nKey, pack)
  }

  for (const i18nKey of Object.keys(existingI18n)) {
    if (merged[i18nKey]) continue
    const prev = existingI18n[i18nKey]
    const labels = {}
    for (const k of canonicalKeys) {
      labels[k] = prev.labels?.[k] ?? baseEnLabels[k] ?? existingI18n.en.labels[k] ?? EN_EXTRA[k] ?? ''
    }
    merged[i18nKey] = {
      name: prev.name,
      ...(prev.isRTL ? { isRTL: true } : {}),
      labels,
    }
  }

  const langOrder = []
  const seen = new Set()
  for (const k of Object.keys(existingI18n)) {
    if (merged[k]) {
      langOrder.push(k)
      seen.add(k)
    }
  }
  for (const k of Object.keys(merged).sort()) {
    if (!seen.has(k)) langOrder.push(k)
  }

  const body = langOrder.map((k) => serializeLang(k, merged[k], canonicalKeys)).join('\n')
  const out = `export const i18n = {\n${body}\n}\n`
  fs.writeFileSync(outPath, out, 'utf8')
  console.log(
    `Locales dir: ${localesDir}\nWrote ${outPath} (${langOrder.length} langs, ${canonicalKeys.length} label keys).`,
  )
}

try {
  main()
} catch (e) {
  console.error(e)
  process.exit(1)
}
