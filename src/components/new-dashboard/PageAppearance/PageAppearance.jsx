import { useMemo, useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import clsx from 'clsx'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import { i18n } from '@/constants/strings.constants'
import { auth } from '@/config/firebase-ui.config'
import { useAuthState } from 'react-firebase-hooks/auth'
import { canUserEditBot } from '@/utils/function.utils'

import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import ModalPrompt from '@/components/ModalPrompt'
import { ref, uploadBytes } from 'firebase/storage'
import { storage } from '@/config/firebase-ui.config'
import { v4 as uuidv4 } from 'uuid'
import AppearancePreview from './Appearance.Preview'
import AppearanceUsage from './Appearance.Usage'
import AppearanceDesign from './Appearance.Design'
import AppearanceContent from './Appearance.Content'
import Workspace from '@new-dashboard/Workspace'
import { decideTextColor, getColorForLightBackground } from '@/utils/colors'
import IconButton from '@new-dashboard/IconButton'
import { CloudArrowUpIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Tooltip from '@/components/Tooltip'
import AppearanceActions from './Appearance.Actions'
import {
    isLeadCollectEnabled,
    sanitizeLeadCollectOptions,
} from '@/lib/leadCollect'

const toWidgetLeadCollectState = (leadCollect) => {
    if (!leadCollect || typeof leadCollect !== 'object') {
        return false
    }

    try {
        const sanitized = sanitizeLeadCollectOptions(leadCollect)
        if (!isLeadCollectEnabled(sanitized)) {
            return false
        }
        const { enabled, ...persistedLeadCollect } = sanitized
        return persistedLeadCollect
    } catch (error) {
        return leadCollect
    }
}

const normalizeHexColor = (value) => {
    if (!value) return null
    const trimmed = value.trim()
    if (!trimmed) return null
    const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`
    if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
        return null
    }
    return normalized
}

const PageAppearance = ({ team, bot, setBot, control: controlProp }) => {
    const router = useRouter()
    const [user] = useAuthState(auth)
    const [errorText, setErrorText] = useState(null)
    const [infoText, setInfoText] = useState(null)
    const [isUpdating, setIsUpdating] = useState(false)
    const [uploading, setUploading] = useState(null)
    const [showUpgrade, setShowUpgrade] = useState(false)
    const [canModify, setModify] = useState(false)
    const [showPromptModal, setShowPromptModal] = useState(false)
    const [activeTab, setActiveTab] = useState('content')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const controlValue = controlProp
        || (Array.isArray(router.query.control) ? router.query.control[0] : router.query.control)
        || 'design'

    //bot settings
    const [allowedDomains, setAllowedDomains] = useState(
        bot.allowedDomains || [],
    )
    const [allowedDomainsText, setAllowedDomainsText] = useState(
        allowedDomains.join(', '),
    )
    const [logo, setLogo] = useState(bot.logo || null)
    const [headerAlignment, setHeaderAlignment] = useState(
        bot.headerAlignment || 'center',
    )
    const [color, setColor] = useState(bot.color || '#1292EE')
    const [colorInput, setColorInput] = useState(bot.color || '#1292EE')
    const [icon, setIcon] = useState(bot.icon || 'default')
    const [alignment, setAlignment] = useState(bot.alignment || 'right')
    const [botIcon, setBotIcon] = useState(bot.botIcon || 'none')
    const [branding, setBranding] = useState(
        bot.branding === undefined ? true : bot.branding,
    )
    const [supportLink, setSupportLink] = useState(bot.supportLink || '')
    const [showButtonLabel, setShowButtonLabel] = useState(
        bot.showButtonLabel || false,
    )
    const [labels, setLabels] = useState(
        bot.labels || i18n[bot.language]?.labels || i18n.en.labels,
    )
    const [hideSources, setHideSources] = useState(bot.hideSources)
    const [showCopyButton, setShowCopyButton] = useState(
        bot.showCopyButton || false,
    )
    const [isAgent, setIsAgent] = useState(
        bot.isAgent === undefined ? false : bot.isAgent, //default to false for old bots
    )
    const [tools, setTools] = useState(
        bot.tools || {
            human_escalation: { enabled: true },
            followup_rating: { enabled: true },
        },
    )
    const [linkSafetyEnabled, setLinkSafetyEnabled] = useState(
        bot.linkSafetyEnabled === true,
    )
    const [imageUploads, setImageUploads] = useState(
        ((bot.imageUploads === undefined || bot.imageUploads) &&
            checkPlanPermission(team, 'standard', 'imageUploads').allowed) ||
            false,
    )
    const [leadCollect, setLeadCollect] = useState(() => {
        if (!bot?.leadCollect) {
            return false
        }

        try {
            return toWidgetLeadCollectState(bot.leadCollect)
        } catch (error) {
            return false
        }
    })
    const [showColorPicker, setShowColorPicker] = useState(false)
    const previousBranding = useRef(branding)
    const previousImageUploads = useRef(imageUploads)
    const previousLeadCollect = useRef(leadCollect)
    const iconRef = useRef(null)
    const avatarRef = useRef(null)
    const logoRef = useRef(null)
    const colorPickerRef = useRef(null)

    const brandLogos = useMemo(() => bot?.brandAnalysis?.logos || [], [bot])
    const brandIcons = useMemo(
        () => brandLogos.filter((logo) => logo.type === 'icon'),
        [brandLogos],
    )
    const brandIconOptions = useMemo(
        () => (brandIcons.length > 0 ? brandIcons : brandLogos),
        [brandIcons, brandLogos],
    )
    const brandColors = useMemo(() => bot?.brandAnalysis?.colors || [], [bot])

    useEffect(() => {
        if (!bot || !team) return

        const nextAllowedDomains = bot.allowedDomains || []
        const nextColor = bot.color || '#1292EE'
        const nextBotIcon = bot.botIcon || 'none'
        const nextBranding = bot.branding === undefined ? true : bot.branding
        const nextIsAgent = bot.isAgent === undefined ? false : bot.isAgent
        const nextLabels =
            bot.labels || i18n[bot.language]?.labels || i18n.en.labels
        const nextTools = bot.tools || {
            human_escalation: { enabled: true },
            followup_rating: { enabled: true },
        }
        const nextImageUploads =
            ((bot.imageUploads === undefined || bot.imageUploads) &&
                checkPlanPermission(team, 'standard', 'imageUploads')
                    .allowed) ||
            false
        const nextLeadCollect = (() => {
            if (!bot?.leadCollect) {
                return false
            }

            try {
                return toWidgetLeadCollectState(bot.leadCollect)
            } catch (error) {
                return false
            }
        })()

        setAllowedDomains(nextAllowedDomains)
        setAllowedDomainsText(nextAllowedDomains.join(', '))
        setLogo(bot.logo || null)
        setHeaderAlignment(bot.headerAlignment || 'center')
        setColor(nextColor)
        setColorInput(nextColor)
        setIcon(bot.icon || 'default')
        setAlignment(bot.alignment || 'right')
        setBotIcon(nextBotIcon)
        setBranding(nextBranding)
        setSupportLink(bot.supportLink || '')
        setShowButtonLabel(bot.showButtonLabel || false)
        setLabels(nextLabels)
        setHideSources(bot.hideSources)
        setShowCopyButton(bot.showCopyButton || false)
        setIsAgent(nextIsAgent)
        setTools(nextTools)
        previousBranding.current = nextBranding
        previousImageUploads.current = nextImageUploads
        previousLeadCollect.current = nextLeadCollect
        setLinkSafetyEnabled(bot.linkSafetyEnabled === true)
        setImageUploads(nextImageUploads)
        setLeadCollect(nextLeadCollect)
    }, [bot?.id, team])

    useEffect(() => {
        if (!team || !user) return
        setModify(canUserEditBot(team, user.uid, bot))
    }, [team, user, bot])

    useEffect(() => {
        if (previousBranding.current === branding) {
            return
        }

        previousBranding.current = branding

        if (
            !branding &&
            !checkPlanPermission(team, 'business', 'branding').allowed
        ) {
            setShowUpgrade(true)
            setBranding(true)
        }
    }, [branding, team])

    useEffect(() => {
        if (previousImageUploads.current === imageUploads) {
            return
        }

        previousImageUploads.current = imageUploads

        if (
            imageUploads &&
            !checkPlanPermission(team, 'standard', 'imageUploads').allowed
        ) {
            setShowUpgrade(true)
            setImageUploads(false)
        }
    }, [imageUploads, team])

    useEffect(() => {
        if (previousLeadCollect.current === leadCollect) {
            return
        }

        previousLeadCollect.current = leadCollect

        if (
            isLeadCollectEnabled(leadCollect) &&
            !checkPlanPermission(team, 'personal', 'leadCollect').allowed
        ) {
            setShowUpgrade(true)
            setLeadCollect(false)
        }
    }, [leadCollect, team])

    useEffect(() => {
        if (icon === 'custom') {
            //open file picker
            iconRef.current.click()
        }
        if (botIcon === 'custom') {
            //open file picker
            avatarRef.current.click()
        }
    }, [icon, botIcon])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                colorPickerRef.current &&
                !colorPickerRef.current.contains(event.target)
            ) {
                setShowColorPicker(false)
            }
        }

        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [showColorPicker])

    const isDirty = useMemo(() => {
        const initialBotIcon = bot.botIcon || 'none'
        const initialBranding = bot.branding === undefined ? true : bot.branding
        const initialIsAgent = bot.isAgent === undefined ? false : bot.isAgent
        const initialImageUploads =
            ((bot.imageUploads === undefined || bot.imageUploads) &&
                checkPlanPermission(team, 'standard', 'imageUploads')
                    .allowed) ||
            false
        const initialLabels =
            bot.labels || i18n[bot.language]?.labels || i18n.en.labels
        const initialTools = bot.tools || {
            human_escalation: { enabled: true },
            followup_rating: { enabled: true },
        }
        const initialLeadCollect = (() => {
            if (!bot?.leadCollect) return false
            try {
                return toWidgetLeadCollectState(bot.leadCollect)
            } catch (error) {
                return false
            }
        })()

        if (color !== (bot.color || '#1292EE')) return true
        if (icon !== (bot.icon || 'default')) return true
        if (alignment !== (bot.alignment || 'right')) return true
        if (botIcon !== initialBotIcon) return true
        if (branding !== initialBranding) return true
        if (supportLink !== (bot.supportLink || '')) return true
        if (showButtonLabel !== (bot.showButtonLabel || false)) return true
        if (headerAlignment !== (bot.headerAlignment || 'center')) return true
        if (hideSources !== bot.hideSources) return true
        if (showCopyButton !== (bot.showCopyButton || false)) return true
        if (isAgent !== initialIsAgent) return true
        if (imageUploads !== initialImageUploads) return true
        if (logo !== (bot.logo || null)) return true
        if (linkSafetyEnabled !== (bot.linkSafetyEnabled === true)) return true

        if (
            JSON.stringify(allowedDomains) !==
            JSON.stringify(bot.allowedDomains || [])
        )
            return true
        if (JSON.stringify(labels) !== JSON.stringify(initialLabels))
            return true
        if (JSON.stringify(tools) !== JSON.stringify(initialTools)) return true
        if (JSON.stringify(leadCollect) !== JSON.stringify(initialLeadCollect))
            return true

        return false
    }, [
        bot,
        team,
        color,
        icon,
        alignment,
        botIcon,
        branding,
        supportLink,
        showButtonLabel,
        headerAlignment,
        hideSources,
        showCopyButton,
        isAgent,
        imageUploads,
        logo,
        allowedDomains,
        labels,
        tools,
        leadCollect,
        linkSafetyEnabled,
    ])

    useEffect(() => {
        const handleBrowseAway = (url) => {
            if (!isDirty || isUpdating) return
            if (
                window.confirm(
                    'You have unsaved changes. Are you sure you want to leave?',
                )
            )
                return
            router.events.emit('routeChangeError')
            throw 'routeChange aborted.'
        }

        const handleBeforeUnload = (e) => {
            if (!isDirty || isUpdating) return
            e.preventDefault()
            e.returnValue = ''
        }

        router.events.on('routeChangeStart', handleBrowseAway)
        window.addEventListener('beforeunload', handleBeforeUnload)

        return () => {
            router.events.off('routeChangeStart', handleBrowseAway)
            window.removeEventListener('beforeunload', handleBeforeUnload)
        }
    }, [isDirty, isUpdating, router])

    const widgetRootStyle = useMemo(() => {
        const widgetColor = color || '#1292EE'

        return {
            '--mybot-color': widgetColor,
            '--mybot-color-800': `color-mix(in srgb, ${widgetColor}, black 20%)`,
            '--mybot-text': decideTextColor(widgetColor),
            '--mybot-logo-on-light': getColorForLightBackground(widgetColor),
            '--mybot-shadow': `color-mix(in srgb, ${widgetColor} 20%, transparent)`,
            '--mybot-logo': logo || '',
            '--mybot-header-alignment': headerAlignment,
            '--mybot-button-alignment': alignment,
            '--mybot-button-icon': icon,
            '--mybot-avatar': botIcon,
            '--mybot-show-button-label': showButtonLabel ? 'true' : 'false',
            '--mybot-branding': branding ? 'true' : 'false',
            '--mybot-support-link': supportLink || '',
            '--mybot-hide-sources': hideSources ? 'true' : 'false',
            '--mybot-show-copy-button': showCopyButton ? 'true' : 'false',
            '--mybot-is-agent': isAgent ? 'true' : 'false',
            '--mybot-image-uploads': imageUploads ? 'true' : 'false',
        }
    }, [
        alignment,
        botIcon,
        branding,
        color,
        headerAlignment,
        hideSources,
        icon,
        imageUploads,
        isAgent,
        logo,
        showButtonLabel,
        showCopyButton,
        supportLink,
    ])

    const updateColor = (nextColor) => {
        setColor(nextColor)
        setColorInput(nextColor)
    }

    const handleColorInputChange = (event) => {
        const nextValue = event.target.value
        setColorInput(nextValue)
        const normalized = normalizeHexColor(nextValue)
        if (normalized) {
            updateColor(normalized)
        }
    }

    const handleColorInputBlur = () => {
        const normalized = normalizeHexColor(colorInput)
        if (normalized) {
            updateColor(normalized)
        } else {
            setColorInput(color)
        }
    }

    function handleFileChange(e, type) {
        const file = e.target.files[0]
        if (file) {
            setUploading(type)
            //upload to firebase cloud storage
            //generate uuid for file name with same extension
            const uuid = uuidv4()
            const extension = file.name.split('.').pop()
            //move the file to the correct location in bucket
            const filepath = `teams/${team.id}/bots/${bot.id}/images/${uuid}.${extension}`
            const storageRef = ref(storage, filepath)

            uploadBytes(storageRef, file)
                .then((snapshot) => {
                    //get public url for file
                    const url =
                        process.env.NODE_ENV === 'development'
                            ? 'https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/' +
                              encodeURIComponent(filepath) +
                              '?alt=media'
                            : 'https://cdn.docsbot.ai/' +
                              encodeURIComponent(filepath) +
                              '?alt=media'
                    //const url = 'https://firebasestorage.googleapis.com/v0/b/docsbot-test-c2482.appspot.com/o/' + encodeURIComponent(filepath) + '?alt=media'
                    if (type === 'icon') setIcon(url)
                    if (type === 'avatar') setBotIcon(url)
                    if (type === 'logo') setLogo(url)
                    setUploading(null)
                })
                .catch((error) => {
                    console.warn(error)
                    setUploading(null)
                    setErrorText(
                        'Error uploading file, please try again. If the problem persists, try logging out then back in again.',
                    )
                })
        }
    }

    async function updateBot() {
        setAllowedDomainsText(allowedDomains.join(', '))
        setErrorText('')
        setIsUpdating(true)

        const botSettings = {
            allowedDomains,
            color,
            icon,
            alignment,
            botIcon: botIcon === 'none' ? false : botIcon,
            branding,
            supportLink,
            showButtonLabel,
            labels,
            hideSources,
            showCopyButton,
            logo,
            headerAlignment,
            isAgent,
            tools,
            imageUploads,
            leadCollect,
            linkSafetyEnabled,
        }

        const urlParams = ['teams', team.id, 'bots', bot.id]
        const apiPath = '/api/' + urlParams.join('/')

        const response = await fetch(apiPath, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(botSettings),
        })
        if (response.ok) {
            const data = await response.json()
            setIsUpdating(false)
            if (setBot) setBot(data)
        } else {
            try {
                const data = await response.json()
                setErrorText(
                    data.message || 'Something went wrong, please try again.',
                )
            } catch (e) {
                setErrorText(response.status + ', please try again.')
            }
            setIsUpdating(false)
        }
    }

    if (!bot) return null

    const title = [bot.name, 'Widget']

    // Function to handle agent mode toggle
    const handleAgentToggle = (enabled) => {
        setIsAgent(enabled)
        // If agent mode is being enabled and there's no agent prompt, show the prompt modal
        if (enabled && !bot.agentPrompt) {
            setShowPromptModal(true)
        }
    }

    const SaveChanges = (
        <Tooltip content="Save Changes">
            <IconButton
                name="submit-form"
                {...(isUpdating
                    ? { icon: LoadingSpinner }
                    : { icon: CloudArrowUpIcon })}
                label="Save Changes"
                onClick={(event) => {
                    event.preventDefault()
                    updateBot()
                }}
                disabled={isUpdating || !canModify}
            />
        </Tooltip>
    )

    const CloseSidebar = (
        <IconButton
            icon={XMarkIcon}
            label="Close"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
        />
    )

    const SidebarActions = (
        <div className="flex items-center gap-2">
            {SaveChanges}
            {CloseSidebar}
        </div>
    )

    const dataContent = [
        {
            id: 'design',
            title: 'Design',
            content: (
                <AppearanceDesign
                    color={color}
                    colorInput={colorInput}
                    showColorPicker={showColorPicker}
                    setShowColorPicker={setShowColorPicker}
                    colorPickerRef={colorPickerRef}
                    updateColor={updateColor}
                    handleColorInputChange={handleColorInputChange}
                    handleColorInputBlur={handleColorInputBlur}
                    brandColors={brandColors}
                    botIcon={botIcon}
                    setBotIcon={setBotIcon}
                    isUpdating={isUpdating}
                    uploading={uploading}
                    brandIconOptions={brandIconOptions}
                    avatarRef={avatarRef}
                    handleFileChange={handleFileChange}
                    brandLogos={brandLogos}
                    logo={logo}
                    setLogo={setLogo}
                    logoRef={logoRef}
                    headerAlignment={headerAlignment}
                    setHeaderAlignment={setHeaderAlignment}
                    icon={icon}
                    setIcon={setIcon}
                    iconRef={iconRef}
                    alignment={alignment}
                    setAlignment={setAlignment}
                    showButtonLabel={showButtonLabel}
                    setShowButtonLabel={setShowButtonLabel}
                    labels={labels}
                    setLabels={setLabels}
                />
            ),
        },
        {
            id: 'content',
            title: 'Content',
            content: (
                <AppearanceContent
                    isAgent={isAgent}
                    labels={labels}
                    setLabels={setLabels}
                    isUpdating={isUpdating}
                    team={team}
                    branding={branding}
                    setBranding={setBranding}
                    hideSources={hideSources}
                    setHideSources={setHideSources}
                    showCopyButton={showCopyButton}
                    setShowCopyButton={setShowCopyButton}
                    linkSafetyEnabled={linkSafetyEnabled}
                    setLinkSafetyEnabled={setLinkSafetyEnabled}
                    imageUploads={imageUploads}
                    setImageUploads={setImageUploads}
                />
            ),
        },
        {
            id: 'actions',
            title: 'Actions',
            content: (
                <AppearanceActions
                    isAgent={isAgent}
                    handleAgentToggle={handleAgentToggle}
                    setShowPromptModal={setShowPromptModal}
                    labels={labels}
                    setLabels={setLabels}
                    isUpdating={isUpdating}
                    tools={tools}
                    team={team}
                    setTools={setTools}
                    supportLink={supportLink}
                    setSupportLink={setSupportLink}
                    leadCollect={leadCollect}
                    setLeadCollect={setLeadCollect}
                    toWidgetLeadCollectState={toWidgetLeadCollectState}
                    setShowUpgrade={setShowUpgrade}
                />
            ),
        },
        {
            id: 'deploy',
            title: 'Deploy',
            content: (
                <AppearanceUsage
                    bot={bot}
                    team={team}
                    allowedDomainsText={allowedDomainsText}
                    setAllowedDomainsText={setAllowedDomainsText}
                    setAllowedDomains={setAllowedDomains}
                    isUpdating={isUpdating}
                />
            ),
        },
    ]

    const activeAppearanceTab =
        dataContent.find((tab) => tab.id === controlValue) || dataContent[0]
    const appearanceTitle = `Widget ${activeAppearanceTab?.title || 'Design'}`

    return (
        <div
            className="h-full min-h-0 flex-1 flex-col px-4 py-4"
            style={widgetRootStyle}
        >
            <div className="relative flex h-full min-h-0 flex-1">
                <IconButton
                    icon={PencilIcon}
                    label="Open Appearance Settings"
                    className="absolute left-0 top-0 z-10 lg:hidden"
                    onClick={() => {
                        setSidebarOpen(true)
                    }}
                />

                <Workspace.Sidebar
                    title={appearanceTitle}
                    action={SidebarActions}
                    className={clsx(
                        'fixed left-0 top-0 z-[1000000] h-full !max-w-none md:absolute md:z-10 md:!max-w-[420px] lg:!max-w-[60%]',
                        sidebarOpen
                            ? 'flex w-full lg:w-auto'
                            : 'hidden lg:flex',
                    )}
                    bodyClassName="overflow-y-hidden"
                >
                    <ModalCheckout
                        team={team}
                        open={showUpgrade}
                        setOpen={setShowUpgrade}
                    />

                    {showPromptModal ? (
                        <ModalPrompt
                            team={team}
                            integrations={bot.integrations || []}
                            bot={bot}
                            open={showPromptModal}
                            setOpen={setShowPromptModal}
                        />
                    ) : (
                    <form
                        className="flex h-full min-h-0 flex-col"
                        onSubmit={(e) => {
                            e.preventDefault()
                        }}
                    >
                        {(!isAgent || errorText) && (
                            <div className="mt-2 px-6">
                                <Alert title={errorText} type="error" />

                                {!isAgent && (
                                    <Alert
                                        title="Agent Mode is here!"
                                        type="info"
                                    >
                                        When ready, you can enable our new{' '}
                                        <Link
                                            href="https://docsbot.ai/article/docsbot-goes-agentic-ai-agents-for-your-team-customers"
                                            target="_blank"
                                            className="text-blue-600 underline hover:text-blue-500"
                                        >
                                            Agentic mode
                                        </Link>
                                        , which provides more intelligent and
                                        contextual responses, tool calling to
                                        perform actions, conversaton view, and
                                        so much more! When enabling,{' '}
                                        <strong>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowPromptModal(true)
                                                }
                                                className="text-blue-600 underline hover:text-blue-500"
                                            >
                                                set your agent instructions
                                            </button>{' '}
                                            and please test!
                                        </strong>{' '}
                                        Start with a preset role and adjust,
                                        then update or remove any instructions
                                        that may conflict.
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAgentToggle(true)
                                            }
                                            className="mt-2 block rounded-lg border border-blue-600 px-4 py-2 font-medium transition hover:bg-blue-100"
                                            disabled={isUpdating}
                                        >
                                            Enable Agent Mode
                                        </button>
                                    </Alert>
                                )}
                            </div>
                        )}

                        <div className="min-h-0 flex-1">
                            <div className="h-full overflow-y-auto p-6">
                                {activeAppearanceTab?.content}
                            </div>
                        </div>
                    </form>
                    )}
                </Workspace.Sidebar>

                <div className="flex h-full min-h-0 flex-1 justify-center py-10 pl-0 lg:pl-[60%]">
                    <div className="relative flex h-full min-h-0 w-full max-w-4xl flex-col items-center px-6">
                        {/* <AppearanceResize> */}
                        <AppearancePreview
                            bot={bot}
                            color={color}
                            logo={logo}
                            headerAlignment={headerAlignment}
                            alignment={alignment}
                            branding={branding}
                            icon={icon}
                            botIcon={botIcon}
                            showButtonLabel={showButtonLabel}
                            labels={labels}
                            hideSources={hideSources}
                            showCopyButton={showCopyButton}
                            supportLink={supportLink}
                            isAgent={isAgent}
                            tools={tools}
                            imageUploads={imageUploads}
                            leadCollect={leadCollect}
                        />
                        {/* </AppearanceResize> */}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PageAppearance
