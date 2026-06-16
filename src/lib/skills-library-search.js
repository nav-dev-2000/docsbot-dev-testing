import OpenAI from 'openai'
import Turbopuffer from '@turbopuffer/turbopuffer'

const DEFAULT_SKILLS_LIBRARY_SEARCH_NAMESPACE = 'docsbot-skills-library-staging'
const PRODUCTION_SKILLS_LIBRARY_SEARCH_NAMESPACE = 'docsbot-skills-library-production'

function resolveSkillsLibrarySearchNamespace() {
  if (process.env.TURBOPUFFER_SKILLS_LIBRARY_NAMESPACE) {
    return process.env.TURBOPUFFER_SKILLS_LIBRARY_NAMESPACE
  }

  return process.env.VERCEL_ENV === 'production'
    ? PRODUCTION_SKILLS_LIBRARY_SEARCH_NAMESPACE
    : DEFAULT_SKILLS_LIBRARY_SEARCH_NAMESPACE
}

export const SKILLS_LIBRARY_SEARCH_NAMESPACE = resolveSkillsLibrarySearchNamespace()
export const SKILLS_LIBRARY_SEARCH_REGION =
  process.env.TURBOPUFFER_SKILLS_LIBRARY_REGION || 'gcp-us-west1'
export const SKILLS_LIBRARY_EMBEDDING_MODEL =
  process.env.SKILLS_LIBRARY_EMBEDDING_MODEL || 'text-embedding-3-large'
export const SKILLS_LIBRARY_EMBEDDING_DIMENSIONS = Number(
  process.env.SKILLS_LIBRARY_EMBEDDING_DIMENSIONS || 1024,
)
export const SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS = 1000

function isSearchConfigured() {
  return Boolean(process.env.TURBOPUFFER_API_KEY && process.env.OPENAI_API_KEY)
}

function getNamespace() {
  const client = new Turbopuffer({
    apiKey: process.env.TURBOPUFFER_API_KEY,
    region: SKILLS_LIBRARY_SEARCH_REGION,
  })
  return client.namespace(SKILLS_LIBRARY_SEARCH_NAMESPACE)
}

function searchableTextForSkill(skill = {}) {
  return [
    skill.id,
    skill.name,
    skill.skillName,
    skill.description,
    skill.category,
  ]
    .filter(Boolean)
    .join('\n')
}

function bm25QueryText(query) {
  return String(query || '').trim().slice(0, SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS)
}

function firstAllowedDomainFromNetworkPolicy(policy = {}) {
  const domains = Array.isArray(policy?.allowedDomains) ? policy.allowedDomains.filter(Boolean) : []
  return String(domains[0] || '').trim()
}

async function embedText(text) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const response = await openai.embeddings.create({
    model: SKILLS_LIBRARY_EMBEDDING_MODEL,
    input: text,
    dimensions: SKILLS_LIBRARY_EMBEDDING_DIMENSIONS,
  })
  return response.data?.[0]?.embedding || null
}

function rowAttributes(row = {}) {
  return row.attributes || row
}

function rrfFuse(queryResults = [], limit = 20) {
  const byId = new Map()
  const k = 60

  queryResults.forEach((result) => {
    ;(result?.rows || []).forEach((row, index) => {
      const id = String(row.id || rowAttributes(row).id || '').trim()
      if (!id) return
      const current = byId.get(id) || {
        id,
        score: 0,
        row,
      }
      current.score += 1 / (k + index + 1)
      current.row = {
        ...current.row,
        ...row,
        attributes: {
          ...(rowAttributes(current.row) || {}),
          ...(rowAttributes(row) || {}),
        },
      }
      byId.set(id, current)
    })
  })

  return [...byId.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ row, score }) => {
      const attributes = rowAttributes(row)
      let networkPolicy = attributes.networkPolicy
      if (!networkPolicy && attributes.networkPolicyJson) {
        try {
          networkPolicy = JSON.parse(attributes.networkPolicyJson)
        } catch {
          networkPolicy = undefined
        }
      }
      return {
        ...attributes,
        ...(networkPolicy ? { networkPolicy } : {}),
        ...(!networkPolicy && attributes.iconDomain
          ? {
              networkPolicy: {
                allowedDomains: [attributes.iconDomain],
                allowedSchemes: ['https'],
              },
            }
          : {}),
        id: String(row.id || attributes.id || ''),
        category: String(attributes.category || ''),
        searchScore: score,
      }
    })
}

