import { getAuth } from 'firebase-admin/auth'
import { sendTransactionalEmail } from '@/lib/bento'
export default async function sendEmail(
  userId,
  subject,
  htmlBody,
  personalizations = {},
) {
  //get user email from firebase auth
  let retries = 4
  do {
    try {
      let email = ''
      //check if userId is an email
      if (userId.includes('@')) {
        email = userId
      } else {
        const auth = getAuth()
        const user = await auth.getUser(userId)
        email = user.email
      }

      if (email) {
        await sendTransactionalEmail(email, subject, htmlBody, personalizations)
      } else {
        console.error('No user found for email')
      }
      return
    } catch (error) {
      console.error(error)
    }
    retries -= 1
  } while (retries > 0)
}
