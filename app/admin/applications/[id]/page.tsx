'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, FileText, Download, Loader2, User, Briefcase, Calendar, Phone, Mail, MapPin, Eye } from 'lucide-react'
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
  
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetails() {
      if (!id) return;
      
      try {
        const res = await fetch(`/api/admin/applications/${id}`)
        if (!res.ok) {
          throw new Error('Failed to load application details.')
        }
        const data = await res.json()
        setApplication(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchDetails()
  }, [id])

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
                App #{application.applicationNumber}
              </h1>
            </div>
            <p className="text-slate-500 mt-0.5 text-sm">
              Submitted on {new Date(application.applicationDate).toLocaleString()}
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
              <SelectItem value="WITHDRAWN">Withdrawn</SelectItem>
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
                <p className="font-medium text-slate-900">{application.candidateName}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Contact</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <p className="font-medium text-slate-900">{application.candidateMobile || 'Not Provided'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <p className="font-medium text-slate-900">{application.candidateEmail || 'Not Provided'}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Address</p>
                <div className="flex items-start gap-2 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  <p className="font-medium text-slate-900 text-sm">{application.candidateAddress || 'Not Provided'}</p>
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
                <span className="font-medium text-blue-600">
                  {application.jobTitle || 'Unknown Job'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                  <p className="font-medium text-slate-900 text-sm">{application.jobLocation || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                  <p className="font-medium text-slate-900 text-sm">{application.jobType || 'Not specified'}</p>
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
              {(!application.answers || application.answers.length === 0) ? (
                <div className="p-8 text-center text-slate-500">
                  No custom questions were answered for this application.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {application.answers.map((ans: any, idx: number) => (
                    <div key={idx} className="p-5 hover:bg-slate-50/30 transition-colors">
                      <p className="text-sm font-semibold text-slate-700 mb-2">
                        {ans.label}
                      </p>
                      <div className="text-slate-900 bg-slate-50 border border-slate-100 p-3 rounded-md whitespace-pre-wrap">
                        {ans.value}
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
              {(!application.documents || application.documents.length === 0) ? (
                <div className="text-center text-slate-500 py-4">
                  No documents were uploaded by the candidate.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {application.documents.map((doc: any) => {
                    const downloadUrl = `/api/admin/applications/${id}/documents/${doc.id}/download`
                    
                    return (
                      <div key={doc.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-all bg-white group">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="bg-blue-50 p-2 rounded-md group-hover:bg-blue-100 transition-colors shrink-0">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium text-slate-900 text-sm truncate">{doc.fileName}</p>
                            <p className="text-xs text-slate-500">{(doc.size / 1024).toFixed(1)} KB • {doc.fileType}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <a 
                            href={`${downloadUrl}?action=view`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </a>
                          <a 
                            href={`${downloadUrl}?action=download`}
                            download={doc.fileName}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 rounded transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      </div>
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
