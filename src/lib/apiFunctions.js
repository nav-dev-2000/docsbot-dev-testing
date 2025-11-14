import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldPath, FieldValue } from 'firebase-admin/firestore'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import { getBot, getTeam } from '@/lib/dbQueries'
import { deleteTenant } from '@/lib/weaviate'
import { QueueSourceExpel } from '@/lib/service'
import { isSuperAdmin, checkPlanPermission } from '@/utils/helpers'
import { i18n } from '@/constants/strings.constants'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import crypto from 'crypto'
import { DeleteIntegratedAccount, BulkDeleteIntegratedAccounts } from '@/lib/truto'
import { isTrutoSourceType } from '@/constants/sourceTypes.constants'

const TOPIC_LIMIT = 50

export const deleteSource = async (
  teamId,
  bot,
  sourceId,
) => {
  configureFirebaseApp()
  const firestore = getFirestore()

  //if source is in a ready state, we need to delete it from weaviate
  QueueSourceExpel(teamId, bot.indexId, bot.id, sourceId)

  //delete source from db
  let source = null
  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('teams').doc(teamId)
    const botRef = teamRef.collection('bots').doc(bot.id)
    const sourceRef = botRef.collection('sources').doc(sourceId)
    const teamDoc = await transaction.get(teamRef)
    const botDoc = await transaction.get(botRef)
    const sourceDoc = await transaction.get(sourceRef)
    if (!teamDoc.exists) {
      throw 'Team does not exist!'
    }

    source = sourceDoc.data()

    // decrement team counts (if the source was ingested)
    if (
      sourceDoc.data().status == 'ready' ||
      sourceDoc.data().status == 'failed'
    ) {
      const newTeamSourceCount = (teamDoc.data().sourceCount || 0) - 1
      const newTeamChunkCount =
        (teamDoc.data().chunkCount || 0) - sourceDoc.data().chunkCount
      const newTeamPageCount =
        (teamDoc.data().pageCount || 0) - sourceDoc.data().pageCount
      transaction.update(teamRef, {
        sourceCount: newTeamSourceCount,
        chunkCount: newTeamChunkCount,
        pageCount: newTeamPageCount,
        needsUpdate: true,
      })

      // decrement bot counts
      const newBotSourceCount = (botDoc.data().sourceCount || 0) - 1
      const newBotChunkCount =
        (botDoc.data().chunkCount || 0) - sourceDoc.data().chunkCount
      const newBotPageCount =
        (botDoc.data().pageCount || 0) - sourceDoc.data().pageCount
      const newBotStatus = newBotSourceCount == 0 ? 'pending' : 'ready'
      transaction.update(botRef, {
        sourceCount: newBotSourceCount,
        chunkCount: newBotChunkCount,
        pageCount: newBotPageCount,
        status: newBotStatus,
      })
    }

    // remove source
    transaction.delete(sourceRef)
  })

  // If it's a Truto source, delete it from Truto first
  if (isTrutoSourceType(source.type) && source.trutoIntegrationID) {
    try {
      await DeleteIntegratedAccount(source.trutoIntegrationID)
    } catch (error) {
      console.warn('Error deleting Truto integrated account:', error)
      // Continue with deletion even if Truto deletion fails
    }
  }

  //delete all sources data from bucket
  try {
    const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
    await bucket.deleteFiles({ prefix: `teams/${teamId}/bots/${bot.id}/sources/${sourceId}` })
  } catch (error) {
    console.warn('Error deleting sources data from bucket:', error)
  }

  return true
}

