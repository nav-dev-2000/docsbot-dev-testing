---
title: Answer Rating API
description: The answer rating API is used to rate answers from the Q/A and chat APIs.
---

The answer rating API is used to rate answers from the Q/A and chat APIs. You pass it an answer ID and a rating, and it returns the new rating for that answer. This is the endpoint you should use if you want to allow your users to rate answers.

---

## Request

This endpoint accepts a POST request with the following parameters:

`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/rate/[answerId]`

### Parameters

| Parameter   | Type    | Description                                                                       |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| **rating**    | integer  | -1, 0, or 1 for rating up, neutral, or down.                               |

## Examples

### cURL

```bash
curl --request PUT 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/rate/O0avZ8ffTiAMRyjNrZpU' \
--header 'Content-Type: application/json' \
--data-raw '{
    "rating": -1
}'
```

## Response

Response is a JSON object with the following properties:

```json
true
```