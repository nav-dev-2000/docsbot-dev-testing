import Image from 'next/image'
import Link from 'next/link'
import { freeTools } from '@/constants/freeTools.constants'

const FreeToolsGrid = () => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {freeTools.map((tool) => (
        <Link key={tool.href} href={tool.href} className="group">
          <div className="overflow-hidden rounded-lg bg-white shadow-md transition-transform duration-300 group-hover:scale-105">
            <div className="relative pb-[52.36%]">
              <Image
                src={tool.ogImage}
                alt={tool.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-4 text-center">
              <h3 className="lg:text-2xl text-xl font-bold text-gray-800 group-hover:text-cyan-600"> {/* Updated this line */}
                {tool.name}
              </h3>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

export default FreeToolsGrid