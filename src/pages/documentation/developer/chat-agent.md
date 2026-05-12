---
title: Chat Agent API
description: The Chat Agent API is our latest and most powerful API for integrating conversational chatbots with your product.
---

The chat Agent API is our latest and most powerful API for integrating conversational chatbots with your product. It is much more conversational similar to ChatGPT, and conversations are stored and viewable in your dashboard. This API can employ multiple agent tools to address queries and perform actions, and even accept images for multimodal chats when using supported models. For output it supports both non-streaming and streaming responses using SSE (similar to the OpenAI API).

---

{% callout title="Stateful API" %}
Unlike our older chat APIs, this API is stateful, meaning it maintains the conversation context and history between requests. This allows for more sophisticated interactions and better responses, and frees you from having to store and send the conversation history with each request. It also allows us to show full conversation threads in the dashboard. This is done by you generating a UUID for each conversation and sending it with each request as the `conversationId` parameter. Any time you change the UUID it will create a new conversation thread in our database. To save on token usage costs and improve performance, we recommend making it simple for the user to start a new conversation thread when they change the subject, such as by clicking a button or resetting after a certain time period. For example our widget will reset the conversation after 12 hours of inactivity.
{% /callout %}

## Request

This endpoint accepts a POST request with the following parameters:
`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/chat-agent`

Replace `[teamId]` and `[botId]` with your actual team and bot identifiers.

### Authentication

