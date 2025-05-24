export interface Expenditure {
  id: string
  amount: number
  category: string
  date: Date
}

export type ExpenditureSummary = Pick<Expenditure, 'amount' | 'category'>
