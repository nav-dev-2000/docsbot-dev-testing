import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue, FieldPath, Timestamp } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { stripePlan } from '@/utils/helpers'
import getFakeUserByIp from '@/utils/fakeUsers'
import { i18n } from '@/constants/strings.constants'
import { bentoTrack } from '@/lib/bento'
import { phTrack } from '@/lib/posthog'
import crypto from 'crypto'
import { sourceTypes } from '@/constants/sourceTypes.constants'
configureFirebaseApp()
const firestore = getFirestore()

const sanitizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return null
  }

  return JSON.parse(JSON.stringify(metadata))
}

export async function getBots(team, resultLimit = 1000) {
  const querySnapshot = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .orderBy('createdAt', 'desc')
    .limit(resultLimit)
    .get()

  let bots = []
  querySnapshot.forEach((doc) => {
    let bot = { id: doc.id, ...doc.data() }
    bot.createdAt = bot.createdAt.toDate().toJSON() //make serializable
    if (!bot.model) {
      bot.model = 'gpt-4.1-mini'
    }
    // if the bot is missing labels, populate with defaults
    bot.labels = {
      ...i18n[bot.language]?.labels,
      ...(bot.labels || {}),
    }

    // Initialize roles map if missing
    bot.roles = bot.roles || {}

    // Remove sensitive Slack token information before returning
    Object.keys(bot).forEach((key) => {
      if (key.startsWith('slack')) {
        delete bot[key]
      }
    })

    bots.push(bot)
  })

  return bots
}

export const getTeamEmail = async (team) => {
  // grab the owner's email
  for (let uid in team.roles) {
    const role = team.roles[uid]
    if (role === 'owner') {
      const user = await getAuth().getUser(uid)
      if (!user?.email) break
      return user.email
    }
  }

  // default email fallback
  return 'unknown-email@nomail.com'
}

const getTimeDeltaFromCalendarMonth = () => {
  // grab the current month and year
  let currentDate = new Date()

  if (currentDate.getDate() === 1) {
    // delta is the last 48 hours
    return 48 * 60 * 60 * 1000
  } else { // delta between the first day of the month and today
    let currentMonth = currentDate.getMonth()
    let currentYear = currentDate.getFullYear()
    let startDate = new Date(currentYear, currentMonth, 1)
    // calculate the difference in milliseconds
    return currentDate - startDate
  }
}

export async function getQuestionStats(
  teamId,
  botId,
  timeDelta = getTimeDeltaFromCalendarMonth(),
) {
  // grab question stats for specific bot
  const questionsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .where('createdAt', '>', new Date(Date.now() - timeDelta))
    .select('type', 'rating', 'escalation', 'createdAt', 'couldAnswer')
    .get()

  const monthly = {
    upVotes: 0,
    downVotes: 0,
    escalations: 0,
    couldAnswer: 0,
    couldNotAnswer: 0,
    questions: 0,
    messages: 0,
  }
  const daily = {}

  questionsSnapshot.forEach((questionDoc) => {
    const questionData = questionDoc.data()
    const createdDate = questionData?.createdAt?.toDate()
    //get year-month-day for object key
    const day =
      createdDate?.getFullYear() +
      '-' +
      (createdDate?.getMonth() + 1) +
      '-' +
      createdDate?.getDate()

    daily[day] = daily[day] || {
      upVotes: 0,
      downVotes: 0,
      escalations: 0,
      couldAnswer: 0,
      couldNotAnswer: 0,
      questions: 0,
      messages: 0,
    }

    if (questionData?.type === 'lookup_answer') {
      // Assuming 'rating' key is present in the question document
      const rating = questionData?.rating || 0

      if (rating === -1) {
        monthly.downVotes += 1
        daily[day].downVotes += 1
      } else if (rating === 1) {
        monthly.upVotes += 1
        daily[day].upVotes += 1
      }

      // count couldAnswer
      if (questionData?.couldAnswer) {
        monthly.couldAnswer += 1
        daily[day].couldAnswer += 1
      } else if (questionData?.couldAnswer === false) {
        monthly.couldNotAnswer += 1
        daily[day].couldNotAnswer += 1
      }

      if (questionData?.escalation) {
        monthly.escalations += 1
        daily[day].escalations += 1
      }

      monthly.questions += 1
      daily[day].questions += 1
    }

    monthly.messages += 1
    daily[day].messages += 1
  })

  return {
    monthly,
    daily,
  }
}

