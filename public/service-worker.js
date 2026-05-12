self.addEventListener('push', (event) => {
  const data = (() => {
    try {
      return event.data ? event.data.json() : {}
    } catch (error) {
      return {}
    }
  })()

  const title = data.title || 'DocsBot'
  const body = data.body || 'You have an update.'
  const tag = data.tag || 'docsbot-ai'
  const url = data.url || '/'

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      data: { url },
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const targetUrl = event.notification.data?.url || '/'
  
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Parse the target URL to get the path
        let targetPath = targetUrl
        try {
          // If targetUrl is absolute, parse it; if relative, make it absolute first
          const urlObj = targetUrl.startsWith('http') 
            ? new URL(targetUrl)
            : new URL(targetUrl, self.location.origin)
          targetPath = urlObj.pathname + urlObj.search
        } catch (e) {
          // If URL parsing fails, use the original URL
          targetPath = targetUrl
        }
        
        // Try to find an existing window with the same path
        for (const client of clientList) {
          try {
            const clientUrlObj = new URL(client.url)
            const clientPath = clientUrlObj.pathname + clientUrlObj.search
            
            if (clientPath === targetPath && 'focus' in client) {
              return client.focus()
            }
          } catch (e) {
            // Fallback: simple string matching
            if (client.url.includes(targetPath) && 'focus' in client) {
              return client.focus()
            }
          }
        }

        // Ensure we have an absolute URL
        let absoluteUrl = targetUrl
        if (!targetUrl.startsWith('http')) {
          absoluteUrl = new URL(targetUrl, self.location.origin).href
        }

        // Open the URL in a new window/tab
        // Note: clients.openWindow() must be called within the user gesture context
        // which notification clicks provide
        return clients.openWindow(absoluteUrl)
      })
      .catch((error) => {
        console.error('Error handling notification click:', error)
        // Fallback: try to open the URL anyway
        const absoluteUrl = targetUrl.startsWith('http') 
          ? targetUrl 
          : new URL(targetUrl, self.location.origin).href
        return clients.openWindow(absoluteUrl).catch(() => null)
      }),
  )
})
