import { } from '@/lib/dbQueries'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { QueueSourceRegest } from '@/lib/service'
import { checkSourceScheduledFromInterval } from '@/utils/helpers'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

  // this is a public endpoint, however our 'cron' path is protected by a key; TODO: can this be an env var?
  if (request.query.key !== 'iuefhisue24182') {
    response.status(404).end();
    return;
  }

  try {
    // select scheduled sources based on current time
    const sourceRef = await firestore.collectionGroup('sources').where('scheduled', '<=', new Date()).get();
    sourceRef.forEach((doc) => {
      const source = doc.data();
      console.log(source);

      const botRef = doc.ref.parent.parent;
      const botId = botRef.id;

      const teamRef = botRef.parent.parent;
      const teamId = teamRef.id;

      try {
        // grab next schedule date
        const nextSchedule = checkSourceScheduledFromInterval(team, source.scheduleInterval)

        // update and reingest source
        doc.ref.update({
          'scheduled': nextSchedule,
        }).then(() => {
          QueueSourceRegest(teamId, botId, doc.id);
        })
      } catch (error) {
        // ignore reingestion errors
        return
      }
    });
  } catch (error) {
    console.warn('Error getting document:', error);
    response.status(500).json({ message: error });
    return;
  }

  response.status(200).json({ success: true });
}