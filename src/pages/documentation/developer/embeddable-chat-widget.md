---
title: Embeddable Chat Widget
description: Learn how to embed and customize our chat widget in your website.
---

Learn how to embed and customize our chat widget in your website. {% .lead %}

---

## Embedding the Chat Widget

We make it super simple to add chats to your site with our simple embed code. You can customize the widget to match your brand and embed it on your website with a single line of code.

![Widget screenshot](/images/widget.png)

You can find the full embed code for your bot from the [Bot](/app/bots) page for your specific bot. It looks a bit like this:

```html
<script type="text/javascript">window.DocsBotAI=window.DocsBotAI||{},DocsBotAI.init=function(e){return new Promise((t,r)=>{var n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src="https://widget.docsbot.ai/chat.js";let o=document.getElementsByTagName("script")[0];o.parentNode.insertBefore(n,o),n.addEventListener("load",()=>{let n;Promise.all([new Promise((t,r)=>{window.DocsBotAI.mount(Object.assign({}, e)).then(t).catch(r)}),(n=function e(t){return new Promise(e=>{if(document.querySelector(t))return e(document.querySelector(t));let r=new MutationObserver(n=>{if(document.querySelector(t))return e(document.querySelector(t)),r.disconnect()});r.observe(document.body,{childList:!0,subtree:!0})})})("#docsbotai-root"),]).then(()=>t()).catch(r)}),n.addEventListener("error",e=>{r(e.message)})})};</script>
<script type="text/javascript">
  DocsBotAI.init({ id: 'YOUR_ID_HERE' })
</script>
```

### Adding the Embed Code

Copy the code and paste it into the `<head>` section of your website. If it's simpler you can insert the code anywhere in your site's html before the closing `</body>` tag. The embed code may appear the same but the `{id: "ZrbLG98bbxZ9EFqiPvyl/SQMV36O8xi43xbZRzYLy"}` is unique to your bot, so be sure to copy the proper code from your bot page.

### Embedding Into the Page Content

![Embedded page widget example](/images/widget-in-page.png)

You may not desire to have the widget floating on the page, but instead embedded into the page similar to an iframe. You can do this by adding an element anywhere in your site page with the id `docsbot-widget-embed`. The widget will be mounted into and fill this element. Here is an example:

```html
<div id="docsbot-widget-embed" style="max-width:600px;height:650px;margin:20px auto;"></div>
```

If an element with the id `docsbot-widget-embed` is not found, the widget will be mounted as a floating button by default. If you only want to embed the widget into a specific page and not have a floating button, only include the JavaScript embed code and element on that page. When embeding into a page, you can choose to hide the widget header by setting the `hideHeader` option to `true` in the widget JavaScript embed code, as detailed below.

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

> English, 日本語 (Japanese), العربية (Arabic), 简体中文 (Chinese Simplified), Čeština (Czech), Dansk (Danish), Nederlands (Dutch), Filipino, Suomi (Finnish), Français (French), Deutsch (German), Ελληνικά (Greek), עברית (Hebrew), हिन्दी (Hindi), Magyar (Hungarian), Bahasa Indonesia (Indonesian), Italiano (Italian), 한국어 (Korean), Norsk (Norwegian), Polski (Polish), Português (Portuguese), Română (Romanian), Русский (Russian), Српски (Serbian), Español (Spanish), Kiswahili (Swahili), Svenska (Swedish), ไทย (Thai), Türkçe (Turkish)

**Note**: Changes to your widget settings will not be reflected on your site until you reload the page as long as five minutes after you save your changes. For best performance we cache the widget settings for five minutes on our CDN.

