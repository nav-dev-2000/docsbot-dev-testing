---
title: Research API
description: Create and manage deep research jobs with the DocsBot Research API.
---

The Research API allows you to create deep research jobs, provide clarifying answers to improve the research, and retrieve comprehensive results. This is the primary API for creating and managing research jobs programmatically. {% .lead %}

{% callout title="Admin API for Job Status" %}
For quick listing and retrieval of research job status, see the [Bot Research Jobs - Admin API](/documentation/developer/bot-research-api) documentation. That admin API is designed for simple status checks and job listing.
{% /callout %}

---

## Response Objects

### The Research Job object

Research jobs return the stored Firestore document for the job. Common fields include:

| Property        | Type         | Description                                             |
| --------------- | ------------ | ------------------------------------------------------- |
| **jobId**       | string       | The research job ID.                                   |
| **status**      | string       | Job status (e.g., `clarifying`, `queued`, `running`, `completed`). |
| **title**       | string/null  | The job title if set.                                  |
| **question**    | string/null  | The prompt or question submitted for research.         |
| **response**    | object/null  | The model response payload, if completed.              |
| **createdAt**   | string/null  | Job creation timestamp.                                |
| **completedAt** | string/null  | Completion timestamp if finished.                      |
| **cancelledAt** | string/null  | Cancellation timestamp if deleted.                     |

---

## Create Research Job

This endpoint creates a new deep research job and returns clarifying questions to improve the research. The AI will ask for clarification on your question to ensure the best possible results.

`POST https://api.docsbot.ai/teams/:teamId/bots/:botId/research`

### Authentication

This endpoint requires authentication using a Bearer token. See [Authentication](/documentation/developer/authentication) for details.

### Parameters

| Property        | Type    | Description                                                  |
| --------------- | ------- | ------------------------------------------------------------ |
| **question**    | string  | The research question to clarify or run. Required.           |
| **model**       | string  | Deep research model to use. Options: `o3`, `o4-mini`. Default: `o4-mini`. |
| **web_search**  | boolean | Enable web search tool for deep research. Default: `false`.   |
| **code_interpreter** | boolean | Enable code interpreter tool. Default: `false`.           |
| **docs_search** | boolean | Enable documentation search tool. Default: `true`.            |
| **question_history** | boolean | Enable question history tool for Firestore search. Default: `false`. |
| **metadata**    | object  | Optional user metadata. Keys `name` and `email` are recognized. |

### Examples

#### cURL

```bash
curl --request POST \
  'https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research' \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "question": "What are the current trends in AI customer support?",
    "model": "o4-mini",
    "web_search": true,
    "docs_search": true
  }'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var raw = JSON.stringify({
  question: 'What are the current trends in AI customer support?',
  model: 'o4-mini',
  web_search: true,
  docs_search: true,
})

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
}

fetch(
  'https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with job details and clarifying questions:

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "clarifications": "- Are you interested in trends from a specific industry or use case?",
  "title": "AI Customer Support Trends",
  "status": "clarifying"
}
```

You can now provide answers to the clarifying questions using the continue endpoint.

---

## Continue Research Job

This endpoint continues a research job by providing answers to clarifying questions. The AI will use your answers to refine the research and provide more accurate results.

`POST https://api.docsbot.ai/teams/:teamId/bots/:botId/research/:jobId`

### Authentication

This endpoint requires authentication using a Bearer token.

### Parameters

| Property        | Type    | Description                                                  |
| --------------- | ------- | ------------------------------------------------------------ |
| **answers**     | string  | Answers to clarifying questions. Required.                   |
| **model**       | string  | Override deep research model for this job. Optional.         |
| **web_search**  | boolean | Override enabling web search tool. Optional.                 |
| **code_interpreter** | boolean | Override enabling code interpreter tool. Optional.       |
| **docs_search** | boolean | Override enabling documentation search tool. Optional.      |
| **question_history** | boolean | Override enabling question history tool. Optional.      |

### Examples

#### cURL

```bash
curl --request POST \
  'https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/YOUR_JOB_ID' \
  --header 'Authorization: Bearer YOUR_API_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "answers": "Focus on the SaaS industry, specifically for B2B customer support teams."
  }'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var raw = JSON.stringify({
  answers: 'Focus on the SaaS industry, specifically for B2B customer support teams.',
})

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
}

fetch(
  'https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/YOUR_JOB_ID',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with job status:

```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "queued",
  "title": "AI Customer Support Trends"
}
```

The job will be queued and processed. You can check the job status using the [Admin API](/documentation/developer/bot-research-api).

---

## Workflow Example

Here's a complete workflow for creating a research job with clarifications:

```js
// 1. Create a research job
const createJob = async () => {
  const response = await fetch(
    'https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research',
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: 'What are the current trends in AI customer support?',
        web_search: true,
      }),
    }
  )

  const job = await response.json()
  console.log('Job created:', job.jobId)
  console.log('Clarifications:', job.clarifications)

  return job
}

// 2. Continue with clarifying answers
const continueJob = async (jobId, answers) => {
  const response = await fetch(
    `https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/${jobId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ answers }),
    }
  )

  const result = await response.json()
  console.log('Job status:', result.status)
  return result
}

// 3. Check status via Admin API
const checkStatus = async (jobId) => {
  const response = await fetch(
    `https://api.docsbot.ai/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/${jobId}`,
    {
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
      },
    }
  )

  const job = await response.json()
  console.log('Current status:', job.status)
  return job
}

// Example usage
(async () => {
  const job = await createJob()

  // If clarifications are provided, answer them
  if (job.clarifications) {
    await continueJob(job.jobId, 'Focus on SaaS B2B customer support.')
  }

  // Poll for completion
  const status = await checkStatus(job.jobId)
  console.log('Final status:', status.status)
  if (status.response) {
    console.log('Research result:', status.response)
  }
})()
```

---

## Related APIs

- **[Bot Research Jobs - Admin API](/documentation/developer/bot-research-api)** - List research jobs and retrieve job status
- **[Chat Agent API](/documentation/developer/chat-agent)** - Conversational chat API with agent tools
- **[Semantic Search API](/documentation/developer/semantic-search-api)** - Search your documentation