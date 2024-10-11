import Link from 'next/link'

const RecentAIVideos = ({ heading = 'More Recently Analyzed Videos', slug, recentVideos }) => {
  if (!recentVideos.aiVideos || recentVideos.aiVideos.length === 0) {
    return null;
  }
  return (
    <div className="mx-auto mt-16 py-4">
      <div className="mb-6 text-center text-xl font-bold tracking-tight text-gray-700">
        {heading}
      </div>
      <ul className="flex flex-wrap justify-center mt-4">
        {recentVideos.aiVideos.map((video, index) => (
          <li key={video.id} className="my-1 mx-2 flex items-center">
            {index > 0 && <span className="mx-2 text-gray-400">•</span>}
            <Link
              href={`/tools/${slug}/${video.id}`}
              className="text-xs text-cyan-600 hover:text-cyan-500 transition-colors duration-200"
            >
              {video.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default RecentAIVideos