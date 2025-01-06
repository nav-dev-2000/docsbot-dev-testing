'use client'

import { useEffect, useState } from 'react'

export default function CarbonAd({ ...props }) {
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      // Create and inject the script into the ad container
      const script = document.createElement('script')
      script.type = 'text/javascript'
      script.src = 'https://cdn.carbonads.com/carbon.js?serve=CW7DLKJU&placement=docsbotai&format=cover'
      script.id = '_carbonads_js'
      script.async = true
      document.getElementById('carbon-container').appendChild(script)
      
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="" {...props}>
        <div id="carbon-container" className="w-[400px]">
          {loading && (
            <div className="border-2 rounded-md w-[400px] h-[245.65px]">
            <div className="flex animate-pulse flex-row items-center h-full justify-center space-x-5">
              <div className="w-12 bg-gray-300 h-12 rounded-full"></div>
              <div className="flex flex-col space-y-3">
                <div className="w-36 bg-gray-300 h-6 rounded-md"></div>
                <div className="w-24 bg-gray-300 h-6 rounded-md"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

