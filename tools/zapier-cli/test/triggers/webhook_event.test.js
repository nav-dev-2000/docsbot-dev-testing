const App = require('../../index');

const authData = {
  api_key: 'test_api_key',
  team_id: 'team_123',
  bot_id: 'bot_123',
};

describe('triggers.webhook_event', () => {
  it('subscribes using the webhooks registration API', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 201,
        json: {
          id: 'wh_123',
          events: ['lead.created'],
          status: 'active',
        },
      }),
    };

    const bundle = {
      authData,
      targetUrl: 'https://hooks.zapier.com/hooks/catch/123',
      inputData: {
        event: 'lead.created',
        label: 'Zapier trigger',
      },
    };

    const result = await App.triggers.webhook_event.operation.performSubscribe(
      z,
      bundle,
    );

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'POST',
        url: `https://docsbot.ai/api/teams/${authData.team_id}/bots/${authData.bot_id}/webhooks`,
        headers: expect.objectContaining({
          Authorization: `Bearer ${authData.api_key}`,
        }),
        body: expect.objectContaining({
          targetUrl: bundle.targetUrl,
          events: ['lead.created'],
          label: 'Zapier trigger',
          source: 'zapier',
        }),
      }),
    );
    expect(result).toMatchObject({
      webhookId: 'wh_123',
      event: 'lead.created',
    });
  });

  it('unsubscribes using the webhook id from subscribe data', async () => {
    const webhookId = 'wh_123';
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: {
          message: 'success',
          id: webhookId,
        },
      }),
    };

    const bundle = {
      authData,
      subscribeData: {
        webhookId,
      },
    };

    const result = await App.triggers.webhook_event.operation.performUnsubscribe(
      z,
      bundle,
    );

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'DELETE',
        url: `https://docsbot.ai/api/teams/${authData.team_id}/bots/${authData.bot_id}/webhooks/${webhookId}`,
        headers: expect.objectContaining({
          Authorization: `Bearer ${authData.api_key}`,
        }),
      }),
    );
    expect(result).toEqual({
      message: 'success',
      id: webhookId,
    });
  });

  it('loads sample records from perform-list API', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: [
          {
            event: 'conversation.rated',
            teamId: authData.team_id,
            botId: authData.bot_id,
            conversation: {
              id: 'conv_123',
              ratedAt: '2026-02-11T18:45:22.123456',
            },
          },
        ],
      }),
    };

    const bundle = {
      authData,
      inputData: {
        event: 'conversation.rated',
      },
    };

    const result = await App.triggers.webhook_event.operation.performList(
      z,
      bundle,
    );

    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `https://docsbot.ai/api/teams/${authData.team_id}/bots/${authData.bot_id}/webhooks/perform-list`,
        params: {
          event: 'conversation.rated',
          limit: 3,
        },
      }),
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      event: 'conversation.rated',
      teamId: authData.team_id,
      botId: authData.bot_id,
    });
    expect(result[0].id).toContain('conversation.rated');
  });

  it('normalizes incoming hook payload for deduping', async () => {
    const bundle = {
      cleanedRequest: {
        event: 'lead.created',
        teamId: authData.team_id,
        botId: authData.bot_id,
        lead: {
          id: 'conv_999',
          createdAt: '2026-02-10T14:30:00.000Z',
        },
      },
    };

    const result = await App.triggers.webhook_event.operation.perform(
      {},
      bundle,
    );

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(
      'lead.created:team_123:bot_123:conv_999:2026-02-10T14:30:00.000Z',
    );
  });

  it('throws API message on subscribe failure', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 400,
        json: {
          message: 'Invalid webhook target',
        },
      }),
    };

    const promise = App.triggers.webhook_event.operation.performSubscribe(
      z,
      {
        authData,
        targetUrl: 'https://hooks.zapier.com/hooks/catch/123',
        inputData: {
          event: 'lead.created',
        },
      },
    );

    await expect(promise).rejects.toThrow('Invalid webhook target');
  });

  it('throws when unsubscribe is missing webhook id', async () => {
    const promise = App.triggers.webhook_event.operation.performUnsubscribe(
      {},
      {
        authData,
        subscribeData: {},
      },
    );

    await expect(promise).rejects.toThrow(
      'Missing webhook id in subscription data.',
    );
  });

  it('builds dynamic lead metadata output fields from the bot lead form', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: {
          id: 'bot_123',
          leadCollect: {
            enabled: true,
            mode: 'before_response',
            fields: [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'companySize', label: 'Company Size', type: 'select' },
            ],
          },
        },
      }),
    };
    const outputFields = App.triggers.webhook_event.operation.outputFields;
    const dynamicFn = outputFields.find((f) => typeof f === 'function');
    const result = await dynamicFn(z, {
      authData,
      inputData: { event: 'lead.created' },
    });
    expect(z.request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'GET',
        url: `https://docsbot.ai/api/teams/${authData.team_id}/bots/${authData.bot_id}`,
        headers: expect.objectContaining({
          Authorization: `Bearer ${authData.api_key}`,
        }),
      }),
    );
    expect(result).toEqual([
      {
        key: 'lead__metadata__name',
        label: 'Lead — Name (metadata)',
        type: 'string',
      },
      {
        key: 'lead__metadata__companySize',
        label: 'Lead — Company Size (metadata)',
        type: 'string',
      },
    ]);
  });

  it('returns no dynamic lead metadata fields for non-lead events', async () => {
    const z = { request: jest.fn() };
    const outputFields = App.triggers.webhook_event.operation.outputFields;
    const dynamicFn = outputFields.find((f) => typeof f === 'function');
    const result = await dynamicFn(z, {
      authData,
      inputData: { event: 'conversation.rated' },
    });
    expect(z.request).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
