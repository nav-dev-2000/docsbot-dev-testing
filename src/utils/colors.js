function parseColorToRgb(color) {
  let r, g, b;
  if (color.startsWith('#')) {
    r = parseInt(color.slice(1, 3), 16);
    g = parseInt(color.slice(3, 5), 16);
    b = parseInt(color.slice(5, 7), 16);
  } else if (color.startsWith('rgb')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    r = parseInt(match[1]);
    g = parseInt(match[2]);
    b = parseInt(match[3]);
  } else {
    throw new Error('Unsupported color format');
  }
  return { r, g, b };
}

function getLuminance(r, g, b) {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function decideTextColor(color) {
  const { r, g, b } = parseColorToRgb(color);
  const luminance = getLuminance(r, g, b);

  // Return white for dark colors and a darker shade of the background color for light colors
  if (luminance > 0.6) {
    const darkerR = Math.floor(r * 0.4);
    const darkerG = Math.floor(g * 0.4);
    const darkerB = Math.floor(b * 0.4);
    return `rgb(${darkerR},${darkerG},${darkerB})`;
  } else {
    return '#fff';
  }
}

/**
 * Returns a color that contrasts with a white/light background.
 * Use for logos or text displayed on light backgrounds (e.g. "Powered by" branding).
 * When the primary color is white or light, returns a darker shade; when dark, returns the color.
 */
export function getColorForLightBackground(color) {
  if (!color || typeof color !== 'string') return '#374151'; // gray-700 fallback
  try {
    const { r, g, b } = parseColorToRgb(color);
    const luminance = getLuminance(r, g, b);
    // Light colors: use darker shade for visibility on white
    // Dark colors: use as-is (visible on white)
    return luminance > 0.6 ? decideTextColor(color) : color;
  } catch {
    return '#374151';
  }
}
  
  export function getLighterColor(color, factor = 0.8) {
    let r, g, b;
    if (color.startsWith('#')) {
      // Convert hex color to RGB values
      r = parseInt(color.slice(1, 3), 16);
      g = parseInt(color.slice(3, 5), 16);
      b = parseInt(color.slice(5, 7), 16);
    } else if (color.startsWith('rgb')) {
      // Parse RGB string
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      r = parseInt(match[1]);
      g = parseInt(match[2]);
      b = parseInt(match[3]);
    } else {
      throw new Error('Unsupported color format');
    }
  
    // Calculate lighter RGB values
    const lighterR = Math.min(Math.floor(r + (255 - r) * factor), 255);
    const lighterG = Math.min(Math.floor(g + (255 - g) * factor), 255);
    const lighterB = Math.min(Math.floor(b + (255 - b) * factor), 255);
  
    return `rgb(${lighterR},${lighterG},${lighterB})`;
  }
  