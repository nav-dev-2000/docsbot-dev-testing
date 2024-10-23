import React, { useState } from 'react'
import { SoftwareAppJsonLd } from 'next-seo'
import { StarIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'

// Updated StarRating component
export const StarRating = ({
  itemId,
  name,
  starRatingData,
  ...props
}) => {
  const [averageRating, setAverageRating] = useState(starRatingData.rating)
  const [userRating, setUserRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(starRatingData.count)
  const [isLoading, setIsLoading] = useState(false)

  const handleStarClick = async (newRating) => {
    setIsLoading(true)
    // Immediately update the user's rating
    setUserRating(newRating)
    try {
      const response = await fetch('/api/tools/rate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemId, rating: newRating }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the average rating and count from the API response
        setAverageRating(data.rating)
        setRatingCount(data.count)
      } else {
        console.error('Failed to update rating')
      }
    } catch (error) {
      console.error('Error updating rating:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStarHover = (star) => {
    setHoverRating(star)
  }

  const handleMouseLeave = () => {
    setHoverRating(0)
  }

  return (
    <div {...props}>
      <SoftwareAppJsonLd
        name={name}
        price="0"
        priceCurrency="USD"
        aggregateRating={{
          ratingValue: averageRating,
          ratingCount: ratingCount,
        }}
        operatingSystem="Any"
        applicationCategory="BrowserApplication"
      />
      <div className="space-y-4">
        <div className="flex items-center space-x-1">
          <span className="text-sm font-medium">Rate this tool:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <StarIcon
              key={star}
              className={`h-6 w-6 cursor-pointer ${
                isLoading ? 'opacity-50' : ''
              } ${
                star <= (hoverRating || userRating || Math.round(averageRating))
                  ? 'text-yellow-400'
                  : 'text-gray-300'
              }`}
              onClick={() => !isLoading && handleStarClick(star)}
              onMouseEnter={() => handleStarHover(star)}
              onMouseLeave={handleMouseLeave}
            />
          ))}
          <span className="text-sm font-medium">
            {averageRating} ({ratingCount} votes)
          </span>
        </div>
        <div className="flex justify-center">
          <Link
            href="/affiliates"
            className="text-sm font-medium text-cyan-500 hover:underline"
          >
            💸 DocsBot affiliates earn up to $1500 per referral!
          </Link>
        </div>
      </div>
    </div>
  )
}