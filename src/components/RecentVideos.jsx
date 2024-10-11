import Link from 'next/link'

const RecentVideos = ({ heading = 'Recently Analyzed Videos', slug, recentVideos }) => {
  return (
    <div className="mx-auto mt-16 py-4">
      <div className="mb-6 text-center text-3xl font-bold tracking-tight text-white">
        {heading}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recentVideos.videos.map((video) => (
          <Link
            key={video.id}
            href={`/tools/${slug}/${video.id}`}
            className="block transition-opacity hover:opacity-75"
          >
            <div className="overflow-hidden rounded-lg bg-white shadow-md">
              <img
                src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                alt={video.title}
                className="h-36 w-full object-cover"
              />
              <div className="p-4">
                <h3 className="truncate text-sm font-medium text-gray-900">
                  {video.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <ul className="flex flex-wrap justify-center mt-4">
        {recentVideos.aiVideos.map((video) => (
          <li key={video.id} className="my-1 mx-2 flex items-center">
            <Link
              href={`/tools/${slug}/${video.id}`}
              className="text-xs text-cyan-300 hover:text-cyan-100 transition-colors duration-200"
            >
              {video.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecentVideos