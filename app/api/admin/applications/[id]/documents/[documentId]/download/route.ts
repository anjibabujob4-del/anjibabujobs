import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request, { params }: { params: { id: string, documentId: string } }) {
  const supabase = await createClient()

  // 1. Verify access (Auth)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // RLS policies on the 'documents' table will enforce admin-only access automatically
  const { id, documentId } = params

  // 2. Find the document record
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('application_id', id)
    .single()

  if (docError || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'view'

  // 3. Generate a fast, temporary signed URL
  const { data: signedUrlData, error: signError } = await supabase.storage
    .from('documents')
    .createSignedUrl(doc.file_path, 60, {
      // Supabase JS allows 'download' option. If string/true, forces attachment. 
      download: action === 'download' ? doc.file_name : false
    })

  if (signError || !signedUrlData) {
    console.error('Document signing error:', signError, 'Path:', doc.file_path)
    return NextResponse.json({ error: 'Failed to generate document link' }, { status: 500 })
  }

  // 4. Redirect instantly to the signed URL
  return NextResponse.redirect(signedUrlData.signedUrl)
}
