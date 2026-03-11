/**
 * Research suggestion presets with prompts and recommended tool combinations.
 * Each suggestion pre-fills the form and enables the best tools for that task:
 * - docsSearch: documentation/manuals/help docs
 * - webSearch: web research, competitors, market trends
 * - codeInterpreter: math, code, file processing, financial analysis
 * - questionHistory: customer support, support history, chatbot interactions
 *
 * Icon keys map to Heroicons: ChatBubbleLeftRightIcon, DocumentMagnifyingGlassIcon,
 * GlobeAltIcon, CodeBracketSquareIcon, LightBulbIcon, CalendarIcon, FlagIcon,
 * MagnifyingGlassIcon, LanguageIcon, ChartBarIcon
 */
const RESEARCH_SUGGESTIONS_RAW = [
    {
        prompt:
            'Analyze support conversation themes to spot recurring complaints and UX problems with my product.',
        icon: 'ChatBubbleLeftRightIcon',
        docsSearch: false,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Identify common customer questions and create a comprehensive FAQ from support history.',
        icon: 'ChatBubbleLeftRightIcon',
        docsSearch: false,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Review customer support interactions to find documentation gaps and specific improvement opportunities.',
        icon: 'DocumentMagnifyingGlassIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Audit support sources by comparing our manuals vs online help docs.',
        icon: 'DocumentMagnifyingGlassIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            "Research and compare our product features with our top competitor's.",
        icon: 'GlobeAltIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Create a whitepaper for my product combining docs and web search to address common pain points.',
        icon: 'DocumentTextIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Generate a sales prospect briefing for my ICP using internal docs and web intelligence.',
        icon: 'UserCircleIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            "Run competitive content gap analysis comparing my landing pages and a competitor's.",
        icon: 'GlobeAltIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Scan market trends and opportunities from internal data plus web sources.',
        icon: 'ChartBarIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Deliver a technical product deep dive from my internal docs.',
        icon: 'DocumentMagnifyingGlassIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Turn a product release note and manual into a full blog article with supporting research.',
        icon: 'DocumentTextIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Convert our troubleshooting guide into a step-by-step help center article.',
        icon: 'DocumentTextIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Compare quarterly financial reports against competitor filings to highlight performance gaps.',
        icon: 'CodeBracketSquareIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: true,
        questionHistory: false,
    },
    {
        prompt:
            'Generate a sales playbook for prospect from my SOPs and market research.',
        icon: 'DocumentTextIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: false,
    },
    {
        prompt:
            'Analyze customer support interactions to understand common user intent patterns and improve responses.',
        icon: 'ChatBubbleLeftRightIcon',
        docsSearch: false,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Review previous customer questions to identify trending issues and prepare proactive solutions.',
        icon: 'LightBulbIcon',
        docsSearch: false,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Scan recent customer support questions and summarize emerging themes we should address in our docs.',
        icon: 'CalendarIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Write a report that flags support questions mentioning competitor names for sales follow-up.',
        icon: 'FlagIcon',
        docsSearch: false,
        webSearch: true,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            "Surface support questions that don't have good coverage in our docs.",
        icon: 'MagnifyingGlassIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            "Use the exact phrasing from common customer support questions to rewrite our relevant help content to make it more findable.",
        icon: 'LanguageIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
    {
        prompt:
            'Build a cost-benefit model comparing our pricing tiers with competitor offerings using web data.',
        icon: 'CodeBracketSquareIcon',
        docsSearch: true,
        webSearch: true,
        codeInterpreter: true,
        questionHistory: false,
    },
    {
        prompt:
            'Map our product workflows to customer support questions to find where users get stuck.',
        icon: 'LightBulbIcon',
        docsSearch: true,
        webSearch: false,
        codeInterpreter: false,
        questionHistory: true,
    },
]

/**
 * Returns suggestions ordered so no two adjacent items share the same icon.
 */
function reorderToAvoidAdjacentIcons(items) {
    const byIcon = {}
    for (const item of items) {
        if (!byIcon[item.icon]) byIcon[item.icon] = []
        byIcon[item.icon].push(item)
    }
    const iconKeys = Object.keys(byIcon)
    const result = []
    let idx = 0
    while (result.length < items.length) {
        for (const icon of iconKeys) {
            const arr = byIcon[icon]
            if (idx < arr.length) {
                result.push(arr[idx])
            }
        }
        idx += 1
    }
    return result
}

export const RESEARCH_SUGGESTIONS =
    reorderToAvoidAdjacentIcons(RESEARCH_SUGGESTIONS_RAW)
