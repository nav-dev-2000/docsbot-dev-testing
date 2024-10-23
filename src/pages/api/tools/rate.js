import { addOrUpdateRating, getRating } from '@/lib/tools'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { itemId, rating } = req.body

      if (!itemId || typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Invalid input' })
      }

      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress

      // Add or update the rating
      await addOrUpdateRating(itemId, ip, rating)

      // Get the updated rating
      const updatedRating = await getRating(itemId)

      if (!updatedRating) {
        return res.status(404).json({ error: 'Rating not found' })
      }

      return res.status(200).json({
        success: true,
        ...updatedRating
      })
    } catch (error) {
      console.error('Error in rate tool API:', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else if (req.method === 'GET') {
    try {
      const { itemId } = req.query

      if (!itemId) {
        return res.status(400).json({ error: 'Invalid input: itemId is required' })
      }

      const rating = await getRating(itemId)

      if (!rating) {
        return res.status(404).json({ error: 'Rating not found' })
      }

      return res.status(200).json({
        success: true,
        ...rating
      })
    } catch (error) {
      console.error('Error in rate tool API (GET):', error)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
}
