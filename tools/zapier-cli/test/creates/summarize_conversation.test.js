const App = require('../../index');

describe('creates.summarize_conversation', () => {
  it('should summarize a conversation', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: {
          title: 'Pricing plans overview',
          summary:
            'User asked about pricing tiers and received plan differences.',
          sentiment: 'positive',
        },
      }),
    };

    const bundle = {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        thread_key: 'conv_123',
      },
    };

    const result = await App.creates.summarize_conversation.operation.perform(
      z,
      bundle,
    );

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.docsbot.ai/teams/team_123/bots/bot_123/conversations/conv_123/summarize',
      }),
    );
    expect(result).toEqual({
      id: 'conv_123',
      conversationId: 'conv_123',
      title: 'Pricing plans overview',
      summary: 'User asked about pricing tiers and received plan differences.',
      sentiment: 'positive',
    });
  });

  it('throws API message on non-2xx response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 402,
        json: { message: 'Plan upgrade required' },
      }),
    };

    const promise = App.creates.summarize_conversation.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: { thread_key: 'conv_123' },
    });

    await expect(promise).rejects.toThrow('Plan upgrade required');
  });
});
