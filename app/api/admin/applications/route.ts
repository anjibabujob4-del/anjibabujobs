import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

function getAnswerValue(answers: any[], possibleNames: string[]) {
  for (const ans of answers) {
    const fieldName = ans.application_fields?.field_name?.toLowerCase()
    const label = ans.application_fields?.label?.toLowerCase()
    if (possibleNames.includes(fieldName) || possibleNames.includes(label)) {
      return ans.value
    }
  }
  return null
}

export async function GET() {
  const supabase = await createClient()

  // Verify admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Double check admin role here if necessary, but assuming RLS covers it or just standard supabase server client
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      id,
      application_number,
      status,
      created_at,
      jobs ( id, title ),
      profiles ( full_name, mobile ),
      application_answers (
        value,
        application_fields (
          field_name,
          label
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }

  const formattedApplications = applications.map((app: any) => {
    const answers = app.application_answers || []
    
    // Normalize and extract candidate name
    const candidateName = 
      app.profiles?.full_name || 
      getAnswerValue(answers, ['full_name', 'fullname', 'full name', 'name']) || 
      'Unknown Candidate'

    // Extract mobile
    const candidateMobile = 
      app.profiles?.mobile || 
      getAnswerValue(answers, ['mobile', 'mobile_number', 'phone', 'contact', 'mobile number']) || 
      null

    return {
      id: app.id,
      applicationNumber: app.application_number,
      candidateName,
      candidateMobile,
      jobTitle: app.jobs?.title || 'Unknown Job',
      status: app.status,
      createdAt: app.created_at,
    }
  })

  return NextResponse.json(formattedApplications)
}
