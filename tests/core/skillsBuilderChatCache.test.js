import { describe, expect, it } from 'vitest'

import {
  createSkillsBuilderChatCache,
  readSkillsBuilderChatCache,
  SKILLS_BUILDER_CHAT_CACHE_TTL_MS,
  simplifySkillsBuilderChatMessages,
} from '@/lib/skills-builder-chat-cache'

describe('skills builder chat cache', () => {
  it('round-trips messages with a timestamped cache envelope', () => {
    const messages = [{ id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Build a skill' }] }]
    const raw = createSkillsBuilderChatCache(messages, 1000)

    expect(JSON.parse(raw)).toEqual({
      version: 1,
      savedAt: 1000,
      messages,
    })
    expect(readSkillsBuilderChatCache(raw, 1000 + SKILLS_BUILDER_CHAT_CACHE_TTL_MS - 1)).toEqual(messages)
  })

  it('simplifies old and legacy cache payloads to text-only messages', () => {
    const messages = [
      { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Build a skill' }] },
      {
        id: 'a1',
        role: 'assistant',
        parts: [
          { type: 'reasoning', text: 'Thinking' },
          { type: 'tool-shell', input: { command: 'npm test' }, output: 'ok' },
          { type: 'text', text: 'Done.' },
        ],
      },
    ]
    const raw = createSkillsBuilderChatCache(messages, 1000)

    expect(readSkillsBuilderChatCache(raw, 1000 + SKILLS_BUILDER_CHAT_CACHE_TTL_MS + 1)).toEqual([
      {
        id: 'u1',
        role: 'user',
        metadata: { simplifiedFromExpiredBuildLog: true },
        parts: [{ type: 'text', text: 'Build a skill' }],
      },
      {
        id: 'a1',
        role: 'assistant',
        metadata: { simplifiedFromExpiredBuildLog: true },
        parts: [{ type: 'text', text: 'Done.' }],
      },
    ])
    expect(readSkillsBuilderChatCache(JSON.stringify(messages), 1000)).toEqual([
      {
        id: 'u1',
        role: 'user',
        metadata: { simplifiedFromExpiredBuildLog: true },
        parts: [{ type: 'text', text: 'Build a skill' }],
      },
      {
        id: 'a1',
        role: 'assistant',
        metadata: { simplifiedFromExpiredBuildLog: true },
        parts: [{ type: 'text', text: 'Done.' }],
      },
    ])
  })

  it('drops empty and tool-only messages when simplifying build logs', () => {
    expect(
      simplifySkillsBuilderChatMessages([
        { id: 'a1', role: 'assistant', parts: [{ type: 'tool-shell', output: 'ok' }] },
        { id: 'u1', role: 'user', parts: [{ type: 'text', text: 'Keep me' }] },
        { id: 'sys', role: 'system', parts: [{ type: 'text', text: 'Drop me' }] },
      ]),
    ).toEqual([
      {
        id: 'u1',
        role: 'user',
        metadata: { simplifiedFromExpiredBuildLog: true },
        parts: [{ type: 'text', text: 'Keep me' }],
      },
    ])
  })
})
