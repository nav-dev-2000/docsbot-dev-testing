---
title: LiveChat AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with LiveChat.
---

Learn how to embed and integrate our AI chat widget with LiveChat. {% .lead %}

---

## Overview

[LiveChat](https://www.livechat.com/) is a popular live chat platform used by many businesses to provide real-time customer support. With DocsBot you can first display our widget to provide an AI frontline support agent that can answer the most common questions about your product or service in any language! If the user still needs help, they can click the support link in the widget to open your LiveChat widget to talk to a human.

## LiveChat Integration

If your business uses [LiveChat](https://www.livechat.com/) for live chat support, here's an example of how you could use the `supportCallback` argument to open the LiveChat widget if the user clicks the get support link in the DocsBot Widget.

Your existing LiveChat embed code may look something like this:

```html
<!-- Start of LiveChat (www.livechat.com) code -->
<script>
  window.__lc = window.__lc || {};
  window.__lc.license = YOUR_LICENSE_ID;
  ;(function(n,t,c){function i(n){return e._h?e._h.apply(null,n):e._q.push(n)}var e={_q:[],_h:null,_v:"2.0",on:function(){i(["on",c.call(arguments)])},once:function(){i(["once",c.call(arguments)])},off:function(){i(["off",c.call(arguments)])},get:function(){if(!e._h)throw new Error("[LiveChatWidget] You can't use getters before load.");return i(["get",c.call(arguments)])},call:function(){i(["call",c.call(arguments)])},init:function(){var n=t.createElement("script");n.async=!0,n.type="text/javascript",n.src="https://cdn.livechatinc.com/tracking.js",t.head.appendChild(n)}};!n.__lc.asyncInit&&e.init(),n.LiveChatWidget=n.LiveChatWidget||e}(window,document,[].slice))
</script>
<noscript
  ><a href="https://www.livechat.com/chat-with/YOUR_LICENSE_ID/" rel="nofollow"
    >Chat with us</a
  >, powered by
  <a
    href="https://www.livechat.com/?welcome"
    rel="noopener nofollow"
    target="_blank"
    >LiveChat</a
  ></noscript
>
<!-- End of LiveChat code -->
```

To keep your LiveChat widget from showing by default, you can hide it using the API:

```html
<script type="text/javascript">
    // Hide LiveChat widget on page load
    LiveChatWidget.call('hide');
</script>
```

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBot initialization code to open the LiveChat widget when the user clicks the support link in the DocsBot widget:

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history, metadata, ticket) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        
        // Set customer information using LiveChat API
        LiveChatWidget.call('set_customer_name', metadata.userName || 'Visitor');
        LiveChatWidget.call('set_customer_email', metadata.userEmail || '');
        
        // Set custom variables with conversation metadata
        LiveChatWidget.call('set_custom_variables', [
            { name: 'conversation_link', value: metadata.conversationUrl || window.location.href },
            { name: 'ticket_subject', value: ticket ? ticket.subject : 'No ticket generated' }
        ]);
        
        // Open the LiveChat widget with AI-generated ticket message
        if (ticket && ticket.message) {
            LiveChatWidget.call('maximize', { messageDraft: ticket.message });
        } else {
            LiveChatWidget.call('maximize');
        }
    },
})
</script>
```

## Advanced Integration with Ticket Creation

For a more advanced integration that leverages AI-generated ticket content, you can use this enhanced version:

{% callout title="Ticket Creation Plan Limitations" %}
The ticket creation endpoint is only available on our Standard plan and above. If you are on a lower/legacy plan, `ticket` will be `null`.
{% /callout %}

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history, metadata, ticket) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        
        // Set customer information using LiveChat API
        LiveChatWidget.call('set_customer_name', metadata.userName || 'Visitor');
        LiveChatWidget.call('set_customer_email', metadata.userEmail || '');
        
        // Set comprehensive session variables using LiveChatWidget JS API
        LiveChatWidget.call("set_session_variables", {
            conversation_link: metadata.conversationUrl || window.location.href,
            ticket_subject: ticket ? ticket.subject : "No ticket generated",
            page_url: window.location.href,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
        
        // Open the LiveChat widget with AI-generated ticket message
        if (ticket && ticket.message) {
            LiveChatWidget.call('maximize', { messageDraft: ticket.message });
        } else {
            LiveChatWidget.call('maximize');
        }
    },
})
</script>
```

## Customizing the Integration

You can further customize the integration by:

1. **Setting customer information**: Use `LiveChatWidget.call('set_customer_name')` and `LiveChatWidget.call('set_customer_email')` to prefill customer information.

2. **Adding custom variables**: Use `LiveChatWidget.call('set_session_variables')` to add any custom fields that will help your support team understand the context.

3. **Controlling widget visibility**: Use `LiveChatWidget.call('maximize')` to open the widget, `LiveChatWidget.call('minimize')` to minimize it, and `LiveChatWidget.call('hide')` to hide it completely.

4. **Pre-filling messages**: Use `LiveChatWidget.call('maximize', { messageDraft: 'Your message here' })` to open the widget with a pre-filled message in the input field.

5. **Listening to events**: Use `LiveChatWidget.on()` to listen to various events like 'ready', 'new_event', 'customer_status_changed', etc.

6. **Getting widget state**: Use `LiveChatWidget.get('state')` to check the current widget state and availability.

That's it! Now when the user clicks the support link in the DocsBot widget, the LiveChat widget will open with prefilled visitor information and conversation metadata, allowing your support team to provide more contextual assistance.

If you need additional help getting started integrating with LiveChat, feel free to contact our team!
