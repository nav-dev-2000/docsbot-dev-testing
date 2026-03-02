export const replaceCitationTokens = (html, footnotes, renderFn) => {
    if (!html || !Array.isArray(footnotes) || footnotes.length === 0) {
        return html || ''
    }

    return html.replace(/\{\{CITATION_(\d+)\}\}/g, (_match, value) => {
        const number = Number(value)
        if (!Number.isFinite(number)) return ''
        const footnote = footnotes.find((item) => item.number === number)
        return renderFn(number, footnote)
    })
}
