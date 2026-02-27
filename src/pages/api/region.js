import { detectRegionFromHeaders } from '@/lib/regionUtils'

/**
 * Returns the user's region based on Cloudflare cf-ipcountry header.
 * Used by client components (e.g. BotCopy) to pre-select region.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' })
  }
  const region = detectRegionFromHeaders(req.headers)
  return res.status(200).json({ region })
}
