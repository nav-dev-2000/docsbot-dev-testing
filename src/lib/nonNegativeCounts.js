export function toNonNegativeCount(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return 0
  }
  return numericValue
}

export function incrementNonNegativeCount(currentValue, amount = 1) {
  return toNonNegativeCount(toNonNegativeCount(currentValue) + toNonNegativeCount(amount))
}

export function decrementNonNegativeCount(currentValue, amount = 1) {
  return Math.max(0, toNonNegativeCount(currentValue) - toNonNegativeCount(amount))
}

export function sumNonNegativeCounts(values = []) {
  return values.reduce((total, value) => total + toNonNegativeCount(value), 0)
}
