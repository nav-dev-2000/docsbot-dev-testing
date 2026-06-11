import Image from 'next/image'
import {
  EnvelopeIcon,
  PlusIcon,
  XMarkIcon,
  ArrowPathIcon,
  TrashIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CloudArrowUpIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'
import DashboardWrap from '@/components/DashboardWrap'
import Alert from '@/components/Alert'
import { getAuth } from 'firebase-admin/auth'
import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getTeamUsers, getInvitesFromEmail, getInvitesFromTeam, getBots } from '@/lib/dbQueries'
import { getAuthorizedUserCurrentTeam } from '@/middleware/getAuthorizedUserCurrentTeam'
import { useState, useEffect, useRef } from 'react'
import { PencilIcon } from '@heroicons/react/20/solid'
import { isSuperAdmin, stripePlan, checkPlanPermission } from '@/utils/helpers'
import classNames from '@/utils/classNames'
import InviteMember from '@/components/InviteMember'
import InviteRequest from '@/components/InviteRequest'
import MemberDelete from '@/components/MemberDelete'
import TransferOwnership from '@/components/TransferOwnership'
import ModalCheckout from '@/components/ModalCheckout'
import { teamMembersRoles, botMembersRoles } from '@/constants/permissions.constants'
import { canUserInvite, canUserModifyTeam, getUserRole } from '@/utils/function.utils'
import Tooltip from '@/components/Tooltip'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/config/firebase-ui.config'
import { v4 as uuidv4 } from 'uuid'
import LoadingSpinner from '@/components/LoadingSpinner'
import IconButton from '@/components/new-dashboard/IconButton'

