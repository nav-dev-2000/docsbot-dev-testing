const App = require('../../index');

describe('creates.semantic_search', () => {
  it('should run semantic search and return normalized results', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: [
          {
            type: 'url',
            title: 'DocsBot',
            url: 'https://docsbot.ai',
            page: null,
            content: 'DocsBot overview content.',
          },
          {
            type: 'sitemap',
            title: 'Webhooks API',
            url: 'https://docsbot.ai/documentation/developer/webhooks-api',
            page: null,
            content: 'Webhooks API details.',
          },
        ],
      }),
    };

    const bundle = {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        query: 'webhooks zapier',
        top_k: 5,
        alpha: 0.75,
      },
    };

    const result = await App.creates.semantic_search.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.docsbot.ai/teams/team_123/bots/bot_123/search',
        body: expect.objectContaining({
          query: 'webhooks zapier',
          top_k: 5,
          alpha: 0.75,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'search:webhooks zapier:2',
        query: 'webhooks zapier',
        resultCount: 2,
      }),
    );
    expect(result.results).toHaveLength(2);
  });

  it('throws API message on non-2xx response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 400,
        json: { message: 'Invalid query' },
      }),
    };

    const promise = App.creates.semantic_search.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: { query: '' },
    });

    await expect(promise).rejects.toThrow('Invalid query');
  });
});
