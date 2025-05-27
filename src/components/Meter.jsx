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
  className = ''
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
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    pink: '#EC4899',
    purple: '#8B5CF6',
    cyan: '#06B6D4',
    gray: '#6B7280'
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
  const strokeDashoffset = circumference - (percentage / 100) * circumference
  
  return (
    <div className={classNames('flex flex-col items-center', className)}>
      <div className="relative" style={{ width: dialSize, height: dialSize / 2 + 20 }}>
        {/* Background arc */}
        <svg
          width={dialSize}
          height={dialSize / 2 + 20}
          className="transform rotate-0"
        >
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
            stroke={colorClasses[color]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-out"
          />
          
          {/* Needle (only when not showing emoji) */}
          {!showEmoji && (
            <>
              {/* Center dot */}
              <circle
                cx={dialSize / 2}
                cy={dialSize / 2}
                r="4"
                fill={colorClasses[color]}
              />
              
              {/* Needle */}
              <line
                x1={dialSize / 2}
                y1={dialSize / 2}
                x2={dialSize / 2 + Math.cos(angle) * needleLength}
                y2={dialSize / 2 + Math.sin(angle) * needleLength}
                stroke={colorClasses[color]}
                strokeWidth="3"
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            </>
          )}
        </svg>
        
        {/* Centered Emoji */}
        {showEmoji && (
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
              {typeof value === 'number' ? value.toFixed(1) : value}
              {max === 100 && '%'}
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