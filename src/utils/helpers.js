import random from 'random'

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
  if ('ZrbLG98bbxZ9EFqiPvyl' === team.id || 'FVasEcNLTWpySb5ZNlF3' === team.id) {
    return {
      name: 'Staff',
      bots: 1000,
      pages: 1000000,
      questions: 1000000000,
      teamMembers: 100000,
      scheduleInterval: 'daily',
      logLimit: 1000000000,
    }
  }

  if (process?.env?.NEXT_PUBLIC_STRIPE_PLANS) {
    const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)

    if (['active', 'trialing'].includes(team?.stripeSubscriptionStatus)) {
      for (const planKey in plans) {
        const plan = plans[planKey]
        for (const frequency in plan.prices.current) {
          if (plan.prices.current[frequency] === team.stripeSubscriptionPlan) {
            return plan
          }
        }
        if (plan.prices.old) {
          for (const price of plan.prices.old) {
            if (price === team.stripeSubscriptionPlan) {
              return plan
            }
          }
        }
      }
    }
  }

  return {
    name: 'Free',
    bots: 1,
    pages: 50,
    questions: 100,
    teamMembers: 1,
    scheduleInterval: 'none',
    logLimit: 6,
  }
}

export function getStats(doc, timeDelta) {
  const millisecondDelta = timeDelta * 24 * 60 * 60 * 1000 // convert to milliseconds

  let dateCounts = {}
  let isMonthly = false
  const currDate = new Date()
  if (timeDelta > 30 && doc?.questionHistory) {
    // scrape monthly data
    for (const dateKey in doc.questionHistory) {
      // if date is within the timeDelta, add to our dateCounts
      const date = new Date(`${dateKey}-1`)
      if (date.getTime() > currDate.getTime() - millisecondDelta) {
        const data = doc.questionHistory[dateKey]
        dateCounts[dateKey] = {
          count: data.questions,
          negative: data?.downVotes || 0,
          positive: data?.upVotes || 0,
          escalated: data?.escalations || 0,
        }
      }
    }

    isMonthly = true
    timeDelta = Math.floor(timeDelta / 30)
  } else if (doc?.questionHistoryDaily) {
    // scrape daily data
    for (const dateKey in doc.questionHistoryDaily) {
      // if date is within the timeDelta, add to our dateCounts
      const date = new Date(dateKey);
      if (date.getTime() > currDate.getTime() - millisecondDelta) {
        const data = doc.questionHistoryDaily[dateKey]
        dateCounts[dateKey] = {
          count: data.questions,
          negative: data?.downVotes || 0,
          positive: data?.upVotes || 0,
          escalated: data?.escalations || 0
        }
      }
    }
  }

  // fill in missing dates
  for (let i = 0; i < timeDelta; i++) {
    const date = isMonthly ? new Date(currDate - i * 30 * 24 * 60 * 60 * 1000) : new Date(currDate - i * 24 * 60 * 60 * 1000)
    const dateKey = isMonthly ? `${date.getFullYear()}-${date.getMonth() + 1}` : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!dateCounts[dateKey]) {
      dateCounts[dateKey] = { count: 0, negative: 0, positive: 0, escalated: 0 }
    }
  }

  // split data and labels
  let totalCount = 0,
    totalNegative = 0,
    totalPositive = 0,
    totalEscalated = 0
  let countData = [],
    negativeData = [],
    positiveData = [],
    escalatedData = [],
    labels = []
  for (let i = timeDelta - 1; i >= 0; i--) {
    const date = isMonthly ? new Date(currDate - i * 30 * 24 * 60 * 60 * 1000) : new Date(currDate - i * 24 * 60 * 60 * 1000)
    const dateKey = isMonthly ? `${date.getFullYear()}-${date.getMonth() + 1}` : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    countData.push(dateCounts[dateKey].count)
    negativeData.push(dateCounts[dateKey].negative)
    positiveData.push(dateCounts[dateKey].positive)
    escalatedData.push(dateCounts[dateKey].escalated)

    totalCount += dateCounts[dateKey].count
    totalNegative += dateCounts[dateKey].negative
    totalPositive += dateCounts[dateKey].positive
    totalEscalated += dateCounts[dateKey].escalated

    labels.push(isMonthly ? `${date.getMonth() + 1}/${date.getFullYear()}` : `${date.getMonth() + 1}/${date.getDate()}`)
  }

  // calculate percentages
  const counts = [
    (totalCount - (totalNegative + totalEscalated)),
    totalNegative,
    totalPositive,
    totalEscalated,
  ]

  // fix 'NaN' strings
  if (totalCount === 0) {
    return {
      countData,
      negativeData,
      positiveData,
      escalatedData,
      labels,
      counts,
      percentageLabels: [
        `0% Answered`,
        `0% Rated Negative`,
        `0% Rated Positive`,
        `0% Escalated`,
      ],
      totalCount: 0,
      resolutionRate: "0",
      deflectionRate: "0",
      timeSaved: 0,
    }
  }

  const answered = Math.round(((totalCount - (totalNegative + totalEscalated)) / totalCount) * 100)
  const ratedNegative = Math.round((totalNegative / totalCount) * 100)
  const ratedPositive = Math.round((totalPositive / totalCount) * 100)
  const escalated = Math.round((totalEscalated / totalCount) * 100)
  const percentageLabels = [
    `${answered}% Answered`,
    `${ratedNegative}% Rated Negative`,
    `${ratedPositive}% Rated Positive`,
    `${escalated}% Escalated`,
  ]

  let resolutionRate = ((totalCount - (totalNegative + totalEscalated)) / totalCount * 100).toFixed((totalCount - (totalNegative + totalEscalated)) / totalCount * 100 % 1 === 0 ? 0 : 1);
  let deflectionRate = ((totalCount - totalEscalated) / totalCount * 100).toFixed((totalCount - totalEscalated) / totalCount * 100 % 1 === 0 ? 0 : 1);
  let timeSaved = Math.round((totalCount - totalEscalated) * 5)

  console.log({
    countData,
    negativeData,
    positiveData,
    escalatedData,
    labels,
    counts,
    percentageLabels,
    totalCount,
    resolutionRate,
    deflectionRate,
    timeSaved,
  })
  return {
    countData,
    negativeData,
    positiveData,
    escalatedData,
    labels,
    counts,
    percentageLabels,
    totalCount,
    resolutionRate,
    deflectionRate,
    timeSaved,
  }
}

