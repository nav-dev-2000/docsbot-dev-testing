import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'

export default function PrivacyStatus({ bot }) {
  // Determine the title based on the privacy status
  const title = bot.privacy === 'private' ? 'Bot requires authentication' : 'Bot is public and can be used by anyone'

  return (
    <Tooltip content={title}>
      <p className="flex items-center text-sm capitalize text-gray-500">
        {bot.privacy === 'private' ? (
          <EyeSlashIcon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
        ) : (
          <EyeIcon className="mr-1 h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
        )}
        {bot.privacy}
      </p>
    </Tooltip>
  )
}
