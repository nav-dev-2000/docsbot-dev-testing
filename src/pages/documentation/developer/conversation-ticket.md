---
title: Conversation Ticket Creation API
description: Generate structured support tickets from chat agent conversations for submission to help desk systems.
---

{% callout title="Chat Agent Only" %}
This endpoint only works with conversations created using the [Chat Agent API](/documentation/developer/chat-agent). It cannot be used with conversations from other chat APIs.
{% /callout %}

The Conversation Ticket API generates a structured support ticket from an existing chat agent conversation. This endpoint analyzes the conversation history and creates a well-formatted support ticket with a subject line and detailed content from the point of view of the user suitable for submission to a help desk or support system.

For a more simple use of this feature, you can use the [supportCallback Javascript event](/documentation/developer/embeddable-chat-widget#support-callback) in our widget for a seamless escaltion process with existing help desk systems or your own support forms.

---

## Request

This endpoint accepts a GET request to generate a support ticket from an existing conversation:
`GET https://api.docsbot.ai/teams/[teamId]/bots/[botId]/conversations/[conversationId]/ticket`

Replace `[teamId]`, `[botId]`, and `[conversationId]` with your actual team ID, bot ID, and conversation ID.

### Parameters

| Parameter        | Type   | Description                                                    |
| ---------------- | ------ | -------------------------------------------------------------- |
| **team_id**      | string | The team ID (path parameter)                                   |
| **bot_id**       | string | The bot ID (path parameter)                                    |
| **conv_id**      | string | The conversation ID to generate a ticket from (path parameter) |

### Authentication

- **Private bots**: Authentication is required, or if you want to force a new ticket
- **Public bots**: No authentication required, but returns cached ticket only if one was already created

Bearer token options: [Authentication — Private bots](/documentation/developer/authentication#private-bots).

---

## Response

The API returns a JSON object with the following structure:

### Success Response (200)

```json
{
  "subject": "Pricing and Feature Inquiry",
  "message": "Hello,\n\nI'm interested in learning more about DocsBot's pricing plans and the features included in each tier. Could you please provide details on the following:\n\n- What are the differences between the Hobby, Personal, and Pro plans?\n- How many bots, source pages, and messages per month are included with each plan?\n- Are there any limits on team users or access to advanced analytics?"
}
```

### Response Fields

| Field        | Type   | Description                                                    |
| ------------ | ------ | -------------------------------------------------------------- |
| **subject**  | string | Subject of the support ticket                                  |
| **message**  | string | Content of support ticket from the point of view of the user     |

---

## Error Handling

The API returns standard HTTP status codes:

```
400 Bad Request: Invalid conversation ID or conversation not found
401 Unauthorized: Authentication required
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
curl -X GET "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/ticket" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### JavaScript (fetch)

```javascript
const response = await fetch(
  'https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/ticket',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY'
    }
  }
);

const ticket = await response.json();
console.log(ticket.subject); // Subject line
console.log(ticket.message); // Ticket content
```

### Python

```python
import requests

url = "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/ticket"
headers = {
    "Authorization": "Bearer YOUR_API_KEY"
}

response = requests.get(url, headers=headers)
ticket = response.json()
print(ticket['subject'])  # Subject line
print(ticket['message'])  # Ticket content
```

---

## Use Cases

This API is particularly useful for:

- **Support Escalation**: Converting AI chat conversations into structured tickets for human agents
- **Help Desk Integration**: Automatically creating tickets in systems like Zendesk, Freshdesk, or ServiceNow
- **Documentation**: Creating records of customer interactions for training and improvement
- **Quality Assurance**: Generating formatted summaries for review and analysis

The generated ticket content includes conversation context, customer questions, AI responses, and resolution status, making it easy for support teams to understand the full interaction history. 