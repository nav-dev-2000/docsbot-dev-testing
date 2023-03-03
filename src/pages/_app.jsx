import 'focus-visible'
import '@/styles/tailwind.css'
import '@/styles/overrides.css'
import Script from 'next/script'
import Head from 'next/head'
import { useEffect } from 'react'
import { useRouter, Router } from 'next/router'
import Cookies from 'js-cookie'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'

export default function App({ Component, pageProps: { ...pageProps } }) {
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
    if (user && Beacon !== undefined) {
      Beacon('identify', {
        name: user.displayName,
        email: user.email,
      })
    }
  }, [user])

  return (
    <>
      <Head>
        <title key="title">
          DocsBot AI - Custom chatbots and content generation from your documentation
        </title>
        <meta
          name="description"
          content="Custom ChatGPT trained on your documentation and content."
          key="description"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@docsbotai" />
        <meta name="twitter:creator" content="@docsbotai" />
        <meta property="twitter:domain" content="docsbot.ai" />
        <meta name="twitter:image" content="/social-card.png" />
        <meta property="og:url" content={'https://docsbot.ai' + router.asPath} key="ogurl" />
        <meta property="og:title" content="DocsBot AI" key="ogtitle" />
        <meta
          property="og:description"
          content="Custom ChatGPT trained on your documentation and content."
          key="ogdesc"
        />
        <meta property="og:image" content="/social-card.png" key="ogimage" />
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
      <Script id="helpscout">
        {`!function(e,t,n){function a(){var e=t.getElementsByTagName("script")[0],n=t.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://beacon-v2.helpscout.net",e.parentNode.insertBefore(n,e)}if(e.Beacon=n=function(t,n,a){e.Beacon.readyQueue.push({method:t,options:n,data:a})},n.readyQueue=[],"complete"===t.readyState)return a();e.attachEvent?e.attachEvent("onload",a):e.addEventListener("load",a,!1)}(window,document,window.Beacon||function(){});window.Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2')`}
      </Script>
      <Script
        id="bento-script"
        src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
        strategy="afterInteractive"
      />
    </>
  )
}
