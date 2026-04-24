import slugify from '@sindresorhus/slugify'

/** Shared slug rules for skill document IDs and API paths (no firebase / server-only deps). */
export function normalizeSkillName(input) {
    const normalized = slugify(String(input || '').trim(), {
        separator: '-',
        lowercase: true,
        decamelize: true,
    })
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64)

    return normalized || 'new-skill'
}

/** Human-readable label for a skill id/slug: split on slashes, hyphens, underscores; title-case words. */
export function formatSkillNameDisplay(value, fallback = '—') {
    let s = ''
    if (value == null || value === '') return fallback
    if (typeof value === 'string') s = value
    else if (typeof value === 'number' || typeof value === 'boolean') s = String(value)
    else return fallback
    s = s.trim()
    if (!s) return fallback
    const words = s
        .replace(/\//g, ' ')
        .replace(/-/g, ' ')
        .replace(/_/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    if (!words.length) return fallback
    return words
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}
