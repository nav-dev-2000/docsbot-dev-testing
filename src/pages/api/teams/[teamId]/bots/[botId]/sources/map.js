import { NextApiRequest, NextApiResponse } from 'next'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserModifySources } from '@/utils/function.utils'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getCacheEntry, setCacheEntry } from '@/utils/cache.utils'

// Blocked domains - popular consumer sites that aren't business websites
const BLOCKED_DOMAINS = [
  'google.com',
  'youtube.com',
  'facebook.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'linkedin.com',
  'reddit.com',
  'pinterest.com',
  'snapchat.com',
  'whatsapp.com',
  'telegram.org',
  'discord.com',
  'twitch.tv',
  'netflix.com',
  'amazon.com',
  'ebay.com',
  'wikipedia.org',
  'github.com',
  'stackoverflow.com',
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'aol.com',
  'msn.com',
  'live.com',
]

/**
 * Validates that a URL is safe for server-side requests and appropriate for business use
 * Blocks: IP addresses, localhost, private networks, consumer sites, and improperly formatted domains
 */
const isBusinessUrlValid = (urlString) => {
  try {
    const url = new URL(urlString)
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed.' }
    }
    
    const hostname = url.hostname.toLowerCase()
    
    // Block URLs with username/password (e.g., https://user@domain.com or https://email@gmail.com)
    if (url.username || url.password) {
      return { valid: false, error: 'URLs with authentication credentials are not allowed.' }
    }
    
    // Block localhost and loopback addresses
    if (hostname === 'localhost' || 
        hostname === '0.0.0.0' ||
        hostname.match(/^127\.\d+\.\d+\.\d+$/)) {
      return { valid: false, error: 'Localhost URLs are not allowed.' }
    }
    
    // Block all IPv4 addresses (including public IPs)
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/
    if (hostname.match(ipv4Regex)) {
      return { valid: false, error: 'IP addresses are not allowed. Please use a domain name.' }
    }
    
    // Block IPv6 addresses
    if (hostname.includes(':') || hostname.match(/^\[[\da-f:]+\]$/i)) {
      return { valid: false, error: 'IP addresses are not allowed. Please use a domain name.' }
    }
    
    // Block private IP ranges (additional check)
    const ipMatch = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
    if (ipMatch) {
      const [, a, b, c, d] = ipMatch.map(Number)
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 169.254.0.0/16 (AWS metadata)
      if (a === 10 || 
          (a === 172 && b >= 16 && b <= 31) ||
          (a === 192 && b === 168) ||
          (a === 169 && b === 254)) {
        return { valid: false, error: 'Private network addresses are not allowed.' }
      }
    }
    
    // Require multi-segment domain (at least domain.tld)
    const domainParts = hostname.split('.')
    if (domainParts.length < 2 || domainParts.some(part => !part)) {
      return { valid: false, error: 'Invalid domain format. Please use a valid domain name.' }
    }
    
    // Block popular consumer domains
    for (const blockedDomain of BLOCKED_DOMAINS) {
      if (hostname === blockedDomain || hostname.endsWith(`.${blockedDomain}`)) {
        return { 
          valid: false, 
          error: `${blockedDomain} is not allowed. Please enter a website you own.` 
        }
      }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'Invalid URL format.' }
  }
}

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

  // Validate URL for security and business use
  const businessValidation = isBusinessUrlValid(url)
  if (!businessValidation.valid) {
    return res.status(400).json({ message: businessValidation.error })
  }

  const firecrawlApiKey = process.env.FIRECRAWL_API_KEY
  if (!firecrawlApiKey) {
    return res.status(500).json({ message: 'Firecrawl API key not configured' })
  }

  try {
    const cacheType = 'firecrawl-map'
    try {
      const cached = await getCacheEntry(cacheType, url, { includePath: true })
      if (cached?.data) {
        return res.status(200).json({
          success: true,
          ...cached.data,
        })
      }
    } catch (cacheError) {
      console.error('Failed to read map cache', cacheError)
    }

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
    
    const payload = {
      urls: processedUrls,
      totalCount: data.links.length,
    }

    try {
      await setCacheEntry(cacheType, url, payload, { includePath: true })
    } catch (cacheError) {
      console.error('Failed to write map cache', cacheError)
    }

    return res.status(200).json({
      success: true,
      ...payload,
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

