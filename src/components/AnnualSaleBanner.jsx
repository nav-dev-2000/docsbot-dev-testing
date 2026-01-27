import { MegaphoneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { canUserManageBilling } from '@/utils/function.utils'
import { isBannerDismissed, setBannerPreference } from '@/utils/bannerPreferences'
import { getAnnualSalePersonaMessage } from '@/components/annualSaleConfig'

const ANNUAL_SALE_DISMISS_KEY = 'annual-sale-2026'

export default function AnnualSaleBanner({ team, user, fullWidth = false }) {
  const [isDismissed, setIsDismissed] = useState(false)
  const personaMessage = useMemo(() => getAnnualSalePersonaMessage(team), [team])

  const canManageBilling = useMemo(() => {
    if (!team || !user?.uid) return false
    return canUserManageBilling(team, user.uid)
  }, [team, user?.uid])

  const shouldShow = Boolean(team && canManageBilling && personaMessage)

  const handleDismiss = (e) => {
    e.stopPropagation()
    setIsDismissed(true)
    setBannerPreference(`dismissed-${ANNUAL_SALE_DISMISS_KEY}`, true, 7)
  }

  useEffect(() => {
    if (isBannerDismissed(ANNUAL_SALE_DISMISS_KEY)) {
      setIsDismissed(true)
    }
  }, [])

  if (!shouldShow || isDismissed) return null

  return (
    <div className="pt-4">
      <div className={clsx('mx-auto px-4 sm:px-6 md:px-8', fullWidth ? '' : 'max-w-7xl')}>
        <div className="relative">
          <Link
            href="/app/account"
            className="flex w-full items-center justify-between gap-3 rounded-lg bg-animation px-4 py-2 text-left text-white shadow-lg transition-transform hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:gap-4"
          >
            <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center">
              <MegaphoneIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="flex-1 text-sm sm:text-base">
              <span className="font-semibold">{personaMessage}</span>
            </span>
            <span className="inline-flex flex-shrink-0 items-center rounded-md bg-white px-3 py-1 text-xs font-semibold text-cyan-600 shadow-sm sm:px-4 sm:text-sm">
              View offer
            </span>
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            className="absolute right-2 top-2 rounded-full p-1 text-white/80 transition hover:bg-white/20 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
            aria-label="Dismiss banner"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
