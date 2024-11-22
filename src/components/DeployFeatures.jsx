import Image from 'next/image'
import Link from 'next/link'
import clsx from 'clsx'

function Row({ children }) {
  return (
    <div className="group relative">
      <div className="absolute inset-x-0 top-[1.425rem] h-0.5 bg-gradient-to-r from-white/15 from-[2px] to-[2px] bg-[length:12px_100%]" />
      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-white/5 from-[2px] to-[2px] bg-[length:12px_100%] group-last:hidden" />
      {children}
    </div>
  )
}

function Logo({ label, src, className }) {
  return (
    <div
      className={clsx(
        className,
        'absolute top-2 grid grid-cols-[1rem,1fr] items-center gap-2 whitespace-nowrap px-3 py-1',
        'rounded-full bg-gradient-to-t from-gray-800 from-50% to-gray-700 ring-1 ring-inset ring-white/10',
        '[--move-x-from:-100%] [--move-x-to:calc(100%+100cqw)] [animation-iteration-count:infinite] [animation-name:move-x] [animation-play-state:paused] [animation-timing-function:linear] group-hover:[animation-play-state:running]',
      )}
    >
      <img alt="" src={src} className="size-4" aria-hidden="true" />
      <span className="text-sm/6 font-medium text-white">{label}</span>
    </div>
  )
}

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

      <div className="relative overflow-hidden pt-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="rounded-xl shadow-2xl ring-1 ring-white/10 bg-slate-900">
            <div aria-hidden="true" className="relative h-[500px] lg:h-[600px] overflow-hidden group">
              <div className="absolute inset-0 top-8 z-10 flex items-center justify-center">
                <div
                  className="absolute inset-0 backdrop-blur-md"
                  style={{
                    maskImage: `url('data:image/svg+xml,<svg width="96" height="96" viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="96" height="96" rx="12" fill="black"/></svg>')`,
                    maskPosition: 'center',
                    maskRepeat: 'no-repeat',
                  }}
                />
                <div className="relative flex size-24 items-center justify-center rounded-xl bg-gradient-to-t from-white/5 to-white/25 shadow outline outline-offset-[-5px] outline-white/5 ring-1 ring-inset ring-white/10 before:absolute before:inset-0 before:rounded-xl group-hover:before:animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] before:opacity-75 before:bg-white/10">
                  <Image
                    src="/docsbot-icon-sq.svg"
                    alt="DocsBot Icon"
                    width={72}
                    height={72}
                  />
                </div>
              </div>
              <div className="group absolute inset-0 grid grid-cols-1 pt-8 [container-type:inline-size]">
                <Row>
                  <Logo
                    label="Loom"
                    src="/images/logo-timeline/loom.svg"
                    className="[animation-delay:-26s] [animation-duration:30s]"
                  />
                  <Logo
                    label="Gmail"
                    src="/images/logo-timeline/gmail.svg"
                    className="[animation-delay:-8s] [animation-duration:30s]"
                  />
                  <Logo
                    label="Intercom"
                    src="/images/logo-timeline/intercom.svg"
                    className="[animation-delay:-16s] [animation-duration:30s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="Asana"
                    src="/images/logo-timeline/asana.svg"
                    className="[animation-delay:-49s] [animation-duration:55s]"
                  />
                  <Logo
                    label="Microsoft Teams"
                    src="/images/logo-timeline/microsoft-teams.svg"
                    className="[animation-delay:-5s] [animation-duration:55s]"
                  />
                  <Logo
                    label="Zendesk"
                    src="/images/logo-timeline/zendesk.svg"
                    className="[animation-delay:-28s] [animation-duration:55s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="Google Calendar"
                    src="/images/logo-timeline/google-calendar.svg"
                    className="[animation-delay:-10s] [animation-duration:40s]"
                  />
                  <Logo
                    label="Google Drive"
                    src="/images/logo-timeline/google-drive.svg"
                    className="[animation-delay:-32s] [animation-duration:40s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="Basecamp"
                    src="/images/logo-timeline/basecamp.svg"
                    className="[animation-delay:-35s] [animation-duration:45s]"
                  />
                  <Logo
                    label="Discord"
                    src="/images/logo-timeline/discord.svg"
                    className="[animation-delay:-23s] [animation-duration:45s]"
                  />
                  <Logo
                    label="Airtable"
                    src="/images/logo-timeline/airtable.svg"
                    className="[animation-delay:-5s] [animation-duration:45s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="Hubspot"
                    src="/images/logo-timeline/hubspot.svg"
                    className="[animation-delay:-55s] [animation-duration:60s]"
                  />
                  <Logo
                    label="Slack"
                    src="/images/logo-timeline/slack.svg"
                    className="[animation-delay:-30s] [animation-duration:60s]"
                  />
                  <Logo
                    label="Google Docs"
                    src="/images/logo-timeline/docs.svg"
                    className="[animation-delay:-5s] [animation-duration:60s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="Google Sheets"
                    src="/images/logo-timeline/sheets.svg"
                    className="[animation-delay:-1s] [animation-duration:40s]"
                  />
                  <Logo
                    label="Adobe Creative Cloud"
                    src="/images/logo-timeline/adobe-creative-cloud.svg"
                    className="[animation-delay:-15s] [animation-duration:40s]"
                  />
                  <Logo
                    label="Zoom"
                    src="/images/logo-timeline/zoom.svg"
                    className="[animation-delay:-28s] [animation-duration:40s]"
                  />
                </Row>
                <Row>
                  <Logo
                    label="LinkedIn"
                    src="/images/logo-timeline/linkedin.svg"
                    className="[animation-delay:-15s] [animation-duration:35s]"
                  />
                  <Logo
                    label="Zapier"
                    src="/images/logo-timeline/zapier.svg"
                    className="[animation-delay:-36s] [animation-duration:35s]"
                  />
                </Row>
              </div>
            </div>
          </div>
          <div aria-hidden="true" className="relative">
            <div className="absolute -inset-x-20 bottom-0 bg-gradient-to-t from-gray-900 pt-[5%]" />
          </div>
        </div>
      </div>

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
