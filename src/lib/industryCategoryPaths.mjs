/** Pure URL/path helpers for generated industry category pages. */

export const INDUSTRY_CATEGORY_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function industryCategorySlug(categoryName) {
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

export function getIndustryCategoryPath(categoryName) {
  const slug = industryCategorySlug(categoryName)
  return slug ? `/industry-category/${slug}` : '/industry'
}

export function resolveIndustryCategoryNameFromSlug(categorySlug, records = []) {
  if (!INDUSTRY_CATEGORY_SLUG_PATTERN.test(categorySlug || '')) return null
  for (const record of records) {
    if (industryCategorySlug(record.industryCategory) === categorySlug) {
      return record.industryCategory
    }
  }
  return null
}
