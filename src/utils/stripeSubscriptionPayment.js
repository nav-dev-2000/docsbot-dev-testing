export const getInvoicePaymentIntent = (subscription = {}) => {
  const invoice = subscription?.latest_invoice
  if (!invoice || typeof invoice === 'string') return null
  const paymentIntent = invoice.payment_intent
  return paymentIntent && typeof paymentIntent !== 'string' ? paymentIntent : null
}

export const getSubscriptionPaymentAction = (subscription = {}) => {
  const paymentIntent = getInvoicePaymentIntent(subscription)
  if (!paymentIntent?.client_secret) return null

  if (['requires_action', 'requires_confirmation'].includes(paymentIntent.status)) {
    return {
      requiresAction: true,
      paymentIntentClientSecret: paymentIntent.client_secret,
      paymentIntentStatus: paymentIntent.status,
    }
  }

  if (paymentIntent.status === 'requires_payment_method') {
    return {
      requiresPaymentMethod: true,
      paymentIntentStatus: paymentIntent.status,
    }
  }

  return null
}
