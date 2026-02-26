import crypto from 'crypto'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { getTeam, getTeams } from '@/lib/dbQueries'
import { getURL, stripePlan } from '@/utils/helpers'

export const config = {
  api: {
    bodyParser: false,
  },
}

const relevantEvents = new Set(['convo.created', 'convo.customer.reply'])

const getRawBody = (req) =>
  new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => {
      resolve(data)
    })
    req.on('error', reject)
  })

const verifySignature = (signature, secret, payload) => {
  if (!signature || !secret || !payload) return false

  const digest = crypto.createHmac('sha1', secret).update(payload).digest('base64')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))
  } catch (error) {
    console.error('Help Scout webhook signature verification failed:', error)
    return false
  }
}

const getHelpScoutToken = async () => {
  if (!process.env.HELPSCOUT_APP_ID || !process.env.HELPSCOUT_APP_SECRET) {
    throw new Error('Help Scout client credentials are not configured')
  }

  const tokenResponse = await fetch('https://api.helpscout.net/v2/oauth2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.HELPSCOUT_APP_ID,
      client_secret: process.env.HELPSCOUT_APP_SECRET,
    }).toString(),
  })

  if (!tokenResponse.ok) {
    const message = await tokenResponse.text()
    throw new Error(`Failed to fetch Help Scout token: ${message}`)
  }

  const tokenJson = await tokenResponse.json()
  return tokenJson.access_token
}

