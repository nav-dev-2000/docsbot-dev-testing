import Image from 'next/future/image'
import { StarIcon } from '@heroicons/react/24/solid'
import image1 from '@/images/avatars/testimony6.png'
import image2 from '@/images/avatars/testimony2.jpeg'
import image3 from '@/images/avatars/testimony3.jpeg'
import image4 from '@/images/avatars/testimony4.jpeg'
import image5 from '@/images/avatars/testimony-sg.jpeg'
import clsx from 'clsx'

export default function SocialFaces({ isDark = false, props }) {
  return (
    <div className="flex items-center justify-center gap-3" {...props}>
      <div className="flex -space-x-2 overflow-hidden">
        <Image
          src={image1}
          alt="Customer avatar"
          width={40}
          height={40}
          className={clsx(
            'inline-block h-10 w-10 rounded-full ring-2',
            isDark ? 'ring-cyan-600' : 'ring-white'
          )}
        />
        <Image
          src={image2}
          alt="Customer avatar"
          width={40}
          height={40}
          className={clsx(
            'inline-block h-10 w-10 rounded-full ring-2',
            isDark ? 'ring-cyan-600' : 'ring-white'
          )}
        />
        <Image
          src={image3}
          alt="Customer avatar"
          width={40}
          height={40}
          className={clsx(
            'inline-block h-10 w-10 rounded-full ring-2',
            isDark ? 'ring-cyan-600' : 'ring-white'
          )}
        />
        <Image
          src={image4}
          alt="Customer avatar"
          width={40}
          height={40}
          className={clsx(
            'inline-block h-10 w-10 rounded-full ring-2',
            isDark ? 'ring-cyan-600' : 'ring-white'
          )}
        />
        <Image
          src={image5}
          alt="Customer avatar"
          width={40}
          height={40}
          className={clsx(
            'inline-block h-10 w-10 rounded-full ring-2',
            isDark ? 'ring-cyan-600' : 'ring-white'
          )}
        />
      </div>
      <div>
        <div className="flex">
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <StarIcon className="h-5 w-5 text-yellow-400" />
            <StarIcon className="h-5 w-5 text-yellow-400" />
          </div>
        </div>
        <span className={clsx('text-xs font-medium', isDark ? 'text-white' : 'text-gray-900')}>Loved by 1,000+ customers</span>
      </div>
    </div>
  )
}
