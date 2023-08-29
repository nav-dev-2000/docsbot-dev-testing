import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getCarbonCustomerID } from '@/lib/carbon'
import axios from 'axios'
import { importChunks } from '@/lib/weaviate'
import { getSources } from '@/lib/dbQueries'
import { deleteSource } from '@/lib/apiFunctions'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // this is a public endpoint, however our 'cron' path is protected by a key; TODO: can this be an env var?
  // To test: curl "http://localhost:3000/api/cron/carbon?key=efjlnczww7236912"
  if (!request.query.key || request.query.key !== 'efjlnczww7236912') {
    response.status(404).end()
    return
  }

  console.log('cron carbon started!')

  // grab all carbon sources
  const sourcesRef = await firestore
    .collectionGroup('sources')
    .where('type', 'in', ['notion', 'google_docs', 'intercom', 'dropbox'])
    .where('status', '==', 'pending')
    .get()

  try {
    sourcesRef.forEach(async (doc) => {
      const source = doc.data()
      const sourceId = doc.id

      const botRef = doc.ref.parent.parent
      const botId = botRef.id
      const bot = { id: botId, ...(await botRef.get()).data() }

      const teamRef = botRef.parent.parent
      const teamId = teamRef.id

      console.log('Importing', teamId, botId, sourceId)
      try {
        const headers = {
          headers: {
            'Content-Type': 'application/json',
            'customer-id': getCarbonCustomerID(teamId, botId),
            authorization: `Bearer ${process.env.CARBON_API_KEY}`,
          },
        }

        const sourceFilters = {
          notion: ['NOTION', 'NOTION_DATABASE'],
          google_docs: ['GOOGLE_DRIVE'],
          intercom: ['INTERCOM'],
          dropbox: ['DROPBOX'],
        }

        const carbonFiles = []

        const response = await axios.post(
          `https://api.carbon.ai/user_files_v2`,
          {
            filters: {
              source: sourceFilters[source.type],
            },
            pagination: {
              limit: 10000,
            },
          },
          headers
        )

        if (response.status !== 200) {
          throw new Error(`Carbon API returned status ${response.status}`)
        }

        carbonFiles.push(...response.data.results)

        let newCarbonFiles = []
        let ready = true
        for (const file of carbonFiles) {
          // Do something with the file
          if (file.sync_status !== 'READY' && file.sync_status !== 'SYNC_ERROR') {
            ready = false
          }

          if (file.sync_status !== 'SYNC_ERROR') {
            newCarbonFiles.push({
              id: file.id,
              name: file.name || file.title || 'DB Item', //gdocs has name, others have title
              url: file.external_url,
              type: file.file_statistics?.file_format || file.source,
              status: file.sync_status,
            })
          }
        }

        //update source
        doc.ref.update({
          pageCount: newCarbonFiles.length,
          carbonFiles: newCarbonFiles, //update carbon files with new int ids for delete later
        })

        console.log('newCarbonFiles', newCarbonFiles)

        //TODO if plan page count is exceeded, fail and return

        if (ready) {
          const chunks = []

          for (const file of newCarbonFiles) {
            const response = await axios.post(
              `https://api.carbon.ai/text_chunks`,
              {
                filters: {
                  user_file_id: file.id,
                },
                include_vectors: true,
                pagination: {
                  limit: 10000,
                },
              },
              headers
            )

            if (response.status !== 200) {
              throw new Error(`Carbon API returned status ${response.status}`)
            }

            //create chunks
            for (const chunk of response.data.results) {
              chunks.push({
                text: chunk.source_content,
                title: file.name, //gdocs has name, others have title
                url: file.url || null,
                vector: chunk.embedding,
              })
            }
          }

          //import chunks into weaviate
          if (chunks.length) {
            await importChunks(bot.indexId, source.type, sourceId, chunks)
          }

          //update source
          doc.ref.update({
            status: 'ready',
            chunkCount: chunks.length,
            refreshing: FieldValue.delete(),
          })

          // increment only if not doing a scheduled refresh
          if (!source.refreshing) {
            //increment bot with a transaction
            await firestore.runTransaction(async (transaction) => {
              const botDoc = await transaction.get(botRef)
              const bot = botDoc.data()
              transaction.update(botRef, {
                pageCount: bot.pageCount + newCarbonFiles.length,
                chunkCount: bot.chunkCount + chunks.length,
                status: 'ready',
              })
            })

            //increment team with a transaction
            await firestore.runTransaction(async (transaction) => {
              const teamDoc = await transaction.get(teamRef)
              const team = teamDoc.data()
              transaction.update(teamRef, {
                pageCount: team.pageCount + newCarbonFiles.length,
                chunkCount: team.chunkCount + chunks.length,
                status: 'ready',
              })
            })
          }

          // we only allow unique carbon type sources per bot, so we'll need to check if a carbon type.
          // if it does, we'll need to delete it
          const sources = await getSources(teamId, bot)
          const existingSources = sources.filter(
            (oldSource) => oldSource.type === source.type && oldSource.id !== sourceId
          )
          // loop through existing sources and delete them
          const newIds = [source.carbonId]
          await existingSources.forEach(async (existingSource) => {
            newIds.push(existingSource.carbonId)
            console.log('Deleting old existing source', existingSource.id)
            await deleteSource(teamId, bot, existingSource.id, false) //don't delete files from carbon as they might be resused
          })
          //update source with list of cloud logins
          doc.ref.update({
            carbonId: newIds.join(', '),
          })
        }
      } catch (error) {
        console.log(doc.id, 'refresh error:', error)

        doc.ref.update({
          status: 'failed',
          error: error,
        })
        return
      }
    })
  } catch (error) {
    console.warn('Error getting document:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}
