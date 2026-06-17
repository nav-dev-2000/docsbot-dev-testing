import 'focus-visible'
import '@/styles/tailwind.css'
import '@/styles/overrides.css'
import Script from 'next/script'
import { useEffect, useMemo, useRef } from 'react'
import { useRouter, Router } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import { Layout } from '@/components/docs/Layout'
import '@fortawesome/fontawesome-svg-core/styles.css'
import { HeadlessApp } from '@headstartwp/next'
import { Link } from '@/components/blog/Link'
import { DefaultSeo } from 'next-seo'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { stripePlan } from '@/utils/helpers'

import { setHeadstartWPConfig } from '@headstartwp/core/utils'
import headlessConfig from '../../headless.config.js'

setHeadstartWPConfig(headlessConfig)

function getNodeText(node) {
  let text = ''
  for (let child of node.children ?? []) {
    if (typeof child === 'string') {
      text += child
    }
    text += getNodeText(child)
  }
  return text
}

function collectHeadings(nodes, slugify = slugifyWithCounter()) {
  let sections = []

  for (let node of nodes) {
    if (node.name === 'h2' || node.name === 'h3') {
      let title = getNodeText(node)
      if (title) {
        let id = slugify(title)
        node.attributes.id = id
        if (node.name === 'h3') {
          if (!sections[sections.length - 1]) {
            throw new Error('Cannot add `h3` to table of contents without a preceding `h2`')
          }
          sections[sections.length - 1].children.push({
            ...node.attributes,
            title,
          })
        } else {
          sections.push({ ...node.attributes, title, children: [] })
        }
      }
    }

    sections.push(...collectHeadings(node.children ?? [], slugify))
  }

  return sections
}

function getPlanStatusLabel(team, plan) {
  if (!team) {
    return 'free'
  }

  const status = team?.stripeSubscriptionStatus
  if (!status) {
    return plan?.id === 'free' ? 'free' : 'inactive'
  }

  if (['past_due', 'incomplete'].includes(status)) {
    return 'overdue'
  }

  if (['canceled', 'cancelled', 'unpaid'].includes(status)) {
    return 'cancelled'
  }

  return status
}

