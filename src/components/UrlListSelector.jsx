import React, { useState, useEffect } from 'react'

const UrlListSelector = ({ urls, onSelectionChange, selectedUrls: selectedUrlsProp = [] }) => {
  const [selectedUrls, setSelectedUrls] = useState(selectedUrlsProp)
  const [processedUrls, setProcessedUrls] = useState([])
  const [expandedSubdirs, setExpandedSubdirs] = useState({})

  // Sync internal state with prop when it changes (e.g., when navigating back)
  useEffect(() => {
    setSelectedUrls(selectedUrlsProp)
  }, [selectedUrlsProp])

  // Process URLs into hierarchical structure
  useEffect(() => {
    if (!urls || urls.length === 0) {
      setProcessedUrls([])
      return
    }

    // First pass: collect all URLs and identify which segments have subdirectories
    const urlGroups = {}
    const rootUrls = [] // URLs at the root level (like /, /about, /contact)
    const segmentHasChildren = {} // Track which segments have deeper URLs
    
    urls.forEach(link => {
      try {
        const linkUrl = new URL(link.url)
        const pathname = linkUrl.pathname
        const pathSegments = pathname.split('/').filter(segment => segment.length > 0)
        
        if (pathSegments.length === 0 || pathname === '/') {
          // Root level URL
          rootUrls.push({
            url: link.url,
            title: link.title || '',
            pathname: pathname
          })
        } else if (pathSegments.length === 1) {
          // Single segment - could be top-level page or main section
          const segment = pathSegments[0]
          if (!urlGroups[segment]) {
            urlGroups[segment] = {
              segment: segment,
              urls: [],
              subdirectories: {},
              parentPages: []
            }
          }
          urlGroups[segment].parentPages.push({
            url: link.url,
            title: link.title || '',
            pathname: pathname
          })
        } else {
          // Multi-segment URL - mark the first segment as having children
          const mainSegment = pathSegments[0]
          segmentHasChildren[mainSegment] = true
          
          if (!urlGroups[mainSegment]) {
            urlGroups[mainSegment] = {
              segment: mainSegment,
              urls: [],
              subdirectories: {},
              parentPages: []
            }
          }

          // Build nested subdirectory structure
          let currentLevel = urlGroups[mainSegment]
          let fullPath = mainSegment

          for (let i = 1; i < pathSegments.length; i++) {
            const segment = pathSegments[i]
            fullPath = `${fullPath}/${segment}`

            if (!currentLevel.subdirectories[segment]) {
              currentLevel.subdirectories[segment] = {
                segment,
                fullPath,
                parentPath: currentLevel.fullPath || mainSegment,
                urls: [],
                subdirectories: {}
              }
            }

            if (i === pathSegments.length - 1) {
              currentLevel.subdirectories[segment].urls.push({
                url: link.url,
                title: link.title || '',
                pathname: pathname,
                pathSegments: pathSegments
              })
            }

            currentLevel = currentLevel.subdirectories[segment]
          }
        }
      } catch (error) {
        console.warn('Invalid URL:', link.url)
      }
    })
    
    // Second pass: handle segments that have both parent pages and subdirectories
    Object.keys(urlGroups).forEach(segment => {
      if (!segmentHasChildren[segment]) {
        // This segment has no children, move its pages to rootUrls
        urlGroups[segment].parentPages.forEach(page => {
          rootUrls.push(page)
        })
        delete urlGroups[segment]
      } else {
        // This segment has children - keep the parent pages separate from the directory
        // The parent pages will be shown as individual pages
        // The subdirectories will be shown as the directory contents
      }
    })

    // Convert to display structure
    const processed = []
    
    // Add root URLs first
    if (rootUrls.length > 0) {
      processed.push({
        type: 'root',
        label: 'Main',
        urls: rootUrls,
        expanded: true, // Open by default
        isDirectory: rootUrls.length > 1, // Only a directory if multiple URLs
        depth: 0
      })
    }
    
    // Add main segments
    Object.entries(urlGroups).forEach(([segment, groupData]) => {
      const totalUrls = groupData.parentPages.length + 
        Object.values(groupData.subdirectories).flat().length
      const hasSubdirectories = Object.keys(groupData.subdirectories).length > 0
      
      processed.push({
        type: 'main-segment',
        segment: segment,
        label: segment,
        urls: groupData.parentPages,
        subdirectories: groupData.subdirectories,
        totalUrls: totalUrls,
        expanded: false, // Closed by default
        isDirectory: hasSubdirectories, // Only a directory if it has subdirectories
        depth: 0
      })
    })
    
    setProcessedUrls(processed)
  }, [urls])

  // Handle URL selection
  const handleUrlToggle = (url) => {
    const newSelection = selectedUrls.includes(url)
      ? selectedUrls.filter(u => u !== url)
      : [...selectedUrls, url]
    
    setSelectedUrls(newSelection)
    onSelectionChange(newSelection)
  }

  // Helper to collect URLs recursively from a subdirectory node
  const collectUrlsFromNode = (node) => {
    if (!node) return []

    let urls = [...(node.urls || []).map(u => u.url)]
    Object.values(node.subdirectories || {}).forEach(child => {
      urls = [...urls, ...collectUrlsFromNode(child)]
    })
    return urls
  }

  // Handle category selection (select all URLs in category)
  const handleCategoryToggle = (categoryIndex, category) => {
    const categoryUrls = [
      ...category.urls.map(u => u.url),
      ...collectUrlsFromNode({ subdirectories: category.subdirectories })
    ]
    const allSelected = categoryUrls.every(url => selectedUrls.includes(url))
    
    let newSelection
    if (allSelected) {
      // Deselect all URLs in this category
      newSelection = selectedUrls.filter(url => !categoryUrls.includes(url))
    } else {
      // Select all URLs in this category
      newSelection = [...new Set([...selectedUrls, ...categoryUrls])]
    }
    
    setSelectedUrls(newSelection)
    onSelectionChange(newSelection)

    if (category.isDirectory) {
      setProcessedUrls(prev => prev.map((cat, idx) =>
        idx === categoryIndex ? { ...cat, expanded: false } : cat
      ))
    }
  }

  // Handle category expand/collapse
  const handleCategoryExpand = (categoryIndex) => {
    setProcessedUrls(prev => prev.map((cat, idx) => 
      idx === categoryIndex ? { ...cat, expanded: !cat.expanded } : cat
    ))
  }

  if (!urls || urls.length === 0) {
    return (
      <div className="text-center text-gray-500 py-4">
        No URLs found
      </div>
    )
  }

  const renderUrlItem = (urlItem, key, indentLevel = 0) => {
    const path = urlItem.pathname === '/' ? '/' : urlItem.pathname
    
    return (
      <div key={key} className="mb-1" style={{ marginLeft: `${indentLevel}px` }}>
        <div className="flex items-start">
          <input
            type="checkbox"
            id={`url-${key}`}
            checked={selectedUrls.includes(urlItem.url)}
            onChange={() => handleUrlToggle(urlItem.url)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <label
            htmlFor={`url-${key}`}
            className="ml-2 flex-1 cursor-pointer"
          >
            <div className="text-sm text-gray-900">
              {path}
            </div>
            {urlItem.title && urlItem.title !== urlItem.url && (
              <div className="text-xs text-gray-600 mt-1">
                {urlItem.title}
              </div>
            )}
          </label>
        </div>
      </div>
    )
  }

  const renderSubdirectory = (nodeKey, node, parentIndex, subIndex, depth = 1) => {
    const indentLevel = depth * 12 // reduced indent spacing
    const subdirectoryKey = `${parentIndex}-sub-${subIndex}`
    const urls = node.urls || []
    const childEntries = node.subdirectories
      ? Object.entries(node.subdirectories)
      : []

    // If it's a single URL and no children, show as individual item
    if (urls.length === 1 && childEntries.length === 0) {
      return (
        <div key={subdirectoryKey} className="mb-1" style={{ marginLeft: `${indentLevel}px` }}>
          {renderUrlItem(urls[0], `${subdirectoryKey}-0`, indentLevel + 12)}
        </div>
      )
    }

    const toggleUrls = collectUrlsFromNode(node)
    const allSelected = toggleUrls.every(url => selectedUrls.includes(url))
    const someSelected = toggleUrls.some(url => selectedUrls.includes(url)) && !allSelected
    const isExpanded = expandedSubdirs[subdirectoryKey] || false

    const handleToggle = () => {
      setExpandedSubdirs(prev => ({
        ...prev,
        [subdirectoryKey]: !prev[subdirectoryKey]
      }))
    }

    const handleSelect = () => {
      let newSelection
      if (allSelected) {
        newSelection = selectedUrls.filter(url => !toggleUrls.includes(url))
      } else {
        newSelection = [...new Set([...selectedUrls, ...toggleUrls])]
      }

      setSelectedUrls(newSelection)
      onSelectionChange(newSelection)
    }

    return (
      <div key={subdirectoryKey} className="mb-2" style={{ marginLeft: `${indentLevel}px` }}>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`subdirectory-${subdirectoryKey}`}
            checked={allSelected}
            ref={(input) => {
              if (input) input.indeterminate = someSelected
            }}
            onChange={handleSelect}
            className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
          />
          <button
            type="button"
            onClick={handleToggle}
            className="ml-2 flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <svg
              className={`mr-2 h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <label htmlFor={`subdirectory-${subdirectoryKey}`} className="cursor-pointer">
              {node.segment || nodeKey} ({toggleUrls.length} pages)
            </label>
          </button>
        </div>

        {isExpanded && (
          <div className="mt-2 ml-5 space-y-1">
            {urls.map((urlItem, urlIndex) =>
              renderUrlItem(urlItem, `${subdirectoryKey}-${urlIndex}`, indentLevel + 12)
            )}
            {childEntries.map(([childPath, childNode], childIndex) =>
              renderSubdirectory(
                childPath,
                childNode,
                `${parentIndex}-sub-${subIndex}`,
                childIndex,
                depth + 1
              )
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-md border border-gray-300 bg-gray-50 p-4">
      {processedUrls.map((category, categoryIndex) => {
        const isCollapsed = !category.expanded
        const subdirectoryEntries = category.subdirectories
          ? Object.entries(category.subdirectories)
          : []

        const collectUrls = node => {
          if (!node) return []
          let urls = [...(node.urls || []).map(u => u.url)]
          Object.values(node.subdirectories || {}).forEach(child => {
            urls = [...urls, ...collectUrls(child)]
          })
          return urls
        }

        const allUrlsInCategory = [
          ...category.urls.map(u => u.url),
          ...collectUrls({ subdirectories: category.subdirectories })
        ]
        const allSelected =
          allUrlsInCategory.length > 0 &&
          allUrlsInCategory.every(url => selectedUrls.includes(url))
        const someSelected =
          allUrlsInCategory.some(url => selectedUrls.includes(url)) &&
          !allSelected
        const totalUrls =
          category.totalUrls !== undefined
            ? category.totalUrls
            : allUrlsInCategory.length
        
        // If it's not a directory (single page), show it as individual checkboxes
        if (!category.isDirectory) {
          return (
            <div key={categoryIndex} className="mb-2">
              {category.urls.map((urlItem, urlIndex) => 
                renderUrlItem(urlItem, `${categoryIndex}-${urlIndex}`)
              )}
            </div>
          )
        }
        
        // Show as directory with expand/collapse
        return (
          <div key={categoryIndex} className="mb-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id={`category-${categoryIndex}`}
                checked={allSelected}
                ref={(input) => {
                  if (input) input.indeterminate = someSelected
                }}
                onChange={() => handleCategoryToggle(categoryIndex, category)}
                className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => handleCategoryExpand(categoryIndex)}
                className="ml-2 flex items-center text-sm font-medium text-gray-900 hover:text-gray-700"
              >
                <svg 
                  className={`mr-2 h-4 w-4 transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <label htmlFor={`category-${categoryIndex}`} className="cursor-pointer">
                  {category.label} ({totalUrls} pages)
                </label>
              </button>
            </div>
            
            {!isCollapsed && (
              <div className="mt-2 ml-6 space-y-2">
                {/* Show parent pages first as individual items */}
                {category.urls.map((urlItem, urlIndex) =>
                  renderUrlItem(urlItem, `${categoryIndex}-${urlIndex}`)
                )}

                {subdirectoryEntries.length > 0 && (
                  <div className="space-y-1">
                    {subdirectoryEntries.map(([key, node], subIndex) =>
                      renderSubdirectory(
                        key,
                        node,
                        categoryIndex,
                        subIndex
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default UrlListSelector