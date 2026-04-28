export const SKILLS_LIBRARY_CAPABILITY_ALL = 'all'
export const SKILLS_LIBRARY_CAPABILITY_MARKDOWN = 'markdown'
export const SKILLS_LIBRARY_CAPABILITY_EXECUTABLE = 'executable'
export const SKILLS_LIBRARY_AUDIENCE_ALL = 'all'
export const SKILLS_LIBRARY_AUDIENCE_CUSTOMER = 'customer'
export const SKILLS_LIBRARY_AUDIENCE_INTERNAL = 'internal'

function normalizeSearchText(value) {
  return String(value || '').trim().toLowerCase()
}

export function filterSkillsLibrary(skills = [], filters = {}) {
  const query = normalizeSearchText(filters.query)
  const capability = filters.capability || SKILLS_LIBRARY_CAPABILITY_ALL
  const audience = filters.audience || SKILLS_LIBRARY_AUDIENCE_ALL

  return (Array.isArray(skills) ? skills : []).filter((skill) => {
    if (!skill) return false

    if (query) {
      const haystack = [
        skill.id,
        skill.name,
        skill.skillName,
        skill.displayName,
        skill.description,
      ]
        .map(normalizeSearchText)
        .join(' ')
      if (!haystack.includes(query)) return false
    }

    const isExecutable = skill.mode === 'executable' || skill.hasFunctions === true
    if (capability === SKILLS_LIBRARY_CAPABILITY_MARKDOWN && isExecutable) return false
    if (capability === SKILLS_LIBRARY_CAPABILITY_EXECUTABLE && !isExecutable) return false

    const isInternal = skill.audience === 'internal' || skill.internal === true
    if (audience === SKILLS_LIBRARY_AUDIENCE_CUSTOMER && isInternal) return false
    if (audience === SKILLS_LIBRARY_AUDIENCE_INTERNAL && !isInternal) return false

    return true
  })
}
