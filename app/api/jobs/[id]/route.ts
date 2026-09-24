import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()
    const { id } = await context.params

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json({ job: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch job' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
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

    const { id } = await context.params
    const body = await request.json()
    
    // Backend Validation for Vacancies
    if (body.vacancies !== undefined) {
      const vacancies = Number(body.vacancies)
      if (!Number.isInteger(vacancies) || vacancies < 1 || vacancies > 100000) {
        return NextResponse.json({ error: 'Number of vacancies must be at least 1 and up to 100000.' }, { status: 400 })
      }
    }

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.categoryId !== undefined) updateData.category_id = body.categoryId || null
    if (body.location !== undefined) updateData.location = body.location
    if (body.employmentType !== undefined) updateData.employment_type = body.employmentType
    if (body.experience !== undefined) updateData.experience = body.experience
    if (body.salaryMin !== undefined) updateData.salary_min = body.salaryMin ? Number(body.salaryMin) : null
    if (body.salaryMax !== undefined) updateData.salary_max = body.salaryMax ? Number(body.salaryMax) : null
    if (body.vacancies !== undefined) updateData.vacancies = Number(body.vacancies)
    if (body.description !== undefined) updateData.description = body.description
    if (body.status !== undefined) updateData.status = body.status

    const { data, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ job: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update job' }, { status: 500 })
  }
}
