---
title: Conversation Lead Capture API
description: Capture lead information by updating conversation metadata and saving the lead.
---

{% callout title="Chat Agent Only" %}
This endpoint only works with conversations created using the [Chat Agent API](/documentation/developer/chat-agent). It cannot be used with conversations from other chat APIs.
{% /callout %}

{% callout title="Managing Captured Leads" %}
Use the [Leads API - Admin API](/documentation/developer/leads-api) to list, export, and delete leads after they are captured.
{% /callout %}

The Conversation Lead Capture API captures lead information by updating conversation metadata (if the conversation exists) and saving the lead. This endpoint performs the following operations:
1. Updates the conversation's metadata (only if the conversation exists, always merging with existing metadata)
2. Saves the lead (always performed)

The endpoint works whether or not the conversation has been created, allowing you to capture leads before any conversation starts.

---

## Request

This endpoint accepts a POST request to capture lead information:
`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/conversations/[conversationId]/lead`

Replace `[teamId]`, `[botId]`, and `[conversationId]` with your actual team ID, bot ID, and conversation ID.

### Parameters

| Parameter        | Type   | Description                                                    |
| ---------------- | ------ | -------------------------------------------------------------- |
| **team_id**      | string | The team ID (path parameter)                                   |
| **bot_id**       | string | The bot ID (path parameter)                                    |
| **conv_id**      | string | The conversation UUID to capture lead for (path parameter)       |

### Request Body

```json
{
  "metadata": {
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp",
    "phone": "+1234567890"
  }
}
```

**Fields:**
- `metadata` (object, required): Key-value pairs containing lead information. Can include any fields you want to capture (email, name, company, phone, etc.). New metadata is always merged with existing conversation metadata.

### Authentication

- **Private bots**: Authentication is required
- **Public bots**: Authentication is optional but recommended

Bearer token options: [Authentication — Private bots](/documentation/developer/authentication#private-bots).

### Headers

```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
```

---

## Response

The API returns a boolean value indicating success.

### Success Response (200)

**Response Body**: `true` (boolean)

### Error Responses

**404 Not Found - Invalid bot_id**
```json
{
  "error": "Invalid bot_id."
}
```

**403 Forbidden - Authentication Failed**
```json
{
  "error": "Authentication error message"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error."
}
```

---

## Behavior

The endpoint checks if the conversation exists before attempting to update it. The behavior differs based on whether the conversation exists:

### If Conversation Exists
- **Conversation Metadata Update**: The new metadata is merged with existing conversation metadata
- **Lead**: Saved

### If Conversation Doesn't Exist
- **Conversation Metadata Update**: Skipped (no error thrown)
- **Lead**: Saved

### Lead Saving
- **Lead ID**: Same as `conv_id` (conversation ID)
- **First Time**: Saves a new lead with:
  - `createdAt`: Current timestamp
  - `metadata`: The metadata object from the request
- **Subsequent Calls**: Updates the existing lead:
  - `createdAt`: Preserved from original creation
  - `metadata`: Updated with the new metadata from the request

### Transaction Safety
Both operations (conversation update, if applicable, and lead save) are performed atomically, ensuring data consistency.

---

## Example Usage

### cURL

```bash
# Basic lead capture
curl -X POST "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/lead" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "email": "user@example.com",
      "name": "John Doe",
      "company": "Acme Corp"
    }
  }'
```

### JavaScript (fetch)

```javascript
const captureLead = async (teamId, botId, convId, metadata) => {
  const url = `https://api.docsbot.ai/teams/${teamId}/bots/${botId}/conversations/${convId}/lead`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer YOUR_API_KEY`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metadata: metadata
    })
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Lead captured:', result);
    return result;
  } else {
    const error = await response.json();
    throw new Error(`Failed to capture lead: ${error.error}`);
  }
};

// Usage
captureLead('team_123', 'bot_456', 'conv_789', {
  email: 'user@example.com',
  name: 'John Doe',
  company: 'Acme Corp'
});
```

### Python

```python
import requests

# Basic lead capture
url = "https://api.docsbot.ai/teams/your-team-id/bots/your-bot-id/conversations/550e8400-e29b-41d4-a716-446655440000/lead"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "metadata": {
        "email": "user@example.com",
        "name": "John Doe",
        "company": "Acme Corp",
        "phone": "+1234567890"
    }
}

response = requests.post(url, json=payload, headers=headers)

if response.status_code == 200:
    print("Lead captured successfully:", response.json())
else:
    print(f"Error: {response.status_code} - {response.text}")
```

---

## Use Cases

This endpoint is used by our [chat widget's lead capture tool](/documentation/developer/embeddable-chat-widget) to automatically save lead information. You can also use it directly via the API for custom integrations.

### Capture Lead Before Conversation Starts
Capture lead information before any conversation begins, such as when a user visits your site or fills out a form:

```python
# Capture lead before conversation starts
lead_metadata = {
    "email": user_email,
    "name": user_name,
    "source": "landing_page",
    "utm_source": "google",
    "utm_medium": "cpc"
}

# Conversation doesn't exist yet - only lead will be saved
response = requests.post(
    f"https://api.docsbot.ai/teams/{team_id}/bots/{bot_id}/conversations/{conv_id}/lead",
    json={"metadata": lead_metadata},
    headers={"Authorization": f"Bearer {api_key}"}
)
```

### Capture Lead Information During Chat
When a user provides contact information during a conversation, capture it as a lead:

```python
# After user provides email in chat
lead_metadata = {
    "email": user_email,
    "source": "chat",
    "captured_at": "2024-01-15T10:30:00Z"
}

response = requests.post(
    f"https://api.docsbot.ai/teams/{team_id}/bots/{bot_id}/conversations/{conv_id}/lead",
    json={"metadata": lead_metadata},
    headers={"Authorization": f"Bearer {api_key}"}
)
```

### Update Lead Information
Update existing lead with additional information:

```python
# Add more information to existing lead
additional_metadata = {
    "phone": "+1234567890",
    "company": "Acme Corp",
    "job_title": "Product Manager"
}

# This will merge with existing metadata
response = requests.post(
    f"https://api.docsbot.ai/teams/{team_id}/bots/{bot_id}/conversations/{conv_id}/lead",
    json={"metadata": additional_metadata},
    headers={"Authorization": f"Bearer {api_key}"}
)
```

---

## Important Notes

1. **Conversation Not Required**: The conversation does not need to exist before capturing a lead. If the conversation doesn't exist, only the lead will be saved. The conversation metadata update will be skipped without throwing an error.

2. **Lead ID**: The lead ID is the same as the conversation ID (`conv_id`). This creates a 1:1 relationship between conversations and leads, allowing you to capture leads before conversations start and link them later.

3. **Metadata Preservation**: When updating an existing lead, the `createdAt` timestamp is preserved. Only the `metadata` field is updated.

4. **Transaction Safety**: Both operations (conversation update, if applicable, and lead save) are performed atomically. If either operation fails, both are rolled back. If the conversation doesn't exist, only the lead save operation is performed.

5. **Private Bots**: For bots with `privacy: 'private'`, authentication is required. See [Authentication — Private bots](/documentation/developer/authentication#private-bots) for JWT (recommended), HMAC, and API key Bearer options. Public bots can be called without authentication, but including a valid token is still recommended for higher limits.

6. **Metadata Structure**: The metadata object can contain any key-value pairs you need. Common fields include: `email`, `name`, `company`, `phone`, `source`, etc.
