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
  //create a weaviate schema for the base
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
              skip: false,
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
              skip: false,
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
              skip: false,
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

export const deleteSchema = (indexId) => {
  //delete a weaviate schema for the base
  return weaviateClient.schema.classDeleter().withClassName(indexId).do()
}