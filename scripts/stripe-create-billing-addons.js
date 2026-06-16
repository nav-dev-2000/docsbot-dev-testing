#!/usr/bin/env node

const STRIPE_API_BASE = 'https://api.stripe.com/v1'
const STRIPE_API_VERSION = '2026-02-25.clover'

const secretKey =
  process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY || ''

const ADD_ONS = [
  {
    key: 'aiCredits',
    productName: 'Extra AI Credits',
    description: '5,000 extra AI credits per month',
    unit: 5000,
    prices: {
      monthly: {
        interval: 'month',
        unitAmount: 4900,
        currencyOptions: {
          jpy: 8100,
          aud: 7200,
          eur: 4400,
          gbp: 3800,
        },
      },
      annually: {
        interval: 'year',
        unitAmount: 58800,
        currencyOptions: {
          jpy: 97200,
          aud: 86400,
          eur: 52800,
          gbp: 45600,
        },
      },
    },
  },
  {
    key: 'bots',
    productName: 'Extra Bots',
    description: 'Additional DocsBot',
    unit: 1,
    prices: {
      monthly: {
        interval: 'month',
        unitAmount: 1900,
        currencyOptions: {
          jpy: 3200,
          aud: 2800,
          eur: 1700,
          gbp: 1500,
        },
      },
      annually: {
        interval: 'year',
        unitAmount: 22800,
        currencyOptions: {
          jpy: 38400,
          aud: 33600,
          eur: 20400,
          gbp: 18000,
        },
      },
    },
  },
  {
    key: 'sourcePages',
    productName: 'Extra Source Pages',
    description: '10,000 extra source pages',
    unit: 10000,
    prices: {
      monthly: {
        interval: 'month',
        unitAmount: 2900,
        currencyOptions: {
          jpy: 4800,
          aud: 4300,
          eur: 2600,
          gbp: 2300,
        },
      },
      annually: {
        interval: 'year',
        unitAmount: 34800,
        currencyOptions: {
          jpy: 57600,
          aud: 51600,
          eur: 31200,
          gbp: 27600,
        },
      },
    },
  },
  {
    key: 'teamMembers',
    productName: 'Extra Team Users',
    description: 'Additional team user seat',
    unit: 1,
    prices: {
      monthly: {
        interval: 'month',
        unitAmount: 1900,
        currencyOptions: {
          jpy: 3200,
          aud: 2800,
          eur: 1700,
          gbp: 1500,
        },
      },
      annually: {
        interval: 'year',
        unitAmount: 22800,
        currencyOptions: {
          jpy: 38400,
          aud: 33600,
          eur: 20400,
          gbp: 18000,
        },
      },
    },
  },
]

const parseConfiguredAddOns = () => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_STRIPE_ADDONS || '{}')
  } catch {
    return {}
  }
}

const configuredAddOns = parseConfiguredAddOns()

