'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function EditJobPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()
  
  const [categories, setCategories] = useState<any[]>([])
  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      
      // Fetch categories
      const { data: catData } = await supabase.from('job_categories').select('*').order('name')
      if (catData) setCategories(catData)

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single()
        
      if (jobError) {
        setError('Failed to load job details.')
      } else {
        setJob(jobData)
      }
      setIsFetching(false)
    }
    fetchData()
  }, [id, supabase])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const title = formData.get('title') as string
    const category_id = formData.get('category_id') as string
    const location = formData.get('location') as string
    const employment_type = formData.get('employment_type') as string
    const salary_min = formData.get('salary_min')
    const salary_max = formData.get('salary_max')
    const description = formData.get('description') as string
    const status = formData.get('status') as string

    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({
          title,
          category_id: category_id || null,
          location,
          employment_type,
          salary_min: salary_min ? Number(salary_min) : null,
          salary_max: salary_max ? Number(salary_max) : null,
          description,
          status,
        })
        .eq('id', id)

      if (updateError) throw updateError

      router.push('/admin/jobs')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update job')
      setIsLoading(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-slate-800">Job Not Found</h2>
        <p className="text-slate-500 mt-2">The job you are trying to edit does not exist.</p>
        <Link href="/admin/jobs">
          <Button className="mt-4 bg-blue-600">Back to Jobs</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/jobs">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Edit Job</h1>
          <p className="text-slate-500 mt-1">Update the details for this job posting.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="border-slate-200/60 shadow-sm">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="font-semibold text-slate-700">Job Title <span className="text-red-500">*</span></Label>
                <Input id="title" name="title" required defaultValue={job.title} className="bg-slate-50" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category_id" className="font-semibold text-slate-700">Category</Label>
                <Select name="category_id" defaultValue={job.category_id || undefined}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location" className="font-semibold text-slate-700">Location <span className="text-red-500">*</span></Label>
                <Input id="location" name="location" required defaultValue={job.location} className="bg-slate-50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type" className="font-semibold text-slate-700">Employment Type <span className="text-red-500">*</span></Label>
                <Select name="employment_type" defaultValue={job.employment_type || 'Full-time'}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_min" className="font-semibold text-slate-700">Minimum Salary (₹)</Label>
                <Input id="salary_min" name="salary_min" type="number" defaultValue={job.salary_min || ''} className="bg-slate-50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary_max" className="font-semibold text-slate-700">Maximum Salary (₹)</Label>
                <Input id="salary_max" name="salary_max" type="number" defaultValue={job.salary_max || ''} className="bg-slate-50" />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="font-semibold text-slate-700">Job Description <span className="text-red-500">*</span></Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  required 
                  rows={6}
                  defaultValue={job.description}
                  className="bg-slate-50 resize-none" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="font-semibold text-slate-700">Publication Status</Label>
                <Select name="status" defaultValue={job.status || 'PUBLISHED'}>
                  <SelectTrigger className="bg-slate-50">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLISHED">Published (Visible to everyone)</SelectItem>
                    <SelectItem value="DRAFT">Draft (Hidden)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
              <Link href="/admin/jobs">
                <Button variant="outline" type="button">Cancel</Button>
              </Link>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
