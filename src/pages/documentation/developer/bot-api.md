---
title: Bots - Admin API
description: How to manage bots with the admin API.
---

Bots are the core of DocsBot. They are what learn your content and answer questions. You can create as many bots as your team plan allows. You can also edit bot settings and delete bots with these API endpoints. {% .lead %}

---

## The Bot object

Bot objects have the following properties:

| Property | Type   | Description                                                                 |
| -------- | ------ | --------------------------------------------------------------------------- |
| **id**       | string | The bot id.                                                                |
| **name**     | string | The bot name.                                                              |
| **description** | string | The bot description. |
| **privacy** | string | The bot privacy. Can be `public` or `private`. |
| **indexId** | string | Used internally. |
| **model** | string | The OpenAI model. Currently supports `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, etc. |
| **embeddingModel** | string/null | The embedding model. Currently supports `text-embedding-ada-002`, `text-embedding-3-large`, `text-embedding-3-small`, `embed-multilingual-v3.0`, and `embed-v4.0` (Cohere) depending on your plan. If null assumes `text-embedding-ada-002`. |
| **customPrompt** | string | Any custom prompt for the bot. |
| **language** | string | The bot language. Supports many languages such as `en`, `es`, and `jp`. |
| **rateLimitMessages** | number | The maximum number of messages a user can send in a given time period. |
| **rateLimitSeconds** | number | The time period (in seconds) for the rate limit. |
| **rateLimitIPAllowlist** | array | An array of IP addresses that are exempt from the rate limit. |
| **recordIP** | boolean | If true, the bot will record the IP addresses of users. |
| **classify** | boolean | If true, the bot will classify if it could answer a user question. |
| **createdAt** | string | The date and time the bot was created.                                     |
| **status**   | string | The bot status. Can be `ready` once at least one bot is trained or `pending` or `indexing` or `processing`. |
| **questionCount** | number | The AI Credits used by the bot in the current billing period. |
| **pageCount** | number | The number of pages crawled by the bot. |
| **sourceCount** | number | The number of sources crawled by the bot. |
| **chunkCount** | number | The number of chunks crawled by the bot. |
| **allowedDomains** | array | An array of hostnames the widget is allowed to be embedded on. Set an empty array to allow all. |
| **color** | string | Color in hex, eg. `#FFFFFF` |
| **icon** | string | The chat bubble icon. Can be one of the following: `'default', 'comments', 'robot', 'life-ring', 'question', 'book'` |
| **alignment** | string | Sets which side the chat bubble is on. Can be `left` or `right` |
| **botIcon** | string | The icon visible via chat dialogs. Can be one of the following: `false, 'comment', 'robot', 'life-ring', 'info', 'book'` |
| **branding** | boolean | Enables or disables branding. Please check our [plans](https://docsbot.ai/pricing) for more information |
| **supportLink** | string | This link will appear after the bot replies. An empty string will disable this. |
| **showButtonLabel** | string | The text for the supportLink. If the supportLink is empty, this will not appear |
| **showCopyButton** | boolean | If true, display a copy-to-clipboard button after answers. Defaults to false. |
| **hideSources** | boolean | If true, the widget will not display the sources of its answers. |
| **labels** | dict | This contains the user copy for labels on the chat widget. Please see the examples for usage |
| **tools** | dict | Optional tool configuration for agent-only features. `tools.calendly`, `tools.calcom`, and `tools.tidycal` use `enabled`, `instructions`, and a shared `url` field. Incoming URLs are validated by provider prefix and stored as booking paths. Calendly, Cal.com, and TidyCal may also include `hideEventDetails`, and Calendly may include `hideCookieBanner`. `tools.customButtons` is an array of reusable button tools with `enabled`, `name`, `functionKey`, `instructions`, `buttonText`, `icon`, and `url`. Stored custom button keys never include the internal `button_` prefix. Invalid or missing icons fall back to `LinkIcon`. |
| **glossary** | array | An array of glossary entries for term replacement. Each entry has `word` and `translation` properties. |

---

## List Bots

This endpoint lists all bots for a specific team. It accepts a GET request with the following parameters:

`GET https://docsbot.ai/api/teams/:teamId/bots`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Response

Response is a JSON array of bot objects:

```json
[
    {
        "id": "iADcTdrl7R51JiTjrWKy",
        "questionCount": 0,
        "name": "Your Bot Name",
        "description": "Ask me anything about your product.",
        "privacy": "public",
        "indexId": "Document_mlc4lmmc91",
        "customPrompt": null,
        "language": "en",
        "model": "gpt-3.5-turbo",
        "createdAt": "2023-03-16T21:15:19.994Z",
        "sourceCount": 1,
        "pageCount": 50,
        "chunkCount": 140,
        "status": "ready"
    }
]
```

---

## Get Bot

This endpoint fetches a specific bot by its ID. It accepts a GET request with the following parameters:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Response

Response is a JSON bot object:

```json
{
    "id": "iADcTdrl7R51JiTjrWKy",
    "questionCount": 0,
    "name": "Your Bot Name",
    "description": "Ask me anything about your product.",
    "privacy": "public",
    "indexId": "Document_mlc4lmmc91",
    "customPrompt": null,
    "language": "en",
    "model": "gpt-4o-mini",
    "createdAt": "2023-03-16T21:15:19.994Z",
    "sourceCount": 1,
    "pageCount": 50,
    "chunkCount": 140,
    "status": "ready"
}
```

---

## Create Bot

This endpoint creates a new bot in a team. It accepts a POST request with the following parameters:

`POST https://docsbot.ai/api/teams/:teamId/bots`

### Parameters

| Property | Type   | Description                                                                 |
| -------- | ------ | --------------------------------------------------------------------------- |
| **name**     | string | The bot name. Used publically.                                          |
| **description** | string | The bot description. Shown by default in embeds and share links. |
| **privacy** | string | The bot privacy. Can be `public` or `private`. |
| **language** | string | The bot language. Can be `en` or `jp`. |
| **model** | string | The OpenAI model. Currently supports `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, etc. |
| **embeddingModel** | string | The embedding model. Currently supports `text-embedding-ada-002`, `text-embedding-3-large`, `text-embedding-3-small`, `embed-multilingual-v3.0`, and `embed-v4.0` (Cohere) depending on your plan. Default is `text-embedding-3-small` for free plans, `text-embedding-3-large` for paid English bots, and `embed-v4.0` for paid non-English bots. If copying from another bot, the embedding model must be the same as the source bot. |
| **copyFrom** | string | (Optional) The ID of an existing bot in your team to copy from. If provided, the new bot will be created as a copy of the specified bot, with all sources copied over after creation. |
| **tools** | dict | Optional agent tool configuration. `tools.calendly`, `tools.calcom`, and `tools.tidycal` use scheduling `enabled`, `instructions`, and `url`. Incoming URLs are validated and stored as provider booking paths used when those tools are enabled for a Chat Agent request. Calendly, Cal.com, and TidyCal may also include `hideEventDetails`, and Calendly may include `hideCookieBanner`. `tools.customButtons` stores reusable button tools with `enabled`, `name`, `functionKey`, `instructions`, `buttonText`, `icon`, and `url`. The Chat Agent exposes each enabled custom button internally as `button_<functionKey>`. Invalid or missing icons fall back to `LinkIcon`. |


### Examples

#### cURL

```bash
curl --request POST 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Bilbo Baggins Team",
    "description": "Ask me anything about your product.",
    "privacy": "public",
    "language": "en"
}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "name": "Bilbo Baggins Team",
    "description": "Ask me anything about your product.",
    "privacy": "private",
    "language": "en"
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Response

