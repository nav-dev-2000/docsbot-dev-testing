function isToolPart(part) {
  return Boolean(part?.type?.startsWith?.('tool-'))
}

function isResolvedToolPart(part) {
  return part?.state === 'output-available' || part?.state === 'output-error'
}

function interruptedToolErrorText() {
  return 'User interrupted this tool call before it completed. Reassess the current state and continue.'
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
