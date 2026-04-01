import { getBot, getTeam } from '@/lib/dbQueries'
import Cors from 'cors'
import { i18n } from '@/constants/strings.constants'
import { checkPlanPermission, getCustomButtonsSlotLimit } from '@/utils/helpers'
import {
  limitLeadCollectToDefaultFields,
  sanitizeLeadCollectOptions,
} from '@/lib/leadCollect'
import { getEnabledCustomButtons } from '@/lib/botActions'
import {
  DEFAULT_WEB_SEARCH_MODEL,
  isWebSearchCompatibleModel,
} from '@/lib/webSearch'

// Initializing the cors middleware
// You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
const cors = Cors({
  methods: ['GET'],
})

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result)
      }

      return resolve(result)
    })
  })
}

const getToolEnabled = (toolConfig, defaultEnabled = true) => {
  if (typeof toolConfig === 'boolean') {
    return toolConfig
  }

  if (toolConfig && typeof toolConfig === 'object') {
    if (toolConfig.enabled === undefined) {
      return defaultEnabled
    }
    return Boolean(toolConfig.enabled)
  }

  return defaultEnabled
}

const getSchedulingToolValue = (toolConfig) => {
  if (!toolConfig || typeof toolConfig !== 'object') {
    return false
  }

  const enabled =
    toolConfig.enabled === undefined ? true : Boolean(toolConfig.enabled)
  const rawValue = typeof toolConfig.url === 'string' ? toolConfig.url.trim() : ''

  return enabled && Boolean(rawValue)
}

/** Widget JSON only: DB still uses `jp` for Japanese; expose ISO 639-1 `ja`. */
function widgetJsonLanguageCode(language) {
  const raw = language || 'en'
  return String(raw).toLowerCase() === 'jp' ? 'ja' : raw
}

export default async function handler(req, res) {
  // Run the middleware
  await runMiddleware(req, res, cors)
  const { teamId, botId } = req.query

  /*
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=300, stale-while-revalidate=359'
  )
  */

  if (req.method === 'GET') {
    try {
      const team = await getTeam(teamId)
      if (!team) {
        return res.status(404).json({ message: "Team not found." })
      }

      const bot = await getBot(teamId, botId)
      if (bot) {
        if (bot.status !== 'ready') {
          return res.status(409).json({ message: 'Bot is not ready.' })
        }

        const schedulingPlanAllowed = checkPlanPermission(
          team,
          'personal',
          'bookingActions',
        ).allowed
        const webSearchAllowed =
          checkPlanPermission(team, 'standard').allowed &&
          Boolean(team?.openAIKey) &&
          isWebSearchCompatibleModel(bot?.model || DEFAULT_WEB_SEARCH_MODEL)
        const customButtonsPlanAllowed = getCustomButtonsSlotLimit(team) > 0
        const enabledCustomButtonCount = customButtonsPlanAllowed
          ? getEnabledCustomButtons(bot.tools?.customButtons).length
          : 0

        const widget = {
          botId: botId,
          teamId: teamId,
          botName: bot.name,
          description: bot.description,
          language: widgetJsonLanguageCode(bot.language),
          allowedDomains: bot.allowedDomains || [],
          color: bot.color || '#1292EE',
          icon: bot.icon || 'default',
          alignment: bot.alignment || 'right',
          botIcon: bot.botIcon || false,
          branding: bot.branding === false && checkPlanPermission(team, 'business', 'branding').allowed ? false : true,
          supportLink: bot.supportLink || false,
          showButtonLabel: bot.showButtonLabel || false,
          showCopyButton: bot.showCopyButton || false,
          linkSafetyEnabled: bot.linkSafetyEnabled === true,
          keepFooterVisible: bot.keepFooterVisible === true,
          labels: bot.labels || i18n[bot.language]?.labels || i18n.en.labels,
          questions: bot.questions || [],
          hideSources: bot.hideSources || false,
          logo: bot.logo || false,
          headerAlignment: bot.headerAlignment || 'center',
          isAgent: bot.isAgent || false,
          useEscalation: getToolEnabled(bot.tools?.human_escalation, true),
          useFeedback: getToolEnabled(bot.tools?.followup_rating, true),
          useWebSearch:
            (bot.isAgent || false) &&
            webSearchAllowed &&
            getToolEnabled(bot.tools?.web_search, false),
          useCalendly: schedulingPlanAllowed && getSchedulingToolValue(bot.tools?.calendly),
          useCalCom: schedulingPlanAllowed && getSchedulingToolValue(bot.tools?.calcom),
          useTidyCal: schedulingPlanAllowed && getSchedulingToolValue(bot.tools?.tidycal),
          useCustomButtons: enabledCustomButtonCount > 0,
          useImageUpload: ((bot.imageUploads === undefined || bot.imageUploads) && checkPlanPermission(team, 'standard', 'imageUploads').allowed && bot.isAgent) || false,
          leadCollect: false,
        }

        const leadCollectPlan = checkPlanPermission(team, 'personal', 'leadCollect')
        const leadCollectFieldsPlan = checkPlanPermission(
          team,
          'standard',
          'leadCollectFields',
        )

        if (leadCollectPlan.allowed) {
          try {
            const sanitizedLeadCollect = sanitizeLeadCollectOptions(bot.leadCollect)

            if (sanitizedLeadCollect?.enabled === false) {
              widget.leadCollect = false
            } else if (!leadCollectFieldsPlan.allowed) {
              const limitedLeadCollect = limitLeadCollectToDefaultFields(
                sanitizedLeadCollect,
              )
              widget.leadCollect =
                Array.isArray(limitedLeadCollect?.fields) &&
                limitedLeadCollect.fields.length > 0
                  ? limitedLeadCollect
                  : false
            } else {
              widget.leadCollect = sanitizedLeadCollect
            }
          } catch (error) {
            widget.leadCollect = false
          }
        }

        //temp fix for feedbackYes
        if (bot.language === 'en' && widget.labels.feedbackYes === 'YES') {
          widget.labels.feedbackYes = 'Yes'
        }

        return res.json(widget)
      } else {
        return res.status(404).json({ message: "Bot not found." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
