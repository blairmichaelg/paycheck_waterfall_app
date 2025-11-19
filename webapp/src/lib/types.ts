import { z } from 'zod'

export const CONFIG_VERSION = 3 as const

export const PAY_FREQUENCIES = ['weekly', 'biweekly', 'semi_monthly', 'monthly'] as const
export const BILL_CADENCES = ['every_paycheck', 'weekly', 'biweekly', 'semi_monthly', 'monthly', 'quarterly', 'annual'] as const

export const billSchema = z.object({
  name: z.string().min(1, 'Bill name required'),
  amount: z.number().nonnegative('Bill amount must be ≥ 0'),
  cadence: z.enum(BILL_CADENCES).default('monthly'),
  dueDay: z.number().int().min(1).max(31).optional()
})

export const incomeRangeSchema = z
  .object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative()
  })
  .refine((value) => value.max >= value.min, {
    message: 'Max must be greater than or equal to min'
  })

export const bonusIncomeSchema = z.object({
  name: z.string().min(1, 'Bonus name required'),
  cadence: z.enum(BILL_CADENCES).default('monthly'),
  range: incomeRangeSchema,
  recurring: z.boolean().default(true)
})

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name required'),
  type: z.enum(['percent', 'fixed']),
  value: z.number().nonnegative('Goal value must be ≥ 0')
})

export const settingsSchema = z.object({
  percentApply: z.enum(['gross', 'remainder']),
  payFrequency: z.enum(PAY_FREQUENCIES).default('biweekly'),
  paycheckRange: incomeRangeSchema.default({ min: 0, max: 0 })
})

export const userConfigSchema = z.object({
  version: z.number().int().min(1),
  updatedAt: z.string(),
  bills: z.array(billSchema),
  goals: z.array(goalSchema),
  bonuses: z.array(bonusIncomeSchema),
  settings: settingsSchema
})

export const legacyConfigSchemaV1 = z.object({
  bills: z
    .array(
      z.object({
        name: z.string().optional(),
        amount: z.number().nonnegative().optional(),
        cadence: z.enum(BILL_CADENCES).optional(),
        dueDay: z.number().int().min(1).max(31).optional()
      })
    )
    .default([]),
  goals: z
    .array(
      z.object({
        name: z.string().optional(),
        type: z.enum(['percent', 'fixed']).optional(),
        value: z.number().nonnegative().optional()
      })
    )
    .default([]),
  settings: z
    .object({
      percentApply: z.enum(['gross', 'remainder']).optional(),
      payFrequency: z.enum(PAY_FREQUENCIES).optional(),
      paycheckRange: incomeRangeSchema.optional(),
      averageVariancePct: z.number().min(0).max(100).optional(),
      supplementalIncomePerPaycheck: z.number().min(0).optional()
    })
    .partial()
    .optional()
})

export type Bill = z.infer<typeof billSchema>
export type Goal = z.infer<typeof goalSchema>
export type BonusIncome = z.infer<typeof bonusIncomeSchema>
export type UserConfig = z.infer<typeof userConfigSchema>
export type LegacyConfigV1 = z.infer<typeof legacyConfigSchemaV1>

export const createDefaultConfig = (): UserConfig => ({
  version: CONFIG_VERSION,
  updatedAt: new Date().toISOString(),
  bills: [],
  goals: [],
  bonuses: [],
  settings: {
    percentApply: 'gross',
    payFrequency: 'biweekly',
    paycheckRange: { min: 0, max: 0 }
  }
})
