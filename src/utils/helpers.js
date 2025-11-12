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

const resolveResearchTasksLimit = (value, fallback = 25) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  return fallback
}

export function stripePlan(team = {}) {
  if (team?.plan && typeof team.plan === 'object') {
    const normalizedPlan = { ...team.plan }
    normalizedPlan.researchTasks = resolveResearchTasksLimit(
      normalizedPlan.researchTasks,
      normalizedPlan.id === 'free' ? 0 : 25,
    )
    return normalizedPlan
  }

  const teamId = team?.id || ''
  if (
    teamId === 'ZrbLG98bbxZ9EFqiPvyl' ||
    teamId === 'FVasEcNLTWpySb5ZNlF3'
  ) {
    return {
      id: 'staff',
      name: 'Staff',
      bots: 1000,
      pages: 1000000,
      questions: 1000000000,
      teamMembers: 100000,
      scheduleInterval: 'daily',
      logLimit: 1000000000,
      researchTasks: 1000,
    }
  }

  const plans = getStripePlansFromEnv()
  const subscriptionPlan = team?.stripeSubscriptionPlan || null

  if (plans && subscriptionPlan) {
    for (const [planKey, planValue] of Object.entries(plans)) {
      if (!planValue || typeof planValue !== 'object') continue
      const planPrices = planValue.prices || {}
      const currentPrices = planPrices.current || {}
      const oldPrices = planPrices.old || []
      const currentMatches = Object.values(currentPrices).includes(
        subscriptionPlan,
      )
      const oldMatches = Array.isArray(oldPrices)
        ? oldPrices.includes(subscriptionPlan)
        : false

      if (currentMatches || oldMatches) {
        return {
          ...planValue,
          id: planKey,
          researchTasks: resolveResearchTasksLimit(planValue.researchTasks),
        }
      }
    }
  }

  return {
    id: 'free',
    name: 'Free',
    bots: 1,
    pages: 50,
    questions: 100,
    teamMembers: 1,
    scheduleInterval: 'none',
    logLimit: 6,
    researchTasks: resolveResearchTasksLimit(0, 0),
  }
}

let parsedStripePlansFromEnv
const getStripePlansFromEnv = () => {
  if (parsedStripePlansFromEnv !== undefined) {
    return parsedStripePlansFromEnv
  }

  const rawPlans = process?.env?.NEXT_PUBLIC_STRIPE_PLANS
  if (!rawPlans) {
    parsedStripePlansFromEnv = null
    return parsedStripePlansFromEnv
  }

  try {
    parsedStripePlansFromEnv = JSON.parse(rawPlans)
  } catch (error) {
    console.warn('Unable to parse NEXT_PUBLIC_STRIPE_PLANS', error)
    parsedStripePlansFromEnv = null
  }

  return parsedStripePlansFromEnv
}

