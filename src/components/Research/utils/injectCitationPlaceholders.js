export const injectCitationPlaceholders = (text, annotations) => {
    if (!text || !Array.isArray(annotations) || annotations.length === 0) {
        return { annotatedText: text || '', footnotes: [] }
    }

    const sorted = [...annotations]
        .filter(
            (annotation) =>
                Number.isFinite(annotation.start) &&
                Number.isFinite(annotation.end) &&
                annotation.end > annotation.start,
        )
        .sort((a, b) => a.start - b.start)

    const citationNumbers = new Map()
    const footnotes = []
    let output = ''
    let cursor = 0

    sorted.forEach((annotation) => {
        const start = Math.max(
            0,
            Math.min(text.length, (annotation.start ?? 0) - 1),
        )
        const end = Math.max(start, Math.min(text.length, annotation.end))
        const key =
            annotation.url || `${annotation.title || 'source'}-${start}-${end}`

        if (start < cursor) {
            return
        }

        if (cursor < start) {
            output += text.slice(cursor, start)
        }
        cursor = end

        if (!citationNumbers.has(key)) {
            citationNumbers.set(key, citationNumbers.size + 1)
            footnotes.push({
                number: citationNumbers.get(key),
                title: annotation.title || annotation.url,
                url: annotation.url,
            })
        }

        const citationNumber = citationNumbers.get(key)
        output += `{{CITATION_${citationNumber}}}`
    })

    if (cursor < text.length) {
        output += text.slice(cursor)
    }

    return { annotatedText: output, footnotes }
}
