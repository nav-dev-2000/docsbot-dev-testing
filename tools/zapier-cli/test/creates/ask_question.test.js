const App = require('../../index');

describe('creates.ask_question', () => {
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
          answer: 'Sample answer',
          couldAnswer: true,
          sources: [],
          id: 'answer_123',
        },
      }),
    };

    const bundle = {
      authData,
      inputData: {
        question: 'What is DocsBot?',
      },
    };

    const results = await App.creates.ask_question.operation.perform(z, bundle);

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: `https://api.docsbot.ai/teams/${authData.team_id}/bots/${authData.bot_id}/chat`,
        headers: expect.objectContaining({
          Authorization: `Bearer ${authData.api_key}`,
        }),
        body: expect.objectContaining({
          question: 'What is DocsBot?',
        }),
      }),
    );
    expect(results).toMatchObject({
      answer: 'Sample answer',
      couldAnswer: true,
      id: 'answer_123',
    });
  });

  it('throws API message on non-2xx response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 400,
        json: {
          message: 'Bad request',
        },
      }),
    };

    const promise = App.creates.ask_question.operation.perform(z, {
      authData: {
        api_key: 'test_api_key',
        team_id: 'team_123',
        bot_id: 'bot_123',
      },
      inputData: {
        question: 'What is DocsBot?',
      },
    });

    await expect(promise).rejects.toThrow('Bad request');
  });
});