Use `Authorization: Bearer <token>` when you need authenticated behavior (higher `question` limits, **private** bots, and other options noted below). Token types (user API key, recommended JWT for private bots, legacy HMAC) are documented in [Authentication](/documentation/developer/authentication#private-bots).

### Parameters

| Parameter              | Type            | Description                                                                                                                                                                                                                 |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **stream**             | boolean         | Whether to stream responses back to the client using SSE. Optional, defaults to `false`.                                                                                                                                    |
| **conversationId**     | string          | The conversation ID to maintain the chat. This should be a UUID that you generate on your side and change to start a new conversation.                                                                                      |
| **question**           | string          | The question to ask the bot. 2 to 500 characters. Max increased to 8K tokens (roughtly 32k chars) when authenticated.                                                                                                                          |
| **metadata**           | object          | A user identification object with arbitrary metadata about the user. Will be saved to the question and conversation. Keys `referrer`, `email`, and `name` are shown in question history logs. Optional, defaults to `null`. |
| **context_items**      | integer         | Number of sources to lookup for the bot to answer from. Optional, default is 5. Context boost uses 16 (more expensive token usage).                                                                                         |
| **human_escalation**   | boolean         | Whether to enable the human escalation classifier tool. Optional, defaults to `false`.                                                                                                                                      |
| **followup_rating**    | boolean         | Whether to include follow-up rating questions tool. Optional, defaults to `false`.                                                                                                                                          |
| **calendly**           | boolean         | Whether to enable the Calendly booking tool for this request. When enabled, the agent can emit the `book_calendly` tool if the bot has `tools.calendly` configured with `enabled: true`, `instructions`, and `url`. Optional, defaults to `false`.                    |
| **calcom**             | boolean         | Whether to enable the Cal.com booking tool for this request. When enabled, the agent can emit the `book_calcom` tool if the bot has `tools.calcom` configured with `enabled: true`, `instructions`, and `url`. Optional, defaults to `false`.                          |
| **tidycal**            | boolean         | Whether to enable the TidyCal booking tool for this request. When enabled, the agent can emit the `book_tidycal` tool if the bot has `tools.tidycal` configured with `enabled: true`, `instructions`, and `url`. Optional, defaults to `false`.                        |
| **custom_buttons**     | boolean         | Whether to enable saved custom button tools for this request. When enabled, every entry in `tools.customButtons` with `enabled: true`, `name`, `functionKey`, `instructions`, `buttonText`, `icon`, and `url` becomes an internal tool named `button_<functionKey>`. Optional, defaults to `false`. |
| **document_retriever** | boolean         | Whether to retrieve documents for the bot to answer from. Optional, defaults to `true`.                                                                                                                                     |
| **full_source**        | boolean         | Whether the full source content should be returned. Optional, defaults to `false`.                                                                                                                                          |
| **autocut**            | integer/boolean | Autocut results to num groups. Optional, defaults to `false`.                                                                                                                                                               |
| **testing**            | boolean         | Whether the request is for testing purposes. Optional, defaults to `false`.                                                                                                                                                 |
| **image_urls**         | array           | List of image URLs to include with the question as context. Optional, defaults to `null`.                                                                                                                                   |
| **model**               | string          | Override the model used for this request. Requires an OpenAI API key to be set on your team. Optional, defaults to the model configured for the bot. Examples: `gpt-4o`, `gpt-4.1`, `gpt-4.1-mini`.                  |
| **default_language**   | string          | The default language to use if the language of the conversation is unclear. Use locale codes like 'en' or 'en-US'. Optional, defaults to the bot's configured language.                  |
| **reasoning_effort**   | string          | Reasoning depth for the response. Requires authentication to override default. Options: 'none' (GPT-5.1 and GPT-5.4 default, fastest), 'minimal' (GPT-5 only, least reasoning), 'low' (light reasoning), 'medium' (balanced reasoning), 'high' (most reasoning), 'xhigh' (GPT-5.4 only, extra-high). Defaults: GPT-5.1 → 'none', GPT-5 → 'minimal', GPT-5.4 → 'none', other reasoning models → 'low', non-reasoning models → ignored. Optional, defaults to model-specific default. |
| **search_limit**      | integer         | Maximum number of times the `search_documentation` tool can be called. Requires authentication to override default. Minimum: 1, Maximum: 4. Optional, defaults to bot's `searchDocumentationLimit` or 2. Note: This is a default limit and does not guarantee that many searches will occur. The AI will only perform additional searches based on your custom instructions and if it determines it still hasn't found the required information and needs to try different search queries. |

### Trusted private metadata with JWT

Send a **signed JWT** as the Bearer token:

```http
Authorization: Bearer <jwt>
```

Trusted private values (e.g. `priv_*`) live in the JWT payload. See [Authentication](/documentation/developer/authentication#private-bots). For Stripe (`priv_stripe_customer_id` in JWT `metadata`), see [Stripe Actions](/documentation/developer/stripe-actions).

Unsigned private metadata values are treated as untrusted and ignored. For why signing matters, how `priv_` keys differ from regular metadata (not stored in logs or sent to the LLM), and the widget, see [Trusted private metadata with Bearer JWT](/documentation/developer/embeddable-chat-widget#trusted-private-metadata-with-bearer-jwt).

{% callout title="Vision" %}
Newer AI models like GPT-4o and GPT-4.1 Turbo support multimodal inputs, which means they can process both text and images. If the bot is using one of these models, you can include image URLs in your request via the `image_urls` parameter to provide additional context for the AI. The AI will use both the text and images to generate a response. If you're using a model that doesn't support images, the API will return an error if you include via the `image_urls` in your request. For details on using vision and its limitations, see the [OpenAI Docs](https://platform.openai.com/docs/guides/vision).
{% /callout %}

### Example Request

```json
{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is docsbot pricing.",
  "metadata": { "name": "your_name", "email": "your@gmail.com" },
  "context_items": 5,
  "human_escalation": false,
  "followup_rating": false,
  "calendly": true,
  "calcom": false,
  "tidycal": false,
  "custom_buttons": true,
  "document_retriever": true,
  "full_source": false,
  "stream": false,
  "auto_cut": false,
  "image_urls": ["http://example.com/image1.jpg", "data:image/jpeg;base64,XXXXXXXX"],
  "reasoning_effort": "medium",
  "search_limit": 3
}
```

## Response

When `stream` is `False` (default), the response is an array of JSON objects with the following properties:

| Property  | Type   | Description                                         |
| --------- | ------ | --------------------------------------------------- |
| **event** | string | Type of event indicating which type of tool is run. |
| **data**  | dict   | Information about answer                            |

When `stream` is `True`, the response is a [SSE stream of events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), each mapped to the SSE fields `event` and `data`. For every event type **except** `stream`, `data` is a **JSON string** (parse it with `JSON.parse`). **`stream`** events are different: each `data` line is a **plain-text token** to append (not JSON). It is recommended to use a package like [Better SSE](https://www.npmjs.com/package/better-sse) to handle SSE streams in the browser. See this [response example](/sse-response.txt) for more details.

The Chat Agent API can also emit `tool_call` and `reasoning` events. These can be used to show tool usage or reasoning summaries in your UI. Reasoning events only appear for reasoning-capable models (like GPT-5 family), and are most common when you increase `reasoning_effort`.

### SSE data shapes (streaming)

| SSE `event` | `data` shape | Meaning |
| ----------- | ------------ | ------- |
| **`reasoning`** | JSON string: `{"text":"..."}` | Model reasoning summary. Summaries may be **deduplicated**; you may see updates where `text` is empty—only non-empty `text` values are useful to show as distinct UI updates. |
| **`tool_call`** | JSON string: `{"name":"<tool_name>","params":"<json string>"}` | One event per tool invocation when the agent emits a tool call. There is **no** separate SSE type for “search documentation”: it appears as `name: "search_documentation"`. Other bound tools (Stripe, human escalation, etc.) use the same `tool_call` shape with their own `name`. |
| **`stream`** | Plain text (not JSON) | Answer token stream; append each `data` payload to the in-progress assistant message. |

### The data object

Data objects found in the `data` could have the following properties depending on the event type:

| Field           | Type    | Description                                                                                                                                                                                            |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **answer**      | string  | The answer to the query or question.                                                                                                                                                                   |
| **history**     | array   | An array containing the history of interactions related to the query, including user inputs and AI responses. Always included.                                                                         |
| **sources**     | array   | An array of sources used to generate the answer. Only for `lookup_answer`.                                                                                                                             |
| **id**          | string  | The question ID. Use this for rating, or for fetching/deleting the question from logs via the [Question History API](/documentation/developer/questions-api). Present only for `lookup_answer` events; not present for `is_resolved_question` or other event types. |
| **couldAnswer** | boolean | Indicates whether an answer could be generated for the query or not.                                                                                                         |
| **options**     | object  | Preset `yes` and `no` options for the user to respond to the answer. Only for `is_resolved_question` or `support_escalation` event types. While optional, these can be displayed as clickable preset messages in the chat UI. |
| **name**        | string  | Tool name for `tool_call` events.                                                                                                                                                                     |
| **params**      | string  | JSON string of tool parameters for `tool_call` events.                                                                                                                                                |
| **text**        | string  | Reasoning summary text for `reasoning` events. Can be an empty string.                                                                                                                                |

### The source object

Source objects found in the `sources` array (if present) have the following properties:

| Property    | Type    | Description                                                                                                 |
| ----------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| **type**    | string  | Can be `url`, `document`, `sitemap`, `wp`, `urls`, `csv`, etc.                                              |
| **title**   | string  | The source title.                                                                                           |
| **url**     | string  | The url for the source as set during indexing. May be null.                                                 |
| **page**    | string  | The page for the source as set during indexing. May be null.                                                |
| **content** | string  | The full source tex content for the source as set during indexing if `full_source` was `true`. May be null. |
| **used**    | boolean | Whether the source was used to answer the question if classify was enabled.                                 |

### Example Non-Streaming Response

```
[
    {
        "event": "lookup_answer",
        "data": {
            "answer": "DocsBot offers different pricing plans to fit various needs:\n\n1. **Hobby Plan** - $16/month ($192 annually)\n   - 1 DocsBot\n   - 1k Source Pages\n   - 1k messages/mo\n   - Private bot\n   - GPT-4o support\n   - 1 user\n\n2. **Personal Plan** - $41/month ($492 annually)\n   - 3 DocsBots\n   - 5k Source Pages\n   - 5k messages/mo\n   - Monthly source refresh\n   - Private bots\n   - GPT-4o support\n   - 1 user\n   - Basic Analytics\n   - Zapier integration\n   - Chat history\n\n3. **Pro Plan** - $83/month ($996 annually)\n   - 10 DocsBots\n   - 10k Source Pages\n   - 10k messages/mo\n   - Weekly source refresh\n   - Private bots\n   - GPT-4o support\n   - 5 team users\n   - Advanced Analytics\n   - Zapier integration\n   - Chat history\n   - Unbranded chat widgets\n   - Prompt customization\n\nFor more advanced plans like Business and Enterprise, you can [contact DocsBot](mailto:human@docsbot.ai) for customized pricing and features.",
            "history": [
                {
                    "Human": "what is docsbot pricing.",
                    "timestamp": "2024-05-28T16:22:01.451418"
                },
                {
                    "AI": "DocsBot offers different pricing plans to fit various needs:\n\n1. **Hobby Plan** - $16/month ($192 annually)\n   - 1 DocsBot\n   - 1k Source Pages\n   - 1k messages/mo\n   - Private bot\n   - GPT-4o support\n   - 1 user\n\n2. **Personal Plan** - $41/month ($492 annually)\n   - 3 DocsBots\n   - 5k Source Pages\n   - 5k messages/mo\n   - Monthly source refresh\n   - Private bots\n   - GPT-4o support\n   - 1 user\n   - Basic Analytics\n   - Zapier integration\n   - Chat history\n\n3. **Pro Plan** - $83/month ($996 annually)\n   - 10 DocsBots\n   - 10k Source Pages\n   - 10k messages/mo\n   - Weekly source refresh\n   - Private bots\n   - GPT-4o support\n   - 5 team users\n   - Advanced Analytics\n   - Zapier integration\n   - Chat history\n   - Unbranded chat widgets\n   - Prompt customization\n\nFor more advanced plans like Business and Enterprise, you can [contact DocsBot](mailto:human@docsbot.ai) for customized pricing and features.",
                    "timestamp": "2024-05-28T16:22:22.343897",
                    "type": "lookup_answer"
                }
            ],
            "sources": [
                {
                    "page": null,
                    "title": "DocsBot - Custom chatbots from your documentation",
                    "type": "url",
                    "url": "https://docsbot.ai/",
                    "used": false,
                    "content": "## ChatGPT-powered customer support\n\nTrain and deploy custom chatbots in minutes!\n\nAre you tired of answering the same messages over and over again? Do you wish you had a way to automate your customer support and give your team more time to focus on other tasks? With DocsBot, you can do just that. We make it simple to build ChatGPT-powered bots that are trained with your content and documentation, so they can provide instant answers to your customers' most detailed questions.
                },
                {
                    "page": null,
                    "title": "DocsBot - Custom chatbots from your documentation",
                    "type": "url",
                    "url": "https://docsbot.ai/",
                    "used": false,
                    "content": "### Business\n\nFor serious traffic, priority support, and AI reports to improve your docs.\n\n$416/month\n\n($4992/annually)\n\n[Get started](https://docsbot.ai/register)* 100 DocsBots\n* 100k Source Pages\n* Unlock all source types\n* Weekly source refresh\n* 100k messages/mo\n* Private bots\n* GPT-4o support\n* 15 team users\n* Advanced Analytics\n* Zapier integration\n* Chat history\n* Unbranded chat widgets\n* AI question reports\n* Prompt customization\n* Priority support\n* Rate limiting\nDoes not include OpenAI API costs (<$0.0008/message)\n\n\n### Personal\n\nTry DocsBot free for personal use. No credit card required. Import document files or urls with up to 50 pages of content and start chatting with your bot.
                },
            ],
            "id": "yhqSGaKpM6ebkxp6KtDc",
            "couldAnswer": true
        }
    },
    {
        "event": "is_resolved_question",
        "data": {
            "answer": "Was that helpful?",
            "history": [
                {
                    "Human": "what is docsbot pricing.",
                    "timestamp": "2024-05-28T16:22:01.451418"
                },
                {
                    "AI": "DocsBot offers different pricing plans to fit various needs:\n\n1. **Hobby Plan** - $16/month ($192 annually)\n   - 1 DocsBot\n   - 1k Source Pages\n   - 1k messages/mo\n   - Private bot\n   - GPT-4o support\n   - 1 user\n\n2. **Personal Plan** - $41/month ($492 annually)\n   - 3 DocsBots\n   - 5k Source Pages\n   - 5k messages/mo\n   - Monthly source refresh\n   - Private bots\n   - GPT-4o support\n   - 1 user\n   - Basic Analytics\n   - Zapier integration\n   - Chat history\n\n3. **Pro Plan** - $83/month ($996 annually)\n   - 10 DocsBots\n   - 10k Source Pages\n   - 10k messages/mo\n   - Weekly source refresh\n   - Private bots\n   - GPT-4o support\n   - 5 team users\n   - Advanced Analytics\n   - Zapier integration\n   - Chat history\n   - Unbranded chat widgets\n   - Prompt customization\n\nFor more advanced plans like Business and Enterprise, you can [contact DocsBot](mailto:human@docsbot.ai) for customized pricing and features.",
                    "timestamp": "2024-05-28T16:22:22.343897",
                    "type": "lookup_answer"
                },
                {
                    "AI": "Was that helpful?",
                    "timestamp": "2024-05-28T16:22:30.568233",
                    "type": "is_resolved_question",
                    "options": {
                        "yes": "👍 That helped",
                        "no": "No"
                    }
                }
            ],
            "options": {
                "yes": "👍 That helped",
                "no": "No"
            }
        }
    }
]

```

## Event types

### answer

When the event type is `answer`, the agent provides a simple response from the chat history using no tools, such as when a user responds with "Thank you". This will have no sources.

### lookup_answer

When the event type is `lookup_answer`, the retriever tool provides the answer along with sources from your bot's training data. This is the most common event type and is used for general questions and queries, and the response is nearly identical to our older chat APIs. Only used when `document_retriever` argument is set to `true` (default).

{% callout title="Deleting questions programmatically" %}
To delete a question after a Chat Agent response, use the `id` from the `lookup_answer` event—it is the question ID required by the [Question History API](/documentation/developer/questions-api) delete endpoint. **Non-streaming:** find the event with `event === "lookup_answer"` and read `data.id`. **Streaming:** when you receive an SSE event with `event: "lookup_answer"`, parse the data and use `data.id`. If you only have a `conversationId`, fetch the conversation via the [Conversations API](/documentation/developer/conversations-api) and extract the `id` from each message in `history` where `type === "lookup_answer"` (other types like `is_resolved_question` do not have an `id`).
{% /callout %}

### is_resolved_question

The `is_resolved_question` event is used after a `lookup_answer` to collect user feedback using natural language. It asks the user if the answer was helpful and provides options for the user to respond. This is used to improve the AI's performance and provide better answers in the future. Only used when `followup_rating` argument is set to `true`.

### support_escalation

The `support_escalation` event is triggered when LLM determines that the user requests human support. It provides options for the user to confirm if they want to escalate to human support. This is used to provide a seamless transition from AI to human support. Only used when `human_escalation` argument is set to `true`.

### stream

When streaming response is enabled via the `stream` parameter, the answer is initially sent as a stream of `stream` events so that you can display the progress to the user as it's generated. Each `stream` event is a token to be appended to the latest message, which is commonly parsed as markdown for proper formatting. When the answer streaming is complete it will be followed by a different event type such as `lookup_answer` that contains the final full answer to display. See this [response example](/sse-response.txt) for more details.

### tool_call

The `tool_call` event reports a tool invocation from the agent. Use it to show what the agent is doing (e.g. “Searching documentation…”, “Opening billing portal…”).

#### Shape (always the same)

Each SSE message has `event: tool_call`. The **`data`** field is a **JSON-encoded object** with:

- **`name`** — tool name (string).
- **`params`** — tool arguments **serialized again as JSON, but delivered as a string** (the object you parse from `data` has `params` as a string containing JSON).

On the client, parse twice when you need structured args: `JSON.parse(event.data)` then `JSON.parse(parsed.params)` (unless your SSE library already parses `data` for you).

There is **no** dedicated SSE event for documentation search: the agent uses the tool name `search_documentation`. The server may **omit** a `tool_call` for `search_documentation` when deduplication decides the call would not retrieve anything new (streaming may filter or drop redundant search args).

Some tools are configured on the bot itself. For example, if `bot.tools.calendly`, `bot.tools.calcom`, or `bot.tools.tidycal` contains `enabled: true`, scheduling `instructions`, and the provider booking path generated from its validated URL, and your request explicitly enables that provider via `calendly: true`, `calcom: true`, or `tidycal: true`, the agent can emit a `tool_call` with `name: "book_calendly"`, `name: "book_calcom"`, or `name: "book_tidycal"` and then stop after returning the tool-provided booking message.

Custom buttons are also bot-configured tools. If `bot.tools.customButtons` contains an enabled entry like `{ "functionKey": "pricing", "icon": "BanknotesIcon", ... }` and your request includes `custom_buttons: true`, the agent can emit a `tool_call` with `name: "button_pricing"`. Stored keys never include the `button_` prefix; DocsBot adds that internally when exposing the tool. The saved `icon` does not change the tool name; it is widget metadata and falls back to `LinkIcon` when invalid or missing.

#### Example: `search_documentation`

After one `JSON.parse` of `data`:

```json
{
  "name": "search_documentation",
  "params": "{\"query\":[\"password reset steps\",\"forgot password\"],\"question\":\"How do I reset my password if I forgot my email?\"}"
}
```

After `JSON.parse` on `params`:

```json
{
  "query": ["password reset steps", "forgot password"],
  "question": "How do I reset my password if I forgot my email?"
}
```

#### Example: `human_escalation`

After `JSON.parse` of `data`:

```json
{
  "name": "human_escalation",
  "params": "{\"confirmation_question\":\"Would you like me to connect you with our support team?\",\"yes\":\"Yes, please\",\"no\":\"No thanks\"}"
}
```

Parsed `params`:

```json
{
  "confirmation_question": "Would you like me to connect you with our support team?",
  "yes": "Yes, please",
  "no": "No thanks"
}
```

#### Example: `book_calendly`

After `JSON.parse` of `data`:

```json
{
  "name": "book_calendly",
  "params": "{\"instructions\":\"Use this when the user wants to book a demo or meeting.\"}"
}
```

Parsed `params`:

```json
{
  "instructions": "Use this when the user wants to book a demo or meeting."
}
```

#### Example: `book_calcom`

After `JSON.parse` of `data`:

```json
{
  "name": "book_calcom",
  "params": "{\"instructions\":\"Use this when the user wants to book office hours or a meeting.\"}"
}
```

Parsed `params`:

```json
{
  "instructions": "Use this when the user wants to book office hours or a meeting."
}
```

#### Example: `book_tidycal`

After `JSON.parse` of `data`:

```json
{
  "name": "book_tidycal",
  "params": "{\"instructions\":\"Use this when the user wants to book office hours or a meeting.\"}"
}
```

Parsed `params`:

```json
{
  "instructions": "Use this when the user wants to book office hours or a meeting."
}
```

#### Example: `button_pricing`

After `JSON.parse` of `data`:

```json
{
  "name": "button_pricing",
  "params": "{\"instructions\":\"Use this when the user asks about pricing plans or plan differences.\"}"
}
```

Parsed `params`:

```json
{
  "instructions": "Use this when the user asks about pricing plans or plan differences."
}
```

When any scheduling tool is triggered, the assistant should end generation immediately after the tool call and return the final text from the tool.

#### Example: Stripe tools

Stripe-related tools use the same `tool_call` envelope. Typical examples (parse `params` as above). Full behavior and JWT requirements are in [Stripe Actions](/documentation/developer/stripe-actions).

`stripe_recent_invoices_and_subscriptions`:

```json
{
  "name": "stripe_recent_invoices_and_subscriptions",
  "params": "{\"limit\":10}"
}
```

`stripe_billing_portal`:

```json
{
  "name": "stripe_billing_portal",
  "params": "{\"return_url\":\"https://app.example.com/account\"}"
}
```

Or with defaults:

```json
{
  "name": "stripe_billing_portal",
  "params": "{}"
}
```

`stripe_refund_latest_payment`:

```json
{
  "name": "stripe_refund_latest_payment",
  "params": "{\"confirm_refund_request\":true}"
}
```

`stripe_cancel_subscription` (fields depend on your bot’s cancellation / feedback configuration):

```json
{
  "name": "stripe_cancel_subscription",
  "params": "{\"confirmed\":true,\"subscription_id\":\"sub_123\",\"feedback\":\"too_expensive\",\"cancellation_details_comment\":\"User said price was too high\"}"
}
```

#### Wire-level SSE (illustrative)

```text
event: tool_call
data: {"name":"search_documentation","params":"{\"query\":[\"pricing\"],\"question\":\"What is your pricing?\"}"}
```

Your client library may already parse the `data` line into an object; the important part is that **`params` is nested JSON as a string**.

### reasoning

The `reasoning` event includes a reasoning summary in `text`. The summary can be empty; when streaming, treat empty `text` as a no-op for UI. These events only appear for reasoning-capable models (like GPT-5 family), primarily when `reasoning_effort` is set above the default. See the [SSE data shapes (streaming)](#sse-data-shapes-streaming) table for deduplication notes.

### Example Response with Tool Call + Reasoning

```json
[
  {
    "event": "reasoning",
    "data": {
      "text": "**Searching for product info**\n\nI need to get information about the DocsBot product. My plan is to call the search_documentation tool, which should help me look it up directly. It’s nice that there's a tool available for this! I'll make sure to use it to find the details I need efficiently. This way, I can provide the accurate information without any fuss. Alright, let’s go ahead and call that tool!"
    }
  },
  {
    "event": "tool_call",
    "data": {
      "name": "search_documentation",
      "params": "{\"query\": [\"DocsBot improve customer support use case\", \"DocsBot customer support chatbot knowledge base answer tickets\"], \"question\": \"What is a way I can use DocsBot to improve my customer support?\"}"
    }
  },
  {
    "event": "reasoning",
    "data": {
      "text": ""
    }
  },
  {
    "event": "lookup_answer",
    "data": {
      "answer": "You can use **DocsBot to turn your existing support documentation (or FAQs) into an AI-powered customer support chatbot** that answers customers instantly **24/7**—reducing response times and repetitive tickets while keeping answers consistent.\n\n### One practical way to do this\n1. **Use your current help docs/FAQs (or resolved Zendesk tickets)** as the knowledge source so the bot’s answers match what your team already supports.\n2. **Deploy the bot on your website or in your app** so customers can self-serve common questions immediately.\n3. **Let the bot handle routine inquiries** (setup, troubleshooting, product usage, account management), and **escalate complex cases to humans**—so agents spend time where it matters most.\n\nThis approach is specifically positioned to help with **high support volume, long wait times, and inconsistent support quality**, while scaling without adding headcount.\n\nRelevant pages:\n- Customer support tools overview: https://docsbot.ai/tools/support\n- DocsBot customer support bots: https://docsbot.ai\n- Zendesk ticket-based training guide: https://docsbot.ai/documentation/doc/training-a-chatbot-from-zendesk-tickets",
      "history": [
        {
          "Human": "Think carefully and thoroughly analyze, with only one search call: What is a way I can use DocsBot to improve my customer support?",
          "timestamp": "2026-01-23T14:45:13.682375"
        },
        {
          "AI": "You can use **DocsBot to turn your existing support documentation (or FAQs) into an AI-powered customer support chatbot** that answers customers instantly **24/7**—reducing response times and repetitive tickets while keeping answers consistent.\n\n### One practical way to do this\n1. **Use your current help docs/FAQs (or resolved Zendesk tickets)** as the knowledge source so the bot’s answers match what your team already supports.\n2. **Deploy the bot on your website or in your app** so customers can self-serve common questions immediately.\n3. **Let the bot handle routine inquiries** (setup, troubleshooting, product usage, account management), and **escalate complex cases to humans**—so agents spend time where it matters most.\n\nThis approach is specifically positioned to help with **high support volume, long wait times, and inconsistent support quality**, while scaling without adding headcount.\n\nRelevant pages:\n- Customer support tools overview: https://docsbot.ai/tools/support\n- DocsBot customer support bots: https://docsbot.ai\n- Zendesk ticket-based training guide: https://docsbot.ai/documentation/doc/training-a-chatbot-from-zendesk-tickets",
          "timestamp": "2026-01-23T14:45:37.154080",
          "type": "lookup_answer",
          "id": "eFF694XdkYYWfx7pRRCe"
        }
      ],
      "sources": [
        {
          "type": "sitemap",
          "url": "https://docsbot.ai/tools/support",
          "title": "Free AI Customer Support Tools - DocsBot",
          "page": null,
          "used": true
        },
        {
          "type": "url",
          "url": "https://docsbot.ai",
          "title": "DocsBot - Custom chatbots from your documentation",
          "page": null,
          "used": true
        },
        {
          "type": "sitemap",
          "url": "https://docsbot.ai/tools/support",
          "title": "Free AI Customer Support Tools - DocsBot",
          "page": null,
          "used": true
        },
        {
          "type": "sitemap",
          "url": "https://docsbot.ai/documentation/doc/training-a-chatbot-from-zendesk-tickets",
          "title": "Training a Chatbot from Zendesk Tickets - DocsBot",
          "page": null,
          "used": true
        }
      ],
      "id": "eFF694XdkYYWfx7pRRCe",
      "couldAnswer": true
    }
  }
]
```

## Error Handling

The API returns standard HTTP status codes to indicate the success or failure of the request. The following error codes are used:

```
404 Not Found: Invalid bot ID.
409 Conflict: Bot is not ready for questions.
403 Forbidden: Authentication error or missing API key.
400 Bad Request: Invalid parameters or unsupported features such as images.
413 Request Entity Too Large: Question is too long.
429 Too Many Requests: Rate limiting exceeded or Team question limit exceeded.
500 Internal Server Error: Unexpected errors.
```

## Related Endpoints

The Chat Agent API also provides additional endpoints for working with conversation data:

- **[Conversation Summarize](/documentation/developer/conversation-summarize)**: Generate summaries of conversations including title, summary text, and sentiment analysis
- **[Conversation Ticket](/documentation/developer/conversation-ticket)**: Generate structured support tickets from conversations for help desk integration

- **[Conversation Lead Capture](/documentation/developer/conversation-lead)**: Capture lead information by updating conversation metadata and saving it to a dedicated leads collection
