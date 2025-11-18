import Link from 'next/link'
import AnimatedTimeline from './AnimatedTimeline'

const timelineIcons = [
  [
    {
      label: "Loom",
      src: "/images/logo-timeline/loom.svg",
      className: "[animation-delay:-26s] [animation-duration:30s]"
    },
    {
      label: "Gmail",
      src: "/images/logo-timeline/gmail.svg",
      className: "[animation-delay:-8s] [animation-duration:30s]"
    },
    {
      label: "Intercom",
      src: "/images/logo-timeline/intercom.svg",
      className: "[animation-delay:-16s] [animation-duration:30s]"
    }
  ],
  [
    {
      label: "Asana",
      src: "/images/logo-timeline/asana.svg",
      className: "[animation-delay:-49s] [animation-duration:55s]"
    },
    {
      label: "Microsoft Teams",
      src: "/images/logo-timeline/microsoft-teams.svg",
      className: "[animation-delay:-5s] [animation-duration:55s]"
    },
    {
      label: "Zendesk",
      src: "/images/logo-timeline/zendesk.svg",
      className: "[animation-delay:-28s] [animation-duration:55s]"
    }
  ],
  [
    {
      label: "Google Calendar",
      src: "/images/logo-timeline/google-calendar.svg",
      className: "[animation-delay:-10s] [animation-duration:40s]"
    },
    {
      label: "Google Drive",
      src: "/images/logo-timeline/google-drive.svg",
      className: "[animation-delay:-32s] [animation-duration:40s]"
    }
  ],
  [
    {
      label: "Basecamp",
      src: "/images/logo-timeline/basecamp.svg",
      className: "[animation-delay:-35s] [animation-duration:45s]"
    },
    {
      label: "Discord",
      src: "/images/logo-timeline/discord.svg",
      className: "[animation-delay:-23s] [animation-duration:45s]"
    },
    {
      label: "Airtable",
      src: "/images/logo-timeline/airtable.svg",
      className: "[animation-delay:-5s] [animation-duration:45s]"
    }
  ],
  [
    {
      label: "Hubspot",
      src: "/images/logo-timeline/hubspot.svg",
      className: "[animation-delay:-55s] [animation-duration:60s]"
    },
    {
      label: "Slack",
      src: "/images/logo-timeline/slack.svg",
      className: "[animation-delay:-30s] [animation-duration:60s]"
    },
    {
      label: "Google Docs",
      src: "/images/logo-timeline/docs.svg",
      className: "[animation-delay:-5s] [animation-duration:60s]"
    }
  ],
  [
    {
      label: "Google Sheets",
      src: "/images/logo-timeline/sheets.svg",
      className: "[animation-delay:-1s] [animation-duration:40s]"
    },
    {
      label: "Zoom",
      src: "/images/logo-timeline/zoom.svg",
      className: "[animation-delay:-28s] [animation-duration:40s]"
    }
  ],
  [
    {
      label: "LinkedIn",
      src: "/images/logo-timeline/linkedin.svg",
      className: "[animation-delay:-15s] [animation-duration:35s]"
    },
    {
      label: "Zapier",
      src: "/images/logo-timeline/zapier.svg",
      className: "[animation-delay:-36s] [animation-duration:35s]"
    }
  ]
]

export default function DeployFeatures() {
  return (
    <div className="bg-gray-900 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-5xl sm:text-center">
          <h2 className="text-md/5 font-mono font-semibold uppercase tracking-widest text-cyan-400">Deploy Anywhere</h2>
          <p className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-white sm:text-balance sm:text-5xl">
            Powerful Integrations and APIs
          </p>
          <p className="mt-6 text-lg/8 text-gray-300">
            Easily add your custom DocsBot anywhere with our flexible widgets and powerful APIs. Embed it on your website, WordPress,
            app, or integrate with Slack, Microsoft Teams, ticketing systems—any platform you use.
          </p>
        </div>
      </div>

      <AnimatedTimeline icons={timelineIcons} />

      {/* New CTA section */}
      <div className="mt-12 flex flex-col items-center">
          <div className="mt-8 flex gap-4">
            <Link
              href="/register"
              className="bg-animation rounded-lg bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
            >
              Integrate with 7,000+ Apps
            </Link>
          </div>
        </div>
    </div>
  )
}
