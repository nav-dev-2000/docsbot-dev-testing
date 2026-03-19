#!/usr/bin/env node
/**
 * Copy Stripe products and their prices from a source account to a destination account.
 *
 * Both accounts must use the same mode (e.g. test→test). Stripe objects are account-scoped;
 * this creates new products/prices on the destination and records source IDs in metadata so
 * re-runs are idempotent.
 *
 * Usage:
 *   STRIPE_COPY_DEST_SECRET_KEY=sk_test_xxx node --env-file=.env.local scripts/stripe-copy-products.js
 *
 * Env:
 *   STRIPE_COPY_SOURCE_SECRET_KEY — optional; defaults to STRIPE_SECRET_KEY
 *   STRIPE_COPY_DEST_SECRET_KEY   — required (unless STRIPE_COPY_DRY_RUN=1)
 *   STRIPE_COPY_DRY_RUN=1         — log actions only
 *   STRIPE_COPY_ACTIVE_ONLY=0     — include archived products (default: 1 = active only)
 *   STRIPE_COPY_MAPPING_OUT=path  — write JSON map of source price id → dest price id
 *
 * npm: npm run stripe:copy-products
 */

const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

const SOURCE_KEY =
  process.env.STRIPE_COPY_SOURCE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const DEST_KEY = process.env.STRIPE_COPY_DEST_SECRET_KEY;
const DRY = ['1', 'true', 'yes'].includes(
  String(process.env.STRIPE_COPY_DRY_RUN || '').toLowerCase(),
);
const ACTIVE_ONLY = !['0', 'false', 'no'].includes(
  String(process.env.STRIPE_COPY_ACTIVE_ONLY ?? '1').toLowerCase(),
);
const MAPPING_OUT = process.env.STRIPE_COPY_MAPPING_OUT || '';

const META_SRC_PRODUCT = 'docsbot_source_product_id';
const META_SRC_PRICE = 'docsbot_source_price_id';

function usageAndExit(msg) {
  if (msg) console.error(msg);
  console.error(`
stripe-copy-products: copy catalog between Stripe accounts.

Set STRIPE_COPY_DEST_SECRET_KEY to the destination secret key.
Source defaults to STRIPE_SECRET_KEY (or STRIPE_COPY_SOURCE_SECRET_KEY).

Example:
  STRIPE_COPY_DEST_SECRET_KEY=sk_test_... node --env-file=.env.local scripts/stripe-copy-products.js
  STRIPE_COPY_DRY_RUN=1 node --env-file=.env.local scripts/stripe-copy-products.js
`);
  process.exit(1);
}

async function paginate(listPromise) {
  const out = [];
  for await (const item of listPromise) {
    out.push(item);
  }
  return out;
}

function mergeMetadata(existing, extra) {
  return { ...(existing && typeof existing === 'object' ? existing : {}), ...extra };
}

function buildPriceCreateParams(destProductId, src) {
  const params = {
    product: destProductId,
    currency: src.currency,
    metadata: mergeMetadata(src.metadata, { [META_SRC_PRICE]: src.id }),
  };

  if (src.nickname) params.nickname = src.nickname;
  if (src.tax_behavior) params.tax_behavior = src.tax_behavior;

  if (src.billing_scheme === 'tiered') {
    params.billing_scheme = 'tiered';
    params.tiers_mode = src.tiers_mode;
    if (Array.isArray(src.tiers)) {
      params.tiers = src.tiers.map((t) => ({
        up_to: t.up_to,
        flat_amount: t.flat_amount ?? undefined,
        flat_amount_decimal: t.flat_amount_decimal ?? undefined,
        unit_amount: t.unit_amount ?? undefined,
        unit_amount_decimal: t.unit_amount_decimal ?? undefined,
      }));
    }
  } else {
    params.billing_scheme = src.billing_scheme || 'per_unit';
    // Stripe rejects sending both unit_amount and unit_amount_decimal on create.
    if (src.unit_amount != null) {
      params.unit_amount = src.unit_amount;
    } else if (src.unit_amount_decimal != null) {
      params.unit_amount_decimal = src.unit_amount_decimal;
    }
  }

  if (src.custom_unit_amount?.enabled) {
    params.custom_unit_amount = {
      enabled: true,
      minimum: src.custom_unit_amount.minimum ?? undefined,
      maximum: src.custom_unit_amount.maximum ?? undefined,
      preset: src.custom_unit_amount.preset ?? undefined,
    };
  }

  if (src.recurring) {
    const rec = {
      interval: src.recurring.interval,
      interval_count: src.recurring.interval_count || 1,
    };
    if (src.recurring.trial_period_days != null)
      rec.trial_period_days = src.recurring.trial_period_days;
    if (src.recurring.usage_type) rec.usage_type = src.recurring.usage_type;
    if (src.recurring.meter) {
      console.warn(
        `  [!] Price ${src.id} uses billing meter "${src.recurring.meter}". Meters are not copied; omitting meter (price may fail to create).`,
      );
    }
    params.recurring = rec;
  }

  if (src.transform_quantity) {
    params.transform_quantity = {
      divide_by: src.transform_quantity.divide_by,
      round: src.transform_quantity.round,
    };
  }

  return params;
}

