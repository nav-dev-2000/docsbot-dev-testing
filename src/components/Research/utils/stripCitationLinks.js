import { escapeRegex } from './escapeRegex'

export const stripCitationLinks = (html, footnotes) => {
    if (!html || !Array.isArray(footnotes) || footnotes.length === 0) {
        return html || ''
    }

    let updated = html
    footnotes.forEach((footnote) => {
        if (!footnote?.url) return
        const pattern = new RegExp(
            `<a[^>]*?href=["']${escapeRegex(footnote.url)}["'][^>]*>(.*?)<\\/a>`,
            'gi',
        )
        updated = updated.replace(pattern, '$1')
    })

    return updated
}
