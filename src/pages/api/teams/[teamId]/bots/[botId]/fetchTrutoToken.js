import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { GetLinkToken, GetTenantId, GetIntegratedAccountByID, GetIntegratedAccountToken } from '@/lib/truto'

export default async function handler(req, res) {
  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }
  const { userId, team } = check
  const { botId } = req.query

  const bot = await getBot(team.id, botId)
  if (!bot) {
    // doc.data() will be undefined in this case
    return res.status(404).json({ message: "botId doesn't exist." })
  }

  if (req.method === 'GET') {
    try {
      const token = await GetLinkToken(GetTenantId(team.id, botId))
      console.log('truto token', token)
      res.status(200).json({ token });
    } catch (error) {
      console.warn('Error getting token:', error)
      return res.status(500).json({ message: error })
    }
  } else if (req.method === 'POST') {
    try {
      const { accountID } = req.body

      if (!accountID) {
        return res.status(400).json({ message: "accountId is required." })
      }

      // verify tenant id matches
      const integrationAccount = await GetIntegratedAccountByID(accountID)
      console.log('INTEGRATION ACCOUNT: ', integrationAccount)
      if (integrationAccount.tenant_id !== GetTenantId(team.id, botId)) {
        return res.status(400).json({ message: "accountId does not belong to this bot." })
      }

      // grab account token
      const token = await GetIntegratedAccountToken(accountID)
      const label = integrationAccount?.context?.hd ? `${integrationAccount.context.hd} - ${integrationAccount?.context?.label}` : integrationAccount?.context?.label
      res.status(200).json({ accountToken: token, label });
    } catch (error) {
      console.warn('Error getting token:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}