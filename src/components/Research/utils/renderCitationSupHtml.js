import { replaceCitationTokens } from './replaceCitationTokens'
import { escapeHtml } from './escapeHtml'

export const renderCitationSupHtml = (html, footnotes) =>
    replaceCitationTokens(html, footnotes, (number, footnote) => {
        const title = footnote?.title ? escapeHtml(footnote.title) : ''
        const supClasses =
            'relative align-super text-[0.65em] font-semibold text-cyan-600'
        const linkClasses =
            'inline-flex items-center justify-center rounded-full px-0.5 text-current no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500'
        return (
            `<sup id="citation-${number}" class="${supClasses}">` +
            `<a href="#footnote-${number}" class="${linkClasses}" aria-label="Jump to source ${number}">${number}</a>` +
            '</sup>'
        )
    })
