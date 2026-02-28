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
