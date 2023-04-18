import { } from '@/lib/dbQueries'
import { getFirestore } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { QueueSourceRegest } from '@/lib/service'
import { stripePlan } from '@/utils/helpers'

export default async function handler(request, response) {
  configureFirebaseApp()
  const firestore = getFirestore()

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

      const plan = stripePlan(teamRef.data());

      // grab next schedule date
      let nextSchedule = new Date();
      switch (plan.scheduleInterval) {
        case 'daily': nextSchedule.setTime(nextSchedule.getTime() + 24 * 60 * 60 * 1000); break;
        case 'weekly': nextSchedule.setTime(nextSchedule.getTime() + 7 * 24 * 60 * 60 * 1000); break;
        case 'monthly': nextSchedule.setTime(nextSchedule.getTime() + 30 * 24 * 60 * 60 * 1000); break;
        default:
          throw new Error(`Invalid schedule interval for plan ${plan.name}!`);
      }

      // update and reingest source
      doc.ref.update({
        'scheduled': nextSchedule,
      }).then(() => {
        QueueSourceRegest(teamId, botId, doc.id);
      })
    });
  } catch (error) {
    console.warn('Error getting document:', error);
    response.status(500).json({ message: error });
    return;
  }

  response.status(200).json({ success: true });
}