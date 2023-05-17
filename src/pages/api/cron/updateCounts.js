import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getQuestionCount } from '@/lib/dbQueries'

export default async function handler(request, response) {
  configureFirebaseApp();
  const firestore = getFirestore();

  if (!request.query.key || request.query.key !== 'aowidjaowd3721') {
    response.status(404).end();
    return;
  }

  console.log("cron updateCounts started!");

  try {
    const teamsSnapshot = await firestore.collection('teams').where('needsUpdate', '==', true).get();

    const teamsPromises = teamsSnapshot.docs.map(async (teamDoc) => {
      console.log("team", teamDoc.id, "is scheduled to have the counts updated...");

      const botsSnapshot = await teamDoc.ref.collection('bots').get();
      const countPromises = botsSnapshot.docs.map(async (botDoc) => {
        const count = await getQuestionCount(teamDoc.id, botDoc.id);
        return count;
      });

      // wait for each callback to complete, then take and sum the results
      const botCounts = await Promise.all(countPromises);
      const countTotal = botCounts.reduce((accumulator, count) => accumulator + count, 0);

      console.log("team", teamDoc.id, "has", countTotal, "questions");

      // update team count && needsUpdate
      teamDoc.ref.update({
        'questionCount': countTotal,
        'needsUpdate': false
      });
    });

    await Promise.all(teamsPromises);
  } catch (error) {
    console.warn('Error getting document:', error);
    response.status(500).json({ message: error });
    return;
  }

  response.status(200).json({ success: true });
}
