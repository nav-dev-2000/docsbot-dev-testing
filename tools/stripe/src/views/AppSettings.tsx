import React from 'react';
import { Box, ContextView, Inline, Link } from '@stripe/ui-extension-sdk/ui';

/** 1-color SVG (doc icon) for branding. Contrasts with brandColor. */
const BRAND_ICON_SVG =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="currentColor" d="M22 4H10a2 2 0 0 0-2 2v20a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 18H10V6h12z"/></svg>'
  );

/**
 * App settings view for DocsBot (OAuth). Merchants install the app, then
 * complete authorization from the DocsBot dashboard for each bot that should
 * use Stripe-backed support actions.
 */
const AppSettings = () => {
  return (
    <ContextView
      title="DocsBot Support Actions"
      description="Connect Stripe to DocsBot for billing support"
      brandColor="#1292EE"
      brandIcon={BRAND_ICON_SVG}
    >
      <Box css={{ stack: 'y', gap: 'medium' }}>
        <Box css={{ font: 'body' }}>
          This app lets DocsBot run customer-scoped billing support on your
          behalf: invoices, subscriptions, billing portal sessions, refunds, and
          cancellations. OAuth permissions are limited to what those actions
          need.
        </Box>
        <Box css={{ font: 'body' }}>To connect:</Box>
        <Box css={{ font: 'body' }}>
          1. In{' '}
          <Link href="https://docsbot.ai/app/bots" external target="_blank">
            docsbot.ai
          </Link>
          , open the bot you want to connect.
        </Box>
        <Box css={{ font: 'body' }}>
          2. In the bot editor, open the{' '}
          <Inline css={{ font: 'body', fontWeight: 'bold' }}>Actions</Inline>{' '}
          section, enable Stripe tools, and click{' '}
          <Inline css={{ font: 'body', fontWeight: 'bold' }}>
            Connect with Stripe
          </Inline>
          . Approve access when prompted.
        </Box>
        <Box css={{ font: 'caption', color: 'secondary', marginTop: 'large' }}>
          Access is granted through OAuth and can
          be revoked from your Stripe Dashboard or by disconnecting in DocsBot.
        </Box>
      </Box>
    </ContextView>
  );
};

export default AppSettings;
