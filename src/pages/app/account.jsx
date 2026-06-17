import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect, useCallback } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'
import { updateEmail, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { auth } from '@/config/firebase-ui.config'
import { usePostHog } from 'posthog-js/react'
import {
  ServerStackIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  Square3Stack3DIcon,
  ChatBubbleBottomCenterTextIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline'
import * as cookie from 'cookie'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { verifyDemoTrialToken } from '@/lib/demoTrialToken'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getBotActionSlotLimit, roundAiCreditsForDisplay, stripePlan } from '@/utils/helpers'
import {
  ADD_ON_IDS,
  getAddOnDisplayPrice,
  getEffectiveAddOns,
  getStripeAddOnsFromEnv,
  isAutoIncreaseAiCreditsEnabled,
  isAddOnAvailableForPlan,
} from '@/utils/billingAddOns'
import Checkout from '@/components/Checkout'
import Cancel from '@/components/Cancel'
import ModalDeleteAccount from '@/components/ModalDeleteAccount'
import LocalStringNum from '@/components/LocalStringNum'
import { getBots, getInvitesFromTeam, getTeamSourceTypeIds } from '@/lib/dbQueries'
import { getUserRole, canUserManageBilling } from '@/utils/function.utils'
import { stripe } from '@/utils/stripe'
import ModalPasswordReset from '@/components/ModalPasswordReset'
import Tooltip from '@/components/Tooltip'
import LoadingSpinner from '@/components/LoadingSpinner'
import { completeStripePaymentAction } from '@/utils/stripePaymentActionClient'
import {
  buildTeamBillingUpdate,
  syncTeamBillingFromStripe,
} from '@/utils/billingSubscriptionSync'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore } from 'firebase-admin/firestore'

