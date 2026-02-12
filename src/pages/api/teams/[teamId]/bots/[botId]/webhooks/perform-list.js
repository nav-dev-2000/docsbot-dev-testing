import { configureFirebaseApp } from '@/config/firebase-server.config'
import { getBot } from '@/lib/dbQueries'
import userTeamCheck from '@/lib/userTeamCheck'
import { canUserViewBot } from '@/utils/function.utils'
import {
  WEBHOOK_EVENT_LEAD_CREATED,
  WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
  WEBHOOK_EVENT_CONVERSATION_ESCALATED,
  WEBHOOK_EVENT_CONVERSATION_RATED,
} from '@/lib/webhooks'

const SAMPLE_LEAD_PAYLOADS = [
  {
    event: WEBHOOK_EVENT_LEAD_CREATED,
    teamId: '__teamId__',
    botId: '__botId__',
    lead: {
      id: 'conv_sample_001',
      createdAt: '2026-02-10T14:30:00.000Z',
      updatedAt: null,
      metadata: {
        name: 'Jane Doe',
        email: 'jane@example.com',
      },
      ip: 'hashed-ip',
    },
  },
  {
    event: WEBHOOK_EVENT_LEAD_CREATED,
    teamId: '__teamId__',
    botId: '__botId__',
    lead: {
      id: 'conv_sample_002',
      createdAt: '2026-02-10T15:00:00.000Z',
      updatedAt: null,
      metadata: {
        name: 'John Smith',
        email: 'john@example.com',
        company: 'Acme Corp',
      },
      ip: 'hashed-ip',
    },
  },
  {
    event: WEBHOOK_EVENT_LEAD_CREATED,
    teamId: '__teamId__',
    botId: '__botId__',
    lead: {
      id: 'conv_sample_003',
      createdAt: '2026-02-10T15:30:00.000Z',
      updatedAt: '2026-02-10T15:35:00.000Z',
      metadata: {
        name: 'Alex Chen',
        email: 'alex@example.com',
      },
      ip: 'hashed-ip',
    },
  },
]

const SAMPLE_ESCALATED_PAYLOADS = [
  {
    event: WEBHOOK_EVENT_CONVERSATION_ESCALATED,
    teamId: '__teamId__',
    botId: '__botId__',
    conversation: {
      id: 'conv_sample_001',
      createdAt: '2026-02-10T15:12:44.000000',
      updatedAt: '2026-02-11T18:43:01.000000',
      metadata: {
        email: 'user@example.com',
        plan: 'pro',
      },
      ip: 'a1b2c3d4e5f6...',
      escalatedAt: '2026-02-11T18:43:01.123456',
      resolved: 'unresolved',
      escalated: 'handled',
    },
  },
]

const SAMPLE_RATED_PAYLOADS = [
  {
    event: WEBHOOK_EVENT_CONVERSATION_RATED,
    teamId: '__teamId__',
    botId: '__botId__',
    conversation: {
      id: 'conv_sample_001',
      createdAt: '2026-02-10T15:12:44.000000',
      updatedAt: '2026-02-11T18:45:22.000000',
      metadata: {
        email: 'user@example.com',
        plan: 'pro',
      },
      ip: 'a1b2c3d4e5f6...',
      ratedAt: '2026-02-11T18:45:22.123456',
      rating: 1,
      answerId: 'ans_321',
      resolved: 'confirmed',
      escalated: 'none',
    },
  },
]

const SAMPLE_RESEARCH_PAYLOADS = [
  {
    event: WEBHOOK_EVENT_DEEP_RESEARCH_DONE,
    teamId: '__teamId__',
    botId: '__botId__',
    research: {
      jobId: 'job_sample_001',
      status: 'completed',
      title: 'Root cause analysis',
      question: 'Why auth latency increased',
      createdAt: '2026-02-10T14:30:00.000Z',
      completedAt: '2026-02-10T14:45:00.000Z',
      metadata: {
        uid: 'user_123',
      },
      answer: '## Summary\n\nAuth latency increased due to...',
    },
  },
]

const SAMPLE_PAYLOADS_BY_EVENT = {
  [WEBHOOK_EVENT_LEAD_CREATED]: SAMPLE_LEAD_PAYLOADS,
  [WEBHOOK_EVENT_DEEP_RESEARCH_DONE]: SAMPLE_RESEARCH_PAYLOADS,
  [WEBHOOK_EVENT_CONVERSATION_ESCALATED]: SAMPLE_ESCALATED_PAYLOADS,
  [WEBHOOK_EVENT_CONVERSATION_RATED]: SAMPLE_RATED_PAYLOADS,
}

export default async function handler(req, res) {
  configureFirebaseApp()

  if (req.method !== 'GET') {
    return res.status(400).json({ message: 'Invalid HTTP method' })
  }

  let check = null
  try {
    check = await userTeamCheck(req, res)
  } catch (error) {
    return res.status(403).json({ message: error?.message })
  }

  const { userId, team } = check
  const { botId } = req.query
  const event = req.query.event || WEBHOOK_EVENT_LEAD_CREATED
  const limit = Math.min(Math.max(parseInt(req.query.limit || '3'), 1), 25)

  const bot = await getBot(team.id, botId)
  if (!bot) {
    return res.status(404).json({ message: "botId doesn't exist." })
  }

  if (!canUserViewBot(team, bot, userId)) {
    return res
      .status(403)
      .json({ message: 'You are not allowed to view leads in this bot.' })
  }

  const payloads =
    SAMPLE_PAYLOADS_BY_EVENT[event] || SAMPLE_LEAD_PAYLOADS
  const samples = payloads.slice(0, limit).map((payload) => ({
    ...payload,
    teamId: team.id,
    botId,
  }))

  return res.status(200).json(samples)
}
