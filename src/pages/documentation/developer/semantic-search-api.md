---
title: Semantic Search API
description: The Semantic Search API can be used as a search engine for your documentation.
---

The Semantic Search API can be used as a search engine for your documentation. It returns the most relevant source chunks for a given query. It can be used to create a search interface for your trained content and documentation, or to power your own custom AI creations.

---

## Request

This endpoint accepts a POST request with the following parameters:

`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/search`

### Parameters

| Parameter        | Type          | Description                                                                                                                                                                          |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **query**        | string        | The query to search for.                                                                                                                                                             |
| **top_k**        | integer       | The number of source chunks to return. Optional, default is 4.                                                                                                                       |
| **autocut**      | integer/false | Autocut results to num groups. Optional, defaults to `false`                                                                                                                         |
| **alpha**        | float         | Keyword vs semantic search balance. Optional, default is `0.75`. An alpha of `1` is pure semantic search, while `0` is pure keyword search.                                          |
| **use_glossary** | boolean       | Use the bot's glossary for term replacement. Optional, default is `false`. See the [Bot API documentation](/documentation/developer/bot-api) for information on managing glossaries. |

{% callout title="autocut behavior" %}
Autocut introduces a maximum result counts. This method organizes results into groups based on significant distance jumps, offering a more intuitive way to segregate relevant from irrelevant data. Autocut addresses the reduction of irrelevant information fed into generative searches. Research by highlights the negative impact of irrelevant content on large language models, underscoring the importance of precision in search results. Autocut's design is rooted in the concept of intuitively "cutting" search results at natural breaks, improving AI-driven search efficiencies. When enabled, autocut will return the top num groups of results trimmed by the `top_k` parameter.
{% /callout %}
{% callout title="alpha behavior" %}
Hybrid search results can favor the keyword component or the semantic component. To change the relative weights of the keyword and vector components, set the alpha value in your query.

An alpha of 1 is a pure semantic vector search.
An alpha of 0 is a pure keyword search.
{% /callout %}

## Examples

### cURL

```bash
curl --request POST 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/search' \
--header 'Content-Type: application/json' \
--data-raw '{
    "query": "What is WordPress?",
    "top_k": 4
    "alpha": 0.75
}'
```

### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Content-Type', 'application/json')

var raw = JSON.stringify({
  query: 'What is WordPress?',
  alpha: 0.75,
})

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow',
}

