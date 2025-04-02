const TRUTO_BASE_URL = 'https://api.truto.one'
const fs = require('fs')

const GetEnvValue = (key, env = 'staging') => {
  try {
    const envFile = env === 'production' ? 
      require('fs').readFileSync('.env.prod.local', 'utf8') :
      require('fs').readFileSync('.env.local', 'utf8');
    
    const match = envFile.match(new RegExp(`${key}=(.+)`));
    if (match && match[1]) {
      // Remove surrounding quotes if present
      return match[1].replace(/^['"]|['"]$/g, '');
    }
  } catch (error) {
    console.error(`Error reading ${key}:`, error.message);
  }
  return null;
}

const GetAuth = (env = 'staging') => {
  const apiKey = GetEnvValue('TRUTO_API_KEY', env);
  if (!apiKey) {
    throw new Error(`No TRUTO_API_KEY found in ${env} environment`);
  }
  return `Bearer ${apiKey}`;
}

// returns sync job id of the created sync job
const CreateSyncJob = async (syncJobConfig, env = 'staging') => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth(env)
    },
    body: JSON.stringify(syncJobConfig)
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data.id
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to create sync job')
}

// returns sync job id of the deleted sync job
const DeleteSyncJob = async (sync_job_id, env = 'staging') => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job/${sync_job_id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth(env)
    }
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data.id
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to delete sync job')
}

const CreateWebHook = async (target_url, env = 'staging') => {
  const resp = await fetch(`${TRUTO_BASE_URL}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth(env)
    },
    body: JSON.stringify({
      target_url: target_url
    })
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to create webhook')
}

async function createTrutoSyncJob(type, configPath, env = 'staging') {
    const syncJobConfig = JSON.parse(fs.readFileSync(configPath))
    // Add the integration type to the config
    syncJobConfig.integration_name = type
    syncJobConfig.label = `Fetch all the pages from ${type}`
    
    const jobId = await CreateSyncJob(syncJobConfig, env)
    console.log('trutoSyncJob:', `"${jobId}"`, `(${env})`)
}

async function createWeb(hookUrl) {
  const webHook = await CreateWebHook(hookUrl)
  console.log('webHook id:', webHook.id, 'secret:', webHook.secret)
}

const UpdateSyncJob = async (sync_job_id, syncJobConfig, env = 'staging') => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job/${sync_job_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth(env)
    },
    body: JSON.stringify(syncJobConfig)
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data.id
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to update sync job')
}

const GetSyncJobId = (type, env = 'staging') => {
  try {
    const syncJobs = GetEnvValue('TRUTO_SYNC_JOBS', env);
    if (syncJobs) {
      const syncJobsObj = JSON.parse(syncJobs);
      return syncJobsObj[type];
    }
  } catch (error) {
    console.error('Error reading sync job ID:', error.message);
  }
  return null;
}

async function updateTrutoSyncJob(type, configPath, env = 'staging') {
  const syncJobConfig = JSON.parse(fs.readFileSync(configPath));
  // Get sync job ID from env file instead of config
  const syncJobId = GetSyncJobId(type, env);
  if (!syncJobId) {
    throw new Error(`No sync job ID found for type ${type} in ${env} environment`);
  }
  
  syncJobConfig.id = syncJobId;
  const jobId = await UpdateSyncJob(syncJobId, syncJobConfig, env);
  console.log('Updated trutoSyncJob:', `"${jobId}"`, `(${env})`);
}

const GetSyncJob = async (sync_job_id, env = 'staging') => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job/${sync_job_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth(env)
    }
  })

  if (resp.ok) {
    return await resp.json()
  } else {
    console.error(await resp.json())
    throw new Error('Failed to get sync job')
  }
}

async function getSyncJobDetails(type, configPath, env = 'staging') {
  const syncJobId = GetSyncJobId(type, env);
  if (!syncJobId) {
    throw new Error(`No sync job ID found for type ${type} in ${env} environment`);
  }
  
  const jobDetails = await GetSyncJob(syncJobId, env);
  console.log('Sync Job Details:');
  console.log(JSON.stringify(jobDetails, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node createTruto.js <type> <action> [environment]');
    console.error('Example: node createTruto.js notion create');
    console.error('Example: node createTruto.js confluence update production');
    console.error('Example: node createTruto.js notion get staging');
    process.exit(1);
  }

  const [type, action, env = 'staging'] = args;
  const configPath = `truto/${type}-sync.json`;
  
  // Force production environment if prod is specified
  if (env === 'prod') {
    env = 'production';
  }

  if (env !== 'staging' && env !== 'production') {
    console.error('Environment must be either "staging" or "production"');
    process.exit(1);
  }

  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    switch (action) {
      case 'create':
        await createTrutoSyncJob(type, configPath, env);
        break;
      case 'update':
        await updateTrutoSyncJob(type, configPath, env);
        break;
      case 'get':
        await getSyncJobDetails(type, configPath, env);
        break;
      default:
        console.error('Invalid action. Use "create", "update", or "get"');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

// Comment out or remove the previous direct function calls
// DeleteSyncJob('d7333ef0-3a25-434c-8059-0596e92b28ce')
// createTrutoSyncJob('notion')
// createWeb('https://cccc-2600-1702-5b21-26d0-00-b.ngrok-free.app/api/truto-webhook')

module.exports = {
  createTrutoSyncJob,
  updateTrutoSyncJob,
  CreateWebHook,
  DeleteSyncJob,
  GetSyncJob
};