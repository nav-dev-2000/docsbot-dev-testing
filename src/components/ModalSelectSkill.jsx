import { Fragment, useMemo, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import SkillListIcon from '@/components/SkillListIcon'
import {
    BuildingOffice2Icon,
    GlobeAltIcon,
    MagnifyingGlassIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { formatSkillNameDisplay } from '@/lib/skill-name-normalize'
import Tooltip from '@/components/Tooltip'

const skillRecordId = (skill) =>
    String(skill?.skillName || skill?.draftId || skill?.id || skill?.name || '').trim()

function SkillDisabledReasons({ reasons = [] }) {
    if (!Array.isArray(reasons) || reasons.length === 0) return null

    return (
        <div className="mt-2 space-y-1 pl-[3.25rem] text-left">
            {reasons.map((reason) => (
                <p key={reason.key} className="text-xs text-amber-700">
                    {reason.message}{' '}
                    {reason.href ? (
                        <Link
                            href={reason.href}
                            className="font-medium underline hover:text-amber-800"
                        >
                            {reason.linkLabel}
                        </Link>
                    ) : null}
                </p>
            ))}
        </div>
    )
}

export default function ModalSelectSkill({
    bot,
    skills = [],
    open,
    setOpen,
    enabledSkillIds = [],
    onEnableSkill,
    loading = false,
    errorText = '',
}) {
    const router = useRouter()
    const [search, setSearch] = useState('')

    const filteredSkills = useMemo(() => {
        const normalizedQuery = search.trim().toLowerCase()
        if (!normalizedQuery) return skills

        return skills.filter((skill) => {
            const name = (skill.name || '').toLowerCase()
            const id = skillRecordId(skill).toLowerCase()
            const description = (skill.description || '').toLowerCase()
            return (
                name.includes(normalizedQuery) ||
                id.includes(normalizedQuery) ||
                description.includes(normalizedQuery)
            )
        })
    }, [skills, search])

    return (
        <Transition.Root show={open} as={Fragment}>
            <Dialog as="div" className="relative z-modal" onClose={setOpen}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 translate-y-0 sm:scale-95"
                            enterTo="opacity-100 translate-y-0 sm:scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                            leaveTo="opacity-0 translate-y-0 sm:scale-95"
                        >
                            <Dialog.Panel className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:p-6">
                                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={() => setOpen(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                    </button>
                                </div>
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 w-full text-center sm:mt-0 sm:text-left">
                                        <Dialog.Title
                                            as="h3"
                                            className="text-base font-semibold leading-6 text-gray-900"
                                        >
                                            Add Skill
                                        </Dialog.Title>
                                        <div className="mt-4">
                                            <label htmlFor="widget-skill-search" className="sr-only">
                                                Search skills
                                            </label>
                                            <div className="relative">
                                                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    id="widget-skill-search"
                                                    type="text"
                                                    value={search}
                                                    onChange={(e) => setSearch(e.target.value)}
                                                    placeholder="Search"
                                                    className="w-full rounded-lg border-1 border-gray-300 py-1 pl-8 pr-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-2 max-h-96 w-full space-y-2 overflow-y-auto">
                                            {loading ? (
                                                <p className="py-2 text-center text-sm text-gray-500">
                                                    Loading skills…
                                                </p>
                                            ) : errorText ? (
                                                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                                    {errorText}
                                                </p>
                                            ) : skills.length === 0 ? (
                                                <p className="py-2 text-center text-sm text-gray-500">
                                                    No skills available yet.
                                                </p>
                                            ) : filteredSkills.length === 0 ? (
                                                <p className="py-2 text-center text-sm text-gray-500">
                                                    No skills match your search.
                                                </p>
                                            ) : (
                                                filteredSkills.map((skill) => {
                                                    const id = skillRecordId(skill)
                                                    const isEnabled = enabledSkillIds.includes(id)
                                                    const disabledReasons = Array.isArray(skill.disabledReasons)
                                                        ? skill.disabledReasons
                                                        : []
                                                    const isRowDisabled = isEnabled || disabledReasons.length > 0

                                                    return (
                                                        <div
                                                            key={id}
                                                            className={`w-full rounded-lg border p-3 ${
                                                                isRowDisabled
                                                                    ? 'border-gray-200 bg-gray-50'
                                                                    : 'border-gray-200 bg-white transition-all hover:border-cyan-500 hover:shadow-sm'
                                                            }`}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (!isRowDisabled) {
                                                                        onEnableSkill(id)
                                                                    }
                                                                }}
                                                                disabled={isRowDisabled}
                                                                className={`flex w-full items-center justify-between gap-3 ${
                                                                    isRowDisabled
                                                                        ? 'cursor-not-allowed opacity-60'
                                                                        : ''
                                                                }`}
                                                            >
                                                                <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                    <SkillListIcon
                                                                        icon={skill.icon}
                                                                        networkPolicy={skill.networkPolicy}
                                                                        envBindings={skill.envBindings}
                                                                        authProviders={skill.authProviders}
                                                                    />
                                                                    <div className="min-w-0 text-left">
                                                                        <p className="min-w-0 truncate text-sm font-medium text-gray-900">
                                                                            {skill.name || formatSkillNameDisplay(id, id)}
                                                                        </p>
                                                                        <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                                                                            {skill.description || 'No description yet.'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex shrink-0 items-center gap-2">
                                                                    <Tooltip
                                                                        content={
                                                                            skill.internal
                                                                                ? 'Internal team use only'
                                                                                : 'Customer-facing'
                                                                        }
                                                                        zIndex={1000001}
                                                                    >
                                                                        <span
                                                                            className={`inline-flex h-8 w-8 shrink-0 cursor-help items-center justify-center ${
                                                                                skill.internal
                                                                                    ? 'text-gray-600'
                                                                                    : 'text-cyan-700'
                                                                            }`}
                                                                            role="img"
                                                                            aria-label={
                                                                                skill.internal
                                                                                    ? 'Internal team use only'
                                                                                    : 'Customer-facing'
                                                                            }
                                                                        >
                                                                            {skill.internal ? (
                                                                                <BuildingOffice2Icon
                                                                                    className="h-4 w-4"
                                                                                    aria-hidden
                                                                                />
                                                                            ) : (
                                                                                <GlobeAltIcon
                                                                                    className="h-4 w-4"
                                                                                    aria-hidden
                                                                                />
                                                                            )}
                                                                        </span>
                                                                    </Tooltip>
                                                                    {isEnabled ? (
                                                                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                                                                            Added
                                                                        </span>
                                                                    ) : null}
                                                                </div>
                                                            </button>
                                                            {!isEnabled ? (
                                                                <SkillDisabledReasons reasons={disabledReasons} />
                                                            ) : null}
                                                        </div>
                                                    )
                                                })
                                            )}
                                        </div>

                                        <div className="mt-2 flex flex-row items-stretch gap-2 border-t border-gray-100 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setOpen(false)
                                                    if (bot?.id) {
                                                        router.push(`/app/bots/${bot.id}/configure/skills`)
                                                    } else {
                                                        router.push('/app/bots')
                                                    }
                                                }}
                                                className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm font-medium text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-100"
                                            >
                                                <PlusIcon className="h-5 w-5 shrink-0" />
                                                Create or manage skills
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setOpen(false)}
                                                className="shrink-0 rounded-lg bg-cyan-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                                            >
                                                Done
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
