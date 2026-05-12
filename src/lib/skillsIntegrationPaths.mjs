/** Pure URL/path helpers for Skills Library pages (safe for client bundles; no Node fs). */

export const SKILL_INTEGRATION_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const SKILL_CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** URL segment for a Skills Library category (derived from the display name). */
export function skillCategorySlug(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') return ''
  return categoryName
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Path is `/skills/{categorySlug}/{integrationSlug}` so category hubs and detail pages share one segment. */
export function getSkillIntegrationPath(record) {
  if (!record?.slug || !record?.category || !SKILL_INTEGRATION_SLUG_PATTERN.test(record.slug)) {
    return '/skills'
  }
  return `/skills/${skillCategorySlug(record.category)}/${record.slug}`
}

export function resolveSkillCategoryNameFromSlug(categorySlug, records = []) {
  if (!SKILL_CATEGORY_SLUG_PATTERN.test(categorySlug || '')) return null
  for (const record of records) {
    if (skillCategorySlug(record.category) === categorySlug) {
      return record.category
    }
  }
  return null
}
