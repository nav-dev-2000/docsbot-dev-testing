const TRUTO_BASE_URL = 'https://api.truto.one'
const fs = require('fs')

const GetAuth = () => {
  return `Bearer ${process.env.TRUTO_API_KEY}`
}

// returns sync job id of the created sync job
const CreateSyncJob = async (syncJobConfig) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth()
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
const DeleteSyncJob = async (sync_job_id) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job/${sync_job_id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth()
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

const CreateWebHook = async (target_url) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth()
    },
    body: JSON.stringify({
      target_url: target_url
    })
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data.id
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to create webhook')
}

async function createTrutoSyncJob(type, configPath) {
    const syncJobConfig = JSON.parse(fs.readFileSync(configPath))
    // Add the integration type to the config
    syncJobConfig.integration_name = type
    syncJobConfig.label = `Fetch all the pages from ${type}`
    
    const jobId = await CreateSyncJob(syncJobConfig)
    console.log('trutoSyncJob:', `"${jobId}"`)
}

async function createWeb(hookUrl) {
  const webHookID = await CreateWebHook(hookUrl)
  console.log('webHookID:', webHookID)
}

const UpdateSyncJob = async (sync_job_id, syncJobConfig) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job/${sync_job_id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': GetAuth()
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

async function updateTrutoSyncJob(sync_job_id, configPath) {
  const syncJobConfig = JSON.parse(fs.readFileSync(configPath))
  const jobId = await UpdateSyncJob(sync_job_id, syncJobConfig)
  console.log('Updated trutoSyncJob:', `"${jobId}"`)
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error('Usage: node createTruto.js <type> <action>');
    console.error('Example: node createTruto.js notion create');
    console.error('Example: node createTruto.js confluence update');
    process.exit(1);
  }

  const [type, action] = args;
  const configPath = `truto/${type}-sync.json`;

  try {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    switch (action) {
      case 'create':
        await createTrutoSyncJob(type, configPath);
        break;
      case 'update':
        await updateTrutoSyncJob(type, configPath);
        break;
      default:
        console.error('Invalid action. Use "create" or "update"');
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
// createWeb('https://25c1-194-195-89-112.ngrok-free.app/api/truto-webhook')

module.exports = {
  createTrutoSyncJob,
  updateTrutoSyncJob,
  CreateWebHook,
  DeleteSyncJob
};