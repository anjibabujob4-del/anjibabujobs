'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, Edit, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function CategoryManager({ 
  initialCategories,
  searchQuery
}: { 
  initialCategories: any[],
  searchQuery: string
}) {
  const router = useRouter()
  const supabase = createClient()
  
  const [categories, setCategories] = useState(initialCategories)
  
  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  
  // Selected category for edit/delete
  const [selectedCategory, setSelectedCategory] = useState<any>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: insertError } = await supabase
        .from('job_categories')
        .insert({ name, icon: icon || null })
        .select()
        .single()
        
      if (insertError) throw insertError
      
      setCategories([...categories, data].sort((a, b) => a.name.localeCompare(b.name)))
      setIsAddOpen(false)
      setName('')
      setIcon('')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to add category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error: updateError } = await supabase
        .from('job_categories')
        .update({ name, icon: icon || null })
        .eq('id', selectedCategory.id)
        .select()
        .single()
        
      if (updateError) throw updateError
      
      setCategories(categories.map(c => c.id === selectedCategory.id ? data : c))
      setIsEditOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to update category')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSubmit = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { error: deleteError } = await supabase
        .from('job_categories')
        .delete()
        .eq('id', selectedCategory.id)
        
      if (deleteError) throw deleteError
      
      setCategories(categories.filter(c => c.id !== selectedCategory.id))
      setIsDeleteOpen(false)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Failed to delete category')
    } finally {
      setIsLoading(false)
    }
  }

  const openEdit = (cat: any) => {
    setSelectedCategory(cat)
    setName(cat.name)
    setIcon(cat.icon || '')
    setIsEditOpen(true)
  }

  const openDelete = (cat: any) => {
    setSelectedCategory(cat)
    setIsDeleteOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Categories</h1>
          <p className="text-slate-500 mt-1">Manage job categories and their icons</p>
        </div>
        <Button 
          onClick={() => {
            setName('')
            setIcon('')
            setError(null)
            setIsAddOpen(true)
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <Card className="border-slate-200/60 shadow-sm">
        <CardHeader className="p-4 md:p-6 border-b border-slate-100 bg-slate-50/50">
          <form className="flex max-w-sm relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input 
              name="q"
              defaultValue={searchQuery}
              placeholder="Search categories..." 
              className="pl-9 h-9 bg-white"
            />
            <Button type="submit" variant="secondary" className="ml-2 h-9 hidden sm:flex">
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[300px] font-semibold text-slate-700">Category Name</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Icon ID</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden md:table-cell">Date Created</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                      No categories found.
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((cat) => (
                    <TableRow key={cat.id} className="hover:bg-slate-50/50">
                      <TableCell className="font-medium text-slate-900">
                        {cat.name}
                        <div className="text-xs text-slate-500 sm:hidden mt-1">Icon: {cat.icon || 'Default'}</div>
                      </TableCell>
                      <TableCell className="text-slate-500 hidden sm:table-cell">
                        {cat.icon || 'None'}
                      </TableCell>
                      <TableCell className="text-slate-500 hidden md:table-cell">
                        {new Date(cat.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          onClick={() => openEdit(cat)}
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-500 hover:text-blue-600 h-8 w-8"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          onClick={() => openDelete(cat)}
                          variant="ghost" 
                          size="icon" 
                          className="text-slate-500 hover:text-red-600 h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ADD DIALOG */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4 py-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="name">Category Name <span className="text-red-500">*</span></Label>
              <Input id="name" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Graphic Designers" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon Name (optional)</Label>
              <Input id="icon" value={icon} onChange={e => setIcon(e.target.value)} placeholder="e.g. Briefcase" />
              <p className="text-xs text-slate-500">Lucide icon name to display.</p>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name <span className="text-red-500">*</span></Label>
              <Input id="edit-name" required value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon Name (optional)</Label>
              <Input id="edit-icon" value={icon} onChange={e => setIcon(e.target.value)} />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-blue-600" disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {error && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}
            <p className="text-sm text-slate-600">
              Are you sure you want to delete the category <strong>{selectedCategory?.name}</strong>? 
              This action cannot be undone. Jobs currently in this category will have their category removed.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDeleteSubmit} disabled={isLoading}>
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : 'Yes, delete'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