export async function getConversationStats(
  teamId,
  botId,
  timeDelta = getTimeDeltaFromCalendarMonth(),
) {
  // grab conversation stats for specific bot
  const conversationsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('conversations')
    .where('createdAt', '>', new Date(Date.now() - timeDelta))
    .select('createdAt', 'resolved', 'escalated', 'sentiment', 'answered', 'topic')
    .get()

  const monthly = {
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
    topics: {},
  }
  const daily = {}

  conversationsSnapshot.forEach((conversationDoc) => {
    const conversationData = conversationDoc.data()
    const createdDate = conversationData?.createdAt?.toDate()
    //get year-month-day for object key
    const day =
      createdDate?.getFullYear() +
      '-' +
      (createdDate?.getMonth() + 1) +
      '-' +
      createdDate?.getDate()

    daily[day] = daily[day] || {
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
      topics: {},
    }

    // Count total conversations
    monthly.conversations += 1
    daily[day].conversations += 1

    // Track resolved states
    if (conversationData?.resolved === 'confirmed') {
      monthly.resolvedConfirmed += 1
      daily[day].resolvedConfirmed += 1
    } else if (conversationData?.resolved === 'assumed') {
      monthly.resolvedAssumed += 1
      daily[day].resolvedAssumed += 1
    } else if (conversationData?.resolved === 'unresolved') {
      monthly.unresolved += 1
      daily[day].unresolved += 1
    }

    // Track escalation states
    if (conversationData?.escalated === 'handled') {
      monthly.escalatedHandled += 1
      daily[day].escalatedHandled += 1
    } else if (conversationData?.escalated === 'triggered') {
      monthly.escalatedTriggered += 1
      daily[day].escalatedTriggered += 1
    }

    // Track sentiment
    if (conversationData?.sentiment === 'positive') {
      monthly.sentimentPositive += 1
      daily[day].sentimentPositive += 1
    } else if (conversationData?.sentiment === 'negative') {
      monthly.sentimentNegative += 1
      daily[day].sentimentNegative += 1
    } else if (conversationData?.sentiment === 'neutral') {
      monthly.sentimentNeutral += 1
      daily[day].sentimentNeutral += 1
    }

    // Track topics
    if (conversationData?.topic) {
      const topic = conversationData.topic
      monthly.topics = monthly.topics || {}
      monthly.topics[topic] = (monthly.topics[topic] || 0) + 1

      daily[day].topics = daily[day].topics || {}
      daily[day].topics[topic] = (daily[day].topics[topic] || 0) + 1
    }

    // Track answered status
    if (conversationData?.answered === true) {
      monthly.answered += 1
      daily[day].answered += 1
    } else if (conversationData?.answered === false) {
      monthly.unanswered += 1
      daily[day].unanswered += 1
    }
  })

  return {
    monthly,
    daily,
  }
}

export async function getBot(teamId, botId) {
  // Sanity check for valid parameters
  if (
    !teamId ||
    typeof teamId !== 'string' ||
    !/^[A-Za-z0-9]{20}$/.test(teamId)
  ) {
    console.log('Invalid teamId parameter')
    return null
  }
  if (!botId || typeof botId !== 'string' || !/^[A-Za-z0-9]{20}$/.test(botId)) {
    console.log('Invalid botId parameter')
    return null
  }
  const botRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
  const botSnapshot = await botRef.get()
  if (botSnapshot.exists) {
    let bot = { id: botSnapshot.id, ...botSnapshot.data() }
    bot.createdAt = bot.createdAt.toDate().toJSON() //make serializable

    //create an expiring hmac token for the bot so that it can be used to authenticate with the API
    if (!bot.signatureKey) {
      bot.signatureKey = crypto.randomBytes(32).toString('hex')
      botRef.update({ signatureKey: bot.signatureKey })
    }

    const hmac = crypto.createHmac('sha256', bot.signatureKey)
    const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 12 //expires in 12 hours
    hmac.update(`${botId}:${expires}`)
    bot.signature = `${hmac.digest('hex')}:${expires}`

    if (!bot.model) {
      bot.model = 'gpt-4.1-mini'
    }

    // if the bot is missing labels, populate with defaults
    bot.labels = {
      ...i18n[bot.language]?.labels,
      ...(bot.labels || {}),
    }

    // Initialize roles map if missing
    bot.roles = bot.roles || {}

    // Remove sensitive Slack token information before returning
    if (bot.slackBotToken) {
      delete bot.slackBotToken;
    }

    return bot
  } else {
    return null
  }
}

