import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/router'
import { Menu, Transition } from '@headlessui/react'
import { useAuthState } from 'react-firebase-hooks/auth'
import {
  ArrowPathIcon,
  BuildingOffice2Icon,
  CheckIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import Tooltip from '@/components/Tooltip'
import { auth } from '@/config/firebase-ui.config'
import { stripePlan } from '@/utils/helpers'
import Chip from './Chip'

const CACHE_KEY = 'docsbot-user-teams-cache-v2'
const CACHE_TTL_MS = 1000 * 60 * 5

let teamsCache = {
  teams: null,
  loadedAt: 0,
}

const formatCount = (count, noun) => {
  const normalizedCount = Number.isFinite(Number(count)) ? Number(count) : 0
  return `${normalizedCount} ${noun}${normalizedCount === 1 ? '' : 's'}`
}

const formatRole = (role) => {
  if (!role) {
    return 'Member'
  }

  return role.charAt(0).toUpperCase() + role.slice(1)
}

const normalizeTeam = (team) => {
  if (!team?.id) {
    return null
  }

  return {
    ...team,
    botCount: Number.isFinite(Number(team.botCount)) ? Number(team.botCount) : 0,
  }
}

const mergeTeams = (currentTeams = [], incomingTeams = [], currentTeamId) => {
  const teamsById = new Map()

  ;[...currentTeams, ...incomingTeams]
    .map(normalizeTeam)
    .filter(Boolean)
    .forEach((team) => {
      teamsById.set(team.id, {
        ...(teamsById.get(team.id) || {}),
        ...team,
      })
    })

  return Array.from(teamsById.values()).sort((firstTeam, secondTeam) => {
    if (firstTeam.id === currentTeamId) return -1
    if (secondTeam.id === currentTeamId) return 1
    return (firstTeam.name || '').localeCompare(secondTeam.name || '')
  })
}

const readTeamsFromCache = () => {
  const now = Date.now()

  if (
    Array.isArray(teamsCache.teams) &&
    now - teamsCache.loadedAt < CACHE_TTL_MS
  ) {
    return teamsCache.teams
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    const rawValue = window.sessionStorage.getItem(CACHE_KEY)
    if (!rawValue) {
      return null
    }

    const parsed = JSON.parse(rawValue)
    if (
      !Array.isArray(parsed?.teams) ||
      typeof parsed?.loadedAt !== 'number' ||
      now - parsed.loadedAt >= CACHE_TTL_MS
    ) {
      return null
    }

    teamsCache = parsed
    return parsed.teams
  } catch (error) {
    return null
  }
}

const writeTeamsToCache = (teams) => {
  const nextCache = {
    teams,
    loadedAt: Date.now(),
  }

  teamsCache = nextCache

  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(nextCache))
  } catch (error) {
    // ignore storage failures
  }
}

const getPlanMeta = (team) => {
  const plan = team?.plan || stripePlan(team)
  const normalizedPlanId = (plan?.id || '').toLowerCase()

  if (normalizedPlanId === 'free' || plan?.name === 'Free') {
    return {
      label: 'Free',
      className: 'border-amber-400 bg-amber-50 text-amber-700',
    }
  }

  if (normalizedPlanId === 'business') {
    return {
      label: plan?.name || 'Business',
      className: 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-700',
    }
  }

  if (normalizedPlanId === 'standard' || normalizedPlanId === 'pro') {
    return {
      label: plan?.name || 'Standard',
      className: 'border-purple-300 bg-purple-50 text-purple-700',
    }
  }

  if (normalizedPlanId === 'personal' || normalizedPlanId === 'power') {
    return {
      label: plan?.name || 'Personal',
      className: 'border-violet-300 bg-violet-50 text-violet-700',
    }
  }

  return {
    label: plan?.name || 'Paid',
    className: 'border-purple-300 bg-purple-50 text-purple-700',
  }
}

