import { useMemo } from 'react'
import RobotIcon from '@/components/RobotIcon'
import { decideTextColor } from '@/utils/colors'

/**
 * Determines if a hex color is light or dark based on relative luminance
 */
const isColorLight = (hexColor) => {
  if (!hexColor) return false
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5
}

/**
 * Darkens a hex color by a given percentage
 * @param {string} hexColor - The hex color to darken
 * @param {number} percent - Percentage to darken (0-1)
 * @returns {string} - Darkened hex color
 */
const darkenColor = (hexColor, percent = 0.6) => {
  if (!hexColor) return '#222222'
  const hex = hexColor.replace('#', '')
  let r = parseInt(hex.substr(0, 2), 16)
  let g = parseInt(hex.substr(2, 2), 16)
  let b = parseInt(hex.substr(4, 2), 16)
  
  // Darken each channel
  r = Math.round(r * (1 - percent))
  g = Math.round(g * (1 - percent))
  b = Math.round(b * (1 - percent))
  
  // Convert back to hex
  const toHex = (n) => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Selects the best icon from bot.brandAnalysis.logos based on background color contrast
 * @param {Array} logos - Array of logo objects from brand.dev API
 * @param {string} backgroundColor - Hex color of the background
 * @returns {Object|null} - Object with url and mode, or null
 */
const selectBestIcon = (logos, backgroundColor) => {
  if (!logos || logos.length === 0) return null
  
  // Filter for icon type logos only
  const iconLogos = logos.filter(logo => logo.type === 'icon')
  if (iconLogos.length === 0) return null
  
  const isLight = isColorLight(backgroundColor)
  
  // Try to find an icon that matches the color mode for optimal contrast
  if (!isLight) {
    // For dark backgrounds, prefer dark mode icons
    const darkIcon = iconLogos.find(logo => logo.mode === 'dark')
    if (darkIcon) return { url: darkIcon.url, mode: darkIcon.mode }
  } else {
    // For light backgrounds, prefer light mode icons
    const lightIcon = iconLogos.find(logo => logo.mode === 'light')
    if (lightIcon) return { url: lightIcon.url, mode: lightIcon.mode }
  }
  
  // Fallback to icon with opaque background (works on any color)
  const opaqueIcon = iconLogos.find(logo => logo.mode === 'has_opaque_background')
  if (opaqueIcon) return { url: opaqueIcon.url, mode: opaqueIcon.mode }
  
  // Final fallback to first available icon
  const firstIcon = iconLogos[0]
  return firstIcon ? { url: firstIcon.url, mode: firstIcon.mode } : null
}

/**
 * BotIconDisplay - Reusable component for displaying bot icons with intelligent logo selection
 * @param {Object} bot - The bot object containing color and brandAnalysis data
 * @param {string} size - Size variant: 'small' (h-6 w-6), 'medium' (h-8 w-8), 'large' (h-10 w-10)
 * @param {string} className - Additional classes for the container span
 */
export default function BotIconDisplay({ bot, size = 'medium', className = '' }) {
  // Memoize the background color and icon selection for performance
  const { backgroundStyle, iconData, iconClassName, containerClassName, hasOpaqueBackground, iconColor } = useMemo(() => {
    const color = bot?.color && bot?.color.trim() ? bot?.color : '#0ea5e9'
    
    // Try to find an icon from brand data
    const logos = bot?.brandAnalysis?.logos
    const selectedIcon = logos && color ? selectBestIcon(logos, color) : null
    
    // Check if the selected icon has opaque background
    const isOpaque = selectedIcon?.mode === 'has_opaque_background'
    
    // Calculate icon color for RobotIcon based on background color
    let robotIconColor = '#fff'
    if (color) {
      try {
        robotIconColor = decideTextColor(color)
      } catch (error) {
        robotIconColor = '#fff'
      }
    }
    
    // Determine background style (not used if icon has opaque background)
    let bgStyle = {}
    if (!isOpaque && color) {
      if (selectedIcon) {
        // Icon exists, use solid gradient
        bgStyle = { background: `linear-gradient(to right, ${color}, ${color}dd)` }
      } else {
        // No icon, use a solid darker color (no transparency)
        const darkerColor = darkenColor(color, 0.2)
        bgStyle = { 
          background: `linear-gradient(135deg, ${color}, ${darkerColor} 80%)`
        }
      }
    }
    
    // Determine container size class
    let containerSizeClass = 'h-14 w-14 sm:h-16 sm:w-16' // medium (default)
    if (size === 'small') {
      containerSizeClass = 'h-12 w-12'
    } else if (size === 'large') {
      containerSizeClass = 'h-16 w-16'
    }
    
    // Determine icon size class
    let iconSizeClass = 'h-8 w-8 sm:h-10 sm:w-10' // medium (default)
    if (size === 'small') {
      iconSizeClass = 'h-6 w-6'
    } else if (size === 'large') {
      iconSizeClass = 'h-10 w-10'
    }
    
    // If opaque background, icon should fill the entire container
    const finalIconClass = isOpaque ? `${containerSizeClass} object-cover` : `${iconSizeClass} object-contain`
    
    return {
      backgroundStyle: bgStyle,
      iconData: selectedIcon,
      iconClassName: finalIconClass,
      containerClassName: containerSizeClass,
      hasOpaqueBackground: isOpaque,
      iconColor: robotIconColor,
    }
  }, [bot?.color, bot?.brandAnalysis?.logos, size])
  
  const color = bot?.color && bot?.color.trim() ? bot?.color : '#0ea5e9'
  const gradientClass = !hasOpaqueBackground && !color ? 'bg-gradient-to-r from-teal-600 to-cyan-700' : ''
  const paddingClass = !iconData || !hasOpaqueBackground ? 'p-3' : ''
  const sizeClass = hasOpaqueBackground ? containerClassName : (!iconData ? containerClassName : '')

  return (
    <span
      className={`inline-flex items-center justify-center rounded-md shadow-lg overflow-hidden ${gradientClass} ${paddingClass} ${sizeClass} ${className}`}
      style={!hasOpaqueBackground && color ? backgroundStyle : {}}
    >
      {iconData ? (
        <img
          src={iconData.url}
          alt={`${bot?.name || 'Bot'} icon`}
          className={iconClassName}
        />
      ) : (
        <RobotIcon
          className={iconClassName}
          style={{ color: iconColor }}
          aria-hidden="true"
        />
      )}
    </span>
  )
}

