---
title: Help Scout Integration
description: Use DocsBot AI and your existing documentation to auto-reply to support tickets.
---

Learn how to connect a Help Scout app and auto reply to newly created conversations. {% .lead %}

---

## Overview

[Help Scout](https://helpscout.grsm.io/9cush642f1y3) is a popular support software used by many businesses to provide support chats and tickets for their products. Wouldn't it be nice to have DocsBot learn from your existing documentation and auto-generate draft replies for each new support ticket? DocsBot can save your staff time so they can focus their time on solving more complex support tickets? With this guide you'll be able to do just that!

## Creating a Help Scout OAuth Application

First thing you'll need is to create a Help Scout OAuth Application to authenticate DocsBot access to your mailbox conversations. This will allow DocsBot to automatically write draft replies as the user you're currently signed into.

- Login to [Help Scout](https://secure.helpscout.net/) then open your profile in the navbar on the top right and click 'Your Profile'. ![The profile link in Help Scout](/images/helpscout-profile.png)
- On the left under your name you'll see a 'Your apps' menu item, click that. ![Creating your Help Scout app](/images/helpscout-app.png)
- Click 'Create new App' at the top, then enter "DocsBot" and "https://docsbot.ai" for the name and redirect url respectively (note these can be set to anything).

## Adding your Help Scout OAuth App to DocsBot

Next you'll need to let DocsBot know about your app.

- Go to your API dashboard, [here](https://docsbot.ai/app/api).
- Scroll to the bottom where it says 'Help Scout Integration'
- Paste your App ID and App Secret from your created Help Scout OAuth App and click 'Add Help Scout App'. ![Adding your app credentials](/images/helpscout-creds.png)
- After your information is verified, you'll see a list of Mailboxes that your App has access too.

## Auto-draft Replies to Conversations

After you've setup your Help Scout integration, you can use our Auto-drafts feature to generate a draft reply for new conversations in your mailbox. This can save your support staff precious time and maybe even help guide them by pre-writing answers to common issues. You'll start by navigating to your bot that you've just added the mailbox source to. Click on 'Sharing & API' and look for the 'Help Scout Auto-drafts' section. Here you'll see two strings, 'Callback URL' and 'Webhook Secret.'

![Help Scout Webhook setup](/images/helpscout-webhook.png)

1. Install the [Webhooks App in your Help Scout dashboard](https://secure.helpscout.net/apps/webhooks/) or create a new webhook and paste the Webhook Secret and Callback URL from below into the relevant fields.
1. Set it to Active and check the "Conversation Created" and optionally "Conversation Customer Reply" events.
1. Select the mailbox you want to enable Auto-drafts for.
1. Finally, click "Save" and you're all set!

Anytime a new conversation is created, DocsBot will create a draft reply using your selected bot.

## Training your Bot from Existing Help Scout Conversations

Imagine how much support information you have locked away in your support ticket history. DocsBot can help you unlock that information and make it available to your customers 24/7 by turning it into structured documentation or acting as an AI frontline support agent! Enable our Help Scout source to train your bot from your existing support tickets and conversations. This can be a great way to get started with DocsBot and help it learn from your existing support conversations.

{% callout title="Coming soon!" %}
We are alpha testing this feature now internally. If you'd like to be a part of the beta, please contact us!
{% /callout %}