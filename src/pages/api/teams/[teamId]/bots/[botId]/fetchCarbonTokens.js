import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import axios from 'axios'
import { stripePlan } from '@/utils/helpers'
import { getCarbonCustomerID } from '@/lib/carbon'

export default async function handler(req, res) {
  configureFirebaseApp()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  const plan = stripePlan(team)

  if (req.method === 'GET') {
    try {
      const bot = await getBot(team.id, botId)
      if (!bot) {
        // doc.data() will be undefined in this case
        return res.status(404).json({ message: "botId doesn't exist." })
      }

      // grab token from carbon
      const response = await axios.get('https://api.carbon.ai/auth/v1/access_token', {
        headers: {
          'Content-Type': 'application/json',
          'customer-id': getCarbonCustomerID(team.id, botId),
          'authorization': `Bearer ${process.env.CARBON_API_KEY}`,
        },
      });
      if (response.status === 200 && response.data) {
        try {
          // update carbon max_files_per_upload
          const maxUpload = plan.pages - team.pageCount
          const userResponse = await axios.post('https://api.carbon.ai/update_users', {
            "customer_ids": [getCarbonCustomerID(team.id, botId)],
            "max_files_per_upload": Math.min(1000, maxUpload), // Limit to 1000 or maxUpload, whichever is smaller
            "max_files": maxUpload,
          }, {
            headers: {
              'Content-Type': 'application/json',
              'authorization': `Bearer ${process.env.CARBON_API_KEY}`,
            },
          });
          if (userResponse.status != 200) {
            console.error('Error updating carbon max_files_per_upload')
          }
        } catch (error) {
          console.error('Error updating carbon max_files_per_upload:', error)
        }

        res.status(200).json(response.data);
      } else {
        res.status(500).json({ message: 'Error fetching carbon tokens' })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
    
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
