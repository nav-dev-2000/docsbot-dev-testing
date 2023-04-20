---
title: Sources - Admin API
description: How to manage sources with the admin API.
---

Sources are how your train your bots. They can be urls, files, sitemaps, and many other types. You can create as many sources as your team plan allows. You can also edit source settings and delete sources with these API endpoints. {% .lead %}

---

## The Source object

Source objects have the following properties:

| Property       | Type   | Description                                                                                                           |
| -------------- | ------ | --------------------------------------------------------------------------------------------------------------------- |
| **id**         | string | The source id.                                                                                                        |
| **type**       | string | Can be `url`, `document`, `sitemap`, `wp`, `urls`, `csv`. All but url and sitemap require uploading a formatted file. |
| **title**      | string | The source title. Required except for `url` and `sitemap` types.                                                      |
| **url**        | string | The source url. Optional except for `url` and `sitemap` types.                                                        |
| **file**       | string | The source file path in our cloud storage.                                                                            |
| **createdAt**  | string | The source creation date.                                                                                             |
| **pageCount**  | number | The number of pages indexed from the source.                                                                          |
| **chunkCount** | number | The number of chunks indexed from the source.                                                                         |

---

## List Sources

This endpoint lists all sources for the given team and bot. It accepts a GET request with the following parameters:

`GET https://api.docsbot.ai/teams/:teamId/bots/:botId/sources`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources' \
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

fetch('https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON array of team objects:

```json
[
    {
        "id": "qGDSDhbdxtqmifTZQrYs",
        "file": null,
        "type": "url",
        "url": "https://wordpress.org/plugins/infinite-uploads/",
        "createdAt": "2023-03-09T22:07:24.442Z",
        "pageCount": 3,
        "chunkCount": 10,
        "title": "Infinite Uploads – Offload Media and Video to Cloud Storage – WordPress plugin | WordPress.org",
        "status": "ready"
    }
]
```

---

## Get Source

This endpoint fetches a specific source by its ID. It accepts a GET request with the following parameters:

`GET https://api.docsbot.ai/teams/:teamId/bots/:botId/sources/:sourceId`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources/qGDSDhbdxtqmifTZQrYs' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
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
  'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources/qGDSDhbdxtqmifTZQrYs',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON source object:

```json
{
    "id": "qGDSDhbdxtqmifTZQrYs",
    "file": null,
    "type": "url",
    "url": "https://wordpress.org/plugins/infinite-uploads/",
    "createdAt": "2023-03-09T22:07:24.442Z",
    "pageCount": 3,
    "chunkCount": 10,
    "title": "Infinite Uploads – Offload Media and Video to Cloud Storage – WordPress plugin | WordPress.org",
    "status": "ready"
}
```

---

## Create Source

This endpoint creates a new source for a bot. It accepts a POST request with the following parameters:

`POST https://api.docsbot.ai/teams/:teamId/bots/:botId/sources`

### Parameters

| Property | Type   | Description                                                                 |
| -------- | ------ | --------------------------------------------------------------------------- |
| **type** | string | The source type. Can be `url`, `rss`, or `sitemap` for now. File upload types are coming soon.   |
| **title** | string | The source title. Optional. |
| **url** | string | The source URL. Required if type is `url` or `sitemap`. |

### Examples

#### cURL

```bash
curl --request POST 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673' \
--header 'Content-Type: application/json' \
--data-raw '{
    "type": "url",
    "title": "Infinite Uploads",
    "url": "https://infiniteuploads.com"
}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673");
myHeaders.append("Content-Type", "application/json");

var raw = JSON.stringify({
    "type": "url",
    "title": "Infinite Uploads",
    "url": "https://infiniteuploads.com"
});

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: raw,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### Response

Response is a HTTP 201 with a JSON source object:

```json
{
    "id": "qGDSDhbdxtqmifTZQrYs",
    "file": null,
    "type": "url",
    "title": "Infinite Uploads",
    "url": "https://infiniteuploads.com",
    "createdAt": "2023-03-09T22:07:24.442Z",
    "pageCount": 0,
    "chunkCount": 0,
    "status": "pending"
}
```

---

## Retry Source

Sources are read only. However if a source fails it is possible to trigger an index retry. It accepts a PUT request with no parameters:

`PUT https://api.docsbot.ai/teams/:teamId/bots/:botId/sources/:sourceId`

### Examples

#### cURL

```bash
curl --request PUT 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources/qGDSDhbdxtqmifTZQrYs' \
--header 'Authorization: Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673'
```

### Response

Response is am HTTP 201 with the new JSON source object:

```json
{
    "id": "qGDSDhbdxtqmifTZQrYs",
    "file": null,
    "type": "url",
    "url": "https://wordpress.org/plugins/infinite-uploads/",
    "createdAt": "2023-03-09T22:07:24.442Z",
    "pageCount": 3,
    "chunkCount": 10,
    "title": "Infinite Uploads – Offload Media and Video to Cloud Storage – WordPress plugin | WordPress.org",
    "status": "ready"
}
```

---

## Delete Source

This endpoint deletes a specific source by its ID. Please note however, that it may take several minutes for the sources to be completely removed from our services, meaning that sources may still be recommended in chat results for several minutes after deleting. It accepts a DELETE request with the following parameters:

`DELETE https://api.docsbot.ai/teams/:teamId/bots/:botId/sources/:sourceId`

### Examples

#### cURL

```bash
curl --request DELETE 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources/qGDSDhbdxtqmifTZQrYs' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append(
  'Authorization',
  'Bearer c0f5c347f0138f76a005921ec723f38185554327f69349dcf220a6f6531ab673'
)

var requestOptions = {
  method: 'DELETE',
  headers: myHeaders,
  redirect: 'follow',
}

fetch(
  'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/sources/qGDSDhbdxtqmifTZQrYs',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a 200 OK response with message:

```json
{
  "message": "Source deleted successfully"
}
```
