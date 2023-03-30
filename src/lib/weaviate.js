import weaviate from 'weaviate-client'

export const weaviateClient = weaviate.client({
  scheme: 'https',
  host: process.env.WEAVIATE_URL,
  authClientSecret: new weaviate.AuthUserPasswordCredentials({
    username: process.env.WEAVIATE_USERNAME,
    password: process.env.WEAVIATE_PASSWORD,
  }),
})

export const createSchema = (indexId) => {
  //create a weaviate schema for the bot
  return weaviateClient.schema
    .classCreator()
    .withClass({
      class: indexId,
      description: 'A text document chunk',
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'ada',
          modelVersion: '002',
          type: 'text',
          vectorizeClassName: false,
        },
      },
      properties: [
        {
          dataType: ['text'],
          description: 'The content of the paragraph',
          moduleConfig: {
            'text2vec-openai': {
              skip: false,
              vectorizePropertyName: false,
            },
          },
          name: 'content',
        },
        {
          dataType: ['string'],
          description: 'The json wrapped metadata of the document',
          moduleConfig: {
            'text2vec-openai': {
              skip: true,
              vectorizePropertyName: false,
            },
          },
          name: 'metadata',
        },
        {
          dataType: ['string'],
          description: 'Source Type',
          moduleConfig: {
            'text2vec-openai': {
              skip: true,
              vectorizePropertyName: false,
            },
          },
          tokenization: 'field',
          name: 'type',
        },
        {
          dataType: ['string'],
          description: 'Source Id',
          moduleConfig: {
            'text2vec-openai': {
              skip: true,
              vectorizePropertyName: false,
            },
          },
          tokenization: 'field',
          name: 'sourceId',
        },
      ],
    })
    .do()
}

export const getSchema = (indexId) => {
  //get a weaviate schema for the bot
  return weaviateClient.schema.classGetter().withClassName(indexId).do()
}

export const deleteSchema = (indexId) => {
  //delete a weaviate schema for the bot
  return weaviateClient.schema.classDeleter().withClassName(indexId).do()
}

export const deleteSource = async (indexId, sourceId) => {
  const data = await weaviateClient.graphql.get().withClassName(indexId).withFields('_additional { id }').withWhere({
    operator: 'Equal',
    path: ['sourceId'],
    valueString: sourceId,
  }).do()

  // these aren't awaited, so they're done asynchronously
  data.data.Get[indexId].forEach(async (data) => {
    const objectId = data["_additional"].id
    await weaviateClient.data.deleter().withClassName(indexId).withId(objectId).do()
  })
  
  const chunks = data.data.Get[indexId].length
  return chunks
}