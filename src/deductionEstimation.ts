export interface DeductionEstimationBracket {
  id: string
  minAnnualRevenue: number
  maxAnnualRevenue: number
  estimatedDeductionRate: number
  isActive?: boolean
}

export interface DeductionEstimationSnapshot {
  annualRevenueForecastUsed: number
  matchedBracketId: string
  matchedRate: number
  formulaVersion: string
  calculatedAt: string
}

export interface DeductionEstimationResult {
  estimatedAmount: number
  snapshot: DeductionEstimationSnapshot
}

export const DEFAULT_DEDUCTION_FORMULA_VERSION = 'estimated-generic-v1'

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function sortBrackets(brackets: DeductionEstimationBracket[]) {
  return [...brackets].sort((left, right) => {
    if (left.minAnnualRevenue !== right.minAnnualRevenue) {
      return left.minAnnualRevenue - right.minAnnualRevenue
    }

    if (left.maxAnnualRevenue !== right.maxAnnualRevenue) {
      return left.maxAnnualRevenue - right.maxAnnualRevenue
    }

    return left.id.localeCompare(right.id, 'pt-BR')
  })
}

export function selectDeductionBracket({
  annualRevenueForecast,
  brackets,
}: {
  annualRevenueForecast: number
  brackets: DeductionEstimationBracket[]
}) {
  if (!Number.isFinite(annualRevenueForecast) || annualRevenueForecast < 0) {
    return null
  }

  const activeBrackets = sortBrackets(
    brackets.filter((bracket) => bracket.isActive !== false)
  )

  return (
    activeBrackets.find(
      (bracket) =>
        Number.isFinite(bracket.minAnnualRevenue) &&
        Number.isFinite(bracket.maxAnnualRevenue) &&
        annualRevenueForecast >= bracket.minAnnualRevenue &&
        annualRevenueForecast <= bracket.maxAnnualRevenue
    ) ?? null
  )
}

export function calculateEstimatedDeduction({
  revenueAmount,
  annualRevenueForecast,
  brackets,
  formulaVersion = DEFAULT_DEDUCTION_FORMULA_VERSION,
  calculatedAt = new Date().toISOString(),
}: {
  revenueAmount: number
  annualRevenueForecast: number
  brackets: DeductionEstimationBracket[]
  formulaVersion?: string
  calculatedAt?: string
}): DeductionEstimationResult | null {
  if (!Number.isFinite(revenueAmount) || revenueAmount <= 0) {
    return null
  }

  const bracket = selectDeductionBracket({ annualRevenueForecast, brackets })
  if (!bracket) {
    return null
  }

  if (!Number.isFinite(bracket.estimatedDeductionRate) || bracket.estimatedDeductionRate < 0) {
    return null
  }

  const estimatedAmount = roundCurrency((revenueAmount * bracket.estimatedDeductionRate) / 100)
  if (estimatedAmount <= 0) {
    return null
  }

  return {
    estimatedAmount,
    snapshot: {
      annualRevenueForecastUsed: annualRevenueForecast,
      matchedBracketId: bracket.id,
      matchedRate: bracket.estimatedDeductionRate,
      formulaVersion,
      calculatedAt,
    },
  }
}
