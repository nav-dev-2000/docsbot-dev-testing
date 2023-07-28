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
  if (!request.query.key || request.query.key !== 'efjlnczww7236912') {
    response.status(404).end()
    return
  }

  console.log('cron carbon started!')

  // grab all carbon sources
  const sourcesRef = await firestore
    .collectionGroup('sources')
    .where('type', 'in', ['notion', 'google_docs', 'intercom'])
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

        // check with carbon if source is ready
        // https://api.carbon.ai/redoc#tag/user_files/operation/user_files_v2_user_files_v2_post
        const response = await axios.post(
          `https://api.carbon.ai/user_files_v2`,
          {
            filters: {
              external_file_id: [source.carbonId],
            },
          },
          headers
        )

        if (response.status !== 200) {
          throw new Error(`Carbon API returned status ${response.status}`)
        }

        let newCarbonFiles = []
        let ready = true
        for (const result of response.data.results) {
          if (source.carbonFiles.find((file) => file.id === result.external_file_id)) {
            // Do something with the result
            if (result.sync_status !== 'READY') {
              ready = false
            }

            newCarbonFiles.push({fileId: result.id, ...source.carbonFiles.find((file) => file.id === result.external_file_id)})
          }
        }

        if (ready) {
          const chunks = []

          for (const file of response.data.results) {
            const response = await axios.post(
              `https://api.carbon.ai/text_chunks`,
              {
                filters: {
                  user_file_id: file.id,
                },
                include_vectors: true,
              },
              headers
            )

            if (response.status !== 200) {
              throw new Error(`Carbon API returned status ${response.status}`)
            }

            //create chunks
            for (const chunk of response.data.results) {
              const carbonFile = source.carbonFiles.find(
                (cFile) => cFile.id === file.external_file_id
              )
              if (carbonFile) {
                chunks.push({
                  text: chunk.source_content,
                  title: carbonFile.title || carbonFile.name || 'Documentation', //gdocs has name, others have title
                  url: carbonFile.url || null,
                  vector: chunk.embedding,
                })
              }
            }
          }

          //import chunks into weaviate
          await importChunks(bot.indexId, source.type, sourceId, chunks)

          //update source
          doc.ref.update({
            status: 'ready',
            chunkCount: chunks.length,
            pageCount: source.carbonFiles.length,
            refreshing: FieldValue.delete(),
            carbonFiles: newCarbonFiles, //update carbon files with new int ids for delete later
          })

          // increment only if not doing a scheduled refresh
          if (!source.refreshing) {
            //increment bot with a transaction
            await firestore.runTransaction(async (transaction) => {
              const botDoc = await transaction.get(botRef)
              const bot = botDoc.data()
              transaction.update(botRef, {
                pageCount: bot.pageCount + source.carbonFiles.length,
                chunkCount: bot.chunkCount + chunks.length,
                status: 'ready',
              })
            })

            //increment team with a transaction
            await firestore.runTransaction(async (transaction) => {
              const teamDoc = await transaction.get(teamRef)
              const team = teamDoc.data()
              transaction.update(teamRef, {
                pageCount: team.pageCount + source.carbonFiles.length,
                chunkCount: team.chunkCount + chunks.length,
                status: 'ready',
              })
            })
          }

          // we only allow unique carbon cloud login sources per bot, so we'll need to check if a carbon external_file_id exists in any sources already.
          // if it does, we'll need to delete it
          const sources = await getSources(teamId, bot)
          const existingSources = sources.filter(
            (oldSource) => oldSource.carbonId === source.carbonId && oldSource.id !== sourceId
          )
          // loop through existing sources and delete them
          await existingSources.forEach(async (existingSource) => {
            console.log('Deleting old existing source', existingSource.id)
            await deleteSource(teamId, bot, existingSource.id, false) //don't delete files from carbon as they might be resused
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