/**
 * Checks if a team has permission for a specific feature based on their plan level
 * @param {Object} team - The team object containing subscription information
 * @param {string} [requiredPlan=null] - Optional specific plan to check against
 * @param {string} [feature=null] - The feature to check permission for (e.g., 'youtube', 'notion', etc.)
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
    personal: 3,
    pro: 4,
    standard: 5,
    business: 6,
    enterprise: 7,
  }

  const currentPlanLevel = planLevels[currentPlan.id] || 0

  // If a specific plan is provided, check if current plan matches or exceeds it
  if (requiredPlan) {
    requiredPlan = requiredPlan.toLowerCase()
    let requiredPlanLevel = planLevels[requiredPlan] || 999

    // Check if the team was created before March 27, 2025 and the required plan is 'personal'
    // If so, downgrade the required plan to 'hobby' for grandfathered accounts (truto sources)
    if (requiredPlan === 'personal' && team.createdAt) {
      const createdDate = new Date(team.createdAt)
      const cutoffDate = new Date('2025-03-28')

      if (createdDate < cutoffDate) {
        // Downgrade required plan level for grandfathered accounts
        requiredPlanLevel = planLevels['hobby']
      }
    }

    // grandfathered old power (personal) for helpscout
    if (feature == 'helpscout') {
      if (team.createdAt) {
        const createdDate = new Date(team.createdAt)
        const cutoffDate = new Date('2025-05-28')
        if (createdDate < cutoffDate) {
          // Downgrade required plan level for grandfathered accounts
          requiredPlanLevel = planLevels['personal']
        }
      }
    }

    // grandfathered old pro (standard) for branding
    if (feature == 'branding') {
      if (team.createdAt) {
        const createdDate = new Date(team.createdAt)
        const cutoffDate = new Date('2025-06-03')
        if (createdDate < cutoffDate) {
          // Downgrade required plan level for grandfathered accounts
          requiredPlanLevel = planLevels['pro']
        }
      }
    }

    return {
      allowed: currentPlanLevel >= requiredPlanLevel || isEnterprise,
      requiredPlanLabel: requiredPlan === 'hobby' ? 'Personal' : 
                        requiredPlan === 'pro' ? 'Standard' :
                        requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1),
    }
  }

  // Default to not allowed if feature wasn't found
  return {
    allowed: false,
    requiredPlanLabel: 'Enterprise',
  }
}

export function getStats(doc, timeDeltaOrRange) {
  let currDate = new Date()
  let timeDelta = 30
  if (typeof timeDeltaOrRange === 'object' && timeDeltaOrRange !== null) {
    const start = timeDeltaOrRange.startDate ? new Date(timeDeltaOrRange.startDate) : null
    const end = timeDeltaOrRange.endDate ? new Date(timeDeltaOrRange.endDate) : null
    if (end && !isNaN(end.getTime())) {
      currDate = end
    }
    if (start && !isNaN(start.getTime()) && end && !isNaN(end.getTime())) {
      const dayMs = 24 * 60 * 60 * 1000
      const diffMs = end.getTime() - start.getTime()
      timeDelta = Math.max(1, Math.floor(diffMs / dayMs) + 1)
    } else if (typeof timeDeltaOrRange.timeDelta === 'number') {
      timeDelta = timeDeltaOrRange.timeDelta
    }
  } else {
    timeDelta = Number(timeDeltaOrRange)
  }
  const millisecondDelta = timeDelta * 24 * 60 * 60 * 1000 // convert to milliseconds

  let dateCounts = {}
  let conversationCounts = {}
  let conversationTopics = {}
  let conversationTopicsByDate = {}
  let isMonthly = false
  
  if (timeDelta > 90 && doc?.questionHistory) {
    // scrape monthly data
    for (const dateKey in doc.questionHistory) {
      // if date is within the timeDelta, add to our dateCounts
      const date = new Date(`${dateKey}-1`)
      if (date.getTime() > currDate.getTime() - millisecondDelta) {
        const data = doc.questionHistory[dateKey]
        dateCounts[dateKey] = {
          count: data.questions,
          messages: data.messages || data.questions,
          negative: data?.downVotes || 0,
          positive: data?.upVotes || 0,
          couldAnswer: data?.couldAnswer || null,
          couldNotAnswer: data?.couldNotAnswer || null,
          escalated: data?.escalations || 0,
        }
      }
    }

    // scrape monthly conversation data
    if (doc?.conversationHistory) {
      for (const dateKey in doc.conversationHistory) {
        const date = new Date(`${dateKey}-1`)
        if (date.getTime() > currDate.getTime() - millisecondDelta) {
          const data = doc.conversationHistory[dateKey]
          conversationCounts[dateKey] = {
            conversations: data.conversations || 0,
            resolvedConfirmed: data.resolvedConfirmed || 0,
            resolvedAssumed: data.resolvedAssumed || 0,
            unresolved: data.unresolved || 0,
            escalatedHandled: data.escalatedHandled || 0,
            escalatedTriggered: data.escalatedTriggered || 0,
            sentimentPositive: data.sentimentPositive || 0,
            sentimentNegative: data.sentimentNegative || 0,
            sentimentNeutral: data.sentimentNeutral || 0,
            answered: data.answered || 0,
            unanswered: data.unanswered || 0,
          }
          if (data?.topics) {
            conversationTopicsByDate[dateKey] = { ...data.topics }
            for (const [topic, count] of Object.entries(data.topics)) {
              conversationTopics[topic] =
                (conversationTopics[topic] || 0) + count
            }
          }
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
          messages: data.messages || data.questions,
          negative: data?.downVotes || 0,
          positive: data?.upVotes || 0,
          couldAnswer: data?.couldAnswer || null,
          couldNotAnswer: data?.couldNotAnswer || null,
          escalated: data?.escalations || 0,
        }
      }
    }

    // scrape daily conversation data
    if (doc?.conversationHistoryDaily) {
      for (const dateKey in doc.conversationHistoryDaily) {
        const date = new Date(dateKey)
        if (date.getTime() > currDate.getTime() - millisecondDelta) {
          const data = doc.conversationHistoryDaily[dateKey]
          conversationCounts[dateKey] = {
            conversations: data.conversations || 0,
            resolvedConfirmed: data.resolvedConfirmed || 0,
            resolvedAssumed: data.resolvedAssumed || 0,
            unresolved: data.unresolved || 0,
            escalatedHandled: data.escalatedHandled || 0,
            escalatedTriggered: data.escalatedTriggered || 0,
            sentimentPositive: data.sentimentPositive || 0,
            sentimentNegative: data.sentimentNegative || 0,
            sentimentNeutral: data.sentimentNeutral || 0,
            answered: data.answered || 0,
            unanswered: data.unanswered || 0,
          }
          if (data?.topics) {
            conversationTopicsByDate[dateKey] = { ...data.topics }
            for (const [topic, count] of Object.entries(data.topics)) {
              conversationTopics[topic] =
                (conversationTopics[topic] || 0) + count
            }
          }
        }
      }
    }
  }

  // fill in missing dates for both question and conversation data
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
        messages: 0,
        negative: 0,
        positive: 0,
        couldAnswer: null,
        couldNotAnswer: null,
        escalated: 0,
      }
    }

    if (!conversationCounts[dateKey]) {
      conversationCounts[dateKey] = {
        conversations: 0,
        resolvedConfirmed: 0,
        resolvedAssumed: 0,
        unresolved: 0,
        escalatedHandled: 0,
        escalatedTriggered: 0,
        sentimentPositive: 0,
        sentimentNegative: 0,
        sentimentNeutral: 0,
        answered: 0,
        unanswered: 0,
      }
    }

    // Ensure all topics that have been seen have a 0 value for missing dates
    if (!conversationTopicsByDate[dateKey]) {
      conversationTopicsByDate[dateKey] = {}
    }
  }
  const allowedTopicsSet = Array.isArray(doc?.topics) && doc.topics.length > 0
    ? new Set(doc.topics.map(String))
    : null
  const effectiveConversationTopics = allowedTopicsSet
    ? Object.fromEntries(
        Object.entries(conversationTopics).filter(([topic]) =>
          allowedTopicsSet.has(topic),
        ),
      )
    : conversationTopics
  const topicList = Object.keys(effectiveConversationTopics)
  const conversationTopicData = {}
  topicList.forEach((topic) => {
    conversationTopicData[topic] = []
  })

  // split data and labels for questions
  let totalCount = 0,
    totalMessages = 0,
    totalNegative = 0,
    totalPositive = 0,
    totalCouldAnswer = 0,
    totalCouldNotAnswer = 0,
    totalEscalated = 0
  let countData = [],
    messagesData = [],
    negativeData = [],
    positiveData = [],
    couldAnswerData = [],
    couldNotAnswerData = [],
    escalatedData = [],
    labels = []

  // split data for conversations
  let totalConversations = 0,
    totalResolvedConfirmed = 0,
    totalResolvedAssumed = 0,
    totalUnresolved = 0,
    totalEscalatedHandled = 0,
    totalEscalatedTriggered = 0,
    totalSentimentPositive = 0,
    totalSentimentNegative = 0,
    totalSentimentNeutral = 0,
    totalAnswered = 0,
    totalUnanswered = 0
  let conversationData = [],
    resolvedConfirmedData = [],
    resolvedAssumedData = [],
    unresolvedData = [],
    escalatedHandledData = [],
    escalatedTriggeredData = [],
    sentimentPositiveData = [],
    sentimentNegativeData = [],
    sentimentNeutralData = [],
    answeredData = [],
    unansweredData = [],
    csatData = [],
    conversationDeflectionData = [],
    avgSentimentData = [],
    answeredRateData = []

  for (let i = timeDelta - 1; i >= 0; i--) {
    const date = isMonthly
      ? new Date(currDate - i * 30 * 24 * 60 * 60 * 1000)
      : new Date(currDate - i * 24 * 60 * 60 * 1000)
    const dateKey = isMonthly
      ? `${date.getFullYear()}-${date.getMonth() + 1}`
      : `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
    
    // Question data
    countData.push(dateCounts[dateKey].count)
    messagesData.push(dateCounts[dateKey].messages)
    negativeData.push(dateCounts[dateKey].negative)
    positiveData.push(dateCounts[dateKey].positive)
    couldAnswerData.push(dateCounts[dateKey].couldAnswer)
    couldNotAnswerData.push(dateCounts[dateKey].couldNotAnswer)
    escalatedData.push(dateCounts[dateKey].escalated)

    totalCount += dateCounts[dateKey].count
    totalMessages += dateCounts[dateKey].messages
    totalNegative += dateCounts[dateKey].negative
    totalPositive += dateCounts[dateKey].positive
    totalCouldAnswer += dateCounts[dateKey].couldAnswer || 0
    totalCouldNotAnswer += dateCounts[dateKey].couldNotAnswer || 0
    totalEscalated += dateCounts[dateKey].escalated

    // Conversation data
    const dayConversations = conversationCounts[dateKey].conversations
    const dayResolvedConfirmed = conversationCounts[dateKey].resolvedConfirmed
    const dayResolvedAssumed = conversationCounts[dateKey].resolvedAssumed
    const dayUnresolved = conversationCounts[dateKey].unresolved
    const dayEscalatedHandled = conversationCounts[dateKey].escalatedHandled
    const dayEscalatedTriggered = conversationCounts[dateKey].escalatedTriggered
    const daySentimentPositive = conversationCounts[dateKey].sentimentPositive
    const daySentimentNegative = conversationCounts[dateKey].sentimentNegative
    const daySentimentNeutral = conversationCounts[dateKey].sentimentNeutral
    const dayAnswered = conversationCounts[dateKey].answered
    const dayUnanswered = conversationCounts[dateKey].unanswered

    conversationData.push(dayConversations)
    resolvedConfirmedData.push(dayResolvedConfirmed)
    resolvedAssumedData.push(dayResolvedAssumed)
    unresolvedData.push(dayUnresolved)
    escalatedHandledData.push(dayEscalatedHandled)
    escalatedTriggeredData.push(dayEscalatedTriggered)
    sentimentPositiveData.push(daySentimentPositive)
    sentimentNegativeData.push(daySentimentNegative)
    sentimentNeutralData.push(daySentimentNeutral)
    answeredData.push(dayAnswered)
    unansweredData.push(dayUnanswered)

    const topicsForDate = conversationTopicsByDate[dateKey] || {}
    topicList.forEach((topic) => {
      const value = topicsForDate[topic] || 0
      conversationTopicData[topic].push(value)
    })

    // Calculate daily CSAT (confirmed + assumed resolved / total with resolution status)
    const dayTotalResolved = dayResolvedConfirmed + dayResolvedAssumed + dayUnresolved
    const dayCsat = dayTotalResolved > 0 ? Math.round(((dayResolvedConfirmed + dayResolvedAssumed) / dayTotalResolved) * 100) : null
    csatData.push(dayCsat)

    // Calculate daily conversation deflection rate (conversations not escalated to handled / total conversations)
    const dayDeflectionRate = dayConversations > 0 ? Math.round(((dayConversations - dayEscalatedHandled) / dayConversations) * 100) : null
    conversationDeflectionData.push(dayDeflectionRate)

    // Calculate daily average sentiment score (positive=1, neutral=0, negative=-1)
    const dayTotalSentiment = daySentimentPositive + daySentimentNegative + daySentimentNeutral
    let dayAvgSentiment = null
    if (dayTotalSentiment > 0) {
      const sentimentScore = (daySentimentPositive * 1) + (daySentimentNeutral * 0) + (daySentimentNegative * -1)
      dayAvgSentiment = Math.round((sentimentScore / dayTotalSentiment) * 100) / 100 // Round to 2 decimal places
    }
    avgSentimentData.push(dayAvgSentiment)

    // Calculate daily answered rate (answered / total with answer status)
    const dayTotalAnswered = dayAnswered + dayUnanswered
    const dayAnsweredRate = dayTotalAnswered > 0 ? Math.round((dayAnswered / dayTotalAnswered) * 100) : null
    answeredRateData.push(dayAnsweredRate)

    totalConversations += dayConversations
    totalResolvedConfirmed += dayResolvedConfirmed
    totalResolvedAssumed += dayResolvedAssumed
    totalUnresolved += dayUnresolved
    totalEscalatedHandled += dayEscalatedHandled
    totalEscalatedTriggered += dayEscalatedTriggered
    totalSentimentPositive += daySentimentPositive
    totalSentimentNegative += daySentimentNegative
    totalSentimentNeutral += daySentimentNeutral
    totalAnswered += dayAnswered
    totalUnanswered += dayUnanswered

    labels.push(
      isMonthly
        ? `${date.getMonth() + 1}/${date.getFullYear()}`
        : `${date.getMonth() + 1}/${date.getDate()}`,
    )
  }

  // Calculate the total number of conversations that have a topic assigned (filtered if topics list provided)
  const totalConversationsWithTopic = Object.values(effectiveConversationTopics).reduce((sum, count) => sum + count, 0)

  // Labels for line chart (just topic names)
  const conversationTopicLabels = topicList
  
  // Labels for pie chart (with percentages)
  const conversationTopicPieLabels = topicList.map((topic) => {
    const count = effectiveConversationTopics[topic] || 0
    const percent = totalConversationsWithTopic > 0 ? Math.round((count / totalConversationsWithTopic) * 100) : 0
    return `${topic} (${percent}%)`
  })
  const conversationTopicCounts = topicList.map((topic) => effectiveConversationTopics[topic] || 0)

  // calculate percentages for questions
  const counts = [
    totalCount - (totalPositive + totalNegative),
    totalNegative,
    totalPositive,
  ]

  const escalatedCounts = [totalEscalated, totalCount - totalEscalated]
  const answerCounts = [totalCouldAnswer, totalCouldNotAnswer]
  const totalClassifiedCount = totalCouldAnswer + totalCouldNotAnswer

  // calculate percentages for conversations
  const resolvedCounts = [totalResolvedConfirmed, totalResolvedAssumed, totalUnresolved]
  const conversationEscalatedCounts = [totalEscalatedHandled, totalEscalatedTriggered]
  const sentimentCounts = [totalSentimentPositive, totalSentimentNegative, totalSentimentNeutral]
  const conversationAnsweredCounts = [totalAnswered, totalUnanswered]

  // Calculate total CSAT, deflection rate, and average sentiment
  const totalClassifiedResolved = totalResolvedConfirmed + totalResolvedAssumed + totalUnresolved
  const totalCsat = totalClassifiedResolved > 0 ? Math.round(((totalResolvedConfirmed + totalResolvedAssumed) / totalClassifiedResolved) * 100) : null
  
  const totalConversationDeflectionRate = totalConversations > 0 ? Math.round(((totalConversations - totalEscalatedHandled) / totalConversations) * 100) : null
  
  const totalClassifiedSentiment = totalSentimentPositive + totalSentimentNegative + totalSentimentNeutral
  let totalAvgSentiment = null
  if (totalClassifiedSentiment > 0) {
    const totalSentimentScore = (totalSentimentPositive * 1) + (totalSentimentNeutral * 0) + (totalSentimentNegative * -1)
    totalAvgSentiment = Math.round((totalSentimentScore / totalClassifiedSentiment) * 100) / 100 // Round to 2 decimal places
  }

  const totalClassifiedAnswered = totalAnswered + totalUnanswered
  const totalAnsweredRate = totalClassifiedAnswered > 0 ? Math.round((totalAnswered / totalClassifiedAnswered) * 100) : null

  // fix 'NaN' strings
  if (totalCount === 0 && totalConversations === 0) {
    return {
      // Question stats
      countData,
      messagesData,
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
      totalMessages: 0,
      resolutionRate: '0',
      deflectionRate: '0',
      couldAnswerRate: '0',
      timeSaved: 0,
      // Conversation stats
      conversationData,
      resolvedConfirmedData,
      resolvedAssumedData,
      unresolvedData,
      escalatedHandledData,
      escalatedTriggeredData,
      sentimentPositiveData,
      sentimentNegativeData,
      sentimentNeutralData,
      answeredData,
      unansweredData,
      totalConversations: 0,
      resolvedCounts,
      resolvedLabels: [`0% Confirmed`, `0% Assumed`, `0% Unresolved`],
      conversationEscalatedCounts,
      conversationEscalatedLabels: [`0% Handled`, `0% Triggered`],
      sentimentCounts,
      sentimentLabels: [`0% Positive`, `0% Negative`, `0% Neutral`],
      conversationAnsweredCounts,
      conversationAnsweredLabels: [`0% Answered`, `0% Unanswered`],
      csatData,
      conversationDeflectionData,
      avgSentimentData,
      totalCsat: null,
      totalConversationDeflectionRate: null,
      totalAvgSentiment: null,
      totalAnsweredRate: null,
      answeredRateData,
      conversationTopicLabels,
      conversationTopicPieLabels,
      conversationTopicCounts,
      conversationTopicData,
    }
  }

  // Question percentages
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

  // Conversation percentages - only calculate based on classified data
  const totalClassifiedEscalated = totalEscalatedHandled + totalEscalatedTriggered

  const resolvedConfirmed = totalClassifiedResolved > 0 ? Math.round((totalResolvedConfirmed / totalClassifiedResolved) * 100) : null
  const resolvedAssumed = totalClassifiedResolved > 0 ? Math.round((totalResolvedAssumed / totalClassifiedResolved) * 100) : null
  const unresolved = totalClassifiedResolved > 0 ? Math.round((totalUnresolved / totalClassifiedResolved) * 100) : null
  
  const escalatedHandled = totalClassifiedEscalated > 0 ? Math.round((totalEscalatedHandled / totalClassifiedEscalated) * 100) : null
  const escalatedTriggered = totalClassifiedEscalated > 0 ? Math.round((totalEscalatedTriggered / totalClassifiedEscalated) * 100) : null
  
  const sentimentPositive = totalClassifiedSentiment > 0 ? Math.round((totalSentimentPositive / totalClassifiedSentiment) * 100) : null
  const sentimentNegative = totalClassifiedSentiment > 0 ? Math.round((totalSentimentNegative / totalClassifiedSentiment) * 100) : null
  const sentimentNeutral = totalClassifiedSentiment > 0 ? Math.round((totalSentimentNeutral / totalClassifiedSentiment) * 100) : null
  
  const answered = totalClassifiedAnswered > 0 ? Math.round((totalAnswered / totalClassifiedAnswered) * 100) : null
  const unanswered = totalClassifiedAnswered > 0 ? Math.round((totalUnanswered / totalClassifiedAnswered) * 100) : null

  const resolvedLabels = [
    `${resolvedConfirmed || 0}% Confirmed`,
    `${resolvedAssumed || 0}% Assumed`,
    `${unresolved || 0}% Unresolved`,
  ]

  const conversationEscalatedLabels = [
    `${escalatedHandled || 0}% Handled`,
    `${escalatedTriggered || 0}% Triggered`,
  ]

  const sentimentLabels = [
    `${sentimentPositive || 0}% Positive`,
    `${sentimentNegative || 0}% Negative`,
    `${sentimentNeutral || 0}% Neutral`,
  ]

  const conversationAnsweredLabels = [
    `${answered || 0}% Answered`,
    `${unanswered || 0}% Unanswered`,
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

  const finalStats = {
    // Question stats (existing)
    countData,
    messagesData,
    negativeData,
    positiveData,
    couldAnswerData,
    couldNotAnswerData,
    escalatedData,
    labels,
    counts,
    percentageLabels,
    escalatedCounts,
    escalatedLabels,
    answerCounts,
    answerLabels,
    totalCount,
    totalMessages,
    resolutionRate,
    deflectionRate,
    couldAnswerRate: couldAnswer,
    timeSaved,
    // Conversation stats (new)
    conversationData,
    resolvedConfirmedData,
    resolvedAssumedData,
    unresolvedData,
    escalatedHandledData,
    escalatedTriggeredData,
    sentimentPositiveData,
    sentimentNegativeData,
    sentimentNeutralData,
    answeredData,
    unansweredData,
    totalConversations,
    resolvedCounts,
    resolvedLabels,
    conversationEscalatedCounts,
    conversationEscalatedLabels,
    sentimentCounts,
    sentimentLabels,
    conversationAnsweredCounts,
    conversationAnsweredLabels,
    csatData,
    conversationDeflectionData,
    avgSentimentData,
    totalCsat,
    totalConversationDeflectionRate,
    totalAvgSentiment,
    totalAnsweredRate,
    answeredRateData,
    conversationTopicLabels,
    conversationTopicPieLabels,
    conversationTopicCounts,
    conversationTopicData,
  }

  console.log(finalStats)

  return finalStats
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

export const getNeededStripeProduct = (team, teamInvites = []) => {
  const plans = JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS)

  if (team) {
    const hobbyPlanLimit = plans['hobby']
    const personalPlanLimit = plans['personal']
    const proPlanLimit = plans['pro']
    const standardPlanLimit = plans['standard']
    const businessPlanLimit = plans['business']
    const plansArray = Object.entries(plans).map(([key, value]) => ({ id: key, ...value }))
    const currentMemberCount = Object.keys(team?.roles || {}).length + teamInvites.length

   if (
      personalPlanLimit.bots >= team?.botCount &&
      personalPlanLimit.pages >= team?.pageCount &&
      personalPlanLimit.questions >= team?.questionCount &&
      personalPlanLimit.teamMembers >= currentMemberCount
    ) {
      const prices = []
      plansArray.map((item) => {
        if (item.id !== 'hobby') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    } else if (
      standardPlanLimit.bots >= team?.botCount &&
      standardPlanLimit.pages >= team?.pageCount &&
      standardPlanLimit.questions >= team?.questionCount &&
      standardPlanLimit.teamMembers >= currentMemberCount
    ) {
      const prices = []
      plansArray.map((item) => {
        if (item.id !== 'hobby' && item.id !== 'personal' && item.id !== 'pro') {
          const priceList = Object.values(item?.prices?.current)
          prices.push(priceList)
        }
      })
      return prices
    } else if (
      businessPlanLimit.bots >= team?.botCount &&
      businessPlanLimit.pages >= team?.pageCount &&
      businessPlanLimit.questions >= team?.questionCount &&
      businessPlanLimit.teamMembers >= currentMemberCount
    ) {
      const prices = []
      plansArray.map((item) => {
        if (
          item.id !== 'hobby' &&
          item.id !== 'personal' &&
          item.id !== 'pro' &&
          item.id !== 'standard'
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
  if (!content || typeof content !== 'string') return content

  let processed = content

  // 1) Multiline display markers on their own lines: convert line-anchored \[ and \] to $$
  processed = processed.replace(/^\s*\\\[\s*$/gm, () => '$$')
  processed = processed.replace(/^\s*\\\]\s*$/gm, () => '$$')

  // 2) Single-line display math: \[ ... \] -> $$...$$
  processed = processed.replace(/\\\[\s*([^\n]*?)\s*\\\]/g, (_, equation) => {
    const inner = String(equation).trim()
    return `$$${inner}$$`
  })

  // Match inline equations on a single line (avoid greedily spanning multiple blocks)
  processed = processed.replace(/\\\(([^\n]*?)\\\)/g, (_, equation) => {
    const inner = String(equation).trim()
    return `$$${inner}$$`
  })

  // Convert single-line $...$ to $$...$$, avoiding currency like $100 or $9.99
  // Conditions:
  // - Not escaped (no preceding backslash)
  // - Not $$ delimiter
  // - Next char after $ is not a digit
  // - Body contains at least a letter or backslash (typical math), no newlines
  const singleDollarInline = /(^|[^$\\])\$(?!\$)(?!\d)(?=\S)([^$\n]*[A-Za-z\\][^$\n]*?)\$(?!\$)/g
  processed = processed.replace(singleDollarInline, (_, pre, body) => {
    return `${pre}$$${String(body).trim()}$$`
  })

  return processed
}
