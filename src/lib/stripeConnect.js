/**
 * Public callback path (no "connect" segment). Keep in sync with
 * tools/stripe/stripe-app.json `allowed_redirect_uris`.
 */
export const STRIPE_OAUTH_CALLBACK_PATH = '/api/stripe/oauth/callback'

/** `postMessage` type when OAuth completes in a popup (must match callback page + dashboard listener). */
export const STRIPE_OAUTH_POSTMESSAGE_TYPE = 'DOCSBOT_STRIPE_OAUTH'

/** Legacy OAuth metadata we no longer persist; stripped on authorize, callback, and bot save. */
export const OBSOLETE_STRIPE_TOOL_METADATA_KEYS = [
  'stripeAccountDisplayName',
  'scope',
  'tokenType',
  'livemode',
  'oauthScopes',
  'oauthScope',
  'oauthUpdatedBy',
  'oauthUpdatedAt',
  'connectedAt',
  'updatedAt',
]

/**
 * App manifest permission IDs — must match tools/stripe/stripe-app.json `permissions[].permission`.
 * Used for marketplace authorize `scope` (space-separated) and tests.
 */
export const STRIPE_APPS_MANIFEST_PERMISSION_IDS = [
  'invoice_read',
  'customer_read',
  'subscription_read',
  'product_read',
  'subscription_write',
  'customer_portal_write',
  'charge_write',
]

/** Space-separated scope string for https://marketplace.stripe.com/oauth/v2/authorize */
export const getStripeAppsMarketplaceOAuthScopeParam = () =>
  STRIPE_APPS_MANIFEST_PERMISSION_IDS.join(' ')

export const deriveStripeConnectToolScopes = () => [
  ...STRIPE_APPS_MANIFEST_PERMISSION_IDS,
]
