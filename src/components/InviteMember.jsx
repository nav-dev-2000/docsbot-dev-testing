import { useState, useEffect, useRef } from 'react'
import ModalCheckout from '@/components/ModalCheckout'
import { teamMembersRoles, botMembersRoles } from '@/constants/permissions.constants'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '@/config/firebase-ui.config'
import Tooltip from '@/components/Tooltip'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export default function InviteMember({
  team,
  invite,
  setToInvite,
  setErrorText,
  setSuccessText,
  bots = [],
}) {
  const [submitting, setSubmitting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [selectedRole, setSelectedRole] = useState('editor')
  const [selectedBotId, setSelectedBotId] = useState('')
  const [selectedBotRole, setSelectedBotRole] = useState('viewer')
  const [botOverrides, setBotOverrides] = useState([])
  const [user] = useAuthState(auth)
  const [roles] = useState(teamMembersRoles)
  const [botRoles] = useState(botMembersRoles)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const alertRef = useRef(null);
  const teamRoleInfo = `
    <div class="text-left text-xs leading-5">
      <div><strong>Team roles</strong></div>
      <div>Admin: manage team, billing, and all bots.</div>
      <div>Editor: Viewer plus edit sources and instructions; can export logs.</div>
      <div>Viewer: view bot content, logs, and reports.</div>
      <div>None: no access unless a bot role is assigned.</div>
    </div>
  `

  async function submitInvite() {
    if (selectedRole === 'none' && botOverrides.length === 0) {
      setErrorText('Add at least one bot override before assigning team role None.')
      return
    }
    setErrorText('')
    setSubmitting(true)
    const response = await fetch(`/api/teams/${team.id}/invite`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inviteEmail: inviteEmail.toLowerCase(),
        teamId: team.id,
        role: selectedRole,
        botOverrides,
      })
    })
    setSubmitting(false)
    if (response.ok) {
      const data = await response.json()
      setToInvite(null)
      setSuccessText(data.message || 'Success')
    } else if (response.status == 403) { // 403 is our response if the team needs to be upgraded
      setShowUpgrade(true)
    } else {
      try {
        const data = await response.json()
        setErrorText(data.message || 'Something went wrong, please try again.')
      } catch (e) {
        setErrorText('Error ' + response.status + ', please try again.')
      }
    }
  }

  //show whenever params change
  useEffect(() => {
    if (selectedRole === 'admin' && botOverrides.length > 0) {
      setBotOverrides([])
    }
    return () => {
      if (alertRef.current) {
        alertRef.current.scrollIntoView({ behavior: 'smooth' })
      }
    }
  }, [invite, selectedRole, botOverrides.length])

  if (!invite) return null 

  const availableBots = bots.filter(
    (bot) => !botOverrides.some((override) => override.botId === bot.id)
  )
  const botOverridesDisabled = selectedRole === 'admin'

  const addOverride = () => {
    if (!selectedBotId) return
    setBotOverrides((prev) => [
      ...prev,
      { botId: selectedBotId, role: selectedBotRole },
    ])
    setSelectedBotId('')
    setSelectedBotRole('viewer')
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <div className="mt-8 flex justify-between bg-white shadow sm:rounded-lg" ref={alertRef}>
        <div className="px-4 py-5 sm:p-6 max-w-2xl w-full">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Invite a team member</h3>
          <div className="text-md mt-2 text-gray-500">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="invite_email" className="mb-1 block text-xs font-medium text-gray-500">
                  Email
                </label>
                <input
                  type="text"
                  id="invite_email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="block w-full rounded-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                  <label htmlFor="team_role">Team role</label>
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
                <select
                  id="team_role"
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="block w-full rounded-md border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
                >
                  {roles.map((role, index) => (
                    <option key={index} value={role.value}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div className="mb-2 font-medium text-gray-700">Bot overrides (optional)</div>
              {botOverridesDisabled && (
                <div className="mb-2 text-xs text-gray-500">
                  Bot overrides are only available for non-admin team roles.
                </div>
              )}
              {availableBots.length === 0 ? (
                <div className="text-gray-500">All bots already have overrides selected.</div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedBotId}
                    onChange={(e) => setSelectedBotId(e.target.value)}
                    disabled={botOverridesDisabled}
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
                    value={selectedBotRole}
                    onChange={(e) => setSelectedBotRole(e.target.value)}
                    disabled={botOverridesDisabled}
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
                    onClick={addOverride}
                    disabled={botOverridesDisabled}
                    className="rounded-md border border-cyan-600 px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                  >
                    Add override
                  </button>
                </div>
              )}
              {botOverrides.length > 0 && (
                <div className="mt-3 space-y-1 text-xs text-gray-600">
                  {botOverrides.map((override) => {
                    const bot = bots.find((item) => item.id === override.botId)
                    const roleLabel =
                      botRoles.find((role) => role.value === override.role)?.name || override.role
                    return (
                      <div key={override.botId} className="flex items-center justify-between">
                        <span>
                          {bot?.name || override.botId} · {roleLabel}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setBotOverrides((prev) =>
                              prev.filter((item) => item.botId !== override.botId)
                            )
                          }
                          className="text-red-500 hover:text-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="text-md mt-2 text-gray-500">
              {/* <div className="relative flex flex-grow items-stretch focus-within:z-10 shadow-sm"> */}
              {/* </div> */}
            </div>
          </div>
          <div className="mt-5">
            <div className="flex justify-start">
              <button
                onClick={() => setToInvite(null)}
                disabled={submitting}
                type="button"
                className="mr-2 rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
              >
                Cancel
              </button>
              <button
                onClick={submitInvite}
                  disabled={submitting}
                type="button"
                className="relative inline-flex items-center rounded-md border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-25"
              >
                Invite
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
