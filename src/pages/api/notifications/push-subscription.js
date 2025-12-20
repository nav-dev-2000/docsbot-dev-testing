import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import crypto from 'crypto'

const hashEndpoint = (endpoint = '') =>
  crypto.createHash('sha256').update(endpoint).digest('hex')

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' })
    return
  }

  configureFirebaseApp()

  const firestore = getFirestore()

  try {
    const { uid } = await getAuthorizedUser({ req, res })
    const { subscription } = req.body || {}

    if (!subscription?.endpoint || !subscription?.keys) {
      res.status(400).json({ message: 'Missing subscription' })
      return
    }

    const userRef = firestore.collection('users').doc(uid)
    const userDoc = await userRef.get()
    const userData = userDoc.exists ? userDoc.data() : {}
    
    // Get existing subscriptions array or initialize empty array
    const existingSubscriptions = userData.pushSubscriptions || []
    
    // Check if subscription with this endpoint already exists
    const subscriptionId = hashEndpoint(subscription.endpoint)
    const existingIndex = existingSubscriptions.findIndex(
      (sub) => hashEndpoint(sub.endpoint) === subscriptionId
    )
    
    // Use regular Date for array elements (FieldValue.serverTimestamp() doesn't work nested in arrays)
    const now = new Date()
    let updatedSubscriptions
    
    if (existingIndex >= 0) {
      // Update existing subscription - preserve createdAt, update other fields
      updatedSubscriptions = [...existingSubscriptions]
      updatedSubscriptions[existingIndex] = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: existingSubscriptions[existingIndex].createdAt || now,
        updatedAt: now,
      }
    } else {
      // Add new subscription
      const subscriptionData = {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        createdAt: now,
        updatedAt: now,
      }
      updatedSubscriptions = [...existingSubscriptions, subscriptionData]
    }

    // Update user document with subscriptions array
    await userRef.set(
      {
        pushSubscriptions: updatedSubscriptions,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    )

    console.log(`Push subscription ${existingIndex >= 0 ? 'updated' : 'saved'} for user ${uid}. Total subscriptions: ${updatedSubscriptions.length}`)
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error saving push subscription', error)
    res.status(500).json({ message: error.message || 'Error saving subscription' })
  }
}