fetch(
  'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/search',
  requestOptions,
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### PHP (cURL)

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/search',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 1,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'POST',
  CURLOPT_POSTFIELDS =>'{
    "query": "What is WordPress?",
    "top_k": 4
    "alpha": 0.75
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

Response is a JSON array with the following source objects:

| Type  | Description                                                                                                     |
| ----- | --------------------------------------------------------------------------------------------------------------- |
| array | An array of source objects. Each source object contains the source type, title, url, fileId, page, and content. |

### The Source object

Source objects in the response array have the following properties:

| Property    | Type        | Description                                                                                                         |
| ----------- | ----------- | ------------------------------------------------------------------------------------------------------------------- |
| **type**    | string      | Can be `url`, `document`, `sitemap`, `wp`, `urls`, `csv`, etc.                                                      |
| **title**   | string      | The source title.                                                                                                   |
| **url**     | string/null | The url for the source as set during indexing. May be null.                                                         |
| **fileId**  | string/null | The file identifier for retrieving the full reconstructed document. May be null or absent for older source records. |
| **page**    | string/null | The page for the source as set during indexing. May be null.                                                        |
| **content** | string/null | The full source text chunk content for the source as set during indexing. It may be in markdown format.             |

```json
[
  {
    "title": "High-Level Overview | Learn WordPress ",
    "url": "https://learn.wordpress.org/lesson-plan/high-level-overview/",
    "fileId": "abc123",
    "page": null,
    "content": "Title: High-Level Overview | Learn WordPress \nURL: https://learn.wordpress.org/lesson-plan/high-level-overview/\n\nDescription\nThis lesson is an introduction to WordPress for people who have heard of it, but are not quite sure what it does or if it is the right tool for them. You will learn about the origins of WordPress and its evolution from a blogging platform to a full-fledged content management system. We will also look at some of its components and how they are used to build a functional website. Finally, we will talk about the third party services you will need to operate a self-hosted WordPress site.  \nObjectives\nAt the end of this lesson, you will be able to:\nOutline and describe the basic history of WordPress.Identify the differences between WordPress.com and WordPress."
  },
  {
    "title": "How to do triage on GitHub | Learn WordPress ",
    "url": "https://learn.wordpress.org/tutorial/how-to-do-triage-on-github/",
    "fileId": "def456",
    "page": null,
    "content": "Title: How to do triage on GitHub | Learn WordPress \nURL: https://learn.wordpress.org/tutorial/how-to-do-triage-on-github/\n\nWordPress.org\n\n\n \n\n\n\n\nWordPress.org\n\n\n\n \n\n\n\nVisit our Facebook page\nVisit our Twitter account\nVisit our Instagram account\nVisit our LinkedIn account\nVisit our YouTube channel"
  },
  {
    "title": "How WordPress processes Post Content – WordPress.org Documentation",
    "url": "https://wordpress.org/documentation/article/how-wordpress-processes-post-content/",
    "fileId": "ghi789",
    "page": null,
    "content": "Title: How WordPress processes Post Content – WordPress.org Documentation\nURL: https://wordpress.org/documentation/article/how-wordpress-processes-post-content/\n\nWordPress.org\n\n\n \n\n\n\n\nWordPress.org\n\n\n\n \n\n\n\nVisit our Facebook page\nVisit our Twitter account\nVisit our Instagram account\nVisit our LinkedIn account\nVisit our YouTube channel"
  },
  {
    "title": "WordPress Block Editor – WordPress.org Documentation",
    "url": "https://wordpress.org/documentation/article/wordpress-block-editor/",
    "fileId": "jkl012",
    "page": null,
    "content": "Title: WordPress Block Editor – WordPress.org Documentation\nURL: https://wordpress.org/documentation/article/wordpress-block-editor/\n\nWordPress.org\n\n\n \n\n\n\n\nWordPress.org\n\n\n\n \n\n\n\nVisit our Facebook page\nVisit our Twitter account\nVisit our Instagram account\nVisit our LinkedIn account\nVisit our YouTube channel"
  }
]
```

## Fetch Document

Search results include `fileId` when the matching indexed chunk has an associated file ID. Use that value with the fetch endpoint to retrieve the full reconstructed document for preview or downstream processing.

`POST https://api.docsbot.ai/teams/[teamId]/bots/[botId]/fetch`

Authentication is required for this endpoint.

### Parameters

| Parameter  | Type   | Description                                      |
| ---------- | ------ | ------------------------------------------------ |
| **fileId** | string | The file identifier returned by semantic search. |

The legacy `fileid` alias is also accepted.

### cURL

```bash
curl --request POST 'https://api.docsbot.ai/teams/ZrbLG98bbxZ9EFqiPvyl/bots/oFFiXuQsakcqyEdpLvCB/fetch' \
--header 'Content-Type: application/json' \
--data-raw '{
  "fileId": "abc123"
}'
```

### Response

```json
{
  "title": "High-Level Overview | Learn WordPress ",
  "url": "https://learn.wordpress.org/lesson-plan/high-level-overview/",
  "fileId": "abc123",
  "page": 1,
  "content": "Full reconstructed document text..."
}
```

The endpoint looks up all chunks with the same file ID, sorts them by stored chunk order, removes overlap, and returns the reconstructed document text.

### Error responses

| Status | Error                                                                                 |
| ------ | ------------------------------------------------------------------------------------- |
| 403    | `This bot requires authentication.`                                                   |
| 404    | `Invalid fileId.`                                                                     |
| 409    | `Bot is not ready for questions. Please wait for the bot to finish indexing sources.` |
