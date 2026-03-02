export const formatLocalDateTime = (value) => {
    if (!value) return ''

    try {
        const formatter = new Intl.DateTimeFormat(undefined, {
            dateStyle: 'full',
            timeStyle: 'short',
        })
        return formatter.format(new Date(value))
    } catch (_err) {
        return new Date(value).toLocaleString()
    }
}
