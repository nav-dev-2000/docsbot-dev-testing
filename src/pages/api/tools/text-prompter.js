import OpenAI from 'openai'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { getAuthorizedUser } from '@/middleware/getAuthorizedUser'

// https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#preferredregion
export const preferredRegion = [
  'iad1',
  'hnd1',
  'lhr1',
  'sfo1',
  'syd1',
  'bom1',
  'fra1',
]

const PROMPTS = {
  humanize: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Transform AI-generated content into human-like text that can bypass AI detection systems.

Retain the essence and accuracy of the original text while adjusting the language to appear more naturally written by a human. Focus on word choice, sentence structure, and tone.

# Steps

1. **Review the Original Text:** Analyze the provided AI-generated content to understand the key points and overall message.
2. **Transform the Language:** Rephrase and modify the text to mimic human writing styles. Pay attention to:
   - Using varied sentence structures
   - Incorporating contractions and casual language where appropriate
   - Ensuring sentences flow naturally
3. **Review for Coherence:** Ensure the transformed text maintains coherence, logical flow, and accurately conveys the intended message.

# Output Format

- Provide the revised text in a clear, readable format.
- Preserve the original text basic structure and layout.
- Only ouput markdown if the original text is markdown.
- Only output the humanized text.

# Notes

- Do not make extreme changes that could alter the original meaning.
- Aim for a balance between human-like text and preservation of original content integrity.`,
      },
      {
        role: 'user',
        content: `Original Text:\n{{input}}`,
      },
    ],
  },
  paraphrase: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Rephrase and reword the provided text for essays, articles, emails, and different types of documents. I can optionally specify a tone to guide the rewording.

# Steps

1. **Input:** Provide the text to be reworded and specify the tone if desired (e.g., formal, informal, persuasive).
2. **Analysis:** Understand the context and purpose of the text.
3. **Rewording:** Transform the text while maintaining the original meaning, enhancing clarity and flow.
4. **Tone Adjustment:** Modify the style to fit the specified tone if provided.

# Output Format
- The rephrased text should a similar length to the original and reflect the chosen tone if specified.
- Only output the rephrased text, no labels or headings.

# Examples

1. **Original Text:** "I need the report by tomorrow."
 **Tone:** Formal
 **Output:** "Could you please provide the report by tomorrow?"

2. **Original Text:** "I had a fantastic time at the conference and learned a lot."
 **Tone:** Informal
 **Output:** "Had a great time at the conference and picked up a lot of new info!"

# Notes
- Ensure that the rephrased text captures the essence of the original.
- Tailor the text to the specified tone without altering key information.
- Don't add new formatting or markdown that isn't in the original.`,
      },
      {
        role: 'user',
        content: `Tone: {{tone}}\nOriginal Text:\n{{input}}`,
      },
    ],
  },
  sentenceRewriter: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Rewrite the given sentence in the specified tone. You can rewrite the sentence in any of the following tones: Casual, Formal, Professional, Academic, Creative, Friendly, Confident, Simplified, Vivid, Empathetic, Engaging, Direct, or Persuasive.

When rewriting, maintain the original meaning while adapting the style, word choice, and structure to fit the desired tone. Ensure the tone is clear and consistent throughout the sentence.

# Steps
1. Identify the original sentence provided.
2. Determine the target tone from the list.
3. Analyze the characteristics of the target tone.
4. Rewrite the sentence applying the stylistic features and vocabulary appropriate for that tone.
5. Review the rewritten sentence to ensure clarity, tone accuracy, and that the original meaning is preserved.

# Output Format
Provide only the rewritten sentence in plain text, clearly reflecting the chosen tone.

# Examples
- Original: "The project deadline is approaching soon."
- Tone: Casual
- Rewritten: "Hey, the deadline for our project is coming up pretty soon!"

- Original: "Please submit your report by Friday."
- Tone: Formal
- Rewritten: "Kindly ensure your report is submitted by Friday."

- Original: "We need to increase sales next quarter."
- Tone: Persuasive
- Rewritten: "Boosting our sales next quarter is essential for our continued success; let's make it happen!"

