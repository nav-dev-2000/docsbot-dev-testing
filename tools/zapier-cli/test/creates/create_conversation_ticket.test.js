const App = require('../../index');

describe('creates.create_conversation_ticket', () => {
  it('should create a ticket from a conversation', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: {
          subject: 'Pricing and Feature Inquiry',
          message: 'User asked about pricing plans and feature limits.',
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

    const result = await App.creates.create_conversation_ticket.operation.perform(
      z,
      bundle,
    );

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: 'https://api.docsbot.ai/teams/team_123/bots/bot_123/conversations/conv_123/ticket',
      }),
    );
    expect(result).toEqual({
      id: 'conv_123',
      conversationId: 'conv_123',
      subject: 'Pricing and Feature Inquiry',
      message: 'User asked about pricing plans and feature limits.',
    });
  });

  it('throws API error message when endpoint fails', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 404,
        json: {
          error: 'Conversation not found',
        },
      }),
    };

    const promise =
      App.creates.create_conversation_ticket.operation.perform(z, {
        authData: {
          api_key: 'test_api_key',
          team_id: 'team_123',
          bot_id: 'bot_123',
        },
        inputData: { thread_key: 'missing' },
      });

    await expect(promise).rejects.toThrow('Conversation not found');
  });
});
