---
title: Bot Statistics - Admin API
description: How to access bot statistics with the admin API.
---

Once you have collected question and answer data, you can analyze bot performance using the statistics API. This provides aggregated metrics and chart data to help you understand how your bot is performing. {% .lead %}

---

## Get Bot Statistics

This endpoint provides aggregated statistics for a bot over a specified time period. It accepts a GET request with either a day delta or an explicit date range and remains backwards compatible with existing usage:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/stats?timeDelta=30`
`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/stats?startDate=2024-06-01&endDate=2024-06-30`

### URL Parameters

| Property       | Type     | Description                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| **timeDelta**  | number   | The time period in days to analyze. Common values: 7 (week), 30 (month), 90 (quarter), 365 (year).           |
| **startDate**  | string   | Start of date range (ISO 8601 or YYYY-MM-DD). Must be provided together with `endDate`.                      |
| **endDate**    | string   | End of date range (ISO 8601 or YYYY-MM-DD). Must be provided together with `startDate`.                      |

### Parameter Logic

The API uses the following logic to determine which date range to use:

1. **Explicit Date Range**: If both `startDate` and `endDate` are provided and valid, the API will use this range
2. **Relative Date Range**: If no valid explicit range is provided, the API falls back to `timeDelta` (defaults to 30 days)
3. **Validation**: 
   - Date ranges are clamped to a maximum of 365 days for performance
   - Invalid dates or ranges result in fallback to the default 30-day period
   - `timeDelta` must be between 0 and 365 days

### Examples

#### cURL

```bash
# Relative date range (backwards compatible)
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=30' \
--header 'Authorization: Bearer YOUR_TOKEN'

# Explicit date range (ISO format)
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?startDate=2024-06-01T00:00:00.000Z&endDate=2024-06-30T23:59:59.999Z' \
--header 'Authorization: Bearer YOUR_TOKEN'

# Explicit date range (YYYY-MM-DD format)
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?startDate=2024-06-01&endDate=2024-06-30' \
--header 'Authorization: Bearer YOUR_TOKEN'

# Common relative ranges
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=7' \  # Last week
--header 'Authorization: Bearer YOUR_TOKEN'

curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=90' \ # Last quarter
--header 'Authorization: Bearer YOUR_TOKEN'

curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=365' \ # Last year
--header 'Authorization: Bearer YOUR_TOKEN'
```

#### JavaScript (Fetch)

```js
const headers = new Headers({ Authorization: 'Bearer YOUR_TOKEN' })

// Relative date range (backwards compatible)
fetch('https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=30', { headers })
  .then((r) => r.json())
  .then(console.log)

// Explicit date range
fetch('https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?startDate=2024-06-01&endDate=2024-06-30', { headers })
  .then((r) => r.json())
  .then(console.log)

