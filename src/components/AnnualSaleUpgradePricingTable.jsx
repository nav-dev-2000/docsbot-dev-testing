import { StripePricingTable } from '@/components/StripePricing'

export default function AnnualSaleUpgradePricingTable({
  team,
  email,
  setErrorText,
  bots = null,
  teamInvites = [],
  teamSourceTypes = [],
  onBillingChange = null,
}) {
  // Promo ended: keep wrapper component to avoid touching callers.
  return (
    <StripePricingTable
      team={team}
      email={email}
      setErrorText={setErrorText}
      mode="upgrade"
      defaultFrequency="annually"
      bots={bots}
      teamInvites={teamInvites}
      teamSourceTypes={teamSourceTypes}
      onBillingChange={onBillingChange}
    />
  )
}