export async function indexLibrarySkillForSearch(skill) {
  if (!isSearchConfigured()) {
    return {
      configured: false,
      indexed: false,
      message: 'TURBOPUFFER_API_KEY or OPENAI_API_KEY is not configured.',
    }
  }

  const id = String(skill?.id || skill?.name || '').trim()
  if (!id) {
    throw new Error('Library skill id is required for search indexing.')
  }

  const text = searchableTextForSkill({ ...skill, id })
  const vector = await embedText(text)
  if (!vector) {
    throw new Error('Unable to embed library skill for search.')
  }

  const ns = getNamespace()
  const row = {
    id,
    vector,
    key: id,
    name: String(skill?.name || id),
    description: String(skill?.description || ''),
    category: String(skill?.category || ''),
    mode: String(skill?.mode || ''),
    audience: String(skill?.audience || ''),
    internal: Boolean(skill?.internal),
    hasFunctions: Boolean(skill?.hasFunctions),
    icon: String(skill?.icon || ''),
    iconDomain: firstAllowedDomainFromNetworkPolicy(skill?.networkPolicy),
    networkPolicyJson: JSON.stringify(skill?.networkPolicy || {}),
    r2Prefix: String(skill?.r2Prefix || ''),
    updatedAt: String(skill?.updatedAt || new Date().toISOString()),
  }

  const result = await ns.write({
    distance_metric: 'cosine_distance',
    schema: {
      vector: {
        type: `[${SKILLS_LIBRARY_EMBEDDING_DIMENSIONS}]f32`,
        ann: true,
      },
      key: { type: 'string', full_text_search: true },
      name: { type: 'string', full_text_search: true },
      description: { type: 'string', full_text_search: true },
      category: { type: 'string', full_text_search: true },
      mode: 'string',
      audience: 'string',
      internal: 'bool',
      hasFunctions: 'bool',
      icon: 'string',
      iconDomain: 'string',
      networkPolicyJson: 'string',
      r2Prefix: 'string',
      updatedAt: 'datetime',
    },
    upsert_rows: [row],
  })

  return {
    configured: true,
    indexed: true,
    result,
  }
}

export async function deleteLibrarySkillFromSearch(skillId) {
  if (!process.env.TURBOPUFFER_API_KEY) {
    return {
      configured: false,
      deleted: false,
      message: 'TURBOPUFFER_API_KEY is not configured.',
    }
  }

  const id = String(skillId || '').trim()
  if (!id) return { configured: true, deleted: false }

  const ns = getNamespace()
  await ns.write({ deletes: [id] })
  return {
    configured: true,
    deleted: true,
  }
}

export async function searchLibrarySkillsWithHybrid(query, options = {}) {
  if (!isSearchConfigured()) {
    return {
      configured: false,
      skills: [],
      message: 'TURBOPUFFER_API_KEY or OPENAI_API_KEY is not configured.',
    }
  }

  const q = String(query || '').trim()
  if (!q) {
    return {
      configured: true,
      skills: [],
    }
  }

  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 50)
  const candidateLimit = Math.min(Math.max(limit * 4, 20), 100)
  const bm25Query = bm25QueryText(q)
  const vector = await embedText(q)
  if (!vector) {
    throw new Error('Unable to embed skills library search query.')
  }

  const ns = getNamespace()
  const response = await ns.multiQuery({
    queries: [
      {
        rank_by: ['vector', 'ANN', vector],
        top_k: candidateLimit,
        include_attributes: true,
      },
      {
        rank_by: [
          'Sum',
          [
            ['Product', 3, ['name', 'BM25', bm25Query, { last_as_prefix: true }]],
            ['Product', 2, ['key', 'BM25', bm25Query, { last_as_prefix: true }]],
            ['description', 'BM25', bm25Query, { last_as_prefix: true }],
            ['category', 'BM25', bm25Query, { last_as_prefix: true }],
          ],
        ],
        top_k: candidateLimit,
        include_attributes: true,
      },
    ],
  })

  return {
    configured: true,
    skills: rrfFuse(response.results || response.query_results || [], limit),
  }
}
