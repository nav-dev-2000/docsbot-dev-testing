---
title: Chat API
description: The chat API is used to create a full chat interface in your product.
---

The chat API is used to create a full chat interface in your product. You pass it a question plus chat history, and it returns the next answer along with its sources. It also returns the new chat history array to pass back with the next response. This is the endpoint you should use if you want to create a full chat interface in your product.

---

{% callout type="warning" title="Coming Soon" %}
This REST API endpoint is coming soon. It is only available via the websocket streaming API at the moment. We will update this page when the REST API endpoint is available.
{% /callout %}

## Request

This endpoint accepts a POST request with the following parameters:

`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/chat`

### Parameters

| Parameter   | Type    | Description                                                                       |
| ----------- | ------- | --------------------------------------------------------------------------------- |
| **question**    | string  | The question to ask the bot. 10 to 200 characters.                                |
| **full_source** | boolean | Whether the full source content should be returned. Optional, defaults to `false` |
| **chat_history** | array | The chat history array. Optional, defaults to `[]` |

{% callout title="full_source behavior" %}
If `full_source` is set to `true`, the `content` property of each source will be populated with the full source content. This can be useful if you want to display the full source content in your interface. As source pages are divided into chunks, we normally only return unique source title/urls. But if this parameter is set to true multiple sources may be returned with the same title/url but different content.
{% /callout %}

## Examples

### cURL

```bash
curl --request POST 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/chat' \
--header 'Content-Type: application/json' \
--data-raw '{
    "question": "What is WordPress?",
    "full_source": false
}'
```

### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
  "question": "What is WordPress?",
  "full_source": false
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/chat", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### PHP (cURL)

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/chat',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 1,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
    "question": "What is WordPress?",
    "full_source": false
}',
  CURLOPT_HTTPHEADER => array(
    'Content-Type: application/json'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;
```

## Response

Response is a JSON object with the following properties:

| Property | Type   | Description                                                                 |
| -------- | ------ | --------------------------------------------------------------------------- |
| **answer**   | string | The answer to the question in Markdown format.                               |
| **sources**  | array  | An array of source objects. Each source object contains the source type, title and optionally url, page, or content if `full_source` was `true`. |
| **id**       | string | The unique ID of the answer. Use for the rating API.                                              |

```json
{
    "answer": "WordPress is an open source free software distributed under the GPL license. It is a self-hosted content management system that enables users to create and manage websites.",
    "sources": [
        {
            "type": "urls",
            "title": "Introduction to Open-Source | Learn WordPress ",
            "url": "https://learn.wordpress.org/tutorial/introduction-to-open-source/",
            "page": null,
            "content": null
        },
        {
            "type": "urls",
            "title": "WordPress.org and WordPress.com – WordPress.org Documentation",
            "url": "https://wordpress.org/documentation/article/wordpress-org-and-wordpress-com/",
            "page": null,
            "content": null
        },
        {
            "type": "urls",
            "title": "What is Open Source? | Learn WordPress ",
            "url": "https://learn.wordpress.org/lesson-plan/what-is-open-source/",
            "page": null,
            "content": null
        },
        {
            "type": "urls",
            "title": "High-Level Overview | Learn WordPress ",
            "url": "https://learn.wordpress.org/lesson-plan/high-level-overview/",
            "page": null,
            "content": null
        }
    ],
    "id": "O0avZ8ffTiAMRyjNrZpU"
}
```
