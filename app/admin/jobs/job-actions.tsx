'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function JobActions({ job }: { job: any }) {
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 p-0 items-center justify-center rounded-md hover:bg-slate-100 text-slate-500">
        <span className="sr-only">Open menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => window.open(`/jobs/${job.id}`, '_blank')} className="cursor-pointer">
          View Public Page
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} className="cursor-pointer">
          <Edit className="w-4 h-4 mr-2 text-slate-500" />
          Edit Job
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
