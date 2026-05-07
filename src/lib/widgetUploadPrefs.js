import { checkPlanPermission } from '@/utils/helpers'

/**
 * Matches GET /api/widget/[teamId]/[botId] useImageUpload (embedded dashboard parity).
 */
export function effectiveWidgetImageUploads(team, bot, isAgent) {
  if (!team || !isAgent) return false
  return Boolean(
    (bot?.imageUploads === undefined || bot?.imageUploads) &&
      checkPlanPermission(team, 'standard', 'imageUploads').allowed,
  )
}

/**
 * Matches GET /api/widget/[teamId]/[botId] useAudioUpload.
 */
export function effectiveWidgetAudioUploads(team, bot, isAgent) {
  if (!team || !isAgent) return false
  return Boolean(
    (bot?.audioUploads === undefined || bot?.audioUploads) &&
      checkPlanPermission(team, 'standard', 'voiceInputInWidget').allowed,
  )
}