export async function getSources(
  teamId,
  bot,
  page = 0,
  pageSize = 100,
  ascending = false,
) {
  const offset = page * pageSize
  const sourcesRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(bot.id)
    .collection('sources')
    .orderBy('createdAt', ascending ? 'asc' : 'desc')
    .select(
      FieldPath.documentId(),
      'id',
      'file',
      'type',
      'title',
      'url',
      //'faqs',
      //'indexedUrls',
      'trutoIntegrationID',
      'trutoFiles',
      'carbonId', //to display notice on legacy sources
      'warnsList',
      'error',
      'createdAt',
      'pageCount',
      'chunkCount',
      'status',
      'refreshing',
      'scheduled',
      'scheduleInterval',
      'processImages',
      'processedImages',
      'processedPages',
    )
    .offset(offset)
    .limit(pageSize)

  //TODO add pagination
  const querySnapshot = await sourcesRef.get()
  let sources = []
  querySnapshot.forEach((doc) => {
    let source = { id: doc.id, ...doc.data() }
    //if createdAt is more than X hour ago and indexing is not complete, set error
    const trutoTypes = sourceTypes
      .filter((type) => type.isTruto)
      .map((type) => type.id)

    const expireHours = [...trutoTypes, 'urls', 'sitemap'].includes(
      source.type,
    )
      ? 6
      : 1 //APIFY has 6hr timeout, cloud functions has 60mins
    if (
      ['indexing', 'pending', 'processing'].includes(source.status) &&
      source.createdAt.toDate() <
        new Date(Date.now() - expireHours * 60 * 60 * 1000)
    ) {
      source.status = 'failed'
      source.error = 'Processing timed out, please try again'
      //update source
      firestore
        .collection('teams')
        .doc(teamId)
        .collection('bots')
        .doc(bot.id)
        .collection('sources')
        .doc(doc.id)
        .update({ status: source.status, error: source.error })
    }

    source.createdAt = source.createdAt.toDate().toJSON() //make serializable
    if (source.scheduled) {
      source.scheduled = source.scheduled.toDate().toJSON() //make serializable
    }
    sources.push(source)
  })

  // get total counts efficiently
  const snapshot = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(bot.id)
    .collection('sources')
  const countSnapshot = await snapshot.count().get()
  const totalCount = countSnapshot.data().count
  const hasMorePages = offset + pageSize < totalCount

  const pagination = {
    perPage: pageSize,
    page: page,
    totalCount: totalCount,
    hasMorePages: hasMorePages,
  }
  return { sources, pagination }
}

export async function getSource(team, bot, sourceId) {
  const sourceRef = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(bot.id)
    .collection('sources')
    .doc(sourceId)
    .get()
  if (sourceRef.exists) {
    let source = { id: sourceRef.id, ...sourceRef.data() }
    source.createdAt = source.createdAt.toDate().toJSON() // Make serializable
    if (source.scheduled) {
      source.scheduled = source.scheduled.toDate().toJSON() //make serializable
    }
    return source
  } else {
    return null
  }
}

export const convertQuestionDocToData = (id, docData) => {
  let alias = docData.ip ? getFakeUserByIp(docData.ip) : 'unknown-user'
  //if we identified the user, use the provided data for alias
  if (docData.metadata) {
    if (docData.metadata.name) {
      alias = docData.metadata.name
      if (docData.metadata.email) {
        alias += ' (' + docData.metadata.email + ')'
      }
    } else if (docData.metadata.email) {
      alias = docData.metadata.email
    }
  }

  let question = { id, ...docData, alias }
  question.createdAt = question.createdAt.toDate().toJSON() // make serializable

  // question.sources = docData.sources || []
  if (!question.sources || Object.keys(question.sources).length === 0) {
    question.sources = []
  }

  return question
}

const QUESTION_SELECT_LIST = [
  FieldPath.documentId(),
  'createdAt',
  'ip',
  'question',
  'standaloneQuestion',
  'sources',
  'answer',
  'rating',
  'escalation',
  'metadata',
  'testing',
  'run_id',
  'deleted',
  'couldAnswer',
  'conversationId',
]

