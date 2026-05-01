import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const writes = []
  const deletes = []
  const multiQueries = []
  const embeddingsCreate = vi.fn(async () => ({
    data: [{ embedding: Array.from({ length: 1024 }, (_, i) => i / 1024) }],
  }))

  class OpenAI {
    constructor(options) {
      this.options = options
      this.embeddings = {
        create: embeddingsCreate,
      }
    }
  }

  class Turbopuffer {
    constructor(options) {
      this.options = options
    }

    namespace(namespace) {
      return {
        write: vi.fn(async (body) => {
          writes.push({ namespace, body })
          if (Array.isArray(body.deletes)) deletes.push(...body.deletes)
          return { rows_affected: 1 }
        }),
        multiQuery: vi.fn(async (body) => {
          multiQueries.push({ namespace, body })
          return {
            results: [
              {
                rows: [
                  {
                    id: 'crm-sync',
                    attributes: {
                      id: 'crm-sync',
                      name: 'crm-sync',
                      description: 'Sync CRM records.',
                      category: 'Sales',
                      iconDomain: 'api.brand.dev',
                    },
                  },
                ],
              },
              {
                rows: [
                  {
                    id: 'crm-sync',
                    attributes: {
                      id: 'crm-sync',
                      name: 'crm-sync',
                      description: 'Sync CRM records.',
                      category: 'Sales',
                      iconDomain: 'api.brand.dev',
                    },
                  },
                  {
                    id: 'support-ticket',
                    attributes: {
                      id: 'support-ticket',
                      name: 'support-ticket',
                      description: 'Create support tickets.',
                      category: 'Customer Support',
                    },
                  },
                ],
              },
            ],
          }
        }),
      }
    }
  }

  return {
    writes,
    deletes,
    multiQueries,
    embeddingsCreate,
    OpenAI,
    Turbopuffer,
  }
})

vi.mock('openai', () => ({
  default: mocks.OpenAI,
}))

vi.mock('@turbopuffer/turbopuffer', () => ({
  default: mocks.Turbopuffer,
}))

