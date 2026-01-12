---
title: Team Members & Invites - Admin API
description: Manage team members and invitations with the admin API.
---

Use the Admin API to list team members, change roles, remove members, and send or manage invites. {% .lead %}

---

## Response Objects

### The Team Member object

| Property      | Type   | Description                                |
| ------------- | ------ | ------------------------------------------ |
| **uid**       | string | The user ID.                               |
| **displayName** | string | The user's display name.                  |
| **email**     | string | The user's email address.                  |
| **photoURL**  | string | The user's avatar URL.                     |
| **role**      | string | The member's team role (`owner`, `admin`, `member`). |

---

## List Team Members

This endpoint lists all members for a given team. It accepts a GET request:

`GET https://docsbot.ai/api/teams/:teamId/members`

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/members' \
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

fetch('https://docsbot.ai/api/teams/YOUR_TEAM_ID/members', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON array of team member objects.

```json
[
  {
    "uid": "u_123",
    "displayName": "Alex Chen",
    "email": "alex@example.com",
    "photoURL": "https://www.gravatar.com/avatar/...",
    "role": "owner"
  }
]
```

---

## Update Team Member Role

This endpoint updates a member role for a team. It accepts a PUT request:

`PUT https://docsbot.ai/api/teams/:teamId/members`

### Request Body

| Property    | Type   | Description                                  |
| ----------- | ------ | -------------------------------------------- |
| **memberId** | string | The user ID to update.                       |
| **role**    | string | New role (`admin`, `member`).                |

### Examples

#### cURL

```bash
curl --request PUT 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/members' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{"memberId":"u_123","role":"admin"}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var requestOptions = {
  method: 'PUT',
  headers: myHeaders,
  body: JSON.stringify({ memberId: 'u_123', role: 'admin' }),
}

fetch('https://docsbot.ai/api/teams/YOUR_TEAM_ID/members', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

```json
{
  "message": "User role has been changed successfully",
  "teamUsers": [
    {
      "uid": "u_123",
      "displayName": "Alex Chen",
      "email": "alex@example.com",
      "photoURL": "https://www.gravatar.com/avatar/...",
      "role": "admin"
    }
  ]
}
```

---

## Remove Team Member or Invite

This endpoint removes a team member or an outstanding invite. It accepts a DELETE request:

`DELETE https://docsbot.ai/api/teams/:teamId/members`

### Request Body

Provide one of the following fields:

| Property           | Type   | Description                              |
| ------------------ | ------ | ---------------------------------------- |
| **removeUserId**   | string | The user ID to remove from the team.     |
| **removeUserEmail** | string | The invited email to revoke.           |

### Examples

#### cURL

```bash
curl --request DELETE 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/members' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{"removeUserId":"u_123"}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var requestOptions = {
  method: 'DELETE',
  headers: myHeaders,
  body: JSON.stringify({ removeUserId: 'u_123' }),
}

fetch('https://docsbot.ai/api/teams/YOUR_TEAM_ID/members', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

```json
{
  "message": "Removed user successfully"
}
```

---

## Invite a Team Member

This endpoint sends a team invitation email. It accepts a POST request:

`POST https://docsbot.ai/api/teams/:teamId/invite`

### Request Body

| Property       | Type   | Description                            |
| -------------- | ------ | -------------------------------------- |
| **inviteEmail** | string | Email address to invite.               |
| **role**       | string | Role for the invited user.             |

### Examples

#### cURL

```bash
curl --request POST 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/invite' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{"inviteEmail":"newuser@example.com","role":"member"}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: JSON.stringify({ inviteEmail: 'newuser@example.com', role: 'member' }),
}

fetch('https://docsbot.ai/api/teams/YOUR_TEAM_ID/invite', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

```json
{
  "message": "An invite email has been sent to newuser@example.com"
}
```

---

## Respond to an Invite

This endpoint accepts, denies, or retries an invite. It accepts a PUT request:

`PUT https://docsbot.ai/api/teams/:teamId/invite`

### Request Body

| Property     | Type   | Description                                               |
| ------------ | ------ | --------------------------------------------------------- |
| **status**   | string | `accept`, `deny`, or `retry`.                            |
| **teamId**   | string | The team ID for the invite.                              |
| **inviteId** | string | The invite document ID.                                  |
| **role**     | string | Role to assign when accepting the invite.                |

### Examples

#### cURL

```bash
curl --request PUT 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/invite' \
--header 'Authorization: Bearer YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{"status":"accept","teamId":"YOUR_TEAM_ID","inviteId":"INVITE_ID","role":"member"}'
```

#### JavaScript (Fetch)

```js
var myHeaders = new Headers()
myHeaders.append('Authorization', 'Bearer YOUR_API_KEY')
myHeaders.append('Content-Type', 'application/json')

var requestOptions = {
  method: 'PUT',
  headers: myHeaders,
  body: JSON.stringify({
    status: 'accept',
    teamId: 'YOUR_TEAM_ID',
    inviteId: 'INVITE_ID',
    role: 'member',
  }),
}

fetch('https://docsbot.ai/api/teams/YOUR_TEAM_ID/invite', requestOptions)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

```json
{
  "message": "Accepted invite",
  "data": {
    "id": "YOUR_TEAM_ID"
  }
}
```
