import React, { useState } from 'react'
import { SoftwareAppJsonLd } from 'next-seo'
import { StarIcon } from '@heroicons/react/24/solid'

// New shared function to calculate rating count
const calculateRatingCount = (base = 1000) => {
  const today = new Date()
  const seed =
    today.getFullYear() * 100 + (today.getMonth() + 1) * 10 + today.getDate()
  return base + (seed % 100000)
}

// Updated StarRating component
export const StarRating = ({ base, ...props }) => {
  const [rating, setRating] = useState(5)
  const [ratingCount, setRatingCount] = useState(calculateRatingCount(base))

  const handleStarClick = (newRating) => {
    setRating(newRating)
    setRatingCount((prevCount) => {
      if (prevCount === calculateRatingCount(base)) {
        return prevCount + 1
      }
      return prevCount
    })
  }

  return (
    <div {...props}>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium">Rate this tool:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-6 w-6 cursor-pointer ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            onClick={() => handleStarClick(star)}
          />
        ))}
        <span className="text-sm font-medium">
          4.9 ({ratingCount} votes)
        </span>
      </div>
    </div>
  )
}

export const RatingSchema = ({ name, base }) => {
  const ratingCount = calculateRatingCount(base)

  return (
    <SoftwareAppJsonLd
      name={name}
      price="0"
      priceCurrency="USD"
      aggregateRating={{
        ratingValue: '4.9',
        reviewCount: ratingCount.toString(),
      }}
      operatingSystem="Any"
      applicationCategory="WebApplication"
    />
  )
}
