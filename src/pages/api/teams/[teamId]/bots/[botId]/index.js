import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'
import { deleteSchema } from '@/lib/weaviate'
import { stripePlan, isSuperAdmin } from '@/utils/helpers'
import { i18n } from '@/constants/strings.constants'

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
        const languages = ['en', 'jp']
        if (!languages.includes(language)) {
          return res.status(400).send({ message: 'Invalid param "language".' })
        } else {
          botData.language = language

          // reset our labels
          botData.labels = i18n[language].labels
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
        if (!validIcon.includes(icon)) {
          return res.status(400).send({ message: 'Invalid param "icon".' })
        } else {
          botData.icon = icon
        }
      }

      if (alignment) {
        //check if icon is valid
        const valid = ['left', 'right']
        if (!valid.includes(alignment)) {
          return res.status(400).send({ message: 'Invalid param "alignment". Should be "left" or "right".' })
        } else {
          botData.alignment = alignment
        }
      }

      if (botIcon !== undefined) {
        //check if icon is valid
        const validIcon = [false, 'comment', 'robot', 'life-ring', 'info', 'book']
        if (!validIcon.includes(botIcon)) {
          return res.status(400).send({ message: 'Invalid param "botIcon".' })
        } else {
          botData.botIcon = botIcon
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

      if (labels) {
        // Check that all labels are present in i18n.en.labels
        const validLabels = Object.keys(i18n.en.labels);
        const labelsKeys = Object.keys(labels);
        const invalidLabels = labelsKeys.filter((label) => !validLabels.includes(label));

        if (invalidLabels.length > 0) {
          return res.status(400).send({
            message: `Invalid labels: ${invalidLabels.join(', ')}. Valid labels: ${validLabels.join(', ')}`,
          });
        }

        // Check for missing labels
        const missingLabels = validLabels.filter((label) => !labelsKeys.includes(label));
        if (missingLabels.length > 0) {
          // return res.status(400).send({
          //   message: `Missing labels: ${missingLabels.join(', ')}. These labels must be set: ${validLabels.join(', ')}`,
          // });
          // populate the missing labels with the default values
          missingLabels.forEach((label) => {
            labels[label] = i18n[language || bot.language].labels[label];
          });
        }
      
        botData.labels = labels;
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
    const bot = await getBot(team.id, botId)

    //delete bot from db
    try {
      // Delete all sources for bot
      const querySnapshot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('sources')
        .get()
      // Once we get the results, begin a batch
      const batch = firestore.batch()
      querySnapshot.forEach(function (doc) {
        // For each doc, add a delete operation to the batch
        batch.delete(doc.ref)
      })
      // Commit the batch
      await batch.commit()

      // Delete all questions for bot
      const questionsSnapshot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bots')
        .doc(botId)
        .collection('questions')
        .get()
      // Once we get the results, begin a batch
      const questionsBatch = firestore.batch()
      questionsSnapshot.forEach(function (doc) {
        // For each doc, add a delete operation to the batch
        questionsBatch.delete(doc.ref)
      })
      // Commit the batch
      await questionsBatch.commit()

      //delete bot
      await firestore.collection('teams').doc(team.id).collection('bots').doc(botId).delete()

      //decrement botCounts on team
      await firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(team.id)
        const sfDoc = await transaction.get(teamRef)
        if (!sfDoc.exists) {
          throw 'Team does not exist!'
        }

        const newBotCount = Math.max(0, (sfDoc.data().botCount || 0) - 1)
        const newSourceCount = Math.max(0, (sfDoc.data().sourceCount || 0) - (bot.sourceCount || 0))
        const newPageCount = Math.max(0, (sfDoc.data().pageCount || 0) - (bot.pageCount || 0))
        const newChunkCount = Math.max(0, (sfDoc.data().chunkCount || 0) - (bot.chunkCount || 0))
        transaction.update(teamRef, {
          botCount: newBotCount,
          sourceCount: newSourceCount,
          pageCount: newPageCount,
          chunkCount: newChunkCount,
        })
      })

      //delete all bot data from bucket
      const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
      await bucket.deleteFiles({ prefix: `teams/${team.id}/bots/${botId}` })

      //delete schema in weaviate async
      if (bot.indexId) {
        try {
          deleteSchema(bot.indexId)
        } catch (error) {
          console.warn('Error deleting Weaviate Schema:', error)
        }
      }

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBot',
          botName: bot.name,
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
