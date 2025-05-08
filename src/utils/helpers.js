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

// https://gist.github.com/dperini/729294
var re_weburl = new RegExp(
  '^' +
    // protocol identifier (optional)
    // short syntax // still required
    '(?:(?:(?:https?|ftp):)?\\/\\/)' +
    // user:pass BasicAuth (optional)
    '(?:\\S+(?::\\S*)?@)?' +
    '(?:' +
    // IP address exclusion
    // private & local networks
    '(?!(?:10|127)(?:\\.\\d{1,3}){3})' +
    '(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})' +
    '(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})' +
    // IP address dotted notation octets
    // excludes loopback network 0.0.0.0
    // excludes reserved space >= 224.0.0.0
    // excludes network & broadcast addresses
    // (first & last IP address of each class)
    '(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])' +
    '(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}' +
    '(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))' +
    '|' +
    // host & domain names, may end with dot
    // can be replaced by a shortest alternative
    // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
    '(?:' +
    '(?:' +
    '[a-z0-9\\u00a1-\\uffff]' +
    '[a-z0-9\\u00a1-\\uffff_-]{0,62}' +
    ')?' +
    '[a-z0-9\\u00a1-\\uffff]\\.' +
    ')+' +
    // TLD identifier name, may end with dot
    '(?:[a-z\\u00a1-\\uffff]{2,}\\.?)' +
    '|' +
    // localhost
    'localhost' +
    ')' +
    // port number (optional)
    '(?::\\d{2,5})?' +
    // resource path (optional)
    '(?:[/?#]\\S*)?' +
    '$',
  'i',
)

export const isValidURL = (str) => {
  return re_weburl.test(str)
}

// makes sure url is in the form of https://{domain}/
export const sanitizeURL = (url) => {
  if (!url) return null

  if (!url.startsWith('https://')) {
    url = `https://${url}/`
  }

  if (!url.endsWith('/')) {
    url = `${url}/`
  }

  try {
    new URL(url)
  } catch (e) {
    return null
  }

  return url
}

