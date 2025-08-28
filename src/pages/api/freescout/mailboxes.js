export default async function handler(req, res) {
  const { url, key } = req.query
  if (!url || !key) {
    return res.status(400).json({ error: 'Missing url or key' })
  }
  let base = url
  if (typeof base === 'string' && !base.endsWith('/api')) {
    base = base.replace(/\/$/, '') + '/api'
  }
  
  let headers = {
    "X-FreeScout-API-Key": key,
    "Accept": "application/json",
    "Content-Type": "application/json; charset=UTF-8",
  }
  
  try {
    const response = await fetch(`${base}/mailboxes`, {
      headers: headers
    })
    console.log(response)
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Request failed' })
    }
    const data = await response.json()
    return res.status(200).json(data)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
