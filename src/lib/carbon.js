const getCarbonCustomerID = (teamId, botId) => {
  return `${teamId}-${botId}`
}

export { getCarbonCustomerID }

//Carbon does not create our embeddings anymore, this is reference
export const getCarbonEmbeddings = (model) => {
  const modelMap = {
    'text-embedding-ada-002': 'OPENAI',
    'text-embedding-3-small': 'OPENAI_ADA_SMALL_512',
    'text-embedding-3-large': 'OPENAI_ADA_LARGE_1024',
    'embed-multilingual-v3.0': 'COHERE_MULTILINGUAL_V3',
  }

  return modelMap[model] || 'OPENAI' // Default to "OPENAI" if model is not found
}
