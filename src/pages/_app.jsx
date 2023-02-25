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
  
  //referral cookie setter
  useEffect(() => {
    return () => {
      //detect ref url var and set cookie
      const params = new URLSearchParams(window.location.search)
      const teamRef = params.get('ref')
      if (teamRef && teamRef.match(/^[a-zA-Z0-9]{20}$/)) {
        console.log('setting referral cookie')
        Cookies.set('referral', teamRef, { expires: 30, secure: true, path: '/' })
        if (window.bento !== undefined) {
          window.bento.track('referral', { referral: teamRef })
        }
      }
    }
  }, [])

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

  return (
    <>
      <Head>
        <title key="title">Chat site - your docs</title>
        <meta
          name="description"
          content="Fine-tune your own AI bases in minutes to generate amazing images of anyone or anything ...anywhere."
          key="description"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta property="og:url" content={'https://imajinn.ai' + router.asPath} key="ogurl" />
        <meta property="og:title" content="Imajinn AI" key="ogtitle" />
        <meta
          property="og:description"
          content="Visualization re-imajinned with fine-tuned AI. Generate profile pictures, product images, brands and styles limited only by your imagination!"
          key="ogdesc"
        />
        <meta property="og:image" content="/social-card.jpg" key="ogimage" />
      </Head>
      <div className="h-screen">
        <Component {...pageProps} />
      </div>
      <Script
        id="bento-script"
        src={'https://fast.bentonow.com?site_uuid=' + process.env.NEXT_PUBLIC_BENTO_SITE}
        strategy="afterInteractive"
      />
    </>
  )
}
