---
title: Bot Statistics - Admin API
description: How to accewss bot statistics with the admin API.
---

Once you have collected question and answer data, you can analyze bot performance using the statistics API. This provides aggregated metrics and chart data to help you understand how your bot is performing. {% .lead %}

---

## Get Bot Statistics

This endpoint provides aggregated statistics for a bot over a specified time period. It accepts a GET request with the following parameters:

`GET https://docsbot.ai/api/teams/:teamId/bots/:botId/stats?timeDelta=30`

### URL Parameters

| Property      | Type   | Description                                                                                |
| ------------- | ------ | ------------------------------------------------------------------------------------------ |
| **timeDelta** | number | The time period in days to analyze. Common values are 7 (week), 30 (month), 90 (quarter). |

### Examples

#### cURL

```bash
curl --request GET 'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=30' \
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
  'https://docsbot.ai/api/teams/FOX1XkWo8VMx3hp6Zjkb/bots/SQMV36O8xi43xbZRzYLy/stats?timeDelta=30',
  requestOptions
)
  .then((response) => response.json())
  .then((result) => console.log(result))
  .catch((error) => console.log('error', error))
```

### Response

The response is a JSON object containing aggregated statistics and chart data:

```json
{
  "totalCount": 841,
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
  
  "percentageLabels": ["Neutral", "Negative", "Positive"],
  "counts": [120, 45, 676],
  
  "escalatedLabels": ["Escalated", "Not Escalated"],
  "escalatedCounts": [120, 721],
  
  "answerLabels": ["Could Answer", "Could Not Answer"],
  "answerCounts": [776, 65]
}
```

### Response Object Properties

| Property             | Type       | Description                                                                |
| -------------------- | ---------- | -------------------------------------------------------------------------- |
| **totalCount**       | number     | Total number of user questions in the time period.                         |
| **resolutionRate**   | string     | Percentage of questions resolved without negative rating or escalation.    |
| **couldAnswerRate**  | string     | Percentage of questions the AI determined it could confidently answer.     |
| **deflectionRate**   | string     | Percentage of questions that didn't require escalation to human support.   |
| **timeSaved**        | number     | Estimated time saved for support staff in minutes (based on 5min/ticket).  |
| **labels**           | string[]   | Date labels for the line chart.                                            |
| **countData**        | number[]   | All questions count per date.                                              |
| **negativeData**     | number[]   | Negatively rated questions per date.                                       |
| **positiveData**     | number[]   | Positively rated questions per date.                                       |
| **couldAnswerData**  | number[]   | Questions AI could answer per date.                                        |
| **escalatedData**    | number[]   | Escalated questions per date.                                              |
| **percentageLabels** | string[]   | Labels for rating distribution (Neutral, Negative, Positive).              |
| **counts**           | number[]   | Counts for rating distribution.                                            |
| **escalatedLabels**  | string[]   | Labels for escalation distribution (Escalated, Not Escalated).             |
| **escalatedCounts**  | number[]   | Counts for escalation distribution.                                        |
| **answerLabels**     | string[]   | Labels for answer capability distribution (Could Answer, Could Not Answer).|
| **answerCounts**     | number[]   | Counts for answer capability distribution.                                 |

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
      label: 'All Questions',
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
          label: 'All Questions',
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