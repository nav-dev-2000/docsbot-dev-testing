---
title: Conversations API - Admin API
description: How to view conversation history with the admin API.
---

DocsBot's **Conversations API** gives you programmatic access to complete conversation sessions between users and your AI Agent. Instead of isolated question logs, you can retrieve full conversations with rich context, summaries, metadata, and user feedback—making it easier to monitor, evaluate, and improve performance through code.

This API is ideal for support teams, onboarding workflows, and internal documentation assistants where understanding the complete flow and resolution of conversations matters. You can build custom dashboards, integrate with your existing tools, or create automated workflows based on conversation data. {% .lead %}

---

## Response Objects

### The Conversation object

Conversation objects have the following properties:

| Property         | Type         | Description                                                                                                           |
| ---------------- | ------------ | --------------------------------------------------------------------------------------------------------------------- |
| **id**           | string       | The conversation id.                                                                                                  |
| **title**        | string/null  | The conversation title if set.                                                                                        |
| **createdAt**    | string       | The conversation creation date.                                                                                       |
| **updatedAt**    | string       | The conversation last update date.                                                                                    |
| **expiresAt**    | string/null  | The conversation expiration date if set.                                                                              |
| **truncated**    | boolean      | Whether the conversation history was truncated due to length limits.                                                  |
| **model**        | string/null  | The AI model used for the conversation.                                                                               |
| **ip**           | string       | A SHA256 hash of the user or caller IP address. Can help to identify conversations from the same user.                |
| **answered**     | boolean      | Whether the bot was able to answer questions in the conversation.                                                     |
| **summary**      | string/null  | A summary of the conversation if generated.                                                                           |
| **metadata**     | object       | A user identification object with arbitrary metadata about the user if it was sent with the chat request.             |
| **sentiment**    | string/null  | The overall sentiment of the conversation (positive, negative, neutral).                                              |
| **history**      | array        | An array of message objects containing the full conversation history.                                                 |
| **resolved**     | string       | The resolution status of the conversation (`resolved`, `unresolved`).                                                 |
| **escalated**    | string       | The escalation status of the conversation (`handled`, `triggered`, `none`).                                           |
| **ticketContent** | string/null | The content of the support ticket if the conversation was escalated.                                                  |
| **ticketSubject** | string/null | The subject of the support ticket if the conversation was escalated.                                                  |
| **alias**        | string       | An anonymous username generated from user IP or name/email from metadata.                                            |

### The Message object

Message objects found in the `history` array have the following properties:

| Property     | Type         | Description                                                                 |
| ------------ | ------------ | --------------------------------------------------------------------------- |
| **timestamp** | string      | The timestamp when the message was sent.                                    |
| **Human**    | string/null  | The human user's message content (present only for user messages).          |
| **AI**       | string/null  | The AI assistant's message content (present only for AI messages).          |
| **type**     | string/null  | The type of AI response (`answer`, `lookup_answer`, `is_resolved_question`, `support_escalation`, etc.). Present only for AI messages. |
| **id**       | string/null  | The question ID. Present only for messages with `type === "lookup_answer"`. Use this for rating, or for fetching/deleting the question from logs via the [Question History API](/documentation/developer/questions-api). Not present for `is_resolved_question`, `support_escalation`, or other AI message types. |
| **options**  | object/null  | Interactive options presented to the user (e.g., yes/no buttons). Present only for AI messages with interactive elements. |

---

## List Conversations

