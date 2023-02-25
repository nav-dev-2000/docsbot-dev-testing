import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBase, getSource } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'

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
  const { team } = check
  const { baseId, sourceId } = req.query

  let base = null
  try {
    base = await getBase(team.id, baseId)
    if (!base) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "baseId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error?.message })
  }

  if (req.method === 'PUT') {
    return res.status(400).json({ message: 'Source update not implemented' })
  } else if (req.method === 'DELETE') {
    //fail if base is indexing
    if (['indexing'].includes(base.status)) {
      return res
        .status(409)
        .json({ message: 'Base is currently indexing, you can delete sources later.' })
    }

    //delete source from db
    try {
      await firestore.collection('teams').doc(team.id).collection('bases').doc(baseId).collection('sources').doc(sourceId).delete()
      return res.status(200).json({ message: 'Source deleted successfully' })
    } catch (error) {
      console.warn('Error deleting source doc:', error)
      return res.status(500).json({ message: error?.message })
    }
    
  } else if (req.method === 'GET') {
    try {
      const source = await getSource(team, base, sourceId)
      if (source) {
        return res.json(source)
      } else {
        return res.status(404).json({ message: "sourceId doesn't exist." })
      }
    } catch (error) {
      console.warn('Error getting document:', error)
      return res.status(500).json({ message: error?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
