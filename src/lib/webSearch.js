export const WEB_SEARCH_COMPATIBLE_MODELS_LABEL =
  'GPT-4o mini, GPT-4o, GPT-4.1 mini, GPT-4.1, or GPT-5+'

export const DEFAULT_WEB_SEARCH_MODEL = 'gpt-5.4-nano'

export const isWebSearchCompatibleModel = (model) => {
  const normalizedModel =
    typeof model === 'string' && model.trim()
      ? model.trim()
      : DEFAULT_WEB_SEARCH_MODEL

  return (
    normalizedModel === 'gpt-4.1-mini' ||
    normalizedModel === 'gpt-4.1' ||
    normalizedModel === 'gpt-4o-mini' ||
    normalizedModel === 'gpt-4o' ||
    normalizedModel.startsWith('gpt-5')
  )
}

export const formatWebSearchModelLabel = (model) => {
  const normalizedModel =
    typeof model === 'string' && model.trim()
      ? model.trim()
      : DEFAULT_WEB_SEARCH_MODEL

  return normalizedModel
    .replace(/^gpt-/, 'GPT-')
    .replace(/-mini$/i, ' mini')
    .replace(/-nano$/i, ' nano')
}
