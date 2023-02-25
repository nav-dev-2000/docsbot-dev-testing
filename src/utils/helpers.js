export const getURL = () => {
  const url =
    process?.env?.VERCEL_ENV && process.env.VERCEL_ENV === 'production'
      ? 'https://imajinn.ai'
      : process?.env?.VERCEL_URL && process.env.VERCEL_URL !== ''
      ? process.env.VERCEL_URL
      : 'http://localhost:3000'
  return url.includes('http') ? url : `https://${url}`
}

export const postData = async ({ url, data }) => {
  console.log('posting,', url, data)

  const res = await fetch(url, {
    method: 'POST',
    headers: new Headers({ 'Content-Type': 'application/json' }),
    credentials: 'same-origin',
    body: JSON.stringify(data),
  })

  if (!res.ok) {
    console.log('Error in postData', { url, data, res })

    throw Error(res.statusText)
  }

  return res.json()
}

export function stripePlan(team) {
  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
    if (team?.stripeSubscriptionStatus === 'active' && plans[team.stripeSubscriptionPlan]) {
      return plans[team.stripeSubscriptionPlan]
    } else if (team?.baseCredits > 0 || team?.sourceCredits > 0) {
      return { name: 'Starter', baseCredits: 0, sourceCredits: 0 }
    }
  }

  return { name: 'None', baseCredits: 0, sourceCredits: 0 }
}

export function isSuperAdmin(userId) {
  if (process?.env?.NEXT_PUBLIC_SUPER_ADMINS) {
    const superAdmins = JSON.parse(process.env.NEXT_PUBLIC_SUPER_ADMINS)
    return superAdmins.includes(userId)
  }
  
  return false
}

export function bookPlan(book) {
  if (process?.env?.NEXT_PUBLIC_STRIPE_BOOK_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_BOOK_PLANS)
    if (plans[book.stripe?.line_items?.data[0]?.price?.product]) {
      return plans[book.stripe?.line_items?.data[0]?.price?.product]
    }
  }

  return false
}

export function portraitPlan(portrait) {
  if (process?.env?.NEXT_PUBLIC_STRIPE_PORTRAIT_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PORTRAIT_PLANS)
    if (plans[portrait.stripe?.line_items?.data[0]?.price?.product]) {
      return plans[portrait.stripe?.line_items?.data[0]?.price?.product]
    }
  }

  return false
}

export const fbPageview = () => {
  window.fbq('track', 'PageView')
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const fbEvent = (name, options = {}) => {
  window.fbq('track', name, options)
}