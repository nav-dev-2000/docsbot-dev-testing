import { getStripe } from '@/utils/stripe-client'

export const completeStripePaymentAction = async (paymentAction) => {
  if (!paymentAction?.requiresAction || !paymentAction.paymentIntentClientSecret) {
    return
  }

  const stripe = await getStripe()
  if (!stripe) {
    throw new Error('Unable to load Stripe payment verification.')
  }

  const { error } = await stripe.confirmCardPayment(
    paymentAction.paymentIntentClientSecret,
  )
  if (error) {
    throw new Error(error.message || 'Payment verification was not completed.')
  }
}
