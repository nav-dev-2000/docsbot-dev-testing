let stripePromise = null

const loadStripeScript = () =>
  new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Stripe can only be loaded in the browser.'))
      return
    }
    if (window.Stripe) {
      resolve(window.Stripe)
      return
    }

    const existingScript = document.querySelector('script[src="https://js.stripe.com/v3/"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.Stripe))
      existingScript.addEventListener('error', () =>
        reject(new Error('Unable to load Stripe payment verification.')),
      )
      return
    }

    const script = document.createElement('script')
    script.src = 'https://js.stripe.com/v3/'
    script.async = true
    script.onload = () => resolve(window.Stripe)
    script.onerror = () =>
      reject(new Error('Unable to load Stripe payment verification.'))
    document.head.appendChild(script)
  })

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripeScript().then((Stripe) => {
      const publishableKey =
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE ??
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
        ''
      if (!publishableKey) {
        throw new Error('Stripe publishable key is not configured.')
      }
      return Stripe(publishableKey)
    })
  }

  return stripePromise
}