const Card = ({
  name,
  stat,
  href,
  linkText,
  tooltip,
  CardIcon,
  limit,
  grandfathered = false,
}) => {
  const cardContent = (
    <div key={name} className="overflow-hidden rounded-lg bg-white shadow">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <CardIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="truncate text-sm font-medium text-gray-500">
                {name}
                {grandfathered && (
                  <span aria-label="Grandfathered limit" className="ml-0.5 text-cyan-700">
                    *
                  </span>
                )}
              </dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">
                  <LocalStringNum value={stat} />
                  {limit && (
                    <span className="text-sm text-gray-500">
                      {' '}
                      / <LocalStringNum value={limit} />
                    </span>
                  )}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {href && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <Link href={href} className="font-medium text-cyan-700 hover:text-cyan-900">
              {linkText}
              <ArrowRightIcon className="-mr-0.5 ml-1 inline h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )

  return tooltip ? (
    <Tooltip content={tooltip}>
      {cardContent}
    </Tooltip>
  ) : cardContent
}

const parseStripePlans = () => {
  try {
    return JSON.parse(process.env.NEXT_PUBLIC_STRIPE_PLANS || '{}')
  } catch (error) {
    console.warn('Unable to parse NEXT_PUBLIC_STRIPE_PLANS', error)
    return {}
  }
}

const normalizeLimit = (value, fallback = null) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

const getPlanLimit = (plan, key) => {
  return normalizeLimit(plan?.[key])
}

const getGrandfatheredLimit = ({ currentPlan, resolvedPlan, key }) => {
  const resolvedLimit = getPlanLimit(resolvedPlan, key)
  const currentLimit = getPlanLimit(currentPlan, key)

  if (
    resolvedLimit === null ||
    currentLimit === null ||
    resolvedLimit === currentLimit
  ) {
    return { isGrandfathered: false, currentLimit }
  }

  return { isGrandfathered: true, currentLimit }
}

const withGrandfatheredTooltip = ({ tooltip, isGrandfathered }) => {
  if (!isGrandfathered) return tooltip
  return `${tooltip} * This is a grandfathered limit for your current plan. If you downgrade or cancel, new limits will apply if you come back to this plan later.`
}

const RETAINED_CREDIT_TOOLTIP =
  'Unused prorated credit will stay on your account and be applied automatically to future invoices.'

function Account({
  team: initialTeam,
  bots,
  checkout,
  teamInvites = [],
  teamSourceTypes = [],
  role,
  canManageBilling,
  userId,
  hasDemoTrialPromotion = false,
}) {
  const [teamOverride, setTeamOverride] = useState(null)
  const team = teamOverride ? { ...initialTeam, ...teamOverride } : initialTeam
  const [user] = useAuthState(auth)
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [newEmail, setNewEmail] = useState('')
  const [sentPasswordReset, setSentPasswordReset] = useState(false)
  const [canModify, setModify] = useState(false)
  const [newDisplayName, setNewDisplayName] = useState('')
  const [isUpdatingName, setIsUpdatingName] = useState(false)
  const [openingAddOns, setOpeningAddOns] = useState(false)
  const [addOnQuantities, setAddOnQuantities] = useState({})
  const [addOnPreview, setAddOnPreview] = useState(null)
  const [autoIncreaseAiCredits, setAutoIncreaseAiCredits] = useState(
    isAutoIncreaseAiCreditsEnabled(team),
  )
  const isGoogleAccount = user?.providerData?.some((p) => p.providerId === 'google.com')
  const isOwner = team?.roles?.[userId] === 'owner'
  const posthog = usePostHog()
  const router = useRouter()
  const [billingSynced, setBillingSynced] = useState(false)

  const applyTeamBillingUpdate = useCallback((billingUpdate = {}) => {
    if (!billingUpdate || Object.keys(billingUpdate).length === 0) return
    setTeamOverride((current) => ({
      ...(current || {}),
      ...billingUpdate,
    }))
  }, [])

  const syncTeamBilling = useCallback(async () => {
    if (!team?.id || !canManageBilling) return null
    const response = await fetch(`/api/teams/${team.id}/subscription-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const data = await response.json()
    if (response.ok && data.teamBilling) {
      applyTeamBillingUpdate(data.teamBilling)
      return data.teamBilling
    }
    if (response.ok && data.skipped) {
      return null
    }
    throw new Error(data.message || 'Unable to refresh billing details.')
  }, [team?.id, canManageBilling, applyTeamBillingUpdate])

  const handleBillingChange = useCallback(async ({ successMessage } = {}) => {
    await syncTeamBilling()
    setSuccessText(successMessage || 'Plan updated.')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [syncTeamBilling])

  useEffect(() => {
    setNewDisplayName(user?.displayName || '')
  }, [user])

  useEffect(() => {
    setTeamOverride(null)
  }, [initialTeam?.id])

  useEffect(() => {
    setAutoIncreaseAiCredits(isAutoIncreaseAiCreditsEnabled(initialTeam))
  }, [initialTeam?.id, initialTeam?.autoIncreaseAiCredits])

  useEffect(() => {
    posthog?.startSessionRecording()
  }, [posthog])

  useEffect(() => {
    if (!checkout && !router.query.session_id) return
    if (billingSynced) return
    setBillingSynced(true)
    syncTeamBilling().catch((error) => {
      console.warn('Unable to sync billing state', error)
    })
  }, [checkout, router.query.session_id, billingSynced, syncTeamBilling])

  // Calculate team members count (current members + invites)
  const teamMembersCount = Object.keys(team?.roles || {}).length + teamInvites.length

  const teamPlan = stripePlan(team)
  const baseTeamPlan = stripePlan({ ...team, stripeAddOns: {} })
  const addOnCatalog = getStripeAddOnsFromEnv()
  const activeAddOns = getEffectiveAddOns(team)
  const aiCreditAddOn = addOnCatalog[ADD_ON_IDS.AI_CREDITS]
  const botAddOn = addOnCatalog[ADD_ON_IDS.BOTS]
  const sourcePageAddOn = addOnCatalog[ADD_ON_IDS.SOURCE_PAGES]
  const teamMemberAddOn = addOnCatalog[ADD_ON_IDS.TEAM_MEMBERS]
  const currencyCode = team?.stripeSubscriptionCurrency?.toUpperCase?.() || 'USD'
  const billingInterval =
    team?.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
  const formatPrice = (amount) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      maximumFractionDigits:
        currencyCode === 'JPY' || Number.isInteger(amount) ? 0 : 2,
    }).format(amount || 0)
  const isPaidSubscription =
    !!team?.stripeCustomerId &&
    ['active', 'trialing', 'past_due'].includes(team?.stripeSubscriptionStatus)
  const canManageAddOns =
    isPaidSubscription && !team?.stripeSubscriptionCancelAtPeriodEnd
  const accountTrackingProperties = {
    source: 'account_page',
    teamId: team?.id,
    teamRole: role,
    canManageBilling,
    planId: teamPlan?.id,
    planName: teamPlan?.name,
    basePlanId: baseTeamPlan?.id,
    billingInterval,
    currency: currencyCode,
    subscriptionStatus: team?.stripeSubscriptionStatus || null,
    cancelAtPeriodEnd: Boolean(team?.stripeSubscriptionCancelAtPeriodEnd),
    isPaidSubscription,
    canManageAddOns,
    aiCreditAddOnQuantity: activeAddOns.aiCredits?.quantity || 0,
    botAddOnQuantity: activeAddOns.bots?.quantity || 0,
    sourcePageAddOnQuantity: activeAddOns.sourcePages?.quantity || 0,
    autoIncreaseAiCredits,
    botCount: Number(team?.botCount || 0),
    sourcePageCount: Number(team?.pageCount || 0),
    aiCreditCount: Number(team?.questionCount || 0),
    botLimit: Number(teamPlan?.bots || 0),
    sourcePageLimit: Number(teamPlan?.pages || 0),
    aiCreditLimit: Number(teamPlan?.questions || 0),
  }

  const captureAccountEvent = (eventName, properties = {}) => {
    posthog?.capture(eventName, {
      ...accountTrackingProperties,
      ...properties,
    })
  }

  useEffect(() => {
    if (!canManageAddOns) {
      setAddOnPreview(null)
    }
  }, [canManageAddOns])

  useEffect(() => {
    captureAccountEvent('Account Billing Viewed', {
      hasCheckoutSession: Boolean(checkout || router.query.session_id),
      hasDemoTrialPromotion,
    })
    // Track one account-page view per team mount; event properties should reflect initial page state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [team?.id])

  useEffect(() => {
    setAddOnQuantities({
      [ADD_ON_IDS.AI_CREDITS]: activeAddOns.aiCredits?.quantity || 0,
      [ADD_ON_IDS.BOTS]: activeAddOns.bots?.quantity || 0,
      [ADD_ON_IDS.SOURCE_PAGES]: activeAddOns.sourcePages?.quantity || 0,
      [ADD_ON_IDS.TEAM_MEMBERS]: activeAddOns.teamMembers?.quantity || 0,
    })
  }, [
    activeAddOns.aiCredits?.quantity,
    activeAddOns.bots?.quantity,
    activeAddOns.sourcePages?.quantity,
    activeAddOns.teamMembers?.quantity,
  ])
  const currentPlanLimits = parseStripePlans()?.[teamPlan?.id]
  const actionsPerBotLimit = getBotActionSlotLimit(team)
  const grandfatheredLimits = {
    bots: getGrandfatheredLimit({
      currentPlan: currentPlanLimits,
      resolvedPlan: baseTeamPlan,
      key: 'bots',
    }),
    pages: getGrandfatheredLimit({
      currentPlan: currentPlanLimits,
      resolvedPlan: baseTeamPlan,
      key: 'pages',
    }),
    questions: getGrandfatheredLimit({
      currentPlan: currentPlanLimits,
      resolvedPlan: baseTeamPlan,
      key: 'questions',
    }),
    actionsLimit: getGrandfatheredLimit({
      currentPlan: currentPlanLimits,
      resolvedPlan: baseTeamPlan,
      key: 'actionsLimit',
    }),
    teamMembers: getGrandfatheredLimit({
      currentPlan: currentPlanLimits,
      resolvedPlan: baseTeamPlan,
      key: 'teamMembers',
    }),
  }

  const getAddOnLimitAmount = (addOnId) => {
    const addOn = addOnCatalog?.[addOnId]
    const quantity = activeAddOns?.[addOnId]?.quantity || 0
    if (!quantity || !addOn) return 0
    return quantity * addOn.unit
  }

  const getLimitBreakdown = (limitKey, addOnId) => {
    const addOnAmount = getAddOnLimitAmount(addOnId)
    if (!addOnAmount) return null
    const totalLimit = Number(teamPlan?.[limitKey] || 0)
    return {
      planLimit: Math.max(0, totalLimit - addOnAmount),
      addOnAmount,
    }
  }

  const formatLimitBreakdownTooltip = (label, breakdown) => {
    if (!breakdown) return null
    return `${breakdown.planLimit.toLocaleString()} ${label} from your plan and ${breakdown.addOnAmount.toLocaleString()} from add-ons.`
  }

  const botLimitBreakdown = getLimitBreakdown('bots', ADD_ON_IDS.BOTS)
  const pageLimitBreakdown = getLimitBreakdown('pages', ADD_ON_IDS.SOURCE_PAGES)
  const creditLimitBreakdown = getLimitBreakdown('questions', ADD_ON_IDS.AI_CREDITS)
  const teamMemberLimitBreakdown = getLimitBreakdown(
    'teamMembers',
    ADD_ON_IDS.TEAM_MEMBERS,
  )

  const cards = [
    {
      name: 'Bots',
      tooltip: withGrandfatheredTooltip({
        tooltip: botLimitBreakdown
          ? `You can create up to ${teamPlan.bots.toLocaleString()} bots. ${formatLimitBreakdownTooltip('bots', botLimitBreakdown)}`
          : 'You can create up to ' + teamPlan.bots + ' bots.',
        ...grandfatheredLimits.bots,
      }),
      icon: ServerStackIcon,
      stat: team?.botCount || 0,
      limit: teamPlan.bots,
      grandfathered: grandfatheredLimits.bots.isGrandfathered,
    },
    {
      name: 'Source Pages',
      href: false,
      tooltip: withGrandfatheredTooltip({
        tooltip: pageLimitBreakdown
          ? `A source page is the greater of 5000 characters of processed text or one document/web page. Your limit is ${teamPlan.pages.toLocaleString()} pages. ${formatLimitBreakdownTooltip('pages', pageLimitBreakdown)}`
          : 'A source page is the greater of 5000 characters of processed text or one document/web page.',
        ...grandfatheredLimits.pages,
      }),
      icon: Square3Stack3DIcon,
      stat: team?.pageCount || 0,
      limit: teamPlan.pages,
      grandfathered: grandfatheredLimits.pages.isGrandfathered,
    },
    {
      name: 'AI Credits',
      href: false,
      tooltip: withGrandfatheredTooltip({
        tooltip: creditLimitBreakdown
          ? `AI Credits used in the current month, including chat, skills, and deep research. Your limit is ${teamPlan.questions.toLocaleString()} credits. ${formatLimitBreakdownTooltip('credits', creditLimitBreakdown)}`
          : 'AI Credits used in the current month, including chat, skills, and deep research.',
        ...grandfatheredLimits.questions,
      }),
      icon: ChatBubbleBottomCenterTextIcon,
      stat: roundAiCreditsForDisplay(team?.questionCount),
      limit: teamPlan.questions,
      grandfathered: grandfatheredLimits.questions.isGrandfathered,
    },
    {
      name: 'Actions per Bot',
      tooltip: withGrandfatheredTooltip({
        tooltip: actionsPerBotLimit > 0
          ? `Your ${teamPlan.name} plan allows up to ${actionsPerBotLimit} actions per bot.`
          : 'Actions are not available on your current plan.',
        ...grandfatheredLimits.actionsLimit,
      }),
      icon: WrenchScrewdriverIcon,
      stat: actionsPerBotLimit,
      grandfathered: grandfatheredLimits.actionsLimit.isGrandfathered,
    },
    {
      name: 'Team Members',
      tooltip: withGrandfatheredTooltip({
        tooltip: teamMemberLimitBreakdown
          ? `Current team members including invites. Your limit is ${teamPlan.teamMembers.toLocaleString()} members. ${formatLimitBreakdownTooltip('members', teamMemberLimitBreakdown)}`
          : 'Current team members including invites. Your plan allows up to ' + teamPlan.teamMembers + ' members.',
        ...grandfatheredLimits.teamMembers,
      }),
      icon: UsersIcon,
      stat: teamMembersCount,
      limit: teamPlan.teamMembers,
      grandfathered: grandfatheredLimits.teamMembers.isGrandfathered,
    },
  ]

  const getCurrentUsageForAddOn = (addOn) => {
    if (addOn?.limitKey === 'questions') return Number(team?.questionCount || 0)
    if (addOn?.limitKey === 'bots') return Number(team?.botCount || 0)
    if (addOn?.limitKey === 'pages') return Number(team?.pageCount || 0)
    if (addOn?.limitKey === 'teamMembers') return teamMembersCount
    return 0
  }

  const getBaseLimitForAddOn = (addOn) =>
    Number(baseTeamPlan?.[addOn?.limitKey] || 0)

  const getMinimumAddOnQuantity = (addOn, activeQuantity = 0) => {
    if (!addOn?.limitKey || !addOn?.unit) return 0
    const currentUsage = getCurrentUsageForAddOn(addOn)
    const baseLimit = getBaseLimitForAddOn(addOn, activeQuantity)
    return Math.max(0, Math.ceil((currentUsage - baseLimit) / addOn.unit))
  }

  const getAddOnUnitName = (addOn, amount = 0) => {
    if (addOn?.limitKey === 'questions') return 'credits'
    if (addOn?.limitKey === 'pages') return 'pages'
    if (addOn?.limitKey === 'bots') return amount === 1 ? 'bot' : 'bots'
    if (addOn?.limitKey === 'teamMembers') {
      return amount === 1 ? 'team user' : 'team users'
    }
    return addOn?.unitLabel || 'units'
  }

  const formatAddOnCapacity = (addOn, quantity = 0) => {
    const amount = Number(quantity || 0) * Number(addOn?.unit || 1)
    return `${amount.toLocaleString()} ${getAddOnUnitName(addOn, amount)}`
  }

  const formatAddOnDropdownOption = (
    addOn,
    blockQuantity,
    { priceLabel = null, isCurrent = false } = {},
  ) => {
    if (blockQuantity === 0) return 'None'
    const capacity = formatAddOnCapacity(addOn, blockQuantity)
    const suffix = [
      priceLabel ? `— ${priceLabel}` : null,
      isCurrent ? '(current)' : null,
    ]
      .filter(Boolean)
      .join(' ')
    return suffix ? `${capacity} ${suffix}` : capacity
  }

  const getAddOnBlockOptionLimit = (activeQuantity = 0, minimumQuantity = 0) =>
    Math.min(50, Math.max(10, activeQuantity + 10, minimumQuantity + 5))

  const getAddOnRecurringLabel = (price, interval = 'monthly') =>
    interval === 'annually' ? `${formatPrice(price)}/year` : `${formatPrice(price)}/month`

  const getAddOnById = (addOnId) => addOnCatalog?.[addOnId] || null
  const addOnIsAvailableForPlan = (addOn) =>
    isAddOnAvailableForPlan(addOn, teamPlan)

  async function previewAddOnQuantity(addOnId, quantity) {
    const addOn = getAddOnById(addOnId)
    const currentQuantity = activeAddOns?.[addOnId]?.quantity || 0
    captureAccountEvent('Account Add-On Preview Started', {
      addOnId,
      addOnName: addOn?.name || addOnId,
      currentQuantity,
      requestedQuantity: Number(quantity || 0),
      quantityDelta: Number(quantity || 0) - currentQuantity,
    })
    setOpeningAddOns(true)
    setErrorText(null)
    try {
      const response = await fetch(`/api/teams/${team.id}/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'previewQuantity', addOnId, quantity }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to preview add-on change.')
      }
      setAddOnPreview({ addOnId, quantity, ...data.preview })
      captureAccountEvent('Account Add-On Previewed', {
        addOnId,
        addOnName: addOn?.name || addOnId,
        currentQuantity,
        requestedQuantity: Number(quantity || 0),
        nextQuantity: Number(data.preview?.nextQuantity || quantity || 0),
        quantityDelta: Number(quantity || 0) - currentQuantity,
        amountDue: Number(data.preview?.amountDue || 0),
        total: Number(data.preview?.total || 0),
        creditAmount: Number(data.preview?.creditAmount || 0),
        accountCreditApplied: Number(data.preview?.accountCreditApplied || 0),
      })
    } catch (error) {
      captureAccountEvent('Account Add-On Preview Failed', {
        addOnId,
        addOnName: addOn?.name || addOnId,
        currentQuantity,
        requestedQuantity: Number(quantity || 0),
        quantityDelta: Number(quantity || 0) - currentQuantity,
        error: error.message,
      })
      setErrorText(error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setOpeningAddOns(false)
    }
  }

  async function confirmAddOnQuantity() {
    if (!addOnPreview) return
    const addOn = getAddOnById(addOnPreview.addOnId)
    const currentQuantity = activeAddOns?.[addOnPreview.addOnId]?.quantity || 0
    captureAccountEvent('Account Add-On Confirm Started', {
      addOnId: addOnPreview.addOnId,
      addOnName: addOn?.name || addOnPreview.addOnId,
      currentQuantity,
      requestedQuantity: Number(addOnPreview.quantity || 0),
      nextQuantity: Number(addOnPreview.nextQuantity || addOnPreview.quantity || 0),
      quantityDelta: Number(addOnPreview.quantity || 0) - currentQuantity,
      amountDue: Number(addOnPreview.amountDue || 0),
      creditAmount: Number(addOnPreview.creditAmount || 0),
      accountCreditApplied: Number(addOnPreview.accountCreditApplied || 0),
    })
    setOpeningAddOns(true)
    setErrorText(null)
    try {
      const response = await fetch(`/api/teams/${team.id}/addons`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'confirmQuantity',
          addOnId: addOnPreview.addOnId,
          quantity: addOnPreview.quantity,
          prorationDate: addOnPreview.prorationDate,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update add-ons.')
      }
      if (data.paymentAction?.requiresAction) {
        captureAccountEvent('Account Add-On Payment Action Required', {
          addOnId: addOnPreview.addOnId,
          addOnName: addOn?.name || addOnPreview.addOnId,
          currentQuantity,
          requestedQuantity: Number(addOnPreview.quantity || 0),
        })
        await completeStripePaymentAction(data.paymentAction)
        applyTeamBillingUpdate({
          stripeAddOns: data.stripeAddOns,
          questionLimit: data.questionLimit,
        })
        setAddOnPreview(null)
        setSuccessText('Add-ons updated.')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        captureAccountEvent('Account Add-On Updated', {
          addOnId: addOnPreview.addOnId,
          addOnName: addOn?.name || addOnPreview.addOnId,
          currentQuantity,
          requestedQuantity: Number(addOnPreview.quantity || 0),
          nextQuantity: Number(addOnPreview.nextQuantity || addOnPreview.quantity || 0),
          quantityDelta: Number(addOnPreview.quantity || 0) - currentQuantity,
          requiredPaymentAction: true,
        })
        return
      }
      applyTeamBillingUpdate({
        stripeAddOns: data.stripeAddOns,
        questionLimit: data.questionLimit,
      })
      setAddOnPreview(null)
      setSuccessText('Add-ons updated.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      captureAccountEvent('Account Add-On Updated', {
        addOnId: addOnPreview.addOnId,
        addOnName: addOn?.name || addOnPreview.addOnId,
        currentQuantity,
        requestedQuantity: Number(addOnPreview.quantity || 0),
        nextQuantity: Number(addOnPreview.nextQuantity || addOnPreview.quantity || 0),
        quantityDelta: Number(addOnPreview.quantity || 0) - currentQuantity,
        requiredPaymentAction: false,
      })
    } catch (error) {
      captureAccountEvent('Account Add-On Update Failed', {
        addOnId: addOnPreview.addOnId,
        addOnName: addOn?.name || addOnPreview.addOnId,
        currentQuantity,
        requestedQuantity: Number(addOnPreview.quantity || 0),
        quantityDelta: Number(addOnPreview.quantity || 0) - currentQuantity,
        error: error.message,
      })
      setErrorText(error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setOpeningAddOns(false)
    }
  }

  const updateAddOnBlockQuantity = (addOnId, value, minQuantity = 0) => {
    const nextQuantity = Math.max(minQuantity, Number(value) || 0)
    const currentQuantity = activeAddOns?.[addOnId]?.quantity || 0
    const addOn = getAddOnById(addOnId)
    captureAccountEvent('Account Add-On Quantity Selected', {
      addOnId,
      addOnName: addOn?.name || addOnId,
      currentQuantity,
      selectedQuantity: nextQuantity,
      quantityDelta: nextQuantity - currentQuantity,
      minimumQuantity: minQuantity,
    })
    setAddOnQuantities((current) => ({
      ...current,
      [addOnId]: nextQuantity,
    }))
  }

  async function updateAutoIncreaseAiCredits(enabled) {
    captureAccountEvent('Account Add-On Auto Increase Toggled', {
      enabled,
      previousEnabled: autoIncreaseAiCredits,
    })
    setAutoIncreaseAiCredits(enabled)
    setErrorText(null)
    try {
      const response = await fetch(`/api/teams/${team.id}/addons`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ autoIncreaseAiCredits: enabled }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Unable to update AI credit setting.')
      }
      captureAccountEvent('Account Add-On Auto Increase Updated', {
        enabled,
      })
    } catch (error) {
      captureAccountEvent('Account Add-On Auto Increase Failed', {
        enabled,
        error: error.message,
      })
      setAutoIncreaseAiCredits(!enabled)
      setErrorText(error.message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <DashboardWrap page="Account" team={team} bots={bots}>
      {/* {checkout && (
        <Script id="gtag-conversion" strategy="lazyOnload">
          {`
        gtag('event', 'conversion', {
            'send_to': 'AW-412141971/oMEgCP3e7JMZEJOTw8QB',
            'value': ${checkout.value},
            'currency': '${checkout.currency}',
            'transaction_id': '${checkout.id}'
        });
        `}
        </Script>
      )} */}

      <Alert title={errorText} type="error" />
      <Alert title={successText} type="success" />

      <div className="mb-6 flex items-center gap-3 text-2xl font-semibold text-gray-700">
        <CheckBadgeIcon className="h-8 w-8 text-cyan-600" aria-hidden="true" />
        <span>
          Current plan:{' '}
          <span className="font-bold text-gray-950">{teamPlan.name}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 2xl:grid-cols-5">
        {/* Card */}
        {cards.map((card) => (
          <Card
            key={card.name}
            name={card.name}
            href={card.href}
            linkText={card.linkText}
            tooltip={card.tooltip}
            CardIcon={card.icon}
            stat={card.stat}
            limit={card.limit}
            grandfathered={card.grandfathered}
          />
        ))}
      </div>

      {canManageBilling && (
        <>
          {addOnPreview && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 px-4">
              <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <h3 className="text-xl font-semibold text-gray-950">
                  Confirm add-on change
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Review the prorated billing impact before updating your subscription.
                </p>
                <div className="mt-5 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">New add-on capacity</span>
                    <span className="font-semibold text-gray-950">
                      {formatAddOnCapacity(
                        getAddOnById(addOnPreview.addOnId),
                        addOnPreview.nextQuantity,
                      )}
                    </span>
                  </div>
                  {addOnPreview.lines?.length > 0 && (
                    <div className="max-h-56 overflow-y-auto border-b border-gray-200 px-4 py-3">
                      <ul className="space-y-3">
                        {addOnPreview.lines.map((line) => (
                          <li
                            key={line.id}
                            className="flex items-start justify-between gap-4 text-sm"
                          >
                            <div className="min-w-0">
                              <div className="text-gray-600">{line.description}</div>
                              {line.periodLabel && (
                                <div className="mt-0.5 text-xs text-gray-400">
                                  {line.periodLabel}
                                </div>
                              )}
                            </div>
                            <span className="shrink-0 font-medium text-gray-900">
                              {line.formattedAmount}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {addOnPreview.accountCreditApplied > 0 && (
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 text-sm">
                      <span className="text-gray-600">Account credit applied</span>
                      <span className="font-medium text-gray-900">
                        -{addOnPreview.formattedAccountCreditApplied}
                      </span>
                    </div>
                  )}
                  {addOnPreview.creditAmount > 0 && (
                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-4 py-3 text-sm">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        Credit kept for future invoices
                        <Tooltip content={RETAINED_CREDIT_TOOLTIP}>
                          <span
                            className="inline-flex cursor-help text-gray-400"
                            aria-label={RETAINED_CREDIT_TOOLTIP}
                          >
                            <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                          </span>
                        </Tooltip>
                      </span>
                      <span className="shrink-0 font-medium text-gray-900">
                        {addOnPreview.formattedCreditAmount}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Amount due now</span>
                    <span className="font-semibold text-gray-950">
                      {addOnPreview.formattedAmountDue}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      captureAccountEvent('Account Add-On Preview Cancelled', {
                        addOnId: addOnPreview.addOnId,
                        addOnName:
                          getAddOnById(addOnPreview.addOnId)?.name || addOnPreview.addOnId,
                        requestedQuantity: Number(addOnPreview.quantity || 0),
                        nextQuantity: Number(
                          addOnPreview.nextQuantity || addOnPreview.quantity || 0,
                        ),
                      })
                      setAddOnPreview(null)
                    }}
                    disabled={openingAddOns}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmAddOnQuantity}
                    disabled={openingAddOns}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-25"
                  >
                    {openingAddOns ? <LoadingSpinner /> : 'Confirm update'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg bg-white p-8 shadow">
            <Checkout
              team={team}
              bots={bots}
              teamInvites={teamInvites}
              teamSourceTypes={teamSourceTypes}
              hasDemoTrialPromotion={hasDemoTrialPromotion}
              onBillingChange={handleBillingChange}
              trackingContext={accountTrackingProperties}
            />
            <Cancel
              team={team}
              bots={bots}
              teamInvites={teamInvites}
              teamSourceTypes={teamSourceTypes}
              setParentErrorText={setErrorText}
              onBillingChange={handleBillingChange}
              trackingContext={accountTrackingProperties}
            />
          </div>

          {canManageAddOns && (
            <div className="mt-6 rounded-lg bg-white p-8 shadow">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="w-full">
                  <h3 className="text-2xl font-bold">Add-ons</h3>
                  <p className="text-md mt-2 w-full text-gray-800">
                    Scale your plan without upgrading. Add-ons renew on your billing cycle, and
                    changes are prorated on your next invoice.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {[
                  {
                    addOn: aiCreditAddOn,
                    quantity: activeAddOns.aiCredits?.quantity || 0,
                    actionId: ADD_ON_IDS.AI_CREDITS,
                    Icon: ChatBubbleBottomCenterTextIcon,
                  },
                  {
                    addOn: botAddOn,
                    quantity: activeAddOns.bots?.quantity || 0,
                    actionId: ADD_ON_IDS.BOTS,
                    Icon: ServerStackIcon,
                  },
                  {
                    addOn: sourcePageAddOn,
                    quantity: activeAddOns.sourcePages?.quantity || 0,
                    actionId: ADD_ON_IDS.SOURCE_PAGES,
                    Icon: Square3Stack3DIcon,
                  },
                  {
                    addOn: teamMemberAddOn,
                    quantity: activeAddOns.teamMembers?.quantity || 0,
                    actionId: ADD_ON_IDS.TEAM_MEMBERS,
                    Icon: UsersIcon,
                  },
                ].map(({ addOn, quantity, actionId, Icon }) => {
                  if (!addOn) return null
                  const minimumQuantity = getMinimumAddOnQuantity(addOn, quantity)
                  const selectedQuantity = addOnQuantities[actionId] ?? quantity
                  const availableForPlan = addOnIsAvailableForPlan(addOn)
                  const belowMinimum = selectedQuantity < minimumQuantity
                  const unchanged = selectedQuantity === quantity
                  const addOnPrice = getAddOnDisplayPrice(addOn, currencyCode, billingInterval)
                  const monthlyEquivalent =
                    billingInterval === 'annually' ? addOnPrice / 12 : addOnPrice
                  const blockOptionLimit = getAddOnBlockOptionLimit(quantity, minimumQuantity)
                  const recurringIntervalLabel = billingInterval === 'annually' ? 'year' : 'month'
                  return (
                    <div key={addOn.id} className="rounded-lg border border-gray-200 p-4">
                      <div>
                        <h4 className="flex items-center gap-2 font-semibold text-gray-950">
                          <Icon className="h-5 w-5 shrink-0 text-cyan-600" aria-hidden="true" />
                          <span>{addOn.name}</span>
                        </h4>
                        <p className="mt-1 text-sm text-gray-600">{addOn.description}</p>
                      </div>
                      <p className="mt-4 text-sm text-gray-700">
                        <span className="text-2xl font-bold text-gray-950">
                          {formatPrice(monthlyEquivalent)}
                        </span>
                        <span className="ml-1 text-sm text-gray-600">
                          /month per {addOn.unitLabel}
                        </span>
                      </p>
                      {billingInterval === 'annually' && (
                        <p className="mt-1 text-xs text-gray-500">
                          {formatPrice(addOnPrice)} billed annually.
                        </p>
                      )}
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">
                          Current subscription:{' '}
                          <span className="font-medium text-gray-900">
                            {quantity > 0
                              ? `${formatAddOnCapacity(addOn, quantity)} (${formatPrice(addOnPrice * quantity)}/${recurringIntervalLabel})`
                              : 'None'}
                          </span>
                        </p>
                        <label
                          htmlFor={`addon-${actionId}-quantity`}
                          className="sr-only"
                        >
                          Adjust add-on
                        </label>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <select
                            id={`addon-${actionId}-quantity`}
                            value={selectedQuantity}
                            disabled={!availableForPlan}
                            onChange={(event) =>
                              updateAddOnBlockQuantity(
                                actionId,
                                event.target.value,
                                minimumQuantity,
                              )
                            }
                            className="block min-w-0 flex-1 rounded-md border-gray-300 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500"
                          >
                            {Array.from({ length: blockOptionLimit + 1 }, (_, blockQuantity) => (
                              <option
                                key={blockQuantity}
                                value={blockQuantity}
                                disabled={blockQuantity < minimumQuantity}
                              >
                                {formatAddOnDropdownOption(addOn, blockQuantity, {
                                  priceLabel:
                                    blockQuantity > 0
                                      ? getAddOnRecurringLabel(
                                          addOnPrice * blockQuantity,
                                          billingInterval,
                                        )
                                      : null,
                                  isCurrent: blockQuantity === quantity,
                                })}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() =>
                              previewAddOnQuantity(
                                actionId,
                                addOnQuantities[actionId] ?? quantity,
                              )
                            }
                            disabled={
                              openingAddOns ||
                              belowMinimum ||
                              unchanged ||
                              !availableForPlan
                            }
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-25"
                          >
                            Change
                          </button>
                        </div>
                        {!availableForPlan && (
                          <p className="mt-2 text-xs text-gray-500">
                            Extra team users are available on Business and
                            Enterprise plans.
                          </p>
                        )}
                        {minimumQuantity > 0 && (
                          <p className="mt-2 text-xs text-gray-500">
                            Your current usage needs at least{' '}
                            {formatAddOnCapacity(addOn, minimumQuantity)} from add-ons. You
                            can&apos;t reduce below this until usage drops
                            {addOn?.limitKey === 'questions'
                              ? ', or at the start of the next calendar month when your AI credit usage resets'
                              : ''}
                            .
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 flex items-center justify-between rounded-lg border border-gray-200 p-4">
                <div>
                  <h4 className="font-semibold text-gray-950">Auto-add AI credits</h4>
                  <p className="mt-1 text-sm text-gray-600">
                    When you hit your monthly limit, automatically increase your AI credits add-on
                    subscription by 5,000 credits so bots keep responding.
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={autoIncreaseAiCredits}
                    onChange={(event) =>
                      updateAutoIncreaseAiCredits(event.target.checked)
                    }
                  />
                  <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-cyan-600 peer-checked:after:translate-x-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500 peer-focus:ring-offset-2" />
                </label>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 gap-6 md:grid md:grid-cols-2">
        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Update your name</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can update your display name here. This will update your name across the app.
          </p>
          {isGoogleAccount ? (
            <p className="mt-3 text-sm text-gray-500">
              Your account is linked to Google. To change your name, update it in your Google account.
            </p>
          ) : (
          <div>
            <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
              Display Name
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="text"
                  id="display_name"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  className={`block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm ${
                    isUpdatingName ? 'bg-gray-100 text-gray-500' : ''
                  }`}
                  placeholder="Your name"
                  disabled={isGoogleAccount || isUpdatingName}
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsUpdatingName(true)
                  updateProfile(auth.currentUser, { displayName: newDisplayName })
                    .then(() => {
                      setSuccessText('Name updated successfully')
                      setErrorText(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    })
                    .catch((error) => {
                      setErrorText(error.message)
                      setSuccessText(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    })
                    .finally(() => {
                      setIsUpdatingName(false)
                    })
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                disabled={isGoogleAccount || !newDisplayName || newDisplayName === (user?.displayName || '') || isUpdatingName}
              >
                {isUpdatingName ? <LoadingSpinner /> : 'Update'}
              </button>
            </div>
          </div>
          )}
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Update your email address</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can update your email address here. This will update your email address for all of
            your teams.
          </p>
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
              New Email
            </label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="email"
                  id="team_id"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Email"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  updateEmail(auth.currentUser, newEmail)
                    .then(() => {
                      setSuccessText('Email updated successfully')
                      setErrorText(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    })
                    .catch((error) => {
                      setErrorText(
                        error.message +
                          " If you havn't recently logged in to your account, you may need log out then back in to change your email address for security reasons."
                      )
                      setSuccessText(null)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    })
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-8 shadow">
          <h3 className="text-2xl font-bold">Reset your password</h3>
          <p className="text-md mt-2 text-justify text-gray-800">
            You can request a password reset email here. This will send a password reset email to
            your email address. Please check your spam folder if you do not receive the email.
          </p>
          <div className="mt-5 flex justify-end">
            <ModalPasswordReset team={team} />
          </div>
        </div>

        {isOwner && (
          <div className="rounded-lg bg-white p-8 shadow">
            <h3 className="text-2xl font-bold">Delete Team Account</h3>
            <p className="text-md mt-2 text-justify text-gray-800">
              You can delete your team account here. This will delete all of your bots, sources,
              questions, keys, any other data, and remove all team members. This action cannot be
              undone and you should cancel any subscriptions before deleting your team account.
            </p>
            <div className="mt-5 flex justify-end">
              <ModalDeleteAccount team={team} />
            </div>
          </div>
        )}
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  if (data?.redirect) return data

  const cookies = cookie.parse(context.req?.headers?.cookie || '')
  const demoCode = cookies['docsbot_demo_trial']
  data.props = data.props || {}
  data.props.hasDemoTrialPromotion = Boolean(
    demoCode && verifyDemoTrialToken(demoCode)
  )

  if (data?.props?.team) {
    const role = getUserRole(data.props.team, data.props.userId)
    data.props.role = role
    if (role === 'none') {
      return {
        redirect: {
          destination: '/app',
          permanent: false,
        },
      }
    }
    data.props.canManageBilling = canUserManageBilling(
      data.props.team,
      data.props.userId,
    )
    data.props.bots = await getBots(data.props.team)
    data.props.teamSourceTypes = await getTeamSourceTypeIds(data.props.team.id)

    // Fetch team invites for member count calculation
    data.props.teamInvites = await getInvitesFromTeam(data.props.team.id)
  }

  // Check if session_id is present in the query parameters
  if (context.query.session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(context.query.session_id, {
        expand: ['subscription', 'subscription.items.data.price'],
      })

      data.props.checkout = {
        id: session.id,
        value: session.amount_total / 100,
        currency: session.currency.toUpperCase(),
      }

      if (data.props.team && session.subscription && typeof session.subscription === 'object') {
        const billingUpdate = buildTeamBillingUpdate({
          team: data.props.team,
          subscription: session.subscription,
        })
        if (billingUpdate) {
          configureFirebaseApp()
          await getFirestore().collection('teams').doc(data.props.team.id).update(billingUpdate)
          data.props.team = { ...data.props.team, ...billingUpdate }
        } else if (data.props.team?.stripeSubscriptionId) {
          const syncedBilling = await syncTeamBillingFromStripe({
            team: data.props.team,
          })
          if (syncedBilling) {
            configureFirebaseApp()
            await getFirestore().collection('teams').doc(data.props.team.id).update(syncedBilling)
            data.props.team = { ...data.props.team, ...syncedBilling }
          }
        }
      }
    } catch (err) {
      console.error('Error retrieving checkout session:', err.message)
    }
  }

  return data
}

export default Account