If you need to customize the widget appearance at a deeper level than our settings provide, see the [Custom CSS](#custom-css) section below for more details.

## Security

### Restricting Domains

We allow you to embed the widget on any domain by default, but you can restrict the domains that the widget can be embedded on in the widget settings on the bot page. This is useful if you want to restrict the widget to only be embedded on your own domains. Note that you will have to add each domain including subdomains separately. Example: `docsbot.ai` and `www.docsbot.ai` are considered separate domains. We do not support wildcards at this time.

### Embedding Private Bots

**Bots that are set to _private_ must create a dynamically generated signature for the embed code on the server side.** This is so that you don't expose your API key to the public. You can find the Embed Key for your bot on the [Bots](/app/bots) widget embed page for your specific bot if it is set to private. You can use this key to generate the signature on your server. The signature is generated by creating an HMAC SHA256 hash of the bot id and an expiration timestamp using your Embed Key as the secret. The expiration timestamp can be set depending on your security needs. Remember, once someone has access to this signature, they will be able to use it to interact with your bot until the expiration. Most organizations who need their bot to be private will check for user authorization on their website/app before generating this signature and providing it to the user via their custom embed code.

Here are some examples for how to generate the signature in various languages:

Node.js:

```js
import crypto from 'crypto'

const botId = 'YOUR_BOT_ID'
const embedKey = 'EMBED_CODE_FROM_BOT_WIDGET_EMBED_PAGE'

const hmac = crypto.createHmac('sha256', embedKey)
const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 1 //expires in 1 hour
hmac.update(`${botId}:${expires}`)
const signature = `${hmac.digest('hex')}:${expires}` 
//pass signature to the frontend widget embed code via SSR, or an API endpoint.
```

PHP:

```php
$botId = 'YOUR_BOT_ID';
$embedKey = 'EMBED_CODE_FROM_BOT_WIDGET_EMBED_PAGE';

$expires = time() + 60 * 60 * 1; //expires in 1 hour
$signature = hash_hmac('sha256', $botId . ':' . $expires, $embedKey) . ':' . $expires;
```

Python:

```python
import hashlib
import hmac
import time

bot_id = 'YOUR_BOT_ID'
embed_key = 'EMBED_CODE_FROM_BOT_WIDGET_EMBED_PAGE'

expires = int(time.time()) + 60 * 60 * 1  # expires in 1 hour
signature = hmac.new(embed_key.encode(), f'{bot_id}:{expires}'.encode(), hashlib.sha256).hexdigest() + f':{expires}'
```

Ruby:

```ruby
require 'openssl'
bot_id = 'YOUR_BOT_ID'
embed_key = 'EMBED_CODE_FROM_BOT_WIDGET_EMBED_PAGE'

expires = Time.now.to_i + 60 * 60 * 1 # expires in 1 hour
data = "#{bot_id}:#{expires}"

digest = OpenSSL::Digest.new('sha256')
hmac = OpenSSL::HMAC.hexdigest(digest, embed_key, data)

signature = "#{hmac}:#{expires}"
```
> NOTE: `bot_id` in these examples is DIFFERENT from the id passed to your widget. Your bot ID will be the 2nd uuid in the `id` parameter of your widget, eg. `ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW`'s bot ID would be `UMADr9eozeBQ8sZKr0GW`.

Once you have generated the signature on the server side, you can pass it to the widget embed code via the `signature` parameter like this:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  signature: 'f95b5d6431fe76854fe14384123225cff9501ed6cd08dff12c1897a93badabbc:1693821134',
})
```

## Widget API

You can also interact with the widget using the following API if you want to create custom behaviors or integrate with other support tools.

### Initialization

`DocsBotAI.init()` is used to initialize the widget. It takes an object with the various properties. The only required property is the `id` property which is the unique id of your bot created from your `teamId` and `botId`. You can find this id on the [Bot](/app/bots) page for your specific bot.

### Support Callback

If you would like to run a callback when the user clicks the support link in the widget you can pass a `supportCallback` function. This function will be called with the `event`, `history`, `metadata`, and if Agent Mode is enabled `ticket` objects. The `event` object is the click event and the `history` object is the chat history array. `metadata` merely contains the metadata you passed to the widget. When you provide an argument for `ticket` and Agent mode is enabled, then we will use AI to summarize the conversation and write a ticket. This object contains { `subject`, `message` }. You could use this for example to open your own support modal or live chat widget, or prefilling and submitting a support ticket with the chat history or AI written ticket.

{% callout title="Ticket Creation Plan Limitations" %}
The ticket creation endpoint is only available on our Standard plan and above. If you are on a lower/legacy plan, `ticket` object will be null.
{% /callout %}

### Example Code

#### History Array

```js
[
  {
      "Human": "hi",
      "timestamp": "2025-05-08T22:56:28.514357"
  },
  {
      "AI": "Hello! How can I assist you today?",
      "timestamp": "2025-05-08T22:56:30.645700",
      "type": "answer"
  },
  {
      "Human": "How do i connect to Zapier?",
      "timestamp": "2025-05-23T14:54:47.215796"
  },
  {
      "AI": "Visit the integrations tab in your bot...",
      "timestamp": "2025-05-23T14:54:52.215796"
  },
  {
      "AI": "Did that answer your question?",
      "timestamp": "2025-05-23T14:54:55.215796"
  }
]
```

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  supportCallback: function (event, history, metadata, ticket) {
    event.preventDefault() // Optionally prevent default behavior opening the url.
    console.log(history) // Safely access the chat history.
    console.log(ticket) //AI generated { `subject`, `message` }
    DocsBotAI.close() // Close the widget.
  },
}).then(() => {
  // Safely do stuff here after the widget is loaded.
})
```

