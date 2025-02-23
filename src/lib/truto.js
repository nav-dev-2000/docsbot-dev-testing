const TRUTO_BASE_URL = 'https://api.truto.one'

const GetAuth = () => {
  return `Bearer ${process.env.TRUTO_API_KEY}`
}

const GetWebHookID = () => {
  return process.env.TRUTO_WEBHOOK_ID
}

const GetDatastoreID = () => {
  return process.env.TRUTO_DATASTORE_ID
}

const GetTenantId = (teamId, botId) => {
  return `${teamId}-${botId}`
}

// returns link token
const GetLinkToken = async (tenant_id) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/link-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GetAuth(),
    },
    body: JSON.stringify({
      tenant_id: tenant_id,
    }),
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.link_token) {
      return data.link_token
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to get link token')
}

const GetIntegratedAccountToken = async (integrated_account_id) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/integrated-account/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GetAuth(),
    },
    body: JSON.stringify({
      integrated_account_id: integrated_account_id,
    }),
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.integrated_account_token) {
      return data.integrated_account_token
    }
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to get integrated account token')
}

const GetIntegratedAccountByID = async (integrated_account_id) => {
  const resp = await fetch(
    `${TRUTO_BASE_URL}/integrated-account/${integrated_account_id}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: GetAuth(),
      },
    },
  )

  if (resp.ok) {
    const data = await resp.json()
    return data
  } else {
    console.error(await resp.json())
  }

  throw new Error('Failed to get integrated account')
}

// returns sync job run id
const RunSyncJob = async (
  sync_job_id,
  integrated_account_id,
  team_id,
  bot_id,
  source_id,
) => {
  const integratedAccount = await GetIntegratedAccountByID(integrated_account_id)
  //console.log('integration', integratedAccount)

  const args = {
    integrated_account_id: integrated_account_id,
    webhook_id: GetWebHookID(),
    google_cloud_storage_datastore_id: GetDatastoreID(),
    team_id,
    bot_id,
    source_id,
  }

  if (integratedAccount.integration.name === 'freshdesk') {
    const monthAgo = new Date(new Date().setMonth(new Date().getMonth() - (integratedAccount.context.months || 3)))
    args.start_date = monthAgo.toISOString().split('T')[0]
    args.base_url = `https://${integratedAccount.context.subdomain}.freshdesk.com/a/tickets/`
  }

  console.log('args', args)

  const resp = await fetch(`${TRUTO_BASE_URL}/sync-job-run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GetAuth(),
    },
    body: JSON.stringify({
      sync_job_id: sync_job_id,
      args,
    }),
  })

  if (resp.ok) {
    const data = await resp.json()
    if (data?.id) {
      return data.id
    }
  } else {
    const error = await resp.json()
    console.error(error)
    throw new Error(error.message)
  }
}

const DeleteIntegratedAccount = async (integrated_account_id) => {
  const resp = await fetch(
    `${TRUTO_BASE_URL}/integrated-account/${integrated_account_id}`,
    {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: GetAuth(),
      },
    },
  )

  if (resp.ok) {
    const data = await resp.json()
    return data.id
  } else {
    console.error(await resp.json())
    throw new Error('Failed to delete integrated account')
  }
}

const GetIntegratedAccountsByTenantID = async (tenant_id) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/integrated-account?tenant_id=${tenant_id}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GetAuth(),
    }
  })

  if (resp.ok) {
    const data = await resp.json()
    let { next_cursor, result } = data

    // let combinedResults = []
    // if (next_cursor) {
    //   combinedResults = combinedResults.concat(results)
    //   do {
    //     const resp = await fetch(`${TRUTO_BASE_URL}/integrated-account`, {
    //       method: 'GET',
    //       headers: {
    //         'Content-Type': 'application/json',
    //         Authorization: GetAuth(),
    //       },
    //       body: JSON.stringify({
    //         next_cursor: next_cursor,
    //         tenant_id: tenant_id,
    //       }),
    //     })
    //     const data = await resp.json()
    //     let { next_cursor, results } = data
    //     console.log('next_cursor', next_cursor)
    //     combinedResults = combinedResults.concat(results)
    //   } while (next_cursor)
    // }
    return result
  } else {
    console.error(await resp.json())
    throw new Error('Failed to get integrated accounts')
  }
};

const BulkDeleteIntegratedAccounts = async (teamId, botId) => {
  const resp = await fetch(`${TRUTO_BASE_URL}/integrated-account/bulk-delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: GetAuth(),
    },
    body: JSON.stringify({
      query: {
        tenant_id: GetTenantId(teamId, botId),
      },
    }),
  })

  if (resp.ok) {
    const data = await resp.json()
    return data.success
  } else {
    console.error(await resp.json())
    throw new Error('Failed to bulk delete integrated accounts')
  }
}

