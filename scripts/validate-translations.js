#!/usr/bin/env node
/**
 * Validates that every translation key present in English (en) is also present
 * in every other language in src/constants/strings.constants.js.
 * Run: node scripts/validate-translations.js
 */
const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '..', 'src', 'constants', 'strings.constants.js')
const content = fs.readFileSync(filePath, 'utf8')

// Extract i18n object
const match = content.match(/export const i18n = ([\s\S]*?});?\s*$/)
if (!match) {
  console.error('Could not parse strings.constants.js')
  process.exit(1)
}

let i18n
try {
  i18n = eval('(' + match[1] + ')')
} catch (e) {
  console.error('Failed to parse i18n object:', e.message)
  process.exit(1)
}

const enKeys = new Set(Object.keys(i18n.en?.labels || {}))
const langs = Object.keys(i18n).filter((k) => k !== 'en')

const missing = {}
const extra = {}

for (const lang of langs) {
  const keys = new Set(Object.keys(i18n[lang]?.labels || {}))
  const absent = [...enKeys].filter((k) => !keys.has(k))
  const ext = [...keys].filter((k) => !enKeys.has(k))
  if (absent.length) missing[lang] = absent
  if (ext.length) extra[lang] = ext
}

let failed = false

if (Object.keys(missing).length > 0) {
  console.error('ERROR: Missing keys (in en but not in other languages):')
  console.error(JSON.stringify(missing, null, 2))
  failed = true
}

if (Object.keys(extra).length > 0) {
  console.error('ERROR: Extra keys (in other languages but not in en):')
  console.error(JSON.stringify(extra, null, 2))
  failed = true
}

if (failed) {
  process.exit(1)
}

console.log(`OK: All ${enKeys.size} English keys are present in all ${langs.length} languages.`)
