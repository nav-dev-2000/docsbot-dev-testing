import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { routePaths } from '@/constants/routePaths.constants'

export const nonProtectedRouteRedirect = async (context) => {
  configureFirebaseApp()
  try {
    await getAuthorizedUser(context)
    return {
      redirect: {
        destination: routePaths.APP,
        permanent: false,
      },
    }
  } catch (error) {
    return { props: {} }
  }
}
