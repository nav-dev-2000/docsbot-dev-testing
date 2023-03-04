import { useEffect, useState } from 'react'
import { sourceTypes } from '@/constants/sourceTypes.constants'
import BadgeStatusSource from '@/components/BadgeStatusSource'
import classNames from '@/utils/classNames'

export default function SourceGrid({ sources }) {
  const [fullSources, setFullSources] = useState([])

  useEffect(() => {
    const newSources = []
    sources.map((source) => {
      source.icon = sourceArg(source.type, 'icon')
      source.name = sourceArg(source.type, 'title')
      newSources.push(source)
    })
    setFullSources(newSources)
  }, [sources])

  const sourceArg = (type, arg) => {
    const sourceType = sourceTypes.find((sourceType) => sourceType.id === type)
    return sourceType[arg] || null
  }

  //if no sources, show empty state
  if (!sources || sources.length === 0) {
    return null
  }

  return (
    <div>
      <h2 className="mt-8 text-xl font-semibold text-gray-800">Sources</h2>
      <ul
        role="list"
        className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-3"
      >
        {fullSources.map((source) => (
          <li key={source.id} className="col-span-1 flex rounded-md shadow-sm">
            <div
              className={classNames(
                'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md bg-gradient-to-r from-teal-600 to-cyan-700 text-sm font-medium text-white'
              )}
            >
              <source.icon className="h-6 w-6 text-cyan-100" aria-hidden="true" />
            </div>
            <div className="w-full rounded-r-md border-t border-r border-b border-gray-200 bg-white px-3 py-2 first-letter:truncate truncate">
              <div className="flex flex-1 items-center justify-between ">
                <div className="flex items-center text-sm">
                  <p className="font-medium text-gray-900 hover:text-gray-600">{source.name}</p>
                  {source.pageCount ? (
                  <p className="ml-2 text-xs text-gray-500">{source.pageCount} Pages</p>
                  ) : null}
                </div>
                <div className="">
                  <BadgeStatusSource source={source} small={true} />
                </div>
              </div>
              <div className="flex-1 truncate text-sm">
                <p className="truncate text-xs text-gray-600">{source.title}</p>
                <p className="truncate text-xs text-gray-500">{source.url}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
