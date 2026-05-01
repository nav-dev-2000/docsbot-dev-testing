import CompanyLogo from '@/components/CompanyLogo'
import PromptIcon from '@/components/PromptIcon'
import { DEFAULT_CUSTOM_BUTTON_ICON } from '@/constants/heroIcons.constants'
import { getDomainFromUrl } from '@/utils/helpers'
import { useEffect, useState } from 'react'

/**
 * Domain for favicon/logo when the skill manifest allows outbound API hosts.
 * Uses the first global allowed hostname, then falls back to auth provider hosts.
 */
export function skillIconDomainFromNetworkPolicy(policy, authProviders = [], envBindings = []) {
  const domains = Array.isArray(policy?.allowedDomains) ? policy.allowedDomains.filter(Boolean) : []
  const providerDomains = Array.isArray(authProviders)
    ? authProviders.flatMap((provider) =>
        Array.isArray(provider?.allowedDomains) ? provider.allowedDomains.filter(Boolean) : [],
      )
    : []
  const raw = String(domains[0] || providerDomains[0] || '').trim()
  if (!raw) return ''
  const envValues = new Map(
    (Array.isArray(envBindings) ? envBindings : [])
      .map((binding) => [
        String(binding?.envVar || '').trim(),
        String(binding?.value || '').trim(),
      ])
      .filter(([key, value]) => key && value),
  )
  const resolved = raw.replace(/\{\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}\}/g, (match, envVar) => {
    return envValues.get(envVar) || match
  })
  if (/\{\{\s*[A-Za-z_][A-Za-z0-9_]*\s*\}\}/.test(resolved)) return ''
  try {
    const url = /^https?:\/\//i.test(resolved) ? resolved : `https://${resolved}`
    return getDomainFromUrl(url)
  } catch {
    return ''
  }
}

export default function SkillListIcon({
  icon,
  networkPolicy,
  authProviders,
  envBindings,
  sizeClass = 'size-10',
  iconClassName = 'size-5 text-gray-500',
}) {
  const [domain, setDomain] = useState('')
  const heroIcon = icon || DEFAULT_CUSTOM_BUTTON_ICON

  useEffect(() => {
    setDomain(skillIconDomainFromNetworkPolicy(networkPolicy, authProviders, envBindings))
  }, [authProviders, envBindings, networkPolicy])

  return (
    <span
      className={`inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200`}
    >
      {domain ? (
        <CompanyLogo domain={domain} className="size-6 object-contain" alt="" />
      ) : (
        <PromptIcon icon={heroIcon} className={iconClassName} />
      )}
    </span>
  )
}
