const cleanRequestBody = (body = {}) =>
  Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null),
  );

const parseApiResponse = (response) => {
  if (response.status >= 400) {
    const message = response.json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.json;
};

module.exports = {
  display: {
    description:
      'Run semantic search against a bot and return matching source chunks.',
    hidden: false,
    label: 'Semantic Search',
  },
  key: 'semantic_search',
  noun: 'Search Result',
  operation: {
    inputFields: [
      {
        key: 'query',
        label: 'Query',
        type: 'string',
        required: true,
      },
      {
        key: 'top_k',
        label: 'Top K',
        type: 'integer',
        required: false,
        default: '4',
      },
      {
        key: 'alpha',
        label: 'Alpha',
        type: 'number',
        required: false,
      },
      {
        key: 'autocut',
        label: 'Autocut',
        type: 'integer',
        required: false,
      },
      {
        key: 'use_glossary',
        label: 'Use Glossary',
        type: 'boolean',
        required: false,
      },
    ],
    sample: {
      id: 'search:what is docsbot?:2',
      query: 'what is docsbot?',
      resultCount: 2,
      results: [
        {
          type: 'url',
          title: 'DocsBot AI',
          url: 'https://docsbot.ai/',
          page: null,
          content: 'DocsBot is an AI support assistant...',
        },
      ],
    },
    outputFields: [
      { key: 'id', label: 'Result ID' },
      { key: 'query', label: 'Query' },
      { key: 'resultCount', label: 'Result Count', type: 'integer' },
      { key: 'results[]type', label: 'Result Type' },
      { key: 'results[]title', label: 'Result Title' },
      { key: 'results[]url', label: 'Result URL' },
      { key: 'results[]page', label: 'Result Page' },
      { key: 'results[]content', label: 'Result Content' },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
        method: 'POST',
        url: `https://api.docsbot.ai/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/search`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
        body: cleanRequestBody({
          query: bundle.inputData.query,
          top_k: bundle.inputData.top_k,
          alpha: bundle.inputData.alpha,
          autocut: bundle.inputData.autocut,
          use_glossary: bundle.inputData.use_glossary,
        }),
      });

      const data = parseApiResponse(response);
      const results = Array.isArray(data) ? data : [];
      return {
        id: `search:${bundle.inputData.query}:${results.length}`,
        query: bundle.inputData.query,
        resultCount: results.length,
        results,
      };
    },
  },
};
