export const SKILLS_BUILDER_CHAT_CACHE_TTL_MS = 12 * 60 * 60 * 1000

function messageTextFromParts(message = {}) {
  const texts = []
  for (const part of Array.isArray(message.parts) ? message.parts : []) {
    if (part?.type === 'text' && typeof part.text === 'string' && part.text.trim()) {
      texts.push(part.text)
    }
  }
  if (!texts.length && typeof message.content === 'string' && message.content.trim()) {
    texts.push(message.content)
  }
  return texts.join('\n\n').trim()
}

export function simplifySkillsBuilderChatMessages(messages = []) {
  return (Array.isArray(messages) ? messages : [])
    .map((message, index) => {
      const role = message?.role
      if (role !== 'user' && role !== 'assistant') return null
      const text = messageTextFromParts(message)
      if (!text) return null
      return {
        id: message.id || `simplified-${role}-${index}`,
        role,
        metadata: {
          ...(message.metadata && typeof message.metadata === 'object' ? message.metadata : {}),
          simplifiedFromExpiredBuildLog: true,
        },
        parts: [{ type: 'text', text }],
      }
    })
    .filter(Boolean)
}

export function readSkillsBuilderChatCache(raw, now = Date.now()) {
  if (!raw) return null
  const parsed = JSON.parse(raw)

  if (Array.isArray(parsed)) {
    const simplified = simplifySkillsBuilderChatMessages(parsed)
    return simplified.length ? simplified : null
  }

  const savedAt = Number(parsed?.savedAt)
  if (!Number.isFinite(savedAt) || now - savedAt > SKILLS_BUILDER_CHAT_CACHE_TTL_MS) {
    const simplified = simplifySkillsBuilderChatMessages(parsed?.messages)
    return simplified.length ? simplified : null
  }

  return Array.isArray(parsed?.messages) ? parsed.messages : null
}

export function createSkillsBuilderChatCache(messages, now = Date.now()) {
  return JSON.stringify({
    version: 1,
    savedAt: now,
    messages,
  })
}
