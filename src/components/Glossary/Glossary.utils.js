import { checkPlanPermission } from '@/utils/helpers'

export const DEFAULT_GLOSSARY_ENTRY = { word: '', translation: '' }

export const getGlossaryPlanPermission = (team) =>
    checkPlanPermission(team, 'pro', 'glossary')
