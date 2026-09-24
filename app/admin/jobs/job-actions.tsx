'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

export function JobActions({ job }: { job: any }) {
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) {
      try {
        const { error } = await supabase.from('jobs').delete().eq('id', job.id)
        if (error) throw error
        alert('Job deleted successfully!')
        router.refresh()
      } catch (err: any) {
        alert('Error deleting job: ' + err.message)
      }
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/jobs/${job.id}`} target="_blank">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600" title="View Public Page">
          <ExternalLink className="h-4 w-4" />
        </Button>
      </Link>
      <Link href={`/admin/jobs/${job.id}/edit`}>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-amber-600" title="Edit Job">
          <Edit className="h-4 w-4" />
        </Button>
      </Link>
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" 
        title="Delete Job"
        onClick={handleDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