const findCustomerId = async (payload, token, email) => {
  const directId =
    payload?.customer?.id ||
    payload?.primaryCustomer?.id ||
    payload?.conversation?.customer?.id ||
    payload?.conversation?.primaryCustomer?.id ||
    payload?.thread?.customer?.id

  if (directId) return directId

  if (!email) return null

  const searchResponse = await fetch(
    `https://api.helpscout.net/v2/customers?email=${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  )

  if (!searchResponse.ok) {
    const message = await searchResponse.text()
    throw new Error(`Failed to search Help Scout customer: ${message}`)
  }

  const searchJson = await searchResponse.json()
  const [firstCustomer] = searchJson?._embedded?.customers || []
  return firstCustomer?.id || null
}

const collectEmails = (payload) => {
  const emails = []
  const seen = new Set()

  const addEmail = (email) => {
    if (!email || typeof email !== 'string') return
    const trimmed = email.trim()
    if (!trimmed) return
    const normalized = trimmed.toLowerCase()
    if (seen.has(normalized)) return
    seen.add(normalized)
    emails.push(trimmed)
  }

  const addEmailsFromCustomer = (customer) => {
    if (!customer) return
    addEmail(customer.email)
    for (const entry of customer.emails || []) {
      addEmail(entry?.value || entry?.email || entry)
    }
  }

  addEmailsFromCustomer(payload?.customer)
  addEmailsFromCustomer(payload?.primaryCustomer)
  addEmailsFromCustomer(payload?.conversation?.customer)
  addEmailsFromCustomer(payload?.conversation?.primaryCustomer)
  addEmailsFromCustomer(payload?.thread?.customer)

  addEmail(payload?.customerEmail)
  addEmail(payload?.email)

  for (const thread of payload?.conversation?.threads || []) {
    addEmailsFromCustomer(thread?.customer)
    addEmailsFromCustomer(thread?.primaryCustomer)
    addEmail(thread?.customerEmail)
    addEmail(thread?.email)
  }

  return emails
}

const formatMonthlyPrice = (team) => {
  if (!team?.stripeSubscriptionPrice) return null

  const quantity = team.stripeSubscriptionQuantity || 1
  const interval = team.stripeSubscriptionInterval || 'month'
  const baseCents = Number(team.stripeSubscriptionPrice) * quantity
  const normalizedCents =
    interval === 'year' ? baseCents / 12 : baseCents
  const monthly = normalizedCents / 100

  return monthly
    ? `$${monthly.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`
    : null
}

const buildMetadata = (team) => {
  if (!team) return {}

  const dashboardLink = `${getURL()}/app/team?switchTeam=${team.id}`
  const plan = stripePlan(team)
  const monthlyPrice = formatMonthlyPrice(team)

  const metadata = {
    'connected-sites': dashboardLink,
    'storage-plan': plan?.name,
  }

  if (monthlyPrice && plan?.name !== 'Free') {
    metadata['monthly-price'] = monthlyPrice
  }

  if (team.stripeCustomerId) {
    metadata['stripe-customer'] = `https://dashboard.stripe.com/customers/${team.stripeCustomerId}`
  }

  if (team.stripeSubscriptionId) {
    metadata['stripe-subscription'] = `https://dashboard.stripe.com/subscriptions/${team.stripeSubscriptionId}`
  }

  return metadata
}

const isPaidTeam = (team) => {
  const plan = stripePlan(team)
  return plan?.id !== 'free'
}

const selectPreferredTeam = (teams = []) => {
  const uniqueTeams = []
  const seen = new Set()

  for (const team of teams) {
    if (!team?.id || seen.has(team.id)) continue
    seen.add(team.id)
    uniqueTeams.push(team)
  }

  if (!uniqueTeams.length) return null

  return uniqueTeams.find((candidate) => isPaidTeam(candidate)) || uniqueTeams[0]
}

const resolveTeamCandidates = async ({ currentTeamId, userTeamIds = [] }) => {
  const candidateIds = []
  const seenIds = new Set()

  const addCandidateId = (teamId) => {
    if (!teamId || seenIds.has(teamId)) return
    seenIds.add(teamId)
    candidateIds.push(teamId)
  }

  addCandidateId(currentTeamId)
  userTeamIds.forEach(addCandidateId)

  if (!candidateIds.length) return []

  const candidates = await Promise.all(candidateIds.map((teamId) => getTeam(teamId)))
  return candidates.filter(Boolean)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    console.warn('Help Scout webhook: Method not allowed', { method: req.method })
    return res.status(405).json({ message: 'Method not allowed' })
  }

  configureFirebaseApp()

  const signature = req.headers['x-helpscout-signature']
  const event = req.headers['x-helpscout-event']
  const rawBody = await getRawBody(req)

  if (!verifySignature(signature, process.env.HELPSCOUT_WEBHOOK_SECRET, rawBody)) {
    console.warn('Help Scout webhook: Invalid webhook signature', { event })
    return res.status(401).json({ message: 'Invalid webhook signature' })
  }

  if (!relevantEvents.has(event)) {
    console.info('Help Scout webhook: Event ignored', { event })
    return res.status(200).json({ message: 'Event ignored' })
  }

  let payload = {}
  try {
    payload = rawBody ? JSON.parse(rawBody) : {}
  } catch (error) {
    console.warn('Help Scout webhook: Invalid JSON payload', { error: error.message, event })
    return res.status(400).json({ message: 'Invalid JSON payload' })
  }

  const emails = collectEmails(payload)

  if (!emails.length) {
    console.warn('Help Scout webhook: No customer email found', { event })
    return res.status(200).json({ message: 'No customer email found' })
  }

  const firestore = getFirestore()
  let team = null
  let matchedEmail = null

  for (const email of emails) {
    let userRecord = null
    try {
      userRecord = await getAuth().getUserByEmail(email)
    } catch (error) {
      continue
    }

    const userDoc = await firestore.collection('users').doc(userRecord.uid).get()

    const currentTeamId = userDoc.exists ? userDoc.data().currentTeam : null
    const teams = await getTeams(userRecord.uid)
    const userTeamIds = (teams || []).map((candidate) => candidate?.id).filter(Boolean)

    const teamCandidates = await resolveTeamCandidates({ currentTeamId, userTeamIds })

    team = selectPreferredTeam(teamCandidates)

    if (team) {
      matchedEmail = email
      break
    }
  }

  if (!team) {
    console.warn('Help Scout webhook: User has no associated team', { emails })
    return res.status(200).json({ message: 'User has no associated team' })
  }

  const metadata = buildMetadata(team)
  if (!Object.keys(metadata).length) {
    console.info('Help Scout webhook: No metadata to update', { teamId: team.id, matchedEmail })
    return res.status(200).json({ message: 'No metadata to update' })
  }

  try {
    const token = await getHelpScoutToken()
    const customerId = await findCustomerId(payload, token, matchedEmail || emails[0])

    if (!customerId) {
      console.warn('Help Scout webhook: Could not resolve Help Scout customer', {
        matchedEmail: matchedEmail || emails[0],
      })
      return res.status(200).json({ message: 'Could not resolve Help Scout customer' })
    }

    // Build JSON Patch operations for updating properties by slug
    const operations = Object.entries(metadata)
      .map(([slug, value]) => {
        if (typeof value === 'undefined' || value === null || value === '') {
          console.warn('Help Scout webhook: Property value is undefined, null, or empty', { slug })
          return null
        }
        return {
          op: 'replace',
          path: `/${slug}`,
          value: String(value),
        }
      })
      .filter(Boolean)

    if (!operations.length) {
      console.warn('Help Scout webhook: No valid metadata to update', {
        customerId,
        metadataKeys: Object.keys(metadata),
        metadataValues: metadata,
      })
      return res.status(200).json({ message: 'No valid metadata to update' })
    }

    const updateResponse = await fetch(
      `https://api.helpscout.net/v2/customers/${customerId}/properties`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operations),
      },
    )

    if (!updateResponse.ok) {
      const message = await updateResponse.text()
      console.warn('Help Scout webhook: Failed to update customer properties', {
        customerId,
        status: updateResponse.status,
        error: message,
      })
      return res.status(502).json({ message: 'Failed to update customer properties', error: message })
    }

    // Update company/organization field only if not already set
    if (team.name) {
      try {
        const customerResponse = await fetch(
          `https://api.helpscout.net/v2/customers/${customerId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        )

        if (customerResponse.ok) {
          const customerData = await customerResponse.json()
          // Check multiple possible locations for organization field
          const currentOrganization =
            customerData?._embedded?.organization?.name ||
            customerData?._embedded?.organization ||
            customerData?.organization ||
            customerData?.organizationName ||
            null

          // Log customer data structure for debugging (first time only)
          if (!currentOrganization) {
            console.info('Help Scout webhook: Customer organization check', {
              customerId,
              hasEmbedded: !!customerData?._embedded,
              embeddedKeys: customerData?._embedded ? Object.keys(customerData._embedded) : [],
              topLevelKeys: Object.keys(customerData || {}).slice(0, 10), // First 10 keys for debugging
            })
          }

          // Only update if organization is not already set
          if (!currentOrganization || (typeof currentOrganization === 'string' && currentOrganization.trim() === '')) {
            const updateCustomerResponse = await fetch(
              `https://api.helpscout.net/v2/customers/${customerId}`,
              {
                method: 'PATCH',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify([
                  {
                    op: 'replace',
                    path: '/organization',
                    value: team.name,
                  },
                ]),
              },
            )

            if (!updateCustomerResponse.ok) {
              const message = await updateCustomerResponse.text()
              console.warn('Help Scout webhook: Failed to update customer organization', {
                customerId,
                status: updateCustomerResponse.status,
                error: message,
              })
            } else {
              console.info('Help Scout webhook: Customer organization updated', {
                customerId,
                organization: team.name,
              })
            }
          } else {
            console.info('Help Scout webhook: Customer organization already set, skipping update', {
              customerId,
              currentOrganization,
            })
          }
        }
      } catch (error) {
        // Log but don't fail the request if organization update fails
        console.warn('Help Scout webhook: Error checking/updating customer organization', {
          customerId,
          error: error.message,
        })
      }
    }

    console.info('Help Scout webhook: Customer metadata updated', {
      customerId,
      matchedEmail,
      operationsCount: operations.length,
      updatedProperties: Object.keys(metadata),
    })
    return res.status(200).json({ message: 'Customer metadata updated' })
  } catch (error) {
    console.error('Help Scout webhook: Failed to update Help Scout metadata', {
      error: error.message,
      stack: error.stack,
      matchedEmail,
    })
    return res.status(500).json({ message: error?.message })
  }
}
