import { describe, expect, it } from 'vitest'
import {
  STRIPE_APPS_MANIFEST_PERMISSION_IDS,
  STRIPE_OAUTH_CALLBACK_PATH,
  STRIPE_OAUTH_POSTMESSAGE_TYPE,
  deriveStripeConnectToolScopes,
  getStripeAppsMarketplaceOAuthScopeParam,
} from '@/lib/stripeConnect'

describe('stripeConnect', () => {
  it('exposes stable postMessage type for OAuth popup completion', () => {
    expect(STRIPE_OAUTH_POSTMESSAGE_TYPE).toBe('DOCSBOT_STRIPE_OAUTH')
  })

  it('callback path has no connect segment', () => {
    expect(STRIPE_OAUTH_CALLBACK_PATH).toBe('/api/stripe/oauth/callback')
    expect(STRIPE_OAUTH_CALLBACK_PATH).not.toContain('connect')
  })

  it('manifest permission ids match deriveStripeConnectToolScopes', () => {
    expect(deriveStripeConnectToolScopes()).toEqual(
      STRIPE_APPS_MANIFEST_PERMISSION_IDS,
    )
    expect(STRIPE_APPS_MANIFEST_PERMISSION_IDS).toContain('invoice_read')
    expect(STRIPE_APPS_MANIFEST_PERMISSION_IDS).toContain('charge_write')
  })

  it('marketplace scope param is space-separated manifest permissions', () => {
    const param = getStripeAppsMarketplaceOAuthScopeParam()
    expect(param.split(/\s+/)).toEqual(STRIPE_APPS_MANIFEST_PERMISSION_IDS)
  })
})