function escapeInlineScript(value) {
  return value
    .replace(/[<>]/g, (char) => (char === '<' ? '\\u003c' : '\\u003e'))
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [user, loading] = useAuthState(auth)

  // eslint-disable-next-line react/prop-types, no-unused-vars
  const { fallback = {}, themeJson = {}, ...props } = pageProps
  const currentTeam = pageProps?.team
  const currentTeamId =
    currentTeam?.id ||
    (typeof pageProps?.teamId === 'string' ? pageProps.teamId : null)
  const currentTeamGroupProperties = useMemo(() => {
    if (!currentTeam) {
      return { team_id: currentTeamId }
    }

    const plan = stripePlan(currentTeam)
    return {
      name: currentTeam.name,
      team_id: currentTeam.id,
      plan: plan.name,
      plan_id: plan.id,
      plan_status: getPlanStatusLabel(currentTeam, plan),
    }
  }, [currentTeam, currentTeamId])
  const lastPostHogGroupSignature = useRef(null)

  const docsBotIdentify = useMemo(() => {
    if (!user) {
      return null
    }

    const identify = {}

    if (user.email) {
      identify.email = user.email
    }

    if (user.displayName) {
      identify.name = user.displayName
    }

    if (currentTeam?.id) {
      const plan = stripePlan(currentTeam)
      identify.teamSwitchUrl = `https://docsbot.ai/app/team?switchTeam=${currentTeam.id}`
      identify.planLevel = plan.name
      identify.planStatus = getPlanStatusLabel(currentTeam, plan)
    }

    return Object.keys(identify).length ? identify : null
  }, [user, currentTeam])

  const docsBotIdentifyConfig = docsBotIdentify
    ? `identify: ${escapeInlineScript(JSON.stringify(docsBotIdentify))},`
    : ''

  useEffect(() => {
    // Check that PostHog is client-side (used to handle Next.js SSR)
    if (
      typeof window !== 'undefined' &&
      !router.pathname.startsWith('/ask/')
    ) {
      const isIframe = router.pathname.startsWith('/iframe/')
      
      if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
        posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
          api_host:
            process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
              ? 'https://docsbot.ai/ph'
              : process.env.NEXT_PUBLIC_POSTHOG_HOST,
          ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://eu.i.posthog.com',
          persistence: 'localStorage',
          disable_session_recording: true,
          capture_pageleave: false,
          // Disable automatic pageview tracking for iframe routes
          capture_pageview: !isIframe,
          // Disable heatmaps for iframe routes
          enable_heatmaps: !isIframe,
          // Verbose PostHog logging: opt-in via NEXT_PUBLIC_POSTHOG_DEBUG=1 or true
          loaded: (ph) => {
            const raw = process.env.NEXT_PUBLIC_POSTHOG_DEBUG
            const enabled =
              raw === '1' ||
              (typeof raw === 'string' && raw.toLowerCase() === 'true')
            ph.debug(enabled)
          },
        })
      }
    }
  }, [router.pathname])

  useEffect(() => {
    const handleRouteChange = (url) => {
      if (window.bento !== undefined) {
        if (user) {
          window.bento.identify(user.email)
        }
        window.bento.view()
      }
      // Don't capture pageviews for iframe routes
      if (!url.startsWith('/iframe/')) {
        posthog?.capture('$pageview')
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events, posthog, user])

  useEffect(() => {
    if (user) {
      // Identify sends an event, so you want may want to limit how often you call it
      if (!posthog?._isIdentified()) {
        posthog?.identify(user.uid, {
          email: user.email,
          name: user.displayName,
        })
      }
    }
  }, [posthog, user])

  useEffect(() => {
    if (!user || !posthog || !currentTeamId) return

    const groupSignature = JSON.stringify({
      key: currentTeamId,
      properties: currentTeamGroupProperties,
    })

    if (lastPostHogGroupSignature.current === groupSignature) return

    posthog.group('team', currentTeamId, currentTeamGroupProperties)
    lastPostHogGroupSignature.current = groupSignature
  }, [currentTeamGroupProperties, currentTeamId, user])

  useEffect(() => {
    if (user && 'Beacon' in window && Beacon !== undefined && typeof Beacon === 'function') {
      //only identify if not already in the queue
      if (Beacon.readyQueue.find((obj) => obj.method === 'identify')) {
        return
      }

      const ident = {
        email: user.email,
      }
      if (user.displayName) {
        ident.name = user.displayName
      }
      Beacon('identify', ident)
    }
  }, [user])

  if (router.pathname.startsWith('/documentation/developer')) {
    let title = pageProps.markdoc?.frontmatter.title

    let pageTitle =
      pageProps.markdoc?.frontmatter.pageTitle ||
      `${pageProps.markdoc?.frontmatter.title} - DocsBot Documentation`

    let description = pageProps.markdoc?.frontmatter.description

    let tableOfContents = pageProps.markdoc?.content
      ? collectHeadings(pageProps.markdoc.content)
      : []

    return (
      <PostHogProvider client={posthog}>
        <DefaultSeo
          title={pageTitle}
          description={description}
          canonical={'https://docsbot.ai' + router.asPath.split('?')[0]}
          openGraph={{
            type: 'website',
            locale: 'en_US',
            url: 'https://docsbot.ai' + router.asPath.split('?')[0],
            siteName: 'DocsBot',
            images: [
              {
                url: 'https://docsbot.ai/images/og/main.jpeg',
                width: 1200,
                height: 630,
                alt: 'DocsBot',
                type: 'image/jpeg',
              },
            ],
          }}
          twitter={{
            handle: '@docsbotai',
            site: '@docsbotai',
            cardType: 'summary_large_image',
          }}
          additionalLinkTags={[
            {
              rel: 'apple-touch-icon',
              href: '/apple-touch-icon.png',
              sizes: '180x180',
            },
            {
              rel: 'manifest',
              href: '/site.webmanifest',
            },
            {
              rel: 'icon',
              type: 'image/png',
              sizes: '16x16',
              href: '/favicon-16x16.png',
            },
            {
              rel: 'icon',
              type: 'image/png',
              sizes: '32x32',
              href: '/favicon-32x32.png',
            },
            {
              rel: 'mask-icon',
              href: '/safari-pinned-tab.svg',
              color: '#5bbad5',
            },
          ]}
          additionalMetaTags={[
            {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1.0, user-scalable=no',
            },
            {
              charSet: 'utf-8',
            },
            {
              name: 'msapplication-TileColor',
              content: '#da532c',
            },
            {
              name: 'theme-color',
              content: '#ffffff',
            },
          ]}
        />
        <Layout title={title} tableOfContents={tableOfContents}>
          <Component {...pageProps} />
        </Layout>
        <Script id="helpscout" strategy="lazyOnload">
          {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}
        </Script>
        <Script id="docsbot" strategy="lazyOnload">
              {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};`}
        </Script>
        {!loading && (
          <Script id="docsbot-init" strategy="lazyOnload">
              {`DocsBotAI.init({id: "ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW",options: {useImageUpload: true,contextItems: 12,hideSources: ['helpscout']},${docsBotIdentifyConfig}supportCallback: function (event, history, metadata, ticket) {
  event.preventDefault();
  DocsBotAI.unmount();
  Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2');
  var beaconIdent = {};
  if (metadata.name) beaconIdent.name = metadata.name;
  if (metadata.email) beaconIdent.email = metadata.email;
  if (Object.keys(beaconIdent).length) Beacon('identify', beaconIdent);
  let message = ticket.message;
  if (metadata.conversationUrl) {
    message += "\\n\\nConversation: " + metadata.conversationUrl;
  }
  Beacon('open');
  if (ticket) {
    // Add ticket subject and message to Beacon
    Beacon('prefill', {
      subject: ticket.subject,
      text: message
    });          
  }         
},});`}
          </Script>
        )}
        {process.env.NEXT_PUBLIC_BENTO_SITE && (
          <Script
            id="bento-script"
            src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
            strategy="afterInteractive"
          />
        )}
        <Script id="firstpromoter1">
          {`(function(w){w.fpr=w.fpr||function(){w.fpr.q = w.fpr.q||[];w.fpr.q[arguments[0]=='set'?'unshift':'push'](arguments);};})(window);
fpr("init", {cid:"08y4co6f"}); 
if (!/google\.|bing\.|yahoo\.|baidu\.|duckduckgo\.|yandex\./i.test(document.referrer)) {
  fpr("click");
}`}
        </Script>
        <Script
          id="firstpromoter2"
          strategy="afterInteractive"
          src="https://cdn.firstpromoter.com/fpr.js"
        />
        {/* <Script src="https://www.googletagmanager.com/gtag/js?id=AW-412141971" />
        <Script id="gtag">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-412141971');
          `}
        </Script> */}
      </PostHogProvider>
    )
  }

  return (
    <PostHogProvider client={posthog}>
      <HeadlessApp
        pageProps={pageProps}
        settings={{
          // instruct the framework to use Next.js link component or your own version
          linkComponent: Link,
        }}
        swrConfig={{
          /**
           * Setting this to true will refetch content whenever the tab is refocused
           */
          revalidateOnFocus: false,
          /**
           * Settings this to true will refetch content whenever the connection is reestablished
           */
          revalidateOnReconnect: false,
          /**
           * Setting this to true will refetch content after initial load
           */
          revalidateOnMount: false,
        }}
        useYoastHtml={true}
      >
        <DefaultSeo
          title="DocsBot - AI Agents for Business | AI Customer Support & Team Automation"
          description="Build AI agents that combine trusted knowledge with real actions for customers and teams across your business tools and workflows."
          canonical={'https://docsbot.ai' + router.asPath.split('?')[0]}
          openGraph={{
            type: 'website',
            locale: 'en_US',
            url: 'https://docsbot.ai' + router.asPath.split('?')[0],
            siteName: 'DocsBot',
            images: [
              {
                url: 'https://docsbot.ai/images/og/main.jpeg',
                width: 1200,
                height: 630,
                alt: 'DocsBot',
                type: 'image/jpeg',
              },
            ],
          }}
          twitter={{
            handle: '@docsbotai',
            site: '@docsbotai',
            cardType: 'summary_large_image',
          }}
          additionalLinkTags={[
            {
              rel: 'apple-touch-icon',
              href: '/apple-touch-icon.png',
              sizes: '180x180',
            },
            {
              rel: 'manifest',
              href: '/site.webmanifest',
            },
            {
              rel: 'icon',
              type: 'image/png',
              sizes: '16x16',
              href: '/favicon-16x16.png',
            },
            {
              rel: 'icon',
              type: 'image/png',
              sizes: '32x32',
              href: '/favicon-32x32.png',
            },
            {
              rel: 'mask-icon',
              href: '/safari-pinned-tab.svg',
              color: '#5bbad5',
            },
          ]}
          additionalMetaTags={[
            {
              name: 'viewport',
              content: 'width=device-width, initial-scale=1.0, user-scalable=no',
            },
            {
              charSet: 'utf-8',
            },
            {
              name: 'msapplication-TileColor',
              content: '#da532c',
            },
            {
              name: 'theme-color',
              content: '#ffffff',
            },
          ]}
        />
        <div className="h-screen w-screen">
          <Component {...props} />
        </div>
        {!router.asPath.startsWith('/chat/') &&
          !router.asPath.startsWith('/ask/') &&
          !router.asPath.startsWith('/iframe/') &&
          !router.asPath.startsWith('/prompts/') && 
          !router.asPath.startsWith('/tools/prompt/') &&
          !router.asPath.startsWith('/demo/') && (
            <>
              <Script id="helpscout" strategy="lazyOnload">
                {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}
              </Script>
              <Script id="docsbot" strategy="lazyOnload">
              {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};`}
              </Script>
              {!router.asPath.startsWith('/app/onboarding') && !loading && (
                <Script id="docsbot-init" strategy="lazyOnload">
                  {`DocsBotAI.init({id: "ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW",options: {useImageUpload: true,contextItems: 12,hideSources: ['helpscout']},${docsBotIdentifyConfig}supportCallback: function (event, history, metadata, ticket) {
  event.preventDefault();
  DocsBotAI.unmount();
  Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2');
  var beaconIdent = {};
  if (metadata.name) beaconIdent.name = metadata.name;
  if (metadata.email) beaconIdent.email = metadata.email;
  if (Object.keys(beaconIdent).length) Beacon('identify', beaconIdent);
  Beacon('open');
  if (ticket) {
    let message = ticket.message;
    if (metadata.conversationUrl) {
      message += "\\n\\nConversation: " + metadata.conversationUrl;
    }
    // Add ticket subject and message to Beacon
    Beacon('prefill', {
      subject: ticket.subject,
      text: message
    });          
  }         
},});`}
                </Script>
              )}
              <Script id="firstpromoter1">
                {`(function(w){w.fpr=w.fpr||function(){w.fpr.q = w.fpr.q||[];w.fpr.q[arguments[0]=='set'?'unshift':'push'](arguments);};})(window);
fpr("init", {cid:"08y4co6f"}); 
if (!/google\.|bing\.|yahoo\.|baidu\.|duckduckgo\.|yandex\./i.test(document.referrer)) {
  fpr("click");
}`}
              </Script>
              <Script
                id="firstpromoter2"
                strategy="afterInteractive"
                src="https://cdn.firstpromoter.com/fpr.js"
              />
              {process.env.NEXT_PUBLIC_BENTO_SITE && (
                <Script
                  id="bento-script"
                  src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
                  strategy="afterInteractive"
                />
              )}
              {/* <Script src="https://www.googletagmanager.com/gtag/js?id=AW-412141971" />
              <Script id="gtag">
                {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-412141971');
              `}
              </Script> */}
            </>
          )}
      </HeadlessApp>
    </PostHogProvider>
  )
}
