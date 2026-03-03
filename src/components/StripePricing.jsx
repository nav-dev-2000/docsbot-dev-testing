import Alert from '@/components/Alert'
import { CheckBadgeIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/solid'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import * as cookie from 'cookie'
import { RadioGroup } from '@headlessui/react'
import clsx from 'clsx'
import {
  frequencies,
  pricingTiers,
  currencies,
  enterpriseFeatures,
  featureDefinitions,
} from '@/constants/pricing.constants'
import { stripePlan, checkPlanPermission } from '@/utils/helpers'
import { getIncompatibleSourceTypesForPlan } from '@/utils/sourceTypePlanChecks'
import Tooltip from '@/components/Tooltip'
import SocialFaces from '@/components/SocialFaces'

// Helper function to get differentiating features for each tier
const getDifferentiatingFeatures = (currentTier, tierIndex, allTiers) => {
  const previousTier = tierIndex > 0 ? allTiers[tierIndex - 1] : null

  // Always include core limits that users care about most
  const coreLimits = [
    'docsBots',
    'sourcePages',
    'messagesPerMonth',
    'researchTasksPerMonth',
    'teamUsers',
  ]
  const features = []

  // Add core limits first (always show these)
  coreLimits.forEach((key) => {
    const value = currentTier.features[key]
    if (value !== undefined && value !== false && value !== 0) {
      features.push([key, value])
    }
  })

  // For Free tier, also show basic included features
  if (tierIndex === 0) {
    Object.entries(currentTier.features).forEach(([key, value]) => {
      if (
        !coreLimits.includes(key) &&
        typeof value === 'boolean' &&
        value === true
      ) {
        features.push([key, value])
      }
    })
    return features.slice(0, 8)
  }

  // For other tiers, add what's new or improved (excluding core limits already added)
  const differentiatingFeatures = []

  // Add other improved limits (excluding core limits already handled)
  Object.entries(currentTier.features).forEach(([key, value]) => {
    if (coreLimits.includes(key)) return // Skip core limits, already added

    const prevValue = previousTier?.features[key]
    const featureDef = featureDefinitions[key]

    if (featureDef?.category === 'limits') {
      // Show if it's a meaningful increase
      if (
        typeof value === 'number' &&
        typeof prevValue === 'number' &&
        value > prevValue
      ) {
        differentiatingFeatures.push([key, value])
      } else if (
        typeof value === 'string' &&
        value !== prevValue &&
        value !== 'false' &&
        value !== ''
      ) {
        differentiatingFeatures.push([key, value])
      }
    }
  })

  // Add newly enabled features (false -> true, or false -> string value)
  Object.entries(currentTier.features).forEach(([key, value]) => {
    if (coreLimits.includes(key)) return // Skip core limits, already added

    const prevValue = previousTier?.features[key]

    if (featureDefinitions[key]?.category !== 'limits') {
      if (
        (prevValue === false || prevValue === 0 || prevValue === '') &&
        (value === true ||
          (typeof value === 'string' && value !== 'false' && value !== '') ||
          (typeof value === 'number' && value > 0))
      ) {
        differentiatingFeatures.push([key, value])
      }
    }
  })

  // Combine core limits with differentiating features
  const allFeatures = [...features, ...differentiatingFeatures]

  // Prioritize by importance and limit to 8 features total
  return allFeatures
    .sort((a, b) => {
      const [aKey] = a
      const [bKey] = b

      // Core limits always come first
      if (coreLimits.includes(aKey) && !coreLimits.includes(bKey)) return -1
      if (!coreLimits.includes(aKey) && coreLimits.includes(bKey)) return 1
      if (coreLimits.includes(aKey) && coreLimits.includes(bKey)) {
        return coreLimits.indexOf(aKey) - coreLimits.indexOf(bKey)
      }

      // Then by category priority
      const aCat = featureDefinitions[aKey]?.category
      const bCat = featureDefinitions[bKey]?.category
      const priority = {
        limits: 0,
        integrations: 1,
        analytics: 2,
        ai: 3,
        features: 4,
        sources: 5,
        customization: 6,
        support: 7,
        compliance: 8,
      }
      return (priority[aCat] || 99) - (priority[bCat] || 99)
    })
    .slice(0, 14)
}

export function StripePricingTable({
  team,
  email,
  setErrorText,
  mode = 'checkout',
  saleConfig = null,
  defaultFrequency = null,
  bots = null,
  teamInvites = [],
  teamSourceTypes = [],
}) {
  const [enterprise, setEnterprise] = useState(false)
  const [frequency, setFrequency] = useState(() => {
    if (defaultFrequency) {
      return (
        frequencies.find((option) => option.value === defaultFrequency) ||
        frequencies[0]
      )
    }
    return frequencies[0]
  })
  const [currency, setCurrency] = useState(
    team.stripeSubscriptionCurrency
      ? team.stripeSubscriptionCurrency.toUpperCase()
      : 'USD',
  )
  const [opening, setOpening] = useState(false)
  const [plans] = useState(
    JSON?.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS) || [],
  )
  const isUpgrade = mode === 'upgrade'
  const currentPlanId = stripePlan(team)?.id || null
  const upgradeInterval =
    team?.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
  const allowUpgradeFrequencyToggle =
    isUpgrade && saleConfig?.forceAnnualInUpgrade
  const forcedUpgradeFrequency = allowUpgradeFrequencyToggle
    ? frequency.value
    : upgradeInterval
  const displayFrequency = isUpgrade
    ? frequencies.find((option) => option.value === forcedUpgradeFrequency) ||
      frequencies[0]
    : frequency
  const visibleTiers = pricingTiers.filter(
    (tier) => !tier.legacy && tier.showInStripe !== false,
  )
  const currentTierIndex = visibleTiers.findIndex(
    (tier) => tier.id === currentPlanId,
  )
  const upgradeTiers = isUpgrade ? visibleTiers : visibleTiers
  const normalizedSourceTypes = Array.isArray(teamSourceTypes)
    ? teamSourceTypes
    : []
  const incompatibleSourceTypesByTier = useMemo(() => {
    if (normalizedSourceTypes.length === 0) return {}
    const result = {}
    visibleTiers.forEach((tier) => {
      const incompatible = getIncompatibleSourceTypesForPlan({
        team,
        targetPlanId: tier.id,
        usedSourceTypeIds: normalizedSourceTypes,
      })
      if (incompatible.length > 0) {
        result[tier.id] = incompatible
      }
    })
    return result
  }, [normalizedSourceTypes, team, visibleTiers])

  async function openPortal(tier) {
    setErrorText(null)
    setOpening(true)
    const shouldApplyAnnualSale =
      shouldShowAnnualSale && displayFrequency.value === 'annually'
    const response = await fetch(`/api/teams/${team.id}/stripe-portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tier,
        frequency: displayFrequency.value,
        currency,
        email,
        upgrade: isUpgrade,
        ...(shouldApplyAnnualSale ? { sale: saleConfig?.id } : {}),
      }),
    })
    if (response.ok) {
      const data = await response.json()
      const { url } = data
      //redirect to url
      window.location.href = url
      return
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
        setOpening(false)
      }
    }
    setOpening(false)
  }

  const getPlanSelectionDisableReasons = (id) => {
    const reasons = []
    const planLimits = plans[id]
    if (!planLimits) return reasons

    const researchTasksLimit =
      typeof planLimits.researchTasks === 'number'
        ? planLimits.researchTasks
        : typeof planLimits.researchTasks === 'object' &&
            planLimits.researchTasks !== null
          ? planLimits.researchTasks.monthly ||
            planLimits.researchTasks.lifetime ||
            0
          : 0

    const currentPlan = stripePlan(team)
    const currentPlanResearchLimit =
      typeof currentPlan?.researchTasks === 'number'
        ? currentPlan.researchTasks
        : 0
    const trialResearchAmount =
      currentPlanResearchLimit === 0
        ? Math.min(2, Number(team?.researchCount ?? 0))
        : 0
    const researchCount = Math.max(
      0,
      Number(team?.researchCount ?? 0) - trialResearchAmount,
    )

    if (!isUpgrade) {
      const planBotsLimit = Number(planLimits.bots) || 0
      const planPagesLimit = Number(planLimits.pages) || 0
      const planQuestionsLimit = Number(planLimits.questions) || 0
      const planTeamMembersLimit = Number(planLimits.teamMembers) || 0

      const currentBots = Number(team?.botCount ?? 0)
      const currentPages = Number(team?.pageCount ?? 0)
      const currentQuestions = Number(team?.questionCount ?? 0)
      const currentTeamMembers =
        Object.keys(team?.roles || {}).length + teamInvites.length

      if (currentBots > planBotsLimit) {
        reasons.push(`Bots: ${currentBots}/${planBotsLimit}`)
      }
      if (currentPages > planPagesLimit) {
        reasons.push(`Pages: ${currentPages}/${planPagesLimit}`)
      }
      if (currentQuestions > planQuestionsLimit) {
        reasons.push(`Questions: ${currentQuestions}/${planQuestionsLimit}`)
      }
      if (currentTeamMembers > planTeamMembersLimit) {
        reasons.push(
          `Team members: ${currentTeamMembers}/${planTeamMembersLimit}`,
        )
      }
      if (researchCount > researchTasksLimit) {
        reasons.push(`Research tasks: ${researchCount}/${researchTasksLimit}`)
      }
    }

    if (isUpgrade) {
      const isCurrentlyBusinessOrHigher = checkPlanPermission(
        team,
        'business',
      ).allowed
      const planLevels = {
        free: 1,
        hobby: 2,
        personal: 3,
        pro: 4,
        standard: 5,
        business: 6,
        enterprise: 7,
      }
      const targetTierLevel = planLevels[id] || 0
      const businessLevel = planLevels.business
      const isDowngradingToBelowBusiness = targetTierLevel < businessLevel

      if (isCurrentlyBusinessOrHigher && isDowngradingToBelowBusiness) {
        if (bots && Array.isArray(bots)) {
          const teamMemberIds = Object.keys(team?.roles || {})
          const hasPerBotRoles = bots.some((bot) => {
            if (!bot.roles) return false
            return Object.keys(bot.roles).some((memberId) => {
              const botRole = bot.roles[memberId]
              return (
                botRole &&
                botRole !== 'default' &&
                teamMemberIds.includes(memberId)
              )
            })
          })

          const invitesHaveBotOverrides = teamInvites.some(
            (invite) =>
              invite.botOverrides &&
              Array.isArray(invite.botOverrides) &&
              invite.botOverrides.length > 0,
          )

          if (hasPerBotRoles || invitesHaveBotOverrides) {
            reasons.push('Per-bot roles require Business or higher')
          }
        } else {
          reasons.push('Cannot verify per-bot roles for Business downgrade')
        }
      }
    }

    if (incompatibleSourceTypesByTier[id]?.length > 0) {
      reasons.push(
        `Unsupported source types: ${incompatibleSourceTypesByTier[id]
          .map((source) => source.title)
          .join(', ')}`,
      )
    }

    return reasons
  }

  const shouldShowAnnualSale = Boolean(saleConfig)
  const personaSaleMessage =
    saleConfig?.getUpgradeMessage?.(team) ||
    saleConfig?.getCheckoutMessage?.(team) ||
    saleConfig?.message
  const frequencyOptions = frequencies
  const isCurrencyLocked =
    isUpgrade && Boolean(team?.stripeSubscriptionCurrency)
  const alternateBillingIntervalLabel =
    displayFrequency.value === 'monthly' ? 'annual' : 'monthly'

  // Trial is enabled via Staff Tools (team.canTrial). Only show banner when it
  // will actually be applied in Stripe checkout (new customers without a Stripe customer id).
  const shouldShowTrialBanner =
    !isUpgrade && Boolean(team?.canTrial) && !team?.stripeCustomerId

  // Stripe checkout can override the default trial length (e.g. via coupon).
  // Keep UI messaging accurate by matching the same override logic used server-side.
  const [trialDays, setTrialDays] = useState(14)
  useEffect(() => {
    if (!shouldShowTrialBanner) return
    if (typeof window === 'undefined') return
    try {
      const cookies = cookie.parse(document.cookie || '')
      const couponId = cookies['docsbot_coupon']
      if (couponId === 'paul-higgins') {
        setTrialDays(30)
      } else {
        setTrialDays(14)
      }
    } catch (e) {
      setTrialDays(14)
    }
  }, [shouldShowTrialBanner])

  return (
    <div>
      <div className="mb-2 text-center">
        {shouldShowAnnualSale && personaSaleMessage && (
          <div className="mb-4 flex justify-center">
            <div className="bg-animation rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow">
              {personaSaleMessage}
            </div>
          </div>
        )}
        <h2 className="mb-2 text-3xl font-bold">
          {isUpgrade ? 'Switch to a higher plan' : 'Choose a Plan'}
        </h2>
        {false && (
          <Alert
            type="info"
            className=""
            title="Have a discount code? Apply it on the next screen!"
          />
        )}
        <p className="text-lg text-gray-800">
          {isUpgrade
            ? 'Upgrade to access more capacity and features. Changes apply immediately.'
            : 'Please choose a plan that fits your needs. You can upgrade or downgrade at any time.'}
        </p>
        {!isUpgrade && (
          <p className="text-md mx-auto flex items-center justify-center font-semibold text-teal-500">
            <CheckBadgeIcon className="mr-1 h-5 w-5" /> 14-day money-back
            guarantee!
          </p>
        )}
      </div>

      <div className="mx-auto my-10">
        {shouldShowTrialBanner && (
          <div className="mx-auto mb-6 max-w-2xl">
            <Alert
              type="info"
              title={`A ${trialDays}-day free trial will be applied to your account.`}
            />
          </div>
        )}

        {!isUpgrade || allowUpgradeFrequencyToggle ? (
          <>
            <div className="flex justify-center">
              <RadioGroup
                value={frequency}
                onChange={setFrequency}
                className="grid grid-cols-2 gap-x-1 rounded-lg bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
              >
                <RadioGroup.Label className="sr-only">
                  Payment frequency
                </RadioGroup.Label>
                {frequencyOptions.map((option) => (
                  <RadioGroup.Option
                    key={option.value}
                    value={option}
                    className={({ checked }) =>
                      clsx(
                        checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                        'cursor-pointer rounded-lg px-8 py-2',
                      )
                    }
                  >
                    <span>{option.label}</span>
                  </RadioGroup.Option>
                ))}
              </RadioGroup>
            </div>
            {shouldShowAnnualSale && displayFrequency.value === 'annually' ? (
              <div className="mt-3 flex justify-center">
                <div className="bg-animation rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-white shadow">
                  {saleConfig?.message || '34% off annual plans applied.'}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-center text-sm text-gray-600">
                Two months free with annual plans!
              </p>
            )}
          </>
        ) : shouldShowAnnualSale && displayFrequency.value === 'annually' ? (
          <p className="mt-2 text-center text-sm text-gray-600">
            {saleConfig?.message || '34% off annual plans applied.'}
          </p>
        ) : (
          <p className="mt-2 text-center text-sm text-gray-600">
            {`Showing ${displayFrequency.label.toLowerCase()} pricing to match your current billing interval. Open the billing portal to switch to ${alternateBillingIntervalLabel} plans.`}
          </p>
        )}
        {!isCurrencyLocked && (
          <div className="mt-4 flex justify-center xl:-mt-4 xl:justify-end">
            <RadioGroup
              value={currency}
              onChange={setCurrency}
              className="grid grid-cols-5 gap-x-1 rounded-md bg-gray-50 p-1 text-center text-sm font-semibold leading-5 ring-1 ring-inset ring-gray-200"
            >
              <RadioGroup.Label className="sr-only">Currency</RadioGroup.Label>
              {Object.keys(currencies).map((option) => (
                <RadioGroup.Option
                  key={option}
                  value={option}
                  className={({ checked }) =>
                    clsx(
                      checked ? 'bg-cyan-600 text-white' : 'text-gray-500',
                      'cursor-pointer rounded-md px-2.5 py-1',
                    )
                  }
                >
                  <span>
                    {currencies[option].symbol} {currencies[option].label}
                  </span>
                </RadioGroup.Option>
              ))}
            </RadioGroup>
          </div>
        )}
        <div className="isolate mx-auto mt-8 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 xl:grid-cols-3">
          {upgradeTiers.map((tier, index) => {
            const annualSaleTotal =
              shouldShowAnnualSale && displayFrequency.value === 'annually'
                ? saleConfig?.annualTotals?.[tier.id]?.[currency]
                : null
            const annualTotal =
              annualSaleTotal ?? tier.price[currency][displayFrequency.value]
            const monthlyEquivalent = annualTotal / 12
            const isCurrentTier =
              isUpgrade && currentTierIndex >= 0 && index === currentTierIndex
            const isDowngradeTier =
              isUpgrade && currentTierIndex >= 0 && index < currentTierIndex
            return (
              <div
                key={tier.id}
                className={clsx(
                  tier.mostPopular
                    ? 'ring-2 ring-cyan-600'
                    : 'ring-1 ring-gray-200',
                  'rounded-3xl p-6 xl:p-8',
                )}
              >
                <div className="flex items-center justify-between gap-x-4">
                  <h3
                    id={tier.id}
                    className={clsx(
                      tier.mostPopular ? 'text-cyan-600' : 'text-gray-900',
                      'text-lg font-semibold leading-8',
                    )}
                  >
                    {tier.name}
                  </h3>
                  {tier.mostPopular ? (
                    <p className="rounded-full bg-cyan-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-cyan-600">
                      Most popular
                    </p>
                  ) : null}
                </div>
                <p className="mt-4 text-sm leading-6 text-gray-600 xl:h-16">
                  {tier.description}
                </p>
                {displayFrequency?.value === 'monthly' ? (
                  <>
                    <p className="mt-2 flex items-baseline gap-x-1">
                      <span className="text-4xl font-bold tracking-tight text-gray-600">
                        {currencies[currency].symbol}
                        {tier.price[currency][displayFrequency?.value].toFixed(
                          0,
                        )}
                      </span>
                      <span className="-ml-0.5 text-sm font-semibold leading-6 text-gray-600">
                        /month
                      </span>
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mt-6 flex items-baseline gap-x-2">
                      {shouldShowAnnualSale &&
                      displayFrequency.value === 'annually' ? (
                        <span className="text-xl font-semibold tracking-tight text-gray-400 line-through">
                          {currencies[currency].symbol}
                          {tier.price[currency].monthly.toFixed(0)}
                        </span>
                      ) : null}
                      <span className="text-4xl font-bold tracking-tight text-gray-600">
                        {currencies[currency].symbol}
                        {monthlyEquivalent.toFixed(0)}
                      </span>
                      <span className="-ml-0.5 text-sm font-semibold leading-6 text-gray-600">
                        /month
                      </span>
                    </p>
                    <p className="mt-0 flex items-baseline gap-x-1 text-gray-500">
                      (
                      {shouldShowAnnualSale &&
                      displayFrequency.value === 'annually' ? (
                        <>
                          <span className="text-xl font-semibold tracking-tight text-gray-400 line-through">
                            {currencies[currency].symbol}
                            {tier.price[currency].annually.toFixed(0)}
                          </span>
                          <span className="text-xl font-bold tracking-tight text-gray-700">
                            {currencies[currency].symbol}
                            {annualTotal.toFixed(0)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold tracking-tight">
                          {currencies[currency].symbol}
                          {annualTotal.toFixed(0)}
                        </span>
                      )}
                      <span className="-ml-0.5 text-sm font-semibold leading-6">
                        /annually
                      </span>
                      )
                    </p>
                  </>
                )}
                {(() => {
                  const disableReasons = getPlanSelectionDisableReasons(tier.id)
                  const hasDisableReasons = disableReasons.length > 0
                  return (
                    <>
                      <button
                        aria-describedby={tier.id}
                        onClick={() => openPortal(tier.id)}
                        disabled={opening || hasDisableReasons || isCurrentTier}
                        className={clsx(
                          tier.mostPopular
                            ? 'bg-cyan-600 text-white shadow-sm hover:bg-cyan-500'
                            : 'text-cyan-600 ring-1 ring-inset ring-cyan-500 hover:ring-cyan-800',
                          'mt-6 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-800 disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                      >
                        {isUpgrade
                          ? isCurrentTier
                            ? 'Current plan'
                            : isDowngradeTier
                              ? 'Downgrade'
                              : 'Upgrade'
                          : 'Subscribe'}
                      </button>
                      {hasDisableReasons && (
                        <div className="mt-2 flex items-center justify-center gap-1 text-xs text-amber-700">
                          <span>Usage exceeds limits</span>
                          <Tooltip
                            content={disableReasons.join(', ')}
                            placement="top"
                          >
                            <span
                              className="inline-flex cursor-help items-center"
                              aria-label="View plan limits details"
                            >
                              <InformationCircleIcon className="h-4 w-4" />
                            </span>
                          </Tooltip>
                        </div>
                      )}
                    </>
                  )
                })()}
                <h3 className="mt-6 text-sm/6 font-medium text-gray-950">
                  {index === 0
                    ? 'Including:'
                    : `Everything in ${upgradeTiers[index - 1]?.name || 'Free'} plan, and:`}
                </h3>
                <ul className="mt-3 space-y-3 text-left">
                  {getDifferentiatingFeatures(tier, index, upgradeTiers).map(
                    ([key, value]) => {
                      const featureDef = featureDefinitions[key]
                      if (!featureDef) return null

                      let displayText = featureDef.label
                      if (typeof value === 'string' && value !== 'true') {
                        displayText = `${featureDef.label}: ${value}`
                      } else if (typeof value === 'number') {
                        displayText = `${value} ${featureDef.label}`
                      }

                      return (
                        <li
                          key={key}
                          className="group grid grid-cols-[20px_1fr] items-start gap-3 text-sm/6 text-gray-600"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center text-gray-400">
                            <PlusIcon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="min-w-0 leading-6">
                            {displayText}
                          </span>
                        </li>
                      )
                    },
                  )}
                </ul>
                <div className="mt-6 text-center">
                  <Link
                    href="/pricing#comparison-table"
                    className="text-sm font-medium text-cyan-600 hover:text-cyan-500"
                  >
                    Compare all features →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="relative mx-auto mt-0 max-w-xl space-y-4 pl-12 text-center">
        <div className="absolute -top-6 left-24 hidden sm:block">
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDkiIGhlaWdodD0iNDUiIHZpZXdCb3g9IjAgMCA0OSA0NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggb3BhY2l0eT0iMC4yIiBkPSJNNDguODg2NiA0My4yMDI0QzQ2Ljc0NDggNDQuNzE2NiA0NC40MjkyIDQ0LjU0NzYgNDIuMzI3OSA0NC4xNTIzQzM5LjQxNDcgNDMuNTY4NyAzNi41NTIxIDQyLjcwNzYgMzMuOTAzOCA0MS42MjAzQzIxLjg2NjUgMzYuMzMxNyAxNC4wOTE4IDI3LjgxMjcgMTAuMDkzNSAxNi43MjYxQzkuMDg4NjkgMTMuOTA0IDguNTQwNDIgMTAuODk4NiA3LjcyOTExIDcuNjQ4MjJDNC43NTI2OCA5LjUyMDc4IDMuNDE5MDcgMTIuNzIwNiAwLjQ2MzUwNSAxNC43OTUyQy0wLjA2NzY2NjggMTMuNDg5MSAwLjYyNjAyNiAxMi41MzI5IDEuMTc2NzkgMTEuNzI3NUMzLjQ1MTMyIDguNDMwNDIgNS44MDQyNCA1LjEyNTI4IDguMjQyNTQgMS44NzkzN0M5LjQyOTQ1IDAuMzI3Nzg4IDEwLjQzNDkgMC4wODc4MTU0IDExLjk3MTUgMS4xNTM4N0MxNS4yMDg1IDMuMzM3MTIgMTcuMzI0OSA2LjE4MDQ5IDE4LjIzNTUgOS42MjQ3N0MxOC4yNDk0IDkuNzU5NDIgMTguMDM1MSA5Ljk4NTcgMTcuNzU2MiAxMC4zNTQ3QzE0LjMwOCA5Ljk2MjUgMTQuNzA5NiA2LjE3ODUyIDExLjY2OTIgNS4xMzE3M0MxMC44OTQ2IDkuOTA2ODkgMTIuMjk0NyAxNC4yNTMyIDE0LjE1MTIgMTguNDE2M0MxNi4xMDcxIDIyLjc3MzMgMTguNTEyNSAyNi44Nzk3IDIyLjA0NTUgMzAuMzkzMkMyNS40OTMgMzMuODQ3NiAyOS42NDgyIDM2LjQ4MDMgMzQuMTc0NSAzOC44NzA2QzM4LjYyOTMgNDEuMzM2MyA0My41MjE4IDQyLjY2OCA0OC44ODY2IDQzLjIwMjRaIiBmaWxsPSIjMEQxOTI3Ii8+Cjwvc3ZnPgo="
            alt="up arrow"
            className="h-12 w-auto"
          />
        </div>
        <SocialFaces />
      </div>

      <p className="mt-1 text-center text-sm text-gray-500">
        Thousands of people & companies have created custom chatbots with
        DocsBot!
      </p>
      {!enterprise && (
        <div className="mb-6 mt-6 text-center">
          <p className="text-md text-gray-600">
            Need more?{' '}
            <button
              onClick={() => setEnterprise(true)}
              className="underline hover:text-gray-800"
            >
              View our Enterprise Options
            </button>
          </p>
        </div>
      )}
      {enterprise && (
        <div className="mx-auto mt-8 max-w-2xl rounded-3xl ring-1 ring-gray-200 sm:mt-10 lg:mx-0 lg:flex lg:max-w-none">
          <div className="p-8 sm:p-10 lg:flex-auto">
            <h3 className="text-2xl font-bold tracking-tight text-gray-900">
              Enterprise
            </h3>
            <p className="mt-6 text-base leading-7 text-gray-600">
              For serious traffic and custom integrations. Identify problem
              areas in your product and gaps in your documentation with
              automated AI analysis of user questions. Get priority support &
              integration help to create specialized bots for your unique
              business needs. Use the Microsoft Azure OpenAI Service for
              Enterprise-grade security with role-based access control (RBAC),
              private networks, and region restrictions. Self-hosted options are
              available to satisfy any data protection requirements.
            </p>
            <div className="mt-10 flex items-center gap-x-4">
              <h4 className="flex-none text-sm font-semibold leading-6 text-cyan-600">
                What's included
              </h4>
              <div className="h-px flex-auto bg-gray-100" />
            </div>
            <ul
              role="list"
              className="mt-8 grid grid-cols-1 gap-4 text-sm leading-6 text-gray-600 sm:grid-cols-2 sm:gap-6"
            >
              {enterpriseFeatures.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    className="h-6 w-5 flex-none text-cyan-600"
                    aria-hidden="true"
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
          <div className="-mt-2 p-2 lg:mt-0 lg:w-full lg:max-w-md lg:flex-shrink-0">
            <div className="h-full rounded-2xl bg-gray-50 py-10 text-center ring-1 ring-inset ring-gray-900/5 lg:flex lg:flex-col lg:justify-center lg:py-16">
              <div className="mx-auto max-w-xs px-8">
                <p className="text-base font-semibold text-gray-600">
                  Plans starting at
                </p>
                <p className="mt-6 flex items-baseline justify-center gap-x-2">
                  <span className="text-5xl font-bold tracking-tight text-gray-900">
                    $999/mo
                  </span>
                  <span className="text-sm font-semibold leading-6 tracking-wide text-gray-600">
                    USD
                  </span>
                </p>
                <p className="text-xs leading-6 tracking-wide text-gray-500">
                  (paid annually)
                </p>
                <a
                  href="mailto:human@docsbot.ai"
                  onClick={(e) => {
                    if (Beacon !== undefined) {
                      e.preventDefault()
                      DocsBotAI.unmount()
                      Beacon('init', '1dc28732-3f1c-4cd0-a15b-825c4aa5e4b2')
                      Beacon('open')
                    }
                  }}
                  className="mt-10 block w-full rounded-md bg-cyan-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-cyan-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600"
                >
                  Contact us
                </a>
                <p className="mt-6 text-xs leading-5 text-gray-600">
                  Custom invoices and pay by ACH or wire transfer
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
