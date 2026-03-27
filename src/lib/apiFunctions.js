import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldPath, FieldValue } from 'firebase-admin/firestore'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import { getBot, getTeam } from '@/lib/dbQueries'
import { deleteTenant } from '@/lib/weaviate'
import { deleteTurbopufferNamespace } from '@/lib/turbopuffer'
import { QueueSourceExpel } from '@/lib/service'
import { isSuperAdmin, checkPlanPermission } from '@/utils/helpers'
import { i18n } from '@/constants/strings.constants'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import crypto from 'crypto'
import { DeleteIntegratedAccount, BulkDeleteIntegratedAccounts } from '@/lib/truto'
import { isTrutoSourceType } from '@/constants/sourceTypes.constants'
import {
  getLeadCollectExtraFields,
  isLeadCollectEnabled,
  sanitizeLeadCollectOptions,
} from '@/lib/leadCollect'
import { getBotIdFromChannelMapping, getValidChannelEntries } from '@/lib/slackHelpers'
import { OBSOLETE_STRIPE_TOOL_METADATA_KEYS } from '@/lib/stripeConnect'
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
  // Delete all leads for bot
  const leadsSnapshot = await firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(botId)
    .collection('leads')
    .select(FieldPath.documentId())
    .get()

  toDelete = []
  leadsSnapshot.forEach(function (doc) {
    toDelete.push(doc.ref)
  })

  counter = 0
  let leadsBatch = firestore.batch()
  for (let i = 0; i < toDelete.length; i++) {
    leadsBatch.delete(toDelete[i])
    counter++
    if (counter % 50 === 0) {
      await leadsBatch.commit()
      leadsBatch = firestore.batch()
    }
  }
  await leadsBatch.commit()

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

  // If bot is default or in channel map for any Slack workspace, update workspace config
  const integrationRef = firestore.collection('teams').doc(teamId).collection('integrations').doc('slack')
  const integrationDoc = await integrationRef.get()
  const slackData = integrationDoc.data() || {}
  const workspaces = slackData.workspaces || {}
  let slackUpdated = false
  const updates = {}
  for (const [slackTeamId, ws] of Object.entries(workspaces)) {
    if (!ws || typeof ws !== 'object') continue
    let changed = false
    const next = { ...ws }
    if (ws.defaultBotId === botId) {
      const validEntries = getValidChannelEntries(ws.channelBotMap || {})
      const otherBotIds = validEntries
        .map(([, m]) => getBotIdFromChannelMapping(m))
        .filter((id) => id && id !== botId)
      next.defaultBotId = otherBotIds[0] || null
      if (!next.defaultBotId) delete next.defaultBotId
      changed = true
    }
    const validEntries = getValidChannelEntries(ws.channelBotMap || {})
    const hasBotInChannels = validEntries.some(([, m]) => getBotIdFromChannelMapping(m) === botId)
    if (ws.channelBotMap && hasBotInChannels) {
      const remaining = validEntries.filter(([, m]) => getBotIdFromChannelMapping(m) !== botId)
      next.channelBotMap = remaining.length > 0 ? Object.fromEntries(remaining) : null
      if (!next.channelBotMap) delete next.channelBotMap
      changed = true
    }
    if (changed) {
      updates[slackTeamId] = next
      slackUpdated = true
    }
  }
  if (slackUpdated) {
    await integrationRef.set({ workspaces: { ...workspaces, ...updates } }, { merge: true })
  }

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

  // Clean up vector DB: Turbopuffer namespace or Weaviate tenant
  if (bot.vectorDatabase === 'turbopuffer') {
    try {
      await deleteTurbopufferNamespace(teamId, botId, bot.region || 'US')
    } catch (error) {
      console.warn('Error deleting Turbopuffer namespace:', error)
    }
  } else if (bot.indexId === 'TenantDocument') {
    try {
      deleteTenant(team, botId)
    } catch (error) {
      console.warn('Error deleting Weaviate Tenant:', error)
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

export async function validateBotParams(req, team, userId, isUpdate, bot) {
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
    showCopyButton,
    linkSafetyEnabled,
    keepFooterVisible,
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
    embeddingModel,
    isAgent,
    tools,
    leadCollect,
    imageUploads,
    temperature,
    copyFrom,
    topics,
    allowOpenEndedTopics,
    widgetType,
    brandAnalysis,
    searchDocumentationLimit,
    vectorDatabase,
    region,
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
    if (model.startsWith('gpt-5')) {
      const isFullGPT5Model =
        model !== 'gpt-5-mini' &&
        model !== 'gpt-5-nano' &&
        model !== 'gpt-5.4-mini' &&
        model !== 'gpt-5.4-nano'
      if (isFullGPT5Model && !checkPlanPermission(team, 'personal').allowed && !isSuperAdmin(userId)) {
        throw new Error('GPT-5 models are not available at your plan level.')
      }
      if (isFullGPT5Model) {
        if (!team.supportsGPT4) {
          throw new Error('Your OpenAI account is not approved for GPT-5 models yet.')
        } else if (!checkPlanPermission(team, 'hobby').allowed && !isSuperAdmin(userId)) {
          throw new Error('GPT-5 models are not available at your plan level.')
        }
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
      'gpt-5.4',
      'gpt-5.4-mini',
      'gpt-5.4-nano',
      'gpt-5.2',
      'gpt-5.1',
      'gpt-5',
      'gpt-5-mini',
      'gpt-5-nano',
    ]
    if (!validModels.includes(model)) {
      throw new Error('Invalid model name.')
    }
    if (
      ![
        'gpt-4o-mini',
        'gpt-4.1-nano',
        'gpt-4.1-mini',
        'gpt-5-mini',
        'gpt-5-nano',
        'gpt-5.4-nano',
      ].includes(model) &&
      !team?.openAIKey
    ) {
      throw new Error('Please add your OpenAI API key to enable this model.')
    }
    botData.model = model
  } else if (!isUpdate) {
    const defaultModel = 'gpt-5.4-nano'
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
    // Trim whitespace to check if prompt is effectively empty
    const trimmedPrompt = typeof helpscoutPrompt === 'string' ? helpscoutPrompt.trim() : helpscoutPrompt
    
    if (trimmedPrompt && isUpdate && trimmedPrompt !== bot?.helpscoutPrompt && !checkPlanPermission(team, 'personal').allowed && !isSuperAdmin(userId)) {
      throw new Error(
        'Custom Help Scout prompts are not available at your plan level.',
      )
    }
    // Validate that helpscoutPrompt is not empty and contains "search_documentation" string
    if (!trimmedPrompt || trimmedPrompt.length === 0) {
      throw new Error('Help Scout prompt cannot be empty. Use our recommended template as a starting point.')
    }
    if (!trimmedPrompt.includes('search_documentation')) {
      throw new Error('Your Help Scout prompt is missing required instructions on when and how to use the `search_documentation` tool. DocsBot cannot function correctly without them. Please start with our template prompt and customize it as needed.')
    }
    botData.helpscoutPrompt = trimmedPrompt
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

  if (showCopyButton !== undefined) {
    botData.showCopyButton = !!showCopyButton
  } else if (!isUpdate && bot?.showCopyButton === undefined) {
    botData.showCopyButton = false
  }

  if (linkSafetyEnabled !== undefined) {
    botData.linkSafetyEnabled = !!linkSafetyEnabled
  } else if (!isUpdate && bot?.linkSafetyEnabled === undefined) {
    botData.linkSafetyEnabled = false
  }

  if (keepFooterVisible !== undefined) {
    botData.keepFooterVisible = !!keepFooterVisible
  } else if (!isUpdate && bot?.keepFooterVisible === undefined) {
    botData.keepFooterVisible = false
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
      // Use only the new language's labels; incoming labels are from the old language
      botData.labels = { ...i18n[resolvedLanguage].labels }
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
    const normalizeGlossary = (entries = []) => {
      if (!Array.isArray(entries)) return []

      const normalizedEntries = entries
        .map((entry) => ({
          word: entry.word?.trim().toLowerCase() || '',
          translation: entry.translation?.trim() || '',
        }))
        .filter(
          (entry) =>
            entry?.word &&
            entry.word !== '' &&
            entry?.translation &&
            entry.translation !== '',
        )

      const uniqueWords = new Set()
      return normalizedEntries.filter((entry) => {
        if (uniqueWords.has(entry.word)) {
          return false
        }
        uniqueWords.add(entry.word)
        return true
      })
    }

    const hasGlossaryAccess =
      checkPlanPermission(team, 'pro', 'glossary').allowed || isSuperAdmin(userId)
    const normalizedIncomingGlossary = normalizeGlossary(glossary)
    const normalizedExistingGlossary = normalizeGlossary(bot?.glossary)
    const glossaryChanged =
      JSON.stringify(normalizedIncomingGlossary) !==
      JSON.stringify(normalizedExistingGlossary)

    // Only enforce plan restrictions when glossary data is actually changing.
    if (
      glossaryChanged &&
      normalizedIncomingGlossary.length > 0 &&
      !hasGlossaryAccess
    ) {
      throw new Error('Glossary feature is only available on the Standard plan or higher.')
    }

    if (glossaryChanged) {
      botData.glossary = normalizedIncomingGlossary
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

  // Classify is now always enabled for all bots.
  botData.classify = true

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

  if (searchDocumentationLimit !== undefined) {
    // Validate searchDocumentationLimit is between 1 and 4
    const limit = parseInt(searchDocumentationLimit)
    if (isNaN(limit) || limit < 1 || limit > 4) {
      throw new Error('searchDocumentationLimit must be a number between 1 and 4.')
    }
    botData.searchDocumentationLimit = limit
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
    // e.g. { "human_escalation": { "enabled": true }, "followup_rating": false, "stripe": { ... } }
    const validTools = {}
    for (const [toolName, toolConfig] of Object.entries(tools)) {
      if (toolName === 'stripe') {
        continue
      }
      if (typeof toolConfig === 'boolean') {
        validTools[toolName] = toolConfig
      } else if (typeof toolConfig === 'object' && toolConfig !== null) {
        if (!('enabled' in toolConfig)) {
          validTools[toolName] = { ...toolConfig }
          continue
        }
        validTools[toolName] = {
          enabled: Boolean(toolConfig.enabled),
          ...toolConfig,
        }
      } else {
        throw new Error(
          `Invalid tool configuration for "${toolName}". Each tool must be a boolean or an object.`,
        )
      }
    }

    if (tools.stripe && typeof tools.stripe === 'object' && isSuperAdmin(userId)) {
      const stripeEnabled = tools.stripe.enabled === true

      const existingStripe = bot?.tools?.stripe || {}
      const incoming = tools.stripe
      const clearOAuth = incoming.clearOAuthConnection === true

      const {
        accessToken: _ignoreAt,
        refreshToken: _ignoreRt,
        stripeUserId: _ignoreSuid,
        oauthStateHash: _ignoreOh,
        oauthStateExpiresAt: _ignoreOe,
        clearOAuthConnection: _ignoreClear,
        secretKey: _ignoreSk,
        secretKeyObfuscated: _ignoreSko,
        ...stripeFromClient
      } = incoming

      let mergedStripe = {
        ...existingStripe,
        ...stripeFromClient,
      }

      if (clearOAuth) {
        mergedStripe = { ...mergedStripe }
        const dropKeys = [
          'accessToken',
          'refreshToken',
          'stripeUserId',
          'stripeAccountDisplayName',
          'scope',
          'tokenType',
          'livemode',
          'connectedAt',
          'updatedAt',
          'oauthScopes',
          'oauthStateHash',
          'oauthStateExpiresAt',
          'oauthScope',
          'oauthUpdatedBy',
          'oauthUpdatedAt',
        ]
        for (const k of dropKeys) {
          delete mergedStripe[k]
        }
      } else {
        const serverOnlyKeys = [
          'accessToken',
          'refreshToken',
          'stripeUserId',
          'oauthStateHash',
          'oauthStateExpiresAt',
        ]
        for (const key of serverOnlyKeys) {
          if (Object.prototype.hasOwnProperty.call(existingStripe, key)) {
            mergedStripe[key] = existingStripe[key]
          } else {
            delete mergedStripe[key]
          }
        }
      }

      for (const k of OBSOLETE_STRIPE_TOOL_METADATA_KEYS) {
        delete mergedStripe[k]
      }

      delete mergedStripe.clearOAuthConnection
      delete mergedStripe.secretKey
      delete mergedStripe.secretKeyObfuscated

      if (stripeEnabled) {
        const tok =
          typeof mergedStripe.accessToken === 'string'
            ? mergedStripe.accessToken.trim()
            : ''
        if (!tok) {
          throw new Error(
            'Stripe tools are enabled but this bot is not connected. Use Connect with Stripe, then save, or disable Stripe tools.',
          )
        }
      }

      validTools.stripe = mergedStripe
    }

    if (
      !isSuperAdmin(userId) &&
      bot?.tools?.stripe &&
      typeof bot.tools.stripe === 'object'
    ) {
      validTools.stripe = structuredClone(bot.tools.stripe)
    }

    botData.tools = validTools
  } else if (!isUpdate) {
    botData.tools = {
      human_escalation: { enabled: true },
      followup_rating: { enabled: true },
    }
  }

  if (leadCollect !== undefined) {
    if (!leadCollect) {
      botData.leadCollect = false
    } else {
      let sanitizedLeadCollect
      try {
        sanitizedLeadCollect = sanitizeLeadCollectOptions(leadCollect)
      } catch (error) {
        throw new Error(`Invalid lead collection settings. ${error.message}`)
      }
      const leadCollectEnabled = isLeadCollectEnabled(sanitizedLeadCollect)

      if (
        leadCollectEnabled &&
        !checkPlanPermission(team, 'personal', 'leadCollect').allowed &&
        !isSuperAdmin(userId)
      ) {
        throw new Error(
          'Lead collection is only available on the Personal plan or higher.',
        )
      }

      let existingLeadCollect = false
      try {
        existingLeadCollect = sanitizeLeadCollectOptions(bot?.leadCollect)
      } catch (error) {
        existingLeadCollect = false
      }

      if (leadCollectEnabled) {
        const incomingExtraFields = getLeadCollectExtraFields(sanitizedLeadCollect)
        const existingExtraFields = getLeadCollectExtraFields(existingLeadCollect)

        if (
          incomingExtraFields.length > existingExtraFields.length &&
          !checkPlanPermission(team, 'standard', 'leadCollectFields').allowed &&
          !isSuperAdmin(userId)
        ) {
          throw new Error(
            'Adding lead fields beyond Name and Email is only available on the Standard plan or higher.',
          )
        }
        const { enabled, ...persistedLeadCollect } = sanitizedLeadCollect
        botData.leadCollect = persistedLeadCollect
      } else {
        botData.leadCollect = false
      }
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
    const hasTopicPermission = checkPlanPermission(team, 'business', 'topics').allowed
    const isDeletionOnly =
      !copyFrom &&
      !hasTopicPermission &&
      !isSuperAdmin(userId) &&
      Array.isArray(topics) &&
      Array.isArray(bot?.topics) &&
      topics.length <= bot.topics.length &&
      topics.every((t) => bot.topics.includes(t))

    // Check if the team has Business plan permissions for topic management
    // Skip validation when copying a bot or when only deleting topics (allowed on all plans)
    if (!copyFrom && !hasTopicPermission && !isSuperAdmin(userId) && !isDeletionOnly) {
      throw new Error('Topic management is only available on the Business plan or higher. Please upgrade your plan to use this feature.')
    }

    if (Array.isArray(topics)) {
      // Validate and sanitize topics
      let validTopics = topics
        .filter(topic => typeof topic === 'string' && topic.trim().length > 0)
        .map(topic => topic.trim())
        // Remove duplicates
        .filter((topic, index, arr) => arr.indexOf(topic) === index)

      // When copying a bot, truncate to TOPIC_LIMIT instead of failing
      if (validTopics.length > TOPIC_LIMIT) {
        if (copyFrom) {
          validTopics = validTopics.slice(0, TOPIC_LIMIT)
        } else {
          throw new Error(`You can only have up to ${TOPIC_LIMIT} topics.`)
        }
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

  if (vectorDatabase !== undefined) {
    if (!['turbopuffer', 'weaviate'].includes(vectorDatabase)) {
      throw new Error('vectorDatabase must be "turbopuffer" or "weaviate".')
    }
    botData.vectorDatabase = vectorDatabase
  }

  if (region !== undefined) {
    const normalized = String(region).toUpperCase()
    if (!['US', 'EU'].includes(normalized)) {
      throw new Error('region must be "US" or "EU".')
    }
    botData.region = normalized
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
