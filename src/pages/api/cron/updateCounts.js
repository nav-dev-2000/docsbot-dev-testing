import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getQuestionCountTransaction } from '@/lib/dbQueries'

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

      try {
        // make transaction
        await firestore.runTransaction(async (transaction) => {
          const botsSnapshot = await transaction.get(teamDoc.ref.collection('bots'));
          const countPromises = botsSnapshot.docs.map(async (botDoc) => {
            const questionCount = await getQuestionCountTransaction(transaction, teamDoc.id, botDoc.id);

            // grab the # of source pages
            const sourcesSnapshot = await transaction.get(botDoc.ref.collection('sources'));
            const sourcePromises = sourcesSnapshot.docs.map(async (sourceDoc) => {
              const source = sourceDoc.data();
              return source.pageCount;
            });

            // wait for each callback to complete, then take and sum the results
            const sourceCounts = await Promise.all(sourcePromises);
            const sourceCountTotal = sourceCounts.reduce((accumulator, count) => accumulator + count, 0);

            // update bot count
            botDoc.ref.update({
              'questionCount': questionCount,
              'pageCount': sourceCountTotal,
            });
            return {questionCount, sourceCountTotal};
          });

          // wait for each callback to complete, then take and sum the results
          const botCounts = await Promise.all(countPromises);
          const {questionCount: questionTotal, sourceCountTotal: sourcePageTotal} = botCounts.reduce(
            ({questionCount: questionAccumulator, sourceCountTotal: sourceAccumulator}, {questionCount, sourceCountTotal}) => {
              return {questionCount: (questionCount + questionAccumulator), sourceCountTotal: (sourceCountTotal + sourceAccumulator)}
            },
            {questionCount: 0, sourceCountTotal: 0}
          );

          console.log("team", teamDoc.id, "has", questionTotal, "questions,", sourcePageTotal, "source pages");

          // update team count && needsUpdate
          transaction.update(teamDoc.ref, {
            'questionCount': questionTotal,
            'pageCount': sourcePageTotal,
            'needsUpdate': false,
          });
        });
      } catch (error) {
        console.warn(`Error updating team ${teamDoc.id} counts:`, error);
        response.status(500).json({ message: error });
        return;
      }
    });

    await Promise.all(teamsPromises);
  } catch (error) {
    console.warn('Error updating counts:', error);
    response.status(500).json({ message: error });
    return;
  }

  response.status(200).json({ success: true });
}