export const deleteBot = async (teamId, botId) => {
  configureFirebaseApp()
  const firestore = getFirestore()
  const team = await getTeam(teamId)
  const bot = await getBot(teamId, botId)
  if (!bot) {
    return false
  }

  //delete bot from db

  //---------------------------
  // Delete all sources for bot
  const querySnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('sources')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()

  // Once we get the results, begin a batch
  let toDelete = []
  querySnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  //loop through toDelete and delete in batches of 500
  let counter = 0
  let sourcesBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    sourcesBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 50 operations
    if (counter % 50 === 0) {
      await sourcesBatch.commit()
      sourcesBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await sourcesBatch.commit()

  //---------------------------
  // Delete all questions for bot
  const questionsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('questions')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()
  // Once we get the results, begin a batch
  toDelete = []
  questionsSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })
  //loop through toDelete and delete in batches of 500
  counter = 0
  let questionsBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    questionsBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 50 operations
    if (counter % 50 === 0) {
      await questionsBatch.commit()
      questionsBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await questionsBatch.commit()

  //---------------------------
  // Delete all reports for bot
  const reportsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('reports')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()

  // Once we get the results, begin a batch
  toDelete = []
  reportsSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  // Loop through toDelete and delete in batches of 50
  counter = 0
  let reportsBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    reportsBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 50 operations
    if (counter % 50 === 0) {
      await reportsBatch.commit()
      reportsBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await reportsBatch.commit()

  //---------------------------
  // Delete all conversations for bot
  const conversationsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('conversations')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()

  // Once we get the results, begin a batch
  toDelete = []
  conversationsSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  // Loop through toDelete and delete in batches of 50
  counter = 0
  let conversationsBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    conversationsBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 50 operations
    if (counter % 50 === 0) {
      await conversationsBatch.commit()
      conversationsBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await conversationsBatch.commit()

  //---------------------------
  // Delete all research for bot
  const researchSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('research')
    .select(FieldPath.documentId()) //less data to retrieve
    .get()

  // Once we get the results, begin a batch
  toDelete = []
  researchSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  // Loop through toDelete and delete in batches of 50
  counter = 0
  let researchBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    researchBatch.delete(toDelete[i])
    counter++
    // Commit the batch every 50 operations
    if (counter % 50 === 0) {
      await researchBatch.commit()
      researchBatch = firestore.batch()
    }
  }
  // Commit the remaining batch
  await researchBatch.commit()

  //delete bot
  await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .delete()

  //decrement botCounts on team
  await firestore.runTransaction(async (transaction) => {
    const teamRef = firestore.collection('teams').doc(teamId)
    const sfDoc = await transaction.get(teamRef)
    if (!sfDoc.exists) {
      throw 'Team does not exist!'
    }

    const newBotCount = Math.max(0, (sfDoc.data().botCount || 0) - 1)
    const newSourceCount = Math.max(
      0,
      (sfDoc.data().sourceCount || 0) - (bot.sourceCount || 0),
    )
    const newPageCount = Math.max(
      0,
      (sfDoc.data().pageCount || 0) - (bot.pageCount || 0),
    )
    const newChunkCount = Math.max(
      0,
      (sfDoc.data().chunkCount || 0) - (bot.chunkCount || 0),
    )
    transaction.update(teamRef, {
      botCount: newBotCount,
      sourceCount: newSourceCount,
      pageCount: newPageCount,
      chunkCount: newChunkCount,
    })
  })

  //delete schema in weaviate async
  if (bot.indexId === 'TenantDocument') {
    try {
      deleteTenant(team, botId)
    } catch (error) {
      console.warn('Error deleting Weaviate Tenant:', error)
    }
  } else {
    try {
      //deleteSchema(bot.indexId)
    } catch (error) {
      console.warn('Error deleting Weaviate Schema:', error)
    }
  }

  // Delete any Truto integrated accounts for this bot by tenant id
  try {
    await BulkDeleteIntegratedAccounts(teamId, botId)
  } catch (error) {
    console.warn('Error bulk deleting Truto integrated accounts:', error)
  }

  //delete all bot data from bucket
  try {
    const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
    await bucket.deleteFiles({ prefix: `teams/${teamId}/bots/${botId}` })
  } catch (error) {
    console.warn('Error deleting bot data from bucket:', error)
  }

  return true
}

export function validateBotParams(req, team, userId, isUpdate, bot) {
  const {
    name,
    description,
    privacy,
    model,
    language,
    customPrompt,
    agentPrompt,
    helpscoutPrompt,
    allowedDomains,
    color,
    icon,
    alignment,
    botIcon,
    branding,
    supportLink,
    showButtonLabel,
    labels,
    questions,
    glossary,
    rateLimitMessages,
    rateLimitSeconds,
    rateLimitIPAllowlist,
    hideSources,
    logo,
    headerAlignment,
    resetkey,
    recordIP,
    classify,
    embeddingModel,
    isAgent,
    tools,
    imageUploads,
    temperature,
    copyFrom,
    topics,
    allowOpenEndedTopics,
    widgetType,
    brandAnalysis,
  } = req.body

  let allowOpenEndedTopicsValue = allowOpenEndedTopics
  let sanitizedLabels

  if (copyFrom && !checkPlanPermission(team, 'personal', 'duplicate').allowed) {
    throw new Error('Duplicating bots is not available at your plan level.')
  }

  const botData = {}

  if (name !== undefined) {
    if (name.trim().length > 0) {
      botData.name = name.trim()
    } else {
      throw new Error('Bot name is required.')
    }
  } else if (!isUpdate) {
    throw new Error('Bot name is required.')
  }

  if (description !== undefined || !isUpdate) {
    botData.description = description ? description.trim() : ''
  }

  if (privacy !== undefined) {
    if (privacy === 'private') {
      if (!checkPlanPermission(team, 'hobby').allowed) {
        throw new Error('Private bots are not available at your plan level.')
      }
      botData.privacy = privacy
    } else {
      botData.privacy = 'public'
    }
  } else if (!isUpdate) {
    botData.privacy = 'public'
  }

  if (model !== undefined) {
    if (model.startsWith('gpt-4') && ('gpt-4o-mini' !== model && 'gpt-4.1-nano' !== model && 'gpt-4.1-mini' !== model)) {
      if (!team.supportsGPT4) {
        throw new Error('Your OpenAI account is not approved for GPT-4 models yet.')
      } else if (!checkPlanPermission(team, 'hobby').allowed && !isSuperAdmin(userId)) {
        throw new Error('GPT-4 models are not available at your plan level.')
      }
    }
    if (model.startsWith('gpt-5') && model !== 'gpt-5-mini' && model !== 'gpt-5-nano') {
      if (!team.supportsGPT4) {
        throw new Error('Your OpenAI account is not approved for GPT-5 models yet.')
      } else if (!checkPlanPermission(team, 'hobby').allowed && !isSuperAdmin(userId)) {
        throw new Error('GPT-5 models are not available at your plan level.')
      }
    }
    //check if model is valid
    const validModels = [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0613',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4-1106-preview',
      'gpt-4o',
      'gpt-4o-mini',
      'gpt-4.5-preview',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4.1',
      'gpt-5.1',
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
    ]
    if (!validModels.includes(model)) {
      throw new Error('Invalid model name.')
    }
    if (!['gpt-4o-mini', 'gpt-4.1-nano', 'gpt-4.1-mini', 'gpt-5-mini', 'gpt-5-nano'].includes(model) && !team?.openAIKey) {
      throw new Error('Please add your OpenAI API key to enable this model.')
    }
    botData.model = model
  } else if (!isUpdate) {
    const defaultModel = 'gpt-4.1-mini';
    botData.model = defaultModel
  }

  if (customPrompt !== undefined) {
    botData.customPrompt = customPrompt
  }

  if (agentPrompt !== undefined) {
    // Validate that agentPrompt contains "search_documentation" string
    if (agentPrompt && !agentPrompt.includes('search_documentation')) {
      throw new Error('Your agent prompt is missing required instructions on when and how to use the `search_documentation` tool. DocsBot cannot function correctly without them. Please start with one of our preset prompts and customize it as needed.')
    }
    
    botData.agentPrompt = agentPrompt
  } else if (!isUpdate) {
    // Set default CUSTOMER_SUPPORT agentPrompt for new bots
    const supportPrompt = PRESET_PROMPTS.CUSTOMER_SUPPORT?.prompt || ''
    botData.agentPrompt = supportPrompt
      .replace(/{company_name}/g, botData.name || 'your company')
      .replace(/{old_prompt}\n/g, '')
      .replace(/{old_prompt}/g, '')
  }

  if (helpscoutPrompt !== undefined) {
    if (helpscoutPrompt && isUpdate && helpscoutPrompt !== bot?.helpscoutPrompt && !checkPlanPermission(team, 'personal').allowed && !isSuperAdmin(userId)) {
      throw new Error(
        'Custom Help Scout prompts are not available at your plan level.',
      )
    }
    botData.helpscoutPrompt = helpscoutPrompt
  }

  if (allowedDomains !== undefined) {
    botData.allowedDomains = allowedDomains
      ? allowedDomains
          .filter((s) => s)
          .map((d) =>
            d
              .trim()
              .toLowerCase()
              .replace(/^(https?:\/\/)/, '') // Remove http:// or https://
              .replace(/\/.*$/, ''),
          ) // Remove everything from the first slash onwards
          .filter(Boolean)
      : []
  }

  if (color !== undefined) {
    botData.color = color ? (/#[0-9A-F]{6}/i.test(color) ? color : '') : ''
  }

  if (icon !== undefined) {
    const validIconOptions = [
      'default',
      'comments',
      'robot',
      'life-ring',
      'question',
      'book',
    ]
    botData.icon =
      icon && (validIconOptions.includes(icon) || icon.includes('://'))
        ? icon
        : ''
  }

  if (alignment !== undefined) {
    if (alignment === 'left' || alignment === 'right') {
      botData.alignment = alignment
    }
  }

  if (botIcon !== undefined) {
    const validBotIconOptions = [
      false,
      'comment',
      'robot',
      'life-ring',
      'info',
      'book',
    ]
    botData.botIcon =
      validBotIconOptions.includes(botIcon) || botIcon.includes('://')
        ? botIcon
        : ''
  }

  if (logo !== undefined) {
    botData.logo = logo && logo.includes('://') ? logo : false
  }

  if (headerAlignment !== undefined) {
    if (headerAlignment === 'left' || headerAlignment === 'center') {
      botData.headerAlignment = headerAlignment
    }
  }

  if (branding !== undefined) {
    if (branding === false && !checkPlanPermission(team, 'business', 'branding').allowed) {
      throw new Error('Disabling branding is not available at your plan level.')
    }
    botData.branding = !!branding
  }

  if (imageUploads !== undefined) {
    if (imageUploads && !checkPlanPermission(team, 'standard', 'screenshots').allowed) {
      throw new Error('Widget screenshot uploads are not available at your plan level.')
    }
    botData.imageUploads = !!imageUploads
  }

  if (supportLink !== undefined) {
    botData.supportLink = supportLink || ''
  }

  if (widgetType !== undefined) {
    const validWidgetTypes = ['helpscout', 'zendesk', 'freshdesk', 'intercom', 'hubspot', 'other']
    botData.widgetType = validWidgetTypes.includes(widgetType) ? widgetType : 'other'
  }

  if (brandAnalysis !== undefined) {
    // Store the brand analysis data from crawlAndExtract (includes brand colors, logos, screenshots, etc.)
    // Only save if it's an object with data
    if (brandAnalysis && typeof brandAnalysis === 'object') {
      botData.brandAnalysis = brandAnalysis
    }
  }

  if (showButtonLabel !== undefined) {
    botData.showButtonLabel = !!showButtonLabel
  }

  if (hideSources !== undefined) {
    botData.hideSources = !!hideSources
  }

  if (resetkey !== undefined || !bot?.signatureKey) {
    botData.signatureKey = crypto.randomBytes(32).toString('hex')
  }

  if (labels !== undefined) {
    const validLabels = Object.keys(i18n.en.labels)
    const incomingLabels =
      labels && typeof labels === 'object' ? { ...labels } : {}

    sanitizedLabels = {}
    Object.keys(incomingLabels).forEach((labelKey) => {
      if (validLabels.includes(labelKey)) {
        sanitizedLabels[labelKey] = incomingLabels[labelKey]
      }
    })

    botData.labels = sanitizedLabels
  }

  if (language !== undefined || !isUpdate) {
    const resolvedLanguage = language ? language : 'en'
    const languageChanged = bot?.language !== resolvedLanguage

    botData.language = resolvedLanguage

    if (languageChanged) {
      botData.labels = {
        ...i18n[resolvedLanguage].labels,
        ...(sanitizedLabels !== undefined ? sanitizedLabels : botData.labels || {}),
      }
    } else if (sanitizedLabels !== undefined) {
      const currentLabels = bot?.labels || i18n[resolvedLanguage].labels
      botData.labels = {
        ...currentLabels,
        ...sanitizedLabels,
      }
    } else if (!isUpdate && botData.labels === undefined) {
      botData.labels = i18n[resolvedLanguage].labels
    }
  }

  if (questions !== undefined) {
    botData.questions = questions || []
    if (Array.isArray(botData.questions)) {
      botData.questions = botData.questions.filter(
        (question) => question?.trim() !== '',
      )
    }
  }

  if (glossary !== undefined) {
    // Check if the team has Pro plan permissions
    if (glossary && glossary.length > 0 && !checkPlanPermission(team, 'pro', 'glossary').allowed && !isSuperAdmin(userId)) {
      throw new Error('Glossary feature is only available on the Standard plan or higher.')
    }
    
    botData.glossary = glossary || []
    
    // If the user doesn't have Pro plan and there are existing glossary entries in the bot
    // (e.g., downgraded from Pro to a lower plan), we'll clear the glossary entries
    if (bot?.glossary?.length > 0 && !checkPlanPermission(team, 'pro', 'glossary').allowed && !isSuperAdmin(userId)) {
      botData.glossary = []
    } else if (Array.isArray(botData.glossary)) {
      // Trim words and translations, convert words to lowercase
      botData.glossary = botData.glossary.map(entry => ({
        word: entry.word?.trim().toLowerCase() || '',
        translation: entry.translation?.trim() || ''
      }))
      botData.glossary = botData.glossary.filter((g) => 
        g?.word && g.word !== '' && g?.translation && g.translation !== ''
      )
      
      // Remove entries with duplicate words
      const uniqueWords = new Set()
      botData.glossary = botData.glossary.filter(entry => {
        if (uniqueWords.has(entry.word)) {
          return false
        }
        uniqueWords.add(entry.word)
        return true
      })
    }
  }

  if (
    rateLimitMessages !== undefined &&
    rateLimitMessages != bot?.rateLimitMessages &&
    rateLimitMessages != 10 &&
    !checkPlanPermission(team, 'business').allowed &&
    !isSuperAdmin(userId)
  ) {
    throw new Error('Rate limiting is not available at your plan level.')
  }
  if (rateLimitMessages !== undefined) {
    botData.rateLimitMessages = rateLimitMessages
      ? parseInt(rateLimitMessages)
      : 10
  }

  if (
    rateLimitSeconds !== undefined &&
    rateLimitSeconds != bot?.rateLimitSeconds &&
    rateLimitSeconds != 60 &&
    !checkPlanPermission(team, 'business').allowed &&
    !isSuperAdmin(userId)
  ) {
    throw new Error('Rate limiting is not available at your plan level.')
  }
  if (rateLimitSeconds !== undefined) {
    botData.rateLimitSeconds = rateLimitSeconds
      ? parseInt(rateLimitSeconds)
      : 60
  }

  if (rateLimitIPAllowlist !== undefined) {
    botData.rateLimitIPAllowlist = rateLimitIPAllowlist
      ? rateLimitIPAllowlist
          .map((ip) => ip.trim())
          .filter((ip) => {
            return (
              ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/) ||
              ip.match(/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)
            )
          })
      : []
  }

  if (recordIP !== undefined) {
    if (checkPlanPermission(team, 'business').allowed || isSuperAdmin(userId)) {
      botData.recordIP = Boolean(recordIP)
    } else if (recordIP && bot?.recordIP !== true) {
      throw new Error('Recording IPs is not available at your plan level.')
    } else {
      botData.recordIP = false
    }
  }

  if (classify !== undefined) {
    botData.classify = Boolean(classify)
  }

  if (temperature !== undefined) {
    // Validate temperature is between 0 and 1
    const temp = parseFloat(temperature)
    if (isNaN(temp) || temp < 0 || temp > 1) {
      throw new Error('Temperature must be a number between 0 and 1.')
    }
    botData.temperature = temp
  } else if (!isUpdate) {
    botData.temperature = 0 // Default to 0 for most precise responses
  }

  if (isAgent !== undefined) {
    botData.isAgent = Boolean(isAgent)
    if (isAgent && !bot?.agentPrompt && !agentPrompt) {
      throw new Error('Please set your agent instructions before enabling agent mode.')
    }
  } else if (!isUpdate) {
    botData.isAgent = true
  }

  if (tools !== undefined) {
    // tools is an object, keyed by tool name with enabled boolean
    // e.g. { "human_escalation": { "enabled": true }, "followup_rating": { "enabled": true } }
    // Verify the tools schema before assigning
    const validTools = {};
    for (const [toolName, toolConfig] of Object.entries(tools)) {
      if (typeof toolConfig === 'object' && toolConfig !== null && 'enabled' in toolConfig) {
        validTools[toolName] = {
          enabled: Boolean(toolConfig.enabled),
          ...toolConfig
        };
      } else {
        throw new Error(`Invalid tool configuration for "${toolName}". Each tool must be an object with at least an "enabled" boolean property.`);
      }
    }
    botData.tools = validTools;
  } else if (!isUpdate) {
    botData.tools = {
      human_escalation: { enabled: true },
      followup_rating: { enabled: true },
    }
  }

  if (!isUpdate) { //Only can set embedding model on new bots
    const embeddingModelWhitelist = ['text-embedding-ada-002', 'text-embedding-3-large', 'embed-multilingual-v3.0', 'text-embedding-3-small', 'embed-v4.0'];
    if (embeddingModel !== undefined && !embeddingModelWhitelist.includes(embeddingModel)) {
      throw new Error('The specified embedding model is not allowed. Please choose from the following: ' + embeddingModelWhitelist.join(', '));
    }
    if (team.AzureDeploymentBase) {
      botData.embeddingModel = embeddingModel || 'text-embedding-ada-002'
    } else if (checkPlanPermission(team, 'hobby').allowed) {
      if (botData.language === 'en') {
        botData.embeddingModel = embeddingModel || 'text-embedding-3-large'
      } else {
        botData.embeddingModel = embeddingModel || 'embed-v4.0'
      }
    } else {
      botData.embeddingModel = 'text-embedding-3-small'
    }
  }

  // Handle topics array
  if (topics !== undefined) {
    // Check if the team has Business plan permissions for topic management
    // Skip validation when copying a bot
    if (!copyFrom && !checkPlanPermission(team, 'business', 'topics').allowed && !isSuperAdmin(userId)) {
      throw new Error('Topic management is only available on the Business plan or higher. Please upgrade your plan to use this feature.')
    }
    
    if (Array.isArray(topics)) {
      // Validate and sanitize topics
      const validTopics = topics
        .filter(topic => typeof topic === 'string' && topic.trim().length > 0)
        .map(topic => topic.trim())
        // Remove duplicates
        .filter((topic, index, arr) => arr.indexOf(topic) === index)

      if (validTopics.length > TOPIC_LIMIT) {
        throw new Error(`You can only have up to ${TOPIC_LIMIT} topics.`)
      }

      if (validTopics.length === TOPIC_LIMIT) {
        allowOpenEndedTopicsValue = false
      }

      botData.topics = validTopics
    } else {
      throw new Error('Topics must be an array of strings.')
    }
  } else if (!isUpdate) {
    botData.topics = []
  }

  // Handle allowOpenEndedTopics boolean
  if (allowOpenEndedTopicsValue !== undefined) {
    // Check if the team has Business plan permissions for topic management
    // Skip validation when copying a bot
    if (!copyFrom && !checkPlanPermission(team, 'business', 'topics').allowed && !isSuperAdmin(userId)) {
      throw new Error('Topic management is only available on the Business plan or higher. Please upgrade your plan to use this feature.')
    }

    botData.allowOpenEndedTopics = Boolean(allowOpenEndedTopicsValue)
  } else if (!isUpdate) {
    botData.allowOpenEndedTopics = true // Default to true
  }

  return botData
}

export async function clearLastError(team) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // if the team doesn't have a lasterror, ignore!
  if (!team?.lastError) return

  await firestore.collection('teams').doc(team.id).update({
    lastError: FieldValue.delete(),
  })
}
