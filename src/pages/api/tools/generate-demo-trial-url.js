import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'
import { isSuperAdmin, getURL } from '@/utils/helpers'
import {
  retrieveBrandByDomain,
  retrieveBrandByEmail,
} from '@/utils/crawlHelpers'
import {
  createDemoTrialToken,
  normalizeDomainForToken,
} from '@/lib/demoTrialToken'

/** Domain-only input (explicit domain or single token without @). */
const resolveDomainOnlyFromBody = (body) => {
  if (!body || typeof body !== 'object') return null
  const { domain, email } = body

  if (typeof domain === 'string' && domain.trim()) {
    return normalizeDomainForToken(domain.trim())
  }

  if (typeof email === 'string' && email.trim() && !email.includes('@')) {
    return normalizeDomainForToken(email.trim())
  }

  return null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const authHeader = req.headers.authorization
  const expectedKey = process.env.INTERNAL_API_KEY
  const hasInternalKey =
    Boolean(authHeader && expectedKey && authHeader === `Bearer ${expectedKey}`)

  if (!hasInternalKey) {
    let user
    try {
      user = await getAuthorizedUser({ req })
    } catch {
      return res.status(401).json({ message: 'Unauthorized: Authentication required' })
    }

    if (!isSuperAdmin(user.uid)) {
      return res.status(403).json({ message: 'Only super admins can generate demo trial URLs' })
    }
  }

  const body = req.body || {}
  const emailWithAt =
    typeof body.email === 'string' && body.email.trim().includes('@')
      ? body.email.trim()
      : null

  let resolved

  if (emailWithAt) {
    const result = await retrieveBrandByEmail(emailWithAt)
    if (!result.success) {
      if (result.httpStatus === 422) {
        if (result.errorCode === 'FREE_EMAIL_DETECTED') {
          return res.status(422).json({
            message:
              'That email uses a free or personal provider. Use a work email on your company domain, or enter the company website domain (e.g. kinsta.com) instead.',
            error_code: result.errorCode,
          })
        }
        if (result.errorCode === 'DISPOSABLE_EMAIL_DETECTED') {
          return res.status(422).json({
            message:
              'Disposable email addresses are not allowed. Use a work email or your company’s website domain.',
            error_code: result.errorCode,
          })
        }
        return res.status(422).json({
          message:
            result.message ||
            'This email cannot be used for brand lookup. Try your company website domain instead.',
          error_code: result.errorCode,
        })
      }
      if (result.httpStatus === 408) {
        return res.status(504).json({
          message:
            'Brand lookup timed out. Try again, or enter the company website domain instead.',
        })
      }
      return res.status(400).json({
        message:
          result.message ||
          'Brand.dev could not resolve that email. Enter the company’s public website domain (e.g. kinsta.com) and try again.',
      })
    }

    resolved = normalizeDomainForToken(result.brand.domain)
    if (!resolved) {
      return res.status(400).json({
        message:
          'Brand.dev did not return a usable company domain for that email. Enter the website domain manually.',
      })
    }
  } else {
    resolved = resolveDomainOnlyFromBody(body)
    if (!resolved) {
      return res.status(400).json({
        message: 'Provide a company domain or a work email (e.g. name@company.com).',
      })
    }

    const brand = await retrieveBrandByDomain(resolved)
    if (!brand) {
      return res.status(400).json({
        message:
          'Brand.dev could not resolve that domain. Enter the company’s public website domain (e.g. kinsta.com) and try again.',
      })
    }
  }

  let dealToken
  try {
    dealToken = createDemoTrialToken({ domain: resolved })
  } catch (e) {
    console.error('createDemoTrialToken', e)
    return res.status(500).json({
      message:
        e?.message ||
        'Demo trial signing is not configured. Set DEMO_TRIAL_SIGNING_KEY or INTERNAL_API_KEY.',
    })
  }

  const base = getURL()
  const path = `/pilot/${resolved}?deal=${encodeURIComponent(dealToken)}`
  const demoRegisterUrl = `${base}${path}`

  return res.status(200).json({
    domain: resolved,
    demoRegisterUrl,
    path,
  })
}
