const App = require('../../index');

describe('creates.chat_agent', () => {
  it('should send a non-streaming chat-agent request and return the final answer event', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: [
          {
            event: 'reasoning',
            data: { text: 'Thinking...' },
          },
          {
            event: 'lookup_answer',
            data: {
              id: 'answer_123',
              answer: 'DocsBot supports Zapier triggers and actions.',
              couldAnswer: true,
              sources: [{ type: 'url', title: 'Zapier Docs' }],
              history: [],
            },
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
        thread_key: 'conv_123',
        question: 'What can DocsBot do with Zapier?',
      },
    };

    const result = await App.creates.chat_agent.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: 'https://api.docsbot.ai/teams/team_123/bots/bot_123/chat-agent',
        body: expect.objectContaining({
          stream: false,
          conversationId: 'conv_123',
          question: 'What can DocsBot do with Zapier?',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'answer_123',
        conversationId: 'conv_123',
        event: 'lookup_answer',
        answer: 'DocsBot supports Zapier triggers and actions.',
        couldAnswer: true,
        eventCount: 2,
      }),
    );
  });

  it('throws API message on non-2xx response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 403,
        json: { message: 'Forbidden' },
      }),
    };

    const promise = App.creates.chat_agent.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        thread_key: 'conv_123',
        question: 'Hello',
      },
    });

    await expect(promise).rejects.toThrow('Forbidden');
  });

  it('prefers lookup_answer over is_resolved_question prompt text', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: [
          {
            event: 'lookup_answer',
            data: {
              id: 'answer_abc',
              answer: 'Primary helpful answer.',
              couldAnswer: true,
              sources: [],
              history: [],
            },
          },
          {
            event: 'is_resolved_question',
            data: {
              answer: 'Was that helpful?',
              options: { yes: '👍 That helped', no: 'No' },
            },
          },
        ],
      }),
    };

    const result = await App.creates.chat_agent.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        thread_key: 'conv_123',
        question: 'Help me',
      },
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: 'answer_abc',
        event: 'lookup_answer',
        answer: 'Primary helpful answer.',
      }),
    );
  });
});