export async function getQuestions(
  team,
  botId,
  perPage = 50,
  page = 0,
  ip = null,
  rating = null,
  escalated = null,
  couldAnswer = null,
  startTime = null,
  endTime = null,
) {
  const offset = page * perPage
  let snapshot = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .where('type', '==', 'lookup_answer')
    .select(...QUESTION_SELECT_LIST) //skip the vector as it's huge

  // grab limits
  const plan = stripePlan(team)
  const planLimit = plan.logLimit
  const pageLimit = offset + perPage >= planLimit ? planLimit - offset : perPage

  if (ip) {
    snapshot = snapshot.where('ip', '==', ip)
  }

  if (escalated !== null) {
    snapshot = snapshot.where('escalation', '==', escalated)
  }

  if (couldAnswer !== null) {
    snapshot = snapshot.where('couldAnswer', '==', couldAnswer)
  }

  if (rating !== null) {
    snapshot = snapshot.where('rating', '==', rating || 0)
  }

  if (startTime) {
    const start = new Date(startTime)
    if (isNaN(start.getTime())) {
      throw new Error('Invalid parameter "startTime".')
    }
    snapshot = snapshot.where('createdAt', '>=', start)
  }

  if (endTime) {
    const end = new Date(endTime)
    if (isNaN(end.getTime())) {
      throw new Error('Invalid parameter "endTime".')
    }
    snapshot = snapshot.where('createdAt', '<=', end)
  }

  const questionsRef = snapshot
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(pageLimit)

  // grab questions
  const querySnapshot = await questionsRef.get()
  let questions = []
  querySnapshot.forEach((doc) => {
    const docData = doc.data()
    const question = convertQuestionDocToData(doc.id, docData)
    questions.push(question)
  })

  snapshot = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .where('type', '==', 'lookup_answer')
    .orderBy('createdAt', 'desc')

  if (ip) {
    snapshot = snapshot.where('ip', '==', ip)
  }

  if (escalated !== null) {
    snapshot = snapshot.where('escalation', '==', escalated)
  }

  if (rating !== null) {
    snapshot = snapshot.where('rating', '==', rating || 0)
  }

  if (startTime) {
    const start = new Date(startTime)
    snapshot = snapshot.where('createdAt', '>=', start)
  }

  if (endTime) {
    const end = new Date(endTime)
    snapshot = snapshot.where('createdAt', '<=', end)
  }

  // get total count
  const countSnapshot = await snapshot.count().get()
  const totalCount = countSnapshot.data().count

  // get plan viewable count
  const viewableCount = totalCount > planLimit ? planLimit : totalCount

  const pagination = {
    perPage,
    page,
    viewableCount,
    totalCount,
    hasMorePages: offset + perPage < viewableCount,
    planLimit,
  }

  return { questions, pagination }
}

export async function getQuestion(teamId, botId, questionId) {
  const questionRef = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .doc(questionId)
    .get()
  if (questionRef.exists) {
    const docData = questionRef.data()
    const question = convertQuestionDocToData(questionId, docData)

    // filter out unwanted fields
    for (const [key, _] of Object.entries(question)) {
      if (!['id', ...QUESTION_SELECT_LIST].includes(key)) {
        delete question[key]
      }
    }

    return question
  } else {
    return null
  }
}

const CONVERSATION_SELECT_LIST = [
  FieldPath.documentId(),
  'createdAt',
  'updatedAt',
  //'history', Skip history as it' potentially huge
  'resolved',
  'escalated',
  'answered',
  'ip',
  'metadata',
  'title',
  'summary',
  'sentiment',
  'model',
  'truncated',
  'topic',
  //'ticketSubject',
  //'ticketContent',
]
export async function getConversations(
  team,
  botId,
  perPage = 50,
  page = 0,
  ip = null,
  sentiment = null,
  escalated = null,
  resolved = null,
  startTime = null,
  endTime = null
) {
  const offset = page * perPage
  let snapshot = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .collection('conversations')
    .select(...CONVERSATION_SELECT_LIST) //skip the history as it's potentially huge

  // grab limits
  const plan = stripePlan(team)
  const planLimit = plan.logLimit
  const pageLimit = offset + perPage >= planLimit ? planLimit - offset : perPage

  if (ip) {
    snapshot = snapshot.where('ip', '==', ip)
  }

  if (escalated !== null) {
    snapshot = snapshot.where('escalated', '==', escalated)
  } 

  if (resolved !== null) {
    snapshot = snapshot.where('resolved', '==', resolved)
  }

  if (sentiment !== null) {
    snapshot = snapshot.where('sentiment', '==', sentiment)
  }

  if (startTime) {
    const start = new Date(startTime)
    if (isNaN(start.getTime())) {
      throw new Error('Invalid parameter "startTime".')
    }
    snapshot = snapshot.where('createdAt', '>=', start)
  }

  if (endTime) {
    const end = new Date(endTime)
    if (isNaN(end.getTime())) {
      throw new Error('Invalid parameter "endTime".')
    }
    snapshot = snapshot.where('createdAt', '<=', end)
  }

  const conversationsRef = snapshot
    .orderBy('createdAt', 'desc')
    .offset(offset)
    .limit(pageLimit)

  // grab conversations
  const querySnapshot = await conversationsRef.get()
  let conversations = []
  querySnapshot.forEach((doc) => {
    const docData = doc.data()
    const sanitizedMetadata = sanitizeMetadata(docData.metadata)
    let alias = docData.ip ? getFakeUserByIp(docData.ip) : 'unknown-user'
    //if we identified the user, use the provided data for alias
    if (sanitizedMetadata) {
      if (sanitizedMetadata.name) {
        alias = sanitizedMetadata.name
      } else if (sanitizedMetadata.email) {
        alias = sanitizedMetadata.email
      }
    }

    let question = {
      id: doc.id,
      ...docData,
      metadata: sanitizedMetadata,
      alias: alias,
      email: sanitizedMetadata?.email // Explicitly set email field for Gravatar
    }
    question = JSON.stringify(question, (key, value) => {
      if (value instanceof Timestamp) {
        return value.toDate().toJSON()
      }
      return value
    })
    question = JSON.parse(question)

    conversations.push(question)
  })

  snapshot = firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(botId)
    .collection('conversations')

  if (ip) {
    snapshot = snapshot.where('ip', '==', ip)
  }

  if (escalated !== null) {
    snapshot = snapshot.where('escalated', '==', escalated)
  } 
  
  if (resolved !== null) {
    snapshot = snapshot.where('resolved', '==', resolved || 0)
  }

  if (sentiment !== null) {
    snapshot = snapshot.where('sentiment', '==', sentiment)
  }
  
  if (startTime) {
    const start = new Date(startTime)
    snapshot = snapshot.where('createdAt', '>=', start)
  }

  if (endTime) {
    const end = new Date(endTime)
    snapshot = snapshot.where('createdAt', '<=', end)
  }

  // get total count
  const countSnapshot = await snapshot.count().get()
  const totalCount = countSnapshot.data().count

  // get plan viewable count
  const viewableCount = totalCount > planLimit ? planLimit : totalCount

  const pagination = {
    perPage,
    page,
    viewableCount,
    totalCount,
    hasMorePages: offset + perPage < viewableCount,
    planLimit,
  }

  return { conversations, pagination }
}

