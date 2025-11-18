export type Bill = { name: string; amount: number }
export type Goal = { name: string; type: 'percent' | 'fixed'; value: number }

export type UserConfig = {
  bills: Bill[]
  goals: Goal[]
}

export const DEFAULT_CONFIG: UserConfig = {
  bills: [],
  goals: []
}
