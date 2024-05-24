import weaviate, { ApiKey } from 'weaviate-ts-client'
import { decryptKey } from '@/lib/encryption'

const weaviateClient = (team) => {
  const isDedicated = team?.weaviateUrl && team?.weaviateApiKey
  try {
    let args = {}
    if (isDedicated) {
      args = {
        scheme: 'https',
        host: team?.weaviateUrl,
        apiKey: new ApiKey(decryptKey(team?.weaviateApiKey))
      }
    } else {
      args = {
        scheme: 'https',
        host: process.env.WEAVIATE_URL_TENANT,
        apiKey: new ApiKey(process.env.WEAVIATE_API_KEY_TENANT)
      }
    }
    return weaviate.client(args)
  } catch (e) {
    console.warn('Error creating weaviate client', e)
  }
}

export const createTenant = (team, botId) => {
  return weaviateClient(team).schema.tenantsCreator('TenantDocument', [{ name: botId }]).do()
}

export const deleteTenant = (team, botId) => {
  return weaviateClient(team).schema.tenantsDeleter('TenantDocument', [botId]).do()
}