import React, { useState } from 'react'
import { SoftwareAppJsonLd } from 'next-seo'
import { StarIcon } from '@heroicons/react/24/solid'

// Updated shared function to calculate rating count and rating value
const calculateRatingCount = (base = 1000) => {
  const today = new Date()
  const seed =
    today.getFullYear() * 100 + (today.getMonth() + 1) * 10 + today.getDate()
  const count = base + (seed % 100000)
  const secondDecimal = Math.max(1, Math.min(9, Math.floor((base / 5000) * 9) + 1))
  const ratingValue = `4.9${secondDecimal}`
  return { count, ratingValue }
}

// Updated StarRating component
export const StarRating = ({ base, ...props }) => {
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(calculateRatingCount(base).count)

  const handleStarClick = (newRating) => {
    setRating(newRating)
    setRatingCount((prevCount) => {
      if (prevCount === calculateRatingCount(base).count) {
        return prevCount + 1
      }
      return prevCount
    })
  }

  const handleStarHover = (star) => {
    setHoverRating(star)
  }

  const handleMouseLeave = () => {
    setHoverRating(0)
  }

  return (
    <div {...props}>
      <div className="flex items-center space-x-1">
        <span className="text-sm font-medium">Rate this tool:</span>
        {[1, 2, 3, 4, 5].map((star) => (
          <StarIcon
            key={star}
            className={`h-6 w-6 cursor-pointer ${
              star <= (hoverRating || Math.round(rating)) ? 'text-yellow-400' : 'text-gray-300'
            }`}
            onClick={() => handleStarClick(star)}
            onMouseEnter={() => handleStarHover(star)}
            onMouseLeave={handleMouseLeave}
          />
        ))}
        <span className="text-sm font-medium">
          {calculateRatingCount(base).ratingValue} ({ratingCount} votes)
        </span>
      </div>
    </div>
  )
}

export const RatingSchema = ({ name, base }) => {
  const { count: ratingCount, ratingValue } = calculateRatingCount(base)

  return (
    <SoftwareAppJsonLd
      name={name}
      price="0"
      priceCurrency="USD"
      aggregateRating={{
        ratingValue: ratingValue,
        reviewCount: ratingCount.toString(),
      }}
      operatingSystem="Any"
      applicationCategory="BrowserApplication"
    />
  )
}
