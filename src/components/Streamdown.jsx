import { Streamdown as BaseStreamdown, defaultRemarkPlugins } from 'streamdown'
import StreamdownMermaidError from '@/components/StreamdownMermaidError'
import { useEffect } from 'react'

const Streamdown = ({ mermaid, showMermaidActions, ...props }) => {
  const ErrorComponent = ({ chart, error }) => (
    <StreamdownMermaidError chart={chart} error={error} showActions={showMermaidActions} />
  )
  
  // Helper to deep merge config objects, preserving user preferences
  const deepMergeConfig = (defaults, user) => {
    if (!user) return defaults
    const merged = { ...defaults }
    
    for (const key in user) {
      if (user[key] && typeof user[key] === 'object' && !Array.isArray(user[key]) && defaults[key] && typeof defaults[key] === 'object') {
        // Deep merge nested objects
        merged[key] = deepMergeConfig(defaults[key], user[key])
      } else {
        // User preference takes precedence
        merged[key] = user[key]
      }
    }
    
    return merged
  }
  
  // Minimal default config - only critical settings for PNG/SVG export
  // htmlLabels: false is essential for PNG export (prevents canvas taint issues)
  const defaultMermaidConfig = {
    flowchart: {
      htmlLabels: false, // Critical for PNG export compatibility
    },
  }
  
  // Merge user config with defaults, ensuring user preferences take precedence
  const mergedConfig = deepMergeConfig(
    defaultMermaidConfig,
    mermaid?.config
  )
  
  const mergedMermaid = { 
    ...(mermaid ?? {}), 
    errorComponent: ErrorComponent,
    config: mergedConfig,
  }

  // Add comprehensive debugging and error handling for Mermaid download issues
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Intercept clicks on download buttons to add debugging
    const handleClick = async (event) => {
      const target = event.target
      // Check if this is a download button in a mermaid block
      const mermaidBlock = target.closest('[data-streamdown="mermaid-block"]')
      if (!mermaidBlock) return

      // Check if clicking on SVG/PNG/MMD options in the dropdown
      const buttonText = target.textContent?.trim()
      if (buttonText === 'SVG' || buttonText === 'PNG' || buttonText === 'MMD') {
        console.log('[Streamdown Mermaid] Download button clicked:', buttonText)
        
        // Find the actual diagram SVG (not the button icons)
        // The diagram SVG should be larger and contain the actual diagram content
        const allSvgs = mermaidBlock.querySelectorAll('svg')
        let diagramSvg = null
        
        // Find the largest SVG or the one with role="img" (the actual diagram)
        for (const svg of allSvgs) {
          const width = svg.getAttribute('width')
          const height = svg.getAttribute('height')
          const role = svg.getAttribute('role')
          const ariaLabel = svg.getAttribute('aria-label')
          
          // Skip small icon SVGs (16x16 or similar)
          if (width && height) {
            const w = parseInt(width)
            const h = parseInt(height)
            if (w > 100 && h > 100) {
              diagramSvg = svg
              break
            }
          }
          
          // Or check for role="img" which indicates the diagram
          if (role === 'img' || ariaLabel?.includes('Mermaid') || ariaLabel?.includes('chart')) {
            diagramSvg = svg
            break
          }
        }
        
        // Fallback: find SVG that's not inside a button
        if (!diagramSvg) {
          for (const svg of allSvgs) {
            if (!svg.closest('button')) {
              diagramSvg = svg
              break
            }
          }
        }
        
        if (diagramSvg) {
          console.log('[Streamdown Mermaid] Diagram SVG found:', {
            width: diagramSvg.getAttribute('width'),
            height: diagramSvg.getAttribute('height'),
            viewBox: diagramSvg.getAttribute('viewBox'),
            role: diagramSvg.getAttribute('role'),
            innerHTML: diagramSvg.innerHTML.substring(0, 100) + '...'
          })
        } else {
          console.warn('[Streamdown Mermaid] No diagram SVG found in DOM! Found', allSvgs.length, 'SVG elements total.')
        }

        // For SVG/PNG, check if we can access the rendered content
        if (buttonText === 'SVG' || buttonText === 'PNG') {
          const svgElement = diagramSvg
          
          if (svgElement && (buttonText === 'SVG' || buttonText === 'PNG')) {
            // Wait a moment to see if Streamdown's download function works
            setTimeout(async () => {
              // Check if a download link was created
              const downloadLinks = document.querySelectorAll('a[download]')
              console.log('[Streamdown Mermaid] Active download links after click:', downloadLinks.length)
              
              // If no download happened, try manual download as fallback
              if (downloadLinks.length === 0) {
                console.warn('[Streamdown Mermaid] No download triggered by Streamdown, attempting manual download...')
                
                try {
                  if (buttonText === 'SVG') {
                    // Manual SVG download
                    const svgContent = new XMLSerializer().serializeToString(svgElement)
                    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
                    const url = URL.createObjectURL(blob)
                    const link = document.createElement('a')
                    link.href = url
                    link.download = 'diagram.svg'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                    URL.revokeObjectURL(url)
                    console.log('[Streamdown Mermaid] Manual SVG download completed')
                  } else if (buttonText === 'PNG') {
                    // Manual PNG download via canvas
                    // Get dimensions from viewBox to avoid CORS issues
                    const viewBox = svgElement.getAttribute('viewBox')
                    let width = 0
                    let height = 0
                    
                    if (viewBox) {
                      const parts = viewBox.split(' ')
                      if (parts.length >= 4) {
                        width = parseFloat(parts[2])
                        height = parseFloat(parts[3])
                      }
                    }
                    
                    // Fallback to width/height attributes if viewBox not available
                    if (!width || !height) {
                      width = parseFloat(svgElement.getAttribute('width')) || 800
                      height = parseFloat(svgElement.getAttribute('height')) || 600
                    }
                    
                    // Use 2x resolution for better quality
                    const scale = 2
                    const canvas = document.createElement('canvas')
                    canvas.width = width * scale
                    canvas.height = height * scale
                    const ctx = canvas.getContext('2d')
                    
                    if (!ctx) {
                      console.error('[Streamdown Mermaid] Failed to get canvas context')
                      return
                    }
                    
                    // Fill white background
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                    
                    // Serialize SVG and create data URL directly (avoids CORS taint)
                    const svgContent = new XMLSerializer().serializeToString(svgElement)
                    // Create a data URL with the SVG content
                    const svgDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgContent)
                    
                    const img = new Image()
                    
                    img.onload = () => {
                      try {
                        // Draw the image to canvas
                        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
                        
                        // Export as PNG
                        canvas.toBlob((blob) => {
                          if (blob) {
                            const url = URL.createObjectURL(blob)
                            const link = document.createElement('a')
                            link.href = url
                            link.download = 'diagram.png'
                            document.body.appendChild(link)
                            link.click()
                            document.body.removeChild(link)
                            URL.revokeObjectURL(url)
                            console.log('[Streamdown Mermaid] Manual PNG download completed')
                          } else {
                            console.error('[Streamdown Mermaid] Failed to create PNG blob')
                          }
                        }, 'image/png')
                      } catch (error) {
                        console.error('[Streamdown Mermaid] Error drawing image to canvas:', error)
                      }
                    }
                    
                    img.onerror = (error) => {
                      console.error('[Streamdown Mermaid] Failed to load SVG for PNG conversion:', error)
                    }
                    
                    // Load the SVG as data URL (this avoids CORS taint)
                    img.src = svgDataUrl
                  }
                } catch (error) {
                  console.error('[Streamdown Mermaid] Manual download failed:', error)
                }
              }
            }, 300) // Wait 300ms to see if Streamdown handles it
          }
        }
      }
    }

    // Listen for unhandled promise rejections
    const handleUnhandledRejection = (event) => {
      const error = event.reason
      console.log('[Streamdown Mermaid] Unhandled rejection:', error)
      
      if (
        error &&
        (error.message?.includes('mermaid') ||
          error.message?.includes('SVG') ||
          error.message?.includes('PNG') ||
          error.message?.includes('canvas') ||
          error.message?.includes('download') ||
          error.message?.includes('Failed to load SVG image') ||
          error.message?.includes('Failed to create PNG blob') ||
          error.message?.includes('Failed to create 2D canvas context') ||
          error.message?.includes('SVG not found') ||
          error.message?.includes('CDN URL') ||
          error.message?.includes('requires a CDN'))
      ) {
        console.error('[Streamdown Mermaid] Download error detected:', error.message, error)
        if (error.message?.includes('PNG')) {
          console.warn('[Streamdown Mermaid] PNG export failed. This may be due to browser security restrictions or CORS issues. Try downloading as SVG instead.')
        }
        if (error.message?.includes('CDN')) {
          console.error('[Streamdown Mermaid] Mermaid CDN issue detected. Check cdnUrl prop.')
        }
      }
    }

    // Use capture phase to catch events early
    document.addEventListener('click', handleClick, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    // Also log all console errors
    const originalError = console.error
    console.error = (...args) => {
      const errorString = args.join(' ')
      if (errorString.includes('mermaid') || errorString.includes('download')) {
        console.log('[Streamdown Mermaid] Console error intercepted:', ...args)
      }
      originalError.apply(console, args)
    }

    return () => {
      document.removeEventListener('click', handleClick, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.error = originalError
    }
  }, [])

  return <BaseStreamdown {...props} mermaid={mergedMermaid} />
}

export { Streamdown, defaultRemarkPlugins }
