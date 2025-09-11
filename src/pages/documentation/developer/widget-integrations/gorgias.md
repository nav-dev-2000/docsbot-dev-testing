---
title: Gorgias AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with Gorgias.
---

Learn how to embed and integrate our AI chat widget with Gorgias. {% .lead %}

---

## Overview

[Gorgias](https://www.gorgias.com/) is a popular customer service platform designed for e-commerce businesses to manage support tickets, live chat, and customer interactions. With DocsBot you can first display our widget to provide an AI frontline support agent that can answer the most common questions about your product or service in any language! If the user still needs help, they can click the support link in the widget to open your Gorgias widget to talk to a human.

## Gorgias Integration

If your business uses [Gorgias](https://www.gorgias.com/) for customer support, here's an example of how you could use the `supportCallback` argument to open the Gorgias widget if the user clicks the get support link in the DocsBot Widget.

Your existing Gorgias embed code may look something like this:

```html
<!-- Gorgias Widget Code -->
<script>
  (function() {
    var gorgias = document.createElement('script');
    gorgias.type = 'text/javascript';
    gorgias.async = true;
    gorgias.src = 'https://YOUR_SUBDOMAIN.gorgias.com/app/widget.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(gorgias, s);
  })();
</script>
```

To keep your Gorgias widget from showing by default, you can hide it initially by adding custom CSS or by controlling its visibility programmatically.

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBot initialization code to open the Gorgias widget when the user clicks the support link in the DocsBot widget:

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history, metadata, ticket) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        
        // Prefill visitor information and conversation metadata
        if (window.GorgiasWidget) {
            if (ticket) {
                // Add ticket subject and message to Gorgias
                window.GorgiasWidget.prefill({
                    name: metadata.userName || 'Visitor',
                    email: metadata.userEmail || '',
                    custom_fields: {
                        conversation_link: metadata.conversationUrl || window.location.href,
                        subject: ticket.subject
                    }
                });
                
                // Set the message using GorgiasChat.setCurrentInput
                window.GorgiasChat.setCurrentInput(ticket.message);
            } else {
                window.GorgiasWidget.prefill({
                    name: metadata.userName || 'Visitor',
                    email: metadata.userEmail || '',
                    custom_fields: {
                        conversation_link: metadata.conversationUrl || window.location.href
                    }
                });
            }
            
            // Open the Gorgias widget
            window.GorgiasWidget.open();
        }
    },
})
</script>
```



## Customizing the Integration

You can further customize the integration by:

1. **Setting customer information**: Use `window.GorgiasWidget.prefill()` to prefill customer information.

2. **Adding custom fields**: Use the `custom_fields` parameter in `prefill()` to add any custom fields that will help your support team understand the context.

3. **Controlling widget visibility**: Use `window.GorgiasWidget.open()` to open the widget and `window.GorgiasWidget.close()` to close it.

4. **Listening to events**: Gorgias widgets support various events that you can listen to for enhanced functionality.

## Gorgias-Specific Features

Gorgias offers several e-commerce specific features that you can leverage:

1. **Order Information**: If you have access to order data, you can prefill order-related information in the custom fields.

2. **Customer History**: Gorgias can automatically pull in customer history if the email matches an existing customer.

3. **Product Context**: You can include product information or page context to help agents understand what the customer is asking about.

That's it! Now when the user clicks the support link in the DocsBot widget, the Gorgias widget will open with prefilled customer information, allowing your support team to provide more contextual assistance.

If you need additional help getting started integrating with Gorgias, feel free to contact our team!
