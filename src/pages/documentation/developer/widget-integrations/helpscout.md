---
title: Help Scout AI Chat Widget Integration
description: Learn how to embed and integrate our AI chat widget with Help Scout.
---

Learn how to embed and integrate our AI chat widget with Help Scout. {% .lead %}

---

## Overview

[Help Scout](https://helpscout.grsm.io/9cush642f1y3) is a popular support software used by many businesses to provide a support widget in their website. But with DocsBot you can first display our widget to create an AI frontline support agent that can answer the most common questions about your product or service in any language! If the user still needs help, they can click the support link in the widget to open your Help Scout Beacon widget to talk to a human.

{% callout title="Try our Advanced Help Scout Integration" %}
You can also enable our [advanced Help Scout integration](/documentation/doc/help-scout-integration) to train your bot from your Help Scout support history and auto-reply to support tickets!
{% /callout %}

## Help Scout Beacon Integration

If your business uses [Help Scout](https://helpscout.grsm.io/9cush642f1y3) Beacon for support tickets or live chat, here's an example of how you could use the `supportCallback` argument to open the Help Scout Beacon widget if the user clicks the get support link in the DocsBot Widget.

Your existing Beacon embed code may look something like this:

```html
<script type="text/javascript">
  !function(e,t,n){function a(){var e=t.getElementsByTagName("script")...
</script>
<script type="text/javascript">
  window.Beacon('init', 'YOUR_BEACON_ID_HERE')
</script>
```

To keep your Beacon from showing by default, remove the init script from the embed code. It looks like this:

```html
<script type="text/javascript">
  window.Beacon('init', 'YOUR_BEACON_ID_HERE')
</script>
```

Then you'll need to add the DocsBot widget embed code to your website. You can find the embed code by clicking the "Widget Embed" link on your bot. You can find more information about the widget embed code [here](/documentation/developer/embeddable-chat-widget).

Finally adjust the DocsBoc initialization code to open the Help Scout Beacon widget when the user clicks the support link in the DocsBot widget:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  supportCallback: function (event, history) {
    event.preventDefault() // Prevent default behavior opening the url.
    DocsBotAI.unmount() // Hide the widget.
    // Open the Help Scout Beacon widget.
    Beacon('init', 'YOUR_BEACON_ID_HERE') // Replace with your beacon id, assuming you havn't already initialized the beacon.
    Beacon('open')
  },
})
```

{% callout type="warning" title="Make sure to add a support url!" %}
For any of these integrations to work you must add a support url to your bot settings so that it will show the support link in the widget. If you don't want to use the support link, you can simply add a `#` to the url field.
{% /callout %}

That's it! Now when the user clicks the support link in the DocsBot widget, the Help Scout Beacon widget will open so they can start a live chat or ticket with a human support agent.

If you need additional help getting started integrating with Help Scout, feel free to contact our team!
