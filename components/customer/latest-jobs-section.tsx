'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MapPin, Briefcase, IndianRupee, Clock, ArrowRight, Users } from 'lucide-react'

// Specific filters requested by user
const CATEGORY_FILTERS = [
  'All',
  'Drivers',
  'Delivery Boys',
  'Office Staff',
  'Security Guards',
  'Technical Staff',
  'Washing Staff',
  'Working Partners',
]

type Job = {
  id: string
  title: string
  location: string
  salary_min: number
  salary_max: number
  employment_type: string
  experience: string
  vacancies: number
  created_at: string
  status: string
  job_categories?: { name: string; icon?: string }
  company_name?: string
}

export function LatestJobsSection() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')

  const supabase = createClient()

  useEffect(() => {
    async function fetchJobs() {
      setLoading(true)
      
      let query = supabase
        .from('jobs')
        .select(`
          id,
          title,
          location,
          salary_min,
          salary_max,
          employment_type,
          experience,
          vacancies,
          created_at,
          status,
          job_categories!inner(name, icon)
        `)
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false })
        .limit(6)

      if (activeCategory !== 'All') {
        query = query.eq('job_categories.name', activeCategory)
      }

      const { data, error } = await query

      if (!error && data) {
        setJobs(data as unknown as Job[])
      } else {
        console.error('Error fetching jobs:', error)
      }
      
      setLoading(false)
    }

    fetchJobs()
  }, [activeCategory, supabase])

  // Helper for displaying time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHrs / 24)
    
    if (diffHrs < 1) return 'Just now'
    if (diffHrs < 24) return `Posted ${diffHrs} ${diffHrs === 1 ? 'hour' : 'hours'} ago`
    if (diffDays === 1) return 'Posted yesterday'
    return `Posted ${diffDays} days ago`
  }

  return (
    <section className="py-16 bg-white relative">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-2">
              Latest Job Posts
            </h2>
            <p className="text-slate-600 text-base md:text-lg">
              Find the latest job opportunities from verified employers across India.
            </p>
          </div>
          <Link href="/jobs" className="group">
            <Button variant="ghost" className="text-orange-600 hover:bg-orange-50 hover:text-orange-700 font-bold px-0 pr-2">
              View All Jobs <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Category Filters (Horizontally Scrollable on Mobile) */}
        <div className="flex overflow-x-auto pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 border ${
                activeCategory === category
                  ? 'bg-blue-950 text-white border-blue-950 shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Job Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-slate-100 mb-4">
              <Briefcase className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-blue-950 mb-2">No jobs available right now.</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Please check again soon for new opportunities or browse other categories.
            </p>
            <Link href="/jobs">
              <Button className="bg-blue-600 hover:bg-blue-700">Browse Categories</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <Card 
                key={job.id} 
                className="group border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden flex flex-col"
              >
                <CardContent className="p-6 flex flex-col h-full">
                  {/* Top: Status & Time */}
                  <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Hiring
                    </span>
                    <span className="text-xs font-medium text-slate-400">
                      {getTimeAgo(job.created_at)}
                    </span>
                  </div>

                  {/* Title & Company */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-blue-950 group-hover:text-blue-700 transition-colors line-clamp-2 mb-1">
                      {job.title}
                    </h3>
                    <p className="text-slate-500 text-sm font-medium">
                      {job.company_name || 'Verified Employer'}
                    </p>
                  </div>

                  {/* Badges/Info */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {job.location}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 px-2 py-1 rounded-md">
                      <IndianRupee className="w-3.5 h-3.5 text-orange-500" />
                      ₹{job.salary_min} – ₹{job.salary_max} / month
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-md">
                      {job.job_categories?.icon?.startsWith('http') ? (
                        <img src={job.job_categories.icon} alt="icon" className="w-3.5 h-3.5 object-contain" />
                      ) : (
                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                      )}
                      {job.employment_type || 'Full Time'} • {job.job_categories?.name || 'General'}
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md">
                      <Users className="w-3.5 h-3.5 text-green-500" />
                      {job.vacancies === 1 ? '1 Vacancy' : `${job.vacancies || 1} Vacancies`}
                    </div>
                    {job.experience && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Exp: {job.experience}
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
                    <Link href={`/jobs/${job.id}`} className="w-full">
                      <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800">
                        View Job
                      </Button>
                    </Link>
                    <Link href={`/apply/${job.id}`} className="w-full">
                      <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                        Apply Now
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button for > 6 jobs logic (if they want it at bottom, but we have it at top. I'll add a bottom one too if there's jobs) */}
        {!loading && jobs.length > 0 && (
          <div className="mt-10 text-center">
            <Link href="/jobs">
              <Button size="lg" variant="outline" className="border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-900 font-bold px-8">
                View All Jobs <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
      
      {/* Hide scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </section>
  )
}