# Notes
- Be careful to avoid changing the sentence meaning.
- Adapt sentence length and complexity as suited for the tone.
- Avoid jargon unless appropriate for the tone.`
      },
      {
        role: 'user',
        content: `Tone: {{tone}}\nOriginal Sentence:\n{{input}}`,
      },
    ],
  },  

  summarize: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze and summarize support ticket conversations to extract key information and create concise summaries. The summary should identify the main issues, relevant details, and any action items or resolutions needed.

# Steps

1. **Input Analysis:** Review the support ticket content and ticket category
2. **Key Information Extraction:** Identify the core issue, customer needs, and any technical details
3. **Context Understanding:** Consider the ticket category and business impact
4. **Summary Creation:** Create a clear, actionable summary highlighting the key points in markdown format.

# Output Format
Provide a structured markdown formatted summary with:
- Short Title: 1-5 words that summarize the issue
- Main Issue: Brief description of the core problem (1-2 sentences)
- Key Details: Important contextual information and technical details
- Priority Level: Suggested priority based on issue severity
- Customer Sentiment: Positive, Neutral, or Negative using emoji to illustrate
- Next Steps: Recommended actions or resolution path

# Notes
- Focus on actionable insights and clear problem identification
- Maintain all critical details while eliminating redundant information
- Consider business impact and urgency in the summary
- Highlight any immediate actions needed for resolution

# Example

**Input Ticket:**
Chat bot link - Hi. Our bot is internal (named "Anie"). I do not want the link for the bot to be shareable. Can we disable the link? We have it integrated with slack right now, and I only want our team to use the slack channel to chat with the bot. They should not use the external link, because then everyone else on our team cannot see their questions/answers. Also, I do not want the link shared with customers.

**Output:**
## Disable Chatbot Link

**Main Issue:** The customer wants to prevent the internal chatbot ("Anie") from being shareable externally to ensure that only their team can access it through Slack.

**Key Details:** 
- Customer's bot is currently integrated with Slack.
- Concern arises from the potential of sharing the external link, which could lead to non-team members accessing internal Q&A.
- The request is time-sensitive as the customer wants to implement this change immediately.

**Priority Level:** High - due to implications for internal communication and data privacy.

**Customer Sentiment:** Negative 😟 - expressing concern over control and security of internal tools.

**Next Steps:** Advise the customer to set the bot to private in its settings to restrict sharing and embedding capabilities. Confirm implementation and ensure they are aware of the configuration process.
`,
      },
      {
        role: 'user',
        content: `Ticket Content:\n{{input}}`,
      },
    ],
  },
  ticketResponseRewriter: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `The user should be able to specify the tone and style from the following options: friendly and casual, professional and formal, detailed and explanative, concise and direct, empathetic and understanding, or technical and precise. Incorporate a wildcard variable Desired Style/Tone that can be replaced with one of these tone options to customize the rewritten response's style and formatting.

Your job is to take an input support ticket response and rewrite it according to the Desired Style/Tone specified by the user.

# Steps
1. Accept input: the original support ticket response.
2. Accept input: the desired style/tone specified by the wildcard Desired Style/Tone variable.
3. Rewrite the response in the style matching Desired Style/Tone.
4. Preserve the meaning and accuracy of the support ticket information.

# Output Format
Return the rewritten support ticket response as plain text, styled according to the specified Desired Style/Tone.

# Examples
Input: "I'm sorry your order hasn't arrived yet. We'll check the status and get back to you soon."
Format style: friendly and casual
Output: "Hi there! Sorry to hear your order is delayed. We'll look into it and update you shortly!"

Input: "Your refund has been processed. Please allow 3-5 business days for the amount to reflect in your account."
Format style: professional and formal
Output: "We have processed your refund. Kindly allow 3 to 5 business days for the funds to be reflected in your account.",

# Notes
- Ensure the rewritten response is grammatically correct and maintains the original meaning.
- Use the specified Desired Style/Tone to tailor the response to the user's preferences.
- Do not add any additional text or formatting beyond the rewritten response.`
      },
      {
        role: 'user',
        content: `Original Response:\n{{input}}\n\nDesired Style/Tone: {{tone}}`,
      },
    ],
  },
  supportTicketResponseGenerator: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a support assistant tool designed to generate helpful and effective responses to support tickets. Your task is to read the provided support ticket content carefully and generate a clear, empathetic, and informative reply that addresses the user's issue or question.

