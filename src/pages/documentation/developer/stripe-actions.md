---
title: Stripe Actions
description: Use Stripe billing tools in the chat widget or Chat Agent API—invoices, subscriptions, billing portal, refunds, and cancellations—with secure customer scoping via signed metadata.
---

Stripe Actions let your bot perform customer-scoped billing support: look up recent invoices and subscriptions, send billing portal links, refund the latest payment, or cancel a subscription. This page explains how it works and how to pass the Stripe customer ID securely. {% .lead %}

---

## Overview

When you enable **Stripe Tools** in the dashboard (Widget → Actions), the bot can call Stripe on behalf of your end users. To do that safely, the bot must know **which Stripe customer** the current user is. You pass that as **signed private metadata** (`priv_stripe_customer_id`) from your server. Private metadata is never stored in logs or sent to the LLM—only to internal tools—and signing prevents attackers from forging another customer’s ID.

**You need to:**

1. **Configure Stripe in DocsBot** – In Widget → Actions, enable Stripe tools and click **Connect with Stripe** to complete OAuth. Install the [DocsBot Stripe app](https://marketplace.stripe.com/apps/install/link/ai.docsbot.billing-support) from the Stripe App Marketplace if prompted. OAuth tokens are stored on your bot as flat fields under `tools.stripe` in Firestore (`accessToken`, `refreshToken`, `stripeUserId` for display); they are not returned to the browser.
2. **Pass the Stripe customer ID in signed metadata** – From your backend, issue a JWT whose payload includes `metadata.priv_stripe_customer_id`, and send that JWT with every widget or API request (see below).

---

## Subtools and behavior

In Widget → Actions you can enable or disable:

- **Recent invoices + subscriptions** – Bot can look up the customer’s recent invoices and subscription status, and provide links to download or pay overdue invoices/receipts.
- **Billing portal** – Bot can send a link to Stripe’s hosted billing portal for the customer.
- **Refund latest payment** – Bot can refund the customer’s most recent payment (optional rules in the dashboard).
- **Cancel subscription** – Bot can cancel the customer’s active subscription (optional cancellation feedback).

The bot calls Stripe using the OAuth **access token** (and refresh token) stored for your bot; access is renewed on DocsBot’s servers as needed. Merchants do **not** configure Stripe secret or restricted API keys on the bot—**Connect with Stripe** only. All actions are scoped to the customer ID you pass in signed metadata.

---

## Refund guardrails

When **Refund latest payment** is enabled, you can configure a **refund guardrails prompt** in Widget → Actions. This prompt defines your business rules for when the bot may issue a refund. To prevent prompt injection—where a user could try to override your rules via the chat—refund approval is handled by a **separate, out-of-band LLM call**. That call receives only your rules (the guardrails prompt) and full, structured metadata about the customer and recent payment and subscription history. The main chat model never sees or executes your guardrails text as instruction, so users cannot inject conflicting instructions.

**What the approval call receives**

- Your **refund guardrails prompt** (the rules you configure in the dashboard).
- **Customer context**: Details below -

### Context Scope

- **Invoices:** up to **50** (newest first), all appear under `invoices`.
- **Subscriptions:** up to **20**.
- **Charges:** Stripe returns up to **50**; **`recent_payments` only includes the first 15** (newest). `summary.payment_count` is how many charges were returned (≤ 50), not how many rows appear in `recent_payments`.
- **`latest_payment`** is always the **single** newest charge (first row of the charge list).
- **`summary.total_paid`** is set only when every included “paid-ish” invoice shares one **currency**; otherwise it is `null`.

### Example structured context (illustrative)

```json
{
  "as_of": "2025-03-20 14:32:01",
  "customer": {
    "email": "alex@example.com",
    "name": "Alex Rivera",
    "customer_since": "2024-06-10 09:15:00"
  },
  "summary": {
    "subscription_count": 1,
    "recent_invoice_count": 12,
    "recent_payment_count": 8,
    "total_paid": "708.00",
    "subscription_start_date": "2024-06-10 09:15:00"
  },
  "subscriptions": [
    {
      "cancel_at_period_end": false,
      "period_end_date": "2025-04-10 09:15:00",
      "stripe_subscription_status": "active",
      "assistant_subscription_state": "active_will_renew",
      "assistant_subscription_note": "Active and will renew at the next billing period unless canceled.",
      "items": [
        {
          "plan_name": "Pro",
          "quantity": 1
        }
      ]
    }
  ],
  "invoices": [
    {
      "status": "paid",
      "amount_due": "0.00",
      "amount_paid": "59.00",
      "currency": "usd",
      "date": "2025-03-10 09:16:02",
      "period_start": "2025-03-10 09:15:00",
      "period_end": "2025-04-10 09:15:00"
    },
    {
      "status": "paid",
      "amount_due": "0.00",
      "amount_paid": "59.00",
      "currency": "usd",
      "date": "2025-02-10 09:16:11",
      "period_start": "2025-02-10 09:15:00",
      "period_end": "2025-03-10 09:15:00"
    }
  ],
  "recent_payments": [
    {
      "amount": "59.00",
      "currency": "usd",
      "date": "2025-03-10 09:16:05",
      "status": "succeeded",
      "amount_refunded": "0.00",
      "refund_status": "none",
      "refunded": false,
      "disputed": false
    },
    {
      "amount": "59.00",
      "currency": "usd",
      "date": "2025-02-10 09:16:14",
      "status": "succeeded",
      "amount_refunded": "15.00",
      "refund_status": "partial",
      "refunded": false,
      "disputed": false
    },
    {
      "amount": "49.00",
      "currency": "usd",
      "date": "2024-12-05 18:22:00",
      "status": "succeeded",
      "amount_refunded": "49.00",
      "refund_status": "full",
      "refunded": true,
      "disputed": false
    }
  ],
  "latest_payment": {
    "amount": "59.00",
    "currency": "usd",
    "date": "2025-03-10 09:16:05",
    "status": "succeeded",
    "description": "Subscription update",
    "amount_refunded": "0.00",
    "refund_status": "none",
    "refunded": false,
    "disputed": false,
    "has_invoice": true
  }
}
```

### Fields you might write rules against

| Area | Useful for |
|------|------------|
| `latest_payment.*` | “Refund only if …” on the **most recent** charge (`refund_status`, `amount_refunded`, `has_invoice`, `description`). |
| `recent_payments[]` | Prior payment / **partial or full** refunds on recent charges (only **15** rows). |
| `invoices[]` | Timing, amounts, billing periods (no invoice `billing_reason` in this payload today). |
| `subscriptions[]` + `summary.subscription_*` | Whether they’re subscribed, cancel-at-period-end, period end, human-readable plan names. |
| `customer.*` / `summary.total_paid` | Tenure and rough lifetime paid (when `total_paid` is non-null). |

If you want this as a `.md` file in the repo, say where it should live (e.g. `docs/`) and we can add it.

**What the approval call returns**

The subtool returns a **yes/no approval** and **reason text** to the main model. The model uses this as context to reply to the user. Your guardrails prompt can shape both the decision and the wording of the reason (e.g. to cite policy, link to terms, or suggest next steps).

**Example — approved:**

- `approved: true`
- `reason: $20 payment for invoice #12345 has been refunded.`

**Example — denied:**

- `approved: false`
- `reason: It's been more than 14 days since your payment. According to our [Terms of Service](https://example.com/terms) refunds are no longer allowed.`

If approved, the bot proceeds with the refund and can confirm using the reason. If denied, the bot replies to the user using the reason so the response stays consistent with your policy and any links you specified in the guardrails.

**Example guardrails prompts**

- **Cap by amount and recency**  
  *Only approve refunds for the most recent payment if the amount is under $50 and the payment was made within the last 14 days. Otherwise deny and suggest they contact support for larger or older refunds.*

- **One-time payments only**  
  *Approve refunds only when the latest charge is a one-time payment (non-invoice charge), not a subscription renewal (invoice). For subscription renewals, deny and direct the customer to the billing portal or support to cancel or change their subscription.*

- **Strict: escalate everything**  
  *Do not approve any refund automatically. Always deny, trigger the human_escalation tool and tell the user that refund requests are handled by our support team.*
  
(if this is the case don't enable refund tool, just put this in your agent instructions)

- **Refund only canceled subscription**  
  *Approve refunds for the most recent payment only if the customer's subscription is canceled or scheduled to be canceled. Deny if the subscription is currently active and scheduled to renew with explanation.*

- **Single refund per customer**  
  *Approve only if this is the first refund for this customer (no other refunds in the provided payment history). If the customer has had a full refund before, deny and escalate to support.*

- **Personal plan only; escalate higher tiers**  
  *Approve refunds for the most recent payment only when the customer’s active subscription is on the **Personal** plan (use `subscriptions[].items[].plan_name` in the structured context). If they are on **Business**, **Pro**, **Enterprise**, or any other plan, deny the refund and instruct the agent to call the **human_escalation** tool so a human handles the request.*

Use the guardrails prompt that matches your policy. The approval call has no access to the conversation text, so user messages cannot override these rules.

---

## Why the customer ID must be private and signed

- **Private (`priv_`)**  
  Keys prefixed with `priv_` are not saved in chat logs or question history and are not sent to the LLM. They are only available to internal tools (e.g. Stripe tools). That way you can pass `priv_stripe_customer_id` without exposing it in logs or model context.

- **Signed (JWT from your server)**  
  If the customer ID were set only in client-side code, an attacker could change it to another user’s Stripe customer ID and trigger actions (refunds, portal links, etc.) for that customer. By signing the payload on your server with a secret, only your backend can issue valid metadata; the widget and API accept it only when the JWT signature is valid. Unsigned or tampered private metadata is ignored.

---

## JWT payload shape

The JWT must be signed with **HS256** using your bot’s **signature key** (from the bot’s Widget embed page in the dashboard). **We recommend** JWT for new integrations; HMAC and user API key Bearer auth remain supported—see [Authentication — Private bots](/documentation/developer/authentication#private-bots). The payload must include:

| Claim / path        | Required | Description |
| ------------------- | -------- | ----------- |
| **exp**             | Yes      | Expiration time (Unix seconds). |
| **iat**             | Yes      | Issued-at time (Unix seconds). |
| **metadata**        | Yes      | Object that can contain `priv_*` keys. |
| **metadata.priv_stripe_customer_id** | For Stripe | Stripe Customer ID (e.g. `cus_xxx`). |
| **team_id**         | Yes      | Your DocsBot team ID. |
| **bot_id**          | Yes      | Your DocsBot bot ID. |

**Example payload (before signing):**

```json
{
  "exp": 1735689600,
  "iat": 1735686000,
  "team_id": "YOUR_TEAM_ID",
  "bot_id": "YOUR_BOT_ID",
  "metadata": {
    "priv_stripe_customer_id": "cus_ABC123xyz"
  }
}
```

Use the **same signature key** as for private bot embedding (from the bot’s Widget embed page). The widget and Chat Agent API validate the JWT and, if valid, allow tools to read `metadata.priv_stripe_customer_id`.

---

## Widget: passing the signed JWT

For the embeddable widget, you must send the signed JWT in the **Authorization** header with each request. In practice that means:

1. **Generate the JWT on your server** when rendering the page or via a small endpoint (after the user is authenticated and you know their Stripe customer ID).
2. **Pass the JWT into the widget** using the same mechanism you use for [private bot embedding](/documentation/developer/embeddable-chat-widget#embedding-private-bots) (e.g. server-rendered embed code or a token endpoint). The widget sends it as the Bearer token (`Authorization: Bearer <jwt>`) on requests to the DocsBot API.

Do **not** put `priv_stripe_customer_id` (or any private metadata) in client-side `identify` or `metadata`—it would be unsigned and ignored. Use only the signed JWT from your server. **Still pass `identify` and public metadata in the embed** so they are available to the widget’s support callback, lead capture, and other client-side features.

For the full picture of trusted private metadata and Bearer JWT in the widget, see [Trusted private metadata with Bearer JWT](/documentation/developer/embeddable-chat-widget#trusted-private-metadata-with-bearer-jwt).

---

## Chat Agent API: passing the signed JWT

When calling the [Chat Agent API](/documentation/developer/chat-agent), send the same JWT in the **Authorization** header:

```http
Authorization: Bearer <jwt>
```

The JWT payload must include `team_id`, `bot_id`, and `metadata` with `priv_stripe_customer_id`. The API will reject or ignore unsigned or invalid private metadata. For more on the Chat Agent and JWT claims, see [Trusted private metadata with JWT](/documentation/developer/chat-agent#trusted-private-metadata-with-jwt) in the Chat Agent doc.

---

## Example: generating the JWT (Node.js)

Use your bot’s **signature key** (from the Widget embed page) as the HMAC secret. Example with the `jose` library:

```js
import * as jose from 'jose'

const signatureKey = process.env.DOCSBOT_SIGNATURE_KEY // from Widget embed page
const stripeCustomerId = 'cus_ABC123xyz' // from your auth/database
const teamId = 'YOUR_TEAM_ID'
const botId = 'YOUR_BOT_ID'

const secret = new TextEncoder().encode(signatureKey)
const exp = Math.floor(Date.now() / 1000) + 60 * 60 // 1 hour
const iat = Math.floor(Date.now() / 1000)

const jwt = await new jose.SignJWT({
  team_id: teamId,
  bot_id: botId,
  metadata: {
    priv_stripe_customer_id: stripeCustomerId,
  },
})
  .setProtectedHeader({ alg: 'HS256' })
  .setExpirationTime(exp)
  .setIssuedAt(iat)
  .sign(secret)

// Send `jwt` to the client for the widget (e.g. in your HTML or a token endpoint)
// or use as Authorization: Bearer <jwt> when calling the Chat Agent API
console.log(jwt)
```

**Example with `jsonwebtoken`:**

```js
const jwt = require('jsonwebtoken')

const signatureKey = process.env.DOCSBOT_SIGNATURE_KEY
const payload = {
  exp: Math.floor(Date.now() / 1000) + 3600,
  iat: Math.floor(Date.now() / 1000),
  team_id: 'YOUR_TEAM_ID',
  bot_id: 'YOUR_BOT_ID',
  metadata: {
    priv_stripe_customer_id: 'cus_ABC123xyz',
  },
}

const token = jwt.sign(payload, signatureKey, { algorithm: 'HS256' })
// Use token as Authorization: Bearer <token>
```

---

## Summary

| Step | Action |
| ---- | ------ |
| 1 | Enable Stripe Tools in Widget → Actions and use **Connect with Stripe** (OAuth). |
| 2 | On your server, after identifying the user, get their Stripe customer ID (e.g. from your database or Stripe). |
| 3 | Sign a JWT with your bot’s signature key; include `exp`, `iat`, `team_id`, `bot_id`, and `metadata.priv_stripe_customer_id`. |
| 4 | Send that JWT as `Authorization: Bearer <jwt>` with widget requests or Chat Agent API requests. |

Private metadata is never logged or sent to the LLM; signing ensures only your backend can set the customer ID so attackers cannot affect other customers’ accounts.
