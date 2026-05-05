import { useState } from 'react'
import clsx from 'clsx'

import Alert from '@/components/Alert'
import BotSearch from '@/components/BotSearch'
import Workspace from '../Workspace'

const PageConfigureSearch = ({ team, bot }) => {
  const [errorText, setErrorText] = useState(null)
  const [hasResults, setHasResults] = useState(false)

  return (
    <div id="page-configure-search" className="h-full overflow-y-auto px-8">
      <div
        className={clsx(
          'flex flex-col',
          hasResults ? 'gap-4 py-4' : 'gap-8 py-8',
        )}
      >
        <Workspace.Header
          title="Search"
          description="Search your bot's training data. This is a great way to test what documentation source chunks are being used to answer specific questions."
          className={hasResults ? 'gap-1 [&_h2]:text-xl [&_p]:hidden' : ''}
        />

        <div className="space-y-4">
          <Alert title={errorText} type="warning" className="!my-0" />

          <BotSearch
            team={team}
            bot={bot}
            fullWidth={true}
            setErrorText={setErrorText}
            onResultsChange={setHasResults}
          />
        </div>
      </div>
    </div>
  )
}

export default PageConfigureSearch