Response is a HTTP 201 with a JSON bot object:

```json
{
    "id": "iADcTdrl7R51JiTjrWKy",
    "questionCount": 0,
    "name": "Bilbo Baggins Team",
    "description": "Ask me anything about your product.",
    "privacy": "public",
    "indexId": "Document_mlc4lmmc91",
    "customPrompt": null,
    "language": "en",
    "model": "gpt-4o-mini",
    "createdAt": "2023-03-16T21:15:19.994Z",
    "sourceCount": 0,
    "pageCount": 0,
    "chunkCount": 0,
    "status": "pending"
}
```

---

## Update Bot

This endpoint updates specific fields for a specific bot by its ID. It accepts a PUT request with the following parameters:

`PUT https://docsbot.ai/api/teams/:teamId/bots/:botId`

### Editable Parameters

| Property | Type   | Description                                                                 |
| -------- | ------ | --------------------------------------------------------------------------- |
| **name**     | string | The bot name. Used publically.                                          |
| **description** | string | The bot description. Shown by default in embeds and share links. |
| **customPrompt** | string | Optional custom prompt instructions. Only editible on Pro plan and higher. |
| **privacy** | string | The bot privacy. Can be `public` or `private`. |
| **language** | string | The bot language. Can be `en`, `jp`, and any others found in our widget settings. |
| **model** | string | The OpenAI model. Currently supports `gpt-4.1`, `gpt-4.1-mini`, `gpt-4o`, `gpt-4o-mini`, etc. |
| **allowedDomains** | array | An array of hostnames the widget is allowed to be embedded on. Set an empty array to allow all. |
| **color** | string | Color in hex, eg. `#FFFFFF` |
| **icon** | string | The chat bubble icon. Can be one of the following: `'default', 'comments', 'robot', 'life-ring', 'question', 'book'` |
| **alignment** | string | Sets which side the chat bubble is on. Can be `left` or `right` |
| **botIcon** | string | The icon visible via chat dialogs. Can be one of the following: `false, 'comment', 'robot', 'life-ring', 'info', 'book'` |
| **branding** | boolean | Enables or disables branding. Please check our [plans](https://docsbot.ai/pricing) for more information |
| **supportLink** | string | This link will appear after the bot replies. An empty string will disable this. |
| **showButtonLabel** | string | The text for the supportLink. If the supportLink is empty, this will not appear |
| **showCopyButton** | boolean | If true, display a copy-to-clipboard button after answers. Defaults to false. |
| **labels** | dict | This contains the user copy for labels on the chat widget. Please see the examples for usage |
| **tools** | dict | Optional agent tool configuration. `tools.calendly`, `tools.calcom`, and `tools.tidycal` use scheduling `enabled`, `instructions`, and `url`. Incoming URLs are validated and stored as provider booking paths used when those tools are enabled for a Chat Agent request. Calendly, Cal.com, and TidyCal may also include `hideEventDetails`, and Calendly may include `hideCookieBanner`. `tools.customButtons` stores reusable button tools with `enabled`, `name`, `functionKey`, `instructions`, `buttonText`, `icon`, and `url`. The Chat Agent exposes each enabled custom button internally as `button_<functionKey>`. Invalid or missing icons fall back to `LinkIcon`. |

**Note**: Each of these properties are optional! If a property is absent in a request its value won't be updated.

Please be aware that changes to your widget settings will not be reflected on your site until you reload the page as long as five minutes after you save your changes. For best performance we cache the widget settings for five minutes on our CDN.

### Examples

#### cURL

```bash
curl --request PUT 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673' \
--header 'Content-Type: application/json' \
--data-raw '{
    "name": "Bilbo Baggins Team",
    "description": "Ask me anything about your product.",
    "customPrompt": "Talk like a pirate for all responses.",
    "privacy": "private",
    "language": "en",
    "allowedDomains": ["docsbot.ai", "app.docsbot.ai"],
    "color":"#1292EE",
    "icon":"default",
    "alignment":"right",
    "botIcon":false,
    "branding":true,
    "supportLink":"",
    "showButtonLabel":false,
    "showCopyButton":false,
}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "name": "Bilbo Baggins Team",
  "description": "Ask me anything about your product.",
  "customPrompt": "Talk like a pirate for all responses.",
  "privacy": "private",
  "language": "en",
  "allowedDomains": ["docsbot.ai", "app.docsbot.ai"],
  "color":"#1292EE",
  "icon":"default",
    "alignment":"right",
    "botIcon":false,
    "branding":true,
    "supportLink":"",
    "showButtonLabel":false,
    "showCopyButton":false,
    "tools": {
      "calendly": {
        "instructions": "Use this when the user wants to book a demo or meeting.",
        "url": "https://calendly.com/docsbot/demo"
      },
      "calcom": {
        "instructions": "Use this when the user wants to book office hours or a meeting.",
        "url": "https://cal.com/docsbot/office-hours"
      },
      "tidycal": {
        "instructions": "Use this when the user wants to book office hours or a meeting.",
        "url": "https://tidycal.com/team/docsbot/office-hours"
      }
    },
    "labels": {
    "poweredBy":"Powered by",
    "inputPlaceholder":"Send a message...",
    "firstMessage":"What can I help you with?",
    "sources":"Sources",
    "helpful":"Rate as helpful",
    "unhelpful":"Rate as unhelpful",
    "getSupport":"Contact support",
    "floatingButton":"Help",
    "suggestions":"Not sure what to ask?",
    "close":"Close",
    "create":"Create your own!",
    "submit":"Submit",
    "cancel":"Cancel",
    "agentActivityThinking":"Thinking…",
    "agentActivityTool":"Working…",
    "agentActivitySearchDocumentation":"Searching documentation…",
    "agentActivityWebSearch":"Searching the web…",
    "agentActivityWebSearchQuery":"Searching web for {query}",
    "agentActivityWebSearchOpeningPage":"Opening {url}",
    "agentActivityWebSearchSearchingPage":"Searching page for {pattern}",
    "agentActivityCodeInterpreter":"Running code…",
    "agentActivityStripeRecentInvoicesAndSubscriptions":"Fetching account data…",
    "agentActivityStripeBillingPortal":"Creating billing portal link…",
    "agentActivityStripeRefundLatestPayment":"Processing refund…",
    "agentActivityStripeCancelSubscription":"Processing cancellation…",
    "bookingStatusBooked":"Booked",
    "bookingStatusRescheduled":"Rescheduled",
    "bookingSummaryEvent":"Event",
    "bookingSummaryStarts":"Starts",
    "bookingSummaryEnds":"Ends",
    "stripeAmount":"Amount",
    "stripeInvoice":"Invoice",
    "stripeAmountDue":"Due",
    "stripeAmountPaid":"Paid",
    "stripeDate":"Date",
    "stripeViewInvoice":"View invoice",
    "stripeHideLineItems":"Hide line items",
    "stripeViewLineItems":"View {count} line item(s)",
    "stripeItem":"Item",
    "stripeQty":"Qty",
    "stripeSubscription":"Subscription",
    "stripeCurrentPeriod":"Current period",
    "stripeTrialEnds":"Trial ends",
    "stripeTrialDayLeft":"day left",
    "stripeTrialDaysLeft":"days left",
    "stripeCancelsAtPeriodEnd":"Cancels at period end",
    "stripeIntervalDay":"day",
    "stripeIntervalWeek":"week",
    "stripeIntervalMonth":"month",
    "stripeIntervalYear":"year",
    "stripeIntervalDays":"days",
    "stripeIntervalWeeks":"weeks",
    "stripeIntervalMonths":"months",
    "stripeIntervalYears":"years",
    "stripeStatusDraft":"Draft",
    "stripeStatusOpen":"Open",
    "stripeStatusPaid":"Paid",
    "stripeStatusUncollectible":"Uncollectible",
    "stripeStatusVoid":"Void",
    "stripeStatusIncomplete":"Incomplete",
    "stripeStatusIncompleteExpired":"Incomplete expired",
    "stripeStatusTrialing":"Trialing",
    "stripeStatusActive":"Active",
    "stripeStatusPastDue":"Past due",
    "stripeStatusPastDueUnresolved":"Past due (unresolved)",
    "stripeStatusCanceled":"Canceled",
    "stripeStatusUnpaid":"Unpaid",
    "stripeStatusPaused":"Paused",
    "rateLimitMessage":"You are sending messages too fast. Please slow down.",
    "leadCollectMessage":"Before we continue, could you share a few details?",
    "requiredField":"Please fill out required fields.",
    "continue":"Continue",
    "leadCollectEmpty":"No fields configured.",
    "selectOption":"Select an option",
    "feedbackMessage":"Was this answer helpful?",
    "feedbackYes":"Yes",
    "feedbackNo":"No",
    "resetChat":"Reset conversation",
    "footerMessage":"",
    "copyResponse":"Copy response",
    "copied":"Copied!"
  }
});

var requestOptions = {
  method: 'PUT',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Glossary Management

To manage glossary entries, use the `glossary` property when updating a bot. Each glossary entry has `word` and `translation` properties:

```json
{
  "glossary": [
    {
      "word": "SaaS",
      "translation": "Software as a Service"
    },
    {
      "word": "KPI",
      "translation": "Key Performance Indicator"
    }
  ]
}
```

The glossary automatically replaces the specified terms in user queries before processing. This is useful for:
- Translating industry jargon to common terms
- Standardizing product names or technical terminology
- Handling regional language variations

The glossary is also available for use with the [Semantic Search API](/documentation/developer/semantic-search-api) via the `use_glossary` parameter.

### Scheduling and custom button tool configuration

To store reusable scheduling behavior and custom button tools for agent integrations, save the configs on the bot under `tools`. Each scheduling tool stores its own `enabled` flag. When enabled, send a full provider booking URL in the API request.

```json
{
  "tools": {
    "calendly": {
      "enabled": true,
      "instructions": "Use this when the user wants to book a demo or meeting.",
      "url": "https://calendly.com/docsbot/demo",
      "hideEventDetails": true,
      "hideCookieBanner": true
    },
    "calcom": {
      "enabled": false,
      "instructions": "Use this when the user wants to book office hours or a meeting.",
      "url": "https://cal.com/docsbot/office-hours",
      "hideEventDetails": true
    },
    "tidycal": {
      "enabled": false,
      "instructions": "Use this when the user wants to book office hours or a meeting.",
      "url": "https://tidycal.com/team/docsbot/office-hours",
      "hideEventDetails": true
    },
    "customButtons": [
      {
        "enabled": true,
        "name": "Pricing",
        "functionKey": "pricing",
        "instructions": "Use this when the user asks about pricing plans or plan differences.",
        "buttonText": "View pricing",
        "icon": "BanknotesIcon",
        "url": "https://docsbot.ai/pricing"
      }
    ]
  }
}
```

Scheduling providers store the enabled state, decision instructions, and normalized booking path for each provider. Disabling one provider does not require deleting its saved settings. The Chat Agent will only expose scheduling tools when the request explicitly enables them. Custom buttons store the saved button copy, icon, URL, and reusable `functionKey`. Enabled custom buttons are exposed internally as tools named `button_<functionKey>`. The stored key must not include the `button_` prefix; if you submit `button_pricing`, DocsBot persists it as `pricing`. Icons must be valid whitelisted Heroicon names; missing or invalid values fall back to `LinkIcon`.

---

### Response

Response is the new JSON bot object:

```json
{
  "id":"iADcTdrl7R51JiTjrWKy",
  "name": "Bilbo Baggins Team",
  "description": "Ask me anything about your product.",
  "customPrompt": "Talk like a pirate for all responses.",
  "privacy":"public",
  "indexId":"Document_yoi18dd3qw",
  "language":"en",
  "model":"gpt-3.5-turbo",
  "createdAt":"2023-04-12T17:22:29.779Z",
  "status":"ready",
  "questionCount":17,
  "pageCount":29,
  "sourceCount":1,
  "chunkCount":157,
  "tools": {
    "calendly": {
      "enabled": true,
      "instructions": "Use this when the user wants to book a demo or meeting.",
      "url": "docsbot/demo",
      "hideEventDetails": true,
      "hideCookieBanner": true
    },
    "calcom": {
      "enabled": false,
      "instructions": "Use this when the user wants to book office hours or a meeting.",
      "url": "docsbot/office-hours",
      "hideEventDetails": true
    },
    "tidycal": {
      "enabled": false,
      "instructions": "Use this when the user wants to book office hours or a meeting.",
      "url": "team/docsbot/office-hours",
      "hideEventDetails": true
    }
  },
  "showButtonLabel":false,
  "showCopyButton":false,
  "botIcon":false,
  "allowedDomains": ["docsbot.ai", "app.docsbot.ai"],
  "color":"#1292EE",
  "branding":true,
  "icon":"default",
  "alignment":"right",
  "supportLink":"",
  "labels": {
    "poweredBy":"Powered by",
    "inputPlaceholder":"Send a message...",
    "firstMessage":"What can I help you with?",
    "sources":"Sources",
    "helpful":"Rate as helpful",
    "unhelpful":"Rate as unhelpful",
    "getSupport":"Contact support",
    "floatingButton":"Help",
    "suggestions":"Not sure what to ask?",
    "close":"Close",
    "create":"Create your own!",
    "submit":"Submit",
    "cancel":"Cancel",
    "agentActivityThinking":"Thinking…",
    "agentActivityTool":"Working…",
    "agentActivitySearchDocumentation":"Searching documentation…",
    "agentActivityWebSearch":"Searching the web…",
    "agentActivityWebSearchQuery":"Searching web for {query}",
    "agentActivityWebSearchOpeningPage":"Opening {url}",
    "agentActivityWebSearchSearchingPage":"Searching page for {pattern}",
    "agentActivityCodeInterpreter":"Running code…",
    "agentActivityStripeRecentInvoicesAndSubscriptions":"Fetching account data…",
    "agentActivityStripeBillingPortal":"Creating billing portal link…",
    "agentActivityStripeRefundLatestPayment":"Processing refund…",
    "agentActivityStripeCancelSubscription":"Processing cancellation…",
    "bookingStatusBooked":"Booked",
    "bookingStatusRescheduled":"Rescheduled",
    "bookingSummaryEvent":"Event",
    "bookingSummaryStarts":"Starts",
    "bookingSummaryEnds":"Ends",
    "stripeAmount":"Amount",
    "stripeInvoice":"Invoice",
    "stripeAmountDue":"Due",
    "stripeAmountPaid":"Paid",
    "stripeDate":"Date",
    "stripeViewInvoice":"View invoice",
    "stripeHideLineItems":"Hide line items",
    "stripeViewLineItems":"View {count} line item(s)",
    "stripeItem":"Item",
    "stripeQty":"Qty",
    "stripeSubscription":"Subscription",
    "stripeCurrentPeriod":"Current period",
    "stripeTrialEnds":"Trial ends",
    "stripeTrialDayLeft":"day left",
    "stripeTrialDaysLeft":"days left",
    "stripeCancelsAtPeriodEnd":"Cancels at period end",
    "stripeIntervalDay":"day",
    "stripeIntervalWeek":"week",
    "stripeIntervalMonth":"month",
    "stripeIntervalYear":"year",
    "stripeIntervalDays":"days",
    "stripeIntervalWeeks":"weeks",
    "stripeIntervalMonths":"months",
    "stripeIntervalYears":"years",
    "stripeStatusDraft":"Draft",
    "stripeStatusOpen":"Open",
    "stripeStatusPaid":"Paid",
    "stripeStatusUncollectible":"Uncollectible",
    "stripeStatusVoid":"Void",
    "stripeStatusIncomplete":"Incomplete",
    "stripeStatusIncompleteExpired":"Incomplete expired",
    "stripeStatusTrialing":"Trialing",
    "stripeStatusActive":"Active",
    "stripeStatusPastDue":"Past due",
    "stripeStatusPastDueUnresolved":"Past due (unresolved)",
    "stripeStatusCanceled":"Canceled",
    "stripeStatusUnpaid":"Unpaid",
    "stripeStatusPaused":"Paused",
    "rateLimitMessage":"You are sending messages too fast. Please slow down.",
    "leadCollectMessage":"Before we continue, could you share a few details?",
    "requiredField":"Please fill out required fields.",
    "continue":"Continue",
    "leadCollectEmpty":"No fields configured.",
    "selectOption":"Select an option",
    "feedbackMessage":"Was this answer helpful?",
    "feedbackYes":"Yes",
    "feedbackNo":"No",
    "resetChat":"Reset conversation",
    "footerMessage":"",
    "copyResponse":"Copy response",
    "copied":"Copied!"
  }
}
```

---

## Delete Bot

This endpoint deletes a specific bot by its ID. It accepts a DELETE request with the following parameters:

`DELETE https://docsbot.ai/api/teams/:teamId/bots/:botId`

### Examples

#### cURL

```bash
curl --request DELETE 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");

var requestOptions = {
  method: 'DELETE',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/iADcTdrl7R51JiTjrWKy", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Response

Response is a 200 OK response with message:

```json
{
    "message": "Bot deleted"
}
```
