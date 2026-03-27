import { describe, expect, it } from 'vitest'

import { i18n } from '@/constants/strings.constants'

const englishLabelsForAllowlist = i18n.en.labels
const WIDGET_KEYS_OFTEN_IDENTICAL_TO_EN = Object.keys(englishLabelsForAllowlist).filter(
  (k) => k.startsWith('stripe') || k === 'submit' || k === 'cancel',
)

const ALLOWED_ENGLISH_VALUE_MATCHES = {
  nl: ['floatingButton', 'stripeIntervalWeek'],
  fr: ['sources', 'stripeDate'],
  it: ['feedbackNo'],
  es: ['feedbackNo'],
  /** No locales/fil.js pack yet; Stripe/submit strings intentionally match EN until translated */
  fil: WIDGET_KEYS_OFTEN_IDENTICAL_TO_EN,
  id: ['stripeItem'],
  pt: ['stripeItem'],
  ms: ['stripeItem'],
  ca: ['feedbackNo'],
  af: ['stripeIntervalWeek'],
}

function getMissingKeys(referenceKeys, localeLabels) {
  return referenceKeys.filter((key) => !(key in localeLabels))
}

function getUnexpectedKeys(referenceKeys, localeLabels) {
  return Object.keys(localeLabels).filter((key) => !referenceKeys.includes(key))
}

function getBlankRequiredKeys(referenceLabels, localeLabels) {
  return Object.entries(referenceLabels)
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([key]) => key)
    .filter((key) => {
      const value = localeLabels[key]
      return typeof value !== 'string' || value.trim() === ''
    })
}

function getEnglishMatches(referenceLabels, localeLabels, allowedKeys = []) {
  return Object.entries(referenceLabels)
    .filter(([, value]) => typeof value === 'string' && value.trim() !== '')
    .map(([key]) => key)
    .filter((key) => !allowedKeys.includes(key))
    .filter((key) => localeLabels[key] === referenceLabels[key])
}

describe('strings.constants locale coverage', () => {
  const englishLabels = i18n.en.labels
  const englishKeys = Object.keys(englishLabels)
  const nonEnglishLocales = Object.entries(i18n).filter(([locale]) => locale !== 'en')

  it('keeps every locale labels object in sync with English keys', () => {
    const problems = nonEnglishLocales.flatMap(([locale, config]) => {
      const localeLabels = config.labels || {}
      const missingKeys = getMissingKeys(englishKeys, localeLabels)
      const unexpectedKeys = getUnexpectedKeys(englishKeys, localeLabels)

      const issues = []
      if (missingKeys.length > 0) {
        issues.push(`${locale} missing keys: ${missingKeys.join(', ')}`)
      }
      if (unexpectedKeys.length > 0) {
        issues.push(`${locale} unexpected keys: ${unexpectedKeys.join(', ')}`)
      }
      return issues
    })

    expect(
      problems,
      `Locale label key mismatches found:\n${problems.join('\n')}`,
    ).toEqual([])
  })

  it('requires non-empty translated values for every non-empty English label', () => {
    const problems = nonEnglishLocales.flatMap(([locale, config]) => {
      const localeLabels = config.labels || {}
      const blankKeys = getBlankRequiredKeys(englishLabels, localeLabels)

      return blankKeys.length > 0
        ? [`${locale} blank values: ${blankKeys.join(', ')}`]
        : []
    })

    expect(
      problems,
      `Blank translated labels found:\n${problems.join('\n')}`,
    ).toEqual([])
  })

  it('does not allow non-English locales to reuse non-empty English label values', () => {
    const problems = nonEnglishLocales.flatMap(([locale, config]) => {
      const localeLabels = config.labels || {}
      const allowedKeys = ALLOWED_ENGLISH_VALUE_MATCHES[locale] || []
      const englishMatches = getEnglishMatches(
        englishLabels,
        localeLabels,
        allowedKeys,
      )

      return englishMatches.length > 0
        ? [`${locale} matches English values: ${englishMatches.join(', ')}`]
        : []
    })

    expect(
      problems,
      `Untranslated English labels found:\n${problems.join('\n')}`,
    ).toEqual([])
  })
})
