const WEBHOOK_EVENT_LEAD_CREATED = 'lead.created';
const WEBHOOK_EVENT_DEEP_RESEARCH_DONE = 'deep_research.done';
const WEBHOOK_EVENT_CONVERSATION_ESCALATED = 'conversation.escalated';
const WEBHOOK_EVENT_CONVERSATION_RATED = 'conversation.rated';

const WEBHOOK_EVENTS = [
  WEBHOOK_EVENT_LEAD_CREATED,
  WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
  WEBHOOK_EVENT_CONVERSATION_RATED,
];

const DEFAULT_EVENT = WEBHOOK_EVENT_LEAD_CREATED;

const buildBotUrl = (bundle) =>
  `https://docsbot.ai/api/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}`;

const buildWebhookBaseUrl = (bundle) => `${buildBotUrl(bundle)}/webhooks`;

/** Map lead form field `type` to Zapier output field types. */
const mapLeadFieldTypeToZapier = (type) => {
  const t = (type || 'text').toString().toLowerCase();
  if (t === 'number') {
    return 'number';
  }
  return 'string';
};

/**
 * When the trigger is "Lead Created", fetches the bot and exposes one Zapier
 * output field per lead form field (Widget Actions → lead collection) using
 * nested keys: lead__metadata__<fieldKey>. Zapier can refresh these from
 * the editor; webhook payloads at runtime still carry whatever keys were submitted.
 */
