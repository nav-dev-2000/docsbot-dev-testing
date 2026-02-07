import { configureFirebaseApp } from '@/config/firebase-server.config'
import { firebaseConfig } from '@/config/firebase-ui.config'
import { getStorage } from 'firebase-admin/storage'
import userTeamCheck from '@/lib/userTeamCheck'
import { getBot, getLeads } from '@/lib/dbQueries'
import { checkPlanPermission } from '@/utils/helpers'
import { stringify } from '@vanillaes/csv'
import { phTrack } from '@/lib/posthog'
import { canUserExportBotLogs } from '@/utils/function.utils'

const normalizeCsvValue = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      return '[object]'
    }
  }
  return String(value)
}

const handler = async (req, res) => {
  configureFirebaseApp()
  const bucket = getStorage().bucket(`gs://${firebaseConfig.storageBucket}`)

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  if (req.method === 'GET') {
    const bot = await getBot(team.id, botId)
    if (!bot) {
      return res.status(404).json({ message: 'Bot not found' })
    }

    if (!canUserExportBotLogs(team, userId, bot)) {
      return res.status(403).json({
        message: 'You are not allowed to export logs for this bot.',
      })
    }

    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Missing startDate or endDate' })
    }

    if (!checkPlanPermission(team, 'personal').allowed) {
      return res.status(402).json({
        message: 'Please upgrade your plan to enable log exporting.',
      })
    }

    try {
      const start = new Date(startDate)
      const end = new Date(endDate)
      start.setHours(0, 0, 0)
      end.setHours(23, 59, 59)

      const { leads } = await getLeads(
        team,
        botId,
        999999999,
        0,
        startDate,
        endDate,
      )

      const metadataKeys = new Set()
      let hasUpdatedAt = false
      leads.forEach((lead) => {
        if (lead.updatedAt) {
          hasUpdatedAt = true
        }
        if (lead.metadata && typeof lead.metadata === 'object') {
          Object.keys(lead.metadata).forEach((key) => metadataKeys.add(key))
        }
      })

      const hasName = metadataKeys.has('name')
      const hasEmail = metadataKeys.has('email')
      const orderedMetadataKeys = Array.from(metadataKeys)
        .filter((key) => key !== 'name' && key !== 'email')
        .sort((a, b) => a.localeCompare(b))

      const headers = ['id']
      if (hasName) headers.push('name')
      if (hasEmail) headers.push('email')
      headers.push(...orderedMetadataKeys)
      headers.push('createdAt')
      if (hasUpdatedAt) headers.push('updatedAt')
      headers.push('ip')

      const csvData = [headers]

      leads.forEach((lead) => {
        const metadata = lead.metadata || {}
        const row = [lead.id]

        if (hasName) row.push(normalizeCsvValue(metadata.name))
        if (hasEmail) row.push(normalizeCsvValue(metadata.email))
        orderedMetadataKeys.forEach((key) => {
          row.push(normalizeCsvValue(metadata[key]))
        })

        row.push(normalizeCsvValue(lead.createdAt))
        if (hasUpdatedAt) row.push(normalizeCsvValue(lead.updatedAt))
        row.push(normalizeCsvValue(lead.ip))

        csvData.push(row)
      })

      const filename = `docsbot_leads_${bot.id}_${start.toISOString().slice(0, 10)}_${end.toISOString().slice(0, 10)}.csv`
      const file = bucket.file(
        `user/${userId}/team/${team.id}/bot/${bot.id}/export/${filename}`,
      )
      await file.save(stringify(csvData))

      const url = (
        await file.getSignedUrl({
          action: 'read',
          promptSaveAs: filename,
          expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        })
      )[0]

      phTrack(userId, 'Lead Log Exported', { 'Bot name': bot.name }, team.id)

      return res.status(200).json({ url })
    } catch (error) {
      return res.status(400).json({ message: error?.message })
    }
  }

  res.setHeader('Allow', ['GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

export default handler