export async function getConversation(teamId, botId, conversationId) {
  const conversationRef = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('conversations')
    .doc(conversationId)
    .get()

  if (conversationRef.exists) {
    const { metadata, ...restDocData } = conversationRef.data()
    const sanitizedMetadata = sanitizeMetadata(metadata)
    let alias = restDocData.ip ? getFakeUserByIp(restDocData.ip) : 'unknown-user'

    //if we identified the user, use the provided data for alias
    if (sanitizedMetadata) {
      if (sanitizedMetadata.name) {
        alias = sanitizedMetadata.name
      } else if (sanitizedMetadata.email) {
        alias = sanitizedMetadata.email
      }
    }

    let conversation = {
      id: conversationId,
      ...restDocData,
      metadata: sanitizedMetadata,
      alias: alias,
      email: sanitizedMetadata?.email // Explicitly set email field for Gravatar
    }
    
    // Convert Timestamps to JSON dates
    conversation = JSON.stringify(conversation, (key, value) => {
      if (value instanceof Timestamp) {
        return value.toDate().toJSON()
      }
      return value
    })
    conversation = JSON.parse(conversation)

    return conversation
  } else {
    return null
  }
}

export async function getUser(userId) {
  const userRef = await firestore.collection('users').doc(userId).get()
  if (userRef.exists) {
    let user = { id: userRef.id, ...userRef.data() }
    user.createdAt = user.createdAt.toDate().toJSON() //make serializable
    if (user.updatedAt) {
      user.updatedAt = user.updatedAt instanceof Date 
        ? user.updatedAt.toJSON() 
        : user.updatedAt.toDate ? user.updatedAt.toDate().toJSON() 
        : user.updatedAt
    }
    user.apiKey = user.apiKey ? user.apiKeyPreview : null
    delete user.apiKeyPreview
    
    // Serialize pushSubscriptions array - convert Date objects to JSON strings
    if (user.pushSubscriptions && Array.isArray(user.pushSubscriptions)) {
      user.pushSubscriptions = user.pushSubscriptions.map((subscription) => {
        const serialized = { ...subscription }
        if (subscription.createdAt) {
          serialized.createdAt = subscription.createdAt instanceof Date 
            ? subscription.createdAt.toJSON() 
            : subscription.createdAt.toDate ? subscription.createdAt.toDate().toJSON() 
            : subscription.createdAt
        }
        if (subscription.updatedAt) {
          serialized.updatedAt = subscription.updatedAt instanceof Date 
            ? subscription.updatedAt.toJSON() 
            : subscription.updatedAt.toDate ? subscription.updatedAt.toDate().toJSON() 
            : subscription.updatedAt
        }
        return serialized
      })
    }
    
    return user
  } else {
    return null
  }
}

