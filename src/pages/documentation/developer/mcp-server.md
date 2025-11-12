---
title: MCP Server
description: Connect custom MCP clients to DocsBot with the server endpoint, supported tools, and authentication requirements.
---

DocsBot exposes every bot as a [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server so that custom tools and automation workflows can issue scoped document searches without opening access to your entire knowledge base.

{% callout title="ChatGPT and OpenAI Compatibility" %}
Our MCP server implementation is compatible with ChatGPT and OpenAI API integrations. For more information about building MCP servers for ChatGPT and API integrations, see the [OpenAI MCP documentation](https://platform.openai.com/docs/mcp).
{% /callout %}

{% callout title="Plan Availability" %}
MCP server access is available only on the Standard plan and above.
{% /callout %}

## Endpoint

Each bot is available as an MCP server at the following URL:

```
https://api.docsbot.ai/teams/{teamId}/bots/{botId}/mcp/
```

Replace `{teamId}` and `{botId}` with the identifiers visible in the dashboard. The Integrations tab provides a pre-filled endpoint that you can copy into your MCP client configuration.

## Available tools

DocsBot MCP servers expose two tools that operate on the bot's indexed sources:

- `search` – Performs hybrid semantic/keyword search across the training library and returns the most relevant excerpts & ids.
- `fetch` – Retrieves the full content for a specific source that was previously referenced by `search`.

When registering the server with a client, you may optionally restrict the allowed tools to this list so that requests stay within the documented capabilities. As both operations are read only, it is safe to allow calling them without user confirmation.

{% callout title="Full Document Retrieval (Fetch)" %}
We started indexing your training data differently starting in October 2025 to prepare the `fetch` tool to be able to return entire documents (full web page, pdf, etc). However, if training data was ingested before that change, it may take a refresh to get better results for the `fetch` call, which will default to just a full text chunk if it doesn't yet have access to the full document.
{% /callout %}

## Authentication

All requests should include the DocsBot API key (or temporary generated signature) for the team that owns the bot:

```
Authorization: Bearer <YOUR_DOCSBOT_API_KEY>
```

The header is required when the bot's privacy is set to **private** and recommended for any deployment that shares the MCP endpoint beyond your organization. You can rotate or revoke the key from the dashboard at any time to immediately invalidate existing MCP connections.

{% callout type="warning" title="OAuth Not Supported" %}
The MCP server does not support OAuth authentication yet. Only Bearer API key authentication is currently available.
{% /callout %}
