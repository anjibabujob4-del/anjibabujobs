import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    
    // Backend Validation
    if (body.vacancies === undefined || body.vacancies === null) {
      return NextResponse.json({ error: 'Number of vacancies is required.' }, { status: 400 })
    }
    
    const vacancies = Number(body.vacancies)
    if (!Number.isInteger(vacancies) || vacancies < 1 || vacancies > 100000) {
      return NextResponse.json({ error: 'Number of vacancies must be at least 1 and up to 100000.' }, { status: 400 })
    }

    const { data, error } = await supabase.from('jobs').insert({
      title: body.title,
      category_id: body.categoryId || null,
      location: body.location,
      employment_type: body.employmentType,
      experience: body.experience,
      salary_min: body.salaryMin ? Number(body.salaryMin) : null,
      salary_max: body.salaryMax ? Number(body.salaryMax) : null,
      vacancies: vacancies,
      description: body.description,
      status: body.status || 'PUBLISHED',
    }).select().single()

    if (error) {
      throw error
    }

    return NextResponse.json({ job: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create job' }, { status: 500 })
  }
}
