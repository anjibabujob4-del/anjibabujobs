import { createClient } from '@/lib/supabase/server'
import CategoryManager from './category-manager'

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const supabase = await createClient()
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''

  let query = supabase
    .from('job_categories')
    .select('*')
    .order('name', { ascending: true })

  if (q) {
    query = query.ilike('name', `%${q}%`)
  }

  const { data: categories, error } = await query

  return (
    <CategoryManager 
      initialCategories={categories || []} 
      searchQuery={q} 
    />
  )
}
