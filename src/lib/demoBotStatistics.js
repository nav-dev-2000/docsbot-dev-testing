/**
 * Copy aggregate + history fields from a template bot onto a target bot so Reports
 * charts show realistic data (same fields as update-counts + getStats).
 */

/** Bot whose stored aggregates + history power the Reports charts. */
const DEMO_STATS_TEMPLATE_TEAM_ID =
  process.env.DEMO_STATS_TEMPLATE_TEAM_ID || 'ZrbLG98bbxZ9EFqiPvyl'
const DEMO_STATS_TEMPLATE_BOT_ID =
  process.env.DEMO_STATS_TEMPLATE_BOT_ID || 'UMADr9eozeBQ8sZKr0GW'

const DEMO_STATS_FIELDS_FROM_TEMPLATE = [
  'questionCount',
  'questionLookupCount',
  'conversationCount',
  'researchCount',
  'questionHistory',
  'questionHistoryDaily',
  'conversationHistory',
  'conversationHistoryDaily',
]

/**
 * @param {import('firebase-admin/firestore').Firestore} firestore
 * @param {import('firebase-admin/firestore').DocumentReference} targetBotRef
 */
export async function copyDemoTemplateStatisticsToBot(firestore, targetBotRef) {
  try {
    const templateSnap = await firestore
      .collection('teams')
      .doc(DEMO_STATS_TEMPLATE_TEAM_ID)
      .collection('bots')
      .doc(DEMO_STATS_TEMPLATE_BOT_ID)
      .get()

    if (!templateSnap.exists) {
      console.warn(
        'demo statistics: template bot not found',
        DEMO_STATS_TEMPLATE_TEAM_ID,
        DEMO_STATS_TEMPLATE_BOT_ID,
      )
      return
    }

    const src = templateSnap.data() || {}
    const update = {}
    for (const key of DEMO_STATS_FIELDS_FROM_TEMPLATE) {
      if (src[key] !== undefined) {
        update[key] = src[key]
      }
    }
    if (Object.keys(update).length === 0) {
      return
    }
    await targetBotRef.update(update)
  } catch (err) {
    console.warn('demo statistics: could not copy template statistics', err?.message)
  }
}
