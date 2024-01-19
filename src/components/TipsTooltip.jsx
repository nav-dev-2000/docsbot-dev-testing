import { InformationCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const TipsTooltip = () => {
  return (
    <div className="group absolute right-8 top-0 z-10 pr-4 pt-4 mt-0.5 sm:block">
      <LightBulbIcon className="h-5 w-5 text-gray-400 hover:text-gray-500 cursor-pointer" />
      <span className="absolute right-0 top-12 flex w-72 scale-0 gap-3 rounded-lg bg-white p-3 shadow-lg transition-all group-hover:scale-100">
        <div>
          <InformationCircleIcon className="h-5 w-5" />
        </div>
        <div className="text-gray-500">
          <p className="text-sm font-semibold text-gray-800">Improving Chatbot Responses</p>
          <div>
            <div className="flex flex-col gap-2 text-xs font-semibold text-gray-500 mt-2">
              <p className="">
                <span className="mr-1 font-bold">1.</span> Check the matching training data sources in the sidebar, your question logs, or via our search tool.
              </p>
              <p className="">
                <span className="mr-1 font-bold">2. </span> Revise answers that you don't like to teach the chatbot how to respond to similar questions in the future in your question logs.
              </p>
              <p className="">
                <span className="mr-1 font-bold">3. </span> Finetune your bot's behavior by adjusting your custom prompt to be clear on it's role, objectives, and context it might need for every interaction.
              </p>
              <p className="">
                <span className="mr-1 font-bold">4. </span> Enable GPT-4 for your bot which is better at following instructions and understanding the context.
              </p>
              <Link
                href="/documentation/doc/improving-response-quality"
                className="font-bold text-black underline"
              >
                Learn more...
              </Link>
            </div>
          </div>
        </div>
      </span>
    </div>
  )
}

export default TipsTooltip
