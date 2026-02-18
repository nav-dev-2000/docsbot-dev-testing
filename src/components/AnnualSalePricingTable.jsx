import { StripePricingTable } from '@/components/StripePricing'

export default function AnnualSalePricingTable({ team, email, setErrorText }) {
  // Promo ended: keep wrapper component to avoid touching callers.
  return (
    <StripePricingTable
      team={team}
      email={email}
      setErrorText={setErrorText}
      mode="checkout"
      defaultFrequency="annually"
    />
  )
}
