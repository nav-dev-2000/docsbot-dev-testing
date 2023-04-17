import 'focus-visible'
import '@/styles/tailwind.css'
import '@/styles/overrides.css'
import Script from 'next/script'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter, Router } from 'next/router'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import { slugifyWithCounter } from '@sindresorhus/slugify'
import { Layout } from '@/components/docs/Layout'
import { Analytics } from '@vercel/analytics/react'
import '@fortawesome/fontawesome-svg-core/styles.css'

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

export default function App({ Component, pageProps }) {
  const router = useRouter()
  const [user] = useAuthState(auth)

  useEffect(() => {
    const handleRouteChange = () => {
      if (window.bento !== undefined) {
        if (user) {
          window.bento.identify(user.email)
        }
        window.bento.view()
      }
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router.events])

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

  if (router.pathname.startsWith('/docs')) {
    let title = pageProps.markdoc?.frontmatter.title

    let pageTitle =
      pageProps.markdoc?.frontmatter.pageTitle || `${pageProps.markdoc?.frontmatter.title} - Docs`

    let description = pageProps.markdoc?.frontmatter.description

    let tableOfContents = pageProps.markdoc?.content
      ? collectHeadings(pageProps.markdoc.content)
      : []

    return (
      <>
        <Head>
          <title>{pageTitle}</title>
          {description && <meta name="description" content={description} />}
          <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:site" content="@docsbotai" />
          <meta name="twitter:creator" content="@docsbotai" />
          <meta property="twitter:domain" content="docsbot.ai" />
          <meta name="twitter:image" content="https://docsbot.ai/social-card.png" />
          <meta property="og:url" content={'https://docsbot.ai' + router.asPath} key="ogurl" />
          <meta property="og:title" content="DocsBot AI" key="ogtitle" />
          <meta property="og:description" content={description} key="ogdesc" />
          <meta property="og:image" content="https://docsbot.ai/social-card.png" key="ogimage" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
          <meta name="msapplication-TileColor" content="#da532c" />
          <meta name="theme-color" content="#ffffff"></meta>
        </Head>
        <Layout title={title} tableOfContents={tableOfContents}>
          <Component {...pageProps} />
        </Layout>
        {!router.pathname.startsWith('/chat/') && !router.pathname.startsWith('/ask/') && (
          <>
            <Script id="helpscout">
              {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}
            </Script>
            <Script id="docsbot">
              {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(t){return new Promise((e,n)=>{var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src="https://widget.docsbot.ai/chat.js";const i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i),s.addEventListener("load",()=>{window.DocsBotAI.mount({id:t.id,supportCallback:t.supportCallback});let o;o=function o(t){return new Promise((e)=>{if(document.querySelector(t))return e(document.querySelector(t));const n=new MutationObserver((o)=>{if(document.querySelector(t))return e(document.querySelector(t)),n.disconnect()});n.observe(document.body,{childList:!0,subtree:!0})})},o&&o("#docsbotai-root").then(e).catch(n)}),s.addEventListener("error",(t)=>{n(t.message)})})};DocsBotAI.init({id: "ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW",supportCallback: function (event, history) {
      event.preventDefault();
      DocsBotAI.unmount();
      Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2');
      Beacon('open');
  },});`}
            </Script>
          </>
        )}
        <Analytics />
        <Script
          id="bento-script"
          src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
          strategy="afterInteractive"
        />
      </>
    )
  }

  return (
    <>
      <Head>
        <title key="title">
          DocsBot AI - Custom chatbots and content generation from your documentation
        </title>
        <meta
          name="description"
          content="Custom ChatGPT bots trained on your documentation and content."
          key="description"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@docsbotai" />
        <meta name="twitter:creator" content="@docsbotai" />
        <meta property="twitter:domain" content="docsbot.ai" />
        <meta name="twitter:image" content="https://docsbot.ai/social-card.png" />
        <meta property="og:url" content={'https://docsbot.ai' + router.asPath} key="ogurl" />
        <meta property="og:title" content="DocsBot AI" key="ogtitle" />
        <meta
          property="og:description"
          content="Custom ChatGPT bots trained on your documentation and content."
          key="ogdesc"
        />
        <meta property="og:image" content="https://docsbot.ai/social-card.png" key="ogimage" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
        <meta name="msapplication-TileColor" content="#da532c" />
        <meta name="theme-color" content="#ffffff"></meta>
      </Head>
      <div className="h-screen">
        <Component {...pageProps} />
      </div>
      {!router.pathname.startsWith('/chat/') && !router.pathname.startsWith('/ask/') && (
        <>
          <Script id="helpscout">
            {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});`}
          </Script>
          <Script id="docsbot">
            {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(t){return new Promise((e,n)=>{var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src="https://widget.docsbot.ai/chat.js";const i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i),s.addEventListener("load",()=>{window.DocsBotAI.mount({id:t.id,supportCallback:t.supportCallback});let o;o=function o(t){return new Promise((e)=>{if(document.querySelector(t))return e(document.querySelector(t));const n=new MutationObserver((o)=>{if(document.querySelector(t))return e(document.querySelector(t)),n.disconnect()});n.observe(document.body,{childList:!0,subtree:!0})})},o&&o("#docsbotai-root").then(e).catch(n)}),s.addEventListener("error",(t)=>{n(t.message)})})};DocsBotAI.init({id: "ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW",supportCallback: function (event, history) {
      event.preventDefault();
      DocsBotAI.unmount();
      Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2');
      Beacon('open');
  },});`}
          </Script>
        </>
      )}
      <Analytics />
      <Script
        id="bento-script"
        src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
        strategy="afterInteractive"
      />
    </>
  )
}
