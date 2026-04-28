function isToolPart(part) {
  return Boolean(part?.type?.startsWith?.('tool-'))
}

function isResolvedToolPart(part) {
  return part?.state === 'output-available' || part?.state === 'output-error'
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
    if (!message || typeof message !== 'object' || !Array.isArray(message.parts)) {
      return message
    }

    let messageChanged = false
    const parts = message.parts.map((part) => {
      const nextPart = stripOpenAIProviderDataFromPart(part)
      if (nextPart !== part) {
        messageChanged = true
        changed = true
      }
      return nextPart
    })

    return messageChanged ? { ...message, parts } : message
  })

  return changed ? stripped : list
}
