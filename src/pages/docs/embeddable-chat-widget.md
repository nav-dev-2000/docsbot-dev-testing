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
<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(c){return new Promise(function(e,o){var t=document.createElement("script");t.type="text/javascript",t.async=!0,t.src="https://widget.docsbot.ai/chat.js";var n=document.getElementsByTagName("script")[0];n.parentNode.insertBefore(t,n),t.addEventListener("load",function(){window.DocsBotAI.mount({id:c.id,supportCallback:c.supportCallback,identify:c.identify});var t;t=function(n){return new Promise(function(e){if(document.querySelector(n))return e(document.querySelector(n));var o=new MutationObserver(function(t){document.querySelector(n)&&(e(document.querySelector(n)),o.disconnect())});o.observe(document.body,{childList:!0,subtree:!0})})},t&&t("#docsbotai-root").then(e).catch(o)}),t.addEventListener("error",function(t){o(t.message)})})};</script>
<script type="text/javascript">
    DocsBotAI.init({id: "YOUR_ID_HERE"});
</script>
```

### Adding the Embed Code

Copy the code and paste it into the `<head>` section of your website. If it's simpler you can insert the code anywhere in your site's html before the closing `</body>` tag. The embed code may appear the same but the `{id: "ZrbLG98bbxZ9EFqiPvyl/SQMV36O8xi43xbZRzYLy"}`  is unique to your bot, so be sure to copy the proper code from your bot page.

### Privacy and Security

Bots that are set to private cannot use the embed code currently as you would have to expose your API key to the public. We may add an option in the future to allow the widget with a temporary expiring token, please let us know if you need this feature.

We allow you to embed the widget on any domain by default, but you can restrict the domains that the widget can be embedded on in the widget settings on the bot page. This is useful if you want to restrict the widget to only be embedded on your own domains. Note that you will have to add each domain including subdomains separately. Example: `docsbot.ai` and `www.docsbot.ai` are considered separate domains. We do not support wildcards at this time.

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
- **Language** - Choose the language that the widget will be displayed in.

Here is a list of the languages we currently support, if you would like to see another language added please let us know:

>English, 日本語 (Japanese), العربية (Arabic), 简体中文 (Chinese Simplified), Čeština (Czech), Dansk (Danish), Nederlands (Dutch), Filipino, Suomi (Finnish), Français (French), Deutsch (German), Ελληνικά (Greek), עברית (Hebrew), हिन्दी (Hindi), Magyar (Hungarian), Bahasa Indonesia (Indonesian), Italiano (Italian), 한국어 (Korean), Norsk (Norwegian), Polski (Polish), Português (Portuguese), Română (Romanian), Русский (Russian), Српски (Serbian), Español (Spanish), Kiswahili (Swahili), Svenska (Swedish), ไทย (Thai), Türkçe (Turkish)

**Note**: Changes to your widget settings will not be reflected on your site until you reload the page as long as five minutes after you save your changes. For best performance we cache the widget settings for five minutes on our CDN.

## Widget API

You can also interact with the widget using the following API if you want to create custom behaviors or integrate with other support tools.

### Initialization

`DocsBotAI.init()` is used to initialize the widget. It takes an object with the various properties. The only required property is the `id` property which is the unique id of your bot created from your `teamId` and `botId`. You can find this id on the [Bot](/app/bots) page for your specific bot.

### Support Callback

If you would like to run a callback when the user clicks the support link in the widget you can pass a `supportCallback` function. This function will be called with the `event` and `history` objects. The `event` object is the click event and the `history` object is the chat history array. You could use this for example to open your own support modal or live chat widget, or prefilling and submitting a support ticket with the chat history. Here's a code example:

### User Identification

If you would like to record the user's name, email, or any other custom variables you can optionally pass an `identify` object with the properties you would like to record. These properties will be recorded in the question `metadata` of the chat history allowing you to view it in the chat logs or export it via the questions API endpoint. This can be useful to identify the user or metadata about them such as their subscription plan or any other custom data you would like to record.

The properties `email`, and `name` if set will be shown in the question history logs of our dashboard instead of a pseudonomous user alias. Make sure that you are using the latest version of our widget embed code to take advantage of the `identify` feature.

{% callout title="Privacy and GDPR Considerations" %}
If you use the identify feature to record user's personal information, chat logs stored with DocsBot will no longer be anonymous. You should make sure that you have a privacy policy that discloses this to your users. You should also make sure that you are not recording any sensitive information such as credit card numbers or passwords. We do not recommend recording any sensitive information in the chat history metadata.
{% /callout %}

### Example Code

```js
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history) {
        event.preventDefault(); // Optionally prevent default behavior opening the url.
        console.log(history); // Safely access the chat history.
        DocsBotAI.close(); // Close the widget.
    },
    identify: {
        name: "John Doe", // This will be shown in the chat history logs.
        email: "john@doe.com", // This will be shown in the chat history logs.
        customVariable: "customValue", // This will be recorded in the question metadata and accessible via the API.
    }
}).then(() => {
    // Safely do stuff here after the widget is loaded.
})
```

The `DocsBotAI.init()` function returns a promise that resolves when the DocsBotAI window global is loaded and ready to be used. You can use this to safely do stuff with the widget after it's loaded, such as registering event listeners to open or close the widget based on user interactions. Note to open the widget immediately after it's loaded you might need to call `DocsBotAI.open()` inside a `setTimeout()` as the widget must be mounted to open it.

### Integration with a Support Form

If you would like to integrate the DocsBot widget with a support form on your site, you can simply add the url that contains or support form in your widget settings on our bot edit page. When the user clicks the link in the widget, it will open the url in a new tab.

### Integration with other Support Widgets

If your business uses an existing software product for support tickets or live chat, you can integrate it with our AI widget, allowing your users to click the get support link in the DocsBot Widget to talk to a human! Here are some examples of integrating with the most popular providers:

- [HelpScout Beacon](/docs/widget-integrations/helpscout)
- [Zendesk Web Widget](/docs/widget-integrations/zendesk)
- [Intercom Messenger](/docs/widget-integrations/intercom)

{% callout title="Other integrations" %}
If you would like to integrate with a different support widget, please let us know and we'll add it to our docs.
{% /callout %}

#### Generic Integration Example

```js
DocsBotAI.init({
    id: "YOUR_ID_HERE",
    supportCallback: function (event, history) {
        event.preventDefault(); // Prevent default behavior opening the url.
        DocsBotAI.unmount(); // Hide the DocsBot widget.
        // Run some JS here to open your support widget.
        
    },
})
```

{% callout type="warning" title="Make sure to add a support url!" %}
For any of these integrations to work you must add a support url to your bot settings so that it will show the support link in the widget. If you don't want to use the support link, you can simply add a `#` to the url field.
{% /callout %}

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