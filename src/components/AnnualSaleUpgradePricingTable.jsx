import { StripePricingTable } from '@/components/StripePricing'
import { ANNUAL_SALE_CONFIG } from '@/components/annualSaleConfig'

export default function AnnualSaleUpgradePricingTable({ team, email, setErrorText, bots = null, teamInvites = [] }) {
  return (
    <StripePricingTable
      team={team}
      email={email}
      setErrorText={setErrorText}
      mode="upgrade"
      saleConfig={ANNUAL_SALE_CONFIG}
      defaultFrequency="annually"
      bots={bots}
      teamInvites={teamInvites}
    />
  )
}
