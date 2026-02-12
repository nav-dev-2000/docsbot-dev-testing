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

const PREFERRED_ANSWER_EVENTS = new Set([
  'lookup_answer',
  'answer',
  'support_escalation',
]);

const DEPRIORITIZED_ANSWER_EVENTS = new Set(['is_resolved_question']);

const selectFinalAnswerEvent = (events = []) => {
  const reversed = [...events].reverse();

  const preferred = reversed.find(
    (item) =>
      item?.data?.answer && PREFERRED_ANSWER_EVENTS.has(item?.event),
  );
  if (preferred) return preferred;

  const nonDeprioritized = reversed.find(
    (item) =>
      item?.data?.answer &&
      !DEPRIORITIZED_ANSWER_EVENTS.has(item?.event),
  );
  if (nonDeprioritized) return nonDeprioritized;

  return reversed.find((item) => item?.data?.answer) || null;
};

module.exports = {
  display: {
    description:
      'Recommended chat action. Send a message to DocsBot Chat Agent and return the latest main answer event.',
    hidden: false,
    label: 'Chat Agent Message (Recommended)',
  },
  key: 'chat_agent',
  noun: 'Chat Agent Response',
  operation: {
    inputFields: [
      {
        key: 'thread_key',
        label: 'Conversation UUID',
        type: 'string',
        required: true,
        helpText:
          'Stable UUID used to keep chat context between requests. Generate once and reuse for follow-ups.',
      },
      {
        key: 'question',
        label: 'Question',
        type: 'string',
        required: true,
      },
      {
        key: 'metadata',
        label: 'Metadata',
        dict: true,
        required: false,
      },
      {
        key: 'context_items',
        label: 'Context Items',
        type: 'integer',
        required: false,
      },
      {
        key: 'human_escalation',
        label: 'Enable Human Escalation',
        type: 'boolean',
        required: false,
      },
      {
        key: 'followup_rating',
        label: 'Enable Follow-up Rating',
        type: 'boolean',
        required: false,
      },
      {
        key: 'document_retriever',
        label: 'Use Document Retriever (default: true)',
        type: 'boolean',
        required: false,
      },
      {
        key: 'full_source',
        label: 'Full Sources',
        type: 'boolean',
        required: false,
      },
      {
        key: 'model',
        label: 'Model Override',
        type: 'string',
        required: false,
      },
      {
        key: 'reasoning_effort',
        label: 'Reasoning Effort',
        type: 'string',
        required: false,
        choices: ['none', 'minimal', 'low', 'medium', 'high'],
      },
      {
        key: 'search_limit',
        label: 'Search Limit',
        type: 'integer',
        required: false,
      },
    ],
    sample: {
      id: 'answer_123',
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      event: 'lookup_answer',
      answer: 'DocsBot can integrate with Zapier using webhooks and actions.',
      couldAnswer: true,
      sources: [
        {
          type: 'sitemap',
          title: 'Webhooks API',
          url: 'https://docsbot.ai/documentation/developer/webhooks-api',
          page: null,
          content: null,
          used: true,
        },
      ],
      history: [],
      eventCount: 2,
    },
    outputFields: [
      { key: 'id', label: 'Answer ID' },
      { key: 'conversationId', label: 'Conversation ID' },
      { key: 'event', label: 'Final Event' },
      { key: 'answer', label: 'Answer' },
      { key: 'couldAnswer', label: 'Could Answer', type: 'boolean' },
      { key: 'eventCount', label: 'Event Count', type: 'integer' },
      { key: 'sources[]type', label: 'Source Type' },
      { key: 'sources[]title', label: 'Source Title' },
      { key: 'sources[]url', label: 'Source URL' },
      { key: 'sources[]page', label: 'Source Page' },
      { key: 'sources[]content', label: 'Source Content' },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
        method: 'POST',
        url: `https://api.docsbot.ai/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/chat-agent`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
        body: cleanRequestBody({
          stream: false,
          conversationId: bundle.inputData.thread_key,
          question: bundle.inputData.question,
          metadata: bundle.inputData.metadata,
          context_items: bundle.inputData.context_items,
          human_escalation: bundle.inputData.human_escalation,
          followup_rating: bundle.inputData.followup_rating,
          document_retriever: bundle.inputData.document_retriever,
          full_source: bundle.inputData.full_source,
          model: bundle.inputData.model,
          reasoning_effort: bundle.inputData.reasoning_effort,
          search_limit: bundle.inputData.search_limit,
        }),
      });

      const data = parseApiResponse(response);
      const events = Array.isArray(data) ? data : [];
      const finalAnswerEvent = selectFinalAnswerEvent(events);
      const finalData = finalAnswerEvent?.data || {};

      return {
        id: finalData.id || null,
        conversationId: bundle.inputData.thread_key,
        event: finalAnswerEvent?.event || null,
        answer: finalData.answer || null,
        couldAnswer: finalData.couldAnswer ?? null,
        sources: finalData.sources || [],
        history: finalData.history || [],
        eventCount: events.length,
      };
    },
  },
};
