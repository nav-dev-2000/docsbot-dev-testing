import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { getBase } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { bentoTrack } from '@/lib/bento'

export default async function handler(req, res) {
  configureFirebaseApp()
  const firestore = getFirestore()

  //check if user has access to team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(500).json({ message: error?.message })
  }
  const { userId, team } = check
  const { baseId } = req.query

  if (req.method === 'PUT') {
    return res.status(400).json({ message: 'Base update not implemented' })
  } else if (req.method === 'DELETE') {
    const base = await getBase(team.id, baseId)
    //delete base from db
    try {
      // Delete all sources for base
      const querySnapshot = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bases')
        .doc(baseId)
        .collection('sources')
        .get()
      // Once we get the results, begin a batch
      const batch = firestore.batch()
      querySnapshot.forEach(function (doc) {
        // For each doc, add a delete operation to the batch
        batch.delete(doc.ref)
      })
      // Commit the batch
      await batch.commit()

      //delete base
      await firestore.collection('teams').doc(team.id).collection('bases').doc(baseId).delete()

      //decrement baseCounts on team
      await firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(team.id)
        const sfDoc = await transaction.get(teamRef)
        if (!sfDoc.exists) {
          throw 'Team does not exist!'
        }

        const newBaseCount = Math.max(0, (sfDoc.data().baseCount || 0) - 1)
        const newSourceCount = Math.max(0, (sfDoc.data().sourceCount || 0) - 1)
        transaction.update(teamRef, {
          baseCount: newBaseCount,
          sourceCount: newSourceCount,
        })
      })

      //delete all base data from bucket
      const bucket = getStorage().bucket('gs://customchat-base.appspot.com')
      await bucket.deleteFiles({prefix: `teams/${team.id}/bases/${baseId}`})

      try {
        bentoTrack(userId, 'track', {
          type: 'deleteBase',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      return res.status(200).json({ message: 'Base deleted' })
    } catch (error) {
      console.warn('Error deleting base:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    try {
      const base = await getBase(team.id, baseId)
      if (base) {
        return res.json(base)
      } else {
        // doc.data() will be undefined in this case
        return res.status(404).json({ message: "baseId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