You must customize the tone of the response according to the specified tone parameter. Common tone options include: friendly, professional, empathetic, concise, or casual. Adjust your language, formality, and phrasing to match this tone while maintaining clarity and helpfulness.

Steps:
1. Analyze the support ticket text to understand the user's issue or question.
2. Determine the necessary information or solution to address the ticket.
3. Generate a response that solves the problem or guides the user, tailored to the requested tone.
4. Ensure the response is clear, polite, and free of jargon unless appropriate to the user's level.

Output format:
Provide the response as plain text suitable for customer communication.

Example:

Support Ticket: "I'm having trouble logging into my account; it says my password is incorrect even though I just reset it. Can you help?"
Tone: Friendly

Response:
"Hi there! I'm sorry to hear you're having trouble logging in after resetting your password. Let's work together to get this sorted out. Please try clearing your browser cache or resetting your password again using the "Forgot Password" link. If the problem persists, let me know, and we'll explore other options!"

Remember to always verify the ticket content before generating the response and tailor the message according to the tone requested.`,
      },
      {
        role: 'user',
        content: `Support Ticket:\n{{input}}\n\nTone: {{tone}}`,
      },
    ],
  },
  supportConversationTranslator: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Translate the entire support ticket conversation accurately and clearly into the specified target language, which will be provided as Target Language. Ensure the translation maintains the original meaning, context, and tone of each message in the conversation.

- The conversation will be provided in full.
- Translate every message within the conversation.
- Preserve any technical terms, names, or specific references accurately.
- Use clear and natural language appropriate for a support ticket context.

# Steps

1. Read the full conversation carefully.
2. Identify the target language indicated by Target Language.
3. Translate every part of the conversation into Target Language without altering the meaning.
4. Maintain the conversational structure, showing messages in order.
5. Review the translation for clarity and accuracy.

# Output Format

Deliver the translated conversation in the same conversational format as the original, clearly indicating the speakers if such info is provided, and present the entire translated text as plain text or structured conversation if originally structured.

# Notes

- If the conversation includes specialized terminology, keep those terms accurate but translated if appropriate.
- Maintain polite and professional tone suitable for customer support.
- If the source conversation includes any text in different languages, translate them all into the chosen target language.

Remove any system or meta instructions from your final output; only provide the translated conversation.`,
      },
      {
        role: 'user',
        content: `Target Language: {{targetLanguage}}\nConversation:\n{{input}}`,
      },
    ],
  },
  supportTicketResponseTranslator: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Create an AI tool that takes a support ticket response inputted or pasted by the user and translates it into a desired language selected via a dropdown list.

The AI should:
- Detect the input text accurately.
- Provide translation into the Target Language selected from the dropdown menu.
- Ensure the translation preserves the context and tone appropriate for support ticket communication.
- Support multiple languages commonly used in customer support.

Steps:
1. Receive the support ticket response as input.
2. Obtain the target language from the dropdown selection.
3. Translate the input text into the selected Target Language.
4. Output the translated response clearly and accurately.

Output Format:
Return the translated text as a single string without additional formatting or metadata, ready to be used in a support ticket reply.

