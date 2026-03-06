import React from 'react'
import { i18n } from '@/constants/strings.constants'
import { getModelLabel } from '@/components/FormBotNew'

import Link from 'next/link'
import Tooltip from '@/components/Tooltip'
import TipsButton from '@new-dashboard/TipsButton'

import OpenAIIcon from '@/components/OpenAIIcon'
import CohereIcon from '@/components/CohereIcon'
import {
    CubeTransparentIcon,
    GlobeAmericasIcon,
    GlobeEuropeAfricaIcon,
} from '@heroicons/react/24/outline'

const getEmbeddingLabel = (bot) => {
    if (!bot?.embeddingModel) return '—'
    const m = bot.embeddingModel
    if (m === 'embed-multilingual-v3.0') return 'v3'
    if (m === 'embed-v4.0') return 'v4'
    if (m === 'text-embedding-3-large') return 'v3 Large'
    if (m === 'text-embedding-3-small') return 'v3 Small'
    return 'v2'
}

const getEmbeddingIcon = (bot) => {
    if (!bot?.embeddingModel) return OpenAIIcon
    const m = bot.embeddingModel
    if (m === 'embed-multilingual-v3.0' || m === 'embed-v4.0') return CohereIcon
    return OpenAIIcon
}

/** Tooltip title for embedding model (same as EmbeddingModel in BotCard). */
const getEmbeddingTooltip = (bot) => {
    if (!bot?.embeddingModel) return null
    const m = bot.embeddingModel
    if (m === 'embed-multilingual-v3.0') return 'Cohere Embeddings v3'
    if (m === 'embed-v4.0') return 'Cohere Embeddings v4'
    if (m === 'text-embedding-3-large') return 'OpenAI Embeddings Large v3'
    if (m === 'text-embedding-3-small') return 'OpenAI Embeddings Small v3'
    return 'OpenAI Embeddings Ada v2'
}

/** Resolves bot data region. U.S. only when vectorDatabase is turbopuffer and region is US; otherwise EU, or US when region is empty and team has custom Weaviate. */
const getBotRegion = (bot, team) => {
    const r = (bot?.region || '').toUpperCase()
    if (r === 'EU') return 'EU'
    if (
        r === 'US' &&
        (bot?.vectorDatabase || '').toLowerCase() === 'turbopuffer'
    )
        return 'US'
    const hasCustomWeaviate = !!(team?.weaviateUrl || team?.weaviateApiKey)
    return hasCustomWeaviate ? 'US' : 'EU'
}

/** Tooltip for region row; mentions custom vector database when U.S. is from custom Weaviate. */
const getBotRegionTooltip = (bot, team) => {
    const region = getBotRegion(bot, team)
    if (region === 'EU') return 'Data region: Europe'
    const r = (bot?.region || '').toUpperCase()
    const isTurbopufferUs =
        r === 'US' &&
        (bot?.vectorDatabase || '').toLowerCase() === 'turbopuffer'
    if (isTurbopufferUs) return 'Data region: U.S.'
    return 'Data region: U.S. (custom vector database)'
}

