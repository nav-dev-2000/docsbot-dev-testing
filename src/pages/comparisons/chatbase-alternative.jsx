import AlternativePage from '@/components/AlternativePage'

const name = 'Chatbase'

const description = "Are you looking for an alternative to Chatbase? While Chatbase launched 5 days before us, businesses are switching to DocsBot because we have more (auto-refreshing) training source options, a better, more-customizable widget, and a powerful API. They also benefit from our multilingual optimization and specialized tools for both customer support and research."

const support = `Unlike ${name}, DocsBot is optimized with specialized tools to automate your customer support to get instant, accurate, 24/7, multilingual answers for your customers. Train your chatbot from your existing content and documentation in minutes to start delighting your customers and saving on support costs today.`

const research = `DocsBot AI transforms your data sources into a smart, dynamic knowledge base you can chat with. It has an advanced research mode missing in ${name} to get precise, customized responses to complex questions with inline source context. Ideal for research, analysis, and internal company inquiries, it dramatically simplifies and accelerates the process of finding precise answers in vast text & media repositories.`

const competitorFeatures = {
  cloud_sources: 'Notion',
  websites: 'URLs, Sitemap',
  q_a: true,
  raw_data: false,
  document_files: '.pdf, .doc, .docx, .txt',
  images: false,
  audio: false,
  continuous_training: false,

  customizable: 'Limited options',
  widget_languages: false,
  human_escalation: false,
  answer_rating: false,
  customer_metadata: 'Name, Email, Phone only via lead form',
  recommended_questions: true,
  show_sources: false,
  remove_branding: 'Extra paid add-on',

  chat_logs: 'JSON export, Confidence filter',
  advanced_analytics: 'Chat counts & geolocation',
  ai_question_reports: false,

  widget: true,
  share_link: 'Custom domain support',
  api: true,
  gpts: false,
  zapier: true,
  pabbly_connect: 'Send prompt only',
  pipedream: false,
  helpscout: false,

  private_bots: true,
  domain_restrictions: true,
  rate_limiting: true,

  invite_team_members: false,
  assign_user_roles: false,
  custom_prompt: true,
  multilingual: 'Not-optimized',
  search: false,
  research_mode: false,
  anti_hallucination: false,
}

export default function Page() {
  return (
    <AlternativePage
      name={name}
      description={description}
      support={support}
      research={research}
      competitorFeatures={competitorFeatures}
    />
  )
}
