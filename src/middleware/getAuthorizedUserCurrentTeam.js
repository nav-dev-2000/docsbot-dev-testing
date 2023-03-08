import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { routePaths } from '@/constants/routePaths.constants'
import { getAuthorizedUser } from './getAuthorizedUser'
import { isSuperAdmin } from '@/utils/helpers'

export const getAuthorizedUserCurrentTeam = async (context) => {
  configureFirebaseApp()
  try {
    const { uid, name } = await getAuthorizedUser(context)
    const userRef = await getFirestore().collection('users').doc(uid).get()
    const { currentTeam } = userRef.data()

    if (userRef.exists) {
      //check if user has access to team
      const teamRef = await getFirestore().collection('teams').doc(currentTeam).get()
      if (teamRef.exists && (teamRef.data().roles[uid] || isSuperAdmin(uid))) {
        let team = { id: currentTeam, ...teamRef.data() }
        team.createdAt = team.createdAt.toDate().toJSON() //make serializable

        return {
          props: {
            team,
            userId: uid,
          },
        }
      }
    }

    context.res.statusCode = 400
    return {
      props: {
        error: 'This user does not belong to a team',
      },
    }
  } catch (error) {
    // If session verification fails or token expires (auth/session-cookie-expire),
    // then redirect back to login.
    console.error(error)
    return {
      redirect: {
        destination: routePaths.LOGIN,
        permanent: false,
      },
    }
  }
}
