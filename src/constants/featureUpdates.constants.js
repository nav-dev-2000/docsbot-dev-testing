export const FEATURE_UPDATES = [
  {
    date: '2026-03-12',
    title: 'Widget Content options: Keep footer message visible',
    description:
      'When enabled, the footer message will remain visible even after the user sends their first message.',
  },
  {
    date: '2026-03-12',
    title: 'Zoho Desk ticket source',
    description:
      'Import recent closed Zoho Desk tickets as source content for your bots to learn from staff responses.',
  },
  {
    date: '2026-03-11',
    title: 'Zendesk Guide category-based article sync filtering',
    description:
      'Zendesk Guide sync can now limit article imports to selected categories instead of syncing all Help Center articles.',
  },
  {
    date: '2026-03-10',
    title: 'Team icon in selector and settings',
    description:
      'Upload a custom team icon on the Team page. Icons appear in the team selector and are copied from the first bot’s brand when available.',
  },
  {
    date: '2026-03-06',
    title: 'Quick team switching from the dashboard header',
    description:
      'Switch teams from the top bar and create a new team from the same dropdown without leaving your current workflow.',
  },
  {
    date: '2026-03-05',
    title: 'GPT-5.4 Model Support',
    description:
      'Bots can now use the newest GPT-5.4 frontier model with improved reasoning, real world knowledge, and better tool efficiency.',
  },
  {
    date: '2026-03-04',
    title: 'Slack App Improvements: Multi-bot per Workspace',
    description:
      'Connect one Slack workspace to multiple bots, manage defaults per workspace, and switch bots per channel with /docsbot command or mention @DocsBot for inline replies the whole channel can see.',
  },
  {
    date: '2026-03-02',
    title: 'Redesigned bot dashboard',
    description:
      'Bot dashboard reorganized for easier navigation, faster access to key management areas, and improved performance.',
  },
  {
    date: '2026-03-01',
    title: 'New vector database for training data',
    description:
      'Migrated training data to a new vector database for lower latency, faster responses, more accurate search, and US/EU data residency choice.',
  },
  {
    date: '2026-02-12',
    title: 'Zapier integration update',
    description:
      'Updated Zapier with our Chat Agent API, Semantic Search, Conversation Ticket and Summary actions, plus triggers for leads, deep research, escalations, and ratings.',
  },
  {
    date: '2026-02-10',
    title: 'Webhook support',
    description:
      'Subscribe to bot events (lead capture, deep research, escalation, rating) via REST hooks. Zapier-ready, per-bot storage, multi-event subscriptions. Configure in Integrations.',
  },
  {
    date: '2026-02-07',
    title: 'Lead collection tool in chat widget',
    description:
      'Add a customizable lead collection form to your chat widget to collect lead data from users before they start a conversation or before escalation.',
  },
  {
    date: '2026-02-06',
    title: 'Question History MCP endpoint',
    description:
      'AI assistants can now connect to question history to review past support conversations and improve responses.',
  },
  {
    date: '2026-02-02',
    title: 'Per-bot roles and permissions',
    description:
      'Assign different roles (admin, editor, viewer, none) to team members for individual bots. Override team-level permissions with bot-specific access controls. Ideal for agencies or resellers.',
  },
  {
    date: '2026-01-29',
    title: 'Widget link safety confirmation',
    description:
      'Added link safety feature in widget settings (off by default) to show a confirmation modal when clicking links outside the current site or allowed domains.',
  },
  {
    date: '2026-01-28',
    title: 'Question history search tool for deep research',
    description:
      'Deep research can now search your question history to find past questions and answers. Useful for identifying common bugs, feature requests, documentation gaps, and user patterns.',
  },
  {
    date: '2026-01-27',
    title: 'Agent mode multiple search loops',
    description:
      "Bots can perform multiple searches with reasoning in between when documentation isn't found. Control limits via custom instructions or the new API parameter.",
  },
  {
    date: '2026-01-27',
    title: 'Help Scout: Control when AI should not respond',
    description:
      'Prompt the AI when it should not respond in Help Scout. For example: vacation auto-responders, spam emails, or sales emails. New recommended Help Scout prompt template available.',
  },
  {
    date: '2026-01-26',
    title: 'GPT-5 mini default for new bots',
    description:
      'New bots now default to GPT-5 mini. GPT-5 mini and GPT-5.2 are now our recommended models.',
  },
  {
    date: '2026-01-25',
    title: 'Help Scout integration enhancements',
    description:
      'Save Help Scout replies to conversation logs for review, AI summaries, topic/resolution/sentiment stats, and deep links to the Help Scout dashboard. Ability to skip AI replies when needed via Help Scout instructions.',
  },
  {
    date: '2026-01-23',
    title: 'Major Agent API upgrade for more powerful capabilities',
    description:
      'Major Agent API upgrade with OpenAI Responses API, tool calls, reasoning summaries, and multi-step loops to provide more accurate answers.',
  },
  {
    date: '2026-01-23',
    title: 'Dashboard chat shows reasoning and tool calls',
    description:
      'Chat dashboard shows reasoning events and search tool calls, plus a new reasoning selector for dashboard chats.',
  },
  {
    date: '2026-01-14',
    title: 'viaSocket automation integration',
    description:
      'Connect DocsBot to viaSocket workflows from the Integrations grid.',
  },
  {
    date: '2026-01-13',
    title: 'Semantic search for question logs',
    description:
      'Search question logs by meaning, not keywords. Semantic-only search with natural language queries.',
  },
  {
    date: '2026-01-13',
    title: 'Google Drive folder selection',
    description:
      'Google Drive sources can select folders for recursive indexing!',
  },
  {
    date: '2026-01-12',
    title:
      'Enhanced markdown rendering throughout the dashboard to match the chat widget',
    description:
      'Chats, question and conversation logs, in addition to chat widget responses, now render markdown better for improved readability and support for CJK languages, LaTeX formulas, tables, images, and new Mermaid diagrams.',
  },
  {
    date: '2025-01-12',
    title: 'Admin API documentation expansion',
    description:
      'Added Admin API docs for team members/invites, bot reports, and research jobs.',
  },
  {
        date: '2025-12-30',
        title: 'Enhanced markdown rendering in chat widget',
        description:
            'Improved markdown rendering in chat widget for CJK languages, LaTeX formulas, tables, images, and support for Mermaid diagrams.',
    },
    {
        date: '2025-12-19',
        title: 'Deep Research browser notifications',
        description:
            'Subscribe to native browser notifications when long-running Deep Research jobs finish.',
    },
    {
        date: '2025-12-17',
        title: 'MCP OAuth for private bots',
        description:
            'Private bots now support OAuth authentication for MCP clients. Manage authorized clients in API & Integrations settings.',
    },
    {
        date: '2025-12-12',
        title: 'Metadata viewer in logs',
        description:
            'View and copy custom conversation/question metadata in your logs. ',
    },
    {
        date: '2025-12-11',
        title: 'OpenAI GPT-5.2 model support',
        description:
            'Bots can now choose GPT-5.2 with stronger long-context reasoning.',
    },
    {
        date: '2025-12-04',
        title: 'Add files to existing Google Drive sources',
        description:
            'You can now add files to your existing Google Drive source types without creating a new source.',
    },
    {
        date: '2025-11-29',
        title: 'Copy button on widget responses',
        description:
            'Add a widget setting to enable a copy button after widget responses, off by default.',
    },
    {
        date: '2025-11-21',
        title: 'Widget Settings Refresh',
        description:
            'Widget settings now show detected brand colors, logos, icons, and avatar options when available for faster edits.',
    },
    {
        date: '2025-11-20',
        title: 'Schedule YouTube playlist refreshes',
        description:
            'Schedule automatic retries and refreshes for eligible YouTube playlist sources directly from the sources form.',
    },
    {
        date: '2025-11-15',
        title: 'GPT-5.1 Model Support',
        description:
            'Switch bots to GPT-5.1 for faster and more intelligent instruction handling and responses. GPT-5.1 is the latest model from OpenAI and is now available for use in your bots.',
    },
    {
        date: '2025-11-14',
        title: 'Deep Research Agent',
        description:
            'Use advanced reasoning models to perform comprehensive multi-step research tasks by searching and reading all your documentation, browsing the web, and executing code to perform math and data analysis. ',
    },
    {
        date: '2025-11-12',
        title: 'MCP Server',
        description:
            'Our new MCP server can be used in ChatGPT, Claude, or any other app that supports the MCP protocol to search and fetch documentation from your bots. Find it in the "Integrations" tab of your bot dashboard.',
    },
    {
        date: '2025-10-29',
        title: 'Dashboard Tour Wizard',
        description:
            'New & invitedusers now get a guided tour of key dashboard features when they sign up.',
    },
    {
        date: '2025-10-24',
        title: 'Guided Bot Onboarding Wizard',
        description:
            'New multi-step onboarding wizard auto-detects branding and sources from your website link to launch bots faster.',
    },
    {
        date: '2025-10-03',
        title: 'Printable Question Topic Reports',
        description:
            'Print or download question topic reports as PDFs directly from the bot reports page.',
    },
    {
        date: '2025-10-01',
        title: 'SOC 2 Type II Certification',
        description:
            'We are now SOC 2 Type II certified proving our commitment to security and compliance. For more information, see our blog post.',
    },
    {
        date: '2025-09-16',
        title: 'Account Display Name Updates',
        description:
            'Users can now update their display name directly from the account page.',
    },
    {
        date: '2025-09-12',
        title: 'Widget option: reasoningEffort',
        description:
            'Control agent mode response depth with new reasoningEffort option in the chat widget.',
    },
    {
        date: '2025-09-11',
        title: 'API & Widget Integration Documentation',
        description:
            'Added Conversations API docs and integration guides for Zoho Chat, Gorgias, and LiveChat widgets.',
    },
    {
        date: '2025-09-09',
        title: 'FreeScout months in source details',
        description:
            'FreeScout sources now display the selected ticket months in source metadata.',
    },
    {
        date: '2025-08-31',
        title: 'Enhanced Date Range Picker in Analytics',
        description:
            'Analytics now features a flexible date range picker with custom shortcuts (7 days, 30 days, quarter, year) and visual date range display.',
    },
    {
        date: '2025-08-28',
        title: 'FreeScout ticket source',
        description:
            'Import and learn from closed tickets in FreeScout mailboxes with configurable history.',
    },
    {
        date: '2025-08-21',
        title: 'Redesigned Chat Share Page with Agent Mode Support',
        description:
            'The public chat share page has been completely redesigned with a modern layout using the chat widget design, and enhanced support for agent mode bots.',
    },
    {
        date: '2025-08-21',
        title: 'Widget option: suggestedQuestions',
        description:
            'Control how many random suggested questions appear in the embed widget.',
    },
    {
        date: '2025-08-20',
        title: 'Support callback metadata enhancements',
        description:
            'Widget supportCallback now includes conversationId and conversationUrl in metadata for easier ticket integrations.',
    },
    {
        date: '2025-08-18',
        title: 'Cohere embeddings v4 support',
        description:
            'Added Cohere embeddings v4. Now default for paid non-English bots on creation.',
    },
    {
        date: '2025-08-13',
        title: 'Widget option: keepFooterVisible',
        description:
            'New keepFooterVisible option keeps custom footer text visible after a conversation starts in the embed widget.',
    },
    {
        date: '2025-08-13',
        title: 'Notification center in dashboard',
        description:
            'A new bell icon in the dashboard header shows a drop-down with the latest feature updates. Unread updates are highlighted.',
    },
    {
        date: '2025-08-13',
        title: 'Reasoning Effort Parameter in API',
        description:
            'Chat Agent API docs updated to include the new reasoning effort parameter for more control over responses.',
    },
    {
        date: '2025-08-12',
        title: 'Prompt Debugging for Custom Instructions',
        description:
            'Debug your custom instructions with new prompt debugging tools for easier troubleshooting. Click "Custom Instructions" in the bot dashboard to get started.',
    },
    {
        date: '2025-08-10',
        title: 'SRT Uploads for Document Sources',
        description:
            'You can now upload SRT subtitles/captions files as document sources for your bots.',
    },
    {
        date: '2025-08-10',
        title: 'Conversation Topics in Analytics',
        description:
            'Track and analyze conversation topics directly in your analytics dashboard. Click "Reports" in the bot dashboard to get started.',
    },
    {
        date: '2025-08-07',
        title: 'Added New AI Models: GPT-5, o3, o4-mini',
        description:
            'Support for GPT-5, o3, and o4-mini models has been added for your bots.',
    },
    {
        date: '2025-08-06',
        title: 'Auto-Summarize Recent Conversations',
        description:
            'A new scheduled job summarizes recent conversations to show instant insights in your conversation logs and reports.',
    },
    {
        date: '2025-08-04',
        title: 'FAQ Search Filtering in Q&A Modal',
        description:
            'Quickly filter FAQs in the QA modal with new search functionality.',
    },
    {
        date: '2025-08-04',
        title: 'Topic Management Modal',
        description:
            'Manage your conversation topics easily with the new Topic Management modal in reports.',
    },
    {
        date: '2025-08-04',
        title: 'Slack App Feedback Buttons',
        description:
            'Slack bot responses now include thumbs up/down buttons so users can rate answers directly in Slack.',
    },
    {
        date: '2025-08-04',
        title: 'Free PDF to Text Converter Tool',
        description:
            'Convert PDFs to text with AI using the new PDF to Text Converter tool.',
    },
    {
        date: '2025-08-03',
        title: 'Free PDF Summarizer Tool',
        description:
            'Summarize PDF documents with AI using the new PDF Summarizer tool.',
    },
    {
        date: '2025-08-03',
        title: 'Free PDF Quiz Generator Tool',
        description:
            'Generate quizzes from PDFs with the new PDF Quiz Generator tool, now with image support.',
    },
    {
        date: '2025-08-03',
        title: 'Free Screenshot Help Doc Generator',
        description:
            'Create help documentation from screenshots with the new AI-powered tool.',
    },
    {
        date: '2025-08-03',
        title: 'Free AI Email Response Generator',
        description:
            'Generate email responses with AI using the new Email Response Generator tool.',
    },
    {
        date: '2025-08-02',
        title: 'Semantic Search API: New Alpha parameter',
        description:
            'Semantic search API now has a new alpha parameter for more control over hybrid search.',
    },
    {
        date: '2025-08-02',
        title: 'Revise Answer Option in Dashboard Chat',
        description:
            'You can now revise answers directly in the dashboard chat for improved responses.',
    },
    {
        date: '2025-08-02',
        title: 'Larger Textarea in Revise & Q&A Modals',
        description:
            'The revise answer and Q&A modals now features a taller textarea for easier editing.',
    },
    {
        date: '2025-08-01',
        title: 'Free AI Slogan Generator Tool',
        description:
            'Create catchy slogans with the new free AI Slogan Generator tool.',
    },
    {
        date: '2025-07-30',
        title: 'Allow Single-Character Questions',
        description:
            'API and Widgets now accept single-character questions, improving support for languages like Japanese.',
    },
    {
        date: '2025-07-13',
        title: 'Paste or Enter URLs in URL List Source',
        description:
            'You can now paste or manually enter a list of URLs when using the URL List source type.',
    },
    {
        date: '2025-05-02',
        title: 'Default Language Parameter for Chat Agent API',
        description:
            'Chat Agent API now supports a default language parameter as a fallback if AI cannot detect the language. Used by the widget (browser language).',
    },
    {
        date: '2025-04-30',
        title: 'New API Endpoint for Ticket Writing on Escalation',
        description:
            'Added an API endpoint to write support tickets automatically on escalation, used by supportCallback in the chat widget.',
    },
]