const buildLeadMetadataOutputFields = async (z, bundle) => {
  const event =
    bundle?.inputData?.event ||
    bundle?.subscribeData?.event ||
    DEFAULT_EVENT;
  if (event !== WEBHOOK_EVENT_LEAD_CREATED) {
    return [];
  }

  if (!bundle?.authData?.team_id || !bundle?.authData?.bot_id) {
    return [];
  }

  try {
    const response = await z.request({
      method: 'GET',
      url: buildBotUrl(bundle),
      headers: {
        Authorization: `Bearer ${bundle.authData.api_key}`,
        Accept: 'application/json',
      },
    });
    if (response.status >= 400) {
      return [];
    }
    const bot = response.json;
    const leadCollect = bot?.leadCollect;
    if (!leadCollect || !Array.isArray(leadCollect.fields)) {
      return [];
    }
    return leadCollect.fields
      .map((field) => {
        if (!field || typeof field.key !== 'string') {
          return null;
        }
        const k = field.key.trim();
        if (!k) {
          return null;
        }
        const label =
          typeof field.label === 'string' && field.label.trim()
            ? field.label.trim()
            : k;
        return {
          key: `lead__metadata__${k}`,
          label: `Lead — ${label} (metadata)`,
          type: mapLeadFieldTypeToZapier(field.type),
        };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
};

const parseApiResponse = (response) => {
  if (response.status >= 400) {
    const message = response.json?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return response.json;
};

const normalizePayload = (payload = {}) => {
  const event = payload.event || DEFAULT_EVENT;
  const objectId =
    payload?.lead?.id ||
    payload?.conversation?.id ||
    payload?.research?.jobId ||
    'item';
  const objectTimestamp =
    payload?.lead?.updatedAt ||
    payload?.lead?.createdAt ||
    payload?.conversation?.ratedAt ||
    payload?.conversation?.escalatedAt ||
    payload?.conversation?.updatedAt ||
    payload?.research?.completedAt ||
    payload?.research?.createdAt ||
    'unknown';

  const id =
    payload.id ||
    `${event}:${payload.teamId || 'team'}:${payload.botId || 'bot'}:${objectId}:${objectTimestamp}`;

  return {
    ...payload,
    id,
  };
};

const eventChoiceLabels = {
  [WEBHOOK_EVENT_LEAD_CREATED]: 'Lead Created',
  [WEBHOOK_EVENT_DEEP_RESEARCH_DONE]: 'Deep Research Done',
  [WEBHOOK_EVENT_CONVERSATION_ESCALATED]: 'Conversation Escalated',
  [WEBHOOK_EVENT_CONVERSATION_RATED]: 'Conversation Rated',
};

module.exports = {
  key: 'webhook_event',
  noun: 'Webhook Event',
  display: {
    label: 'Webhook Event',
    description:
      'Triggers when DocsBot sends a webhook event to Zapier.',
  },
  operation: {
    type: 'hook',
    inputFields: [
      {
        key: 'event',
        label: 'Event',
        required: true,
        default: DEFAULT_EVENT,
        choices: eventChoiceLabels,
        helpText: 'Webhook event type to subscribe to.',
      },
      {
        key: 'label',
        label: 'Webhook Label',
        required: false,
        type: 'string',
        helpText: 'Optional label for this webhook subscription.',
      },
      {
        key: 'expirationDate',
        label: 'Expiration Date',
        required: false,
        type: 'datetime',
        helpText: 'Optional ISO-8601 expiration date for this webhook.',
      },
    ],
    performSubscribe: async (z, bundle) => {
      const event = bundle.inputData.event || DEFAULT_EVENT;
      const requestBody = {
        targetUrl: bundle.targetUrl,
        events: [event],
        source: 'zapier',
      };

      if (bundle.inputData.label) {
        requestBody.label = bundle.inputData.label;
      }

      if (bundle.inputData.expirationDate) {
        requestBody.expirationDate = bundle.inputData.expirationDate;
      }

      const response = await z.request({
        method: 'POST',
        url: buildWebhookBaseUrl(bundle),
        headers: {
          Authorization: `Bearer ${bundle.authData.api_key}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const data = parseApiResponse(response);
      return {
        id: data.id,
        webhookId: data.id,
        event,
      };
    },
    performUnsubscribe: async (z, bundle) => {
      const webhookId =
        bundle.subscribeData.webhookId || bundle.subscribeData.id;

      if (!webhookId) {
        throw new Error('Missing webhook id in subscription data.');
      }

      const response = await z.request({
        method: 'DELETE',
        url: `${buildWebhookBaseUrl(bundle)}/${webhookId}`,
        headers: {
          Authorization: `Bearer ${bundle.authData.api_key}`,
          Accept: 'application/json',
        },
      });

      return parseApiResponse(response);
    },
    performList: async (z, bundle) => {
      const event =
        bundle.inputData.event || bundle.subscribeData?.event || DEFAULT_EVENT;
      const response = await z.request({
        method: 'GET',
        url: `${buildWebhookBaseUrl(bundle)}/perform-list`,
        params: {
          event,
          limit: 3,
        },
        headers: {
          Authorization: `Bearer ${bundle.authData.api_key}`,
          Accept: 'application/json',
        },
      });

      const data = parseApiResponse(response);
      if (!Array.isArray(data)) {
        return [];
      }

      return data.map(normalizePayload);
    },
    perform: async (z, bundle) => {
      const payload = bundle.cleanedRequest || {};
      return [normalizePayload(payload)];
    },
    sample: {
      id: 'lead.created:team_123:bot_123:conv_sample_001:2026-02-10T14:30:00.000Z',
      event: WEBHOOK_EVENT_LEAD_CREATED,
      teamId: 'team_123',
      botId: 'bot_123',
      lead: {
        id: 'conv_sample_001',
        createdAt: '2026-02-10T14:30:00.000Z',
        updatedAt: null,
        metadata: {
          name: 'Jane Doe',
          email: 'jane@example.com',
        },
        ip: 'hashed-ip',
      },
    },
    outputFields: [
      { key: 'id', label: 'Event ID' },
      { key: 'event', label: 'Event Type' },
      { key: 'teamId', label: 'Team ID' },
      { key: 'botId', label: 'Bot ID' },
      { key: 'lead__id', label: 'Lead — ID' },
      { key: 'lead__createdAt', label: 'Lead — Created at', type: 'datetime' },
      { key: 'lead__updatedAt', label: 'Lead — Updated at', type: 'datetime' },
      { key: 'lead__ip', label: 'Lead — IP (hashed)' },
      buildLeadMetadataOutputFields,
    ],
  },
};
