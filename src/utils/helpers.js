export const getURL = () => {
  const url =
    process?.env?.VERCEL_ENV && process.env.VERCEL_ENV === 'production'
      ? 'https://docsbot.ai'
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
  if ('ZrbLG98bbxZ9EFqiPvyl' === team.id) {
    return { name: 'Staff', bots: 1000, sources: 10000, pages: 1000000, questions: 1000000000, teamMembers: 100000 }
  } else if ('bVVwaRq2Jw1hnGr90XZA' === team.id) { // team for sethtstubbs@gmail.com
    return { name: 'Staff', bots: 1000, sources: 10000, pages: 1000000, questions: 1000000000, teamMembers: 100000 }
  }

  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
    if (team?.stripeSubscriptionStatus === 'active' && plans[team.stripeSubscriptionPlan]) {
      return plans[team.stripeSubscriptionPlan]
    }
  }

  return { name: 'Free', bots: 1, sources: 3, pages: 50, questions: 100, teamMembers: 1 }
}

export function isSuperAdmin(userId) {
  if (process?.env?.NEXT_PUBLIC_SUPER_ADMINS) {
    const superAdmins = JSON.parse(process.env.NEXT_PUBLIC_SUPER_ADMINS)
    return superAdmins.includes(userId)
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
