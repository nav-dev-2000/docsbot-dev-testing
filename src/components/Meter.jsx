import React from 'react'
import classNames from '@/utils/classNames'

const Meter = ({ 
  value, 
  max = 100, 
  min = 0, 
  label, 
  color = 'blue',
  size = 'md',
  showValue = true,
  showEmoji = true,
  showFullGradient = false,
  className = '',
  isSentiment = false,
  gradientType = 'satisfaction' // 'satisfaction' or 'sentiment'
}) => {
  // Normalize value to percentage
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  
  // Calculate angle for the needle to match the progress arc
  // In SVG coordinates: 0% should point left, 100% should point right
  // Adjust for SVG Y-axis going downward
  const angle = Math.PI + (percentage / 100) * Math.PI
  
  // Get emoji based on percentage value
  const getEmoji = (percentage) => {
    if (percentage >= 80) return '😄' // Very happy
    if (percentage >= 60) return '😊' // Happy
    if (percentage >= 40) return '😐' // Neutral
    if (percentage >= 20) return '😕' // Sad
    return '😞' // Very sad
  }
  
  // Color variants
  const colorClasses = {
    blue: '#3B82F6',
    green: '#59A14F', // Custom green
    yellow: '#EDC948', // Custom yellow
    red: '#E15759', // Custom red
    pink: '#EC4899',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    gray: '#6B7280'
  }
  
  // Get gradient color for sentiment
  const getSentimentColor = (percentage) => {
    if (gradientType === 'satisfaction') {
      if (percentage <= 30) {
        // Red to Yellow (0% to 30%)
        const ratio = percentage / 30
        return `rgb(${Math.round(225 + (237 - 225) * ratio)}, ${Math.round(87 + (201 - 87) * ratio)}, ${Math.round(89 + (72 - 89) * ratio)})`
      } else if (percentage <= 70) {
        // Yellow band (30% to 70%)
        return '#EDC948'
      } else {
        // Yellow to Green (70% to 100%)
        const ratio = (percentage - 70) / 30
        return `rgb(${Math.round(237 - (237 - 89) * ratio)}, ${Math.round(201 - (201 - 161) * ratio)}, ${Math.round(72 + (79 - 72) * ratio)})`
      }
    } else {
      // Smooth red-yellow-green gradient for sentiment
      if (percentage <= 50) {
        // Red to Yellow (0% to 50%)
        const ratio = percentage / 50
        return `rgb(${Math.round(225 + (237 - 225) * ratio)}, ${Math.round(87 + (201 - 87) * ratio)}, ${Math.round(89 + (72 - 89) * ratio)})`
      } else {
        // Yellow to Green (50% to 100%)
        const ratio = (percentage - 50) / 50
        return `rgb(${Math.round(237 - (237 - 89) * ratio)}, ${Math.round(201 - (201 - 161) * ratio)}, ${Math.round(72 + (79 - 72) * ratio)})`
      }
    }
  }
  
  // Size variants
  const sizeClasses = {
    sm: { size: 80, strokeWidth: 6, emojiSize: '1.5rem', needleLength: 25 },
    md: { size: 100, strokeWidth: 8, emojiSize: '2rem', needleLength: 30 },
    lg: { size: 120, strokeWidth: 10, emojiSize: '2.5rem', needleLength: 35 }
  }
  
  const { size: dialSize, strokeWidth, emojiSize, needleLength } = sizeClasses[size]
  const radius = (dialSize - strokeWidth) / 2
  const circumference = Math.PI * radius // Half circle
  const strokeDasharray = circumference
  const strokeDashoffset = showFullGradient ? 0 : circumference - (percentage / 100) * circumference
  
  // Determine stroke color
  const strokeColor = isSentiment ? getSentimentColor(percentage) : colorClasses[color]
  
  return (
    <div className={classNames('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: dialSize, height: dialSize / 2 + 20 }}>
        {/* Background arc */}
        <svg
          width={dialSize}
          height={dialSize / 2 + 20}
          className="transform rotate-0"
        >
          {/* Gradient definition for sentiment */}
          {isSentiment && (
            <defs>
              {gradientType === 'satisfaction' ? (
                <linearGradient id="satisfactionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E15759" /> {/* Red */}
                  <stop offset="30%" stopColor="#EDC948" /> {/* Yellow start */}
                  <stop offset="70%" stopColor="#EDC948" /> {/* Yellow end */}
                  <stop offset="100%" stopColor="#59A14F" /> {/* Green */}
                </linearGradient>
              ) : (
                <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E15759" /> {/* Red */}
                  <stop offset="50%" stopColor="#EDC948" /> {/* Yellow */}
                  <stop offset="100%" stopColor="#59A14F" /> {/* Green */}
                </linearGradient>
              )}
            </defs>
          )}
          
          {/* Background track */}
          <path
            d={`M ${strokeWidth/2} ${dialSize/2} A ${radius} ${radius} 0 0 1 ${dialSize - strokeWidth/2} ${dialSize/2}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          
          {/* Progress arc */}
          <path
            d={`M ${strokeWidth/2} ${dialSize/2} A ${radius} ${radius} 0 0 1 ${dialSize - strokeWidth/2} ${dialSize/2}`}
            fill="none"
            stroke={isSentiment ? `url(#${gradientType === 'satisfaction' ? 'satisfactionGradient' : 'sentimentGradient'})` : strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={showFullGradient ? 'none' : strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
          
          {/* Needle (show when not showing emoji OR when showing full gradient) */}
          {(!showEmoji || showFullGradient) && (
            <>
              {/* Center dot */}
              <circle
                cx={dialSize / 2}
                cy={dialSize / 2}
                r="4"
                fill={isSentiment ? getSentimentColor(percentage) : strokeColor}
              />
              
              {/* Needle */}
              <line
                x1={dialSize / 2}
                y1={dialSize / 2}
                x2={dialSize / 2 + Math.cos(angle) * needleLength}
                y2={dialSize / 2 + Math.sin(angle) * needleLength}
                stroke={isSentiment ? getSentimentColor(percentage) : strokeColor}
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </>
          )}
        </svg>
        
        {/* Centered Emoji (only when showEmoji is true AND not showing full gradient) */}
        {showEmoji && !showFullGradient && (
          <div 
            className="absolute flex items-center justify-center transition-all duration-300 ease-out"
            style={{ 
              top: '60%', 
              left: '50%', 
              transform: 'translate(-50%, -50%)',
              fontSize: emojiSize
            }}
          >
            {getEmoji(percentage)}
          </div>
        )}
        
        {/* Value display */}
        {showValue && (
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
            <span className="text-sm font-medium text-gray-700">
              {value}
              {!isSentiment && max === 100 && '%'}
            </span>
          </div>
        )}
      </div>
      
      {/* Label */}
      {label && (
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
      )}
    </div>
  )
}

export default Meter 