export async function getTeam(teamId) {
  // Sanity check for valid teamId parameter
  if (
    !teamId ||
    typeof teamId !== 'string' ||
    !/^[A-Za-z0-9]{20}$/.test(teamId)
  ) {
    console.log('Invalid teamId parameter')
    return null
  }
  const teamRef = await firestore.collection('teams').doc(teamId).get()
  if (teamRef.exists) {
    let team = { id: teamRef.id, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //make serializable

    if (team.yearlyReports) {
      team.yearlyReports = serializeYearlyReports(team.yearlyReports)
    }

    //use preview key if available otherwise use fake one or null
    team.openAIKey = team.openAIKey
      ? team.openAIKeyPreview
        ? team.openAIKeyPreview
        : 'sk-*...****'
      : null
    delete team.openAIKeyPreview
    return team
  } else {
    return null
  }
}

function serializeYearlyReports(reports = {}) {
  const yearlyReports = {}
  Object.entries(reports || {}).forEach(([year, report]) => {
    if (!report) return
    yearlyReports[year] = {
      ...report,
      generated_at:
        report.generated_at && typeof report.generated_at.toDate === 'function'
          ? report.generated_at.toDate().toJSON()
          : report.generated_at,
    }
  })
  return yearlyReports
}

export async function getTeams(userId) {
  //get teams for user list
  let teams = []
  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('roles.' + userId, '!=', null)
      .get()
    teamsSnapshot.forEach((doc) => {
      let team = { id: doc.id, ...doc.data() }
      team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string
      if (team.yearlyReports) {
        team.yearlyReports = serializeYearlyReports(team.yearlyReports)
      }
      //use preview key if available otherwise use fake one or null
      team.openAIKey = team.openAIKey
        ? team.openAIKeyPreview
          ? team.openAIKeyPreview
          : 'sk-*...****'
        : null
      delete team.openAIKeyPreview

      //delete sensitive data keys starting with stripe
      Object.keys(team).forEach((key) => {
        if (key.startsWith('stripe')) {
          delete team[key]
        }
      })
      //add stripe plan
      team.plan = stripePlan(team)

      teams.push(team)
    })
  } catch (error) {
    console.warn('Error getting team:', error)
  }

  return teams
}

export async function getUserTeams(userId) {
  //get teams for user list
  let teams = []
  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('roles.' + userId, '!=', null)
      .get()
    teamsSnapshot.forEach((doc) => {
      let team = { id: doc.id, ...doc.data() }
      team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string
      if (team.yearlyReports) {
        team.yearlyReports = serializeYearlyReports(team.yearlyReports)
      }
      //use preview key if available otherwise use fake one or null
      team.openAIKey = team.openAIKey
        ? team.openAIKeyPreview
          ? team.openAIKeyPreview
          : 'sk-*...****'
        : null
      delete team.openAIKeyPreview

      //delete sensitive data keys starting with stripe
      Object.keys(team).forEach((key) => {
        if (key.startsWith('stripe')) {
          delete team[key]
        }
      })
      //add stripe plan
      team.plan = stripePlan(team)

      teams.push(team)
    })
  } catch (error) {
    console.warn('Error getting team:', error)
  }

  return teams
}

// creates a team if one doesn't exist
export async function assignDefaultTeam(userId, name) {
  let teams = await getUserTeams(userId)

  let teamId = ''
  if (teams.length >= 1) {
    teamId = teams[0].id
  } else {
    // Add team based on user id with 'owner' as default permission
    const teamRef = await firestore.collection('teams').add({
      createdAt: FieldValue.serverTimestamp(),
      name: `${name.trim()}'s Team`,
      botCount: 0,
      sourceCount: 0,
      pageCount: 0,
      chunkCount: 0,
      questionCount: 0,
      openAIKey: null,
      roles: {
        [userId]: 'owner',
      },
    })
    teamId = teamRef.id
  }

  await firestore.collection('users').doc(userId).set({
    createdAt: FieldValue.serverTimestamp(),
    currentTeam: teamId,
  })
}

export async function getInvitesFromEmail(email) {
  const inviteQuery = await firestore
    .collection('invites')
    .where('email', '==', email)
    .get()
  let userInvites = []
  inviteQuery.forEach((doc) => {
    const docData = doc.data()
    userInvites.push({
      teamId: docData.teamId,
      email: docData.email,
      role: docData.role || 'viewer',
      inviteId: doc.id,
      key: doc.id,
      uid: doc.id,
    })
  })

  for (const [i, ui] of userInvites.entries()) {
    const ref = await firestore.collection('teams').doc(ui.teamId).get()
    const hash = crypto.createHash('md5').update(ui.email).digest('hex')
    userInvites[i].photoURL = `https://www.gravatar.com/avatar/${hash}?d=mp`
    userInvites[i].teamName = ref.data().name
  }

  return userInvites
}

