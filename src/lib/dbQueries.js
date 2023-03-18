import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'
import { stripePlan } from '@/utils/helpers'
import crypto from 'crypto'
configureFirebaseApp()
const firestore = getFirestore()

export async function getBots(team, resultLimit = 1000) {
  const querySnapshot = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .orderBy('createdAt', 'desc')
    .limit(resultLimit)
    .get()

  let bots = []
  querySnapshot.forEach(async (doc) => {
    let bot = { id: doc.id, ...doc.data() }
    bot.createdAt = bot.createdAt.toDate().toJSON() //make serializable
    bots.push(bot)
  })

  return bots
}

export async function getBot(teamId, botId) {
  const botRef = await firestore.collection('teams').doc(teamId).collection('bots').doc(botId).get()
  if (botRef.exists) {
    let bot = { id: botRef.id, ...botRef.data() }
    bot.createdAt = bot.createdAt.toDate().toJSON() //make serializable
    return bot
  } else {
    return null
  }
}

export async function getSources(teamId, bot, resultLimit = 1000, ascending = false) {
  const sourcesRef = firestore
    .collection('teams')
    .doc(teamId)
    .collection('bots')
    .doc(bot.id)
    .collection('sources')
    .orderBy('createdAt', ascending ? 'asc' : 'desc')
    .limit(resultLimit)

  //TODO add pagination
  const querySnapshot = await sourcesRef.get()
  let sources = []
  querySnapshot.forEach((doc) => {
    let source = { id: doc.id, ...doc.data() }
    //if createdAt is more than 1 hour ago and indexing is not complete, set error
    if (
      ['indexing', 'queued'].includes(source.status) &&
      source.createdAt.toDate() < new Date(Date.now() - 60 * 60 * 1000)
    ) {
      source.status = 'failed'
      source.error = 'Processing timed out, please try again'
      //update source
      firestore
        .collection('teams')
        .doc(teamId)
        .collection('bots')
        .doc(bot.id)
        .collection('sources')
        .doc(doc.id)
        .update({ status: source.status, error: source.error })
      //decrement botCounts on team
      firestore.runTransaction(async (transaction) => {
        const teamRef = firestore.collection('teams').doc(teamId)
        const sfDoc = await transaction.get(teamRef)
        if (!sfDoc.exists) {
          throw 'Team does not exist!'
        }

        const newSourceCount = Math.max(0, (sfDoc.data().sourceCount || 0) - 1)
        transaction.update(teamRef, {
          sourceCount: newSourceCount,
        })
      })

      //increment source counts on bot
      firestore.runTransaction(async (transaction) => {
        const botRef = firestore.collection('teams').doc(teamId).collection('bots').doc(bot.id)
        const sfDoc = await transaction.get(botRef)
        if (!sfDoc.exists) {
          throw 'Bot does not exist!'
        }

        const newSourceCount = Math.max(0, (sfDoc.data().sourceCount || 0) - 1)
        transaction.update(botRef, {
          sourceCount: newSourceCount,
        })
      })
    }
    source.createdAt = source.createdAt.toDate().toJSON() //make serializable
    sources.push(source)
  })

  return sources
}

export async function getSource(team, bot, sourceId) {
  const sourceRef = await firestore
    .collection('teams')
    .doc(team.id)
    .collection('bots')
    .doc(bot.id)
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

export async function getUser(userId) {
  const userRef = await firestore.collection('users').doc(userId).get()
  if (userRef.exists) {
    let user = { id: userRef.id, ...userRef.data() }
    user.createdAt = user.createdAt.toDate().toJSON() //make serializable
    user.apiKey = user.apiKey ? user.apiKeyPreview : null
    delete user.apiKeyPreview
    return user
  } else {
    return null
  }
}

export async function getTeam(teamId) {
  const teamRef = await firestore.collection('teams').doc(teamId).get()
  if (teamRef.exists) {
    let team = { id: teamRef.id, ...teamRef.data() }
    team.createdAt = team.createdAt.toDate().toJSON() //make serializable

    //use preview key if available otherwise use fake one or null
    team.openAIKey = team.openAIKey
      ? team.openAIKeyPreview
        ? team.openAIKeyPreview
        : 'sk-*...****'
      : null
    delete team.openAIKeyPreview
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
      //use preview key if available otherwise use fake one or null
      team.openAIKey = team.openAIKey
        ? team.openAIKeyPreview
          ? team.openAIKeyPreview
          : 'sk-*...****'
        : null
      delete team.openAIKeyPreview

      //delete sensitive data keys starting with stripe
      Object.keys(team).forEach((key) => {
        if (key.startsWith('stripe')) {
          delete team[key]
        }
      })
      //add stripe plan
      team.plan = stripePlan(team)

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
