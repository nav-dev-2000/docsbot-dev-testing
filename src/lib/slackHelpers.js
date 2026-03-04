/**
 * channelBotMap only supports object format { botId, channelName? }. Non-object values are ignored.
 */
export function getBotIdFromChannelMapping(value) {
  if (!value || typeof value !== 'object') return null
  return typeof value.botId === 'string' ? value.botId : null
}

/**
 * Get display name for a channel. Prefer channelName (e.g. "general"), format as #name for display.
 */
export function getChannelDisplayName(channelId, value) {
  if (!value || typeof value !== 'object') return channelId
  const name = value.channelName
  if (!name || typeof name !== 'string') return channelId
  return name.startsWith('#') ? name : `#${name}`
}

/**
 * Returns only valid channel mappings (object format). Non-object values are ignored.
 */
export function getValidChannelEntries(channelBotMap) {
  if (!channelBotMap || typeof channelBotMap !== 'object') return []
  return Object.entries(channelBotMap).filter(
    ([, v]) => v && typeof v === 'object' && typeof v.botId === 'string',
  )
}
