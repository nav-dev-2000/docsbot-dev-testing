---
title: HubSpot AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with the HubSpot Live Chat widget.
---

Learn how to embed and integrate our AI chat widget the HubSpot Live Chat widget. {% .lead %}

---

## Overview

[HubSpot](https://knowledge.hubspot.com/inbox/chat-with-your-website-visitors) is software used by many businesses to provide a live chat widget in their website. But with DocsBot you can first display our widget to privide an AI frontline support agent that can answer the most common questions about your product or service in any language! If the user still needs help, they can click the support link in the widget to open your HubSpot Live Chat widget to talk to a human.

## HubSpot Widget Integration

If your business uses the [HubSpot widget](https://knowledge.hubspot.com/inbox/chat-with-your-website-visitors) for support tickets or live chat, here's an example of how you could use the `supportCallback` argument to open the HubSpot widget if the user clicks the get support link in the DocsBot Widget.

Your [existing tracking embed code](https://knowledge.hubspot.com/reports/install-the-hubspot-tracking-code) may look something like this:

```html
<!-- Start of HubSpot Embed Code -->
<script type="text/javascript" id="hs-script-loader" async defer src="//js.hs-scripts.com/HUB_ID.js"></script>
<!-- End of HubSpot Embed Code -->
```

To keep your HubSpot widget from showing by default, add this next to your embed code:

```html
<script type="text/javascript">
window.hsConversationsSettings = {
  loadImmediately: false,
};
</script>
```

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBoc initialization code to open the HubSpot Beacon widget when the user clicks the support link in the DocsBot widget:

```js
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history, metadata) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        // Force the widget to load in an open state
        window.HubSpotConversations.widget.load({ widgetOpen: true });
        // Force the widget to open to a specific chat flow
        window.HubSpotConversations.widget.refresh({ openToNewThread: true });
    },
})
```

That's it! Now when the user clicks the support link in the DocsBot widget, the HubSpot widget will open so they can start a live chat or ticket with a human support agent.

If you need additional help getting started integrating with HubSpot, feel free to contact our team!