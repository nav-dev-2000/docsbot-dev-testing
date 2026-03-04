import { useEffect, useMemo, useState } from 'react'
import { useAuthState } from 'react-firebase-hooks/auth'

import PageChatChat from './PageChat.Chat'

import { auth } from '@/config/firebase-ui.config'
import { i18n } from '@/constants/strings.constants'
import { checkPlanPermission } from '@/utils/helpers'
import { decideTextColor, getColorForLightBackground } from '@/utils/colors'
import { canUserEditBot } from '@/utils/function.utils'

const PageChat = ({ team, bot }) => {
    const [user] = useAuthState(auth)
    const [canModify, setCanModify] = useState(false)

    const widgetSettings = useMemo(() => {
        const labels =
            bot?.labels || i18n[bot?.language]?.labels || i18n.en.labels
        const tools = bot?.tools || {
            human_escalation: { enabled: true },
            followup_rating: { enabled: true },
        }
        const imageUploads =
            ((bot?.imageUploads === undefined || bot?.imageUploads) &&
                checkPlanPermission(team, 'standard', 'imageUploads')
                    .allowed) ||
            false

        return {
            color: bot?.color || '#1292EE',
            logo: bot?.logo || '',
            headerAlignment: bot?.headerAlignment || 'center',
            alignment: bot?.alignment || 'right',
            icon: bot?.icon || 'default',
            botIcon: bot?.botIcon || 'none',
            branding: bot?.branding === undefined ? true : bot?.branding,
            supportLink: bot?.supportLink || '',
            showButtonLabel: bot?.showButtonLabel || false,
            labels,
            hideSources: bot?.hideSources || false,
            showCopyButton: bot?.showCopyButton || false,
            isAgent: bot?.isAgent === undefined ? false : bot?.isAgent,
            tools,
            imageUploads,
        }
    }, [bot, team])

    const widgetRootStyle = useMemo(
        () => ({
            '--mybot-color': widgetSettings.color,
            '--mybot-color-800': `color-mix(in srgb, ${widgetSettings.color}, black 20%)`,
            '--mybot-text': decideTextColor(widgetSettings.color),
            '--mybot-logo-on-light': getColorForLightBackground(
                widgetSettings.color,
            ),
            '--mybot-shadow': `color-mix(in srgb, ${widgetSettings.color} 20%, transparent)`,
            '--mybot-logo': widgetSettings.logo || '',
            '--mybot-header-alignment': widgetSettings.headerAlignment,
            '--mybot-button-alignment': widgetSettings.alignment,
            '--mybot-button-icon': widgetSettings.icon,
            '--mybot-avatar': widgetSettings.botIcon,
            '--mybot-show-button-label': widgetSettings.showButtonLabel
                ? 'true'
                : 'false',
            '--mybot-branding': widgetSettings.branding ? 'true' : 'false',
            '--mybot-support-link': widgetSettings.supportLink || '',
            '--mybot-hide-sources': widgetSettings.hideSources
                ? 'true'
                : 'false',
            '--mybot-show-copy-button': widgetSettings.showCopyButton
                ? 'true'
                : 'false',
            '--mybot-is-agent': widgetSettings.isAgent ? 'true' : 'false',
            '--mybot-image-uploads': widgetSettings.imageUploads
                ? 'true'
                : 'false',
        }),
        [widgetSettings],
    )

    const widgetBot = useMemo(() => {
        if (!bot) return bot

        return {
            ...bot,
            labels: widgetSettings.labels,
        }
    }, [bot, widgetSettings.labels])

    useEffect(() => {
        if (!team || !user) return
        setCanModify(canUserEditBot(team, user.uid))
    }, [team, user])

    return (
        <div
            className="flex min-h-full flex-1 flex-col bg-white p-8"
            style={widgetRootStyle}
            suppressHydrationWarning
        >
            <PageChatChat
                team={team}
                bot={bot}
                canModify={canModify}
                widgetBot={widgetBot}
                widgetSettings={widgetSettings}
                widgetAccentColor={widgetSettings.color}
            />
        </div>
    )
}

export default PageChat
