const formatPreviewDate = (timestamp, { includeYear = true } = {}) => {
  if (!timestamp) return null
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(Number(timestamp) * 1000))
}

export const formatPreviewPeriod = (period = {}) => {
  const startTs = Number(period.start)
  const endTs = Number(period.end)
  if (!startTs || !endTs) return null

  const startDate = new Date(startTs * 1000)
  const endDate = new Date(endTs * 1000)
  const sameYear = startDate.getUTCFullYear() === endDate.getUTCFullYear()
  const startLabel = formatPreviewDate(startTs, { includeYear: !sameYear })
  const endLabel = formatPreviewDate(endTs)

  if (!startLabel || !endLabel) return null
  return `${startLabel}–${endLabel}`
}

export const isProrationInvoiceLine = (line = {}) =>
  line.proration === true ||
  line.parent?.subscription_item_details?.proration === true

export const buildInvoicePreview = ({
  invoice,
  currency = 'usd',
  formatMoney,
  lineFilter = () => true,
}) => {
  const rawLines = (invoice?.lines?.data || []).filter(lineFilter)
  const lines = getPreviewLines({ lines: rawLines, currency, formatMoney })
  const previewTotals = getPreviewTotals(lines)
  const accountCreditApplied = getAccountCreditApplied(invoice)

  return {
    lines,
    amountDue: invoice.amount_due,
    total: invoice.total,
    subtotal: invoice.subtotal,
    accountCreditApplied,
    previewLinesTotal: previewTotals.total,
    creditAmount: previewTotals.creditAmount,
    formattedAmountDue: formatMoney(invoice.amount_due, currency),
    formattedAccountCreditApplied: formatMoney(accountCreditApplied, currency),
    formattedCreditAmount: formatMoney(previewTotals.creditAmount, currency),
    formattedSubtotal: formatMoney(invoice.subtotal, currency),
    formattedTotal: formatMoney(invoice.total, currency),
  }
}

export const getPreviewLines = ({
  lines = [],
  currency = 'usd',
  formatMoney,
}) =>
  lines
    .map((line) => ({
      id: line.id,
      amount: line.amount,
      currency: line.currency || currency,
      description: String(line.description || ''),
      periodLabel: formatPreviewPeriod(line.period),
      quantity: line.quantity || null,
      formattedAmount: formatMoney(line.amount, line.currency || currency),
    }))

export const getPreviewLinesTotal = (lines = []) =>
  lines.reduce((total, line) => total + Number(line.amount || 0), 0)

export const getPreviewTotals = (lines = []) => {
  const total = getPreviewLinesTotal(lines)
  return {
    total,
    amountDue: Math.max(0, total),
    creditAmount: Math.max(0, -total),
  }
}

export const getAccountCreditApplied = (invoice = {}) => {
  const availableCredit = Math.max(0, -Number(invoice.starting_balance || 0))
  const amountDue = Number(invoice.amount_due || 0)
  const total = Number(invoice.total || 0)
  const invoiceCreditApplied = total > 0 ? Math.max(0, total - amountDue) : 0

  if (availableCredit > 0) {
    return Math.min(availableCredit, invoiceCreditApplied)
  }

  return invoiceCreditApplied
}
