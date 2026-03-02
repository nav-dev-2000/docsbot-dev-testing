import { replaceCitationTokens } from './replaceCitationTokens'

export const renderCitationMarkers = (html, footnotes) =>
    replaceCitationTokens(
        html,
        footnotes,
        (number) => `<span data-citation="${number}"></span>`,
    )