describe('skills-library-search', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    mocks.writes.length = 0
    mocks.deletes.length = 0
    mocks.multiQueries.length = 0
    process.env.TURBOPUFFER_API_KEY = 'tpuf-key'
    process.env.OPENAI_API_KEY = 'openai-key'
    delete process.env.TURBOPUFFER_SKILLS_LIBRARY_NAMESPACE
    delete process.env.VERCEL_ENV
    delete process.env.SKILLS_LIBRARY_EMBEDDING_MODEL
    delete process.env.SKILLS_LIBRARY_EMBEDDING_DIMENSIONS
  })

  it('indexes global library skill metadata with OpenAI embeddings large', async () => {
    const { indexLibrarySkillForSearch } = await import('@/lib/skills-library-search')

    const result = await indexLibrarySkillForSearch({
      id: 'crm-sync',
      name: 'crm-sync',
      description: 'Use when syncing CRM records.',
      category: 'Sales',
      mode: 'executable',
      audience: 'internal',
      hasFunctions: true,
      internal: true,
      networkPolicy: { allowedDomains: ['api.brand.dev'], allowedSchemes: ['https'] },
    })

    expect(result.indexed).toBe(true)
    expect(mocks.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'text-embedding-3-large',
        input: ['crm-sync', 'crm-sync', 'Use when syncing CRM records.', 'Sales'].join('\n'),
        dimensions: 1024,
      }),
    )
    expect(mocks.writes[0]).toEqual(
      expect.objectContaining({
        namespace: 'docsbot-skills-library-staging',
        body: expect.objectContaining({
          distance_metric: 'cosine_distance',
          upsert_rows: [
            expect.objectContaining({
              id: 'crm-sync',
              name: 'crm-sync',
              description: 'Use when syncing CRM records.',
              category: 'Sales',
              iconDomain: 'api.brand.dev',
              networkPolicyJson: JSON.stringify({
                allowedDomains: ['api.brand.dev'],
                allowedSchemes: ['https'],
              }),
              vector: expect.any(Array),
            }),
          ],
        }),
      }),
    )
    expect(mocks.writes[0].body.upsert_rows[0]).not.toHaveProperty('text')
    expect(mocks.writes[0].body.schema).not.toHaveProperty('text')
    expect(mocks.writes[0].body.schema.category).toEqual({
      type: 'string',
      full_text_search: true,
    })
  })

  it('uses a separate default Turbopuffer namespace in production', async () => {
    process.env.VERCEL_ENV = 'production'
    const { indexLibrarySkillForSearch } = await import('@/lib/skills-library-search')

    await indexLibrarySkillForSearch({
      id: 'crm-sync',
      name: 'crm-sync',
      description: 'Use when syncing CRM records.',
    })

    expect(mocks.writes[0].namespace).toBe('docsbot-skills-library-production')
  })

  it('allows the skills library Turbopuffer namespace to be overridden', async () => {
    process.env.VERCEL_ENV = 'production'
    process.env.TURBOPUFFER_SKILLS_LIBRARY_NAMESPACE = 'custom-skills-library'
    const { indexLibrarySkillForSearch } = await import('@/lib/skills-library-search')

    await indexLibrarySkillForSearch({
      id: 'crm-sync',
      name: 'crm-sync',
      description: 'Use when syncing CRM records.',
    })

    expect(mocks.writes[0].namespace).toBe('custom-skills-library')
  })

  it('runs vector and BM25 multi-query search and fuses results with RRF', async () => {
    const { searchLibrarySkillsWithHybrid } = await import('@/lib/skills-library-search')

    const result = await searchLibrarySkillsWithHybrid('create a CRM record', { limit: 2 })

    expect(result.configured).toBe(true)
    expect(result.skills.map((skill) => skill.id)).toEqual(['crm-sync', 'support-ticket'])
    expect(mocks.multiQueries[0].body.queries).toHaveLength(2)
    expect(mocks.multiQueries[0].body.queries[0].rank_by[1]).toBe('ANN')
    expect(JSON.stringify(mocks.multiQueries[0].body.queries[1].rank_by)).toContain('BM25')
    expect(JSON.stringify(mocks.multiQueries[0].body.queries[1].rank_by)).not.toContain('"text"')
  })

  it('limits only BM25 query text for long search inputs', async () => {
    const {
      SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS,
      searchLibrarySkillsWithHybrid,
    } = await import('@/lib/skills-library-search')

    const longQuery = 'create a very detailed CRM sync skill '.repeat(100)
    await searchLibrarySkillsWithHybrid(longQuery, { limit: 2 })

    expect(mocks.embeddingsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        input: longQuery.trim(),
      }),
    )

    const bm25RankBy = mocks.multiQueries[0].body.queries[1].rank_by
    const bm25QueryValues = [
      bm25RankBy[1][0][2][2],
      bm25RankBy[1][1][2][2],
      bm25RankBy[1][2][2],
    ]
    expect(bm25QueryValues).toEqual([
      longQuery.trim().slice(0, SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS),
      longQuery.trim().slice(0, SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS),
      longQuery.trim().slice(0, SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS),
    ])
    expect(bm25QueryValues[0].length).toBe(SKILLS_LIBRARY_BM25_QUERY_MAX_CHARS)
  })

  it('maps indexed icon domain back to network policy for search result icons', async () => {
    const { searchLibrarySkillsWithHybrid } = await import('@/lib/skills-library-search')

    const result = await searchLibrarySkillsWithHybrid('crm', { limit: 1 })

    expect(result.skills[0]).toEqual(
      expect.objectContaining({
        id: 'crm-sync',
        iconDomain: 'api.brand.dev',
        category: 'Sales',
        networkPolicy: {
          allowedDomains: ['api.brand.dev'],
          allowedSchemes: ['https'],
        },
      }),
    )
  })

  it('deletes only the global library search row by skill id', async () => {
    const { deleteLibrarySkillFromSearch } = await import('@/lib/skills-library-search')

    await deleteLibrarySkillFromSearch('crm-sync')

    expect(mocks.deletes).toEqual(['crm-sync'])
  })
})