function Team({ team, userId, teamUsers, userInvites, teamInvites, bots }) {
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [currTeam, setCurrTeam] = useState(team)
  const [currTeamUsers, setCurrTeamUsers] = useState(teamUsers)
  const [currTeamInvites, setCurrTeamInvites] = useState(teamInvites)
  const [teamBots, setTeamBots] = useState(bots)
  const [inviteList, setInviteList] = useState(userInvites)
  const [invite, setToInvite] = useState(null)
  const [removeUser, setRemoveUser] = useState(null)
  const [transferToUser, setTransferToUser] = useState(null)
  const [newTeamName, setNewTeamName] = useState(team.name)
  const [teamLogo, setTeamLogo] = useState(team.logo || null)
  const [uploadingTeamLogo, setUploadingTeamLogo] = useState(null)
  const teamLogoRef = useRef(null)
  const [weaviateUrl, setWeaviateUrl] = useState(team.weaviateUrl || '')
  const [weaviateApiKey, setWeaviateApiKey] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  // const [selectedRole, setSelectedRole] = useState(null)
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [expandedBotRoles, setExpandedBotRoles] = useState({})
  const [addOverrideByMember, setAddOverrideByMember] = useState({})
  const [roles] = useState(teamMembersRoles)
  const [botRoles] = useState(botMembersRoles)
  const canManageTeamMembers = canUserModifyTeam(currTeam, userId) || isSuperAdmin(userId)
  const canTransferOwnership =
    currTeam?.roles?.[userId] === 'owner' || isSuperAdmin(userId)
  const teamRoleInfo = `
    <div class="text-left text-xs leading-5">
      <div><strong>Team roles</strong></div>
      <div>Admin: manage team, billing, and all bots.</div>
      <div>Editor: edit instructions, sources, search; view chat, research, leads, analytics; export logs. No widget, deploy, or webhooks.</div>
      <div>Viewer: view bot content, logs, and reports only.</div>
      <div>None: no access unless a bot role is assigned.</div>
    </div>
  `
  const botRoleInfo = `
    <div class="text-left text-xs leading-5">
      <div><strong>Bot roles</strong></div>
      <div>Default: inherit the team role.</div>
      <div>Admin: full access including widget, deploy, webhooks, system settings, glossary, starters, and exports.</div>
      <div>Editor: edit instructions, sources, search; view chat, research, leads, analytics; export logs. No widget, deploy, or webhooks.</div>
      <div>Viewer: view bot content, logs, and reports only.</div>
      <div>None: no access to this bot.</div>
    </div>
  `

  const changeMemberRole = async (role) => {
    // Handle special "transfer_ownership" option
    if (role === 'transfer_ownership') {
      const user = currTeamUsers.find(u => u.uid === selectedMemberId)
      if (user) {
        setSelectedMemberId('')
        setTransferToUser(user)
      }
      return
    }

    const response = await fetch(`/api/teams/${currTeam.id}/members`, {
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
  
  const updateMemberBotRole = async (botId, memberId, role) => {
    // Check if team is on Business plan or higher before allowing per bot role changes
    const planCheck = checkPlanPermission(currTeam, 'business')
    if (!planCheck.allowed && role !== 'default') {
      setShowUpgrade(true)
      return
    }

    let previousRole = null
    setTeamBots((prevBots) =>
      prevBots.map((bot) => {
        if (bot.id !== botId) {
          return bot
        }
        previousRole = bot.roles?.[memberId] || 'default'
        return {
          ...bot,
          roles: {
            ...bot.roles,
            [memberId]: role,
          },
        }
      })
    )

    const response = await fetch(`/api/teams/${currTeam.id}/bots/${botId}/members`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, role }),
    })
    if (response.ok) {
      setSuccessText('Updated bot role')
    } else {
      setTeamBots((prevBots) =>
        prevBots.map((bot) =>
          bot.id === botId
            ? {
                ...bot,
                roles: {
                  ...bot.roles,
                  [memberId]: previousRole,
                },
              }
            : bot
        )
      )
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong')
      } catch {}
    }
  }

  useEffect(() => {
    setTeamLogo(currTeam?.logo || null)
  }, [currTeam?.id, currTeam?.logo])

  const updateTeamLogo = async (logoUrl) => {
    setErrorText('')
    const urlParams = ['teams', currTeam.id]
    const apiPath = '/api/' + urlParams.join('/')
    const response = await fetch(apiPath, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: logoUrl || '' }),
    })
    if (response.ok) {
      const data = await response.json()
      setCurrTeam(data)
      setTeamLogo(data.logo || null)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Failed to update team icon.')
      } catch {
        setErrorText('Failed to update team icon.')
      }
    }
  }

  const handleTeamLogoFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file || !currTeam?.id) return
    setUploadingTeamLogo(true)
    setErrorText('')
    const uuid = uuidv4()
    const extension = file.name.split('.').pop()
    const filepath = `teams/${currTeam.id}/images/${uuid}.${extension}`
    const storageRef = ref(storage, filepath)
    uploadBytes(storageRef, file)
      .then(() => {
        const url =
          process.env.NODE_ENV === 'development'
            ? `https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/${encodeURIComponent(filepath)}?alt=media`
            : `https://cdn.docsbot.ai/${encodeURIComponent(filepath)}?alt=media`
        updateTeamLogo(url)
      })
      .catch((err) => {
        console.warn(err)
        setErrorText('Error uploading image. Please try again.')
      })
      .finally(() => setUploadingTeamLogo(false))
    e.target.value = ''
  }

  const updateTeam = async () => {
    if (!canUserModifyTeam(currTeam, userId) && !isSuperAdmin(userId)) {
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
      headers: { 'Content-Type': 'application/json' },
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

  const handleInviteMember = () => {
    // Check if team has reached member limit
    const plan = stripePlan(currTeam)
    const currentMemberCount = Object.keys(currTeam.roles).length + currTeamInvites.length
    
    if (currentMemberCount >= plan.teamMembers && !isSuperAdmin(userId)) {
      setShowUpgrade(true)
    } else {
      setToInvite(true)
    }
  }

  useEffect(() => {
    updateTeamUsers()
  }, [currTeam])

  useEffect(() => {
    setTeamBots(bots)
  }, [bots])

  const sortBotsByName = (botsList) =>
    [...botsList].sort((a, b) =>
      (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' })
    )

  const getBotsWithOverrides = (botsList, memberId) =>
    sortBotsByName(
      botsList.filter((bot) => {
        const botRole = bot?.roles?.[memberId]
        return botRole && botRole !== 'default'
      })
    )

  const getAvailableBotsForOverride = (botsList, memberId) =>
    sortBotsByName(
      botsList.filter((bot) => {
        const botRole = bot?.roles?.[memberId]
        return !botRole || botRole === 'default'
      })
    )

  return (
    <DashboardWrap page="Team" team={currTeam} bots={teamBots}>
      <Alert title={errorText} type="error" />
      <Alert title={successText} type="success" />

      <ModalCheckout team={currTeam} open={showUpgrade} setOpen={setShowUpgrade} />

      {inviteList.map(({ teamId, teamName, inviteId, role }) => (
        <InviteRequest
          key={inviteId}
          {...{ teamId, teamName, inviteId, setInviteList, setErrorText, setCurrTeam, role }}
        />
      ))}

      <div className="flex flex-wrap items-stretch gap-6 rounded-lg bg-white p-4 py-6 shadow">
        <div className="flex w-full min-w-0 items-stretch gap-6">
          <div className="flex flex-shrink-0 flex-col">
            <label className="block text-sm font-medium text-gray-700">
              Team Icon
            </label>
            <p className="mt-2 max-w-md text-xs text-gray-500">
              {canUserModifyTeam(currTeam, userId)
                ? 'Upload or remove the icon shown in the team selector.'
                : 'The icon shown in the team selector.'}
            </p>
            <div className="mt-1 flex items-center gap-2">
            <div className="relative h-12 w-12 flex-shrink-0">
              <div
                className={classNames(
                  'flex h-full w-full items-center justify-center overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-100',
                )}
              >
                {teamLogo ? (
                  <img
                    src={teamLogo}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <BuildingOffice2Icon className="h-6 w-6 text-gray-500" aria-hidden="true" />
                )}
              </div>
              {teamLogo && canUserModifyTeam(currTeam, userId) && (
                <button
                  type="button"
                  onClick={() => updateTeamLogo('')}
                  className="absolute -right-1.5 -top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  aria-label="Remove team icon"
                >
                  <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
            {canUserModifyTeam(currTeam, userId) && (
              <>
                <input
                  ref={teamLogoRef}
                  type="file"
                  accept="image/png, image/jpeg, image/gif, image/webp"
                  onChange={handleTeamLogoFileChange}
                  className="sr-only"
                />
                <Tooltip
                  content={
                    <span className="text-xs/none">
                      {teamLogo ? 'Change Image' : 'Upload Image'}
                    </span>
                  }
                >
                  <IconButton
                    type="button"
                    icon={
                      uploadingTeamLogo ? LoadingSpinner : CloudArrowUpIcon
                    }
                    label={teamLogo ? 'Change team icon' : 'Upload team icon'}
                    onClick={() => teamLogoRef.current?.click()}
                    disabled={!!uploadingTeamLogo}
                    className="!h-12 !w-12"
                  />
                </Tooltip>
              </>
            )}
            </div>
          </div>
          {canUserModifyTeam(currTeam, userId) && (
            <div className="flex min-w-0 flex-1 flex-col">
              <label htmlFor="team_name" className="block text-sm font-medium text-gray-700">
                Rename Team
              </label>
              <p className="mt-2 max-w-md text-xs text-gray-500">
                Enter a new team name for {currTeam.name}.
              </p>
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
      </div>

      <InviteMember
        {...{
          team: currTeam,
          invite,
          setToInvite,
          setErrorText,
          setSuccessText,
          bots: teamBots,
        }}
      />
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
      <TransferOwnership
        {...{
          team: currTeam,
          userId,
          transferToUser,
          setTransferToUser,
          setErrorText,
          setSuccessText,
          setCurrTeamUsers,
          setCurrTeam,
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
                  onClick={handleInviteMember}
                  className="relative inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
                >
                  <PlusIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Add member
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                >
                  Member
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                >
                  <div className="flex items-center gap-1">
                    <span>Team role</span>
                    <Tooltip content={teamRoleInfo} placement="top">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Team role permissions"
                      >
                        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500"
                >
                  <div className="flex items-center gap-1">
                    <span>Bot roles</span>
                    {(() => {
                      const planCheck = checkPlanPermission(currTeam, 'business')
                      if (!planCheck.allowed) {
                        return (
                          <span className="ml-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                            Business
                          </span>
                        )
                      }
                      return null
                    })()}
                    <Tooltip content={botRoleInfo} placement="top">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600"
                        aria-label="Bot role permissions"
                      >
                        <InformationCircleIcon className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </Tooltip>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currTeamUsers.map((user) => (
                <tr key={user.uid}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="h-10 w-10 rounded-full"
                        src={user.photoURL}
                        width={40}
                        height={40}
                        alt="User avatar"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-cyan-600">
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
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">Active</td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      {selectedMemberId === user.uid ? (
                        <div className="text-md text-gray-500">
                          <div className="relative flex items-stretch shadow-sm focus-within:z-10">
                            <select
                              id={`team_role_${user.uid}`}
                              defaultValue={user.role}
                              onChange={(e) => changeMemberRole(e.target.value)}
                              className="block w-40 rounded-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                            >
                              {roles.map((role, index) => (
                                <option key={index} value={role.value}>
                                  {role.name}
                                </option>
                              ))}
                              {canTransferOwnership && (
                                <>
                                  <option disabled>──────────</option>
                                  <option value="transfer_ownership">
                                    Transfer Ownership
                                  </option>
                                </>
                              )}
                            </select>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                          <p className="m-0">{user.role}</p>
                        </div>
                      )}
                      {userId !== user.uid &&
                        canManageTeamMembers &&
                        user.role !== 'owner' &&
                        !selectedMemberId && (
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId(user.uid)}
                            title="Change Role"
                            className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Change role</span>
                            <PencilIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                          </button>
                        )}
                      {userId !== user.uid &&
                        canManageTeamMembers &&
                        selectedMemberId === user.uid &&
                        selectedMemberId && (
                          <button
                            type="button"
                            onClick={() => setSelectedMemberId('')}
                            title="Cancel"
                            className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                          >
                            <span className="sr-only">Cancel</span>
                            <XMarkIcon className="h-4 w-4 text-gray-500" aria-hidden="true" />
                          </button>
                        )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                      {(canUserModifyTeam(currTeam, userId) || isSuperAdmin(userId)) &&
                        (() => {
                          // Show explanatory text for owners/admins
                          if (['owner', 'admin'].includes(user.role)) {
                            return (
                              <span className="text-xs text-gray-500">
                                Admins and owners can't have per-bot roles
                              </span>
                            )
                          }
                          
                          // Show bot roles for other users
                          if (teamBots.length === 0) return null
                          const botsWithOverrides = getBotsWithOverrides(teamBots, user.uid)
                          const availableBots = getAvailableBotsForOverride(teamBots, user.uid)
                          const overrideCount = botsWithOverrides.length
                          const isExpanded = !!expandedBotRoles[user.uid]
                          const addOverrideState = addOverrideByMember[user.uid] || {
                            open: false,
                            botId: '',
                            role: 'viewer',
                          }
                          return (
                            <div className="w-full">
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                                  <span>Bot roles ({overrideCount})</span>
                                  <Tooltip content={botRoleInfo} placement="left">
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-gray-600"
                                      aria-label="Bot role permissions"
                                    >
                                      <InformationCircleIcon
                                        className="h-4 w-4"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </Tooltip>
                                  {addOverrideState.open === false && !isExpanded && (
                                    <Tooltip content="Show bot roles" placement="left">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedBotRoles((prev) => ({
                                            ...prev,
                                            [user.uid]: true,
                                          }))
                                        }
                                        className="text-cyan-600 hover:text-cyan-700"
                                        aria-label="Show bot roles"
                                      >
                                        <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                    </Tooltip>
                                  )}
                                  {isExpanded && (
                                    <Tooltip content="Hide bot roles" placement="left">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedBotRoles((prev) => ({
                                            ...prev,
                                            [user.uid]: false,
                                          }))
                                        }
                                        className="text-cyan-600 hover:text-cyan-700"
                                        aria-label="Hide bot roles"
                                      >
                                        <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                    </Tooltip>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const planCheck = checkPlanPermission(currTeam, 'business')
                                      if (!planCheck.allowed) {
                                        setShowUpgrade(true)
                                        return
                                      }
                                      setAddOverrideByMember((prev) => ({
                                        ...prev,
                                        [user.uid]: {
                                          ...addOverrideState,
                                          open: !addOverrideState.open,
                                        },
                                      }))
                                    }}
                                    className="text-xs text-cyan-600 hover:text-cyan-700"
                                  >
                                    {addOverrideState.open ? (
                                      'Cancel'
                                    ) : (
                                      <span className="inline-flex items-center gap-1">
                                        <PlusIcon className="h-3 w-3" aria-hidden="true" />
                                        Add override
                                        {(() => {
                                          const planCheck = checkPlanPermission(currTeam, 'business')
                                          if (!planCheck.allowed) {
                                            return (
                                              <span className="ml-1 inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                                                Business
                                              </span>
                                            )
                                          }
                                          return null
                                        })()}
                                      </span>
                                    )}
                                  </button>
                                  {isExpanded && (
                                    <Tooltip content="Hide bot roles" placement="left">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setExpandedBotRoles((prev) => ({
                                            ...prev,
                                            [user.uid]: false,
                                          }))
                                        }
                                        className="text-cyan-600 hover:text-cyan-700"
                                        aria-label="Hide bot roles"
                                      >
                                        <ChevronUpIcon className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                    </Tooltip>
                                  )}
                                </div>
                              </div>
                              {addOverrideState.open && (
                                <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {availableBots.length > 0 ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <select
                                        value={addOverrideState.botId}
                                        onChange={(e) =>
                                          setAddOverrideByMember((prev) => ({
                                            ...prev,
                                            [user.uid]: {
                                              ...addOverrideState,
                                              botId: e.target.value,
                                            },
                                          }))
                                        }
                                        className="block w-52 rounded-md border-gray-300 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                                      >
                                        <option value="">Select bot…</option>
                                        {availableBots.map((bot) => (
                                          <option key={bot.id} value={bot.id}>
                                            {bot.name}
                                          </option>
                                        ))}
                                      </select>
                                      <select
                                        value={addOverrideState.role}
                                        onChange={(e) =>
                                          setAddOverrideByMember((prev) => ({
                                            ...prev,
                                            [user.uid]: {
                                              ...addOverrideState,
                                              role: e.target.value,
                                            },
                                          }))
                                        }
                                        className="block w-28 rounded-md border-gray-300 text-xs focus:border-cyan-500 focus:ring-cyan-500"
                                      >
                                        {botRoles
                                          .filter((role) => role.value !== 'default')
                                          .map((role) => (
                                            <option key={role.value} value={role.value}>
                                              {role.name}
                                            </option>
                                          ))}
                                      </select>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!addOverrideState.botId) return
                                          updateMemberBotRole(
                                            addOverrideState.botId,
                                            user.uid,
                                            addOverrideState.role
                                          )
                                          setAddOverrideByMember((prev) => ({
                                            ...prev,
                                            [user.uid]: {
                                              open: false,
                                              botId: '',
                                              role: 'viewer',
                                            },
                                          }))
                                        }}
                                        className="rounded-md border border-cyan-600 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">
                                      All bots already have overrides.
                                    </span>
                                  )}
                                </div>
                              )}
                              {isExpanded && (
                                <div className="overflow-x-auto">
                                  {botsWithOverrides.length > 0 && (
                                    <table className="min-w-full divide-y divide-gray-200 rounded-md border border-gray-200">
                                      <tbody className="divide-y divide-gray-200 bg-white">
                                        {botsWithOverrides.map((bot) => (
                                          <tr key={bot.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-sm text-gray-900">
                                              {bot.name}
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                              <select
                                                value={bot?.roles?.[user.uid] || 'default'}
                                                onChange={(e) =>
                                                  updateMemberBotRole(
                                                    bot.id,
                                                    user.uid,
                                                    e.target.value
                                                  )
                                                }
                                                className="block w-full rounded-md border-gray-300 text-sm focus:border-cyan-500 focus:ring-cyan-500"
                                              >
                                                {botRoles.map((role) => (
                                                  <option key={role.value} value={role.value}>
                                                    {role.name}
                                                  </option>
                                                ))}
                                              </select>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })()}
                  </td>
                  <td className="px-4 py-4">
                    {userId !== user.uid &&
                      canManageTeamMembers &&
                      user.role !== 'owner' && (
                        <div className="flex flex-col items-end gap-2">
                          <Tooltip content="Delete member" placement="left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                setRemoveUser(user)
                              }}
                              className="rounded-md border border-gray-200 p-1 text-red-500 hover:bg-red-50"
                              aria-label="Delete member"
                            >
                              <span className="sr-only">Delete member</span>
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </Tooltip>
                        </div>
                      )}
                  </td>
                </tr>
              ))}
              {currTeamInvites.map((invite) => (
                <tr key={invite.email} className="bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <Image
                        className="h-10 w-10 rounded-full"
                        src={invite.photoURL}
                        width={40}
                        height={40}
                        alt="User avatar"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-cyan-600">No Name</p>
                        <p className="m-0 flex items-center text-sm text-gray-500">
                          <EnvelopeIcon
                            className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="truncate">{invite.email}</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">Pending…</td>
                  <td className="px-4 py-4">
                    <div className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium capitalize text-gray-700">
                      <p className="m-0">{invite.role}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-400">—</span>
                  </td>
                  <td className="px-4 py-4">
                    {canUserModifyTeam(currTeam, userId) && (
                      <div className="flex flex-col items-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault()
                            resendInvite(invite.inviteId)
                          }}
                          className="rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50"
                          title="Resend invite"
                        >
                          <span className="sr-only">Resend invite</span>
                          <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <Tooltip content="Delete invite" placement="left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              setRemoveUser(invite)
                            }}
                            className="rounded-md border border-gray-200 p-1 text-red-500 hover:bg-red-50"
                            aria-label="Delete invite"
                          >
                            <span className="sr-only">Delete invite</span>
                            <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
    const role = getUserRole(data.props.team, data.props.userId)
    if (role === 'none') {
      return {
        redirect: {
          destination: '/app',
          permanent: false,
        },
      }
    }
    data.props.teamUsers = await getTeamUsers(data.props.team.id)
    data.props.teamInvites = await getInvitesFromTeam(data.props.team.id)
    data.props.bots = await getBots(data.props.team)
  }

	return data
}

export default Team
