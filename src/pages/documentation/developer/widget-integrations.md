---
title: Widget Integrations
description: Learn how to integrate our AI chat widget with popular support platforms.
---

Learn how to integrate our AI chat widget with popular support platforms. {% .lead %}

---

## Overview

If your business uses an existing software product for support tickets or live chat, you can integrate it with our AI widget, allowing your users to click the get support link in the DocsBot Widget to talk to a human! Here are some examples of integrating with the most popular providers:

## Available Integrations

- [Help Scout Beacon](/documentation/developer/widget-integrations/helpscout) - Integrate with Help Scout's Beacon widget for support tickets and live chat
- [HubSpot Live Chat](/documentation/developer/widget-integrations/hubspot) - Connect with HubSpot's live chat functionality
- [Zendesk Web Widget](/documentation/developer/widget-integrations/zendesk) - Integrate with Zendesk's web widget for support tickets
- [Intercom Messenger](/documentation/developer/widget-integrations/intercom) - Connect with Intercom's messenger widget
- [Freshdesk Widget](/documentation/developer/widget-integrations/freshdesk) - Integrate with Freshdesk's support widget
- [Zoho Chat Integration](/documentation/developer/widget-integrations/zoho-chat) - Connect with Zoho Chat for live support
- [LiveChat Integration](/documentation/developer/widget-integrations/livechat) - Integrate with LiveChat's support widget
- [Gorgias Integration](/documentation/developer/widget-integrations/gorgias) - Connect with Gorgias for e-commerce support

## How It Works

The integration works by using the `supportCallback` function in your DocsBot widget initialization. When a user clicks the support link in the DocsBot widget, this callback is triggered, allowing you to:

1. **Prevent the default behavior** - Stop the widget from opening a generic support URL
2. **Hide the DocsBot widget** - Clean up the interface
3. **Open your support widget** - Launch your preferred support platform
4. **Pass conversation context** - Include chat history, user information, and AI-generated tickets

## Generic Integration Example

Here's a basic example of how the integration works:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  supportCallback: function (event, history, metadata, ticket) {
    event.preventDefault() // Prevent default behavior opening the url.
    DocsBotAI.unmount() // Hide the DocsBot widget.
    
    // Your custom integration code here
    console.log('User needs support:', {
      conversationId: metadata.conversationId,
      conversationUrl: metadata.conversationUrl,
      ticket: ticket // AI-generated ticket with subject and message
    });
    
    // Open your support widget or redirect to support page
  },
})
```

## Key Features

- **Conversation Context**: Pass the full chat history to your support team
- **AI-Generated Tickets**: Automatically create support tickets with relevant subject and message
- **User Identification**: Include user metadata and conversation links
- **Seamless Handoff**: Smooth transition from AI to human support

## Need a Different Integration?

{% callout title="Other integrations" %}
If you would like to integrate with a different support widget that's not listed here, please let us know and we'll add it to our documentation.
{% /callout %}

For more information about the widget API and customization options, see the [Embeddable Chat Widget](/documentation/developer/embeddable-chat-widget) documentation.
