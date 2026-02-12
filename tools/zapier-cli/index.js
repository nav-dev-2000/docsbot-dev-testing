const authentication = require('./authentication');
const askQuestionCreate = require('./creates/ask_question.js');
const createSourceCreate = require('./creates/create_source.js');
const chatAgentCreate = require('./creates/chat_agent.js');
const semanticSearchCreate = require('./creates/semantic_search.js');
const createConversationTicketCreate = require('./creates/create_conversation_ticket.js');
const summarizeConversationCreate = require('./creates/summarize_conversation.js');
const webhookEventTrigger = require('./triggers/webhook_event.js');

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  flags: {
    cleanInputData: false,
  },
  authentication: authentication,
  creates: {
    [askQuestionCreate.key]: askQuestionCreate,
    [createSourceCreate.key]: createSourceCreate,
    [chatAgentCreate.key]: chatAgentCreate,
    [semanticSearchCreate.key]: semanticSearchCreate,
    [createConversationTicketCreate.key]: createConversationTicketCreate,
    [summarizeConversationCreate.key]: summarizeConversationCreate,
  },
  triggers: {
    [webhookEventTrigger.key]: webhookEventTrigger,
  },
};
