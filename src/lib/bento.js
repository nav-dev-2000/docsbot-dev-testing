import { getAuth } from 'firebase-admin/auth'
import { Analytics } from '@bentonow/bento-node-sdk'

export const bento = new Analytics({
  authentication: {
    publishableKey: process.env.BENTO_PUB_KEY,
    secretKey: process.env.BENTO_SECRET_KEY,
  },
  logErrors: false, // Set to true to see the HTTP errors logged
  siteUuid: process.env.NEXT_PUBLIC_BENTO_SITE,
})

export async function bentoTrack(userId, command, data) {
  // Check if required environment variables are set
  if (!process.env.BENTO_PUB_KEY || !process.env.BENTO_SECRET_KEY || !process.env.NEXT_PUBLIC_BENTO_SITE) {
    console.warn('Skipping Bento tracking: Missing required environment variables');
    return;
  }

  try {
    if (!data.email) {
      if (!userId) return
      const auth = getAuth()
      const user = await auth.getUser(userId)
      if (!user?.email) return
      data.email = user.email
    }

    //send to bento
    bento.V1[command](data)
      .then((result) => console.log(result))
      .catch((error) => console.error(error))
  } catch (error) {
    console.error(error)
  }
}

//returns uid of team owner
export function teamOwner(team) {
  return Object.keys(team.roles).find((key) => team.roles[key] === 'owner')
}

export async function sendTransactionalEmail(to, subject, htmlBody, personalizations = {}) {
  if (!process.env.NEXT_PUBLIC_BENTO_SITE) {
    console.error('NEXT_PUBLIC_BENTO_SITE environment variable is not set');
    return;
  }

  try {
    const response = await bento.V1.Batch.sendTransactionalEmails({
      site_uuid: process.env.NEXT_PUBLIC_BENTO_SITE,
      emails: [
        {
          to,
          from: 'transactional@docsbot.ai',
          subject,
          html_body: htmlBody,
          transactional: true,
          personalizations
        }
      ]
    });

    console.log('Transactional email sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending transactional email:', error);
    throw error;
  }
}
