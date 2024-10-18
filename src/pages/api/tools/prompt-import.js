import OpenAI from 'openai'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { addPrompt, getPrompt, checkPromptRateLimit } from '@/lib/tools'
import { PROMPT_CATEGORIES } from '@/constants/promptCategories.constants'

configureFirebaseApp()
const firestore = getFirestore()


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      // Check for the URL key in the request
      const urlKey = req.query.key;
      if (urlKey !== '6jkhfdi6sdfimba93') {
        return res.status(401).json({ error: 'Unauthorized: Invalid URL key' });
      }
/*
      // Function to fetch prompts where should_index is false from Firestore
      const fetchPrompts = async () => {
        const snapshot = await firestore.collection('prompts').get();
        const prompts = {}
        snapshot.forEach((doc) => {
          prompts[doc.id] = doc.data()
        });
        return prompts
      }

      // Fetch prompts missing should_index field
      const promptsToProcess = await fetchPrompts();
      
      

      // Save results locally as JSON
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(process.cwd(), 'prompts.json');
      fs.writeFileSync(resultsPath, JSON.stringify(promptsToProcess, null, 2));
      console.log(`Results saved to ${resultsPath}`);
*/
      const fs = require('fs');
      const path = require('path');
      const resultsPath = path.join(process.cwd(), 'prompts.json');
      const prompts = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
      for (const [id, prompt] of Object.entries(prompts)) {
        await addPrompt(prompt.ip, 'prompt', prompt, id)
      }

      return res.status(200).json(results)
    } catch (e) {
      console.error(e)
      return res
        .status(500)
        .json({ message: `Failed to process prompts: ${e}` })
    }
  } else if (req.method === 'GET') {
    const { slug } = req.query

    // Skip if slug is empty or just contains spaces
    if (!slug || slug.trim() === '') {
      return res.status(400).json({ message: "Invalid slug provided" })
    }

    // Check cache
    const cachedPrompt = await getPrompt(slug)
    if (cachedPrompt) {
      return res.status(200).json(cachedPrompt)
    } else {
      return res
        .status(404)
        .json({ message: `Prompt "${slug}" doesn't exist!` })
    }
  }

  res.setHeader('Allow', ['POST', 'GET'])
  return res.status(405).end(`Method ${req.method} Not Allowed`)
}

// Helper functions (move these outside the handler if not already)
const slugify = (str) => {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const checkSlugUniqueness = async (baseSlug) => {
  let uniqueSlug = baseSlug
  let counter = 1
  while (true) {
    const existingDoc = await firestore
      .collection('prompts')
      .doc(uniqueSlug)
      .get()
    if (!existingDoc.exists) {
      return uniqueSlug
    }
    uniqueSlug = `${baseSlug}-${counter}`
    counter++
  }
}