# Notes
- Ensure the translation is accurate and maintains the original meaning.
- Preserve the tone and style of the original response.
- Use clear and natural language appropriate for a support ticket context.`,  
      },
      {
        role: 'user',
        content: `Target Language: {{targetLanguage}}\nResponse:\n{{input}}`,
      },
    ],
  },
  paragraph: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate engaging and unique paragraphs based on a provided topic or keywords, writing style, and specified number of paragraphs. Your task is to create content suitable for mediums such as blogs, essays, articles, emails, or social media posts while ensuring relevance to the given topic and style. Make effective use of inline markdown formatting to improve readability, such as using **bold** for emphasis, *italics* for nuanced points. Do not add headings or bullet lists. Maintain the precise number of paragraphs requested.

# Steps

1. **Understand the Inputs**: Carefully review the provided topic, keywords, writing style, and number of paragraphs.
2. **Research and Contextualize**: If necessary, conduct brief research to ensure accurate and relevant content. Use knowledge available to generate accurate information.
3. **Draft Content**: Begin drafting paragraphs by closely adhering to the given style. Ensure each paragraph adds value and context to the topic.
4. **Format with Markdown**: Use appropriate markdown styling (bold, italics) to enhance readability while maintaining a clean and professional look.
5. **Review for Cohesion**: If more than one paragraph is requested, ensure each requested paragraph logically transitions from one to the next, creating a cohesive piece.
6. **Count and Adjust**: Verify that the output exactly matches the number of paragraphs requested.

# Output Format
- Write content in the requested number of distinct paragraphs separated by double newlines.
- Utilize markdown formatting inline for enhanced readability.
- Clearly incorporate the designated writing style throughout the content.

# Example 1

### Input
- Topic/Keywords: "The importance of sleep"
- Writing Style: Informative
- Number of Paragraphs: 3

### Output

Sleep is a fundamental aspect of physical and mental health. Recent studies highlight that **adequate sleep** supports immune function, mood regulation, and cognitive processes. Understanding the importance of sleep can lead to lifestyle changes that promote well-being.

Beyond mere rest and recuperation, sleep is critical for emotional stability and learning. REM sleep, in particular, plays a role in processing emotions and consolidating memories. Integrating sleep hygiene practices, like maintaining a regular sleep schedule, can yield significant benefits.

Many face challenges with sleep, yet solutions are within reach. Incorporating habits such as reducing screen time before bed and creating a tranquil sleeping environment can make a notable difference. Through awareness and proactive measures, one can achieve restorative sleep and improve overall health.


# Example 2

### Input
- Topic/Keywords: "All I do is fix bugs all day"
- Writing Style: Journalistic
- Number of Paragraphs: 1

### Output

In the tech world, the life of a software developer often revolves around a relentless cycle of troubleshooting and refining code. For many professionals in the industry, the phrase "all I do is fix bugs all day" captures the essence of their daily activities. With the fast-paced nature of software development, developers frequently find themselves on the front lines, addressing issues that affect user experience and overall product functionality. This reality can often lead to burnout, as the work involved isn't merely about finding and fixing errors; it's also about ensuring that new features and updates don’t introduce further complications.


# Notes
- Consider using everyday examples or metaphors to make complex topics more relatable.
- Ensure clarity and succinctness in expression without compromising on depth of information.
`,
      },
      {
        role: 'user',
        content: `Topic: {{input}}\nWriting Style: {{tone}}\nParagraph Count: {{paragraphCount}}\n\nYour response should be limited to {{paragraphCount}} paragraph(s).`,
      },
    ],
  },
  slogan: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Generate catchy, memorable slogans for brands based on the provided brand name, industry, keywords/values, and desired tone. Your task is to create unique, compelling taglines that capture the brand's essence and resonate with their target audience.

# Steps

1. **Analyze Brand Context**: Review the brand name, industry, and any provided keywords or values to understand the brand's positioning and target market.
2. **Apply Tone Guidelines**: Incorporate the specified tone (e.g., professional, playful, bold, luxury) to ensure the slogans match the brand personality.
3. **Create Memorable Phrases**: Generate slogans that are:
   - Short and punchy (typically 2-6 words)
   - Easy to remember and pronounce
   - Unique to the brand's value proposition
   - Emotionally engaging
4. **Ensure Variety**: Create diverse slogan options that explore different angles and approaches while maintaining consistency with the brand and tone.
5. **Focus on Benefits**: Highlight what makes the brand special, whether it's quality, innovation, reliability, or emotional connection.

# Output Format
- Provide the requested number of slogans as a numbered list
- Each slogan should be on its own line
- Keep slogans concise and impactful
- No additional formatting or explanations

# Examples

### Input
- Brand Name: "TechFlow"
- Industry: "AI tools"
- Keywords: "fast, powerful, innovative"
- Tone: "Professional"
- Count: 5

### Output
1. Smart Solutions. Fast Results.
2. Power Your Progress.
3. Innovation at Speed.
4. Tech That Works.
5. Accelerate Your Success.

### Input
- Brand Name: "Sunny Beans"
- Industry: "Coffee shop"
- Keywords: "organic, local, cozy"
- Tone: "Friendly"
- Count: 3

### Output
1. Where Friends Meet Coffee.
2. Locally Roasted, Globally Loved.
3. Your Daily Dose of Sunshine.

