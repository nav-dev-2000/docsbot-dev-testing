---
title: MCP Server
description: Connect custom MCP clients to DocsBot with the server endpoint, supported tools, and authentication requirements.
---

DocsBot exposes every bot as a [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server so custom tools and AI assistants can query bot data safely. {% .lead %}

{% callout title="ChatGPT and OpenAI Compatibility" %}
Our MCP server implementation is compatible with ChatGPT and OpenAI API integrations. For more information about building MCP servers for ChatGPT and API integrations, see the [OpenAI MCP documentation](https://platform.openai.com/docs/mcp).
{% /callout %}

{% callout title="Plan Availability" %}
MCP endpoints are available on the Standard plan and above.
The Question History MCP endpoint additionally requires at least 5,000 logged bot questions.
{% /callout %}

## Endpoints

Each bot has two MCP endpoints:

### Documentation MCP endpoint

Use this endpoint to search and fetch indexed documentation sources:

```
https://api.docsbot.ai/teams/{teamId}/bots/{botId}/mcp/
```

### Question History MCP endpoint

Use this endpoint to search and fetch support question/conversation history:

```
https://api.docsbot.ai/teams/{teamId}/bots/{botId}/questions/mcp/
```

Replace `{teamId}` and `{botId}` with IDs from your dashboard. The Integrations tab provides pre-filled URLs that you can copy into MCP clients.

## Available tools

Both MCP endpoints expose two read-only tools:

- `search`
- `fetch`

### Documentation MCP tools

- `search` - Hybrid semantic/keyword search across the bot's indexed training sources.
- `fetch` - Retrieves full source content for an ID returned by `search`.

{% callout title="Full Document Retrieval (Fetch)" %}
We started indexing your training data differently starting in October 2025 to prepare the `fetch` tool to be able to return entire documents (full web page, pdf, etc). However, if training data was ingested before that change, it may take a refresh to get better results for the `fetch` call, which will default to just a full text chunk if it doesn't yet have access to the full document.
{% /callout %}

### Question History MCP tools

- `search` - Semantic search across question/answer history (up to 16 results).
- `fetch` - Retrieves full question/conversation content by ID.

#### Example `search` result shape (Question History)

```json
{
  "results": [
    {
      "id": "8wuz1pqi8laooV1jLJHG",
      "question": "How do I reset my API key?",
      "answer": "You can rotate your API key from API & Integrations...",
      "metadata": {
        "couldAnswer": true,
        "escalation": false,
        "resolved": true,
        "escalated": false,
        "sentiment": "neutral",
        "topic": "api-keys"
      }
    }
  ]
}
```

When registering either endpoint, you can optionally restrict allowed tools to only `search` and `fetch`.

## Question History metadata fields

Question History MCP responses can include:

| Field | Type | Description |
| --- | --- | --- |
| `couldAnswer` | boolean/null | Whether the bot classified itself as able to answer. |
| `escalation` | boolean | Whether escalation was requested. |
| `resolved` | boolean/null | Whether the conversation was marked resolved. |
| `escalated` | boolean | Whether the conversation was escalated. |
| `sentiment` | string/null | Sentiment label for the exchange when available. |
| `topic` | string/null | Topic/category label for the conversation. |

## Authentication

Send a Bearer token in the `Authorization` header:

```
Authorization: Bearer <TOKEN>
```

Supported token types:

- DocsBot API key
- OAuth token prefixed with `mcp-` (issued via DocsBot MCP OAuth flow)

Private bots always require authentication. You can rotate/revoke API keys or revoke OAuth clients in API & Integrations settings.

## Usage example

Example MCP client config with Question History endpoint:

```json
{
  "mcpServers": {
    "docsbot-question-history": {
      "url": "https://api.docsbot.ai/teams/{teamId}/bots/{botId}/questions/mcp/",
      "headers": {
        "Authorization": "Bearer <TOKEN>"
      }
    }
  }
}
```

## Error responses

| Status | Meaning |
| --- | --- |
| `401` | Missing or invalid Bearer token. |
| `403` | Plan restriction, insufficient permissions, or bot access denied. |
| `404` | Team, bot, or requested record ID not found. |
| `429` | Rate limited; retry with backoff. |
| `5xx` | Temporary server error. Retry request. |
