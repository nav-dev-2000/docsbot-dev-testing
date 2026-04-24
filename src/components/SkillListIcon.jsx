import CompanyLogo from '@/components/CompanyLogo'
import PromptIcon from '@/components/PromptIcon'
import { DEFAULT_CUSTOM_BUTTON_ICON } from '@/constants/heroIcons.constants'
import { getDomainFromUrl } from '@/utils/helpers'

/**
 * Domain for favicon/logo when the skill manifest allows outbound API hosts.
 * Uses the first allowed hostname (same idea as MCP server URLs → CompanyLogo).
 */
export function skillIconDomainFromNetworkPolicy(policy) {
  const domains = Array.isArray(policy?.allowedDomains) ? policy.allowedDomains.filter(Boolean) : []
  if (!domains.length) return ''
  const raw = String(domains[0]).trim()
  if (!raw) return ''
  try {
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
    return getDomainFromUrl(url)
  } catch {
    return ''
  }
}

export default function SkillListIcon({
  icon,
  networkPolicy,
  sizeClass = 'size-10',
  iconClassName = 'size-5 text-gray-500',
}) {
  const domain = skillIconDomainFromNetworkPolicy(networkPolicy)
  const heroIcon = icon || DEFAULT_CUSTOM_BUTTON_ICON

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
