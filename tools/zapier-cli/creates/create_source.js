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
    description: 'Creates a new source to train a bot.',
    hidden: false,
    label: 'Create Web Source',
  },
  key: 'create_source',
  noun: 'Source',
  operation: {
    inputFields: [
      {
        key: 'type',
        label: 'Type',
        type: 'string',
        helpText:
          'The source type. Can be url, rss, or sitemap for now. File upload types are coming soon.',
        choices: ['url', 'sitemap', 'rss'],
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'url',
        label: 'URL',
        type: 'string',
        helpText:
          'The source URL for the public webpage, sitemap, or RSS feed.',
        required: true,
        list: false,
        altersDynamicFields: false,
      },
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        helpText: 'The source title. Used only for `url` type, optional.',
        required: false,
        list: false,
        altersDynamicFields: false,
      },
    ],
    sample: {
      id: 'noDsl9wcSzCeURlNnvbK',
      pageCount: 0,
      file: null,
      chunkCount: 0,
      type: 'url',
      title: null,
      url: 'https://wordpress.org/',
      status: 'pending',
      createdAt: '2023-06-25T01:12:31.086Z',
    },
    outputFields: [
      { key: 'id', label: 'Source ID' },
      { key: 'pageCount', label: 'Page Count', type: 'integer' },
      { key: 'file', label: 'File path' },
      { key: 'chunkCount', label: 'Chunk Count', type: 'integer' },
      { key: 'type', label: 'Type' },
      { key: 'title', label: 'Title' },
      { key: 'url', label: 'URL' },
      { key: 'status', label: 'Status' },
      { key: 'createdAt', label: 'Created at', type: 'datetime' },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
        method: 'POST',
        url: `https://docsbot.ai/api/teams/${bundle.authData.team_id}/bots/${bundle.authData.bot_id}/sources`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${bundle.authData.api_key}`,
        },
        body: cleanRequestBody({
          type: bundle.inputData.type,
          title: bundle.inputData.title,
          url: bundle.inputData.url,
        }),
      });

      return parseApiResponse(response);
    },
  },
};