export const validateOpenAIKey = (team, key) => {
  return (
    team.AzureDeploymentBase ||
    /^(sk\-|(sk\-[a-zA-Z0-9]{3,16}\-))[a-zA-Z0-9_-]+$/.test(key)
  )
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
  if (
    'ZrbLG98bbxZ9EFqiPvyl' === team.id ||
    'FVasEcNLTWpySb5ZNlF3' === team.id
  ) {
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

/**
 * Checks if a team has permission for a specific feature based on their plan level
 * @param {Object} team - The team object containing subscription information
 * @param {string} feature - The feature to check permission for (e.g., 'youtube', 'notion', etc.)
 * @param {string} [requiredPlan=null] - Optional specific plan to check against
 * @returns {Object} Object containing { allowed: boolean, requiredPlanLabel: string }
 */
export function checkPlanPermission(team, requiredPlan = null, feature = null) {
  // Get the current team's plan
  const currentPlan = stripePlan(team)

  // Check if team has Enterprise plan (custom or standard)
  const isEnterprise =
    currentPlan.name === 'Enterprise' ||
    currentPlan.name === 'Staff' ||
    currentPlan.name.includes('Enterprise') ||
    currentPlan.pages > 100000 ||
    currentPlan.bots > 100

  const planLevels = {
    free: 1,
    hobby: 2,
    power: 3,
    pro: 4,
    business: 5,
    enterprise: 6,
  }

  const currentPlanLevel = planLevels[currentPlan.name.toLowerCase()] || 0

  // If a specific plan is provided, check if current plan matches or exceeds it
  if (requiredPlan) {
    let requiredPlanLevel = planLevels[requiredPlan.toLowerCase()] || 999

    // If checking for a source type feature
    if (feature == 'source') {
      // Check if the team was created before March 27, 2025 and the required plan is 'power'
      // If so, downgrade the required plan to 'hobby' for grandfathered accounts (truto sources)
      if (requiredPlan.toLowerCase() === 'power' && team.createdAt) {
        const createdDate = new Date(team.createdAt)
        const cutoffDate = new Date('2025-03-28')

        if (createdDate < cutoffDate) {
          // Downgrade required plan level for grandfathered accounts
          requiredPlanLevel = planLevels['hobby']
        }
      }
    }

    return {
      allowed: currentPlanLevel >= requiredPlanLevel || isEnterprise,
      requiredPlanLabel:
        requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1),
    }
  }

  // Default to not allowed if feature wasn't found
  return {
    allowed: false,
    requiredPlanLabel: 'Enterprise',
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
          couldAnswer: data?.couldAnswer || null,
          couldNotAnswer: data?.couldNotAnswer || null,
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
      const date = new Date(dateKey)
      if (date.getTime() > currDate.getTime() - millisecondDelta) {
        const data = doc.questionHistoryDaily[dateKey]
        dateCounts[dateKey] = {
          count: data.questions,
          negative: data?.downVotes || 0,
          positive: data?.upVotes || 0,
          couldAnswer: data?.couldAnswer || null,
          couldNotAnswer: data?.couldNotAnswer || null,
          escalated: data?.escalations || 0,
        }
      }
    }
  }

  // fill in missing dates
  for (let i = 0; i < timeDelta; i++) {
    const date = isMonthly
      ? new Date(currDate - i * 30 * 24 * 60 * 60 * 1000)
      : new Date(currDate - i * 24 * 60 * 60 * 1000)
    const dateKey = isMonthly
      ? `${date.getFullYear()}-${date.getMonth() + 1}`
      : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    if (!dateCounts[dateKey]) {
      dateCounts[dateKey] = {
        count: 0,
        negative: 0,
        positive: 0,
        couldAnswer: null,
        couldNotAnswer: null,
        escalated: 0,
      }
    }
  }

  // split data and labels
  let totalCount = 0,
    totalNegative = 0,
    totalPositive = 0,
    totalCouldAnswer = 0,
    totalCouldNotAnswer = 0,
    totalEscalated = 0
  let countData = [],
    negativeData = [],
    positiveData = [],
    couldAnswerData = [],
    couldNotAnswerData = [],
    escalatedData = [],
    labels = []
  for (let i = timeDelta - 1; i >= 0; i--) {
    const date = isMonthly
      ? new Date(currDate - i * 30 * 24 * 60 * 60 * 1000)
      : new Date(currDate - i * 24 * 60 * 60 * 1000)
    const dateKey = isMonthly
      ? `${date.getFullYear()}-${date.getMonth() + 1}`
      : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    countData.push(dateCounts[dateKey].count)
    negativeData.push(dateCounts[dateKey].negative)
    positiveData.push(dateCounts[dateKey].positive)
    couldAnswerData.push(dateCounts[dateKey].couldAnswer)
    couldNotAnswerData.push(dateCounts[dateKey].couldNotAnswer)
    escalatedData.push(dateCounts[dateKey].escalated)

    totalCount += dateCounts[dateKey].count
    totalNegative += dateCounts[dateKey].negative
    totalPositive += dateCounts[dateKey].positive
    totalCouldAnswer += dateCounts[dateKey].couldAnswer || 0
    totalCouldNotAnswer += dateCounts[dateKey].couldNotAnswer || 0
    totalEscalated += dateCounts[dateKey].escalated

    labels.push(
      isMonthly
        ? `${date.getMonth() + 1}/${date.getFullYear()}`
        : `${date.getMonth() + 1}/${date.getDate()}`,
    )
  }

  // calculate percentages
  const counts = [
    totalCount - (totalPositive + totalNegative),
    totalNegative,
    totalPositive,
  ]

  const escalatedCounts = [totalEscalated, totalCount - totalEscalated]

  const answerCounts = [totalCouldAnswer, totalCouldNotAnswer]

  const totalClassifiedCount = totalCouldAnswer + totalCouldNotAnswer

  // fix 'NaN' strings
  if (totalCount === 0) {
    return {
      countData,
      negativeData,
      positiveData,
      couldAnswerData,
      couldNotAnswerData,
      escalatedData,
      labels,
      counts,
      percentageLabels: [
        `0% Unrated`,
        `0% Rated Negative`,
        `0% Rated Positive`,
      ],
      escalatedCounts,
      escalatedLabels: [`0% Escalated`, `0% Deflected`],
      answerCounts,
      answerLabels: [`0% Answered`, `0% Unanswered`],
      totalCount: 0,
      resolutionRate: '0',
      deflectionRate: '0',
      couldAnswerRate: '0',
      timeSaved: 0,
    }
  }

  const unrated = Math.round(
    ((totalCount - (totalPositive + totalNegative)) / totalCount) * 100,
  )
  const ratedNegative = Math.round((totalNegative / totalCount) * 100)
  const ratedPositive = Math.round((totalPositive / totalCount) * 100)
  const escalated = Math.round((totalEscalated / totalCount) * 100)
  const unescalated = Math.round(
    ((totalCount - totalEscalated) / totalCount) * 100,
  )
  const percentageLabels = [
    `${unrated}% Unrated`,
    `${ratedNegative}% Rated Negative`,
    `${ratedPositive}% Rated Positive`,
  ]

  const escalatedLabels = [
    `${escalated}% Escalated`,
    `${unescalated}% Deflected`,
  ]

  const couldAnswer =
    Math.round((totalCouldAnswer / totalClassifiedCount) * 100) || 0
  const couldNotAnswer =
    Math.round((totalCouldNotAnswer / totalClassifiedCount) * 100) || 0
  const answerLabels = [
    `${couldAnswer}% Answered`,
    `${couldNotAnswer}% Unanswered`,
  ]

  let resolutionRate = (
    ((totalCount - (totalNegative + totalEscalated + totalCouldNotAnswer)) /
      totalCount) *
    100
  ).toFixed(
    (((totalCount - (totalNegative + totalEscalated + totalCouldNotAnswer)) /
      totalCount) *
      100) %
      1 ===
      0
      ? 0
      : 1,
  )
  let deflectionRate = (
    ((totalCount - totalEscalated) / totalCount) *
    100
  ).toFixed(
    (((totalCount - totalEscalated) / totalCount) * 100) % 1 === 0 ? 0 : 1,
  )
  let timeSaved = Math.round((totalCount - totalEscalated) * 5)

  console.log({
    countData,
    negativeData,
    positiveData,
    couldAnswerData,
    escalatedData,
    labels,
    counts,
    percentageLabels,
    escalatedCounts,
    escalatedLabels,
    answerCounts,
    answerLabels,
    totalCount,
    resolutionRate,
    deflectionRate,
    couldAnswerRate: couldAnswer,
    timeSaved,
  })
  return {
    countData,
    negativeData,
    positiveData,
    couldAnswerData,
    escalatedData,
    labels,
    counts,
    percentageLabels,
    escalatedCounts,
    escalatedLabels,
    answerCounts,
    answerLabels,
    totalCount,
    resolutionRate,
    deflectionRate,
    couldAnswerRate: couldAnswer,
    timeSaved,
  }
}

