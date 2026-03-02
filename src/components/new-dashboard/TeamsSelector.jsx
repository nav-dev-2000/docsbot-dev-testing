import Link from 'next/link'
import { ChevronUpDownIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'

const TeamsSelector = ({ team }) => {
    return (
        <Tooltip content="Switch Team">
            <Link
                className="ml-2 flex items-center overflow-hidden text-xs leading-tight text-gray-500 md:text-sm"
                href={'/app/team'}
            >
                {team?.name && (
                    <p className="flex items-center overflow-hidden text-xs leading-tight text-gray-500 md:text-sm">
                        {team?.name}
                    </p>
                )}
                <ChevronUpDownIcon
                    className="h-5 w-5 flex-shrink-0 text-gray-400"
                    aria-hidden="true"
                />
                <span className="sr-only">Switch Team</span>
            </Link>
        </Tooltip>
    )
}

export default TeamsSelector
