const Mixpanel = require('mixpanel')
const mixpanel = Mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN);

export function mpTrack(userId, event, props = {}) {
    //get user email from firebase auth
    try {
      if (!userId) return
  
      mixpanel.track(event, {
        'distinct_id': userId,
        ...props
      })
    } catch (error) {
      console.error(error)
    }
  }