const PageChatOverview = ({ team, bot }) => {
    const botId = bot?.id
    const createdAtLabel = bot?.createdAt
        ? new Date(bot.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              timeZone: 'UTC',
          })
        : null

    return (
        <TipsButton
            icon={CubeTransparentIcon}
            title="Bot Overview"
            color="cyan"
            position="right"
        >
            <p className="mb-2 text-sm font-semibold text-gray-800">Activity</p>
            <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={`/app/bots/${botId}/configure/sources`}
                        shallow
                        className="font-medium text-cyan-600 hover:text-cyan-800"
                    >
                        Sources
                    </Link>
                    <span className="font-semibold text-gray-700">
                        {bot?.sourceCount}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={`/app/bots/${botId}/configure/sources`}
                        shallow
                        className="font-medium text-cyan-600 hover:text-cyan-800"
                    >
                        Indexed pages
                    </Link>
                    <span className="font-semibold text-gray-700">
                        {Math.max(0, bot?.pageCount ?? 0)}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={`/app/bots/${botId}/analytics/questions`}
                        shallow
                        className="font-medium text-cyan-600 hover:text-cyan-800"
                    >
                        Messages
                    </Link>
                    <span className="font-semibold text-gray-700">
                        {bot?.questionCount}
                    </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={`/app/bots/${botId}/research`}
                        shallow
                        className="font-medium text-cyan-600 hover:text-cyan-800"
                    >
                        Research tasks
                    </Link>
                    <span className="font-semibold text-gray-700">
                        {bot?.researchCount || 0}
                    </span>
                </div>
            </div>

            <p className="mb-2 text-sm font-semibold text-gray-800">
                Configuration
            </p>
            <div className="mb-4 space-y-2">
                <Link
                    href={`/app/bots/${botId}/configure/system`}
                    shallow
                    className="flex items-center justify-between gap-3 font-medium text-cyan-600 hover:text-cyan-800"
                >
                    <span>Visibility</span>
                    <span className="font-semibold text-gray-700">
                        {bot?.privacy
                            ? bot.privacy.charAt(0).toUpperCase() +
                              bot.privacy.slice(1).toLowerCase()
                            : '—'}
                    </span>
                </Link>
                <Link
                    href={`/app/bots/${botId}/configure/system`}
                    shallow
                    className="flex items-center justify-between gap-3 font-medium text-cyan-600 hover:text-cyan-800"
                >
                    <span>Language</span>
                    <span className="font-semibold text-gray-700">
                        {i18n[bot?.language]?.name ?? bot?.language ?? '—'}
                    </span>
                </Link>
                <Link
                    href={`/app/bots/${botId}/configure/system#model-section`}
                    shallow
                    className="flex items-center justify-between gap-3 font-medium text-cyan-600 hover:text-cyan-800"
                >
                    <span>Model</span>
                    <span className="font-semibold text-gray-700">
                        {bot?.model ? getModelLabel(bot.model) : '—'}
                    </span>
                </Link>
                <Link
                    href="/documentation/doc/understanding-embedding-models-in-docsbot"
                    target="_blank"
                    className="flex items-center justify-between gap-3 font-medium text-cyan-600 hover:text-cyan-800"
                >
                    <span>Embedding</span>
                    {getEmbeddingTooltip(bot) ? (
                        <Tooltip content={getEmbeddingTooltip(bot)}>
                            <span className="flex items-center font-semibold text-gray-700">
                                {(() => {
                                    const EmbeddingIcon = getEmbeddingIcon(bot)
                                    return (
                                        <EmbeddingIcon
                                            className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                                            aria-hidden="true"
                                        />
                                    )
                                })()}
                                {bot ? getEmbeddingLabel(bot) : '—'}
                            </span>
                        </Tooltip>
                    ) : (
                        <span className="flex items-center font-semibold text-gray-700">
                            {(() => {
                                const EmbeddingIcon = getEmbeddingIcon(bot)
                                return (
                                    <EmbeddingIcon
                                        className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                                        aria-hidden="true"
                                    />
                                )
                            })()}
                            {bot ? getEmbeddingLabel(bot) : '—'}
                        </span>
                    )}
                </Link>
                <div className="flex items-center justify-between gap-3 font-medium text-gray-700">
                    <span>Region</span>
                    <Tooltip content={getBotRegionTooltip(bot, team)}>
                        <span className="flex items-center font-semibold text-gray-700">
                            {getBotRegion(bot, team) === 'EU' ? (
                                <GlobeEuropeAfricaIcon
                                    className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                                    aria-hidden="true"
                                />
                            ) : (
                                <GlobeAmericasIcon
                                    className="mr-1.5 h-4 w-4 flex-shrink-0 text-gray-400"
                                    aria-hidden="true"
                                />
                            )}
                            {getBotRegion(bot, team) === 'EU'
                                ? 'Europe'
                                : 'U.S.'}
                        </span>
                    </Tooltip>
                </div>
            </div>

            {createdAtLabel && (
                <p className="font-semibold">Date created: {createdAtLabel}</p>
            )}
        </TipsButton>
    )
}

export default PageChatOverview
