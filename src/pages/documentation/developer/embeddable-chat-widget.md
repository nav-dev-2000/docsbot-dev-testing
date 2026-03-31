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
- **Copy button** - Toggle a copy-to-clipboard button after answers.
- **Language** - Choose the language that the widget will be displayed in.

Here is a list of the languages we currently support, if you would like to see another language added please let us know:

> English, 日本語 (Japanese), العربية (Arabic), 简体中文 (Chinese Simplified), Čeština (Czech), Dansk (Danish), Nederlands (Dutch), Filipino, Suomi (Finnish), Français (French), Deutsch (German), Ελληνικά (Greek), עברית (Hebrew), हिन्दी (Hindi), Magyar (Hungarian), Bahasa Indonesia (Indonesian), Italiano (Italian), 한국어 (Korean), Norsk (Norwegian), Polski (Polish), Português (Portuguese), Română (Romanian), Русский (Russian), Српски (Serbian), Español (Spanish), Kiswahili (Swahili), Svenska (Swedish), ไทย (Thai), Türkçe (Turkish)

**Note**: Changes to your widget settings will not be reflected on your site until you reload the page as long as five minutes after you save your changes. For best performance we cache the widget settings for five minutes on our CDN.

If you need to customize the widget appearance at a deeper level than our settings provide, see the [Custom CSS](#custom-css) section below for more details.

## Security

### Restricting Domains

We allow you to embed the widget on any domain by default, but you can restrict the domains that the widget can be embedded on in the widget settings on the bot page. This is useful if you want to restrict the widget to only be embedded on your own domains. Note that you will have to add each domain including subdomains separately. Example: `docsbot.ai` and `www.docsbot.ai` are considered separate domains. We do not support wildcards at this time.

### Embedding Private Bots

**Bots that are set to _private_ require authentication** before the widget can call the DocsBot API. **We recommend** a signed JWT with **`team_id` and `bot_id`** in the payload; legacy HMAC and user API key Bearer auth are also supported. Full details, JWT requirements, and HMAC generation examples are in [Authentication — Private bots](/documentation/developer/authentication#private-bots).

Configure the widget with a JWT or, for the HMAC flow, pass the server-generated `hex:expires` string via the `signature` parameter:

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  signature: 'f95b5d6431fe76854fe14384123225cff9501ed6cd08dff12c1897a93badabbc:1693821134',
})
```

> **Note:** The `bot_id` used when generating HMAC or JWT on the server is the **second** UUID in the widget `id` (e.g. `ZrbLG98bbxZ9EFqiPvyl/UMADr9eozeBQ8sZKr0GW` → bot id `UMADr9eozeBQ8sZKr0GW`).

## Widget API

You can also interact with the widget using the following API if you want to create custom behaviors or integrate with other support tools.

### Initialization

`DocsBotAI.init()` is used to initialize the widget. It takes an object with the various properties. The only required property is the `id` property which is the unique id of your bot created from your `teamId` and `botId`. You can find this id on the [Bot](/app/bots) page for your specific bot.

### User Identification/Metadata

If you would like to record the user's name, email, or any other custom variables you can optionally pass an `identify` object with the properties you would like to record. These properties will be recorded in the question `metadata` of the chat history allowing you to view it in the chat logs or export it via the questions API endpoint. This can be useful to identify the user or metadata about them such as their subscription plan or any other custom data you would like to record. *This information is also visible to the AI model to provide answers or call tools.* You could for example provide a list of their latest orders and links to their status or other personalized data to answer common questions.

The properties `email`, and `name` if set will be shown in the question history logs of our dashboard instead of a pseudonomous user alias. Make sure that you are using the latest version of our widget embed code to take advantage of the `identify` feature.

**`priv_` keys in `identify`:** Do not use the `priv_` prefix on keys inside the embed `identify` object. Those entries are **ignored**—they are not applied as trusted private metadata, are **not** stored for tools, and the **AI never sees them**. Use a **signed JWT** (see below) for any `priv_*` values.

{% callout title="Privacy and GDPR Considerations" %}
If you use the identify feature to record user's personal information, chat logs stored with DocsBot will no longer be anonymous. You should make sure that you have a privacy policy that discloses this to your users. You can add a Privacy Policy optin message in your widget footer. You should also make sure that you are not recording any sensitive information such as credit card numbers or passwords. We do not recommend recording any sensitive information in the chat history metadata.
{% /callout %}


### Trusted private metadata with Bearer JWT

Use the embed `identify` object for **public** context (visible in logs and to the AI unless overridden—see merge behavior below). For trusted private metadata (`priv_*` keys), send a **signed JWT from your server** as the Bearer token (signing algorithm, required claims, and private-bot options are covered in [Authentication](/documentation/developer/authentication#private-bots)):

```http
Authorization: Bearer <jwt>
```

**Merging embed `identify` with JWT `metadata`**  
Public fields from the embed `identify` object are kept and sent with the conversation. Trusted **`metadata` inside a valid JWT** is merged on top: if the same key exists in both places, the **JWT value wins** (server-issued override). Keys prefixed with `priv_` in the JWT are never shown to the AI and are **not** stored in **chat logs** or **question history** (see below).

**Why signing is required**  
If metadata were set only in client-side code, an attacker could change values (for example, another user’s Stripe customer ID) and affect other customers’ accounts. By signing the payload on your server with a secret, only your backend can issue valid metadata; the widget and API accept it only when the JWT signature is valid. Unsigned or tampered private metadata is ignored.

**What `priv_` means (in JWT `metadata` only)**  
When set inside **signed JWT** `metadata`, keys prefixed with `priv_` are treated as private: they are **not** stored in **chat logs** or **question history** (dashboard or exports), and **not** sent to the LLM. They are only available to internal tools (e.g. Stripe billing tools) so you can safely pass identifiers like `priv_stripe_customer_id` without exposing them in logs or model context. **`priv_` keys in the client-side `identify` object are always ignored** and are not available to the AI—use the JWT only.

Do not place private metadata in client-side widget config. [For Stripe actions, pass `priv_stripe_customer_id` inside the signed JWT metadata payload](/documentation/developer/stripe-actions). **Keep passing `identify` and any public metadata in the embed** so they are available to lead capture and other client-side features. The **[support callback](#support-callback)** receives **public metadata only**—`priv_*` JWT values are never passed into that callback.

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

#### Agent activity (reasoning and tools)

In **agent mode**, the widget can show an **agent activity** row while a reply is streaming: live **reasoning** summaries from reasoning SSE events (often shown as a “thinking” line) and **tool** status for tool calls—for example searching documentation or the web. String labels for those states are customizable under `options.labels` (for example `agentActivityThinking`, `agentActivitySearchDocumentation`, `agentActivityWebSearch`, optional finer-grained web-search strings such as `agentActivityWebSearchQuery` / `agentActivityWebSearchOpeningPage` / `agentActivityWebSearchSearchingPage` (placeholders `{query}`, `{url}`, `{pattern}`), `bookingStatus*` and `bookingSummary*` for booking tools, and other `agentActivity*` keys in the example below).

```js
options: {
  isAgent: true, // whether to enable the more powerful agent mode
  showAgentActivity: true, // optional: set to false to hide the agent activity row (reasoning + tool status). Omit for default (shown).
  useFeedback: true, //collect user feedback after answers
  useEscalation: true, // Enable the escalation button or agent tool
  botName: "DocsBot", //name of the bot.
  description: "Ask our AI support assistant your questions about our services.", //description of the bot. Only shown when no logo is present.
  allowedDomains: [
    "docsbot.ai"
  ], // Array of domains that the widget is allowed to be embedded on. If empty, any domain is allowed.
  linkSafetyEnabled: true, // Prompt before navigating to external links outside the current site or allowed domains (and subdomains). Default is false.
  color: "#0891b8", //color of the widget can be any hex color code.
  icon: "default", //icon for floating button can be "default" (comments), "robot", "life-ring", "question", "book", or an image url.
  alignment: "left", //alignment of the widget can be "left" or "right".
  headerAlignment: "center", //alignment of the header can be "left" or "center". Default is "center".
  logo: "https://yourdomain.com/imageurl.png", //logo for the header can be null, or a public image url. Recommended max height is 36px.
  hideHeader: false, //hide the header of the widget. Only works when embedded into a page. Default is false.
  botIcon: false, //icon for bot avatar can be "comment", "robot", "life-ring", "info", "book", or an image url. Default is false.
  supportLink: "https://docsbot.ai/", //link to your support page. If null|false, and no supportCallback is set, no button will be shown.
  showButtonLabel: true, // Show the button text label or not.
  showCopyButton: false, // Show a copy button after answers. Default is false.
  hideSources: false, // Hide the sources in answers. Default is false. True to hide all, or pass an array of type to hide like ['qa', 'crawler']
  noURLSourceTypes: ['document', 'notion', 'confluence', 'salesforce', 'gitbook', 'guru', 'url', 'urls', 'sitemap', 'rss', 'wp', 'youtube', 'google_docs', 'gdrive', 'dropbox', 'onedrive', 'box', 'sharepoint', 'zotero', 'zendesk', 'intercom', 'freshdesk', 'servicenow', 'github', 's3', 'gcs'], // Don't allow clicking links to specific source type in answers. String or array of strings.
  leadCollect: {
    enabled: true, // set false to keep config saved but disable showing the form
    mode: 'before_response', // 'before_response' | 'before_escalation'
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, minLength: 2, maxLength: 80 },
      { key: 'email', label: 'Email', type: 'email', required: true, maxLength: 120 },
      { key: 'phone', label: 'Phone', type: 'tel', pattern: '^\\+?[0-9\\s\\-()]{7,20}$' },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com' },
      { key: 'teamSize', label: 'Team Size', type: 'number', min: 1, max: 50000, step: 1 },
      { key: 'goLiveDate', label: 'Go Live Date', type: 'date', min: '2025-01-01', max: '2030-12-31' },
      { key: 'companySize', label: 'Company Size', type: 'select', required: true, options: [
        { value: '1-10', label: '1-10' },
        { value: '11-50', label: '11-50' },
      ]},
      { key: 'notes', label: 'Anything else?', type: 'textarea' },
    ],
  }, // Lead capture form shown before response/escalation.
  labels: {
      poweredBy: 'Powered by',
      inputPlaceholder: 'Send a message...',
      firstMessage: 'What can I help you with?', // supports markdown
      sources: 'Sources',
      helpful: 'Rate as helpful', // title hover text
      unhelpful: 'Rate as unhelpful', // title hover text
      getSupport: 'Contact support', // only used with Agent mode off
      floatingButton: 'Help',
      suggestions: 'Not sure what to ask?',
      close: 'Close',
      create: 'Create your own!',
      submit: 'Submit',
      cancel: 'Cancel',
      agentActivityThinking: 'Thinking…',
      agentActivityTool: 'Working…',
      agentActivitySearchDocumentation: 'Searching documentation…',
      agentActivityWebSearch: 'Searching the web…',
      agentActivityWebSearchQuery: 'Searching web for {query}',
      agentActivityWebSearchOpeningPage: 'Opening {url}',
      agentActivityWebSearchSearchingPage: 'Searching page for {pattern}',
      agentActivityCodeInterpreter: 'Running code…',
      agentActivityStripeRecentInvoicesAndSubscriptions: 'Fetching account data…',
      agentActivityStripeBillingPortal: 'Creating billing portal link…',
      agentActivityStripeRefundLatestPayment: 'Processing refund…',
      agentActivityStripeCancelSubscription: 'Processing cancellation…',
      bookingStatusBooked: 'Booked',
      bookingStatusRescheduled: 'Rescheduled',
      bookingSummaryEvent: 'Event',
      bookingSummaryStarts: 'Starts',
      bookingSummaryEnds: 'Ends',
      stripeAmount: 'Amount',
      stripeInvoice: 'Invoice',
      stripeAmountDue: 'Due',
      stripeAmountPaid: 'Paid',
      stripeDate: 'Date',
      stripeViewInvoice: 'View invoice',
      stripeHideLineItems: 'Hide line items',
      stripeViewLineItems: 'View {count} line item(s)',
      stripeItem: 'Item',
      stripeQty: 'Qty',
      stripeSubscription: 'Subscription',
      stripeCurrentPeriod: 'Current period',
      stripeTrialEnds: 'Trial ends',
      stripeTrialDayLeft: 'day left',
      stripeTrialDaysLeft: 'days left',
      stripeCancelsAtPeriodEnd: 'Cancels at period end',
      stripeIntervalDay: 'day',
      stripeIntervalWeek: 'week',
      stripeIntervalMonth: 'month',
      stripeIntervalYear: 'year',
      stripeIntervalDays: 'days',
      stripeIntervalWeeks: 'weeks',
      stripeIntervalMonths: 'months',
      stripeIntervalYears: 'years',
      stripeStatusDraft: 'Draft',
      stripeStatusOpen: 'Open',
      stripeStatusPaid: 'Paid',
      stripeStatusUncollectible: 'Uncollectible',
      stripeStatusVoid: 'Void',
      stripeStatusIncomplete: 'Incomplete',
      stripeStatusIncompleteExpired: 'Incomplete expired',
      stripeStatusTrialing: 'Trialing',
      stripeStatusActive: 'Active',
      stripeStatusPastDue: 'Past due',
      stripeStatusPastDueUnresolved: 'Past due (unresolved)',
      stripeStatusCanceled: 'Canceled',
      stripeStatusUnpaid: 'Unpaid',
      stripeStatusPaused: 'Paused',
      rateLimitMessage: 'You are sending messages too fast. Please slow down.',
      leadCollectMessage: 'Before we continue, could you share a few details?',
      requiredField: 'Please fill out required fields.',
      continue: 'Continue',
      leadCollectEmpty: 'No fields configured.',
      selectOption: 'Select an option',
      feedbackMessage: 'Was this answer helpful?', // only used with Agent mode off
      feedbackYes: 'Yes', // only used with Agent mode off
      feedbackNo: 'No', // only used with Agent mode off
      resetChat: 'Reset conversation', // title text
      footerMessage: '', // if set, shown at conversation start; supports Markdown. Set keepFooterVisible: true to keep it visible after a conversation starts.
      copyResponse: 'Copy response',
      copied: 'Copied!',
    }, // Optional per-key overrides; see Labels and internationalization below.
  keepFooterVisible: false, // Keep the footerMessage visible after a conversation starts. Default is false.
  horizontalMargin: 20, // Horizontal margin in pixels from side. Default is 20.
  verticalMargin: 20, // Vertical margin in pixels from bottom. Default is 20.
  customCSS: '', // Custom CSS to override the default styles.
  inputLimit: 500, // Limit the number of characters in the question input. Default is 500, can be set to max 2000 if widget is signed/authenticated.
  contextItems: 6, // Number of sources to lookup for the bot to answer from. Default is 6. Context boost uses 16 (more expensive token usage).
  reasoningEffort: 'medium', // Optional reasoning depth in agent mode (default: 'none' for GPT-5.1 and GPT-5.4, 'minimal' for GPT-5). Valid values: 'none', 'minimal', 'low', 'medium', 'high', 'xhigh'. Requires signed request.
  suggestedQuestions: 3, // override number of random suggested questions (default 3)
  questions: [
    "What is DocsBot?",
    "What services does DocsBot offer?",
    "How do I embed the DocsBot chat widget?",
    "Can I view the question and answer history of my DocsBot interactions?"
  ] // Array of example questions to show in the widget. Suggestions are picked at random.
}
```

### Scheduling Tools

Use `useCalendly`, `useCalCom`, or `useTidyCal` to enable booking tools in the widget. These options are booleans only. The actual booking URL and behavior are configured on the bot via `bot.tools`.

```js
DocsBotAI.init({
  id: "teamId/botId",
  options: {
    useCalendly: true,
    useCalCom: false,
    useTidyCal: false
  }
})
```

### Labels and internationalization

The widget detects the visitor's browser language and loads a matching language pack when available. Dashboard **label** customizations interact with that behavior as follows:

- **Browser language matches the bot language** (the language chosen in bot settings): the widget uses your dashboard copy for customizable strings such as the **first message**, **floating button text**, and **footer message**.
- **Browser language does not match the bot language**: the widget uses the **default strings** from the detected locale pack for the UI. Dashboard customizations for the **first message** and **button text** are not applied; the **footer message** still comes from the dashboard as it's optional and may include important legal notices.
- **`options.labels` in embed code**: any label keys you set in the embed **always** take effect for those keys, regardless of browser language or dashboard settings. This allows you to do your own language customization logic.

### Lead Collection

Use `options.leadCollect` to require users to complete a lead form before the chat continues.

```ts
type LeadCollectMode = 'before_response' | 'before_escalation';

