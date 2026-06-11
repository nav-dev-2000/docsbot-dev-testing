---
title: Answer Rating & Escalation APIs
description: The answer rating and support escalation APIs are used to mark answers from the chat APIs.
---

The answer rating and support escalation APIs are used to record statistics for the answers from the chat APIs. These are the endpoints you should use if you want to allow your users to rate answers, or to record statistics on support escalations.

---

## Answer Rating

Allows users to rate answers from the chat APIs either positive, negative, or neutral (resetting the rating). This is useful for recording statistics on the answers from the chat APIs that are shown in your chat logs.

### Request

This endpoint accepts a PUT request with the following parameters:

`PUT https://api.docsbot.ai/teams/[teamId]/bots/[botId]/rate/[answerId]`

#### Parameters

| Parameter   | Type    | Description                                                                       |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| **rating**    | integer  | -1, 0, or 1 for rating up, neutral, or down.                               |

### Examples

#### cURL

```bash
curl --request PUT 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/rate/O0avZ8ffTiAMRyjNrZpU' \
--header 'Content-Type: application/json' \
--data-raw '{
    "rating": -1
}'
```

### Response

Response is a JSON object with the following properties:

```json
true
```

## Conversation Support Escalations

When a user confirms that they want to escalate a chat to human support, log the escalation on the conversation. This is the recommended escalation endpoint for the Chat Agent API and embeddable chat widget.

The Chat Agent API may first return a `support_escalation` event with yes/no options. That event means the bot detected escalation intent and asked the user to confirm, so the conversation has `escalated: "triggered"`. After the user confirms, call this endpoint to mark the conversation as actually escalated with `escalated: "handled"` and `resolved: "unresolved"`.

Calling this Conversation Escalation API is what triggers `conversation.escalated` webhook delivery for the bot. See the [Webhooks API](/documentation/developer/webhooks-api) for the webhook payload.

### Request

This endpoint accepts a PUT request with the following parameters and no body:

`PUT https://api.docsbot.ai/teams/[teamId]/bots/[botId]/conversations/[conversationId]/escalate`

#### Parameters

| Parameter          | Type   | Description                                                                 |
| ------------------ | ------ | --------------------------------------------------------------------------- |
| **teamId**         | string | The team ID.                                                                |
| **botId**          | string | The bot ID.                                                                 |
| **conversationId** | string | The conversation ID returned by the Chat Agent API or widget conversation.  |

#### Authentication

For private bots, include an API key or valid bot token in the `Authorization` header:

`Authorization: Bearer YOUR_API_KEY`

Public bots can log conversation escalations without authentication.

### Examples

#### cURL

```bash
curl --request PUT 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/conversations/3d72a958-6347-4cc2-9fb2-b87f9c8f202e/escalate' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

### Response

Response is a JSON boolean:

```json
true
```

### What Gets Updated

The conversation is updated to:

```json
{
  "resolved": "unresolved",
  "escalated": "handled"
}
```

If the conversation contains a previous `lookup_answer` message with an `id`, DocsBot also flags the latest related question log entry with:

```json
{
  "escalation": true
}
```

### Error Responses

| Status | Response | Description |
| ------ | -------- | ----------- |
| 404 | `{ "error": "Invalid bot_id." }` | The bot was not found. |
| 403 | `{ "error": "<auth error message>" }` | Authentication failed for a private bot. |
| 404 | `{ "error": "Invalid conversationID." }` | The conversation was not found. |
| 500 | `{ "error": "Internal server error." }` | An unexpected error occurred. |

## Legacy Question Support Escalations

The question-specific support escalation endpoint is still supported for legacy chat APIs, but new Chat Agent and widget integrations should use the Conversation Support Escalation endpoint above. The legacy endpoint marks an individual answer/question as escalated and is not the primary conversation escalation flow.

### Request

This endpoint accepts a PUT request with no body:

`PUT https://api.docsbot.ai/teams/[teamId]/bots/[botId]/support/[answerId]`

### Examples

#### cURL

```bash
curl --request PUT 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/support/O0avZ8ffTiAMRyjNrZpU' \
--header 'Content-Type: application/json'
```

### Response

Response is a JSON boolean:

```json
true
```
