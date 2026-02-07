---
title: Leads API - Admin API
description: Capture, list, export, and delete lead records for your bots.
---

The **Leads API** gives you one place to manage lead capture data tied to conversation IDs. Use it to capture metadata before or during a conversation, list leads, export to CSV, and delete lead records. {% .lead %}

---

## How Leads Are Created

Leads are typically created via the Chat API lead-capture endpoint, often when the **Leads tool** is enabled in widget settings and your flow captures user metadata.

Use [Conversation Lead Capture](/documentation/developer/conversation-lead) for lead creation behavior and request details.

---

## Response Objects

### The Lead object

Lead objects have the following properties:

| Property      | Type        | Description                                                                                          |
| ------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| **id**        | string      | Lead ID. This is the same as the conversation ID.                                                    |
| **createdAt** | string      | Lead creation timestamp.                                                                             |
| **updatedAt** | string/null | Last update timestamp. Present after the first update.                                               |
| **metadata**  | object      | Arbitrary lead metadata object (email, name, phone, company, etc.).                                 |
| **ip**        | string      | User IP hash (or raw IP if bot `recordIP: true`).                                                    |
| **alias**     | string      | Display alias generated from IP unless metadata includes name/email.                                 |
| **email**     | string/null | Convenience email field derived from metadata when available.                                        |

### Pagination object

List responses include a `pagination` object:

| Property          | Type    | Description                                                              |
| ----------------- | ------- | ------------------------------------------------------------------------ |
| **perPage**       | number  | Number of leads per page.                                                |
| **page**          | number  | Current page (0-indexed).                                                |
| **totalCount**    | number  | Total leads matching filters.                                            |
| **hasMorePages**  | boolean | Whether more pages exist.                                                |
| **planLimit**     | number  | Plan max viewable records for logs.                                      |

---

## Endpoint Summary

- `POST /teams/:teamId/bots/:botId/conversations/:conversationId/lead`: Capture or update a lead from chat flow.
- `GET /api/teams/:teamId/bots/:botId/leads`: List leads with pagination and date filters.
- `GET /api/teams/:teamId/bots/:botId/leads/export`: Export filtered leads as CSV.
- `DELETE /api/teams/:teamId/bots/:botId/leads/:leadId`: Delete one lead record.

---

## Capture Lead

Creates or updates a lead and merges metadata. If conversation exists, conversation metadata is also merged.

`POST https://api.docsbot.ai/teams/:teamId/bots/:botId/conversations/:conversationId/lead`

### Request Body

```json
{
  "metadata": {
    "email": "user@example.com",
    "name": "John Doe",
    "company": "Acme Corp"
  }
}
```

### Behavior

- Document path: `/teams/:teamId/bots/:botId/leads/:conversationId`
- First write sets `createdAt`
- Later writes set `updatedAt`
- `metadata` is always merged, not replaced
- Works even if conversation does not yet exist

### Authentication

- Private bots: required
- Public bots: optional (recommended)

For more examples and details, see [Conversation Lead Capture](/documentation/developer/conversation-lead).

---

## List Leads

Lists leads for a bot.

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/leads?page=0&perPage=50`

### Optional URL Parameters

| Property      | Type   | Description                                                                 |
| ------------- | ------ | --------------------------------------------------------------------------- |
| **page**      | number | 0-indexed page number. Default `0`.                                         |
| **perPage**   | number | Results per page. Default `50`.                                             |
| **startDate** | string | Filter by lead `createdAt` start time (ISO datetime or parsable date).      |
| **endDate**   | string | Filter by lead `createdAt` end time (ISO datetime or parsable date).        |

### Permissions

- Requires bot view access (`owner`, `admin`, `editor`, `viewer`; denied for `none`).

### Example (cURL)

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/leads?page=0&perPage=50&startDate=2026-02-01T00:00:00.000Z&endDate=2026-02-05T23:59:59.999Z' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

### Response

```json
{
  "leads": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "createdAt": "2026-02-05T14:12:01.182Z",
      "updatedAt": "2026-02-05T14:13:21.004Z",
      "metadata": {
        "name": "John Doe",
        "email": "user@example.com",
        "company": "Acme Corp"
      },
      "ip": "dfebd0b1d7e002b7ff745a5f2885340579ceb966d8a33a7c4b4e0669f0d0384b",
      "alias": "John Doe",
      "email": "user@example.com"
    }
  ],
  "pagination": {
    "perPage": 50,
    "page": 0,
    "totalCount": 1,
    "hasMorePages": false,
    "planLimit": 1000000
  }
}
```

---

## Export Leads CSV

Exports leads matching a date range to a signed CSV URL.

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/leads/export?startDate=...&endDate=...`

### Required URL Parameters

| Property      | Type   | Description                                    |
| ------------- | ------ | ---------------------------------------------- |
| **startDate** | string | Start datetime for `createdAt` filter.         |
| **endDate**   | string | End datetime for `createdAt` filter.           |

### Permissions

- Requires bot export permission (`owner`, `admin`, `editor`).
- Also requires a plan with log export enabled.

### Example (cURL)

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/leads/export?startDate=2026-02-01T00:00:00.000Z&endDate=2026-02-05T23:59:59.999Z' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

### Response

```json
{
  "url": "https://storage.googleapis.com/.../docsbot_leads_...csv?..."
}
```

---

## Delete Lead

Deletes one lead document.

`DELETE https://docsbot.ai/api/teams/:teamId/bots/:botId/leads/:leadId`

### Permissions

- Requires bot edit access (`owner`, `admin`, `editor`).

### Example (cURL)

```bash
curl --request DELETE 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/leads/YOUR_LEAD_ID' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

### Response

```json
{
  "message": "success"
}
```

---

## Error Responses

Common errors across lead endpoints:

| Status | Meaning |
| ------ | ------- |
| `400`  | Invalid method or missing/invalid required params. |
| `403`  | Authentication or permission denied. |
| `404`  | Bot or lead/conversation ID not found. |
| `500`  | Internal server error. |
