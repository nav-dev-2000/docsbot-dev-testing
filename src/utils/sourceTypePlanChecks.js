import { sourceTypes } from '@/constants/sourceTypes.constants'
import { getPlanLevel, getRequiredPlanLevel } from '@/utils/helpers'

const sourceTypeLookup = new Map(sourceTypes.map((type) => [type.id, type]))

export const getIncompatibleSourceTypesForPlan = ({
  team,
  targetPlanId,
  usedSourceTypeIds = [],
}) => {
  const targetPlanLevel = getPlanLevel(targetPlanId)
  if (!targetPlanLevel) return []
  const uniqueTypeIds = new Set(
    Array.isArray(usedSourceTypeIds) ? usedSourceTypeIds.filter(Boolean) : [],
  )
  const incompatible = []

  uniqueTypeIds.forEach((typeId) => {
    const sourceType = sourceTypeLookup.get(typeId)
    if (!sourceType) {
      return
    }

    const requiredPlanLevel = getRequiredPlanLevel(
      team,
      sourceType.minPlan,
      sourceType.id,
    )

    if (requiredPlanLevel !== null && targetPlanLevel < requiredPlanLevel) {
      incompatible.push({
        id: sourceType.id,
        title: sourceType.title,
        minPlan: sourceType.minPlan,
        unknown: false,
      })
    }
  })

  return incompatible.sort((a, b) => a.title.localeCompare(b.title))
}

export const isPlanCompatibleWithSourceTypes = ({
  team,
  targetPlanId,
  usedSourceTypeIds = [],
}) =>
  getIncompatibleSourceTypesForPlan({
    team,
    targetPlanId,
    usedSourceTypeIds,
  }).length === 0
