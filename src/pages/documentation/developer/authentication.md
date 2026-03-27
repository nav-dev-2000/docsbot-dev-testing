---
title: Authentication
description: Chat APIs on api.docsbot.ai (API key, JWT, HMAC) and Admin APIs on docsbot.ai/api (API key only).
---

Authentication depends on which host you call: **Chat APIs** (`https://api.docsbot.ai`) vs **Admin APIs** (`https://docsbot.ai/api/`). {% .lead %}

---

## Teams and Permissions

### What is a team?

A team is the basic root of a DocsBot account. Plans and limits are tied to a team, which has a collection of bots and their sources. Multiple user accounts can be assigned to a team. Each team has a unique ID and a name.

### Key permissions

API keys are unique to each user account and their permissions mirror that of your user account. For example, if your user account has access to multiple teams, your API key will also have access to all of those teams.

## Getting your API key

To use our APIs, you need to get an API key. You can get your API key from the [API Keys](https://docsbot.ai/app/api) section of your dashboard. This is the key associated with your user account and will be the same no matter which team dashboard you are in. You can create or change your API key at any time by clicking the "Change" button. When you change your key, all previous API requests will stop working until you configure them to use the new key.

{% callout type="warning" title="Don't forget to copy!" %}
API keys are only shown once as we store them safely hashed, so make sure you copy it to a safe place. If you lose or forget your key you will have to create a new one.
{% /callout %}

## Chat APIs (`https://api.docsbot.ai`)

Chat Agent, conversations, questions, and other **bot** endpoints on this host—including traffic from the **embeddable chat widget**—use:

```http
Authorization: Bearer <token>
```

`<token>` may be:

- Your **user API key** from [Getting your API key](#getting-your-api-key) (server-side / trusted environments).
- For **private** (or optionally **public**) bots, a **signed JWT** or **legacy HMAC** string instead of (or alongside) flows that require embed signing—see [Private bots](#private-bots).

### Private bots

Bots with **private** visibility require a valid Bearer token. **We recommend** a **signed JWT**; **legacy HMAC** and **user API key** Bearer auth are also supported.

1. **Signed JWT (recommended)** — Sign with **HS256** using your bot’s **signature key** from the [Bots](https://docsbot.ai/app/bots) widget embed page. The JWT payload **must** include **`team_id` and `bot_id`** for that bot, plus **`exp` and `iat`** (see below). You may include **`metadata`** for trusted keys such as `priv_*` (e.g. Stripe customer id); see [Chat Agent API — Trusted private metadata with JWT](/documentation/developer/chat-agent#trusted-private-metadata-with-jwt) and [Stripe Actions](/documentation/developer/stripe-actions).

2. **HMAC token** — Compute HMAC-SHA256 of `botId:expires` with the same signature key, format as **`hex:expires`**, and send that string as the Bearer token. While still supported; JWT is preferred for signing metadata.

3. **User API key** — The same dashboard key from [Getting your API key](#getting-your-api-key). Supported for private bots when the call runs from a **trusted server**. **Never** expose API keys in public browser code; for embedded widgets on the public web, use a JWT or HMAC `signature` instead.

**Public bots** can be called without a token; sending a valid token can still unlock higher limits and authenticated-only options on some endpoints.

#### JWT claims: `exp` and `iat`

These are standard **registered JWT claims**. Values are **Unix timestamps in seconds** (count from 1970-01-01 UTC), not milliseconds.

- **`iat`** (_issued at_) — When the token was minted; typically set to the current time. Lets validators reason about freshness and clock skew.
- **`exp`** (_expiration time_) — The last second the token is considered valid; after this the API rejects it. Use a **short TTL** (for example one hour) so a leaked token stops working quickly. We will show a user friendly message to refresh the page if a widget tries to use an expired token.

#### Example: signed JWT (HS256)

Use your bot’s **signature key** (widget embed page) as the HMAC secret. Install a JWT library for your language: **`jose`** or **`jsonwebtoken`** (Node), **`firebase/php-jwt`** (PHP), **`PyJWT`** (Python).

Payload must include `team_id`, `bot_id`, `iat`, `exp`, and optionally `metadata`.

**Node.js** (`jose`):

```js
import * as jose from 'jose'

const signatureKey = process.env.DOCSBOT_SIGNATURE_KEY // from Widget embed page
const teamId = 'YOUR_TEAM_ID'
const botId = 'YOUR_BOT_ID'

const now = Math.floor(Date.now() / 1000)
const exp = now + 60 * 60 // 1 hour
const secret = new TextEncoder().encode(signatureKey)

const jwt = await new jose.SignJWT({
  team_id: teamId,
  bot_id: botId,
  metadata: {}, // optional: e.g. priv_* for Stripe — see Stripe Actions doc
})
  .setProtectedHeader({ alg: 'HS256' })
  .setIssuedAt(now)
  .setExpirationTime(exp)
  .sign(secret)

// Authorization: Bearer <jwt>
```

**Node.js** (`jsonwebtoken`):

```js
const jwt = require('jsonwebtoken')

const signatureKey = process.env.DOCSBOT_SIGNATURE_KEY
const now = Math.floor(Date.now() / 1000)
const payload = {
  iat: now,
  exp: now + 60 * 60,
  team_id: 'YOUR_TEAM_ID',
  bot_id: 'YOUR_BOT_ID',
  metadata: {},
}

const token = jwt.sign(payload, signatureKey, { algorithm: 'HS256' })
// Authorization: Bearer <token>
```

**PHP** (`firebase/php-jwt`):

```php
<?php

use Firebase\JWT\JWT;

$signatureKey = 'SIGNATURE_KEY_FROM_BOT_WIDGET_EMBED_PAGE';
$now = time();

$payload = [
    'iat' => $now,
    'exp' => $now + 3600,
    'team_id' => 'YOUR_TEAM_ID',
    'bot_id' => 'YOUR_BOT_ID',
    'metadata' => new stdClass(), // or [ 'priv_stripe_customer_id' => 'cus_...' ]
];

$jwt = JWT::encode($payload, $signatureKey, 'HS256');
// Authorization: Bearer <jwt>
```

**Python** (`PyJWT`):

```python
import time
import jwt

signature_key = 'SIGNATURE_KEY_FROM_BOT_WIDGET_EMBED_PAGE'
now = int(time.time())
payload = {
    'iat': now,
    'exp': now + 3600,
    'team_id': 'YOUR_TEAM_ID',
    'bot_id': 'YOUR_BOT_ID',
    'metadata': {},
}
token = jwt.encode(payload, signature_key, algorithm='HS256')
```

#### Example: legacy HMAC token

Same **signature key** as the JWT. Message to MAC is the string `botId:expires` (same `expires` Unix seconds you append after the colon in the token).

**Node.js:**

```js
import crypto from 'crypto'

const botId = 'YOUR_BOT_ID'
const embedKey = 'SIGNATURE_KEY_FROM_BOT_WIDGET_EMBED_PAGE'

const hmac = crypto.createHmac('sha256', embedKey)
const expires = Math.floor(Date.now() / 1000) + 60 * 60 * 1 // expires in 1 hour
hmac.update(`${botId}:${expires}`)
const signature = `${hmac.digest('hex')}:${expires}`
// HTTP: Authorization: Bearer <signature>
// Widget: pass `signature` into DocsBotAI.init (see embeddable widget docs)
```

**PHP:**

```php
$botId = 'YOUR_BOT_ID';
$embedKey = 'SIGNATURE_KEY_FROM_BOT_WIDGET_EMBED_PAGE';

$expires = time() + 60 * 60 * 1;
$signature = hash_hmac('sha256', $botId . ':' . $expires, $embedKey) . ':' . $expires;
```

**Python:**

```python
import hashlib
import hmac
import time

bot_id = 'YOUR_BOT_ID'
embed_key = 'SIGNATURE_KEY_FROM_BOT_WIDGET_EMBED_PAGE'

expires = int(time.time()) + 60 * 60 * 1
signature = hmac.new(embed_key.encode(), f'{bot_id}:{expires}'.encode(), hashlib.sha256).hexdigest() + f':{expires}'
```

> **Note:** In HMAC snippets, `bot_id` is the bot’s ID (the second UUID in the widget `id` string, e.g. for `teamPart/botPart` use `botPart`).

**Embeddable widget (JWT/HMAC)** — after generating the JWT/HMAC server-side, pass the JWT or `hex:expires` string as `signature` in the embed code.

```js
DocsBotAI.init({
  id: 'YOUR_ID_HERE',
  signature: 'f95b5d6431fe76854fe14384123225cff9501ed6cd08dff12c1897a93badabbc:1693821134',
})
```

Full widget context: [Embedding private bots](/documentation/developer/embeddable-chat-widget#embedding-private-bots).

### Websocket API endpoints (Legacy Streaming)

For the streaming APIs, websockets do not support Authorization headers. You should send the API key as an `auth` parameter with the questions. For example:

```javascript
// Send message to server when connection is established
ws.onopen = function (event) {
  const req = { question: 'What is WordPress?', full_source: false, history: [], auth: '1234567890' }
  ws.send(JSON.stringify(req))
}
```

{% callout type="warning" title="Do not expose your API key!" %}
API keys are meant to be used server-side, and should never be exposed to the public in JavaScript. If you are using a client-side library, make sure you are not exposing your API key to the public by proxying requests through your own server.
{% /callout %}

## Admin APIs (`https://docsbot.ai/api/`)

Dashboard **admin** routes—teams, bots, sources, members, leads, and everything under `/api/` on **docsbot.ai**—accept **only** your [user API key](#getting-your-api-key) in the header. **JWT and HMAC are not supported.**

```http
Authorization: Bearer <your-api-key>
```

### Examples

GET `/api/teams/` with your API key:

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
```

#### JavaScript Fetch

```javascript
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

#### PHP cURL

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://docsbot.ai/api/teams/',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 1,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;
```

#### Python

```python
import requests

url = "https://docsbot.ai/api/teams/"

payload={}
headers = {
  'Authorization': 'Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
```