const TeamsSelector = ({ team, className = '' }) => {
  const router = useRouter()
  const [user] = useAuthState(auth)
  const [teams, setTeams] = useState(() =>
    mergeTeams([], team ? [team] : [], team?.id),
  )
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [switchingTeamId, setSwitchingTeamId] = useState('')
  const [errorText, setErrorText] = useState('')

  const getPostSwitchPath = useCallback(() => {
    // When under /app/bots/:id or /app/bots/:id/*, redirect to /app/bots so the new team loads cleanly.
    const pathname = router.pathname
    const pathWithoutQuery = (router.asPath || '').split('?')[0]
    const isBotPanel =
      pathname === '/app/bots/[botId]/[[...slug]]' ||
      /^\/app\/bots\/[^/]+(\/|$)/.test(pathWithoutQuery)

    if (isBotPanel) {
      return '/app/bots'
    }

    return router.asPath
  }, [router.asPath, router.pathname])

  useEffect(() => {
    if (!team?.id) {
      return
    }

    setTeams((currentTeams) => mergeTeams(currentTeams, [team], team.id))
  }, [team])

  const hydrateTeams = useCallback(
    (nextTeams) => {
      setTeams((currentTeams) => {
        const mergedTeams = mergeTeams(currentTeams, nextTeams, team?.id)
        writeTeamsToCache(mergedTeams)
        return mergedTeams
      })
    },
    [team?.id],
  )

  const loadTeams = useCallback(
    async ({ force = false } = {}) => {
      if (!user?.uid || isLoadingTeams) {
        return
      }

      if (!force) {
        const cachedTeams = readTeamsFromCache()
        if (cachedTeams?.length) {
          setTeams((currentTeams) =>
            mergeTeams(currentTeams, cachedTeams, team?.id),
          )
          return
        }
      }

      setIsLoadingTeams(true)
      setErrorText('')

      try {
        const response = await fetch('/api/teams')
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to load teams right now.')
        }

        hydrateTeams(Array.isArray(data) ? data : [])
      } catch (error) {
        setErrorText(error?.message || 'Unable to load teams right now.')
      } finally {
        setIsLoadingTeams(false)
      }
    },
    [hydrateTeams, isLoadingTeams, team?.id, user?.uid],
  )

  const switchTeam = useCallback(
    async (teamId) => {
      if (!user?.uid || !teamId || teamId === team?.id || switchingTeamId) {
        return
      }

      setErrorText('')
      setSwitchingTeamId(teamId)

      try {
        const response = await fetch(`/api/users/${user.uid}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ currentTeam: teamId }),
        })
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data?.message || 'Unable to switch teams right now.')
        }

        if (data?.team) {
          hydrateTeams([data.team])
        }

        const postSwitchPath = getPostSwitchPath()

        if (typeof window !== 'undefined') {
          window.location.replace(postSwitchPath)
          return
        }

        await router.replace(postSwitchPath)
      } catch (error) {
        setErrorText(error?.message || 'Unable to switch teams right now.')
      } finally {
        setSwitchingTeamId('')
      }
    },
    [getPostSwitchPath, hydrateTeams, router, switchingTeamId, team?.id, user?.uid],
  )

  const createTeam = useCallback(async () => {
    if (!user?.uid || isCreatingTeam) {
      return
    }

    setErrorText('')
    setIsCreatingTeam(true)

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || 'Unable to create a new team right now.')
      }

      if (data?.team) {
        hydrateTeams([data.team])
      }

      await router.push('/app/team')
    } catch (error) {
      setErrorText(error?.message || 'Unable to create a new team right now.')
    } finally {
      setIsCreatingTeam(false)
    }
  }, [hydrateTeams, isCreatingTeam, router, user?.uid])

  const displayedTeams = useMemo(
    () => mergeTeams(teams, team ? [team] : [], team?.id),
    [team, teams],
  )

  if (!team?.id) {
    return null
  }

  return (
    <Menu as="div" className={clsx('relative', className)}>
      <Tooltip content="Switch Team">
        <Menu.Button
          type="button"
          className="group flex flex-row items-center gap-2 text-gray-800 hover:text-cyan-600 focus:outline-none"
          onClick={() => loadTeams()}
          onMouseEnter={() => loadTeams()}
          onFocus={() => loadTeams()}
        >
          <span className="size-8 flex flex-none items-center justify-center overflow-hidden rounded-lg bg-gray-100 text-gray-700">
            {team.logo ? (
              <img
                src={team.logo}
                alt=""
                className="size-full object-contain"
              />
            ) : (
              <BuildingOffice2Icon className="size-4" aria-hidden="true" />
            )}
          </span>

          <span className="flex flex-row items-center gap-2 text-sm font-semibold">
            {team.name}
          </span>

          {isLoadingTeams ? (
            <ArrowPathIcon
              className="size-4 animate-spin text-gray-400"
              aria-hidden="true"
            />
          ) : (
            <ChevronUpDownIcon
              className="size-4 text-gray-400 transition group-hover:text-gray-500"
              aria-hidden="true"
            />
          )}

          <span className="sr-only">Switch Team</span>
        </Menu.Button>
      </Tooltip>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 md:z-[100] mt-1 w-[24rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Switch teams</p>
            <p className="text-xs text-gray-500">
              Move between team workspaces or start a fresh one.
            </p>
          </div>

          {errorText && (
            <div className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
              {errorText}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto p-2">
            {displayedTeams.map((option) => {
              const isCurrentTeam = option.id === team.id
              const isSwitching = switchingTeamId === option.id
              const planMeta = getPlanMeta(option)

              return (
                <Menu.Item key={option.id}>
                  {({ active }) => (
                    <button
                      type="button"
                      className={clsx(
                        'flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition',
                        active && !isCurrentTeam
                          ? 'bg-gray-50'
                          : 'bg-transparent',
                        isCurrentTeam && 'bg-cyan-50',
                      )}
                      onClick={() => switchTeam(option.id)}
                      disabled={isCurrentTeam || Boolean(switchingTeamId) || isCreatingTeam}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span
                          className={clsx(
                            'mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border',
                            isCurrentTeam
                              ? 'border-cyan-200 bg-cyan-100 text-cyan-700'
                              : 'border-gray-200 bg-gray-50 text-gray-500',
                          )}
                        >
                          {isCurrentTeam ? (
                            <CheckIcon className="h-4 w-4" aria-hidden="true" />
                          ) : option.logo ? (
                            <img
                              src={option.logo}
                              alt=""
                              className="size-full object-contain"
                            />
                          ) : (
                            <BuildingOffice2Icon
                              className="h-4 w-4"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="truncate text-sm font-medium text-gray-900">
                              {option.name}
                            </span>
                            <Chip
                              content={planMeta.label}
                              className={planMeta.className}
                            />
                          </span>
                          <span className="mt-1 block text-xs text-gray-500">
                            {formatCount(option.botCount, 'bot')} ·{' '}
                            {formatRole(option.roles?.[user?.uid])}
                          </span>
                        </span>
                      </span>

                      {isSwitching && (
                        <ArrowPathIcon
                          className="h-4 w-4 animate-spin text-gray-400"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  )}
                </Menu.Item>
              )
            })}
          </div>

          <div className="border-t border-gray-100 p-2">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-3 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-400"
              onClick={createTeam}
              disabled={isCreatingTeam || Boolean(switchingTeamId)}
            >
              {isCreatingTeam ? (
                <ArrowPathIcon
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <PlusIcon className="h-4 w-4" aria-hidden="true" />
              )}
              Create new team
            </button>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  )
}

export default TeamsSelector
