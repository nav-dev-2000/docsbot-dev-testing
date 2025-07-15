---
title: Conversation Summarize API
description: Generate summaries of chat agent conversations including title, summary text, and sentiment analysis.
---

{% callout title="Chat Agent Only" %}
This endpoint only works with conversations created using the [Chat Agent API](/documentation/developer/chat-agent). It cannot be used with conversations from other chat APIs.
{% /callout %}

The Conversation Summarize API generates or retrieves a summary of a chat agent conversation including title, summary text, and sentiment analysis. For private bots, authentication is required. Returns cached summary if available for unauthenticated requests.

---

## Request

This endpoint accepts a GET request to summarize an existing conversation:
`GET https://api.docsbot.ai/teams/[teamId]/bots/[botId]/conversations/[conversationId]/summarize`

Replace `[teamId]`, `[botId]`, and `[conversationId]` with your actual team ID, bot ID, and conversation ID.

### Parameters

| Parameter        | Type   | Description                                                    |
| ---------------- | ------ | -------------------------------------------------------------- |
| **team_id**      | string | The team ID (path parameter)                                   |
| **bot_id**       | string | The bot ID (path parameter)                                    |
| **conv_id**      | string | The conversation ID to summarize (path parameter)             |

### Authentication

- **Private bots**: Authentication is required, or if you want to force a summary refresh
- **Public bots**: No authentication required, but returns cached summary only if one was already created

---

## Response

The API returns a JSON object with the following structure:

### Success Response (200)

```json
{
  "title": "Pricing plans Overview",
  "summary": "User inquired about pricing plans and received detailed information about Hobby, Personal, and Pro plans. The conversation was resolved satisfactorily.",
  "sentiment": "positive"
}
```

### Response Fields

| Field        | Type   | Description                                                    |
| ------------ | ------ | -------------------------------------------------------------- |
| **title**    | string | Short title of the conversation, one short sentence maximum   |
| **summary**  | string | Content of summary properly formatted as plain text           |
| **sentiment** | string | Overall sentiment of the conversation (positive, neutral, negative) |

---

## Error Handling

The API returns standard HTTP status codes:

```
400 Bad Request: Invalid conversation ID or conversation not found
401 Unauthorized: Authentication required for private bot
402 Payment Required: This feature is only available on the Standard plan and above
403 Forbidden: Access denied to the conversation
404 Not Found: Conversation, bot, or team not found
422 Validation Error: Invalid parameters
500 Internal Server Error: Unexpected server error
```

### Error Response Format

```json
{
  "error": "Conversation not found"
}
```

---

## Example Usage

### cURL

```bash
curl -X GET "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/summarize" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript (fetch)

```javascript
const response = await fetch(
  'https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/summarize',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const summary = await response.json();
console.log(summary.title);     // Short conversation title
console.log(summary.summary);   // Summary content
console.log(summary.sentiment); // positive/neutral/negative
```

### Python

```python
import requests

url = "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/summarize"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
summary = response.json()
print(summary['title'])     # Short conversation title
print(summary['summary'])   # Summary content
print(summary['sentiment']) # positive/neutral/negative
``` 