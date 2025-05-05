---
title: Freshdesk AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with Freshdesk.
---

Learn how to embed and integrate our AI chat widget with Freshdesk. {% .lead %}

---

## Overview

[Freshworks' Freshdesk](https://affiliatepartner.freshdesk.com/docsbot) is a widely used support desk software that businesses may embed via a support widget on their websites. With DocsBot you can add an AI frontline support agent via our widget. This agent can answer common questions about your product or service in any language. Then if users require further assistance, they can simply click the support link within the widget to access your [Freshdesk Help Widget](https://affiliatepartner.freshdesk.com/docsbot-widget) contact form and connect with a human representative.

## Freshdesk Help Widget Integration

If your business uses the [Freshdesk Help Widget](https://affiliatepartner.freshdesk.com/docsbot-widget) for support tickets or live chat, here's an example of how you could use the `supportCallback` argument to open the Web Widget if the user clicks the get support link in the DocsBot Widget.

Your existing Web Widget embed code may look something like this:

```html
<script>
  window.fwSettings={
    'widget_id':12000000025,
    'locale': 'en'
  };
  !function(){if("function"!=typeof window.FreshworksWidget){var n=function(){n.q.push(arguments)};n.q=[],window.FreshworksWidget=n}}()
</script>
<script type='text/javascript' src='https://widget.freshworks.com/widgets/12000000025.js' async defer />
```

To keep your Widget from showing by default, add the following code to your website after the Freshdesk embed code:

```html
<script type="text/javascript">
  FreshworksWidget('hide', 'launcher');
</script>
```

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBoc initialization code to open the Freshdesk Web Widget when the user clicks the support link in the DocsBot widget:

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        // Open the Freshdesk widget form https://developers.freshdesk.com/widget-api/#open-contact-form
        FreshworksWidget('open', 'ticketForm');
    },
})
</script>
```

### Prefilling the Contact Form with AI written ticket (Pro plan and up only)

If you want to prefill the contact form with an AI generated ticket from the chat history. Here's an example of how you could do that:

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    // optionally identify logged in user for chat logs
    identify: {
      name: "Bilbo Baggins",
      email: "bilbo@shire.net"
    },
    supportCallback: function (event, history, metadata, ticket) {
      event.preventDefault(); // Prevent default behavior opening the url.
      DocsBotAI.unmount(); // Hide the widget.
      // Open the Freshdesk widget form https://developers.freshdesk.com/widget-api/#prefill-fields
      FreshworksWidget('open', 'ticketForm');
      // Optionally identify user from metadata above. This will work with our upcoming lead collection tool
      FreshworksWidget('identify', 'ticketForm', {
        name: metadata.name || null,
        email: metadata.email || null,
      });
      // Prefill the ticket (Pro+ plan only)
      if (ticket) {
        FreshworksWidget('prefill', 'ticketForm', {
          subject: ticket.subject,
          description: ticket.message
        });
      }
    },
})
</script>
```

That's it! Now when the user clicks the support link in the DocsBot widget, the Freshdesk Help Widget will open in the contact from so they can start a ticket with a human support agent.

If you need additional help getting started integrating with Freshdesk, feel free to contact our team!