import { Section, SectionContent, Button, Gradient, PricingCalculator } from "@/components/elements"

export const Pricing = ({ title, description, primaryButton, Calculator = PricingCalculator }) => {
    const theme = 'dark'
    
    return (
        <Section
            theme={theme}
            className="relative isolate overflow-hidden"
        >
            <SectionContent
                theme={theme}
                title={title}
                description={description}
                isBoxedHeader={false}
            >
                <Calculator
                    className="mt-8"
                />
                
                { primaryButton && (
                    <Button
                        { ...primaryButton }
                        theme="opalite"
                        variant="primary"
                        className="mx-auto"
                    />
                )}
            </SectionContent>

            <Gradient className="opacity-40" />
        </Section>
    )
}
