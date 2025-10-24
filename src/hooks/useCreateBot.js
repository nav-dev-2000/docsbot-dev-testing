import { useCallback, useState } from 'react'
import { createBotRequest } from '@/services/bots'

export default function useCreateBot(team) {
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState(null)

  const createBot = useCallback(
    async (botSettings) => {
      if (!team?.id) {
        throw new Error('A valid team is required to create a bot.')
      }

      setIsCreating(true)
      setError(null)

      try {
        const bot = await createBotRequest(team.id, botSettings)
        return bot
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        setIsCreating(false)
      }
    },
    [team?.id],
  )

  return {
    createBot,
    isCreating,
    error,
    resetError: () => setError(null),
  }
}