export function checkSourceScheduledFromInterval(team, interval) {
  const plan = stripePlan(team)

  // Check if the team is grandfathered Business plan (created before 2024) to give them daily refresh
  if (
    team.createdAt &&
    new Date(team.createdAt.seconds * 1000) <
      new Date('2024-01-01T00:00:00Z') &&
    plan.pages == 100000 &&
    plan.bots == 100
  ) {
    plan.scheduleInterval = 'daily'
  }

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
        'Scheduled refreshes are currently only available to paid plans. Please upgrade your plan to use this feature.',
      )
    default:
      throw new Error(`Invalid schedule interval for plan ${plan.name}!`)
  }

  if (rawInterval < limit) {
    throw new Error(
      `The schedule interval for this plan is limited to ${plan.scheduleInterval}. Please upgrade your plan to use this feature.`,
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

    if (
      hobbyPlanLimit.bots >= team?.botCount &&
      hobbyPlanLimit.pages >= team?.pageCount &&
      hobbyPlanLimit.questions >= team?.questionCount &&
      hobbyPlanLimit.teamMembers >= team?.roles.length
    ) {
      return ''
    } else if (
      powerPlanLimit.bots >= team?.botCount &&
      powerPlanLimit.pages >= team?.pageCount &&
      powerPlanLimit.questions >= team?.questionCount &&
      powerPlanLimit.teamMembers >= team?.roles.length
    ) {
      const prices = []
      plansArray.map((item) => {
        if (item.name?.toLowerCase() !== 'hobby') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    } else if (
      proPlanLimit.bots >= team?.botCount &&
      proPlanLimit.pages >= team?.pageCount &&
      proPlanLimit.questions >= team?.questionCount &&
      proPlanLimit.teamMembers >= team?.roles.length
    ) {
      const prices = []
      plansArray.map((item) => {
        if (
          item.name?.toLowerCase() !== 'hobby' &&
          item.name?.toLowerCase() !== 'power'
        ) {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    } else if (
      businessPlanLimit.bots >= team?.botCount &&
      businessPlanLimit.pages >= team?.pageCount &&
      businessPlanLimit.questions >= team?.questionCount &&
      businessPlanLimit.teamMembers >= team?.roles.length
    ) {
      const prices = []
      plansArray.map((item) => {
        if (
          item.name?.toLowerCase() !== 'hobby' &&
          item.name?.toLowerCase() !== 'power' &&
          item.name?.toLowerCase() !== 'pro'
        ) {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    } else return ''
  }
  return ''
}

export const preprocessLaTeX = (content) => {
  // Replace block-level LaTeX delimiters \[ \] with $$ $$
  const blockProcessedContent = content.replace(
    /\\\[(.*?)\\\]/gs,
    (_, equation) => `$$${equation}$$`,
  )
  // Replace inline LaTeX delimiters \( \) with $ $
  const inlineProcessedContent = blockProcessedContent.replace(
    /\\\((.*?)\\\)/gs,
    (_, equation) => `$$${equation}$$`,
  )
  return inlineProcessedContent
}
