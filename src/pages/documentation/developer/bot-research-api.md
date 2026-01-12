---
title: Bot Research Jobs - Admin API
description: List and retrieve deep research jobs with the admin API.
---

Use the Admin API to list deep research jobs and retrieve details for a specific job. {% .lead %}

---

## Response Objects

### The Research Job object

Research jobs return the stored Firestore document for the job. Common fields include:

| Property        | Type         | Description                                             |
| --------------- | ------------ | ------------------------------------------------------- |
| **jobId**       | string       | The research job ID.                                   |
| **status**      | string       | Job status (e.g., `queued`, `running`, `completed`).     |
| **title**       | string/null  | The job title if set.                                  |
| **question**    | string/null  | The prompt or question submitted for research.         |
| **response**    | object/null  | The model response payload, if completed.              |
| **createdAt**   | string/null  | Job creation timestamp.                                |
| **completedAt** | string/null  | Completion timestamp if finished.                      |
| **cancelledAt** | string/null  | Cancellation timestamp if deleted.                     |

---

## List Research Jobs

This endpoint lists deep research jobs for a bot. It accepts a GET request:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/research?page=0&perPage=25`

### Optional URL Parameters

| Property    | Type   | Description                                       |
| ----------- | ------ | ------------------------------------------------- |
| **page**    | number | The page number to return. Pages are 0-indexed.   |
| **perPage** | number | The number of jobs to return per page.            |

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research?page=0&perPage=25' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow',
}

fetch(
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research?page=0&perPage=25',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with `jobs` as an array and a `pagination` object.

```json
{
  "jobs": [
    {
      "jobId": "job_123",
      "status": "completed",
      "title": "Competitor pricing analysis",
      "question": "Summarize competitor pricing tiers",
      "createdAt": "2024-06-10T18:25:16.980Z",
      "completedAt": "2024-06-10T18:32:10.120Z"
    }
  ],
  "pagination": {
    "perPage": 25,
    "page": 0,
    "viewableCount": 1,
    "totalCount": 1,
    "hasMorePages": false
  }
}
```

---

## Get Research Job Details

This endpoint retrieves a single research job by ID. It accepts a GET request:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/research/:jobId`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/YOUR_JOB_ID' \
--header 'Authorization: Bearer YOUR_API_KEY'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow',
}

fetch(
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/research/YOUR_JOB_ID',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

```json
{
  "jobId": "job_123",
  "status": "completed",
  "title": "Competitor pricing analysis",
  "question": "Summarize competitor pricing tiers",
  "response": {
    "summary": "..."
  },
  "createdAt": "2024-06-10T18:25:16.980Z",
  "completedAt": "2024-06-10T18:32:10.120Z",
  "cancelledAt": null
}
```
