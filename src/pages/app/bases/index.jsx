import Link from 'next/link'
import Image from 'next/future/image'
import { useState } from 'react'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import DashboardWrap from '@/components/DashboardWrap'
import BaseCTA from '@/components/BaseCTA'
import BadgeStatus from '@/components/BadgeStatus'
import {
  CalendarIcon,
  DocumentPlusIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  BookOpenIcon,
  QuestionMarkCircleIcon,
  Square3Stack3DIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline'
import Alert from '@/components/Alert'
import { getBases } from '@/lib/dbQueries'
import BaseDelete from '@/components/BaseDelete'
import NewBasePanel from '@/components/NewBasePanel'
import ModalOpenAI from '@/components/ModalOpenAI'

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

function Bases({ preBases, team }) {
  const [bases, setBases] = useState(preBases)
  const [errorText, setErrorText] = useState(null)
  const [toDelete, setToDelete] = useState(null)
  const [open, setOpen] = useState(false)

  const BasesGrid = ({ bases }) => {
    return (
      <ul
        role="list"
        className={classNames(
          bases.length > 1 ? 'xl:grid-cols-2' : '',
          'mt-8 grid grid-cols-1 gap-6'
        )}
      >
        {bases.map((base) => (
          <BaseItem key={base.id} base={base} />
        ))}
      </ul>
    )
  }

  const BaseItem = ({ base }) => {
    if (!base || !base.id) return null

    let ts = new Date(base.createdAt)

    return (
      <li
        key={base.id}
        className="col-span-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow hover:shadow-lg"
      >
        <Link href={'/app/bases/' + base.id} className="cover-link">
          <div className="relative flex w-full items-start justify-between space-x-6 p-6">
            <div className="flex-1 truncate">
              <div className="flex items-center space-x-3">
                <h3 className="truncate text-lg font-medium text-gray-900">{base.name}</h3>
              </div>
              <p className="mt-1 truncate text-sm text-gray-700">{base.description}</p>
              <p className="mt-1 truncate text-sm capitalize text-gray-500">
                <EyeIcon className="inline-block h-4 w-4" aria-hidden="true" /> {base.privacy}
              </p>
              <p className="mt-1 truncate text-xs text-gray-500 sm:text-sm">
                <CalendarIcon className="inline-block h-4 w-4" /> {ts.toLocaleString()}
              </p>
            </div>
            <div className="grid flex-shrink-0">
              <div className="mt-2 mb-10 flex justify-center sm:mb-6">
                <BadgeStatus status={base.status} small={true} />
              </div>

              <div className="flex justify-end">
                <span className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-teal-600 to-cyan-700 p-3 shadow-lg">
                  <BookOpenIcon className="h-6 w-6 text-cyan-200" aria-hidden="true" />
                </span>
              </div>
            </div>
            <div className="absolute right-2 top-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setToDelete(base)
                }}
                className=" text-red-400 hover:text-red-200 focus:text-red-200"
                title="Delete"
              >
                <span className="sr-only">Delete</span>
                <XMarkIcon className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 divide-y divide-gray-200 border-t border-gray-200 bg-gray-50 sm:grid-cols-3 sm:divide-y-0 sm:divide-x">
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <DocumentDuplicateIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{base.sourceCount}</span>{' '}
              <span className="text-gray-600">Sources</span>
            </div>
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <Square3Stack3DIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{base.pageCount}</span>{' '}
              <span className="text-gray-600">Indexed pages</span>
            </div>
            <div className="flex items-center justify-center space-x-1 px-6 py-5 text-center text-sm font-medium">
              <QuestionMarkCircleIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <span className="text-gray-900">{base.questionCount}</span>{' '}
              <span className="text-gray-600">Questions</span>
            </div>
          </div>
        </Link>
      </li>
    )
  }

  return (
    <DashboardWrap page="Bases">
      <p className="text-md font-bol mb-4 text-center sm:text-base">
        These are your custom trained AI bases. You can train new bases, or generate new source
        images from these bases.
      </p>
      <Alert title={errorText} type="error" />

      <BaseDelete
        team={team}
        base={toDelete}
        setToDelete={setToDelete}
        setErrorText={setErrorText}
        bases={bases}
        setBases={setBases}
      />

      <BasesGrid bases={bases} />

      <BaseCTA {...{ setOpen }} />

      <NewBasePanel {...{ team, open, setOpen }} />

      <ModalOpenAI {...{ team }} />
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)

  if (data?.props?.team) {
    data.props.preBases = await getBases(data.props.team)
  }

  return data
}

export default Bases
