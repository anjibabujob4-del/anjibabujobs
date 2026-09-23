import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Eye, FileText } from 'lucide-react'

// Map statuses to badge colors
const getStatusBadge = (status: string) => {
  switch (status) {
    case 'SUBMITTED':
      return <Badge variant="outline" className="bg-slate-100 text-slate-700">New</Badge>
    case 'UNDER_REVIEW':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Reviewing</Badge>
    case 'SHORTLISTED':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Shortlisted</Badge>
    case 'INTERVIEW':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Interview</Badge>
    case 'SELECTED':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Selected</Badge>
    case 'REJECTED':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
    case 'CLOSED':
      return <Badge variant="outline" className="bg-slate-100 text-slate-500">Closed</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export default async function AdminApplicationsPage() {
  const supabase = await createClient()

  // Fetch all applications
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      jobs (title),
      profiles (full_name, mobile)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Applications</h1>
          <p className="text-slate-500 mt-1">Review and manage candidate applications</p>
        </div>
      </div>

      <Card className="border-slate-200/60 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[120px]">App ID</TableHead>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Job Applied For</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-red-500">
                      Error loading applications.
                    </TableCell>
                  </TableRow>
                ) : !applications || applications.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="w-12 h-12 text-slate-300" />
                        <p>No applications found.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app: any) => (
                    <TableRow key={app.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-mono text-xs font-medium text-slate-600">
                        {app.application_number}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-slate-900">
                          {app.profiles?.full_name || 'Unknown Candidate'}
                        </div>
                        {app.profiles?.mobile && (
                          <div className="text-xs text-slate-500">{app.profiles.mobile}</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">
                        {app.jobs?.title || 'Unknown Job'}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(app.status)}
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {new Date(app.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/admin/applications/${app.id}`}>
                          <div className="inline-flex items-center justify-center p-2 rounded-md text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye className="w-4 h-4" />
                            <span className="sr-only">View</span>
                          </div>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
