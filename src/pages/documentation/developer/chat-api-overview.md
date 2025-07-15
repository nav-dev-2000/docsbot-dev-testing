---
title: Chat APIs Overview
description: Use the chat API endpoints to create your own Q/A and chat interfaces in your product.
---

Use the chat API endpoints to create your own Q/A and chat interfaces in your product. {% .lead %}

---

## Introduction

There is one chat API endpoint that can be used for different purposes:

### Question and Answer (Q/A) Bots

Q/A bots are the simplest and is used to get answers to questions. You pass it one question, and it returns one answer along with its sources. It lets you create a simple Q/A interface in your product. This uses the same endpoint as the chat API, you simply don't pass any chat history.

### Chat Bots

The chat API is more complex and is used to create a full chat interface in your product. You pass it a question plus chat history, and it returns the next answer along with its sources. It also returns the new chat history array to pass back with the next response. This is the endpoint you should use if you want to create a full chat interface in your product.

{% callout title="Chat Agent API (NEW)" %}
The [Chat Agent API](/documentation/developer/chat-agent) is our latest and most powerful API for integrating conversational chatbots with your product. You input a question and receive the answer along with its sources. This API can employ multiple agent tools to address queries and perform actions, and even accept images for multimodal chats when using supported models. For output it supports both non-streaming and streaming responses using SSE (similar to the OpenAI API).
{% /callout %}

{% callout type="warning" title="Legacy APIs - Use Chat Agent API Instead" %}
*The following Chat APIs are legacy and deprecated.* For new integrations, we strongly recommend using the [Chat Agent API](/documentation/developer/chat-agent) instead. The Chat Agent API is our latest and most powerful API that supports streaming responses, multimodal chats, and advanced agent capabilities. It provides a more modern and feature-rich experience for building conversational interfaces.
{% /callout %}

The original Chat API is stateless, meaning we don't track chat sessions between requests via a cookie or any other method. It's the responsibility of your code to do any session tracking by saving the returned chat history to send with the next request. This makes it a bit more complex to implement, but it also makes it more flexible and allows you to use the API in any way you want. 

[Read more about the Chat API](/documentation/developer/chat-api)

---

## REST vs Websocket Streaming APIs

There are two ways to use the older chat APIs: REST and streaming via websocket. The REST API is the simplest as its just a simple HTTP request and response. The streaming API is more complex as it requires a websocket connection to be established and maintained. The streaming API is more efficient as it allows you to receive responses as soon as they are available, rather than waiting for the entire response to be generated. It also allows you to display the answers as they are being generated, rather than waiting for the entire response to be generated then returned. This makes for a much more interactive experience for the user.