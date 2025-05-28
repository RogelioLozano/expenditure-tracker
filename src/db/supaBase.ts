import { supabase } from '@/services/supabaseClient'
import { type ExpenditureSummary } from '@/models/expenditures'

export async function getPhrase(): Promise<string> {
  const { data, error } = await supabase.from('phrases').select().limit(1).single()
  if (error) throw error
  return `${data.text} - ${data.author}`
}

export async function addExpenditure({ amount, category }: ExpenditureSummary) {
  const { data, error } = await supabase.from('expenditures').insert([{ amount, category }])
  if (error) throw error
  return data
}

export async function getExpenditures(): Promise<Array<ExpenditureSummary>> {
  const { data, error } = await supabase.from('expenditures').select('amount, category')
  if (error) throw error
  return data
}

export async function addCategory(name: string) {
  const { error } = await supabase.from('categories').insert([{ name }])
  if (error) throw error
}

export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase.from('categories').select('name')
  if (error) throw error
  return data.map((item) => item.name)
}
