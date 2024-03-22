import weaviate, { ApiKey } from 'weaviate-ts-client'

const weaviateClient = (indexId) => {
  try {
    let args = {}
    if (indexId === 'TenantDocument') {
      args = {
        scheme: 'https',
        host: process.env.WEAVIATE_URL_TENANT,
        apiKey: new ApiKey(process.env.WEAVIATE_API_KEY_TENANT)
      }
    } else {
      args = {
        scheme: 'https',
        host: process.env.WEAVIATE_URL,
        apiKey: new ApiKey(process.env.WEAVIATE_API_KEY)
      }
    }
    return weaviate.client(args)
  } catch (e) {
    console.warn('Error creating weaviate client', e)
  }
}

export const getSchema = (indexId) => {
  //get a weaviate schema for the bot
  return weaviateClient().schema.classGetter().withClassName(indexId).do()
}

export const deleteSchema = (indexId) => {
  //delete a weaviate schema for the bot
  return weaviateClient().schema.classDeleter().withClassName(indexId).do()
}

export const createTenant = (botId) => {
  return weaviateClient('TenantDocument').schema.tenantsCreator('TenantDocument', [{ name: botId }]).do()
}

export const deleteTenant = (botId) => {
  return weaviateClient('TenantDocument').schema.tenantsDeleter('TenantDocument', [botId]).do()
}