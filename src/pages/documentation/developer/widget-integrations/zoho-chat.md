---
title: Zoho Chat AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with Zoho Chat (SalesIQ).
---

Learn how to embed and integrate our AI chat widget with Zoho Chat (SalesIQ). {% .lead %}

---

## Overview

[Zoho Chat (SalesIQ)](https://www.zoho.com/salesiq/) is a popular live chat and customer engagement platform used by many businesses to provide real-time support. With DocsBot you can first display our widget to provide an AI frontline support agent that can answer the most common questions about your product or service in any language! If the user still needs help, they can click the support link in the widget to open your Zoho Chat widget to talk to a human.

## Zoho Chat Integration

If your business uses [Zoho Chat (SalesIQ)](https://www.zoho.com/salesiq/) for live chat support, here's an example of how you could use the `supportCallback` argument to open the Zoho Chat widget if the user clicks the get support link in the DocsBot Widget.

Your existing Zoho Chat embed code may look something like this:

```html
<!-- Zoho SalesIQ Widget Code -->
<script type="text/javascript">
    var $zoho = $zoho || {};
    $zoho.salesiq = $zoho.salesiq || {
        widgetcode: 'YOUR_SALESIQ_WIDGET_CODE',
        values: {},
        ready: function() {}
    };
    var d = document;
    s = d.createElement('script');
    s.type = 'text/javascript';
    s.defer = true;
    s.src = 'https://salesiq.zoho.com/widget';
    t = d.getElementsByTagName('script')[0];
    t.parentNode.insertBefore(s, t);
</script>
```

To keep your Zoho Chat widget from showing by default, add the following code to your website:

```html
<script type="text/javascript">
    $zoho.salesiq.ready = function() {
        $zoho.salesiq.hide();
    };
</script>
```

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBot initialization code to open the Zoho Chat widget when the user clicks the support link in the DocsBot widget:

```js
<script type="text/javascript">
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history, metadata, ticket) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        
        // Prefill visitor information and conversation metadata
        $zoho.salesiq.ready = function() {
            // Set visitor information
            $zoho.salesiq.visitor.name(metadata.userName || 'Visitor');
            $zoho.salesiq.visitor.email(metadata.userEmail || '');
            
            // Add conversation metadata
            $zoho.salesiq.visitor.info({
                "Conversation Link": metadata.conversationUrl || window.location.href,
                "AI Chat History": JSON.stringify(history.slice(-5)) // Last 5 messages
            });
            
            // Pre-fill the message box with AI-generated ticket content
            $zoho.salesiq.visitor.question(ticket.message);
            
            // Show the Zoho Chat widget
            $zoho.salesiq.show();
        };
    },
})
</script>
```

## Advanced Integration with Conversation Metadata

For a more advanced integration that passes the full conversation context to your Zoho Chat agents, you can use this enhanced version:

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
        
        // Prefill visitor information and conversation metadata
        $zoho.salesiq.ready = function() {
            // Set visitor information
            $zoho.salesiq.visitor.name(metadata.userName || 'Visitor');
            $zoho.salesiq.visitor.email(metadata.userEmail || '');
            
            // Add comprehensive conversation metadata
            $zoho.salesiq.visitor.info({
                "Conversation Link": metadata.conversationUrl || window.location.href,
                "Ticket Subject": ticket ? ticket.subject : 'No ticket generated'
            });
            
            // Pre-fill the message box with AI-generated ticket content
            $zoho.salesiq.visitor.question(ticket.message);
            
            // Show the Zoho Chat widget
            $zoho.salesiq.show();
        };
    },
})
</script>
```

## Customizing the Integration

You can further customize the integration by:

1. **Adding custom fields**: Use `$zoho.salesiq.visitor.info()` to add any custom fields that will help your support team understand the context.

2. **Setting visitor properties**: Use `$zoho.salesiq.visitor.name()` and `$zoho.salesiq.visitor.email()` to prefill visitor information.

3. **Pre-filling the message box**: Use `$zoho.salesiq.visitor.question()` to auto-fill a pre-defined question in the message box when the visitor initiates a chat.

4. **Controlling widget visibility**: Use `$zoho.salesiq.show()` and `$zoho.salesiq.hide()` to control when the widget appears.

### Pre-filling the Message Box

The `$zoho.salesiq.visitor.question()` method allows you to auto-fill a pre-defined question in the message box when the visitor tries to initiate a chat. This is particularly useful for providing context about what the user was discussing with the AI assistant.

**Syntax:**
```javascript
$zoho.salesiq.visitor.question("Your pre-defined question here");
```

**Example:**
```javascript
$zoho.salesiq.ready = function() {
    $zoho.salesiq.visitor.question("Hey, I need assistance!");
};
```

In our integration examples above, we use this method to pre-fill the message box with a summary of the AI conversation, giving your support agents immediate context about what the user was asking about.

That's it! Now when the user clicks the support link in the DocsBot widget, the Zoho Chat widget will open with prefilled visitor information and conversation metadata, allowing your support team to provide more contextual assistance.

If you need additional help getting started integrating with Zoho Chat, feel free to contact our team!
