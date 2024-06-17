import { PostHog } from 'posthog-node'

export async function phTrack(userId, event, props = null, teamId = null) {
  const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  })

  try {
    if (!userId) return

    const args = {
      distinctId: userId,
      event,
    }

    if (props && Object.keys(props).length > 0) {
      args.properties = props
    }

    if (teamId) {
      args.groups = { team: teamId }
    }

    client.capture(args)
  } catch (error) {
    console.error(error)
  }

  await client.shutdown()
}
