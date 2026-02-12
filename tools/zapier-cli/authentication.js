module.exports = {
  type: 'custom',
  test: {
    headers: {
      Authorization: 'Bearer {{bundle.authData.api_key}}',
      'X-API-KEY': '{{bundle.authData.api_key}}',
      'X-TEAM-ID': '{{bundle.authData.team_id}}',
      'X-BOT-ID': '{{bundle.authData.bot_id}}',
    },
    params: {
      api_key: '{{bundle.authData.api_key}}',
      team_id: '{{bundle.authData.team_id}}',
      bot_id: '{{bundle.authData.bot_id}}',
    },
    url: 'https://docsbot.ai/api/teams/{{bundle.authData.team_id}}/bots/{{bundle.authData.bot_id}}',
  },
  fields: [
    {
      computed: false,
      key: 'api_key',
      required: true,
      label: 'DocsBot API Key',
      type: 'password',
      helpText:
        'You can create and copy your key from the [API tab of your DocsBot team dashboard](https://docsbot.ai/app/api).',
    },
    {
      computed: false,
      key: 'team_id',
      required: true,
      label: 'Team ID',
      type: 'string',
      helpText:
        'You can find your Team ID by [selecting the bot to connect](https://docsbot.ai/app/bots), and clicking the "Sharing & API" link on it in your DocsBot dashboard.',
    },
    {
      computed: false,
      key: 'bot_id',
      required: true,
      label: 'Bot ID',
      type: 'string',
      helpText:
        'You can find your Bot ID by [selecting the bot to connect](https://docsbot.ai/app/bots), and clicking the "Sharing & API" link on it in your DocsBot dashboard.',
    },
  ],
  customConfig: {},
  connectionLabel: '{{bundle.inputData.name}}',
};