### User Identification/Metadata

If you would like to record the user's name, email, or any other custom variables you can optionally pass an `identify` object with the properties you would like to record. These properties will be recorded in the question `metadata` of the chat history allowing you to view it in the chat logs or export it via the questions API endpoint. This can be useful to identify the user or metadata about them such as their subscription plan or any other custom data you would like to record. *This information is also visible to the AI model to provide answers or call tools.* You could for example provide a list of their latest orders and links to their status or other personalized data to answer common questions.

The properties `email`, and `name` if set will be shown in the question history logs of our dashboard instead of a pseudonomous user alias. Make sure that you are using the latest version of our widget embed code to take advantage of the `identify` feature.

{% callout title="Privacy and GDPR Considerations" %}
If you use the identify feature to record user's personal information, chat logs stored with DocsBot will no longer be anonymous. You should make sure that you have a privacy policy that discloses this to your users. You can add a Privacy Policy optin message in your widget footer. You should also make sure that you are not recording any sensitive information such as credit card numbers or passwords. We do not recommend recording any sensitive information in the chat history metadata.
{% /callout %}

### Example Code

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  identify: {
    name: 'John Doe', // This will be shown in the chat history logs.
    email: 'john@doe.com', // This will be shown in the chat history logs.
    customVariable: 'customValue', // This will be recorded in the question metadata and accessible via the API.
  },
}).then(() => {
  // Safely do stuff here after the widget is loaded.
})
```

The `DocsBotAI.init()` function returns a promise that resolves when the DocsBotAI window global is loaded and ready to be used. You can use this to safely do stuff with the widget after it's loaded, such as registering event listeners to open or close the widget based on user interactions. Note to open the widget immediately after it's loaded you might need to call `DocsBotAI.open()` inside a `setTimeout()` as the widget must be mounted to open it.

### Option Overrides

If you would like override the widget settings optionally pass an `options` object with the properties to override. Here is an example of the properties you can override:

```js
options: {
  isAgent: true, //wether to enable the more powerful agent mode
  useFeedback: true, //collect user feedback after answers
  useEscalation: true, // Enable the escalation button or agent tool
  botName: "DocsBot", //name of the bot.
  description: "Ask our AI support assistant your questions about our services.", //description of the bot. Only shown when no logo is present.
  allowedDomains: [
    "docsbot.ai"
  ], // Array of domains that the widget is allowed to be embedded on. If empty, any domain is allowed.
  color: "#0891b8", //color of the widget can be any hex color code.
  icon: "default", //icon for floating button can be "default" (comments), "robot", "life-ring", "question", "book", or an image url.
  alignment: "left", //alignment of the widget can be "left" or "right".
  headerAlignment: "center", //alignment of the header can be "left" or "center". Default is "center".
  logo: "https://yourdomain.com/imageurl.png", //logo for the header can be null, or a public image url. Recommended max height is 36px.
  hideHeader: false, //hide the header of the widget. Only works when embedded into a page. Default is false.
  botIcon: false, //icon for bot avatar can be "comment", "robot", "life-ring", "info", "book", or an image url. Default is false.
  supportLink: "https://docsbot.ai/", //link to your support page. If null|false, and no supportCallback is set, no button will be shown.
  showButtonLabel: true, // Show the button text label or not.
  hideSources: false, // Hide the sources in answers. Default is false. True to hide all, or pass an array of type to hide like ['qa', 'crawler']
  noURLSourceTypes: ['document', 'notion', 'confluence', 'salesforce', 'gitbook', 'guru', 'url', 'urls', 'sitemap', 'rss', 'wp', 'youtube', 'google_docs', 'gdrive', 'dropbox', 'onedrive', 'box', 'sharepoint', 'zotero', 'zendesk', 'intercom', 'freshdesk', 'servicenow', 'github', 's3', 'gcs'], // Don't allow clicking links to specific source type in answers. String or array of strings.
  labels: {
      poweredBy: 'Powered by',
      inputPlaceholder: 'Send a message...',
      firstMessage: 'What can I help you with?', //supports markdown
      sources: 'Sources',
      helpful: 'Rate as helpful', //title hover text
      unhelpful: 'Rate as unhelpful', //title hover text
      getSupport: 'Contact support', //only used with Agent mode off
      floatingButton: 'Help',
      suggestions: 'Not sure what to ask?',
      close: 'Close',
      create: 'Create your own!',
      thinking: 'Thinking...',
      rateLimitMessage: 'You are sending messages too fast. Please slow down.',
      feedbackMessage: 'Was this answer helpful?', //only used with Agent mode off
      feedbackYes: "Yes", //only used with Agent mode off
      feedbackNo: "No", //only used with Agent mode off
      resetChat: "Reset conversation", //title text
      footerMessage: "", // if set will show at conversation start. Supports Markdown. Set keepFooterVisible: true to keep it visible after a conversation starts.
    },, // Override all the default labels for your own language.
  keepFooterVisible: false, // Keep the footerMessage visible after a conversation starts. Default is false.
  horizontalMargin: 20, // Horizontal margin in pixels from side. Default is 20.
  verticalMargin: 20, // Vertical margin in pixels from bottom. Default is 20.
  customCSS: '', // Custom CSS to override the default styles.
  inputLimit: 500, // Limit the number of characters in the question input. Default is 500, can be set to max 2000 if widget is signed/authenticated.
  contextItems: 6, // Number of sources to lookup for the bot to answer from. Default is 6. Research mode uses 16 (more expensive token usage).
  questions: [
    "What is DocsBot?",
    "What services does DocsBot offer?",
    "How do I embed the DocsBot chat widget?",
    "Can I view the question and answer history of my DocsBot interactions?"
  ] // Array of example questions to show in the widget. Three are picked at random.
}
```

### Adjusting the Widget Position

For example if you need to change the margin/padding/position of the floating button and widget for your specific website embed you can adjust it by pixels like this:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  options: {
    horizontalMargin: 40,
    verticalMargin: 30,
  },
})
```

