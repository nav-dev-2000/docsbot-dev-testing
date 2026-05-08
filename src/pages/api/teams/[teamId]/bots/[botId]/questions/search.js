/*
 API route to perform a vector search on questions for a specific bot.
 It uses OpenAI or Cohere embeddings based on the bot's configuration
 and Firestore's vector search capability.
*/

import { configureFirebaseApp } from '@/config/firebase-server.config';
import { getBot, convertQuestionDocToData, getTeamWithEncryptedOpenAIKey } from '@/lib/dbQueries';
import userTeamCheck from '@/lib/userTeamCheck';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import OpenAI from 'openai';
import { CohereClient} from 'cohere-ai';
import { decryptKey } from '@/lib/encryption';
import { canUserViewBot } from '@/utils/function.utils';

const cohereClient = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

// Models supported by Cohere for embeddings
const cohereModels = ['embed-v4.0', 'embed-multilingual-v3.0'];

//  Returns the vector dimensions for a given embedding model.
const getModelDimensions = (embeddingModel) => {
  const modelDimensions = {
    "embed-v4.0": 1024,
    "text-embedding-3-small": 512,
    "text-embedding-3-large": 1024,
    "embed-multilingual-v3.0": 1024, // This is the default model for Cohere its always 1024 dimensions
    "text-embedding-ada-002": null, // This is the default model for OpenAI its always 1536 dimensions and is not configurable
  };
  return modelDimensions[embeddingModel] ?? null;
};

// Generates an embedding vector for a given input text using the specified model and provider.
async function getEmbeddings({ input, model, provider = 'openai', encryptedOpenAIKey = null }) {
  const dimension = getModelDimensions(model);
  if (provider === 'openai') {
    // Create OpenAI client with team's key if available, otherwise use default
    let apiKey = process.env.OPENAI_API_KEY;
    if (encryptedOpenAIKey) {
      try {
        apiKey = decryptKey(encryptedOpenAIKey);
      } catch (error) {
        console.warn('Failed to decrypt team OpenAI key, using default:', error);
      }
    }
    
    const openaiClient = new OpenAI({ apiKey });
    
    const requestParams = {
      model,
      input,
    };
    // Only include dimensions parameter if it's specified (null means use default)
    if (dimension !== null) {
      requestParams.dimensions = dimension;
    }
    const response = await openaiClient.embeddings.create(requestParams);
    return response.data[0].embedding;
  } else if (provider === 'cohere') {
    const response = await cohereClient.v2.embed({
      model,
      texts: [input],
      inputType: 'search_query',
      embeddingTypes: ['float'],
      outputDimension: dimension,
    });
    return response.embeddings.float[0];
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }
}

// Main request handler for searching questions via vector similarity.
async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  configureFirebaseApp();
  const firestore = getFirestore();

  // 1. Verify user access to the team
  let check = null;
  try {
    check = await userTeamCheck(req, res);
  } catch (error) {
    return res.status(403).json({
      success: false,
      data: null,
      message: "User does not have access to team",
      error: error?.message || null
    });
  }
  const { userId, team } = check;
  const { teamId, botId } = req.query;
  const {
    query,
    topK,
    page = 0,
    perPage = 50,
    startDate,
    endDate,
  } = req.body;

  if (!query) {
    return res.status(400).json({
      success: false,
      data: null,
      message: "Query is required",
    });
  }

  try {
    // 2. Fetch bot configuration to determine embedding model
    const bot = await getBot(teamId, botId);
    if (!bot) {
      return res.status(404).json({
        success: false,
        data: null,
        errorMessage: "botId doesn't exist",
      });
    }

    // 4. Check per-bot permission to view bot
    if (!canUserViewBot(team, bot, userId)) {
      return res.status(403).json({
        success: false,
        data: null,
        message: "You are not allowed to view questions in this bot",
        error: null
      });
    }

    const embeddingModel = bot?.embeddingModel || 'text-embedding-ada-002';
    
    // 5. Convert search query into an embedding vector
    const teamSecrets = await getTeamWithEncryptedOpenAIKey(team.id);

    const queryEmbeddingVector = await getEmbeddings({
      input: query,
      model: embeddingModel,
      provider: cohereModels.includes(embeddingModel) ? 'cohere' : 'openai',
      encryptedOpenAIKey: teamSecrets?.openAIKey || null,
    });
    
    // 6. Determine the Firestore vector field based on dimensions
    const dimension = getModelDimensions(embeddingModel) ?? 1536;
    const vectorField = `vector_${dimension}`;
    
    const questionsCollection = firestore.collection(
      `teams/${teamId}/bots/${botId}/questions`
    );
    
    // 7. Query Firestore for the nearest vectors (COSINE similarity)
    const safePage = Number.isFinite(Number(page)) ? Number(page) : 0;
    const safePerPage = Number.isFinite(Number(perPage)) ? Number(perPage) : 50;
    const paginationLimit = Math.max(safePerPage * (safePage + 1), safePerPage);
    const limit = Math.min(
      Math.max(paginationLimit, Number(topK) || 0),
      200,
    ); // Let's limit total search results to 200 for performance
    const nearestQuestions = await questionsCollection
    .select('question', 'answer', 'rating', 'escalation', 'createdAt', 'ip', 'couldAnswer', 'sources', 'metadata', 'deleted')
    .findNearest(
      vectorField,
      FieldValue.vector(queryEmbeddingVector),
      {
        limit: limit,
        distanceMeasure: 'COSINE',
      }
    )

    const snapshot = await nearestQuestions.get();

    // 8. Format and paginate the results
    const allResults = snapshot?.docs?.map((doc) => {
      return convertQuestionDocToData(doc.id, doc.data());
    }) || [];

    const rangeStart = startDate ? new Date(startDate) : null;
    const rangeEnd = endDate ? new Date(endDate) : null;
    const filteredResults = allResults.filter((result) => {
      if (!rangeStart && !rangeEnd) {
        return true;
      }
      const createdAt = new Date(result.createdAt);
      if (Number.isNaN(createdAt.getTime())) {
        return false;
      }
      if (rangeStart && createdAt < rangeStart) {
        return false;
      }
      if (rangeEnd && createdAt > rangeEnd) {
        return false;
      }
      return true;
    });

    const start = safePage * safePerPage;
    const results = filteredResults.slice(start, start + safePerPage);

    return res.status(200).json({
      success: true,
      questions: results,
      pagination: {
        perPage: safePerPage,
        page: safePage,
        viewableCount: filteredResults.length,
        totalCount: filteredResults.length,
        hasMorePages: start + safePerPage < filteredResults.length,
        planLimit: 1000,
      },
      message: "Questions searched successfully",
      error: null,
    });
  } catch (error) {
    console.error("Error in question search:", error);
    return res.status(500).json({
      success: false,
      data: null,
      message: "Failed to search questions",
      error: error?.message || null,
    });
  }
}

export default handler;