async function indexDestProducts(stripeDest) {
  const map = new Map();
  const products = await paginate(stripeDest.products.list({ limit: 100 }));
  for (const p of products) {
    const srcId = p.metadata && p.metadata[META_SRC_PRODUCT];
    if (srcId) map.set(srcId, p);
  }
  return map;
}

async function indexDestPricesForProduct(stripeDest, productId) {
  const map = new Map();
  const prices = await paginate(
    stripeDest.prices.list({ product: productId, limit: 100 }),
  );
  for (const pr of prices) {
    const srcId = pr.metadata && pr.metadata[META_SRC_PRICE];
    if (srcId) map.set(srcId, pr);
  }
  return map;
}

async function main() {
  if (!SOURCE_KEY) {
    usageAndExit('Missing source key: set STRIPE_SECRET_KEY or STRIPE_COPY_SOURCE_SECRET_KEY.');
  }
  if (!DEST_KEY && !DRY) {
    usageAndExit('Missing STRIPE_COPY_DEST_SECRET_KEY (or set STRIPE_COPY_DRY_RUN=1).');
  }

  const stripeSource = new Stripe(SOURCE_KEY);
  const stripeDest = DEST_KEY ? new Stripe(DEST_KEY) : null;

  const productListParams = { limit: 100 };
  if (ACTIVE_ONLY) productListParams.active = true;

  const sourceProducts = await paginate(stripeSource.products.list(productListParams));
  console.log(
    `Source: ${sourceProducts.length} product(s)${ACTIVE_ONLY ? ' (active only)' : ''}.`,
  );

  let destBySourceId = new Map();
  if (stripeDest && !DRY) {
    destBySourceId = await indexDestProducts(stripeDest);
    console.log(
      `Destination: ${destBySourceId.size} product(s) already tagged with ${META_SRC_PRODUCT}.`,
    );
  }

  const priceMapping = {};

  for (const srcProduct of sourceProducts) {
    console.log(`\nProduct ${srcProduct.id} — ${srcProduct.name}`);

    let destProduct = destBySourceId.get(srcProduct.id);
    if (!destProduct && !DRY && stripeDest) {
      const createProductParams = {
        name: srcProduct.name,
        active: srcProduct.active,
        metadata: mergeMetadata(srcProduct.metadata, {
          [META_SRC_PRODUCT]: srcProduct.id,
        }),
      };
      if (srcProduct.description) createProductParams.description = srcProduct.description;
      if (Array.isArray(srcProduct.images) && srcProduct.images.length)
        createProductParams.images = srcProduct.images;
      if (srcProduct.unit_label) createProductParams.unit_label = srcProduct.unit_label;
      if (srcProduct.tax_code) createProductParams.tax_code = srcProduct.tax_code;

      destProduct = await stripeDest.products.create(createProductParams);
      destBySourceId.set(srcProduct.id, destProduct);
      console.log(`  Created product ${destProduct.id}`);
    } else if (DRY) {
      console.log(`  [dry-run] would ensure product exists (source ${srcProduct.id})`);
    } else {
      console.log(`  Using existing product ${destProduct.id}`);
    }

    const destProductId = destProduct ? destProduct.id : 'prod_DRY';

    const priceListParams = { product: srcProduct.id, limit: 100 };
    if (ACTIVE_ONLY) priceListParams.active = true;
    const sourcePrices = await paginate(stripeSource.prices.list(priceListParams));

    let destPriceBySource = new Map();
    if (stripeDest && !DRY && destProduct) {
      destPriceBySource = await indexDestPricesForProduct(stripeDest, destProduct.id);
    }

    for (const srcPrice of sourcePrices) {
      const existing = destPriceBySource.get(srcPrice.id);
      if (existing) {
        priceMapping[srcPrice.id] = existing.id;
        console.log(`  Price ${srcPrice.id} → ${existing.id} (already copied)`);
        continue;
      }

      if (DRY) {
        console.log(
          `  [dry-run] would create price for ${srcPrice.id} (${srcPrice.currency}, ${srcPrice.type})`,
        );
        continue;
      }

      let createParams;
      try {
        createParams = buildPriceCreateParams(destProductId, srcPrice);
        const created = await stripeDest.prices.create(createParams);
        destPriceBySource.set(srcPrice.id, created);
        priceMapping[srcPrice.id] = created.id;
        console.log(`  Price ${srcPrice.id} → ${created.id} (created)`);
      } catch (err) {
        console.error(`  [x] Failed to copy price ${srcPrice.id}:`, err.message || err);
        if (createParams && process.env.STRIPE_COPY_DEBUG === '1') {
          console.error(JSON.stringify(createParams, null, 2));
        }
      }
    }
  }

  if (MAPPING_OUT) {
    const outPath = path.resolve(process.cwd(), MAPPING_OUT);
    fs.writeFileSync(outPath, JSON.stringify(priceMapping, null, 2), 'utf8');
    console.log(`\nWrote price id mapping: ${outPath}`);
  }

  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
