import { configureFirebaseApp } from '@/config/firebase-server.config'
import userTeamCheck from '@/lib/userTeamCheck'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { getBase, getSources, getSource } from '@/lib/dbQueries'
import { stripePlan } from '@/utils/helpers'
import { bentoTrack } from '@/lib/bento'
import { sourceTypes } from '@/constants/sourceTypes.constants'

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

  let base = null
  try {
    base = await getBase(team.id, baseId)
    if (!base) {
      // doc.data() will be undefined in this case
      return res.status(404).json({ message: "baseId doesn't exist." })
    }
  } catch (error) {
    console.warn('Error getting document:', error)
    return res.status(500).json({ message: error })
  }

  //create source
  if (req.method === 'POST') {

    //TODO check plan source limit

    //data validation
    let { type, title, url, file } = req.body

    if (!type || !sourceTypes.find((sourceType) => sourceType.id === type)) {
      return res.status(400).send({ message: 'Invalid parameter "type".' })
    }

    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)
    url = url?.trim() || null
    if (sourceType.fieldUrl === 'required' && ( !url || !url.match(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/) ) ) {
      return res.status(400).send({ message: 'Invalid or missing parameter "url".' })
    }

    title = title?.trim() || null
    if (sourceType.fieldTitle === 'required' && !title) {
      return res.status(400).send({ message: 'Invalid or missing parameter "title".' })
    }

    if (sourceType.fieldFile === 'required' && !file) {
      return res.status(400).send({ message: 'Invalid or missing parameter "file".' })
    }

    //check file type, mostly for sanity
    if (file) {
      const extension = file.split('.').pop()
      if (!Object.keys(sourceType.fileTypes).includes(extension)) {
        return res.status(400).send({ message: 'Invalid file type.' })
      }
    }

    try {

      const docRef = await firestore
        .collection('teams')
        .doc(team.id)
        .collection('bases')
        .doc(baseId)
        .collection('sources')
        .add({
          createdAt: FieldValue.serverTimestamp(),
          type,
          title,
          url,
          file,
          status: 'pending',
          pages: null,
        })

      //increment sourceCounts on team
      try {
        await firestore.runTransaction(async (transaction) => {
          const teamRef = firestore.collection('teams').doc(team.id)
          const sfDoc = await transaction.get(teamRef)
          if (!sfDoc.exists) {
            throw 'Team does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(teamRef, {
            sourceCount: newSourceCount,
          })
        })

        //increment source counts on base
        await firestore.runTransaction(async (transaction) => {
          const baseRef = firestore
            .collection('teams')
            .doc(team.id)
            .collection('bases')
            .doc(baseId)
          const sfDoc = await transaction.get(baseRef)
          if (!sfDoc.exists) {
            throw 'Base does not exist!'
          }

          const newSourceCount = (sfDoc.data().sourceCount || 0) + 1
          transaction.update(baseRef, {
            sourceCount: newSourceCount,
          })
        })
      } catch (e) {
        console.warn('Increment transaction failed: ', e)
      }

      //TODO add source event to pub/sub queue for processing


      try {
        bentoTrack(userId, 'track', {
          type: 'createSource',
        })
      } catch (e) {
        console.log('Error sending bento track', e)
      }

      //done, return source object
      return res.status(201).json(await getSource(team, base, docRef.id))
    } catch (error) {
      return res.status(500).json({ message: error?.message })
    }
  } else if (req.method === 'GET') {
    const sourceLimit = parseInt(req.query.limit) || 10000
    const ascending = req.query.ascending || false
    try {
      return res.json(await getSources(team.id, base, sourceLimit, ascending))
    } catch (e) {
      return res.status(500).json({ message: e?.message })
    }
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
