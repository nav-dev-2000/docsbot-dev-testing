import { sanitizeURL } from '@/utils/helpers'

const handleResponse = async (response, defaultMessage) => {
  if (response.ok) {
    try {
      return await response.json()
    } catch (error) {
      return null
    }
  }

  let message = defaultMessage
  try {
    const data = await response.json()
    message = data?.message || message
  } catch (error) {
    // ignore
  }

  const err = new Error(message)
  err.status = response.status
  throw err
}

export const createBotRequest = async (teamId, payload) => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/bots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response, 'Error creating bot. Please try again later.')
}

export const analyzeSiteForBot = async (teamId, siteURL, metadata) => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  if (!siteURL) {
    throw new Error('Please provide a website URL to analyze.')
  }

  const response = await fetch(`/api/teams/${teamId}/bots/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      siteURL,
      metadata: metadata && typeof metadata === 'object' ? metadata : undefined,
    }),
  })

  return handleResponse(response, 'Unable to analyze the provided website. Please try again.')
}

export const createSourceRequest = async (teamId, botId, payload) => {
  if (!teamId || !botId) {
    throw new Error('Missing team or bot identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/bots/${botId}/sources`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response, 'Error adding knowledge source. Please try again.')
}

export const getBotRequest = async (teamId, botId) => {
  if (!teamId || !botId) {
    throw new Error('Missing team or bot identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/bots/${botId}`)

  return handleResponse(response, 'Error loading bot details. Please try again.')
}

export const updateBotRequest = async (teamId, botId, payload) => {
  if (!teamId || !botId) {
    throw new Error('Missing team or bot identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/bots/${botId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response, 'Error updating bot settings. Please try again.')
}

export const normalizeWebsiteUrl = (url) => {
  if (!url) return ''
  try {
    return sanitizeURL(url) || url
  } catch (error) {
    return url
  }
}