type LeadFieldType =
  | 'text'
  | 'email'
  | 'tel'
  | 'url'
  | 'number'
  | 'textarea'
  | 'select'
  | 'date'
  | 'datetime-local'
  | 'month'
  | 'time'
  | 'week'
  | 'color';

type LeadFieldOption = string | { value: string; label?: string };

interface LeadField {
  key: string;                  // required, unique metadata key
  label?: string;
  type?: LeadFieldType;         // default: 'text'
  required?: boolean;           // default: false
  placeholder?: string;         // shown for: text, email, tel, url, textarea, select
  help?: string;
  options?: LeadFieldOption[];  // select only, required for select
  pattern?: string;             // text/email/tel/url
  min?: string | number;        // number/date/time/datetime-local/month/week
  max?: string | number;        // number/date/time/datetime-local/month/week
  step?: string | number;       // number/date/time/datetime-local/month/week
  minLength?: number;           // text/email/tel/url/textarea
  maxLength?: number;           // text/email/tel/url/textarea
  autocomplete?: string;        // auto-derived from type/key when available
  inputMode?: string;           // auto-derived from type when available
  // value?: string  <-- ignored
}

interface LeadCollectOptions {
  enabled?: boolean;            // default: true
  mode: LeadCollectMode;        // required
  fields: LeadField[];          // required, non-empty
}
```

Behavior details:

- Prefill source is `identify` metadata only, matched by `field.key`.
- `field.value` in `leadCollect.fields` is ignored by design.
- `fields[].key` and select `options[].value` are sanitized to valid HTML input-name chars: `A-Z a-z 0-9 _ . : [ ] -`.
- `options[].label` is not sanitized and can include spaces/symbols.
- `autocomplete` and `inputMode` are auto-derived from field type/key when available.
- Prefilled values are disabled in the form, but still included in the submit payload.
- Continue stays disabled until required fields are complete.
- While lead form is visible, chat input/send/upload controls are disabled.
- Submit flow merges metadata, posts to `/teams/{team_id}/bots/{bot_id}/conversations/{conv_id}/lead`, closes lead messages, then resumes the original flow.
- `supportCallback` escalation uses the Continue click event context for popup-safe behavior.
- `datetime` is accepted as input and normalized to `datetime-local`.
- `rows` is not supported and ignored.

Validation rules:

- `leadCollect.mode` is required and must be `before_response` or `before_escalation`.
- `fields[].key` is required and must be unique.
- `fields[].type === 'select'` requires non-empty `options`.
- Placeholder is ignored for field types that do not support it (`number`, `date`, `datetime-local`, `time`, `month`, `week`, `color`).
- Unknown keys are pass-through safe and ignored by renderer.

Plan gating:

- Free and Hobby plans: lead collection is disabled in the widget API response.
- Personal and Pro plans: lead collection is enabled, but only `name` and `email` fields are returned.
- Standard and above: custom lead fields are supported.

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

### Support Callback

If you would like to run a callback when the user clicks the support link in the widget you can pass a `supportCallback` function. The callback receives the `event`, `history`, and `metadata` objects, and when Agent Mode is enabled a fourth `ticket` object.

The `metadata` argument is **public metadata only**: values from the embed `identify` object (excluding ignored `priv_*` keys) and any **non-`priv_*`** fields from merged JWT `metadata`. **`priv_*` values from the signed JWT are not included**—they are not exposed to client-side callbacks, are not stored in chat/question logs, and are not shown to the AI (see [Trusted private metadata with Bearer JWT](#trusted-private-metadata-with-bearer-jwt)).

The `metadata` object includes any values passed through `identify` (including nested `identify.metadata` when used). In Agent Mode it also contains:

- `conversationId` – the ID of the current conversation.
- `conversationUrl` – a direct link to view the conversation in your DocsBot dashboard.

You can use this callback to open your own support modal or live chat widget, or to prefill and submit a support ticket with the chat history or AI written ticket.

{% callout title="Ticket Creation Plan Limitations" %}
The ticket creation endpoint is only available on our Standard plan and above. If you are on a lower/legacy plan, `ticket` will be `null`.
{% /callout %}

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
    console.log(metadata.conversationUrl) // direct link to the conversation
    console.log(ticket) // AI generated { `subject`, `message` }
    DocsBotAI.close() // Close the widget.
  },
}).then(() => {
  // Safely do stuff here after the widget is loaded.
})
```
### Integration with other Support Widgets

