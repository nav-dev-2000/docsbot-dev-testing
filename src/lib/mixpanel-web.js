// Remove { Dict, Query } if not using TypeScript
import mixpanel from 'mixpanel-browser'

const isProd = process.env.NODE_ENV === 'production'

mixpanel.init(process.env.NEXT_PUBLIC_MIXPANEL_TOKEN, {
  debug: !isProd,
  persistence: 'localStorage',
  ignore_dnt: true,
  api_host: 'https://docsbot.ai/mp',
})

export const Mixpanel = {
  identify: (id) => {
    mixpanel.identify(id)
  },

  reset: () => {
    mixpanel.reset()
  },

  track: (name, props) => {
    mixpanel.track(name, props)
  },

  pageview: () => {
    mixpanel.track_pageview()
  },
}
