import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import crypto from 'crypto'
configureFirebaseApp()
const firestore = getFirestore()

export async function getBases(team, resultLimit = 1000) {
  const querySnapshot = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bases')
    .orderBy('createdAt', 'desc')
    .limit(resultLimit)
    .get()

  let bases = []
  querySnapshot.forEach(async (doc) => {
    let base = { id: doc.id, ...doc.data() }
    base.createdAt = base.createdAt.toDate().toJSON() //make serializable
    bases.push(base)
  })

  return bases
}

export async function getBase(teamId, baseId) {
  const baseRef = await firestore.collection('teams').doc(teamId).collection('bases').doc(baseId).get()
  if (baseRef.exists) {
    let base = { id: baseRef.id, ...baseRef.data() }
    base.createdAt = base.createdAt.toDate().toJSON() //make serializable
    return base
  } else {
    return null
  }
}

export async function getSources(teamId, base, resultLimit = 1000, ascending = false) {
  let sourcesRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bases')
    .doc(base.id)
    .collection('sources')
    .orderBy('createdAt', ascending ? 'asc' : 'desc')
    .limit(resultLimit)

  //TODO add pagination
  const querySnapshot = await sourcesRef.get()
  let sources = []
  querySnapshot.forEach((doc) => {
    let source = { id: doc.id, ...doc.data() }
    source.createdAt = source.createdAt.toDate().toJSON() //make serializable
    sources.push(source)
  })

  return sources
}

export async function getSource(team, base, sourceId) {
  const sourceRef = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bases')
    .doc(base.id)
    .collection('sources')
    .doc(sourceId)
    .get()
  if (sourceRef.exists) {
    let source = { id: sourceRef.id, ...sourceRef.data() }
    source.createdAt = source.createdAt.toDate().toJSON() //make serializable
    return source
  } else {
    return null
  }
}

export async function getTeam(teamId) {
  const teamRef = await firestore.collection('teams').doc(teamId).get()
  if (teamRef.exists) {
    let team = { id: teamRef.id, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //make serializable
    return team
  } else {
    return null
  }
}

export async function getTeams(userId) {
  //get teams for user list
  let teams = []
  try {
    const teamsSnapshot = await firestore
      .collection('teams')
      .where('roles.' + userId, '!=', null)
      .get()
    teamsSnapshot.forEach((doc) => {
      let team = { id: doc.id, ...doc.data() }
      team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string
      teams.push(team)
    })
  } catch (error) {
    console.warn('Error getting team:', error)
  }

  return teams
}

export async function getTeamUsers(teamId) {
  const users = []

  const teamRef = await firestore.collection('teams').doc(teamId).get()
  if (teamRef.exists) {
    let team = { id: teamRef.id, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //convert to ISO string

    let query = []
    for (const [userId, role] of Object.entries(team.roles)) {
      query.push({ uid: userId })
    }

    try {
      const profiles = await getAuth().getUsers(query)

      profiles.users.forEach((userRecord) => {
        let { uid, displayName, email, photoURL } = userRecord
        displayName = displayName || 'No Name'
        const hash = crypto.createHash('md5').update(email).digest('hex')
        photoURL = photoURL || `https://www.gravatar.com/avatar/${hash}?d=mp`
        users.push({ uid, displayName, email, photoURL, role: team.roles[uid] })
      })
    } catch (error) {
      console.log('Error fetching user data:', error)
    }
  }

  return users
}