If your business uses an existing software product for support tickets or live chat, you can integrate it with our AI widget, allowing your users to click the get support link in the DocsBot Widget to talk to a human! Here are some examples of integrating with the most popular providers:

- [Help Scout Beacon](/documentation/developer/widget-integrations/helpscout)
- [Zendesk Web Widget](/documentation/developer/widget-integrations/zendesk)
- [Intercom Messenger](/documentation/developer/widget-integrations/intercom)
- [Freshdesk Widget](/documentation/developer/widget-integrations/freshdesk)
- [HubSpot Live Chat](/documentation/developer/widget-integrations/hubspot)
- [Zoho Chat Integration](/documentation/developer/widget-integrations/zoho-chat)
- [LiveChat Integration](/documentation/developer/widget-integrations/livechat)
- [Gorgias Integration](/documentation/developer/widget-integrations/gorgias)

{% callout title="Other integrations" %}
If you would like to integrate with a different support widget, please let us know and we'll add it to our docs.
{% /callout %}

#### Generic Integration Example

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  supportCallback: function (event, history, metadata) {
    event.preventDefault() // Prevent default behavior opening the url.
    DocsBotAI.unmount() // Hide the DocsBot widget.
    // Run some JS here to open your support widget.
    console.log(metadata.conversationId)
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
3. `docsbot_tool_call`: Fired whenever a `tool_call` SSE event arrives. The payload is normalized as:

```js
{
  name: "book_tidycal",
  data: { ...parsedToolParams }
}
```

These events can be listened to using standard JavaScript event listeners. For example:

```javascript
document.addEventListener("docsbot_fetching_answer", (event) => {
  console.log(`Fetching answer for question: ${event.detail.question}`);
});

document.addEventListener("docsbot_fetching_answer_complete", (event) => {
  console.log("Answer fetched:", event.detail);
});

document.addEventListener("docsbot_tool_call", function (event) {
  console.log("Tool call received:", event.detail.name, event.detail.data);
});
```

Note that these events are dispatched on the `document` object.

If you need us to add more events or methods, just let us know and we'll see what we can do!
