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

export const updateTeamRequest = async (teamId, payload) => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response, 'Error updating team. Please try again later.')
}

export const getSlackIntegration = async (teamId) => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/integrations/slack`)
  return handleResponse(response, 'Error loading Slack integration settings.')
}

export const updateSlackIntegration = async (teamId, payload) => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  const response = await fetch(`/api/teams/${teamId}/integrations/slack`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return handleResponse(response, 'Error saving Slack integration settings.')
}

export const deleteSlackWorkspace = async (teamId, slackTeamId) => {
  if (!teamId || !slackTeamId) {
    throw new Error('Missing team or workspace identifier.')
  }

  const response = await fetch(
    `/api/teams/${teamId}/integrations/slack?slackTeamId=${encodeURIComponent(slackTeamId)}`,
    { method: 'DELETE' },
  )

  return handleResponse(response, 'Error disconnecting Slack workspace.')
}

export const getBotsForSlackWorkspace = async (teamId, slackTeamId = '') => {
  if (!teamId) {
    throw new Error('Missing team identifier.')
  }

  const queryString = slackTeamId
    ? `?slackTeamId=${encodeURIComponent(slackTeamId)}`
    : ''
  const response = await fetch(
    `/api/teams/${teamId}/integrations/slack/bots${queryString}`,
  )

  return handleResponse(response, 'Error loading Slack-connected bots.')
}