# Notes
- Avoid clichéd phrases and overused terms
- Consider wordplay, alliteration, and rhythm when appropriate for the tone
- Ensure slogans are legally safe and don't reference competitors
- Focus on benefits and emotions, not just features
- Keep the brand's target audience in mind`,
      },
      {
        role: 'user',
        content: `Brand Name: {{brandName}}\nIndustry: {{industry}}\nKeywords/Values: {{keywords}}\nTone: {{tone}}\nSlogan Count: {{sloganCount}}\n\nGenerate {{sloganCount}} unique slogans for this brand.`,
      },
    ],
  },
  pdfSummarize: {
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `Analyze and summarize PDF document content to create clear, comprehensive summaries. Your task is to extract key information, main topics, and important details from the provided PDF text content.

# Steps

1. **Content Analysis**: Review the entire PDF text content to understand the document structure, main topics, and key themes.
2. **Information Extraction**: Identify the most important points, conclusions, data, and insights from the document.
3. **Summary Structure**: Organize the information into a logical, easy-to-read format.
4. **Length Adaptation**: Adjust the summary length based on the specified summary type (brief, detailed, or comprehensive).

# Summary Types
- **Brief**: 2-3 paragraphs highlighting the main points
- **Detailed**: 4-6 paragraphs with key sections and important details
- **Comprehensive**: Full analysis with all major sections and supporting details

# Output Format
Provide a well-structured markdown summary with:
- **Document Title/Topic**: Brief description of what the document is about
- **Main Points**: Key findings, arguments, or topics covered
- **Key Details**: Important data, statistics, quotes, or specific information
- **Conclusion**: Summary of outcomes, recommendations, or final thoughts (if applicable)

# Guidelines
- Use clear, concise language
- Maintain the original meaning and context
- Include specific details, numbers, or data when relevant
- Organize information logically
- Use markdown formatting for better readability
- Focus on the most valuable and actionable information
- **IMPORTANT**: Never use LaTeX, MathJax, or mathematical notation syntax (like \\text{}, \\rightarrow, subscripts with {}, etc.)
- For chemical formulas, use plain text format (e.g., "CO2" not "\\text{CO}_2", "H2O" not "\\text{H}_2\\text{O}")
- For mathematical equations, use simple text format (e.g., "6CO2 + 6H2O + Light Energy → C6H12O6 + 6O2")
- Use → (arrow symbol) instead of \\rightarrow for reactions
- Use simple superscript/subscript notation when needed (CO₂, H₂O) or plain text (CO2, H2O)

# Example Output Structure

## Document Summary: [Document Title/Topic]

**Main Points:**
- Key point 1 with supporting details
- Key point 2 with supporting details
- Key point 3 with supporting details

**Key Details:**
- Important statistic or data point
- Significant quote or finding
- Relevant dates, numbers, or specific information

**Conclusion:**
Brief summary of the document's main conclusions or recommendations.

# Notes
- Preserve factual accuracy and important context
- Adapt the summary length to match the specified type
- Focus on actionable insights and key takeaways
- Maintain professional tone and clarity
- Always use readable plain text formatting instead of LaTeX or mathematical markup`,
      },
      {
        role: 'user',
        content: `Summary Type: {{summaryType}}\n\nDocument Content:\n{{input}}`,
      },
    ],
  },
  // Add more types here as needed
}



const getChatParams = (type, params) => {
  if (!PROMPTS[type]) {
    throw new Error(`Invalid chat parameter type: ${type}`)
  }

  const replacePlaceholders = (content, params) => {
    return Object.entries(params).reduce((acc, [key, value]) => {
      return acc.replace(
        new RegExp(`{{${key}}}`, 'g'),
        typeof value === 'object' ? JSON.stringify(value) : value,
      )
    }, content)
  }

  const chatParams = { ...PROMPTS[type] }
  chatParams.messages = chatParams.messages.map((msg) => ({
    ...msg,
    content: replacePlaceholders(msg.content, params),
  }))

  //console.log(chatParams)
  return chatParams
}

