---
title: Embeddable Chat Widget
description: Learn how to embed and customize our chat widget in your website.
---

Learn how to embed and customize our chat widget in your website. {% .lead %}

---

## Embedding the Chat Widget

We make it super simple to add chats to your site with our simple embed code. You can customize the widget to match your brand and embed it on your website with a single line of code.

![](/images/widget.png)

You can find the full embed code for your bot from the [Bot](/app/bots) page for your specific bot. It looks a bit like this:

```html
<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(t){return new Promise((e,n)=>{var s=document.createElement("script");s.type="text/javascript",s.async=!0,s.src="https://widget.docsbot.ai/chat.js";const i=document.getElementsByTagName("script")[0];i.parentNode.insertBefore(s,i),s.addEventListener("load",()=>{window.DocsBotAI.mount({id:t.id,supportCallback:t.supportCallback});let o;o=function o(t){return new Promise((e)=>{if(document.querySelector(t))return e(document.querySelector(t));const n=new MutationObserver((o)=>{if(document.querySelector(t))return e(document.querySelector(t)),n.disconnect()});n.observe(document.body,{childList:!0,subtree:!0})})},o&&o("#docsbotai-root").then(e).catch(n)}),s.addEventListener("error",(t)=>{n(t.message)})})}</script>
<script type="text/javascript">
    DocsBotAI.init({id: "YOUR_ID_HERE"});
</script>
```

### Adding the Embed Code

Copy the code and paste it into the `<head>` section of your website. If it's simpler you can insert the code anywhere in your site's html before the closing `</body>` tag. The embed code may appear the same but the `{id: "ZrbLG98bbxZ9EFqiPvyl/SQMV36O8xi43xbZRzYLy"}`  is unique to your bot, so be sure to copy the proper code from your bot page.

### Performance

The widget is loaded asynchronously after the initial pageload is complete, so it should not block the loading of your site or affect your pagespeed scores. The widget will load and open as soon as the user interacts with it.

## Customizing the Chat Widget

You can customize the widget to match your brand and desired behaviour on your bot settings page. Some of the options include:

- **Name** - Your bot name is displayed in the header of the widget.
- **Description** - Your bot description is displayed in the header of the widget.
- **Color** - Choose the color of the widget. You can choose from a variety of colors or enter your own hex code.
- **First message** - Choose the greeting that will appear when the widget is first opened.
- **Button Icon** - Choose the icon that will appear in the floating button.
- **Button Text** - Choose the text that will appear in the floating button if any.
- **Bot avatar** - Choose the avatar icon that will appear for your bot, or none at all.
- **Custom support link** - Choose a custom support link that will appear in the widget for user's to contact you directly if they need to.
- **Language** - Choose the language that the widget will be displayed in. Currently we support English and Japanese. We will soon allow you to eaily translate the widget into your own language or customize any text strings.

**Note**: Changes to your widget settings will not be reflected on your site until you reload the page as long as five minutes after you save your changes. For best performance we cache the widget settings for five minutes on our CDN.

## Widget API

You can also interact with the widget using the following API if you want to create custom behaviors or integrate with other support tools.

### Initialization

`DocsBotAI.init()` is used to initialize the widget. It takes an object with the various properties. The only required property is the `id` property which is the unique id of your bot created from your `teamId` and `botId`. You can find this id on the [Bot](/app/bots) page for your specific bot.

If you would like to run a callback when the user clicks the support link in the widget you can pass a `supportCallback` function. This function will be called with the `event` and `history` objects. The `event` object is the click event and the `history` object is the chat history array. You could use this for example to open your own support modal or live chat widget, or prefilling and submitting a support ticket with the chat history. Here's a code example:

```js
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history) {
        event.preventDefault(); // Prevent default behavior opening the url.
        console.log(history); // Safely access the chat history and widget API.
        DocsBotAI.close(); // Close the widget.
    },
}).then(() => {
    // Safely do stuff here after the widget is loaded.
})
```

The `DocsBotAI.init()` function returns a promise that resolves when the widget is loaded and ready to be used. You can use this to safely do stuff with the widget after it's loaded, such registering event listeners to open or close the widget based on user interactions.

### Helpscout Beacon Example

If your business uses [Helpscout](https://helpscout.grsm.io/9cush642f1y3) for support tickets or live chat, here's an example of how you could use the `supportCallback` to open the Helpscout Beacon widget if the user clicks the get support link in the DocsBot Widget.

```js
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the widget.
        // Open the Helpscout Beacon widget.
        Beacon('init', 'YOUR_BEACON_ID_HERE'); // Replace with your beacon id, assuming you havn't already initialized the beacon.
        Beacon('open');
    },
})
```

### Other API Methods

There are a few other methods you can use to interact with the widget once it has been initialized.

```js
// Open the widget.
DocsBotAI.open()

// Close the widget.
DocsBotAI.close()

// Toggle the widget open/closed.
DocsBotAI.toggle()

// Unmounts the widget. (removes the button and widget from the page)
DocsBotAI.unmount()

// Mount the widget. (re-adds the button and widget to the page)
DocsBotAI.mount()
```

If you need us to add more events just let us know and we'll see what we can do!