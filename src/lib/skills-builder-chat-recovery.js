function isToolPart(part) {
  return Boolean(part?.type?.startsWith?.('tool-'))
}

function isResolvedToolPart(part) {
  return part?.state === 'output-available' || part?.state === 'output-error'
}

function isPreservedClientToolPart(part) {
  return part?.type === 'tool-ask_user_questions' && isResolvedToolPart(part)
}

function interruptedToolErrorText() {
  return 'User interrupted this tool call before it completed. Reassess the current state and continue.'
}

function stripOpenAIProviderData(value) {
  if (!value || typeof value !== 'object') return value

  const openaiData = value.openai
  if (!openaiData || typeof openaiData !== 'object') return value

  const next = { ...value }
  delete next.openai

  return Object.keys(next).length ? next : undefined
}

function stripOpenAIProviderDataFromPart(part) {
  if (!part || typeof part !== 'object') return part

  const next = { ...part }
  let changed = false

  if (next.providerOptions) {
    const providerOptions = stripOpenAIProviderData(next.providerOptions)
    if (providerOptions !== next.providerOptions) {
      changed = true
      if (providerOptions) {
        next.providerOptions = providerOptions
      } else {
        delete next.providerOptions
      }
    }
  }

  if (next.providerMetadata) {
    const providerMetadata = stripOpenAIProviderData(next.providerMetadata)
    if (providerMetadata !== next.providerMetadata) {
      changed = true
      if (providerMetadata) {
        next.providerMetadata = providerMetadata
      } else {
        delete next.providerMetadata
      }
    }
  }

  return changed ? next : part
}

function stripOpenAIProviderDataFromMessage(message) {
  if (!message || typeof message !== 'object') return message

  const next = { ...message }
  let changed = false

  if (next.providerOptions) {
    const providerOptions = stripOpenAIProviderData(next.providerOptions)
    if (providerOptions !== next.providerOptions) {
      changed = true
      if (providerOptions) {
        next.providerOptions = providerOptions
      } else {
        delete next.providerOptions
      }
    }
  }

  if (next.providerMetadata) {
    const providerMetadata = stripOpenAIProviderData(next.providerMetadata)
    if (providerMetadata !== next.providerMetadata) {
      changed = true
      if (providerMetadata) {
        next.providerMetadata = providerMetadata
      } else {
        delete next.providerMetadata
      }
    }
  }

  return changed ? next : message
}

function textPartsFromMessage(message) {
  const parts = Array.isArray(message?.parts) ? message.parts : []
  const preservedParts = parts.filter(
    (part) =>
      (part?.type === 'text' && typeof part.text === 'string') || isPreservedClientToolPart(part),
  )

  if (preservedParts.length) {
    return preservedParts
  }

  if (typeof message?.content === 'string' && message.content.trim()) {
    return [{ type: 'text', text: message.content }]
  }

  return []
}

function toInterruptedToolPart(part) {
  if (!isToolPart(part) || isResolvedToolPart(part)) {
    return part
  }

  const nextPart = {
    ...part,
    state: 'output-error',
    errorText: interruptedToolErrorText(),
  }

  if (part?.input === undefined && part?.rawInput !== undefined) {
    nextPart.input = part.rawInput
  }

  return nextPart
}

export function recoverInterruptedToolCalls(messages) {
  const list = Array.isArray(messages) ? messages : []
  let changed = false

  const recovered = list.map((message, index) => {
    if (message?.role !== 'assistant' || !Array.isArray(message?.parts)) {
      return message
    }

    const hasLaterUserOrSystemMessage = list
      .slice(index + 1)
      .some((candidate) => candidate?.role === 'user' || candidate?.role === 'system')

    if (!hasLaterUserOrSystemMessage) {
      return message
    }

    let messageChanged = false
    const nextParts = message.parts.map((part) => {
      if (!isToolPart(part) || isResolvedToolPart(part)) {
        return part
      }
      messageChanged = true
      changed = true
      return toInterruptedToolPart(part)
    })

    if (!messageChanged) {
      return message
    }

    return {
      ...message,
      parts: nextParts,
    }
  })

  return changed ? recovered : list
}

export function stripOpenAIResponseItemReferences(messages) {
  const list = Array.isArray(messages) ? messages : []
  let changed = false

  const stripped = list.map((message) => {
    let nextMessage = stripOpenAIProviderDataFromMessage(message)
    if (nextMessage !== message) {
      changed = true
    }

    if (!nextMessage || typeof nextMessage !== 'object' || !Array.isArray(nextMessage.parts)) {
      return nextMessage
    }

    let messageChanged = false
    const parts = nextMessage.parts.map((part) => {
      const nextPart = stripOpenAIProviderDataFromPart(part)
      if (nextPart !== part) {
        messageChanged = true
        changed = true
      }
      return nextPart
    })

    return messageChanged ? { ...nextMessage, parts } : nextMessage
  })

  return changed ? stripped : list
}

export function removeAssistantResponseItemsFromHistory(messages) {
  const list = Array.isArray(messages) ? messages : []
  let changed = false

  const cleaned = []
  for (const message of list) {
    if (message?.role !== 'assistant') {
      cleaned.push(message)
      continue
    }

    const parts = textPartsFromMessage(message)
    const existingParts = Array.isArray(message.parts) ? message.parts : []
    const hasOnlyPreservedParts =
      parts.length === existingParts.length &&
      existingParts.every(
        (part) =>
          (part?.type === 'text' && typeof part.text === 'string') ||
          isPreservedClientToolPart(part),
      )

    if (!parts.length) {
      changed = true
      continue
    }

    if (hasOnlyPreservedParts && !('content' in message)) {
      cleaned.push(message)
      continue
    }

    changed = true
    const nextMessage = {
      ...message,
      parts,
    }
    delete nextMessage.content
    cleaned.push(nextMessage)
  }

  return changed ? cleaned : list
}

export function prepareSkillsBuilderMessagesForModel(messages) {
  return removeAssistantResponseItemsFromHistory(
    stripOpenAIResponseItemReferences(recoverInterruptedToolCalls(messages)),
  )
}
