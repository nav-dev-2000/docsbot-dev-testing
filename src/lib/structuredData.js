export const SITE_URL = 'https://docsbot.ai'
export const ORG_ID = `${SITE_URL}/#organization`
export const WEBSITE_ID = `${SITE_URL}/#website`
export const LOGO_URL = `${SITE_URL}/branding/docsbot-logo-lg.png`
export const ORG_NAME = 'DocsBot'
export const ORG_DESCRIPTION =
  'Build AI agents that combine trusted knowledge with real actions for customers and teams across your business tools and workflows.'
export const SAME_AS = [
  'https://x.com/docsbotai/',
  'https://www.linkedin.com/company/docsbot-ai',
  'https://github.com/uglyrobot/',
]
export const KNOWS_ABOUT = [
  'AI chatbots',
  'knowledge bases',
  'documentation',
  'customer support automation',
  'AI assistants',
  'semantic search',
]
export const PRESS_EMAIL = 'human@docsbot.ai'

export function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

export function buildPageUrl(path = '') {
  const cleanPath = String(path).split('?')[0].split('#')[0]
  if (!cleanPath || cleanPath === '/') {
    return SITE_URL
  }
  return `${SITE_URL}${cleanPath.endsWith('/') ? cleanPath.slice(0, -1) : cleanPath}`
}

export function buildOrganization({ includeContactPoint = false } = {}) {
  const organization = {
    '@type': 'Organization',
    '@id': ORG_ID,
    name: ORG_NAME,
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: LOGO_URL,
    },
    description: ORG_DESCRIPTION,
    sameAs: SAME_AS,
    knowsAbout: KNOWS_ABOUT,
  }

  if (includeContactPoint) {
    organization.contactPoint = [
      {
        '@type': 'ContactPoint',
        contactType: 'press inquiries',
        email: PRESS_EMAIL,
      },
    ]
  }

  return organization
}

export function buildWebSite() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: ORG_NAME,
    url: SITE_URL,
    publisher: {
      '@id': ORG_ID,
    },
  }
}

export function buildWebPage({ url, name, description }) {
  const webPage = {
    '@type': 'WebPage',
    '@id': `${url}#webpage`,
    url,
    name,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    about: {
      '@id': ORG_ID,
    },
  }

  if (description) {
    webPage.description = description
  }

  return webPage
}

export function buildFaqEntities(faqs = []) {
  return faqs
    .map((faq) => {
      const question = faq.question || faq.questionName
      const answer = faq.answer || faq.acceptedAnswerText
      if (!question || !answer) {
        return null
      }

      return {
        '@type': 'Question',
        name: stripHtml(question),
        acceptedAnswer: {
          '@type': 'Answer',
          text: stripHtml(answer),
        },
      }
    })
    .filter(Boolean)
}

export function buildFaqPage({ url, mainEntity }) {
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    url,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    publisher: {
      '@id': ORG_ID,
    },
    mainEntity,
  }
}

export function buildHowTo({ url, name, description, steps }) {
  const howTo = {
    '@type': 'HowTo',
    '@id': `${url}#howto`,
    name,
    description,
    isPartOf: {
      '@id': WEBSITE_ID,
    },
    publisher: {
      '@id': ORG_ID,
    },
    mainEntityOfPage: {
      '@id': `${url}#webpage`,
    },
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }

  return howTo
}

export function buildService({ url, name, description, serviceType }) {
  const service = {
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    description,
    serviceType,
    provider: {
      '@id': ORG_ID,
    },
    audience: {
      '@type': 'BusinessAudience',
      audienceType: 'Businesses',
    },
  }

  return service
}

export function buildBlogPosting({
  url,
  headline,
  description,
  image,
  datePublished,
  dateModified,
  authorName,
}) {
  const blogPosting = {
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline,
    description,
    mainEntityOfPage: {
      '@id': `${url}#webpage`,
    },
    publisher: {
      '@id': ORG_ID,
    },
  }

  if (image) {
    blogPosting.image = image
  }

  if (datePublished) {
    blogPosting.datePublished = datePublished
  }

  if (dateModified) {
    blogPosting.dateModified = dateModified
  }

  if (authorName) {
    blogPosting.author = {
      '@type': 'Person',
      name: authorName,
    }
  }

  return blogPosting
}
