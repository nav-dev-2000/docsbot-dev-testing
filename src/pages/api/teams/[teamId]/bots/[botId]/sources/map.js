import { NextApiRequest, NextApiResponse } from 'next'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserModifySources } from '@/utils/function.utils'
import { configureFirebaseApp } from '@/config/firebase-server.config'

export default async function handler(req, res) {
  configureFirebaseApp()
  
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  // Check if user has access to the team
  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check

  if (!canUserModifySources(team, userId)) {
    return res.status(403).json({ message: 'You are not allowed to add sources in this bot.' })
  }

  const { url } = req.body

  if (!url) {
    return res.status(400).json({ message: 'URL is required' })
  }

  // Validate URL format
  try {
    new URL(url)
  } catch (error) {
    return res.status(400).json({ message: 'Invalid URL format' })
  }

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlApiKey) {
    return res.status(500).json({ message: 'Firecrawl API key not configured' })
  }

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url: url,
        limit: 10000, // Get up to 10000 URLs
        sitemap: 'include',
        includeSubdomains: false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return res.status(response.status).json({ 
        message: errorData.message || 'Failed to scan website' 
      })
    }

    const data = await response.json()
    
    if (!data.success || !data.links) {
      return res.status(500).json({ message: 'Failed to scan website' })
    }

    // Process and collapse URLs by path segments
    const processedUrls = processUrls(data.links, url)
    
    return res.status(200).json({
      success: true,
      urls: processedUrls,
      totalCount: data.links.length
    })

  } catch (error) {
    console.error('Firecrawl API error:', error)
    return res.status(500).json({ message: 'Failed to scan website' })
  }
}

function processUrls(links, baseUrl) {
  const baseUrlObj = new URL(baseUrl)
  
  // Filter and return clean URLs
  const filteredUrls = links
    .filter(link => {
      try {
        const linkUrl = new URL(link.url)
        const pathname = linkUrl.pathname.toLowerCase()

        if (pathname.endsWith('.xml')) {
          return false
        }

        if (pathname.includes('/category/') || pathname.includes('/tag/') || pathname.includes('/author/')) {
          return false
        }

        return true
      } catch (error) {
        return false
      }
    })
    .map(link => ({
      url: link.url,
      title: link.title || ''
    }))
  
  return filteredUrls
}

