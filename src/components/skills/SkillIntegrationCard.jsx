import Link from 'next/link'
import { ArrowRightIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'

import { getSkillIntegrationPath } from '@/lib/skillsIntegrationPaths'

function cleanHex(value, fallback) {
  return /^#[0-9A-Fa-f]{6}$/.test(value || '') ? value : fallback
}

export default function SkillIntegrationCard({ record, showDescription = true, showFooterCta = true }) {
  const primaryColor = cleanHex(record.brand?.primaryColor, '#0891b2')
  const accentColor = cleanHex(record.brand?.accentColor, '#14b8a6')
  const icon = record.brand?.preferredIcon || record.brand?.preferredLogo || {
    url: record.brand?.iconUrl || record.brand?.logoUrl,
    type: record.brand?.iconUrl ? 'icon' : 'logo',
    mode: 'unknown',
  }
  const iconUsesDarkSurface = icon.mode === 'dark'
  const installBadge = record.availability === 'install' && (
    <span
      className="rounded-full px-3 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${primaryColor}16`, color: primaryColor }}
    >
      Install ready
    </span>
  )
  const footerCta = showFooterCta && (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-700">
      {record.availability === 'install' ? 'Install this skill' : 'Build this skill'}
      <ArrowRightIcon className="h-4 w-4" />
    </span>
  )
  const footerRow = installBadge || footerCta
  const footerPaddingTop = showDescription && record.description ? 'pt-5' : 'pt-4'

  return (
    <Link
      href={getSkillIntegrationPath(record)}
      className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderTopColor: primaryColor, borderTopWidth: 4 }}
    >
      <div className="flex items-start gap-4">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${
            iconUsesDarkSurface ? 'bg-slate-950' : 'bg-white'
          }`}
          style={{ borderColor: `${accentColor}55` }}
        >
          <img
            src={icon.url}
            alt={`${record.name} logo`}
            className="max-h-8 max-w-8 rounded-sm object-contain"
            loading="lazy"
          />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-950 group-hover:text-cyan-700">{record.name}</h3>
          <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{record.category}</p>
        </div>
      </div>
      {showDescription && record.description ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{record.description}</p>
      ) : null}
      {footerRow ? (
        <div
          className={clsx('mt-auto flex items-center gap-3', footerPaddingTop, {
            'justify-between': installBadge && footerCta,
            'justify-start': installBadge && !footerCta,
            'justify-end': !installBadge && footerCta,
          })}
        >
          {installBadge}
          {footerCta}
        </div>
      ) : (
        <div className="mt-auto" aria-hidden />
      )}
    </Link>
  )
}
