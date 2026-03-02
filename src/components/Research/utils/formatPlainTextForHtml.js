import { escapeHtml } from './escapeHtml'

export const formatPlainTextForHtml = (value = '') =>
    escapeHtml(value).replace(/\r?\n/g, '<br />')
