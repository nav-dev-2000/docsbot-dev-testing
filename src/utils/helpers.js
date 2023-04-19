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
    return {
      name: 'Staff',
      bots: 1000,
      sources: 10000,
      pages: 1000000,
      questions: 1000000000,
      teamMembers: 100000,
      scheduleInterval: 'daily',
    }
  // } else if ('bVVwaRq2Jw1hnGr90XZA' === team.id) {
  //   // team for sethtstubbs@gmail.com
  //   return {
  //     name: 'Staff',
  //     bots: 1000,
  //     sources: 10000,
  //     pages: 1000000,
  //     questions: 1000000000,
  //     teamMembers: 100000,
  //   }
  }

  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)
    if (
      ['active', 'trialing'].includes(team?.stripeSubscriptionStatus) &&
      plans[team.stripeSubscriptionPlan]
    ) {
      return plans[team.stripeSubscriptionPlan]
    }
  }

  return { name: 'Free', bots: 1, sources: 3, pages: 50, questions: 100, teamMembers: 1, scheduleInterval: 'none' }
}

export function checkSourceScheduledFromInterval(team, interval) {
  const plan = stripePlan(team)

  let rawInterval = 0;
  switch(interval) {
    case 'daily': rawInterval = 24 * 60 * 60 * 1000; break;
    case 'weekly': rawInterval = 7 * 24 * 60 * 60 * 1000; break;
    case 'monthly': rawInterval = 30 * 24 * 60 * 60 * 1000; break;
    case 'none': throw new Error('Please contact support');
    default:
      throw new Error(`Invalid schedule interval!`);
  }

  let limit = 0;
  switch (plan.scheduleInterval) {
    case 'daily': limit = 24 * 60 * 60 * 1000; break;
    case 'weekly': limit = 7 * 24 * 60 * 60 * 1000; break;
    case 'monthly': limit = 30 * 24 * 60 * 60 * 1000; break;
    case 'none': throw new Error('Scheduled refreshes are currently only available to Pro plans and up. Please upgrade your plan to use this feature.');
    default:
      throw new Error(`Invalid schedule interval for plan ${plan.name}!`);
  }

  if (rawInterval < limit) {
    throw new Error(`The schedule interval for this plan is limited to ${plan.scheduleInterval}.`)
  }

  const scheduled = new Date();
  scheduled.setTime(scheduled.getTime() + rawInterval);
  return scheduled
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
