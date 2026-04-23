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

const normalizeLeadFieldType = (type) => {
  const t = (type || 'text').toString().toLowerCase();
  if (t === 'datetime') {
    return 'datetime-local';
  }
  return t;
};

/** Map lead form field `type` to Zapier output field `type` (for labels + sample validation). */
const mapLeadFieldTypeToZapier = (type) => {
  const t = normalizeLeadFieldType(type);
  if (t === 'number') {
    return 'number';
  }
  if (t === 'datetime-local') {
    return 'datetime';
  }
  return 'string';
};

/** Per-field example from the form placeholder when it is non-empty; numbers must parse. */
const sampleFromPlaceholder = (field) => {
  if (field == null || field.placeholder == null) {
    return undefined;
  }
  const raw =
    typeof field.placeholder === 'string'
      ? field.placeholder.trim()
      : String(field.placeholder).trim();
  if (!raw) {
    return undefined;
  }
  if (mapLeadFieldTypeToZapier(field.type) === 'number') {
    const n = Number(raw);
    if (!Number.isNaN(n)) {
      return n;
    }
    return undefined;
  }
  return raw;
};

const firstSelectOptionSample = (field) => {
  if (!Array.isArray(field.options) || field.options.length === 0) {
    return 'option_a';
  }
  const opt = field.options[0];
  if (typeof opt === 'string') {
    const s = opt.trim();
    return s || 'option_a';
  }
  if (opt && typeof opt === 'object') {
    if (opt.value != null && String(opt.value).trim() !== '') {
      return String(opt.value);
    }
    if (opt.label != null && String(opt.label).trim() !== '') {
      return String(opt.label);
    }
  }
  return 'option_a';
};

/**
 * Collapse separators so `first_name`, `first-name`, `firstName` → `firstname`.
 * Keeps alphanumerics (matches common lead form keys from @/lib/leadCollect).
 */
const normalizeFieldKeyForNameMatch = (key) =>
  (key || '')
    .toString()
    .toLowerCase()
    .replace(/[-_\s.:[\]]/g, '');

// Full / display
const LEAD_KEY_FULL_NAME = new Set([
  'name',
  'fullname',
  'displayname',
  'profilename',
  'primaryname',
  'completename',
  'legalname',
  'firstandlastname',
  'customername',
  'contactname',
  'applicantname',
  'cardholdername',
]);

// First / given: firstname, first-name, givenname, given-name, fname, forename, …
const LEAD_KEY_FIRST_NAME = new Set([
  'firstname',
  'givenname',
  'fname',
  'forename',
  'forname',
  'first',
  'f_name',
  'prenom',
  'christianname',
]);

// Last: lastname, last-name, surname, familyname, family-name, …
const LEAD_KEY_LAST_NAME = new Set([
  'lastname',
  'surname',
  'familyname',
  'lname',
  'last',
  'l_name',
  'nom',
  'maidenname',
  'mothersmaidenname',
  'mothersmaiden',
  'formername',
  'previousname',
  'surnameatbirth',
  'familylastname',
]);

const sampleForNameKeyField = (field) => {
  const t = normalizeLeadFieldType(field.type);
  if (t !== 'text' && t !== 'textarea') {
    return null;
  }
  const k = normalizeFieldKeyForNameMatch(field.key);
  if (!k) {
    return null;
  }
  if (LEAD_KEY_FULL_NAME.has(k)) {
    return 'Jane Doe';
  }
  if (LEAD_KEY_FIRST_NAME.has(k)) {
    return 'Jane';
  }
  if (LEAD_KEY_LAST_NAME.has(k)) {
    return 'Doe';
  }
  return null;
};

/**
 * Default example values for Zap “test” and mapping when no usable placeholder
 * (matches lead field types in Widget Actions / lead collection).
 */
const defaultSampleForLeadField = (field) => {
  const t = normalizeLeadFieldType(field.type);
  if (t === 'text' || t === 'textarea') {
    const byName = sampleForNameKeyField(field);
    if (byName != null) {
      return byName;
    }
  }
  switch (t) {
    case 'email':
      return 'jane.doe@example.com';
    case 'tel':
      return '+1 415 555 0100';
    case 'url':
      return 'https://example.com';
    case 'number':
      return 42;
    case 'textarea':
      return 'Sample message for Zapier testing.';
    case 'select':
      return firstSelectOptionSample(field);
    case 'date':
      return '2026-04-23';
    case 'datetime-local':
      return '2026-04-23T14:30:00.000Z';
    case 'time':
      return '14:30';
    case 'month':
      return '2026-04';
    case 'week':
      return '2026-W17';
    case 'color':
      return '#3366cc';
    case 'text':
      return 'Sample text';
    default:
      return 'Sample text';
  }
};

const resolveLeadOutputSample = (field) => {
  const fromPlaceholder = sampleFromPlaceholder(field);
  if (fromPlaceholder !== undefined) {
    return fromPlaceholder;
  }
  return defaultSampleForLeadField(field);
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
        const out = {
          key: `lead__metadata__${k}`,
          label: `Lead — ${label} (metadata)`,
          type: mapLeadFieldTypeToZapier(field.type),
          sample: resolveLeadOutputSample(field),
        };
        return out;
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
