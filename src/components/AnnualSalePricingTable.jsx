import { StripePricingTable } from '@/components/StripePricing'
import { ANNUAL_SALE_CONFIG } from '@/components/annualSaleConfig'

export default function AnnualSalePricingTable({ team, email, setErrorText }) {
  return (
    <StripePricingTable
      team={team}
      email={email}
      setErrorText={setErrorText}
      mode="checkout"
      saleConfig={ANNUAL_SALE_CONFIG}
      defaultFrequency="annually"
    />
  )
}
