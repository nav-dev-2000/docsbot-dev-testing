export function buildBindingsHelpPrompt({ envBindings = [], secretBindings = [] } = {}) {
  const envVars = Array.from(
    new Set(
      (Array.isArray(envBindings) ? envBindings : [])
        .map((binding) => String(binding?.envVar || '').trim())
        .filter(Boolean),
    ),
  )
  const secretVars = Array.from(
    new Set(
      (Array.isArray(secretBindings) ? secretBindings : [])
        .map((binding) => String(binding?.envVar || '').trim())
        .filter(Boolean),
    ),
  )

  if (!envVars.length && !secretVars.length) {
    return ''
  }

  const listedEnvVars = envVars.length ? envVars.join(', ') : 'none'
  const listedSecrets = secretVars.length ? secretVars.join(', ') : 'none'

  return [
    'Reply in chat only with user-friendly, step-by-step instructions for where to get or choose the required configuration values used by this skill.',
    `Environment values: ${listedEnvVars}.`,
    `Secrets: ${listedSecrets}.`,
    'For each environment value, explain what system or dashboard it usually comes from and what exact identifier or setting the user should copy or choose.',
    'For each secret, explain what dashboard or provider it comes from, the exact place to click if possible, and what value the user should copy.',
    'Do not edit any files, do not update the manifest, and do not run validation or publish.',
    'Keep it practical and non-technical.',
  ].join(' ')
}
