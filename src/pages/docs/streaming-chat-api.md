---
title: Streaming Chat API
description: The chat API is used to create a full chat interface in your product.
---

The chat API is used to create a full chat interface in your product. You pass it a question plus chat history, and it returns the next answer along with its sources. It also returns the new chat history array to pass back with the next response. This is the endpoint you should use if you want to create a full chat interface in your product.

---

{% callout type="warning" title="Coming Soon" %}
Documentation for the streaming chat API is coming soon.
{% /callout %}

## Request

This endpoint accepts a websocket request with the following parameters in the initial message on the open socket:

`wss://api.docsbot.ai/teams/[teamId]/bots/[botId]/chat`

### Parameters

| Parameter   | Type    | Description                                                                       |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| **question**    | string  | The question to ask the bot. 10 to 200 characters.                                |
| **full_source** | boolean | Whether the full source content should be returned. Optional, defaults to `false` |
| **chat_history** | array | The chat history array. Optional, defaults to `[]` |

{% callout title="full_source behavior" %}
If `full_source` is set to `true`, the `content` property of each source will be populated with the full source content. This can be useful if you want to display the full source content in your interface. As source pages are divided into chunks, we normally only return unique source title/urls. But if this parameter is set to true multiple sources may be returned with the same title/url but different content.
{% /callout %}

## Examples

