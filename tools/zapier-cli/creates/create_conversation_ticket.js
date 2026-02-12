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
      'Generate a support ticket draft from an existing Chat Agent conversation.',
    hidden: false,
    label: 'Create Conversation Ticket',
  },
  key: 'create_conversation_ticket',
  noun: 'Ticket',
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
      subject: 'Pricing and Feature Inquiry',
      message:
        "Hello,\n\nI'm interested in DocsBot pricing plans and feature differences...",
    },
    outputFields: [
      { key: 'id', label: 'Conversation ID' },
      { key: 'conversationId', label: 'Conversation ID' },
      { key: 'subject', label: 'Ticket Subject' },
      { key: 'message', label: 'Ticket Message' },
    ],
    perform: async (z, bundle) => {
      const conversationId = bundle.inputData.thread_key;
      const response = await z.request({
        method: 'GET',
        url: `https://api.docsbot.ai/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/conversations/${conversationId}/ticket`,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
      });

      const data = parseApiResponse(response);
      return {
        id: conversationId,
        conversationId,
        subject: data.subject || null,
        message: data.message || null,
      };
    },
  },
};
