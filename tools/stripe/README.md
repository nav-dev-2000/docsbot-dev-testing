# DocsBot (Stripe OAuth app)

Public Stripe app that grants OAuth access for **Widget → Actions** (invoices, subscriptions, products on line items, billing portal, refunds). Merchants connect from the DocsBot dashboard; credentials are stored as OAuth tokens on `tools.stripe` in Firestore (not restricted API keys).

## Setup (for users)

1. **Install the DocsBot app** in Stripe (Dashboard → Settings → Apps), if prompted during connect.

2. **In DocsBot:** Open [docsbot.ai/app/bots](https://docsbot.ai/app/bots), choose your bot → **Widget** → **Actions**, enable Stripe tools, then click **Connect with Stripe** and approve access in Stripe.

## App manifest

- **Manifest:** `tools/stripe/stripe-app.json`
- **App id:** `ai.docsbot.billing-support` (after upload, this must match the Dashboard).
- **Upload:** `cd tools/stripe && stripe apps upload`
- **References:** [Stripe Apps OAuth](https://docs.stripe.com/stripe-apps), [App manifest](https://docs.stripe.com/stripe-apps/reference/app-manifest)

`allowed_redirect_uris` must include your production callback:

`{HOST_URL}/api/stripe/oauth/callback`

Add staging or tunnel URLs to the manifest before upload if needed. For local dev, use a [manifest that `extends` the base file](https://docs.stripe.com/stripe-apps/reference/app-manifest) with your tunnel URL.

The dashboard starts OAuth at `POST /api/teams/{teamId}/bots/{botId}/stripe/oauth/authorize` with JSON body `{ "popup": true }` to open Stripe in a popup. The callback serves a small HTML page that `postMessage`s to `window.opener` (type `DOCSBOT_STRIPE_OAUTH`, same origin) so the widget Actions tab can refresh bot state without a full-page redirect. Omit `popup` or use `{ "popup": false }` for a redirect-only flow. The authorize URL includes `scope` set to the same permission IDs as `tools/stripe/stripe-app.json` (space-separated). Final access is still governed by the uploaded manifest.

## Environment (site)

Configure on the Next.js app (see `.env.example`):

- `HOST_URL` — must match a listed `allowed_redirect_uris` (no trailing slash).
- `STRIPE_APP_CLIENT_ID` — OAuth client id from the Stripe App (Dashboard → Apps → your app).
- `STRIPE_APP_SECRET_KEY` — **Recommended.** Standard secret key (`sk_test_…` or `sk_live_…`) from the **same Stripe account** that owns this Stripe App, and the **same mode** as the OAuth link you use (External test / test install link → `sk_test_`; live / published install link → `sk_live_`). Used for the authorization-code token exchange. If unset, the callback falls back to `STRIPE_SECRET_KEY`, which often causes `invalid_grant` / “Authorization code provided does not belong to you” when that key is from a different account or mode.
- `STRIPE_SECRET_KEY` — platform secret key (DocsBot billing, Checkout, webhooks, `src/utils/stripe.js`). Optional fallback for the **OAuth code exchange** in the callback if `STRIPE_APP_SECRET_KEY` is unset. Per-bot Stripe Actions do not use merchant secret keys—only OAuth tokens stored on `tools.stripe`.

### `invalid_grant` / “Authorization code provided does not belong to you”

This almost always **not** caused by editing `docsbot.ai` → `localhost` in the browser **as long as** `HOST_URL` in the server that runs the callback is the **same** as the `redirect_uri` sent to Stripe in the authorize step (e.g. both `https://docsbot.ai`).

Typical causes:

1. **Test vs live** — Test-mode OAuth (`ca_…` from External test / test install URL) must be exchanged with a **`sk_test_`** secret from the app developer account. Live marketplace links need **`sk_live_`**.
2. **Wrong secret** — The `-u sk_…:` value for `POST /v1/oauth/token` must belong to the Stripe account that **owns** the Stripe App behind `STRIPE_APP_CLIENT_ID`. Set `STRIPE_APP_SECRET_KEY` explicitly to that account’s secret key.
3. **Code already used** — The `code` is one-time. If `https://docsbot.ai/api/stripe/oauth/callback` handled the request first (even a failed attempt that reached Stripe), reusing the same URL on localhost will fail. Start a **new** connect from the dashboard.

For purely local OAuth, use ngrok (or similar), set `HOST_URL` to that HTTPS URL, add it to `allowed_redirect_uris` in the app manifest, upload, and open the app from that same origin—avoid hand-editing the callback host unless you understand the `redirect_uri` / `HOST_URL` match.

## Upload (required for app settings to load)

```bash
cd tools/stripe
stripe apps upload
```

If the settings view shows **"Loading of extension bundle failed"**:

1. `stripe plugin upgrade apps`
2. Run `stripe apps start` once to build `.build/`, then `stripe apps upload` again.

## Local preview

```bash
cd tools/stripe
stripe apps start
```

Then open the settings preview in the Stripe Dashboard.
