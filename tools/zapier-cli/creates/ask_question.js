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

module.exports = {
  display: {
    description:
      'Legacy chat action. Ask a question and get an answer. For new workflows, use Chat Agent Message (Recommended).',
    hidden: false,
    label: 'Ask Question (Legacy)',
  },
  key: 'ask_question',
  noun: 'Question',
  operation: {
    inputFields: [
      {
        key: 'question',
        label: 'Question',
        type: 'string',
        helpText:
          'A question to ask the bot. Can be 5 to 2000 characters long.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'full_source',
        label: 'Full Sources',
        type: 'boolean',
        helpText:
          'Whether the full source text content should be returned. Defaults to `false`',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'metadata',
        label: 'Metadata',
        helpText:
          'A user identification object with arbitrary metadata about the the user. Will be saved to the question history log. Keys `referrer`, `email`, and `name` are shown in question history logs.',
        dict: true,
        required: false,
        altersDynamicFields: false,
      },
      {
        key: 'format',
        label: 'Output Format',
        default: 'markdown',
        helpText:
          'Whether to return the answer as markdown or raw text. Defaults to `markdown`.',
        choices: ['markdown', 'text'],
        type: 'string',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'context_items',
        label: 'Context Items',
        type: 'integer',
        default: '5',
        helpText:
          'How many context sources to use for the answer. More sources uses more tokens (higher OpenAI API costs).',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'testing',
        label: 'Testing',
        type: 'boolean',
        default: 'false',
        helpText:
          'Whether to ignore the question or not in chat logs and reports. Defaults to `false`',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: {
      answer:
        "DocsBot AI is a service that allows you to create chatbots and generate content from your documentation. You can index your content with DocsBot AI and use its AI-powered chatbot to provide answers to your users. You can also use DocsBot AI's API and embeddable widgets to integrate your custom DocsBot into your website, WordPress, app/plugin, Slack, or anywhere else you want to use it.",
      couldAnswer: true,
      sources: [
        {
          type: 'sitemap',
          title:
            'DocsBot AI - Custom chatbots and content generation from your documentation',
          url: 'https://docsbot.ai',
          page: null,
          content: null,
        },
        {
          type: 'sitemap',
          title: 'Product Hunt Comment Generator - DocsBot',
          url: 'https://docsbot.ai/product-hunt',
          page: null,
          content: null,
        },
        {
          type: 'sitemap',
          title: 'Embeddable Chat Widget - Docs',
          url: 'https://docsbot.ai/docs/embeddable-chat-widget',
          page: null,
          content: null,
        },
      ],
      history: [
        [
          'What does it do?',
          "DocsBot AI is a service that allows you to create chatbots and generate content from your documentation. You can index your content with DocsBot AI and use its AI-powered chatbot to provide answers to your users. You can also use DocsBot AI's API and embeddable widgets to integrate your custom DocsBot into your website, WordPress, app/plugin, Slack, or anywhere else you want to use it.",
        ],
      ],
      id: 'hTAcHh1rS0jOlEQVMPSn',
    },
    outputFields: [
      { key: 'answer', label: 'Answer' },
      { key: 'couldAnswer', type: 'boolean', label: 'Could Bot Answer' },
      { key: 'sources[]type', label: 'Source Type' },
      { key: 'sources[]title', label: 'Source Title' },
      { key: 'sources[]url', label: 'Source URL' },
      { key: 'sources[]page', label: 'Source Page #' },
      { key: 'sources[]content', label: 'Source Text Content' },
      { key: 'id', label: 'Answer ID' },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
        method: 'POST',
        url: `https://api.docsbot.ai/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/chat`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
        body: cleanRequestBody({
          question: bundle.inputData.question,
          full_source: bundle.inputData.full_source,
          metadata: bundle.inputData.metadata,
          format: bundle.inputData.format,
          testing: bundle.inputData.testing,
          context_items: bundle.inputData.context_items,
        }),
      });

      return parseApiResponse(response);
    },
  },
};
