'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download, Loader2, User, Briefcase, Calendar, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function ApplicationDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const supabase = createClient()

  const [application, setApplication] = useState<any>(null)
  const [answers, setAnswers] = useState<any[]>([])
  const [documents, setDocuments] = useState<any[]>([])
  
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      
      try {
        // 1. Fetch Application + Job + Profile
        const { data: appData, error: appError } = await supabase
          .from('applications')
          .select(`
            *,
            jobs (title, location, employment_type),
            profiles (full_name, mobile)
          `)
          .eq('id', id)
          .single()

        if (appError) throw appError;
        setApplication(appData)

        // 2. Fetch Application Answers
        const { data: ansData } = await supabase
          .from('application_answers')
          .select(`
            *,
            application_fields (label, type)
          `)
          .eq('application_id', id)
        
        if (ansData) setAnswers(ansData)

        // 3. Fetch Documents
        const { data: docData } = await supabase
          .from('documents')
          .select('*')
          .eq('application_id', id)

        if (docData) setDocuments(docData)

      } catch (err: any) {
        setError('Failed to load application details.')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDetails()
  }, [id, supabase])

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true)
    try {
      const { error: updateError } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', id)

      if (updateError) throw updateError

      setApplication({ ...application, status: newStatus })
      alert(`Application status changed to ${newStatus}.`)
      router.refresh()
    } catch (err) {
      alert("Failed to update status.")
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error || !application) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Application Not Found</h2>
        <p className="text-slate-500 mt-2">The application you are looking for does not exist.</p>
        <Link href="/admin/applications">
          <Button className="mt-4 bg-blue-600">Back to Applications</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/applications">
            <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                App #{application.application_number}
              </h1>
            </div>
            <p className="text-slate-500 mt-0.5 text-sm">
              Submitted on {new Date(application.created_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Status Updater */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-slate-200">
          <span className="text-sm font-medium text-slate-600 pl-2">Status:</span>
          <Select value={application.status} onValueChange={handleStatusChange} disabled={isUpdating}>
            <SelectTrigger className="w-[180px] bg-slate-50">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SUBMITTED">Submitted (New)</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="SHORTLISTED">Shortlisted</SelectItem>
              <SelectItem value="INTERVIEW">Interview Scheduled</SelectItem>
              <SelectItem value="SELECTED">Selected / Hired</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Candidate & Job Info */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Candidate Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{application.profiles?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <p className="font-medium text-slate-900">{application.profiles?.mobile || 'Not Provided'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                Job Applied For
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                <Link href={`/jobs/${application.job_id}`} target="_blank" className="font-medium text-blue-600 hover:underline">
                  {application.jobs?.title || 'Unknown Job'}
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-medium text-slate-900 text-sm">{application.jobs?.location}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                  <p className="font-medium text-slate-900 text-sm">{application.jobs?.employment_type}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Answers & Documents */}
        <div className="md:col-span-2 space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Application Form Answers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {answers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No custom questions were answered for this application.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {answers.map((ans) => (
                    <div key={ans.id} className="p-5 hover:bg-slate-50/30 transition-colors">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        {ans.application_fields?.label || 'Unknown Question'}
                      </p>
                      <div className="text-slate-900 bg-slate-50 border border-slate-100 p-3 rounded-md whitespace-pre-wrap">
                        {ans.value || <span className="text-slate-400 italic">No answer provided</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="w-5 h-5 text-blue-600" />
                Attached Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              {documents.length === 0 ? (
                <div className="text-center text-slate-500 py-4">
                  No documents were uploaded by the candidate.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {documents.map((doc) => {
                    // Create a public URL for downloading
                    const { data: publicUrlData } = supabase.storage
                      .from('resumes')
                      .getPublicUrl(doc.file_path)

                    return (
                      <a 
                        key={doc.id}
                        href={publicUrlData.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-blue-50 p-2 rounded-md group-hover:bg-blue-100 transition-colors shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium text-slate-900 text-sm truncate">{doc.file_name}</p>
                            <p className="text-xs text-slate-500">Click to view/download</p>
                          </div>
                        </div>
                        <Download className="w-4 h-4 text-slate-300 group-hover:text-blue-600 shrink-0" />
                      </a>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
