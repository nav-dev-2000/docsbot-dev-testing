import Link from 'next/link'
import RobotIcon from '@/components/RobotIcon'

const baseClasses =
  'group relative mx-auto mt-16 block w-full max-w-2xl rounded-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2'

const Content = () => (
  <>
    <RobotIcon className="mx-auto h-14 w-14 text-gray-400 group-hover:text-cyan-700/50" />
    <span className="mt-2 block text-sm font-medium text-gray-900 group-hover:text-cyan-800">Create a new bot</span>
    <p className="mt-1 text-sm text-gray-500 group-hover:text-cyan-700">
      Train a new bot with your own documentation and content.
    </p>
  </>
)

export default function BotCTA({ href = '/app/onboarding', onClick, className }) {
  const classes = className || baseClasses

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes}>
        <Content />
      </button>
    )
  }

  return (
    <Link href={href} className={classes}>
      <Content />
    </Link>
  )
}
