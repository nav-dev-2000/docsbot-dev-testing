import { describe, expect, it } from 'vitest'

import { getSubscriptionPaymentAction } from '@/utils/stripeSubscriptionPayment'

describe('stripeSubscriptionPayment', () => {
  it('returns a client secret when the latest invoice payment intent needs action', () => {
    expect(
      getSubscriptionPaymentAction({
        latest_invoice: {
          payment_intent: {
            status: 'requires_action',
            client_secret: 'pi_secret_123',
          },
        },
      }),
    ).toEqual({
      requiresAction: true,
      paymentIntentClientSecret: 'pi_secret_123',
      paymentIntentStatus: 'requires_action',
    })
  })

  it('reports payment method failures without exposing a missing client secret', () => {
    expect(
      getSubscriptionPaymentAction({
        latest_invoice: {
          payment_intent: {
            status: 'requires_payment_method',
            client_secret: 'pi_secret_123',
          },
        },
      }),
    ).toEqual({
      requiresPaymentMethod: true,
      paymentIntentStatus: 'requires_payment_method',
    })
  })

  it('ignores paid or unexpanded invoices', () => {
    expect(
      getSubscriptionPaymentAction({
        latest_invoice: {
          payment_intent: {
            status: 'succeeded',
            client_secret: 'pi_secret_123',
          },
        },
      }),
    ).toBeNull()
    expect(getSubscriptionPaymentAction({ latest_invoice: 'in_123' })).toBeNull()
  })
})