export default async function handler(req, res) {
  try {
    if (req.method === 'POST') {
      const { type, input, tone, paragraphCount, targetLanguage, brandName, industry, keywords, sloganCount, summaryType } = req.body

      if (!type || !PROMPTS[type]) {
        return res
          .status(400)
          .json({ message: 'Invalid or missing `type` parameter.' })
      }

      if (type === 'humanize') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing input parameter.' })
        }

        if (input.length > 10000) {
          return res
            .status(400)
            .json({
              message: 'Input is too long. Maximum length is 10000 characters.',
            })
        }
      }

      if (type === 'paraphrase') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing input parameter.' })
        }

        if (input.length > 10000) {
          return res
            .status(400)
            .json({
              message: 'Input is too long. Maximum length is 10000 characters.',
            })
        }

        if (tone && typeof tone !== 'string') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing tone parameter.' })
        }
      }

      if (type === 'paragraph') {
        if (!input || typeof input !== 'string' || input.trim() === '') {
          return res.status(400).json({ message: 'Invalid or missing input parameter.' })
        }

        if (
          !paragraphCount ||
          typeof paragraphCount !== 'number' ||
          paragraphCount < 1 ||
          paragraphCount > 5
        ) {
          return res
            .status(400)
            .json({ message: 'Invalid or missing paragraphCount parameter.' })
        }
    
        if (tone && typeof tone !== 'string') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing tone parameter.' })
        }
      }

      if (type === 'slogan') {
        if (!brandName || typeof brandName !== 'string' || brandName.trim() === '') {
          return res.status(400).json({ message: 'Invalid or missing brandName parameter.' })
        }

        if (!industry || typeof industry !== 'string' || industry.trim() === '') {
          return res.status(400).json({ message: 'Invalid or missing industry parameter.' })
        }

        if (
          !sloganCount ||
          typeof sloganCount !== 'number' ||
          sloganCount < 3 ||
          sloganCount > 10
        ) {
          return res
            .status(400)
            .json({ message: 'Invalid or missing sloganCount parameter. Must be between 3 and 10.' })
        }
    
        if (tone && typeof tone !== 'string') {
          return res
            .status(400)
            .json({ message: 'Invalid or missing tone parameter.' })
        }

              if (keywords && typeof keywords !== 'string') {
        return res
          .status(400)
          .json({ message: 'Invalid keywords parameter.' })
      }
    }

    if (type === 'pdfSummarize') {
      if (!input || typeof input !== 'string' || input.trim() === '') {
        return res
          .status(400)
          .json({ message: 'Invalid or missing PDF content. Please upload a valid PDF file.' })
      }

      if (input.length > 50000) {
        return res
          .status(400)
          .json({
            message: 'PDF content is too long. Maximum length is 50000 characters.',
          })
      }

      if (summaryType && !['brief', 'detailed', 'comprehensive'].includes(summaryType)) {
        return res
          .status(400)
          .json({ message: 'Invalid summary type. Must be brief, detailed, or comprehensive.' })
      }
    }

    //validate other type params here

      // check if user is logged in or has a valid API key
      let user
      let isLoggedIn = false
      try {
        user = await getAuthorizedUser({ req })
        isLoggedIn = true
      } catch (error) {
        // User is not logged in and doesn't have a valid API key
      }

      // check rate limit
      const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
      const isRateLimited = await checkPromptRateLimit(ip, type, isLoggedIn)
      if (isRateLimited) {
        return res
          .status(429)
          .json({ message: `Your IP has been rate limited.` })
      }

      const openai = new OpenAI({
        apiKey: process.env['OPENAI_API_KEY_TOOLS'],
      })

      const chatParams = getChatParams(type, {
        input,
        tone,
        targetLanguage,
        paragraphCount,
        brandName,
        industry,
        keywords,
        sloganCount,
        summaryType,
      })
      const chat_completion = await openai.chat.completions.create(chatParams)

      const responseData = chat_completion.choices[0].message.content

      const tokenUsage = chat_completion.usage.total_tokens
      console.log(`Token usage for this request: ${tokenUsage}`)

      await addPrompt(ip, type, {})
      return res.status(200).json(responseData)
    } else {
      return res.status(405).json({ message: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Unexpected error in text-prompter API:', error)
    return res.status(500).json({
      message: 'An unexpected error occurred. Please try again later.',
    })
  }
}
