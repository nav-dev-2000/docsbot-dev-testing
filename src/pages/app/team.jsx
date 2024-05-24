import Link from 'next/link'
import Image from 'next/image'
import { EnvelopeIcon, PlusIcon, XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getAuth } from 'firebase-admin/auth'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getTeams, getTeamUsers, getInvitesFromEmail, getInvitesFromTeam } from '@/lib/dbQueries'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { Fragment, useState, useEffect } from 'react'
import { Listbox, Transition } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon, PencilIcon } from '@heroicons/react/20/solid'
import Router from 'next/router'
import { isSuperAdmin } from '@/utils/helpers'
import classNames from '@/utils/classNames'
import InviteMember from '@/components/InviteMember'
import InviteRequest from '@/components/InviteRequest'
import MemberDelete from '@/components/MemberDelete'
import { teamMembersRoles } from '@/constants/permissions.constants'
import { canUserInvite, canUserModifyTeam } from '@/utils/function.utils'

function TeamSelect({ team, userId, userTeams, changeTeam }) {
  const [selected, setSelected] = useState(team)

  useEffect(() => {
    if (selected.id !== team.id) {
      changeTeam(selected.id)
    }
  }, [selected])

  useEffect(() => {
    setSelected(team)
  }, [team])

  return (
    <div className="grow">
      <Listbox value={selected} onChange={setSelected}>
        {({ open }) => (
          <>
            <Listbox.Label className="block text-sm font-medium text-gray-700">
              Current Team
            </Listbox.Label>
            <div className="mt-2 max-w-xl text-xs text-gray-500">
              <p>Switch between different team dashboards that you have access to.</p>
            </div>
            <div className="mt-1">
              <Listbox.Button className="relative w-full cursor-default rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-left shadow-sm focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:text-sm">
                <span className="inline-flex w-full justify-between truncate">
                  <div>
                    <span className="truncate">{selected?.name}</span>
                    <span className="ml-4 truncate font-semibold capitalize text-gray-800">
                      {selected?.roles[userId]}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="truncate text-gray-500">
                      {selected?.botCount || 'No'} Bots
                    </span>
                  </div>
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                  <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </span>
              </Listbox.Button>

              <Transition
                show={open}
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-5/6 overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:w-3/5 sm:text-sm">
                  {userTeams.map((team) => (
                    <Listbox.Option
                      key={team.id}
                      className={({ active }) =>
                        classNames(
                          active ? 'bg-cyan-600 text-white' : 'text-gray-900',
                          'relative cursor-default select-none py-2 pl-10 pr-3'
                        )
                      }
                      value={team}
                    >
                      {({ selected, active }) => (
                        <>
                          {selected ? (
                            <span
                              className={classNames(
                                active ? 'text-white' : 'text-cyan-600',
                                'absolute inset-y-0 left-0 flex items-center pl-4'
                              )}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          ) : null}
                          <div className="flex justify-between">
                            <div>
                              <span
                                className={classNames(
                                  selected ? 'font-semibold' : 'font-normal',
                                  'truncate'
                                )}
                              >
                                {team.name}
                              </span>
                              <span
                                className={classNames(
                                  active ? 'text-cyan-200' : 'text-gray-800',
                                  'ml-4 truncate font-semibold capitalize'
                                )}
                              >
                                {team.roles[userId]}
                              </span>
                            </div>
                            <div className="hidden sm:block">
                              <span
                                className={classNames(
                                  active ? 'text-cyan-200' : 'text-gray-500',
                                  'truncate'
                                )}
                              >
                                {team.botCount || 'No'} Bots
                              </span>
                              <span
                                className={classNames(
                                  active ? 'text-cyan-200' : 'text-gray-500',
                                  'ml-4 truncate capitalize'
                                )}
                              >
                                {team.sourceCount || 'No'} Sources
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </>
        )}
      </Listbox>
    </div>
  )
}

function Team({ team, userId, teamUsers, userTeams, userInvites, teamInvites }) {
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [currTeam, setCurrTeam] = useState(team)
  const [currUserTeams, setCurrUserTeams] = useState(userTeams)
  const [currTeamUsers, setCurrTeamUsers] = useState(teamUsers)
  const [currTeamInvites, setCurrTeamInvites] = useState(teamInvites)
  const [inviteList, setInviteList] = useState(userInvites)
  const [invite, setToInvite] = useState(null)
  const [removeUser, setRemoveUser] = useState(null)
  const [newTeam, setNewTeam] = useState(null)
  const [newTeamName, setNewTeamName] = useState(team.name)
  const [weaviateUrl, setWeaviateUrl] = useState(team.weaviateUrl || '')
  const [weaviateApiKey, setWeaviateApiKey] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  // const [selectedRole, setSelectedRole] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [roles] = useState(teamMembersRoles)

  const changeTeam = async (teamId) => {
    setErrorText('')

    if (teamId === currTeam.id || !teamId) {
      setErrorText('Please enter a different valid team')
      return
    }

    const urlParams = ['users', userId]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ currentTeam: teamId }),
    })
    if (response.ok) {
      const { users: newUsers, invites: newInvites, team: newTeam } = await response.json()
      console.info(newUsers, newTeam)
      setCurrTeam(newTeam)
      setNewTeamName(newTeam.name)
      setCurrTeamUsers(newUsers)
      setCurrTeamInvites(newInvites)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  const changeMemberRole = async (role) => {
    const response = await fetch(`/api/teams/${team.id}/members`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ memberId: selectedMemberId, role: role }),
    })
    if (response.ok) {
      setSelectedMemberId('')
      const { teamUsers } = await response.json()
      setCurrTeamUsers(teamUsers)
    }
  }

  const updateTeam = async () => {
    if (!canUserModifyTeam(currTeam, userId)) {
      return
    }

    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', currTeam.id]
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newTeamName, weaviateUrl, weaviateApiKey}),
    })
    if (response.ok) {
      const data = await response.json()
      setCurrTeam(data)
      setNewTeamName(data.name)
      setCurrUserTeams((teams) => {
        const index = teams.find((team) => team.id === data.id)
        teams[index] = data
        return teams
      })
      setIsUpdating(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  const updateTeamUsers = async () => {
    setErrorText('')
    setIsUpdating(true)

    const urlParams = ['teams', currTeam.id, 'members']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (response.ok) {
      const data = await response.json()
      setCurrTeamUsers(data)
      setIsUpdating(false)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
      setIsUpdating(false)
    }
  }

  const resendInvite = async (inviteId) => {
    setErrorText('')
    setSuccessText('')

    const teamId = currTeam.id
    const status = 'retry'
    const urlParams = ['teams', teamId, 'invite']
    const apiPath = '/api/' + urlParams.join('/')

    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inviteId, teamId, status }),
    })
    if (response.ok) {
      const data = await response.json()
      setSuccessText('Successfully resent invite!')
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  useEffect(() => {
    updateTeamUsers()
  }, [currTeam])

  return (
    <DashboardWrap page="Team" team={currTeam}>
      <Alert title={errorText} type="error" />
      <Alert title={successText} type="success" />

      {inviteList.map(({ teamId, teamName, inviteId, role }) => (
        <InviteRequest
          key={inviteId}
          {...{ teamId, teamName, inviteId, setInviteList, setErrorText, setCurrTeam, role }}
        />
      ))}

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 py-6 shadow">
        <TeamSelect {...{ team: currTeam, userId, userTeams: currUserTeams, changeTeam }} />
        {canUserModifyTeam(currTeam, userId) && (
          <div>
            <label htmlFor="team_name" className="block text-sm font-medium text-gray-700">
              Rename Team
            </label>
            <div className="mt-2 max-w-xl text-xs text-gray-500">
              <p>Enter a new team name for {currTeam.name}.</p>
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="text"
                  id="team_name"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Team Name"
                />
              </div>
              <button
                type="button"
                onClick={updateTeam}
                disabled={newTeamName === currTeam.name || isUpdating}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-25"
              >
                Update
              </button>
            </div>
          </div>
        )}
      </div>

      {isSuperAdmin(userId) && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
          <div className="w-full">
            <h3 className="m-0 text-lg font-medium leading-6 text-gray-900">Super Admin Tools</h3>
          </div>
          <div>
            <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
              Open Team
            </label>
            <div className="mt-2 max-w-xl text-xs text-gray-500">
              <p>Enter customer email or Team ID to switch to their team.</p>
            </div>
            <div className="mt-1 flex rounded-md shadow-sm">
              <div className="relative flex flex-grow items-stretch focus-within:z-10">
                <input
                  type="text"
                  id="team_id"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  className="block w-full rounded-none rounded-l-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="Email/Team ID"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  changeTeam(newTeam)
                }}
                className="relative -ml-px inline-flex items-center space-x-2 rounded-r-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                Go
              </button>
            </div>
          </div>
          <div className="w-full border-t border-gray-200 pt-4">
            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <label
                  htmlFor="w-url"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Custom Weaviate URL
                </label>
                <div className="mt-2">
                  <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-cyan-600 sm:max-w-md">
                    <span className="flex select-none items-center pl-3 text-gray-500 sm:text-sm">
                      https://
                    </span>
                    <input
                      type="text"
                      name="w-url"
                      id="w-url"
                      autoComplete="off"
                      value={weaviateUrl}
                      onChange={(e) => setWeaviateUrl(e.target.value)}
                      className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                      placeholder="xxx.xxx.weaviate.cloud"
                    />
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="w-key"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Custom Weaviate API Key
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="w-key"
                    id="w-key"
                    autoComplete="off"
                    value={weaviateApiKey}
                    onChange={(e) => setWeaviateApiKey(e.target.value)}
                    placeholder={team.weaviateApiKey ? "••••••••••••••••••" : ''}
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <button
                type="submit"
                onClick={updateTeam}
                disabled={isUpdating}
                className="mt-8 rounded-md bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-cyan-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-600 sm:col-span-2 disabled:opacity-25"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <InviteMember {...{ team: currTeam, invite, setToInvite, setErrorText, setSuccessText }} />
      <MemberDelete
        {...{
          team: currTeam,
          removeUser,
          setRemoveUser,
          setErrorText,
          setCurrTeamUsers,
          setCurrTeamInvites,
        }}
      />

      <div className="mt-6 overflow-hidden bg-white shadow sm:rounded-md">
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">
          <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
            <div className="ml-4 mt-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                {currTeam.name}: Members
              </h3>
              <p className="mb-0 mt-1 text-sm text-gray-500">
                {canUserInvite(currTeam, userId)
                  ? 'View and manage the members of this team.'
                  : 'View the members of this team.'}
              </p>
            </div>
            {canUserInvite(currTeam, userId) && (
              <div className="ml-4 mt-4 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setToInvite(true)
                  }}
                  className="relative inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Add member
                </button>
              </div>
            )}
          </div>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {currTeamUsers.map((user) => (
            <li key={user.uid}>
              <div className="relative flex items-center px-4 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="flex-shrink-0">
                    <Image
                      className="h-12 w-12 rounded-full"
                      src={user.photoURL}
                      width={48}
                      height={48}
                      alt="User avatar"
                    />
                  </div>
                  <div className="flex w-full min-w-0 items-center justify-between px-4">
                    <div>
                      <p className="mb-1 truncate text-sm font-medium text-cyan-600">
                        {user.displayName}
                      </p>
                      <p className="m-0 flex items-center text-sm text-gray-500">
                        <EnvelopeIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="truncate">{user.email}</span>
                      </p>
                    </div>
                    <div className="relative items-center text-right">
                      <p className="mb-1 truncate text-sm text-gray-400">Role</p>
                      <div className="flex gap-2">
                        {selectedMemberId === user.uid ? (
                          <div className="text-md mt-2 text-gray-500">
                            <div className="relative flex flex-grow items-stretch shadow-sm focus-within:z-10">
                              <select
                                id="team_role"
                                defaultValue={user.role}
                                onChange={(e) => changeMemberRole(e.target.value)}
                                className="block w-full rounded-none rounded-l-md rounded-r-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                              >
                                {roles.map((role, index) => (
                                  <option key={index} value={role.value}>
                                    {role.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <p className="text-md m-0 font-medium capitalize text-gray-900">
                              {user.role}
                            </p>
                          </div>
                        )}

                        {userId !== user.uid &&
                          canUserModifyTeam(currTeam, userId) &&
                          user.role !== 'owner' &&
                          !selectedMemberId && (
                            <button
                              type="button"
                              onClick={() => setSelectedMemberId(user.uid)}
                              title="Change Role"
                            >
                              <span className="sr-only">Change role</span>
                              <PencilIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                            </button>
                          )}
                        {userId !== user.uid &&
                          canUserModifyTeam(currTeam, userId) &&
                          selectedMemberId === user.uid &&
                          selectedMemberId && (
                            <button
                              type="button"
                              onClick={() => setSelectedMemberId('')}
                              title="Cancel"
                            >
                              <span className="sr-only">Cancel</span>
                              <XMarkIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
                {userId !== user.uid &&
                  canUserModifyTeam(currTeam, userId) &&
                  user.role !== 'owner' && (
                    <div className="absolute right-2 top-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          setRemoveUser(user)
                        }}
                        className="text-red-400 hover:text-red-200 focus:text-red-200"
                        title="Delete"
                      >
                        <span className="sr-only">Delete</span>
                        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  )}
              </div>
            </li>
          ))}
          {currTeamInvites.map((invite) => (
            <li key={invite.email}>
              <div className="relative flex items-center bg-gray-50 px-4 py-4 sm:px-6">
                <div className="flex min-w-0 flex-1 items-center">
                  <div className="flex-shrink-0">
                    <Image
                      className="h-12 w-12 rounded-full"
                      src={invite.photoURL}
                      width={48}
                      height={48}
                      alt="User avatar"
                    />
                  </div>
                  <div className="flex w-full min-w-0 items-center justify-between px-4">
                    <div>
                      <p className="mb-1 truncate text-sm font-medium text-cyan-600">No Name</p>
                      <p className="m-0 flex items-center text-sm text-gray-500">
                        <EnvelopeIcon
                          className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                          aria-hidden="true"
                        />
                        <span className="truncate">{invite.email}</span>
                      </p>
                    </div>
                    <div className="items-center">
                      <p className="text-md m-0 font-medium text-gray-700">Pending...</p>
                    </div>
                    <div className="items-center text-right">
                      <p className="mb-0 truncate text-sm text-gray-400">Role</p>
                      <p className="text-md m-0 font-medium capitalize text-gray-900">
                        {invite.role}
                      </p>
                    </div>
                  </div>
                </div>
                {canUserModifyTeam(currTeam, userId) && (
                  <div className="absolute right-2 top-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        resendInvite(invite.inviteId)
                      }}
                      className="text-slate-400 hover:text-slate-600 focus:text-slate-600"
                      title="Resend invite"
                    >
                      <span className="sr-only">Resend invite</span>
                      <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setRemoveUser(invite)
                      }}
                      className="text-red-400 hover:text-red-200 focus:text-red-200"
                      title="Delete"
                    >
                      <span className="sr-only">Delete</span>
                      <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </DashboardWrap>
  )
}

export const getServerSideProps = async (context) => {
  const data = await getAuthorizedUserCurrentTeam(context)
  configureFirebaseApp()

  if (data?.props?.userId) {
    const { email } = await getAuth().getUser(data.props.userId)
    data.props.userInvites = await getInvitesFromEmail(email)
  }

  if (data?.props?.team) {
    data.props.userTeams = await getTeams(data.props.userId)
    data.props.teamUsers = await getTeamUsers(data.props.team.id)
    data.props.teamInvites = await getInvitesFromTeam(data.props.team.id)
  }

  return data
}

export default Team