export async function getInvitesFromEmailAndTeamId(email, teamId) {
  const inviteQuery = await firestore
    .collection('invites')
    .where('email', '==', email)
    .where('teamId', '==', teamId)
    .get()
  let userInvites = []
  inviteQuery.forEach((doc) => {
    const docData = doc.data()
    userInvites.push({
      teamId: docData.teamId,
      email: docData.email,
      inviteId: doc.id,
      key: doc.id,
      uid: doc.id,
    })
  })

  for (const [i, ui] of userInvites.entries()) {
    const ref = await getTeam(ui.teamId)
    const hash = crypto.createHash('md5').update(ui.email).digest('hex')
    userInvites[i].photoURL = `https://www.gravatar.com/avatar/${hash}?d=mp`
    userInvites[i].teamName = ref.name
  }

  return userInvites
}

export async function getInvitesFromTeam(teamId) {
  const inviteQuery = await firestore
    .collection('invites')
    .where('teamId', '==', teamId)
    .get()
  let userInvites = []
  inviteQuery.forEach((doc) => {
    const docData = doc.data()
    userInvites.push({
      teamId: docData.teamId,
      email: docData.email,
      role: docData.role,
      inviteId: doc.id,
      key: doc.id,
      uid: doc.id,
    })
  })

  for (const [i, ui] of userInvites.entries()) {
    const ref = await firestore.collection('teams').doc(ui.teamId).get()
    const hash = crypto.createHash('md5').update(ui.email).digest('hex')
    userInvites[i].photoURL = `https://www.gravatar.com/avatar/${hash}?d=mp`
    userInvites[i].teamName = ref.data().name
    try {
      await getAuth().getUserByEmail(ui.email)
      userInvites[i].userExists = true
    } catch (error) {
      userInvites[i].userExists = false
    }
  }

  return userInvites
}

export async function acceptInvite(teamId, userId, inviteId, role) {
  // add user to team roles
  let teamName = null
  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('teams').doc(teamId)
    const inviteRef = firestore.collection('invites').doc(inviteId)
    const teamDoc = await transaction.get(teamRef)
    const inviteDoc = await transaction.get(inviteRef)
    if (inviteDoc.data().teamId !== teamId) {
      throw new Error('You were not invited to this team!')
    }
    const botOverrides = inviteDoc.data().botOverrides || []
    teamName = teamDoc.data().name

    console.log('data:', teamDoc.data().roles, typeof teamDoc.data().roles)
    const isAdded = teamDoc.data().roles[userId]
    // Firestore transactions require all reads before any writes.
    const botOverrideRefs = isAdded === undefined
      ? botOverrides
          .filter((override) => override?.botId && override?.role)
          .map((override) => ({
            ref: firestore
              .collection('teams')
              .doc(teamId)
              .collection('bots')
              .doc(override.botId),
            role: override.role,
          }))
      : []
    const botOverrideDocs = await Promise.all(
      botOverrideRefs.map(async ({ ref, role }) => ({
        ref,
        role,
        doc: await transaction.get(ref),
      })),
    )
    if (isAdded === undefined) {
      transaction.update(teamRef, {
        roles: {
          [userId]: role || 'admin',
          ...teamDoc.data().roles,
        },
      })

      // set the user's currentTeam to the newly joined team
      transaction.update(firestore.collection('users').doc(userId), {
        currentTeam: teamId,
      })

      for (const { doc, ref, role: overrideRole } of botOverrideDocs) {
        if (!doc.exists) continue
        const botRoles = doc.data().roles || {}
        transaction.update(ref, {
          roles: {
            ...botRoles,
            [userId]: overrideRole,
          },
        })
      }
    }

    transaction.delete(inviteRef)
  })

  try {
    bentoTrack(uid, 'track', {
      type: 'acceptInvite',
    })
    phTrack(uid, 'Team Invite Accepted', {}, teamId)
  } catch (e) {
    console.log('Error sending bento track', e)
  }
}