const stripeRequest = async (method, path, params = null) => {
  const query =
    method === 'GET' && params
      ? `?${new URLSearchParams(params).toString()}`
      : ''
  const body = method !== 'GET' && params
    ? new URLSearchParams(params).toString()
    : undefined

  const response = await fetch(`${STRIPE_API_BASE}${path}${query}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Stripe-Version': STRIPE_API_VERSION,
    },
    body,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(
      `Stripe ${method} ${path} failed: ${data?.error?.message || response.statusText}`,
    )
  }
  return data
}

const getConfiguredPriceId = (addOnKey, intervalKey) => {
  const prices = configuredAddOns?.[addOnKey]?.prices
  if (typeof prices === 'string') return intervalKey === 'monthly' ? prices : null
  if (typeof prices?.current === 'string') {
    return intervalKey === 'monthly' ? prices.current : null
  }
  return prices?.current?.[intervalKey] || prices?.[intervalKey] || null
}

const createProduct = (addOn) =>
  stripeRequest('POST', '/products', {
    name: addOn.productName,
    description: addOn.description,
    'metadata[docsbotAddOn]': addOn.key,
    'metadata[unit]': String(addOn.unit),
  })

const createPrice = (addOn, productId, intervalKey) => {
  const priceConfig = addOn.prices[intervalKey]
  const params = {
    product: productId,
    currency: 'usd',
    unit_amount: String(priceConfig.unitAmount),
    'recurring[interval]': priceConfig.interval,
    'recurring[usage_type]': 'licensed',
    'metadata[docsbotAddOn]': addOn.key,
    'metadata[unit]': String(addOn.unit),
    'metadata[interval]': intervalKey,
  }

  for (const [currency, unitAmount] of Object.entries(priceConfig.currencyOptions)) {
    params[`currency_options[${currency}][unit_amount]`] = String(unitAmount)
  }

  return stripeRequest('POST', '/prices', params)
}

const retrievePrice = (priceId) =>
  stripeRequest('GET', `/prices/${priceId}`, {
    'expand[]': 'currency_options',
  })

const deactivateCreatedObjects = async ({ priceIds = [], productId }) => {
  for (const priceId of priceIds) {
    await stripeRequest('POST', `/prices/${priceId}`, { active: 'false' })
  }
  if (productId) {
    await stripeRequest('POST', `/products/${productId}`, { active: 'false' })
  }
}

const verifyCurrencyOptions = async (addOn, intervalKey, price) => {
  const priceConfig = addOn.prices[intervalKey]
  const expectedCurrencies = Object.keys(priceConfig.currencyOptions)
  const missingCurrencies = expectedCurrencies.filter(
    (currency) => !Object.keys(price.currency_options || {}).includes(currency),
  )

  if (price.unit_amount !== priceConfig.unitAmount) {
    throw new Error(
      `Stripe Price ${price.id} amount ${price.unit_amount} did not match expected ${priceConfig.unitAmount}`,
    )
  }
  if (price.recurring?.interval !== priceConfig.interval) {
    throw new Error(
      `Stripe Price ${price.id} interval ${price.recurring?.interval} did not match expected ${priceConfig.interval}`,
    )
  }
  if (missingCurrencies.length > 0) {
    throw new Error(
      `Stripe Price ${price.id} is missing currency options: ${missingCurrencies.join(', ')}`,
    )
  }

  for (const [currency, expectedAmount] of Object.entries(priceConfig.currencyOptions)) {
    const actualAmount = price.currency_options?.[currency]?.unit_amount
    if (actualAmount !== expectedAmount) {
      throw new Error(
        `Stripe Price ${price.id} ${currency} amount ${actualAmount} did not match expected ${expectedAmount}`,
      )
    }
  }
}

const priceMatchesConfig = async (addOn, intervalKey, price) => {
  try {
    await verifyCurrencyOptions(addOn, intervalKey, price)
    return true
  } catch {
    return false
  }
}

async function main() {
  if (!secretKey) {
    throw new Error('Set STRIPE_SECRET_KEY_LIVE or STRIPE_SECRET_KEY.')
  }

  const envConfig = {}

  for (const addOn of ADD_ONS) {
    let productId = configuredAddOns?.[addOn.key]?.product || null
    let createdProductId = null
    const createdPriceIds = []
    const current = {}

    try {
      if (!productId) {
        const product = await createProduct(addOn)
        productId = product.id
        createdProductId = product.id
      }

      for (const intervalKey of ['monthly', 'annually']) {
        const existingPriceId = getConfiguredPriceId(addOn.key, intervalKey)
        let price = existingPriceId
          ? await retrievePrice(existingPriceId)
          : await createPrice(addOn, productId, intervalKey)

        if (existingPriceId && !(await priceMatchesConfig(addOn, intervalKey, price))) {
          const previousPriceId = price.id
          price = await createPrice(addOn, productId, intervalKey)
          createdPriceIds.push(price.id)
          price = await retrievePrice(price.id)
          await stripeRequest('POST', `/prices/${previousPriceId}`, { active: 'false' })
        } else if (!existingPriceId) {
          createdPriceIds.push(price.id)
          price = await retrievePrice(price.id)
        }

        await verifyCurrencyOptions(addOn, intervalKey, price)
        current[intervalKey] = price.id
      }
    } catch (error) {
      await deactivateCreatedObjects({
        priceIds: createdPriceIds,
        productId: createdProductId,
      })
      throw error
    }

    envConfig[addOn.key] = {
      prices: {
        current,
      },
      product: productId,
      unit: addOn.unit,
    }
  }

  console.log(JSON.stringify(envConfig, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
