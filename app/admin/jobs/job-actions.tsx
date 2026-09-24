'use client'

import Link from 'next/link'
import { Edit, Trash2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function JobActions({ job }: { job: any }) {
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
      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" title="Delete Job">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
