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

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const { data: appData, error: appError } = await supabase
    .from('applications')
    .select(`
      *,
      jobs ( id, title, location, employment_type ),
      profiles ( full_name, mobile ),
      application_answers (
        id,
        value,
        application_fields (
          id,
          field_name,
          label,
          type
        )
      ),
      documents (
        id,
        file_name,
        file_type,
        size
      )
    `)
    .eq('id', id)
    .single()

  if (appError || !appData) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const answers = appData.application_answers || []
  const documents = appData.documents || []

  // Extract candidate info
  const candidateName = 
    appData.profiles?.full_name || 
    getAnswerValue(answers, ['full_name', 'fullname', 'full name', 'name']) || 
    'Unknown'

  const candidateMobile = 
    appData.profiles?.mobile || 
    getAnswerValue(answers, ['mobile', 'mobile_number', 'phone', 'contact', 'mobile number']) || 
    null

  const candidateEmail = 
    getAnswerValue(answers, ['email', 'email_address', 'email address']) || 
    null

  const candidateAddress = 
    getAnswerValue(answers, ['address', 'current_address', 'current address']) || 
    null

  const formattedAnswers = answers
    .filter((a: any) => a.value && a.value.trim() !== '')
    .map((a: any) => ({
      label: a.application_fields?.label || 'Unknown Field',
      value: a.value
    }))

  const result = {
    id: appData.id,
    applicationNumber: appData.application_number,
    candidateName,
    candidateMobile,
    candidateEmail,
    candidateAddress,
    jobTitle: appData.jobs?.title,
    jobLocation: appData.jobs?.location,
    jobType: appData.jobs?.employment_type,
    applicationDate: appData.created_at,
    status: appData.status,
    answers: formattedAnswers,
    documents: documents.map((doc: any) => ({
      id: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
      size: doc.size
    }))
  }

  return NextResponse.json(result)
}
