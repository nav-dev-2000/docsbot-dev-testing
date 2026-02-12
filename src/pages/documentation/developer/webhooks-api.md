---
title: Webhooks API - Admin API
description: Create and manage lead webhooks for Zapier-compatible REST Hooks.
---

The **Webhooks API** lets you create, list, update, and delete webhook subscriptions for each bot. It supports multiple event triggers and is designed to work with Zapier REST Hook triggers. {% .lead %}

Use our Zapier integration here: [DocsBot + Zapier](https://zapier.com/apps/docsbot-ai/integrations).

---

## Zapier REST Hook Mapping

Use these endpoints in Zapier Trigger API Configuration:

- **Subscribe**: `POST /api/teams/:teamId/bots/:botId/webhooks`
- **Unsubscribe**: `DELETE /api/teams/:teamId/bots/:botId/webhooks/:webhookId`

For Subscribe, pass `bundle.targetUrl` as `targetUrl`. Use the response `id` in Unsubscribe.

---

## Supported Events

- `lead.created`: Fires when lead data is captured.
- `deep_research.done`: Fires when a deep research job completes.
- `conversation.escalated`: Fires when a conversation is escalated.
- `conversation.rated`: Fires when a conversation answer is rated.

---

## Endpoint Summary

- `GET /api/teams/:teamId/bots/:botId/webhooks`: List registered webhooks.
- `POST /api/teams/:teamId/bots/:botId/webhooks`: Create webhook subscription.
- `GET /api/teams/:teamId/bots/:botId/webhooks/:webhookId`: Get one webhook.
- `PATCH /api/teams/:teamId/bots/:botId/webhooks/:webhookId`: Update status, target URL, label, expiration.
- `DELETE /api/teams/:teamId/bots/:botId/webhooks/:webhookId`: Delete webhook.
- `POST /api/teams/:teamId/bots/:botId/webhooks/deliver-lead`: Trigger a lead webhook delivery test.
- `POST /api/teams/:teamId/bots/:botId/webhooks/deliver-research`: Trigger a deep research webhook delivery test.
- `POST /api/teams/:teamId/bots/:botId/webhooks/deliver-escalated`: Trigger a conversation.escalated webhook delivery test.
- `POST /api/teams/:teamId/bots/:botId/webhooks/deliver-rated`: Trigger a conversation.rated webhook delivery test.

---

## Create Webhook (Subscribe)

`POST https://docsbot.ai/api/teams/:teamId/bots/:botId/webhooks`

### Request Body

```json
{
  "targetUrl": "https://your-server.com/webhook",
  "events": ["lead.created", "deep_research.done", "conversation.escalated", "conversation.rated"],
  "label": "Primary webhook",
  "source": "zapier",
  "expirationDate": "2026-03-15T00:00:00.000Z"
}
```

### Response

```json
{
  "id": "abc123",
  "targetUrl": "https://your-server.com/webhook",
  "events": ["lead.created", "deep_research.done", "conversation.escalated", "conversation.rated"],
  "status": "active",
  "expirationDate": "2026-03-15T00:00:00.000Z"
}
```

---

## Delete Webhook (Unsubscribe)

`DELETE https://docsbot.ai/api/teams/:teamId/bots/:botId/webhooks/:webhookId`

```json
{
  "message": "success",
  "id": "abc123"
}
```

---

## Delivery Payload

Each webhook delivery is sent as a `POST` request with:

- `Content-Type: application/json`
- `X-DocsBot-Event`: The event name (e.g. `lead.created`, `deep_research.done`, `conversation.escalated`, `conversation.rated`)
- `X-DocsBot-Signature`: HMAC-SHA256 signature of the raw body for verification (optional but recommended to ensure webhooks originate from DocsBot; see [Signature Verification](#signature-verification))

### lead.created payload

When a `lead.created` webhook is delivered, DocsBot posts JSON like:

```json
{
  "event": "lead.created",
  "teamId": "team_123",
  "botId": "bot_123",
  "lead": {
    "id": "conversation_123",
    "createdAt": "2026-02-10T14:30:00.000Z",
    "updatedAt": null,
    "metadata": {
      "name": "Jane Doe",
      "email": "jane@example.com"
    },
    "ip": "hashed-ip"
  }
}
```

### conversation.escalated payload

```json
{
  "event": "conversation.escalated",
  "teamId": "team_123",
  "botId": "bot_456",
  "conversation": {
    "id": "conv_789",
    "createdAt": "2026-02-10T15:12:44.000000",
    "updatedAt": "2026-02-11T18:43:01.000000",
    "metadata": {
      "email": "user@example.com",
      "plan": "pro"
    },
    "ip": "a1b2c3d4e5f6...",
    "escalatedAt": "2026-02-11T18:43:01.123456",
    "resolved": "unresolved",
    "escalated": "handled"
  }
}
```

### conversation.rated payload

```json
{
  "event": "conversation.rated",
  "teamId": "team_123",
  "botId": "bot_456",
  "conversation": {
    "id": "conv_789",
    "createdAt": "2026-02-10T15:12:44.000000",
    "updatedAt": "2026-02-11T18:45:22.000000",
    "metadata": {
      "email": "user@example.com",
      "plan": "pro"
    },
    "ip": "a1b2c3d4e5f6...",
    "ratedAt": "2026-02-11T18:45:22.123456",
    "rating": 1,
    "answerId": "ans_321",
    "resolved": "confirmed",
    "escalated": "none"
  }
}
```

### deep_research.done payload

```json
{
  "event": "deep_research.done",
  "teamId": "team_123",
  "botId": "bot_123",
  "research": {
    "jobId": "job_123",
    "status": "completed",
    "title": "Root cause analysis",
    "question": "Why auth latency increased",
    "createdAt": "2026-02-10T14:30:00.000Z",
    "completedAt": "2026-02-10T14:45:00.000Z",
    "metadata": {
      "uid": "user_123"
    },
    "answer": "## Summary\n\nAuth latency increased due to..."
  }
}
```

The `answer` field contains the final markdown answer from the deep research job.

---

## Signature Verification

Verification is optional but recommended to ensure webhooks originate from DocsBot. Each delivery includes an `X-DocsBot-Signature` header. The signature is an HMAC-SHA256 hash of the raw request body, using your bot's signing key as the secret.

**Header format:** `X-DocsBot-Signature: sha256=<hex>`

**Signing key:** Find yours on the [Webhooks](/app/bots) page for your bot (Integrations → Webhooks). Copy the signing key from there.

### Verification (Node.js)

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(rawBody, signatureHeader, signingKey) {
  const expected = crypto
    .createHmac('sha256', signingKey)
    .update(rawBody)
    .digest('hex')
  const received = signatureHeader?.replace(/^sha256=/, '') || ''
  return crypto.timingSafeEqual(
    Buffer.from(expected, 'hex'),
    Buffer.from(received, 'hex')
  )
}

// In your webhook handler (must use raw body, not parsed JSON):
app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const isValid = verifyWebhookSignature(
    req.body,
    req.headers['x-docsbot-signature'],
    process.env.DOCSBOT_SIGNING_KEY
  )
  if (!isValid) return res.status(401).send('Invalid signature')
  const payload = JSON.parse(req.body)
  // process payload...
})
```

### Verification (Python)

```python
import hmac
import hashlib

def verify_webhook_signature(raw_body: bytes, signature_header: str, signing_key: str) -> bool:
    expected = hmac.new(
        signing_key.encode(),
        raw_body,
        hashlib.sha256
    ).hexdigest()
    received = (signature_header or '').replace('sha256=', '')
    return hmac.compare_digest(expected, received)
```

**Important:** Always verify using the raw bytes of the request body, not the parsed JSON. If you parse the body before verification, the signature may not match due to JSON encoding differences.

---

## Permissions

- Webhook create/update/delete requires bot integration management access (`owner` or `admin`).
- Perform List requires bot view access.

---

## Error Responses

| Status | Meaning                                            |
| ------ | -------------------------------------------------- |
| `400`  | Invalid HTTP method, invalid URL, invalid payload. |
| `403`  | Authentication or permission denied.               |
| `404`  | Bot or webhook not found.                          |
| `500`  | Internal server error.                             |
