import { Fragment, useState } from 'react'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { CodeBracketIcon, PencilSquareIcon, MegaphoneIcon } from '@heroicons/react/24/outline'

const features = [
  {
    name: 'Technical Writers',
    description: 'Identify gaps in your documentation with Deep Research.',
    icon: PencilSquareIcon,
    content: (
        <div className="relative bg-white rounded-lg p-6 shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Content Insights</div>
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900">Missing Topics</h4>
                <span className="text-red-500 text-sm font-medium">High Priority</span>
            </div>
            <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3 p-2 bg-red-50 rounded text-sm">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-gray-700">"Rate limiting headers"</span>
                    <span className="ml-auto text-gray-500">45 queries</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-orange-50 rounded text-sm">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="text-gray-700">"Websocket events"</span>
                    <span className="ml-auto text-gray-500">28 queries</span>
                </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <button className="text-cyan-600 text-sm font-semibold hover:text-cyan-700">Generate Draft Article →</button>
            </div>
        </div>
    )
  },
  {
    name: 'Support Managers',
    description: 'Democratize product knowledge across your organization.',
    icon: MegaphoneIcon,
    content: (
        <div className="relative bg-white rounded-lg p-6 shadow-lg border border-gray-200 h-full flex flex-col">
             <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1 bg-gray-50 rounded-lg rounded-tl-none p-3 text-sm text-gray-700">
                    Does the new v2 API support bulk export? Sales needs to know for a deal.
                </div>
             </div>
             <div className="flex items-start gap-4 mt-4 flex-row-reverse flex-1">
                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-cyan-600 font-bold text-xs">AI</span>
                </div>
                <div className="flex-1 bg-cyan-50 border border-cyan-100 rounded-lg rounded-tr-none p-3 text-sm text-gray-800">
                    Yes, v2 supports bulk export. According to the <span className="text-cyan-600 underline cursor-pointer">Release Notes</span>, it was added in v2.1. Limit is 50k records per request.
                </div>
             </div>
        </div>
    )
  },
  {
    name: 'Developers',
    description: 'Stay in your normal workflow with DocsBot API calls directly from your stack.',
    icon: CodeBracketIcon,
    content: (
        <div className="relative bg-gray-900 rounded-lg p-4 font-mono text-xs text-gray-200 shadow-lg border border-gray-700 space-y-3 h-full flex flex-col">
            <div className="text-xs uppercase tracking-widest text-gray-500">Powerful APIs</div>
            <div className="bg-black/30 rounded-lg p-4 space-y-1">
                <div className="text-cyan-300 break-words">
                    POST https://api.docsbot.ai/teams/<span className="text-white">TEAM_ID</span>/bots/<span className="text-white">BOT_ID</span>/chat-agent
                </div>
            </div>
            <pre className="bg-black/40 rounded-lg p-4 overflow-x-auto text-[11px] leading-5 text-gray-200 flex-1">
{`{
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "question": "What is docsbot pricing?"
}`}
            </pre>
            <div className="text-xs text-gray-400 border-t border-gray-800 pt-3">
                DocsBot responds with the answer plus metadata—ready for your custom UI or IDE integration.
            </div>
        </div>
    )
  },
]

export default function EmbeddedDocsBenefits() {
  return (
    <div className="py-24 sm:py-32 bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base/7 font-semibold text-cyan-600">Where we work</h2>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            Answers Where You Work
          </p>
          <p className="mt-6 text-lg/8 text-gray-600">
            Plug directly into your IDE, API layer, CMS or Slack so answers show where you work.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-x-8 gap-y-16 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col px-4">
                <dt className="flex items-center gap-x-3 text-base/7 font-semibold text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-cyan-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base/7 text-gray-600">
                  <p className="flex-auto mb-6">{feature.description}</p>
                  <div className="-m-2 rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 h-full flex flex-col">
                    {feature.content}
                  </div>
                </dd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

