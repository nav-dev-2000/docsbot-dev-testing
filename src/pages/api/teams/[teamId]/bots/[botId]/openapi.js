import { getBot } from '@/lib/dbQueries'

export default async function handler(req, res) {
  const { teamId, botId } = req.query
  const bot = await getBot(teamId, botId)
  if (!bot) {
    return res.status(404).json({ message: 'Bot not found' })
  }

  if (req.method === 'GET') {
    const json = {
      openapi: '3.0.2',
      info: {
        title: `${bot.name} Retrieval API`,
        description: `For querying indexed documentation chunks based on natural language queries. Always use to find answers to questions and retrieve relevant information related to ${bot.name}.`,
        version: '1.0.0',
        termsOfService: 'https://docsbot.ai/legal/terms-of-service',
      },
      servers: [
        {
          url: 'https://api.docsbot.ai',
        },
      ],
      paths: {
        [`/teams/${teamId}/bots/${botId}/search`]: {
          post: {
            summary: 'Search for documentation chunks about a topic',
            operationId: 'Retrieval Search',
            ['x-openai-isConsequential']: false,
            requestBody: {
              required: true,
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/Query"
                  }
                }
              }
            },
            responses: {
              200: {
                description: 'Successful Response',
                content: {
                  'application/json': {
                    schema: {
                      title: 'Semantic Search Results',
                      anyOf: [
                        {
                          type: 'array',
                          items: {
                            $ref: '#/components/schemas/QuerySource',
                          },
                        },
                        {
                          $ref: '#/components/schemas/Error',
                        },
                      ],
                    },
                  },
                },
              },
              422: {
                description: 'Validation Error',
                content: {
                  'application/json': {
                    schema: {
                      $ref: '#/components/schemas/HTTPValidationError',
                    },
                  },
                },
              },
            },
          },
        },
      },
      components: {
        schemas: {
          Error: {
            title: 'Error',
            required: ['error'],
            type: 'object',
            properties: {
              error: {
                title: 'The error message',
                type: 'string',
              },
            },
          },
          HTTPValidationError: {
            title: 'HTTPValidationError',
            type: 'object',
            properties: {
              detail: {
                title: 'Detail',
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ValidationError',
                },
              },
            },
          },
          Query: {
            properties: {
              query: {
                type: "string",
                title: "Query"
              },
              use_glossary: {
                type: "boolean",
                title: "Use glossary to modify query for better results",
                default: false
              },
              top_k: {
                anyOf: [
                  {
                    type: "integer"
                  },
                  {
                    type: "null"
                  }
                ],
                title: "The number of source results to return",
                default: 5
              },
              alpha: {
                anyOf: [
                  {
                    type: "number",
                    maximum: 1,
                    minimum: 0
                  },
                  {
                    type: "null"
                  }
                ],
                title: "Keyword vs semantic search balance",
                description: "Hybrid search results can favor the keyword component or the semantic component. To change the relative weights of the keyword and vector components, set the alpha value in your query.\n\nAn alpha of 1 is a pure semantic vector search.\nAn alpha of 0 is a pure keyword search.",
                default: 0.75
              }
            },
            type: "object",
            required: [
              "query"
            ],
            title: "Query"
          },
          QuerySource: {
            properties: {
              title: {
                anyOf: [
                  {
                    type: "string"
                  },
                  {
                    type: "null"
                  }
                ],
                title: "The title of the source"
              },
              url: {
                anyOf: [
                  {
                    type: "string"
                  },
                  {
                    type: "null"
                  }
                ],
                title: "The url of the source"
              },
              page: {
                anyOf: [
                  {
                    type: "integer"
                  },
                  {
                    type: "null"
                  }
                ],
                title: "For PDFs, the page number of the source in the PDF"
              },
              content: {
                type: "string",
                title: "The raw text content of the source."
              }
            },
            type: "object",
            required: [
              "title",
              "url",
              "page",
              "content"
            ],
            title: "QuerySource"
          },
          ValidationError: {
            title: 'ValidationError',
            required: ['loc', 'msg', 'type'],
            type: 'object',
            properties: {
              loc: {
                title: 'Location',
                type: 'array',
                items: {
                  anyOf: [
                    {
                      type: 'string',
                    },
                    {
                      type: 'integer',
                    },
                  ],
                },
              },
              msg: {
                title: 'Message',
                type: 'string',
              },
              type: {
                title: 'Error Type',
                type: 'string',
              },
            },
          },
        },
      },
    }

    if (bot.privacy === 'private') {
      json.components.securitySchemes = {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'API_KEY',
        },
      }
    }

    return res.status(200).json(json)
  } else {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }
}
