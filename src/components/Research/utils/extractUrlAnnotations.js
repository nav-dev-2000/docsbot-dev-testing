export const extractUrlAnnotations = (response) => {
    if (!response || !Array.isArray(response.output)) return []

    const reversed = [...response.output].reverse()
    for (const item of reversed) {
        if (!Array.isArray(item?.content)) continue
        const annotations = item.content.flatMap((contentItem) =>
            Array.isArray(contentItem?.annotations)
                ? contentItem.annotations.filter(
                      (annotation) =>
                          annotation?.type === 'url_citation' &&
                          annotation?.url,
                  )
                : [],
        )
        if (annotations.length > 0) {
            return annotations.map((annotation) => ({
                start: Number(
                    annotation.start_index ?? annotation.startIndex ?? 0,
                ),
                end: Number(annotation.end_index ?? annotation.endIndex ?? 0),
                title: annotation.title || annotation.url,
                url: annotation.url,
            }))
        }
    }

    return []
}
