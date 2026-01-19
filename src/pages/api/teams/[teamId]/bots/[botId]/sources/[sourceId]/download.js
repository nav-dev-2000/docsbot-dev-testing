import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getBot, getSource } from '@/lib/dbQueries'
import { canSourceTypeDownload } from '@/constants/sourceTypes.constants'
import userTeamCheck from '@/lib/userTeamCheck'
import { phTrack } from '@/lib/posthog'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()
  const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)
  const buildUrlsCsv = (indexedUrls = []) => {
    const lines = indexedUrls
      .map((item) => {
        if (!item) return null
        if (typeof item === 'string') return item.trim()
        return (item.source || item.url || item.link || '').trim()
      })
      .filter(Boolean)

    if (lines.length === 0) return ''
    return `${lines.join('\n')}\n`
  }

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId, sourceId } = req.query

  let bot = null
  let source = null
  try {
    bot = await getBot(team.id, botId)
    if (!bot) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "botId doesn't exist." })
    }
    source = await getSource(team, bot, sourceId)
    if (!source) {
      return res.status(404).json({ message: "sourceId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error?.message })
  }

  if (!canSourceTypeDownload(source.type)) {
    return res.status(400).json({ message: `Source type ${source.type} cannot be downloaded`})
  }

  if (req.method === 'GET') {
    if (!source?.file && source?.type === 'urls' && source?.indexedUrls?.length > 0) {
      try {
        const csvContent = buildUrlsCsv(source.indexedUrls)
        if (csvContent) {
          const generatedFilePath = `teams/${team.id}/bots/${botId}/sources/${sourceId}/indexed-urls.csv`
          const generatedFile = bucket.file(generatedFilePath)
          await generatedFile.save(csvContent, { contentType: 'text/csv' })
          await firestore
            .collection('teams')
            .doc(team.id)
            .collection('bots')
            .doc(botId)
            .collection('sources')
            .doc(sourceId)
            .update({ file: generatedFilePath })
          source.file = generatedFilePath
        }
      } catch (error) {
        console.warn('Error creating urls download file:', error)
        return res.status(500).json({ message: error?.message })
      }
    }

    if (!source?.file) {
      return res.status(400).json({ message: `Source type ${source.type} cannot be downloaded`})
    }

    const file = bucket.file(source.file)

    // sign url for 7 days
    const url = (await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24 * 7 // 7 days
    }))[0];

    
    phTrack(userId, 'Source File Downloaded', {}, team.id)

    return res.status(200).json({ url })
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