const GetTrutoSelected = async (integratedAccountId, sourceType) => {
  let trutoSelected = []
  try {
    if (sourceType === 'google_docs') {
      const { context } = await GetIntegratedAccountByID(integratedAccountId)
      if (context?.drive_items) {
        // Map to simplified structure with just name, icon and modified date
        trutoSelected = context.drive_items.map((item) => ({
          name: item.name,
          icon: item.iconUrl,
          modified: item.lastEditedUtc,
        }))
      }
    } else if (sourceType === 'confluence') {
      const { context } = await GetIntegratedAccountByID(integratedAccountId)
      if (context?.space_identifiers) {
        trutoSelected = context.space_identifiers.map((item) => ({
          name: item.label,
          icon: item.subText,
          modified: null,
        }))
      }
    } else if (sourceType === 'notion') {
      const pages = await ListKnowledgeBasePages(integratedAccountId, {
        pageType: 'page', // only pages, not databases currently supported
      })
      trutoSelected = pages.filter(item => item.title).map((item) => ({
        name: item.title,
        icon: null,
        modified: item.updated_at || item.created_at || item.published_at,
      }))
    }
  } catch (error) {
    console.error('Error getting Truto files:', error)
  }
  //console.log('trutoSelected', trutoSelected)
  return trutoSelected
}

const ListKnowledgeBasePages = async (integrated_account_id, options = {}) => {
  let allPages = []
  let nextCursor = null
  let pageCount = 0
  const PAGE_LIMIT = 5

  do {
    const queryParams = new URLSearchParams({
      integrated_account_id: integrated_account_id,
      truto_ignore_remote_data: 'true',
      ...(nextCursor && { next_cursor: nextCursor }),
      ...(options.pageType && { page_type: options.pageType }),
      ...(options.searchTerm && { search_term: options.searchTerm }),
      ...(options.status && { status: options.status }),
    })

    const resp = await fetch(
      `${TRUTO_BASE_URL}/unified/knowledge-base/pages?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: GetAuth(),
        },
      },
    )

    if (resp.ok) {
      const data = await resp.json()
      allPages = allPages.concat(data.result)
      nextCursor = data.next_cursor
      pageCount++
    } else {
      console.error(await resp.json())
      throw new Error('Failed to list knowledge base pages')
    }
  } while (nextCursor && !options.skipPagination && pageCount < PAGE_LIMIT)

  return allPages
}

const GetSyncJobID = (sourceType) => {
  try {
    const syncJobs = JSON.parse(process.env.TRUTO_SYNC_JOBS || '{}')
    return syncJobs[sourceType] || null
  } catch (error) {
    console.error('Error parsing TRUTO_SYNC_JOBS:', error)
    return null
  }
}

export {
  GetLinkToken,
  GetTenantId,
  GetIntegratedAccountToken,
  GetIntegratedAccountByID,
  GetIntegratedAccountsByTenantID,
  RunSyncJob,
  DeleteIntegratedAccount,
  BulkDeleteIntegratedAccounts,
  GetTrutoSelected,
  ListKnowledgeBasePages,
  GetSyncJobID,
}