// Helper function for common date ranges
function getBotStats(teamId, botId, token, options = {}) {
  const { timeDelta, startDate, endDate } = options
  const params = new URLSearchParams()
  
  if (startDate && endDate) {
    params.append('startDate', startDate)
    params.append('endDate', endDate)
  } else if (timeDelta) {
    params.append('timeDelta', timeDelta)
  } else {
    params.append('timeDelta', 30) // default
  }
  
  return fetch(`https://docsbot.ai/api/teams/${teamId}/bots/${botId}/stats?${params}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(r => r.json())
}

// Usage examples
getBotStats('FOX1XkWo8VMx3hp6Zjkb', 'SQMV36O8xi43xbZRzYLy', 'YOUR_TOKEN', { timeDelta: 7 })
getBotStats('FOX1XkWo8VMx3hp6Zjkb', 'SQMV36O8xi43xbZRzYLy', 'YOUR_TOKEN', { 
  startDate: '2024-06-01', 
  endDate: '2024-06-30' 
})
```

### Response

The response is a JSON object containing aggregated statistics and chart data:

```json
{
  "totalCount": 841,
  "totalMessages": 1205,
  "totalConversations": 156,
  "resolutionRate": "78.5",
  "couldAnswerRate": "92.3",
  "deflectionRate": "85.7",
  "timeSaved": 4205,
  
  "labels": ["2023-09-01", "2023-09-02", "2023-09-03", "..."],
  "countData": [12, 15, 8, "..."],
  "negativeData": [2, 1, 0, "..."],
  "positiveData": [8, 10, 6, "..."],
  "couldAnswerData": [11, 14, 7, "..."],
  "escalatedData": [1, 2, 1, "..."],
  "messagesData": [18, 22, 12, "..."],
  
  "percentageLabels": ["Neutral", "Negative", "Positive"],
  "counts": [120, 45, 676],
  
  "escalatedLabels": ["Escalated", "Not Escalated"],
  "escalatedCounts": [120, 721],
  
  "answerLabels": ["Could Answer", "Could Not Answer"],
  "answerCounts": [776, 65],
  
  "conversationData": [5, 8, 3, "..."],
  "resolvedConfirmedData": [3, 6, 2, "..."],
  "resolvedAssumedData": [1, 1, 1, "..."],
  "unresolvedData": [1, 1, 0, "..."],
  "escalatedHandledData": [0, 0, 0, "..."],
  "escalatedTriggeredData": [0, 0, 0, "..."],
  "csatData": [85, 88, 92, "..."],
  "answeredRateData": [90, 87, 95, "..."],
  "conversationDeflectionData": [80, 85, 88, "..."],
  "avgSentimentData": [0.2, 0.3, 0.1, "..."],
  "resolvedLabels": ["Confirmed", "Assumed", "Unresolved"],
  "resolvedCounts": [45, 23, 12],
  "conversationEscalatedLabels": ["Triggered", "Handled"],
  "conversationEscalatedCounts": [8, 15],
  "sentimentLabels": ["Positive", "Negative", "Neutral"],
  "sentimentCounts": [67, 12, 34],
  "conversationAnsweredLabels": ["Answered", "Not Answered"],
  "conversationAnsweredCounts": [134, 22],
  "conversationTopicLabels": ["General", "Technical", "Billing"],
  "conversationTopicData": {
    "General": [2, 3, 1, "..."],
    "Technical": [1, 2, 1, "..."],
    "Billing": [1, 1, 0, "..."]
  },
  "conversationTopicPieLabels": ["General", "Technical", "Billing"],
  "conversationTopicCounts": [45, 23, 12]
}
```

### Response Object Properties

| Property                     | Type       | Description                                                                |
| ---------------------------- | ---------- | -------------------------------------------------------------------------- |
| **totalCount**               | number     | Total number of user questions in the time period.                        |
| **totalMessages**            | number     | Total number of messages (including tool calls) in the time period.       |
| **totalConversations**       | number     | Total number of conversations in the time period (agent mode only).       |
| **resolutionRate**           | string     | Percentage of questions resolved without negative rating or escalation.    |
| **couldAnswerRate**          | string     | Percentage of questions the AI determined it could confidently answer.     |
| **deflectionRate**           | string     | Percentage of questions that didn't require escalation to human support.   |
| **timeSaved**                | number     | Estimated time saved for support staff in minutes (based on 5min/ticket).  |
| **labels**                   | string[]   | Date labels for the line chart. Uses M/D for daily ranges and M/YYYY for monthly. |
| **countData**                | number[]   | All questions count per date.                                              |
| **negativeData**             | number[]   | Negatively rated answers per date.                                         |
| **positiveData**             | number[]   | Positively rated answers per date.                                         |
| **couldAnswerData**          | number[]   | Questions AI could answer per date.                                        |
| **escalatedData**            | number[]   | Escalated questions per date.                                              |
| **messagesData**             | number[]   | All messages count per date.                                               |
| **percentageLabels**         | string[]   | Labels for rating distribution (Neutral, Negative, Positive).              |
| **counts**                   | number[]   | Counts for rating distribution.                                            |
| **escalatedLabels**          | string[]   | Labels for escalation distribution (Escalated, Not Escalated).             |
| **escalatedCounts**          | number[]   | Counts for escalation distribution.                                        |
| **answerLabels**             | string[]   | Labels for answer capability distribution (Could Answer, Could Not Answer).|
| **answerCounts**             | number[]   | Counts for answer capability distribution.                                 |
| **conversationData**         | number[]   | Total conversations per date (agent mode only).                            |
| **resolvedConfirmedData**    | number[]   | Confirmed resolved conversations per date (agent mode only).               |
| **resolvedAssumedData**      | number[]   | Assumed resolved conversations per date (agent mode only).                 |
| **unresolvedData**           | number[]   | Unresolved conversations per date (agent mode only).                       |
| **escalatedHandledData**     | number[]   | Handled escalations per date (agent mode only).                            |
| **escalatedTriggeredData**   | number[]   | Triggered escalations per date (agent mode only).                          |
| **csatData**                 | number[]   | Customer satisfaction scores per date (agent mode only).                   |
| **answeredRateData**         | number[]   | Answered rate percentages per date (agent mode only).                      |
| **conversationDeflectionData**| number[]   | Deflection rate percentages per date (agent mode only).                    |
| **avgSentimentData**         | number[]   | Average sentiment scores per date (agent mode only, business plan).        |
| **resolvedLabels**           | string[]   | Labels for conversation resolution (Confirmed, Assumed, Unresolved).       |
| **resolvedCounts**           | number[]   | Counts for conversation resolution.                                        |
| **conversationEscalatedLabels**| string[]  | Labels for conversation escalation (Triggered, Handled).                   |
| **conversationEscalatedCounts**| number[]  | Counts for conversation escalation.                                        |
| **sentimentLabels**          | string[]   | Labels for sentiment distribution (Positive, Negative, Neutral).           |
| **sentimentCounts**          | number[]   | Counts for sentiment distribution.                                         |
| **conversationAnsweredLabels**| string[]  | Labels for conversation answer status (Answered, Not Answered).            |
| **conversationAnsweredCounts**| number[]  | Counts for conversation answer status.                                     |
| **conversationTopicLabels**  | string[]   | Labels for conversation topics (agent mode only, business plan).           |
| **conversationTopicData**    | object     | Topic data per date, keyed by topic name (agent mode only, business plan). |
| **conversationTopicPieLabels**| string[]  | Labels for topic distribution pie chart (agent mode only, business plan).  |
| **conversationTopicCounts**  | number[]   | Counts for topic distribution (agent mode only, business plan).            |

### Notes

- **Agent Mode Data**: Conversation-related fields are only available when the bot is configured in agent mode
- **Plan Restrictions**: Some fields (like sentiment data and topic analytics) require specific plan levels
- **Date Range Limits**: Maximum range is 365 days for performance reasons
- **Backwards Compatibility**: The API maintains full backwards compatibility with existing `timeDelta` usage
- **Error Handling**: Invalid date ranges or parameters will fall back to default 30-day period

---

## Bot Reports (Monthly)

This endpoint returns the list of available monthly reports and the report data for a selected month. It accepts a GET request:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/reports?month=2024-06`

### Optional URL Parameters

| Property   | Type   | Description                                                                  |
| ---------- | ------ | ---------------------------------------------------------------------------- |
| **month**  | string | The report month to fetch (format `YYYY-MM`). Defaults to the latest report. |

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/reports?month=2024-06' \
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
  'https://docsbot.ai/api/teams/YOUR_TEAM_ID/bots/YOUR_BOT_ID/reports?month=2024-06',
  requestOptions
)
  .then((response) => response.text())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

Response is a JSON object with `availableReports` (an array of report month IDs) and a `report` object for the selected month.

```json
{
  "availableReports": ["2024-06", "2024-05"],
  "report": {
    "month": "2024-06",
    "totalQuestions": 1240,
    "resolved": 1103,
    "unresolved": 137
  }
}
```

## Visualization Examples

The statistics API is designed to work seamlessly with Chart.js for visualization. Here are examples of how to visualize the data using both React Chart.js and vanilla Chart.js.

### React Chart.js Example

```js
import { Line } from 'react-chartjs-2'

// Assuming 'stats' contains the API response
const lineData = {
  labels: stats.labels,
  datasets: [
    {
      label: 'All Messages',
      data: stats.countData,
      borderColor: '#76B7B2',
      backgroundColor: 'rgba(118, 183, 178, 0.1)',
      tension: 0.3,
      fill: true,
    },
    {
      label: 'Rated Negative',
      data: stats.negativeData,
      borderColor: '#E15759',
      backgroundColor: 'rgba(225, 87, 89, 0.1)',
      tension: 0.3,
      fill: true,
    },
    {
      label: 'Rated Positive',
      data: stats.positiveData,
      borderColor: '#59A14F',
      backgroundColor: 'rgba(0, 204, 102, 0.1)',
      tension: 0.3,
      fill: true,
    },
  ],
}

// In your component
return (
  <div className="h-96 w-full">
    <Line 
      data={lineData}
      options={{ 
        maintainAspectRatio: false, 
        responsive: true 
      }}
    />
  </div>
)
```

For pie charts, you can use the distribution data provided in the response:

```js
import { Pie } from 'react-chartjs-2'

// Assuming 'stats' contains the API response
const pieData = {
  labels: stats.percentageLabels,
  datasets: [
    {
      data: stats.counts,
      backgroundColor: ['#76B7B2', '#E15759', '#59A14F'],
    },
  ],
}

// In your component
return (
  <div className="h-80">
    <Pie 
      data={pieData}
      options={{ 
        maintainAspectRatio: true, 
        responsive: true 
      }}
    />
  </div>
)
```

### Vanilla Chart.js Example

If you're not using React, you can use vanilla Chart.js to create the same visualizations:

```html
<!-- HTML -->
<div style="height: 400px; width: 100%;">
  <canvas id="lineChart"></canvas>
</div>

<div style="height: 320px; width: 100%;">
  <canvas id="pieChart"></canvas>
</div>

<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script>
  // NOTE: For security reasons, API requests with authentication tokens
  // should be performed server-side to avoid exposing your API keys in client-side code.
  // The stats data should be fetched on your server and then passed to the frontend.
  
  // Assuming 'statsData' contains the API response from your server
  const statsData = {
    // This would be populated with data from your server
    labels: ["2023-09-01", "2023-09-02", "2023-09-03"],
    countData: [12, 15, 8],
    negativeData: [2, 1, 0],
    positiveData: [8, 10, 6],
    percentageLabels: ["Neutral", "Negative", "Positive"],
    counts: [120, 45, 676]
  };
  
  // Create line chart
  function createLineChart(stats) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    
    const lineData = {
      labels: stats.labels,
      datasets: [
        {
          label: 'All Messages',
          data: stats.countData,
          borderColor: '#76B7B2',
          backgroundColor: 'rgba(118, 183, 178, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Negative',
          data: stats.negativeData,
          borderColor: '#E15759',
          backgroundColor: 'rgba(225, 87, 89, 0.1)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Rated Positive',
          data: stats.positiveData,
          borderColor: '#59A14F',
          backgroundColor: 'rgba(0, 204, 102, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
    
    new Chart(ctx, {
      type: 'line',
      data: lineData,
      options: { 
        maintainAspectRatio: false, 
        responsive: true 
      }
    });
  }
  
  // Create pie chart
  function createPieChart(stats) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    
    const pieData = {
      labels: stats.percentageLabels,
      datasets: [
        {
          data: stats.counts,
          backgroundColor: ['#76B7B2', '#E15759', '#59A14F'],
        },
      ],
    };
    
    new Chart(ctx, {
      type: 'pie',
      data: pieData,
      options: { 
        maintainAspectRatio: false, 
        responsive: true 
      }
    });
  }
  
  // Initialize charts when the page loads
  document.addEventListener('DOMContentLoaded', function() {
    createLineChart(statsData);
    createPieChart(statsData);
  });
</script>
```

This vanilla JavaScript example demonstrates how to:
1. Securely handle API data by fetching it server-side
2. Create a line chart showing question trends over time
3. Create a pie chart showing the distribution of ratings

You can easily extend this example to create additional charts for escalation and answer capability data using the same pattern.