This endpoint lists all conversations for a given team and bot. Objects are a limited subset of conversation properties. It accepts a GET request with the following parameters:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations?page=0&perPage=25`

### Optional URL Parameters

| Property      | Type    | Description                                                                                                 |
| ------------- | ------- | ----------------------------------------------------------------------------------------------------------- |
| **page**      | number  | The page number to return. Pages are 0-indexed. Defaults to 0.                                              |
| **perPage**   | number  | The number of conversations to return per page. Defaults to 25.                                              |

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append(
  'Authorization',
  'Bearer YOUR_API_KEY'
)

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow',
}

fetch(
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with `conversations` as an array of conversation objects, and `pagination` as an object with pagination information.

```json
{
  "conversations": [
    {
      "id": "3d72a958-6347-4cc2-9fb2-b87f9c8f202e",
      "title": "How can I customize DocsBot's responses?",
      "createdAt": "2025-09-11T23:16:58.876Z",
      "updatedAt": "2025-09-11T23:19:09.802Z",
      "summary": null,
      "sentiment": null,
      "metadata": {
        "referrer": "https://docsbot.ai/"
      },
      "answered": true,
      "escalated": "none",
      "ip": "hashedipaddress",
      "truncated": false,
      "model": "gpt-5.1",
      "resolved": "confirmed",
      "alias": "shaggy-trucks"
    },
    {
      "id": "719d001d-8414-4120-836c-3a51e0fe803a",
      "title": "Can DocsBot learn from Help Scout tickets?",
      "createdAt": "2025-09-11T22:52:35.891Z",
      "updatedAt": "2025-09-11T22:52:35.891Z",
      "summary": null,
      "sentiment": null,
      "metadata": {
        "referrer": "https://docsbot.ai/tools"
      },
      "answered": true,
      "escalated": "none",
      "ip": "hashedipaddress",
      "truncated": false,
      "model": "gpt-5",
      "resolved": "assumed",
      "alias": "gainful-mask"
    },
    {
      "id": "132f0efc-ae7c-48ba-8306-a1ab176f4ff7",
      "title": "How do I log in to DocsBot?",
      "createdAt": "2025-09-11T22:49:09.191Z",
      "updatedAt": "2025-09-11T22:49:22.487Z",
      "summary": null,
      "sentiment": null,
      "metadata": {
        "referrer": "https://docsbot.ai/app"
      },
      "answered": true,
      "escalated": "handled",
      "ip": "hashedipaddress",
      "truncated": false,
      "model": "gpt-5",
      "resolved": "unresolved",
      "alias": "fragile-knife"
    }
  ],
  "pagination": {
    "perPage": 25,
    "page": 0,
    "viewableCount": 150,
    "totalCount": 200,
    "hasMorePages": true,
    "planLimit": 1000000
  }
}
```

## Get Single Conversation

This endpoint retrieves a specific conversation by its ID, returning all the data. It accepts a GET request:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations/:conversationId`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations/YOUR_CONVERSATION_ID' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append(
  'Authorization',
  'Bearer YOUR_API_KEY'
)

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
}

