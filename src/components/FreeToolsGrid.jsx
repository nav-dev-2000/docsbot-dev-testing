import Image from 'next/image'
import Link from 'next/link'
import { freeTools } from '@/constants/freeTools.constants'

const FreeToolsGrid = ({ category, showTitle = true }) => {
  const filteredTools = category
    ? freeTools.filter((tool) => tool.category === category)
    : freeTools

  return (
    <>
      {showTitle && (
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          Explore More Free {category ? category + ' ' : ''}Tools
        </h2>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredTools.map((tool, index) => (
          <Link key={tool.href + index} href={tool.href} className="group">
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
                <h3 className="text-lg tracking-tight font-bold text-gray-800 group-hover:text-cyan-600 lg:text-xl">
                  {tool.name}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {showTitle && (
        <div className="mt-8 text-center">
          <Link
            href="/tools"
            className="text-xl text-cyan-600 hover:text-cyan-700 font-bold"
          >
            See all free tools &rarr;
          </Link>
        </div>
      )}
    </>
  )
}

export default FreeToolsGrid
