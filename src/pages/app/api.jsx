import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import {
  ServerStackIcon,
  ArrowRightIcon,
  CheckBadgeIcon,
  DocumentTextIcon,
  Square3Stack3DIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import ModalOpenAI from '@/components/ModalOpenAI'
import openAILogo from '@/images/openai-logo.svg'
import APIDocs from '@/components/APIDocs'

function Api({ team }) {
  const [errorText, setErrorText] = useState(null)
  const [open, setOpen] = useState(team.openAIKey ? false : true)

  const openRef = useRef(open)
  useEffect(() => {
    if (openRef.current !== open && !open) {
      window.location.reload()
    }
    openRef.current = open
  }, [open])

  const key = team.openAIKeyPreview
    ? team.openAIKeyPreview
    : team.openAIKey
    ? 'sk-***************************'
    : ''

  return (
    <DashboardWrap page="API">
      <Alert title={errorText} type="error" />
      <ModalOpenAI {...{ team, open, setOpen }} />
      <div className="rounded-lg bg-white p-8 shadow">
        <h3 className="text-2xl font-bold">OpenAI API Key</h3>
        <p className="text-md mt-2 text-justify text-gray-800">
          You can update your API key here. You must have a valid API key with billing enabled in
          your OpenAI account for DocsBot to function.
        </p>
        <div className="mt-4 flex justify-between">
          <div className="mt-4 flex items-center justify-start">
            <pre className="">{key}</pre>
            <a
              type="button"
              className="ml-2 flex cursor-pointer items-center justify-end text-sm font-medium text-gray-500 hover:text-gray-900"
              onClick={() => {
                setOpen(true)
              }}
            >
              <PencilIcon className="mr-0.5 h-4 w-4" aria-hidden="true" />
              Edit
            </a>
          </div>

          <Image src={openAILogo} alt="OpenAI logo" width={130} height={90} />
        </div>
      </div>

      <div className="rounded-lg bg-white p-8 shadow mt-8">
        <h3 className="text-2xl font-bold">API Documentation</h3>
        <APIDocs team={team} />
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  return data
}

export default Api