### Custom CSS

If you need to override the default styles of the widget you can pass a `customCSS` string with your custom styles. Note that you may need to use `!important` to override some element styles. Here is an example:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  options: {
    customCSS: `
      .docsbot-chat-inner-container {
        border-radius: 0;
      }
      .docsbot-user-chat-message {
        background-color: #00BCD4;
        color: #fff;
      }
    `,
  },
})
```

### Integration with a Support Form

If you would like to integrate the DocsBot widget with a support form on your site, you can simply add the url that contains or support form in your widget settings on our bot edit page. When the user clicks the link in the widget, it will open the url in a new tab.

### Integration with other Support Widgets

If your business uses an existing software product for support tickets or live chat, you can integrate it with our AI widget, allowing your users to click the get support link in the DocsBot Widget to talk to a human! Here are some examples of integrating with the most popular providers:

- [Help Scout Beacon](/documentation/developer/widget-integrations/helpscout)
- [Zendesk Web Widget](/documentation/developer/widget-integrations/zendesk)
- [Intercom Messenger](/documentation/developer/widget-integrations/intercom)
- [Freshdesk Widget](/documentation/developer/widget-integrations/freshdesk)
- [HubSpot Live Chat](/documentation/developer/widget-integrations/hubspot)

{% callout title="Other integrations" %}
If you would like to integrate with a different support widget, please let us know and we'll add it to our docs.
{% /callout %}

#### Generic Integration Example

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  supportCallback: function (event, history) {
    event.preventDefault() // Prevent default behavior opening the url.
    DocsBotAI.unmount() // Hide the DocsBot widget.
    // Run some JS here to open your support widget.
  },
})
```

