import Script from 'next/script'

export default function WidgetPreview({ teamId, botId, options }) {
  return (
    <Script strategy="lazyOnload">
      {`window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";const n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify,options:c.options,signature:c.signature});let t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));const o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(e).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};
            DocsBotAI.init({
              id: "${teamId}/${botId}",
              options: {
                allowedDomains: "localhost, docsbot.ai",
                botName: "${options.botName}",
                description: "${options.description}",
                color: "${options.color}",
                icon: "${options.icon}",
                alignment: 'right',
                botIcon: "${options.botIcon}",
                branding: "${options.branding}",
                supportLink: "${options.supportLink}",
                showButtonLabel: "${options.showButtonLabel}",
                labels: ${JSON.stringify(options.labels)},
                hideSources: "${options.hideSources}",
              }
              });`}
    </Script>
  )
}
