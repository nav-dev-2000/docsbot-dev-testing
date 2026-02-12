const parseApiResponse = (response) => {
  if (response.status >= 400) {
    const message = response.json?.message || response.json?.error || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.json;
};

module.exports = {
  display: {
    description:
      'Generate or retrieve a conversation summary, title, and sentiment.',
    hidden: false,
    label: 'Summarize Conversation',
  },
  key: 'summarize_conversation',
  noun: 'Conversation Summary',
  operation: {
    inputFields: [
      {
        key: 'thread_key',
        label: 'Conversation UUID',
        type: 'string',
        required: true,
        helpText: 'UUID of an existing chat-agent conversation.',
      },
    ],
    sample: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      conversationId: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Pricing plans overview',
      summary:
        'User asked about pricing plans and received details on the key tiers.',
      sentiment: 'positive',
    },
    outputFields: [
      { key: 'id', label: 'Conversation ID' },
      { key: 'conversationId', label: 'Conversation ID' },
      { key: 'title', label: 'Title' },
      { key: 'summary', label: 'Summary' },
      { key: 'sentiment', label: 'Sentiment' },
    ],
    perform: async (z, bundle) => {
      const conversationId = bundle.inputData.thread_key;
      const response = await z.request({
        method: 'GET',
        url: `https://api.docsbot.ai/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/conversations/${conversationId}/summarize`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
      });

      const data = parseApiResponse(response);
      return {
        id: conversationId,
        conversationId,
        title: data.title || null,
        summary: data.summary || null,
        sentiment: data.sentiment || null,
      };
    },
  },
};
