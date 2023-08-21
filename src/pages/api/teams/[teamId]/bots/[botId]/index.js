import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { stripePlan, isSuperAdmin } from '@/utils/helpers'
import { i18n } from '@/constants/strings.constants'
import { deleteBot } from '@/lib/apiFunctions'
import e from 'cors'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'PUT') {
    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        return res.status(404).json({ message: 'Bot not found' })
      }

      let {
        name,
        description,
        customPrompt,
        privacy,
        language,
        model,
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
        hideSources,
        logo,
        headerAlignment,
      } = req.body
      const botData = {}

      if (name) {
        botData.name = name.trim()
      }

      if (description) {
        botData.description = description.trim()
      }

      if (privacy) {
        if (privacy !== 'public' && privacy !== 'private') {
          return res.status(400).send({ message: 'Invalid param "privacy".' })
        } else {
          if (privacy === 'private' && stripePlan(team).name === 'Free' && !isSuperAdmin(userId)) {
            return res.status(402).json({
              message: 'Private bots are not available at your plan level.',
            })
          }

          botData.privacy = privacy
        }
      }

      if (model) {
        if (model !== 'gpt-3.5-turbo' && model !== 'gpt-4') {
          return res.status(400).send({ message: 'Invalid param "model".' })
        } else if (!team.supportsGPT4 && model === 'gpt-4') {
          return res
            .status(400)
            .send({ message: 'Your OpenAI account is not approved for GPT-4 yet.' })
        } else {
          if ('gpt-4' === model && stripePlan(team).name === 'Free' && !isSuperAdmin(userId)) {
            return res.status(402).json({
              message: 'GPT-4 is not available at your plan level.',
            })
          }

          botData.model = model
        }
      }

      if (customPrompt !== undefined) {
        //if setting not empty
        if (customPrompt) {
          //check if their plan allows custom prompts
          if (stripePlan(team).bots < 10 && !isSuperAdmin(userId)) {
            return res.status(402).json({
              message: 'Custom prompts are not available at your plan level.',
            })
          }

          //track custom prompt
          try {
            bentoTrack(userId, 'track', {
              type: 'addCustomPrompt',
              botName: bot.name,
            })
          } catch (e) {
            console.log('Error sending bento track', e)
          }
        }

        botData.customPrompt = customPrompt
      }

      if (language) {
        if (!i18n[language]) {
          return res.status(400).send({
            message: 'Invalid param "language". Should be one of: ' + Object.keys(i18n).join(', '),
          })
        } else {
          // reset our labels
          if (bot.language !== language) {
            botData.labels = i18n[language].labels
          }

          botData.language = language
        }
      }

      if (allowedDomains) {
        //check if allowedDomains is valid, array of strings, remove any empty strings
        botData.allowedDomains = allowedDomains.filter((s) => s).map((d) => d.trim().toLowerCase())
        //make sure they are valid hostnames
        botData.allowedDomains = botData.allowedDomains.filter((d) => {
          try {
            new URL(`https://${d}`)
            return true
          } catch (error) {
            return false
          }
        })
        //strip out any paths or ports
        botData.allowedDomains = botData.allowedDomains.map((d) => {
          try {
            return new URL(`https://${d}`).hostname
          } catch (error) {
            return d
          }
        })
      }

      if (color) {
        //check if color is valid hex
        const validHex = /^#[0-9A-F]{6}$/i.test(color)
        if (!validHex) {
          return res.status(400).send({ message: 'Invalid param "color".' })
        } else {
          botData.color = color
        }
      }

      if (icon) {
        //check if icon is valid
        const validIcon = ['default', 'comments', 'robot', 'life-ring', 'question', 'book']
        if (!validIcon.includes(icon) && !icon.includes('://')) {
          return res.status(400).send({ message: 'Invalid param "icon".' })
        } else {
          botData.icon = icon
        }
      }

      if (alignment) {
        //check if icon is valid
        const valid = ['left', 'right']
        if (!valid.includes(alignment)) {
          return res
            .status(400)
            .send({ message: 'Invalid param "alignment". Should be "left" or "right".' })
        } else {
          botData.alignment = alignment
        }
      }

      if (botIcon !== undefined) {
        //check if icon is valid
        const validIcon = [false, 'comment', 'robot', 'life-ring', 'info', 'book']
        if (!validIcon.includes(botIcon) && !botIcon.includes('://')) {
          return res.status(400).send({ message: 'Invalid param "botIcon".' })
        } else {
          botData.botIcon = botIcon
        }
      }

      if (logo !== undefined) {
        //check if logo is valid
        if (logo.includes('://')) {
          botData.logo = logo
        } else {
          botData.logo = false
        }
      }

      if (headerAlignment !== undefined) {
        //check if icon is valid
        const valid = ['left', 'center']
        if (!valid.includes(headerAlignment)) {
          return res
            .status(400)
            .send({ message: 'Invalid param "headerAlignment". Should be "left" or "center".' })
        } else {
          botData.headerAlignment = headerAlignment
        }
      }

      if (branding !== undefined) {
        //check if branding is valid
        if (branding === false && stripePlan(team).bots < 10) {
          return res.status(402).json({
            message: 'Disabling branding is not available at your plan level.',
          })
        }
        botData.branding = !!branding
      }

      if (supportLink !== undefined) {
        //check if support link is valid
        botData.supportLink = supportLink
      }

      if (showButtonLabel !== undefined) {
        botData.showButtonLabel = !!showButtonLabel
      }

      if (hideSources !== undefined) {
        botData.hideSources = !!hideSources
      }

      if (labels) {
        // Check that all labels are present in i18n.en.labels
        const validLabels = Object.keys(i18n.en.labels)
        const labelsKeys = Object.keys(labels)
        const invalidLabels = labelsKeys.filter((label) => !validLabels.includes(label))

        if (invalidLabels.length > 0) {
          return res.status(400).send({
            message: `Invalid labels: ${invalidLabels.join(', ')}. Valid labels: ${validLabels.join(
              ', '
            )}`,
          })
        }

        // Check for missing labels
        const missingLabels = validLabels.filter((label) => !labelsKeys.includes(label))
        if (missingLabels.length > 0) {
          // return res.status(400).send({
          //   message: `Missing labels: ${missingLabels.join(', ')}. These labels must be set: ${validLabels.join(', ')}`,
          // });
          // populate the missing labels with the default values
          missingLabels.forEach((label) => {
            labels[label] = bot?.labels[label] || i18n[language || bot.language].labels[label]
          })
        }
        botData.labels = labels
      }

      if (questions !== undefined) {
        //check if questions is valid, array of strings, remove any empty strings
        botData.questions = questions.filter((q) => q !== '')
      }

      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).update(botData)

      return res.status(200).json(await getBot(team.id, botId))
    } catch (error) {
      console.warn('Error:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'DELETE') {
    try {
      await deleteBot(team.id, botId)

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBot',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Bot deleted' })
    } catch (error) {
      console.warn('Error deleting bot:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    try {
      const bot = await getBot(team.id, botId)
      if (bot) {
        return res.json(bot)
      } else {
        // doc.data() will be undefined in this case
        return res.status(404).json({ message: "botId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
