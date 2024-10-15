export async function clearCloudflareCache(teamId, botId) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID
  const apiToken = process.env.CLOUDFLARE_API_TOKEN
  const urlsToCache = [
    `https://docsbot.ai/api/widget/${teamId}/${botId}`,
    `https://docsbot.ai/chat/${teamId}/${botId}`,
    `https://docsbot.ai/ask/${teamId}/${botId}`,
    `https://docsbot.ai/iframe/${teamId}/${botId}`,
  ]

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          files: urlsToCache,
        }),
      }
    )

    if (!response.ok) {
      const text = await response.text()
      console.warn('Failed to clear Cloudflare cache:', text)
      return false
    }

    return true
  } catch (error) {
    console.error('Error clearing Cloudflare cache:', error)
    return false
  }
}
