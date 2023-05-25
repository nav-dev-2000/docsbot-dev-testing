---
title: Question & Answer History - Admin API
description: How to view question and answer history with the admin API.
---

Once you've deployed your bot to production, you can view the questions and answers that your users are asking. This is a great way to see how your bot is performing and to see what questions your users are asking. You can also use this data to improve your bot. {% .lead %}

---

## Response Objects

### The Question object

Question objects have the following properties:

| Property      | Type    | Description                                                                                                                                      |
| ------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **id**        | string  | The question id.                                                                                                                                 |
| **createdAt** | string  | The question creation date.                                                                                                                      |
| **alias**     | string  | An anonymous username generate from user IP or name/email from identify metadata.                                                                |
| **question**  | string  | The question the user asked.                                                                                                                     |
| **answer**    | string  | The answer text as returned to user in Markdown.                                                                                                 |
| **sources**   | array   | An array of source objects. Each source object contains the source type, title and optionally url, page, or content if `full_source` was `true`. |
| **ip**        | string  | A SHA256 hash of the user or caller IP address. Can help to identify questions from the same user.                                               |
| **rating**    | integer | -1, 0, or 1 for rating up, neutral, or down.                                                                                                     |
| **identify**  | object  | A user identification object with arbitrary metadata about the the user that was sent with the chat request.                                     |

### The Source object

Source objects found in the `sources` array have the following properties:

| Property  | Type        | Description                                                    |
| --------- | ----------- | -------------------------------------------------------------- |
| **type**  | string      | Can be `url`, `document`, `sitemap`, `wp`, `urls`, `csv`, etc. |
| **title** | string      | The source title.                                              |
| **url**   | string/null | The url for the source as set during indexing. May be null.    |

---

## List Questions

This endpoint lists all questions asked of a given team and bot. It accepts a GET request with the following parameters:

`GET https://api.docsbot.ai/teams/:teamId/bots/:botId/questions?ascending=false&page=0&perPage=50`

### Optional URL Parameters

| Property      | Type    | Description                                                                                   |
| ------------- | ------- | --------------------------------------------------------------------------------------------- |
| **page**      | number  | The page number to return. Pages are 0-indexed. Defaults to 0.                                |
| **perPage**   | number  | The number of questions to return per page. Defaults to 50.                                   |
| **ascending** | boolean | Whether to return questions in ascending order by `createAt`. Defaults to false (descending). |

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/questions' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append(
  'Authorization',
  'Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673'
)

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow',
}

fetch(
  'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/questions',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with `questions` as an array of question objects, and `pagination` as an object with pagination information.

```json
{
  "questions": [
    {
      "id": "8wuz1pqi8laooV1jLJHG",
      "createdAt": "2023-03-22T18:25:16.980Z",
      "alias": "fat-duck",
      "question": "What is WordPress?",
      "sources": [
        {
          "type": "urls",
          "title": "Introduction to Open-Source | Learn WordPress ",
          "url": "https://learn.wordpress.org/tutorial/introduction-to-open-source/"
        },
        {
          "type": "urls",
          "title": "WordPress.org and WordPress.com – WordPress.org Documentation",
          "url": "https://wordpress.org/documentation/article/wordpress-org-and-wordpress-com/"
        },
        {
          "type": "urls",
          "title": "What is Open Source? | Learn WordPress ",
          "url": "https://learn.wordpress.org/lesson-plan/what-is-open-source/"
        },
        {
          "type": "urls",
          "title": "High-Level Overview | Learn WordPress ",
          "url": "https://learn.wordpress.org/lesson-plan/high-level-overview/"
        }
      ],
      "answer": "WordPress is an open source free software distributed under the GPL license. It is a self-hosted website creation tool that allows users to fully own and control their website. WordPress began as a successor of Fork of the abandoned B to cafe lock software project as Matt Mullenweg first pondered in 2003 post called the blogging software dilemma. Matt, the co-founder of WordPress along with Mike Little, collaborated to launch the software called WordPress. WordPress is an open source project, which means that there are hundreds of people all over the world working on it more than most commercial platforms. It also means that you’re free to use it for anything. WordPress.org is the official website for self-hosted WordPress installations. Self-hosting means that you have downloaded a copy of the WordPress software and installed it on a server, which is a computer with special software that lets you serve websites and other data to users through the internet.",
      "ip": "dfebd0b1d7e002b7ff745a5f2885340579ceb966d8a33a7c4b4e0669f0d0384b",
      "rating": 0,
      "identify": {
        "referrer": "https://somesite.com"
      }
    }
  ],
  "pagination": {
    "perPage": 1,
    "page": 0,
    "totalCount": 841,
    "hasMorePages": true
  }
}
```