### Other API Methods

There are several methods you can use to interact with the widget once it has been initialized.

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

// Add a user message to the chat
// If send is true, it will also open the widget and send the message for an AI answer
DocsBotAI.addUserMessage(message, send = false)

// Add a bot message to the chat (this will not show in history)
DocsBotAI.addBotMessage(message)

// Clear the chat history
DocsBotAI.clearChatHistory()
```

#### Adding Messages Programmatically

You can add messages to the chat programmatically using the `addUserMessage` and `addBotMessage` methods. These methods return a Promise that resolves when the message has been added to the chat.

```js
// Add a user message without sending
DocsBotAI.addUserMessage("Hello, I have a question").then(() => {
  console.log("User message added");
});

// Add a user message and send it (opens the widget if closed)
DocsBotAI.addUserMessage("What services does DocsBot offer?", true).then(() => {
  console.log("User message added and sent");
});

// Add a bot message
DocsBotAI.addBotMessage("Hello! How can I assist you today?").then(() => {
  console.log("Bot message added");
});
```

#### Clearing Chat History

You can clear the chat history programmatically using the `clearChatHistory` method. This method returns a Promise that resolves when the history has been cleared.

```js
DocsBotAI.clearChatHistory().then(() => {
  console.log("Chat history cleared");
});
```

{% callout type="warning" title="Widget must be mounted" %}
These methods will only work if the widget has been mounted. If the widget is not mounted, they will log a warning to the console and resolve the Promise with `false`.
{% /callout %}

### JavaScript Events

The DocsBot AI widget dispatches custom events for internal communication. While these events are primarily used internally, advanced users may find them useful for creating custom integrations or behaviors. Here's a list of the events dispatched:

1. `docsbot_fetching_answer`: Triggered when the widget starts fetching an answer for a question. Includes the question as detail.
2. `docsbot_fetching_answer_complete`: Fired when the widget has finished fetching an answer. Includes the final data object as detail.

These events can be listened to using standard JavaScript event listeners. For example:

```javascript
document.addEventListener("docsbot_fetching_answer", (event) => {
  console.log(`Fetching answer for question: ${event.detail.question}`);
});

document.addEventListener("docsbot_fetching_answer_complete", (event) => {
  console.log("Answer fetched:", event.detail);
});
```

Note that these events are dispatched on the `document` object.

If you need us to add more events or methods, just let us know and we'll see what we can do!