fetch(
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations/YOUR_CONVERSATION_ID',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a single conversation object with the full conversation history:

```json
{
  "id": "c9b5b10e-1574-4459-8732-0302c519c521",
  "title": "Demo Request for DocsBot Walkthrough",
  "createdAt": "2025-09-11T19:07:04.138Z",
  "updatedAt": "2025-09-11T19:07:37.373Z",
  "expiresAt": "2025-12-10T19:07:37.373Z",
  "truncated": false, //if conversation exceeds 1MB we might cut items out of the middle
  "model": "gpt-5",
  "ip": "hashedipaddress",
  "answered": true, //if AI classified it could answer the latest question
  "summary": "The user asked which sources DocsBot can learn from, and the assistant listed multiple data sources and how to connect them, then offered to help pick the best sources. The user followed up by wanting a live, in-person (remote) demo and walkthrough with a person. The assistant confirmed the option to connect them for a live demo. Overall, the conversation centers on understanding source compatibility and arranging a live product demonstration.", // in Standard plan and up, generated with a click or after 12 hrs
  "metadata": {
    "referrer": "https://docsbot.ai/"
  },
  "sentiment": "neutral",
  "history": [
    {
      "timestamp": "2025-09-11T19:06:47.405Z",
      "Human": "What platforms or content sources can DocsBot learn from?"
    },
    {
      "AI": "You're asking what platforms and content sources DocsBot can learn from. DocsBot supports training from a wide range of sources, including:\n\n- Websites and web pages (via crawlers, sitemaps, RSS)\n- Knowledge bases and docs platforms: Confluence, GitBook, WordPress, Salesforce pages, Zendesk, Help Scout\n- Code and repos: GitHub repositories\n- Cloud storage: Google Cloud Storage, Amazon S3 / DigitalOcean Spaces\n- Support systems: Freshdesk tickets, Zendesk tickets, Help Scout tickets\n- Communications: Slack conversations\n- Media and video: YouTube videos, media files\n\nDocsBot supports over 27 sources in total and you can schedule automatic updates to keep your bot's knowledge current. To connect them:\n- In the DocsBot dashboard, select your bot → click \"New Source\" → choose an integration → connect/upload and sync.\n\nFor more, see the DocsBot Documentation: https://docsbot.ai/documentation\n\nWould you like help picking the best sources for your use case?",
      "timestamp": "2025-09-11T19:06:56.354Z",
      "id": "PEHLhSKbGJ0OC5jON0jY",
      "type": "lookup_answer"
    },
    {
      "options": {
        "no": "Nope",
        "yes": "Yes, thanks"
      },
      "timestamp": "2025-09-11T19:07:04.119Z",
      "AI": "Did that answer your question about the sources DocsBot can learn from?",
      "type": "is_resolved_question"
    },
    {
      "timestamp": "2025-09-11T19:07:34.599Z",
      "Human": "I want to talk to a person for a demo and understand how it would work"
    },
    {
      "options": {
        "no": "No, I'm okay for now.",
        "yes": "Yes, please connect me."
      },
      "timestamp": "2025-09-11T19:07:36.964Z",
      "AI": "I understand—you'd like to speak with a person for a live demo and walkthrough. Should I connect you with our team to schedule that?",
      "type": "support_escalation"
    }
  ],
  "resolved": "unresolved",
  "escalated": "handled",
  "ticketContent": "Request: Interested in a live demo and walkthrough to understand how DocsBot would work for the organization. Key details: wants to learn how DocsBot ingests and trains on content and to see it in action.\nRelevant sources mentioned: websites/web pages, sitemaps/RSS, Confluence, GitBook, WordPress, Salesforce pages, Zendesk, Help Scout, GitHub repositories, Google Cloud Storage, Amazon S3 / DigitalOcean Spaces, Freshdesk, Slack, YouTube/media files.\nRequested next steps: schedule a live demo with a product specialist, walkthrough of connecting sources, syncing/updating content, and recommendations for best source selection for the use case. Please propose available demo times and any pre-demo requirements (account access, example content, integrations to connect).\nPriority: high — user explicitly requested to speak with a person for a demo.", // if escalation was triggered with a supportCallback to create a ticket
  "ticketSubject": "Request to schedule live demo and walkthrough of DocsBot", // if escalation was triggered with a supportCallback to create a ticket
  "alias": "average-impulse"
}
```

## Delete Conversation

This endpoint lets you delete a conversation from your bot's conversation log. It accepts a DELETE request with no query parameters:

`DELETE https://docsbot.ai/api/teams/:teamId/bots/:botId/conversations/:conversationId`

**Note:** This endpoint requires edit permissions for the bot.

### Examples

#### cURL

```bash
curl --request DELETE 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations/YOUR_CONVERSATION_ID' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append(
  'Authorization',
  'Bearer YOUR_API_KEY'
)

var requestOptions = {
  method: 'DELETE',
  headers: myHeaders,
}

fetch(
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/conversations/YOUR_CONVERSATION_ID',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with 1 field, 'message'. In case of failure this field will be a descriptive string describing the error. For success, message will be 'success' with an HTTP status code of 200:

```json
{
  "message": "success"
}
```
