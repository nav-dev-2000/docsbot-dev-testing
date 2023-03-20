---
title: Authentication
description: An overview of how to handle authentication for our various APIs.
---

An overview of how to handle authentication for our various APIs. {% .lead %}

---

## Teams and Permissions

### What is a team?

A team is the basic root of a DocsBot account. Plans and limits are tied to a team, which has a collection of bots and their sources. Multiple user accounts can be assigned to a team (coming soon). Each team has a unique ID and a name.

### Key permissions

API keys are unique to each user account and their permissions mirror that of your user account. For example, if your user account has access to multiple teams, your API key will also have access to all of those teams.

## API authentication

### Getting your API key

To use our APIs, you need to get an API key. You can get your API key from the [API Keys](https://docsbot.ai/app/api) section of your dashboard. This is the key associated to your user account, and will be the same no matter which team you dashboard you are in. You can create or change your API key at any time by clicking the "Change" button. When you change your key, all previous API requests will stop working until your configure them to use the new key.

{% callout type="warning" title="Don't forget to copy!" %}
API keys are only shown once as we store them safely hashed, so make sure you copy it to a safe place. If you loose or forget your key you will have to recreate it.
{% /callout %}

### Authenticating requests

DocsBot for all it's APIs uses the standard `Authorization` header to authenticate requests with a Bearer token. You can authenticate requests by including your API key in the `Authorization` header prefixed with the "Bearer" keyword. For example, if your API key is `1234567890`, you would include the following header in your request:

```http
Authorization: Bearer 1234567890
```

---

## Examples
Here are some examples of how to authenticate a request with the GET `/api/teams/` Admin API endpoint:

### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/' \
--header 'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
```

### JavaScript Fetch

```javascript
var myHeaders = new Headers();
myHeaders.append("Authorization", "Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef");

var requestOptions = {
  method: 'GET',
  headers: myHeaders,
  redirect: 'follow'
};

fetch("https://docsbot.ai/api/teams/", requestOptions)
  .then(response => response.text())
  .then(result => console.log(result))
  .catch(error => console.log('error', error));
```

### PHP cURL

```php
<?php

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => 'https://docsbot.ai/api/teams/',
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => '',
  CURLOPT_MAXREDIRS => 1,
  CURLOPT_TIMEOUT => 0,
  CURLOPT_FOLLOWLOCATION => true,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => 'GET',
  CURLOPT_HTTPHEADER => array(
    'Authorization: Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
  ),
));

$response = curl_exec($curl);

curl_close($curl);
echo $response;
```

### Python

```python
import requests

url = "https://docsbot.ai/api/teams/"

payload={}
headers = {
  'Authorization': 'Bearer 2e9fd6965890e80b9a7bb271900ab859e199a5778f851b73d97136d3495849ef'
}

response = requests.request("GET", url, headers=headers, data=payload)

print(response.text)
```

