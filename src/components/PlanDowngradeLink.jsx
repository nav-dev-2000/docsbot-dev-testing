import { Fragment, useEffect, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import { usePostHog } from 'posthog-js/react'
import { stripePlan, hasGrandfatheredPlanLimits } from '@/utils/helpers'
import GrandfatheredPlanWarning, {
  getGrandfatheredDowngradeWarningMessage,
} from '@/components/GrandfatheredPlanWarning'
import LoadingSpinner from '@/components/LoadingSpinner'
import PlanChangePreviewModal from '@/components/PlanChangePreviewModal'
import { completeStripePaymentAction } from '@/utils/stripePaymentActionClient'
import {
  getEligibleLowerPlanOptions,
  getPlanDowngradeLosses,
} from '@/utils/planDowngrade'

export default function PlanDowngradeLink({
  team,
  bots = [],
  teamInvites = [],
  teamSourceTypes = [],
  setErrorText,
  onBillingChange = null,
  trackingContext = {},
}) {
  const posthog = usePostHog()
  const [open, setOpen] = useState(false)
  const [selectedTierId, setSelectedTierId] = useState('')
  const [opening, setOpening] = useState(false)
  const [planChangePreview, setPlanChangePreview] = useState(null)
  const [pendingPlanChange, setPendingPlanChange] = useState(null)

  const currentPlan = stripePlan(team)
  const isGrandfatheredPlan = hasGrandfatheredPlanLimits(team)
  const lowerPlanOptions = useMemo(
    () =>
      getEligibleLowerPlanOptions({
        team,
        bots,
        teamInvites,
        teamSourceTypes,
      }),
    [team, bots, teamInvites, teamSourceTypes],
  )

  const selectedTier = lowerPlanOptions.find((tier) => tier.id === selectedTierId)
  const downgradeLosses = useMemo(() => {
    if (!selectedTierId || !currentPlan?.id) return []
    return getPlanDowngradeLosses({
      currentPlanId: currentPlan.id,
      targetPlanId: selectedTierId,
    })
  }, [selectedTierId, currentPlan?.id])

  useEffect(() => {
    if (!open) {
      setSelectedTierId('')
      setPlanChangePreview(null)
      setPendingPlanChange(null)
      return
    }
    if (!lowerPlanOptions.some((tier) => tier.id === selectedTierId)) {
      setSelectedTierId(lowerPlanOptions[0]?.id || '')
    }
  }, [open, lowerPlanOptions, selectedTierId])

  if (lowerPlanOptions.length === 0) return null

  const frequency =
    team?.stripeSubscriptionInterval === 'year' ? 'annually' : 'monthly'
  const currency = team?.stripeSubscriptionCurrency?.toUpperCase?.() || 'USD'

  const captureDowngradeEvent = (eventName, properties = {}) => {
    posthog?.capture(eventName, {
      source: 'account_page',
      ...trackingContext,
      currentPlanId: currentPlan?.id,
      currentPlanName: currentPlan?.name,
      selectedTierId,
      selectedTierName: selectedTier?.name || null,
      lowerPlanOptionCount: lowerPlanOptions.length,
      downgradeLossCount: downgradeLosses.length,
      isGrandfatheredPlan,
      ...properties,
    })
  }

  async function previewPlanChange() {
    if (!selectedTierId) return
    captureDowngradeEvent('Account Downgrade Preview Started', {
      targetPlanId: selectedTierId,
      targetPlanName: selectedTier?.name || null,
      frequency,
      currency,
    })
    setErrorText?.(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/subscription-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'preview',
        tier: selectedTierId,
        frequency,
        currency,
      }),
    })
    if (response.ok) {
      const data = await response.json()
      setPendingPlanChange({
        tier: selectedTierId,
        frequency,
        currency,
      })
      setPlanChangePreview(data.preview)
      captureDowngradeEvent('Account Downgrade Previewed', {
        targetPlanId: selectedTierId,
        targetPlanName: selectedTier?.name || null,
        frequency,
        currency,
        amountDue: Number(data.preview?.amountDue || 0),
        total: Number(data.preview?.total || 0),
        creditAmount: Number(data.preview?.creditAmount || 0),
        accountCreditApplied: Number(data.preview?.accountCreditApplied || 0),
      })
      setOpening(false)
      return
    }
    try {
      const data = await response.json()
      captureDowngradeEvent('Account Downgrade Preview Failed', {
        targetPlanId: selectedTierId,
        targetPlanName: selectedTier?.name || null,
        frequency,
        currency,
        status: response.status,
        error: data.message || 'Something went wrong, please try again.',
      })
      setErrorText?.(data.message || 'Something went wrong, please try again.')
    } catch (e) {
      captureDowngradeEvent('Account Downgrade Preview Failed', {
        targetPlanId: selectedTierId,
        targetPlanName: selectedTier?.name || null,
        frequency,
        currency,
        status: response.status,
        error: 'Error ' + response.status,
      })
      setErrorText?.('Error ' + response.status + ', please try again.')
    }
    setOpening(false)
  }

  async function confirmPlanChange() {
    if (!pendingPlanChange || !planChangePreview) return
    captureDowngradeEvent('Account Downgrade Confirm Started', {
      targetPlanId: pendingPlanChange.tier,
      frequency: pendingPlanChange.frequency,
      currency: pendingPlanChange.currency,
      amountDue: Number(planChangePreview.amountDue || 0),
      total: Number(planChangePreview.total || 0),
      creditAmount: Number(planChangePreview.creditAmount || 0),
      accountCreditApplied: Number(planChangePreview.accountCreditApplied || 0),
    })
    setErrorText?.(null)
    setOpening(true)
    const response = await fetch(`/api/teams/${team.id}/subscription-change`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'confirm',
        ...pendingPlanChange,
        prorationDate: planChangePreview.prorationDate,
      }),
    })
    if (response.ok) {
      try {
        const data = await response.json()
        if (data.paymentAction?.requiresAction) {
          captureDowngradeEvent('Account Downgrade Payment Action Required', {
            targetPlanId: pendingPlanChange.tier,
          })
          await completeStripePaymentAction(data.paymentAction)
        }
      } catch (error) {
        captureDowngradeEvent('Account Downgrade Failed', {
          targetPlanId: pendingPlanChange.tier,
          error: error.message || 'Payment verification was not completed.',
        })
        setErrorText?.(error.message || 'Payment verification was not completed.')
        setOpening(false)
        return
      }
      captureDowngradeEvent('Account Downgrade Confirmed', {
        targetPlanId: pendingPlanChange.tier,
        frequency: pendingPlanChange.frequency,
        currency: pendingPlanChange.currency,
      })
      setOpen(false)
      setPlanChangePreview(null)
      setPendingPlanChange(null)
      if (onBillingChange) {
        try {
          await onBillingChange()
        } catch (error) {
          setErrorText?.(
            error.message || 'Plan updated, but billing details could not be refreshed.',
          )
        }
        setOpening(false)
        return
      }
      window.location.reload()
      return
    }
    try {
      const data = await response.json()
      captureDowngradeEvent('Account Downgrade Failed', {
        targetPlanId: pendingPlanChange.tier,
        status: response.status,
        error: data.message || 'Something went wrong, please try again.',
      })
      setErrorText?.(data.message || 'Something went wrong, please try again.')
    } catch (e) {
      captureDowngradeEvent('Account Downgrade Failed', {
        targetPlanId: pendingPlanChange.tier,
        status: response.status,
        error: 'Error ' + response.status,
      })
      setErrorText?.('Error ' + response.status + ', please try again.')
    }
    setOpening(false)
  }

  const closeModal = () => {
    if (opening) return
    captureDowngradeEvent('Account Downgrade Cancelled', {
      targetPlanId: selectedTierId || null,
      targetPlanName: selectedTier?.name || null,
    })
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="text-sm font-medium text-cyan-700 hover:text-cyan-900 hover:underline focus:outline-none"
        onClick={() => {
          captureDowngradeEvent('Account Downgrade Started', {
            defaultTargetPlanId: lowerPlanOptions[0]?.id || null,
            defaultTargetPlanName: lowerPlanOptions[0]?.name || null,
          })
          setOpen(true)
        }}
      >
        Switch to a lower plan
      </button>

      <PlanChangePreviewModal
        preview={planChangePreview}
        opening={opening}
        onClose={() => {
          captureDowngradeEvent('Account Downgrade Preview Cancelled', {
            targetPlanId: pendingPlanChange?.tier || selectedTierId || null,
          })
          setPlanChangePreview(null)
          setPendingPlanChange(null)
        }}
        onConfirm={confirmPlanChange}
      />

      <Transition.Root show={open && !planChangePreview} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/50 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform rounded-lg bg-white p-6 text-left shadow-xl transition-all">
                  <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100">
                          <ExclamationTriangleIcon
                            className="h-5 w-5 text-amber-600"
                            aria-hidden="true"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <Dialog.Title className="text-lg font-semibold text-gray-900">
                            Switch to a lower plan
                          </Dialog.Title>
                          <p className="mt-2 text-sm text-gray-600">
                            You are currently on the {currentPlan.name} plan. Choose a lower plan
                            to see what changes. Your add-ons stay active.
                          </p>
                        </div>
                      </div>

                      <div className="mt-5">
                        <label
                          htmlFor="downgrade-plan-select"
                          className="block text-sm font-medium text-gray-700"
                        >
                          New plan
                        </label>
                        <select
                          id="downgrade-plan-select"
                          value={selectedTierId}
                          onChange={(event) => {
                            const nextTier = lowerPlanOptions.find(
                              (tier) => tier.id === event.target.value,
                            )
                            captureDowngradeEvent('Account Downgrade Target Selected', {
                              targetPlanId: event.target.value,
                              targetPlanName: nextTier?.name || null,
                            })
                            setSelectedTierId(event.target.value)
                          }}
                          disabled={lowerPlanOptions.length <= 1}
                          className="mt-2 block w-full rounded-md border-gray-300 text-sm shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-700"
                        >
                          {lowerPlanOptions.map((tier) => (
                            <option key={tier.id} value={tier.id}>
                              {tier.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedTier && (
                        <>
                          {isGrandfatheredPlan && (
                            <GrandfatheredPlanWarning
                              message={getGrandfatheredDowngradeWarningMessage(currentPlan.name)}
                            />
                          )}
                          <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-4">
                          <h4 className="text-sm font-semibold text-amber-900">
                            What you lose moving to {selectedTier.name}
                          </h4>
                          {downgradeLosses.length > 0 ? (
                            <ul className="mt-3 space-y-2 text-sm text-amber-950">
                              {downgradeLosses.map((loss) => (
                                <li key={`${loss.type}-${loss.label}`} className="flex gap-2">
                                  <span aria-hidden="true" className="text-amber-600">
                                    -
                                  </span>
                                  <span>
                                    {loss.type === 'limit' ? (
                                      <>
                                        <span className="font-medium">{loss.label}</span>
                                        {': '}
                                        {loss.from} → {loss.to}
                                      </>
                                    ) : loss.from && loss.to ? (
                                      <>
                                        <span className="font-medium">{loss.label}</span>
                                        {': '}
                                        {loss.from} → {loss.to}
                                      </>
                                    ) : (
                                      <>
                                        <span className="font-medium">{loss.label}</span>
                                        {' — no longer included'}
                                      </>
                                    )}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-3 text-sm text-amber-950">
                              This plan has lower included limits, but no additional feature
                              removals were detected.
                            </p>
                          )}
                          <p className="mt-3 text-xs text-amber-800">
                            Add-ons are unchanged. Only the plan&apos;s included limits and
                            features change.
                          </p>
                        </div>
                        </>
                      )}

                      <div className="mt-6 flex justify-end gap-3">
                        <button
                          type="button"
                          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          onClick={closeModal}
                          disabled={opening}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                          onClick={previewPlanChange}
                          disabled={opening || !selectedTierId}
                        >
                          {opening ? <LoadingSpinner /> : 'Review billing change'}
                        </button>
                      </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </>
  )
}
