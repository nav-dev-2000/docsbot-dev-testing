const App = require('../../index');

describe('creates.create_source', () => {
  it('should run', async () => {
    const authData = {
      api_key: 'test_api_key',
      team_id: 'team_123',
      bot_id: 'bot_123',
    };

    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: {
          id: 'source_123',
          pageCount: 2,
          file: null,
          chunkCount: 8,
          type: 'url',
          title: 'Homepage',
          url: 'https://example.com',
          status: 'pending',
          createdAt: '2026-02-12T00:00:00.000Z',
        },
      }),
    };

    const bundle = {
      authData,
      inputData: {
        type: 'url',
        url: 'https://example.com',
        title: 'Homepage',
      },
    };

    const results = await App.creates.create_source.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: `https://docsbot.ai/api/teams/${authData.team_id}/bots/${authData.bot_id}/sources`,
        headers: expect.objectContaining({
          Authorization: `Bearer ${authData.api_key}`,
        }),
        body: {
          type: 'url',
          title: 'Homepage',
          url: 'https://example.com',
        },
      }),
    );
    expect(results).toMatchObject({
      id: 'source_123',
      type: 'url',
      title: 'Homepage',
      url: 'https://example.com',
      status: 'pending',
    });
  });

  it('throws API message on non-2xx response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 500,
        json: {
          message: 'Server error',
        },
      }),
    };

    const promise = App.creates.create_source.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        type: 'url',
        url: 'https://example.com',
      },
    });

    await expect(promise).rejects.toThrow('Server error');
  });
});
