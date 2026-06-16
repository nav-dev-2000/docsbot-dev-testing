import { describe, expect, it } from 'vitest'

import {
  buildInvoicePreview,
  formatPreviewPeriod,
  getAccountCreditApplied,
  getPreviewLines,
  getPreviewLinesTotal,
  getPreviewTotals,
  isProrationInvoiceLine,
} from '@/utils/billingPreview'

const formatMoney = (amount = 0) => `$${(amount / 100).toFixed(2)}`

describe('billingPreview', () => {
  it('keeps Stripe invoice line descriptions', () => {
    const lines = getPreviewLines({
      prorationDate: 1718121600,
      currency: 'usd',
      formatMoney,
      lines: [
        {
          id: 'il_proration',
          amount: 3800,
          currency: 'usd',
          description: 'Remaining time on DocsBot AI Credit Add-On after 12 Jun 2026',
          parent: {
            subscription_item_details: {
              proration: true,
            },
          },
          period: {
            start: 1718121600,
            end: 1781222400,
          },
        },
        {
          id: 'il_renewal',
          proration: false,
          amount: 4900,
          currency: 'usd',
          description: 'DocsBot AI Credit Add-On',
          subscription_item: 'si_addon',
          period: { start: 1720713600 },
        },
      ],
    })

    expect(lines).toEqual([
      {
        id: 'il_proration',
        amount: 3800,
        currency: 'usd',
        description: 'Remaining time on DocsBot AI Credit Add-On after 12 Jun 2026',
        periodLabel: 'Jun 11, 2024–Jun 12, 2026',
        quantity: null,
        formattedAmount: '$38.00',
      },
      {
        id: 'il_renewal',
        amount: 4900,
        currency: 'usd',
        description: 'DocsBot AI Credit Add-On',
        periodLabel: null,
        quantity: null,
        formattedAmount: '$49.00',
      },
    ])
    expect(getPreviewLinesTotal(lines)).toBe(8700)
  })

  it('keeps Stripe add-on proration descriptions', () => {
    const lines = getPreviewLines({
      prorationDate: 1718121600,
      currency: 'usd',
      formatMoney,
      lines: [
        {
          id: 'il_credit',
          proration: true,
          amount: -1200,
          currency: 'usd',
          description: 'Unused time on 2 x DocsBot AI Credit Add-On after 13 Jun 2026',
        },
      ],
    })

    expect(lines[0].description).toBe(
      'Unused time on 2 x DocsBot AI Credit Add-On after 13 Jun 2026',
    )
  })

  it('keeps Stripe plan proration descriptions', () => {
    const lines = getPreviewLines({
      currency: 'usd',
      formatMoney,
      lines: [
        {
          id: 'il_plan_credit',
          proration: true,
          amount: -11512,
          currency: 'usd',
          description: 'Unused time on Personal after 13 Jun 2026',
        },
        {
          id: 'il_plan_charge',
          proration: true,
          amount: 3786,
          currency: 'usd',
          description: 'Remaining time on Standard after 13 Jun 2026',
        },
      ],
    })

    expect(lines[0].description).toBe('Unused time on Personal after 13 Jun 2026')
    expect(lines[1].description).toBe('Remaining time on Standard after 13 Jun 2026')
  })

  it('formats Stripe-style service period labels', () => {
    expect(
      formatPreviewPeriod({
        start: 1781222400,
        end: 1783209600,
      }),
    ).toBe('Jun 12–Jul 5, 2026')
    expect(
      formatPreviewPeriod({
        start: 1781222400,
        end: 1812758400,
      }),
    ).toBe('Jun 12, 2026–Jun 12, 2027')
  })

  it('filters non-proration renewal rows out of plan previews', () => {
    expect(
      isProrationInvoiceLine({
        proration: true,
        description: 'Unused time on Standard after 13 Jun 2026',
      }),
    ).toBe(true)
    expect(
      isProrationInvoiceLine({
        parent: { subscription_item_details: { proration: true } },
        description: 'Remaining time on Personal after 13 Jun 2026',
      }),
    ).toBe(true)
    expect(
      isProrationInvoiceLine({
        proration: false,
        description: '1 x Personal (at $49.00 / month)',
        period: { start: 1718121600 },
      }),
    ).toBe(false)
  })

  it('builds invoice previews with retained credit for net negative changes', () => {
    const preview = buildInvoicePreview({
      currency: 'usd',
      formatMoney,
      lineFilter: isProrationInvoiceLine,
      invoice: {
        amount_due: 0,
        total: -7726,
        subtotal: -7726,
        starting_balance: -10000,
        lines: {
          data: [
            {
              id: 'il_plan_credit',
              proration: true,
              amount: -11512,
              currency: 'usd',
              description: 'Unused time on Standard after 13 Jun 2026',
            },
            {
              id: 'il_plan_charge',
              proration: true,
              amount: 3786,
              currency: 'usd',
              description: 'Remaining time on Personal after 13 Jun 2026',
            },
            {
              id: 'il_renewal',
              proration: false,
              amount: 4900,
              currency: 'usd',
              description: '1 x Personal (at $49.00 / month)',
            },
          ],
        },
      },
    })

    expect(preview.lines).toHaveLength(2)
    expect(preview.amountDue).toBe(0)
    expect(preview.accountCreditApplied).toBe(0)
    expect(preview.creditAmount).toBe(7726)
    expect(preview.formattedAmountDue).toBe('$0.00')
    expect(preview.formattedAccountCreditApplied).toBe('$0.00')
    expect(preview.formattedCreditAmount).toBe('$77.26')
  })

  it('builds invoice previews with existing account credit applied', () => {
    const preview = buildInvoicePreview({
      currency: 'usd',
      formatMoney,
      lineFilter: isProrationInvoiceLine,
      invoice: {
        amount_due: 0,
        total: 8700,
        subtotal: 8700,
        starting_balance: -12000,
        lines: {
          data: [
            {
              id: 'il_plan_charge',
              proration: true,
              amount: 8700,
              currency: 'usd',
              description: 'Remaining time on Business after 13 Jun 2026',
            },
          ],
        },
      },
    })

    expect(preview.accountCreditApplied).toBe(8700)
    expect(preview.creditAmount).toBe(0)
    expect(preview.formattedAccountCreditApplied).toBe('$87.00')
    expect(preview.formattedCreditAmount).toBe('$0.00')
  })

  it('keeps every invoice item and totals the net preview amount', () => {
    const lines = getPreviewLines({
      prorationDate: 1718121600,
      currency: 'usd',
      formatMoney,
      lines: [
        {
          id: 'il_charge',
          amount: 3800,
          currency: 'usd',
          description: 'Remaining time on DocsBot AI Credit Add-On after 12 Jun 2026',
          parent: {
            subscription_item_details: {
              proration: true,
            },
          },
        },
        {
          id: 'il_credit',
          amount: -1200,
          currency: 'usd',
          description: 'Unused time on DocsBot AI Credit Add-On after 12 Jun 2026',
          parent: {
            subscription_item_details: {
              proration: true,
            },
          },
        },
        {
          id: 'il_renewal',
          amount: 4900,
          currency: 'usd',
          description: '1 x Personal (at $49.00 / month)',
          parent: {
            subscription_item_details: {
              proration: false,
            },
          },
        },
      ],
    })

    expect(lines.map((line) => line.id)).toEqual([
      'il_charge',
      'il_credit',
      'il_renewal',
    ])
    expect(getPreviewLinesTotal(lines)).toBe(7500)
    expect(getPreviewTotals(lines)).toEqual({
      total: 7500,
      amountDue: 7500,
      creditAmount: 0,
    })
  })

  it('reports net negative preview totals as credit metadata', () => {
    const lines = [
      {
        id: 'il_credit',
        amount: -3800,
        currency: 'usd',
        description: 'Unused add-on credit',
        quantity: null,
        formattedAmount: '-$38.00',
      },
    ]

    expect(getPreviewTotals(lines)).toEqual({
      total: -3800,
      amountDue: 0,
      creditAmount: 3800,
    })
  })

  it('reports account credit applied to reduce the amount due', () => {
    expect(
      getAccountCreditApplied({
        starting_balance: -12000,
        total: 8700,
        amount_due: 0,
      }),
    ).toBe(8700)
  })

  it('does not report net negative invoice totals as account credit applied', () => {
    expect(
      getAccountCreditApplied({
        starting_balance: -12000,
        total: -7700,
        amount_due: 0,
      }),
    ).toBe(0)
  })

  it('caps account credit applied by the available starting balance', () => {
    expect(
      getAccountCreditApplied({
        starting_balance: -2000,
        total: 8700,
        amount_due: 0,
      }),
    ).toBe(2000)
  })
})
