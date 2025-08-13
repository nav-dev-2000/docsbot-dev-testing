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

### Parameters

| Parameter              | Type            | Description                                                                                                                                                                                                                 |
| ---------------------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **stream**             | boolean         | Whether to stream responses back to the client using SSE. Optional, defaults to `false`.                                                                                                                                    |
| **conversationId**     | string          | The conversation ID to maintain the chat. This should be a UUID that you generate on your side and change to start a new conversation.                                                                                      |
| **question**           | string          | The question to ask the bot. 2 to 500 characters. Max increased to 8K tokens (roughtly 32k chars) when authenticated.                                                                                                                          |
| **metadata**           | object          | A user identification object with arbitrary metadata about the user. Will be saved to the question and conversation. Keys `referrer`, `email`, and `name` are shown in question history logs. Optional, defaults to `null`. |
| **context_items**      | integer         | Number of sources to lookup for the bot to answer from. Optional, default is 5. Research mode uses 16 (more expensive token usage).                                                                                         |
| **human_escalation**   | boolean         | Whether to enable the human escalation classifier tool. Optional, defaults to `false`.                                                                                                                                      |
| **followup_rating**    | boolean         | Whether to include follow-up rating questions tool. Optional, defaults to `false`.                                                                                                                                          |
| **document_retriever** | boolean         | Whether to retrieve documents for the bot to answer from. Optional, defaults to `true`.                                                                                                                                     |
| **full_source**        | boolean         | Whether the full source content should be returned. Optional, defaults to `false`.                                                                                                                                          |
| **autocut**            | integer/boolean | Autocut results to num groups. Optional, defaults to `false`.                                                                                                                                                               |
| **testing**            | boolean         | Whether the request is for testing purposes. Optional, defaults to `false`.                                                                                                                                                 |
| **image_urls**         | array           | List of image URLs to include with the question as context. Optional, defaults to `null`.                                                                                                                                   |
| **model**               | string          | Override the model used for this request. Requires an OpenAI API key to be set on your team. Optional, defaults to the model configured for the bot. Examples: `gpt-4o`, `gpt-4.1`, `gpt-4.1-mini`.                  |
| **default_language**   | string          | The default language to use if the language of the conversation is unclear. Use locale codes like 'en' or 'en-US'. Optional, defaults to the bot's configured language.                  |
| **reasoning_effort**   | string          | Reasoning depth for the response. Requires authentication to override default. Options: 'minimal' (GPT-5 only, uses least reasoning), 'low' (light reasoning), 'medium' (balanced reasoning), 'high' (most reasoning). Defaults: GPT-5 → 'minimal', other reasoning models → 'low', non-reasoning models → ignored. Optional, defaults to model-specific default. |


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
  "document_retriever": true,
  "full_source": false,
  "stream": false,
  "auto_cut": false,
  "image_urls": ["http://example.com/image1.jpg", "data:image/jpeg;base64,XXXXXXXX"],
  "reasoning_effort": "medium"
}
```

## Response

When `stream` is `False` (default), the response is an array of JSON objects with the following properties:

| Property  | Type   | Description                                         |
| --------- | ------ | --------------------------------------------------- |
| **event** | string | Type of event indicating which type of tool is run. |
| **data**  | dict   | Information about answer                            |

When `stream` is `True`, the response is a [SSE stream of events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events), each containing the same properties as above mapped to the proper SSE fields `event` and `data`. In this case data is a JSON string that must be parsed. It is recommended to use a package like [Better SSE](https://www.npmjs.com/package/better-sse) to handle SSE streams in the browser. See this [response example](/sse-response.txt) for more details.

### The data object

Data objects found in the `data` could have the following properties depending on the event type:

| Field           | Type    | Description                                                                                                                                                                                            |
| --------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **answer**      | string  | The answer to the query or question.                                                                                                                                                                   |
| **history**     | array   | An array containing the history of interactions related to the query, including user inputs and AI responses. Always included.                                                                         |
| **sources**     | array   | An array of sources used to generate the answer. Only for `lookup_answer`.                                                                                                                             |
| **id**          | string  | Unique identifier for the query or response used for rating. Not present for `is_resolved_question`.                                                                                                   |
| **couldAnswer** | boolean | Indicates whether an answer could be generated for the query or not.                                                                                                         |
| **options**     | object  | Preset `yes` and `no` options for the user to respond to the answer. Only for `is_resolved_question` or `support_escalation` event types. While optional, these can be displayed as clickable preset messages in the chat UI. |

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
                    "title": "DocsBot AI - Custom chatbots from your documentation",
                    "type": "url",
                    "url": "https://docsbot.ai/",
                    "used": false,
                    "content": "## ChatGPT-powered customer support\n\nTrain and deploy custom chatbots in minutes!\n\nAre you tired of answering the same messages over and over again? Do you wish you had a way to automate your customer support and give your team more time to focus on other tasks? With DocsBot, you can do just that. We make it simple to build ChatGPT-powered bots that are trained with your content and documentation, so they can provide instant answers to your customers' most detailed questions.
                },
                {
                    "page": null,
                    "title": "DocsBot AI - Custom chatbots from your documentation",
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

### is_resolved_question

The `is_resolved_question` event is used after a `lookup_answer` to collect user feedback using natural language. It asks the user if the answer was helpful and provides options for the user to respond. This is used to improve the AI's performance and provide better answers in the future. Only used when `followup_rating` argument is set to `true`.

### support_escalation

The `support_escalation` event is triggered when LLM determines that the user requests human support. It provides options for the user to confirm if they want to escalate to human support. This is used to provide a seamless transition from AI to human support. Only used when `human_escalation` argument is set to `true`.

### stream

When streaming response is enabled via the `stream` parameter, the answer is initially sent as a stream of `stream` events so that you can display the progress to the user as it's generated. Each `stream` event is a token to be appended to the latest message, which is commonly parsed as markdown for proper formatting. When the answer streaming is complete it will be followed by a different event type such as `lookup_answer` that contains the final full answer to display. See this [response example](/sse-response.txt) for more details.

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
