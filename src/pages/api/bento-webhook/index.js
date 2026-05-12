import OpenAI from 'openai'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
configureFirebaseApp()
const firestore = getFirestore()

export default async function handler(req, res) {
  try {
    //check that the request is coming from bento via Auth header
    const key = req.headers.authorization
    if (key !== process.env.BENTO_SECRET_KEY) {
      //return res.status(403).json({ message: 'Invalid key.' })
    }

    const { event_type, visitor_id, website, name, usage_type } = req.body

    if (!event_type || !visitor_id) {
      return res.status(400).json({ message: 'Invalid parameters.' })
    }

    if (event_type === 'welcome_email') {
      // fetch the website html via crawler
      const crawlResponse = await fetch(
        'https://api.apify.com/v2/actor-tasks/uglyrobot~website-content-crawler-marketing/run-sync-get-dataset-items?token=' +
          process.env.APIFY_TOKEN,
        {
          method: 'POST',
          body: JSON.stringify({
            startUrls: [{ url: website }],
          }),
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      )
      //log the response body content
      const crawlData = await crawlResponse.json()
      let scrape = ''
      let languageCode = 'en'
      if (crawlData[0]?.text) {
        scrape = crawlData[0].metadata.title
        languageCode = crawlData[0].metadata.languageCode || 'en'
        if (crawlData[0].metadata.description) {
          scrape += '\n' + crawlData[0].metadata.description
        }
        scrape += '\n\n' + crawlData[0].text

        //crop to max 30k characters around 12k tokens
        if (scrape.length > 60000) {
          scrape = scrape.substring(0, 60000)
        }
      } else {
        console.warn('Crawl data error:', crawlData)
        res.status(503).json({ message: 'No text found on website.' })
        return
      }
      console.log('Website scrape for url:', website, scrape)

      const docsbot = `
DocsBot
# Custom AI Agents for Your Business!

## Instant Answers & Actions for your customers and team

DocsBot turns your knowledge base into AI agents that deliver instant, accurate answers and take action across your tools, workflows, and support operations.

## Use Cases

AI Solutions to Real Business Problems

Give your customers and teams expert AI chatbots trained on your knowledge base. Capture more leads, deliver fast, concise answers, boost efficiency, and drive growth with instant, accurate responses tailored to your business.

## Customer Support Bots

Set Your Customer Support Apart

Move your customer support from reactive to proactive with AI-powered bots that deliver instant, accurate responses 24/7. Ensure consistent quality while reducing resolution times and support costs.

Eliminate Repetitive Work Let AI handle routine questions so your team can focus on complex, high-value issues that require human expertise.

Improve Efficiency Resolve more inquiries on first contact with accurate AI responses and seamless human handoffs.

Increase Agent Satisfaction Remove tedious tasks and empower your team to do meaningful problem-solving every day.

## Pre-Sales Chat

Turn Visitors Into Qualified Leads

Capture more leads by engaging every visitor instantly with AI sales agents trained on your knowledge base and sales playbook.

10× More Leads Respond to inquiries within seconds. Our helpdesk data shows fast answers dramatically increase lead capture rates.

Always Accurate Deliver consistent, on-brand responses with chatbots trained on your product details, documentation, messaging, pricing, and offers.

Scale Your Sales Team Handle multiple conversations at once while giving every visitor a high-quality presales experience that builds trust and drives conversions.

## Internal Knowledge Access

Your Business Knowledge On Demand

Transform how your team finds information with AI-powered knowledge retrieval. Eliminate hours spent searching through documents, systems, and databases with bots that deliver answers instantly.

Knowledge Retrieval Surface relevant information instantly from your internal documentation without digging through multiple tools or data sources.

Secure Access Protect sensitive information with enterprise-grade security while giving authorized team members seamless access.

Continuous Learning Your bot automatically stays current as documentation evolves, ensuring teams always have the latest, most accurate knowledge.

## AI Agents That Can Act

### Move From Answers to Action

DocsBot can automate processes and connect to the systems your business already uses, so your AI agent can do more than explain the next step.

## Research Assistant

Verified, Source-Aware Insights

Transform your research process with AI-powered document analysis, structured reporting, and our new Deep Research agent. Combine your DocsBot knowledge base with live web search and Code Interpreter to surface cited insights in minutes.

Instant Reference Discovery Quickly surface relevant citations, data points, and research materials from your document library saving hours manually searching and cross-referencing.

Comprehensive Analysis Get detailed insights and identify patterns, relationships, and findings across sources.

Content Repurposing Turn existing content into new formats and insights. Extract key data to create summaries, presentations, reports, or training materials.

## How It Works

Create your own AI-powered documentation assistant in four simple steps - no coding or technical skills required. Our intuitive process lets anyone go from setup to launch in minutes while ensuring high-quality responses.

AI agents that can act

## Move from answers to action

DocsBot can automate processes and connect to the systems your business already uses, so your AI agent can do more than explain the next step.

## Effortless Chatbot Training

Teach your AI Anything with 30+ Content Sources

Our intuitive interface makes it easy to index your documentation, websites, knowledge bases, cloud storage, YouTube videos, support tickets, or any other content with just a few clicks. Schedule automatic updates to keep your assistant up to date.

## Deploy Anywhere

Powerful Integrations and APIs

Easily add your custom DocsBot anywhere with our flexible widgets and powerful APIs. Embed it on your website, WordPress, app, or integrate with Slack, Microsoft Teams, ticketing systems—any platform you use.

Security & compliance

## Built-in protection for sensitive data

DocsBot pairs enterprise AI with rigorous controls so you can ship AI agents quickly without sacrificing privacy or trust.
`

      const usageTypes = {
        support: 'Support & Presales - Customer support & presales, 24/7 in 95 languages.',
        internal: 'Internal Knowledge - Give your team answers from your company knowledge base.',
        research: 'Document Q&A - Chat with your docs & files for research or education.',
        content: 'Content Creation - Generate custom content for your blog or social media.',
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
      })

      let chat_completion = null
      try {
        chat_completion = await openai.chat.completions.create({
          model: 'gpt-5.5',
          messages: [
            {
              role: 'system',
              content:
                'Write a custom welcome to DocsBot email from Aaron the founder to a new potential customer. It should be friendly and informal, and not too wordy. Make it seem like it was typed by hand with one emoji in the subject and body signature. Mention that I just viewed their company website. Make sure to give some ideas how our product DocsBot as described in the provided context could be specifically used for their business based on the provided company information gathered from their website. Invite them to reply with any questions or to book a meeting via https://tidycal.com/team/docsbot/onboarding.',
            },
            { role: 'system', content: `DocsBot context:\n${docsbot}` },
            { role: 'user', content: `Customer name: ${name}\nWebsite: ${website}` },
            { role: 'user', content: `Company information from website:\n${scrape}` },
            {
              role: 'user',
              content: `They are most interested in using DocsBot for: ${
                usageTypes[usage_type] || 'whatever you suggest'
              }`,
            },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'email_content',
              description: 'Extracts the email subject and body as valid JSON.',
              strict: true,
              schema: {
                type: "object",
                properties: {
                  subject: {
                    type: 'string',
                    description: 'The plaintext subject of the email.',
                  },
                  body: {
                    type: 'string',
                    description: 'The HTML body of the email content, properly formatted as valid HTML with paragraph and other tags.',
                  },
                },
                required: ['subject', 'body'],
                additionalProperties: false,
              },
            },
          },
        })
      } catch (error) {
        console.error('Chat completion error:', error)
        return res.status(500).json({ message: 'OpenAI Error.' })
      }

      console.log('Chat completion:', chat_completion.choices[0]?.message?.content)
      let emailContent = null

      try {
        emailContent = JSON.parse(chat_completion.choices[0]?.message?.content)
      } catch (error) {
        res.status(500).json({ message: 'Invalid JSON response from OpenAI. Please try again.' })
      }

      console.log('Email content:', emailContent)

      //save to firestore using the visitor_id as the doc id
      const docRef = await firestore.collection('emails').doc(visitor_id).set({
        created: new Date(),
        website: website,
        name: name,
        subject: emailContent.subject,
        body: emailContent.body,
      })

      return res.status(200).end()

      /*
      // You can send an array of emails.
      // MAX 100 per request.
      const import_data = [
        {
          to: email, // required — if no user with this email exists in your account they will be created.
          from: 'human@docsbot.ai', // required — must be an email author in your account.
          subject: emailContent.subject, // required
          //html_body: emailContent.body, // required - can also use text_body if you want to use our plain text theme.
          text_body: emailContent.body, // required - can also use html_body if you want to use our default theme.
          transactional: false, // IMPORTANT — this bypasses the subscription status of a user. Abuse will lead to account shutdown.
        },
      ]
      console.log('Import data:', import_data)
      const auth =
        'Basic ' +
        Buffer.from(process.env.BENTO_PUB_KEY + ':' + process.env.BENTO_SECRET_KEY).toString(
          'base64'
        )

      const response = await fetch('https://app.bentonow.com/api/v1/batch/emails', {
        method: 'POST',
        body: JSON.stringify({
          site_uuid: process.env.NEXT_PUBLIC_BENTO_SITE,
          emails: import_data,
        }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: auth,
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log('Welcome email sent:', data)
        return res.status(200).end()
      } else {
        try {
          const data = await response.json()
          console.log('Welcome email error:', data)
          return res.status(response.status).json(data)
        } catch (e) {
          return res.status(response.status).end({ message: 'Error sending welcome email' })
        }
      }
      */
    }
  } catch (error) {
    console.error(error)
    return res.status(500).end()
  }
}
