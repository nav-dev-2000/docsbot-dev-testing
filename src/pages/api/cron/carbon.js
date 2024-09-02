import { FieldValue, getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getCarbonCustomerID } from '@/lib/carbon'
import axios from 'axios'
import { getSources } from '@/lib/dbQueries'
import { deleteSource } from '@/lib/apiFunctions'
import { stripePlan } from '@/utils/helpers'
import { QueueSourceIngest, QueueSourceExpel } from '@/lib/service'
import { carbonSourceFilters } from '@/constants/carbon.constants'
import { sourceTypes } from '@/constants/sourceTypes.constants'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // this is a public endpoint, however our 'cron' path is protected by a key; TODO: can this be an env var?
  // To test: curl "http://localhost:3000/api/cron/carbon?key=efjlnczww7236912"
  if (!request.query.key || request.query.key !== 'efjlnczww7236912') {
    response.status(404).end()
    return
  }

  // Get all carbon source types
  const carbonSourceTypes = sourceTypes
    .filter(sourceType => sourceType.isCarbon)
    .map(sourceType => sourceType.id)

  // Grab all carbon sources
  const sourcesRef = await firestore
    .collectionGroup('sources')
    .where('type', 'in', carbonSourceTypes)
    .where('status', 'in', ['pending', 'indexing'])
    .get()

  try {
    const sourcePromises = sourcesRef.docs.map(async (doc) => {
      const source = doc.data()
      const sourceId = doc.id

      const botRef = doc.ref.parent.parent
      const botId = botRef.id
      const bot = { id: botId, ...(await botRef.get()).data() }

      const teamRef = botRef.parent.parent
      const teamId = teamRef.id
      const team = { id: teamId, ...(await teamRef.get()).data() }

      // Check if source is expired and update status if necessary
      const expireHours = 6; // Set the expiration time to 6 hours
      if (
        source.createdAt.toDate() <
          new Date(Date.now() - expireHours * 60 * 60 * 1000)
      ) {
        source.status = 'failed'
        source.error = 'Processing timed out, please try again'
        // Update source in Firestore
        await firestore
          .collection('teams')
          .doc(teamId)
          .collection('bots')
          .doc(botId)
          .collection('sources')
          .doc(sourceId)
          .update({ status: source.status, error: source.error })
        
        console.log(`Updated expired source: ${sourceId} for bot: ${botId} in team: ${teamId}`)
        // Skip further processing for this expired source
        return
      }

      console.log('Checking Carbon status', teamId, botId, sourceId)
      try {
        const headers = {
          headers: {
            'Content-Type': 'application/json',
            'customer-id': getCarbonCustomerID(teamId, botId),
            authorization: `Bearer ${process.env.CARBON_API_KEY}`,
          },
        }

        const carbonFiles = []
        const perPage = 250
        let offset = 0
        let errorCount = 0
        while (true) {
          try {
            const response = await axios.post(
              `https://api.carbon.ai/user_files_v2`,
              {
                filters: {
                  source: carbonSourceFilters[source.type],
                  include_containers: false, // we want a flat response, no folders
                },
                pagination: {
                  limit: perPage,
                  offset: offset,
                },
              },
              headers
            )
            errorCount = 0
            carbonFiles.push(...response.data.results)

            // Check if there are more pages to fetch
            if (response.data.count <= offset + perPage) {
              break
            }

            // Update the offset for the next iteration
            offset += perPage

          } catch (error) {
            // If the status code is 502 and we haven't reached the maximum number of attempts, retry the request
            if (error.response && error.response.status === 502 && errorCount < 3) {
              console.log('Retrying request', error.response.status, errorCount)
              errorCount++
            } else {
              // Update the offset for the next iteration
              console.log('Skipping page', error.response.status)
              offset += perPage
            }
          }
        }

        let newCarbonFiles = []
        let ready = true
        const statuses = carbonFiles.map((file) => file.sync_status)
        //count by status
        const statusCounts = statuses.reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
        console.log('Carbon file statuses:', statusCounts)

        for (const file of carbonFiles) {
          // Do something with the file
          if (
            file.sync_status !== 'READY' &&
            file.sync_status !== 'SYNC_ERROR' &&
            file.sync_status !== 'EVALUATING_RESYNC'
          ) {
            ready = false
          }

          if (file.sync_status !== 'SYNC_ERROR' && !file.file_metadata?.is_folder) {
            newCarbonFiles.push({
              id: file.id,
              name: file.name || file.title || 'DB Item', //gdocs has name, others have title
              url: file.external_url,
              type: file.file_statistics?.file_format || file.source,
              status: file.sync_status,
            })
          }
        }

        //if this will exceed the page count, fail and return
        if (newCarbonFiles.length + team.pageCount > stripePlan(team).pages) {
          throw new Error(
            `This source has ${
              newCarbonFiles.length
            } pages, exceeding the remaining plan limit of ${
              stripePlan(team).pages - team.pageCount
            }. Please upgrade your plan.`
          )
        }

        //TODO: if too many files we will get an error saving to document (1MB limit)

        //update source
        doc.ref.update({
          status: 'indexing', //avoid race condition since it's a 1min cron and 5min timeout
          pageCount: newCarbonFiles.length,
          carbonFiles: newCarbonFiles, //update carbon files with new int ids for delete later
        })

        console.log(newCarbonFiles.length, 'Carbon files, ready:', ready, teamId, botId, sourceId)

        if (ready) {
          //if refreshing via regest, expel first so we don't get duplicates (TODO could cause race condition)
          if (source.refreshing) {
            QueueSourceExpel(teamId, bot.indexId, botId, sourceId)
            console.log('Source', teamId, botId, sourceId, 'queued for expel')
          }

          await QueueSourceIngest(
            teamId,
            botId,
            sourceId,
            stripePlan(team).pages - team.pageCount,
            bot.indexId,
            'carbon',
            source.title, //null
            source.url,
            source.file, //null
            source.faqs //null
          )
          console.log('Source', teamId, botId, sourceId, 'queued for ingest')

          //TODO ideally we should wait for the ingest to complete before deleting the source
          // we only allow unique carbon type sources per bot, so we'll need to check if a carbon type.
          // if it does, we'll need to delete it
          const data = await getSources(teamId, bot, 0, 1000)
          const existingSources = data.sources.filter(
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
        } else {
          console.log('Source not ready yet in Carbon', teamId, botId, sourceId)
        }
      } catch (error) {
        console.log(doc.id, 'carbon cron error:', error)

        doc.ref.update({
          status: 'failed',
          error: error.message,
        })
      }
    })
    await Promise.all(sourcePromises)
  } catch (error) {
    console.warn('Error getting document:', error)
    response.status(500).json({ message: error })
    return
  }

  response.status(200).json({ success: true })
}