export async function getTeamUsers(teamId) {
  const users = []

  const teamRef = await firestore.collection('teams').doc(teamId).get()
  if (teamRef.exists) {
    let team = { id: teamRef.id, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string

    let query = []
    for (const [userId, role] of Object.entries(team.roles)) {
      query.push({ uid: userId })
    }

    try {
      const profiles = await getAuth().getUsers(query)

      profiles.users.forEach((userRecord) => {
        let { uid, displayName, email, photoURL } = userRecord
        displayName = displayName || 'No Name'
        const hash = crypto.createHash('md5').update(email).digest('hex')
        photoURL = photoURL || `https://www.gravatar.com/avatar/${hash}?d=mp`
        users.push({ uid, displayName, email, photoURL, role: team.roles[uid] })
      })
    } catch (error) {
      console.log('Error fetching user data:', error)
    }
  }

  return users
}

export async function getTeamIntegrations(teamId) {
  const integrations = []

  const integrationsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('integrations')
    .get()
  integrationsSnapshot.forEach((doc) => {
    const docData = doc.data()
    integrations.push({ id: doc.id, ...docData })
  })

  return integrations
}

export async function getMcpOAuthClients(teamId) {
  /**
   * Fetch MCP OAuth clients for a team from Firestore.
   * Groups tokens by client_id and returns unique clients with their authorized bots.
   * 
   * @param {string} teamId - The team ID to fetch clients for
   * @returns {Array} Array of client objects with client_id, bot_ids, authorized_at, and scopes
   */
  try {
    const tokensSnapshot = await firestore
      .collection('mcpOauthTokens')
      .where('team_id', '==', teamId)
      .get()

    // Group tokens by client_id to show unique clients
    const clientsMap = new Map()

    tokensSnapshot.forEach((doc) => {
      const tokenData = doc.data()
      const clientId = tokenData.client_id

      if (!clientId) {
        return // Skip tokens without client_id
      }

      // Get or create client entry
      if (!clientsMap.has(clientId)) {
        clientsMap.set(clientId, {
          client_id: clientId,
          bot_ids: [],
          authorized_at: null,
          scopes: tokenData.scopes || [],
          redirect_domain: tokenData.redirect_domain || null,
        })
      }

      const client = clientsMap.get(clientId)
      
      // Update redirect_domain if not set or if this token has a newer one
      if (tokenData.redirect_domain && !client.redirect_domain) {
        client.redirect_domain = tokenData.redirect_domain
      }

      // Merge bot IDs (avoid duplicates)
      const accessBotIds = tokenData.access_bot_ids || []
      accessBotIds.forEach((botId) => {
        if (!client.bot_ids.includes(botId)) {
          client.bot_ids.push(botId)
        }
      })

      // Use authorized_at if present, otherwise calculate from expires_at
      let authorizedAt = null
      if (tokenData.authorized_at) {
        // Use the provided authorized_at timestamp
        // Handle both Unix timestamp (number) and Firestore Timestamp
        if (tokenData.authorized_at instanceof Timestamp) {
          authorizedAt = tokenData.authorized_at.toMillis() / 1000 // Convert to Unix timestamp (seconds)
        } else if (typeof tokenData.authorized_at === 'number') {
          authorizedAt = tokenData.authorized_at
        } else if (tokenData.authorized_at && typeof tokenData.authorized_at.toDate === 'function') {
          // Handle Firestore Timestamp or other timestamp formats with toDate method
          authorizedAt = tokenData.authorized_at.toDate().getTime() / 1000
        } else if (tokenData.authorized_at && typeof tokenData.authorized_at.toMillis === 'function') {
          // Handle Firestore Timestamp with toMillis method
          authorizedAt = tokenData.authorized_at.toMillis() / 1000
        }
      } else if (tokenData.expires_at) {
        // Fallback: Calculate authorized_at from expires_at (tokens expire 24h after creation)
        // Handle both Unix timestamp (number) and Firestore Timestamp
        let expiresAt = tokenData.expires_at
        if (expiresAt instanceof Timestamp) {
          expiresAt = expiresAt.toMillis() / 1000
        } else if (expiresAt && typeof expiresAt.toDate === 'function') {
          expiresAt = expiresAt.toDate().getTime() / 1000
        } else if (expiresAt && typeof expiresAt.toMillis === 'function') {
          expiresAt = expiresAt.toMillis() / 1000
        }
        authorizedAt = expiresAt - 24 * 60 * 60 // Subtract 24 hours
      }

      if (authorizedAt && (!client.authorized_at || authorizedAt < client.authorized_at)) {
        client.authorized_at = authorizedAt
      }
    })

    // Convert map to array and convert timestamps to serializable format
    const clients = Array.from(clientsMap.values()).map((client) => ({
      ...client,
      authorized_at: client.authorized_at || null,
    }))

    return clients
  } catch (error) {
    console.error('Error fetching MCP OAuth clients:', error)
    return []
  }
}