export function checkSourceScheduledFromInterval(team, interval) {
  const plan = stripePlan(team)

  let rawInterval = 0
  switch (interval) {
    case 'daily':
      rawInterval = 24 * 60 * 60 * 1000
      break
    case 'weekly':
      rawInterval = 7 * 24 * 60 * 60 * 1000
      break
    case 'monthly':
      rawInterval = 30 * 24 * 60 * 60 * 1000
      break
    case 'none':
      throw new Error('Please contact support')
    default:
      throw new Error(`Invalid schedule interval!`)
  }

  let limit = 0
  switch (plan.scheduleInterval) {
    case 'daily':
      limit = 24 * 60 * 60 * 1000
      break
    case 'weekly':
      limit = 7 * 24 * 60 * 60 * 1000
      break
    case 'monthly':
      limit = 30 * 24 * 60 * 60 * 1000
      break
    case 'none':
      throw new Error(
        'Scheduled refreshes are currently only available to paid plans. Please upgrade your plan to use this feature.'
      )
    default:
      throw new Error(`Invalid schedule interval for plan ${plan.name}!`)
  }

  if (rawInterval < limit) {
    throw new Error(
      `The schedule interval for this plan is limited to ${plan.scheduleInterval}. Please upgrade your plan to use this feature.`
    )
  }

  const scheduled = new Date()
  scheduled.setTime(scheduled.getTime() + rawInterval)
  return scheduled
}

export function isSuperAdmin(userId) {
  if (process?.env?.NEXT_PUBLIC_SUPER_ADMINS) {
    const superAdmins = JSON.parse(process.env.NEXT_PUBLIC_SUPER_ADMINS)
    return superAdmins.includes(userId)
  }

  return false
}

export const grabQuestions = (bot) => {
  // grab at most 3 unique questions from the bot
  if (bot && bot.questions) {
    const questions = bot.questions
    const randomQuestions = []
    const questionsLimit = questions.length > 4 ? 4 : questions.length

    for (let i = 0; i < questionsLimit; i++) {
      const randomIndex = random.int(0, questions.length - 1)

      // check if question is already included
      if (randomQuestions.includes(questions[randomIndex])) {
        i--
        continue
      }

      randomQuestions.push(questions[randomIndex])
    }

    return randomQuestions
  }

  return []
}

export const fbPageview = () => {
  window.fbq('track', 'PageView')
}

// https://developers.facebook.com/docs/facebook-pixel/advanced/
export const fbEvent = (name, options = {}) => {
  window.fbq('track', name, options)
}

export const getNeededStripeProduct = (team) => {
  const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)

  if (team) {
    const hobbyPlanLimit = plans['hobby']
    const powerPlanLimit = plans['power']
    const proPlanLimit = plans['pro']
    const businessPlanLimit = plans['business']

    const plansArray = Object.values(plans)


    if (hobbyPlanLimit.bots >= team?.botCount && hobbyPlanLimit.pages >= team?.pageCount && hobbyPlanLimit.questions >= team?.questionCount) {
      return ""
    }

    else if (powerPlanLimit.bots >= team?.botCount && powerPlanLimit.pages >= team?.pageCount && powerPlanLimit.questions >= team?.questionCount) {
      const prices = []
      plansArray.map(item => {
        if (item.name?.toLowerCase() !== 'hobby') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    }

    else if (proPlanLimit.bots >= team?.botCount && proPlanLimit.pages >= team?.pageCount && proPlanLimit.questions >= team?.questionCount) {
      const prices = []
      plansArray.map(item => {
        if (item.name?.toLowerCase() !== 'hobby' && item.name?.toLowerCase() !== 'power') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    }

    else if (businessPlanLimit.bots >= team?.botCount && businessPlanLimit.pages >= team?.pageCount && businessPlanLimit.questions >= team?.questionCount) {
      const prices = []
      plansArray.map(item => {
        if (item.name?.toLowerCase() !== 'hobby' && item.name?.toLowerCase() !== 'power' && item.name?.toLowerCase() !== 'pro') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    }
    else return ""
  }
  return ""
}