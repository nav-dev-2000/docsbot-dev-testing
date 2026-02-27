import Turbopuffer from '@turbopuffer/turbopuffer'

const REGION_MAP = {
  US: 'gcp-us-west1',
  EU: 'gcp-europe-west3',
}

/**
 * Get a Turbopuffer client for the given region.
 * @param {'US'|'EU'|'us'|'eu'} region - 'US'/'EU' (db format) or 'us'/'eu'
 * @returns {Turbopuffer}
 */
function getTurbopufferClient(region) {
  const key = (region || 'US').toUpperCase()
  const regionStr = REGION_MAP[key] || REGION_MAP.US
  return new Turbopuffer({
    apiKey: process.env.TURBOPUFFER_API_KEY,
    region: regionStr,
  })
}

/**
 * Delete a Turbopuffer namespace (used when deleting a bot).
 * Namespace format: {team_id}-{bot_id}
 * @param {string} teamId
 * @param {string} botId
 * @param {'US'|'EU'} region - Bot's region (uppercase, as stored in db)
 */
export async function deleteTurbopufferNamespace(teamId, botId, region) {
  if (!process.env.TURBOPUFFER_API_KEY) {
    console.warn('TURBOPUFFER_API_KEY not set, skipping Turbopuffer namespace deletion')
    return
  }

  const namespace = `${teamId}-${botId}`
  const client = getTurbopufferClient(region || 'US')

  try {
    await client.namespace(namespace).deleteAll()
  } catch (error) {
    console.warn('Error deleting Turbopuffer namespace:', error)
  }
}
