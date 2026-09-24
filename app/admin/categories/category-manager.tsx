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
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be smaller than 5 MB.')
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
      setError(null)
    }
  }

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageFile) {
      setError('Category Image is required for new categories.')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('image', imageFile)
      
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        body: formData,
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to add category')
      
      setCategories([...categories, result.category].sort((a, b) => a.name.localeCompare(b.name)))
      setIsAddOpen(false)
      setName('')
      setImageFile(null)
      setImagePreview(null)
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
      const formData = new FormData()
      formData.append('name', name)
      if (imageFile) {
        formData.append('image', imageFile)
      } else {
        // Keep existing icon if no new image uploaded
        formData.append('icon', icon || '')
      }
      
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'PUT',
        body: formData,
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to update category')
      
      setCategories(categories.map(c => c.id === selectedCategory.id ? result.category : c))
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
      const res = await fetch(`/api/admin/categories/${selectedCategory.id}`, {
        method: 'DELETE'
      })
      
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to delete category')
      
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
    setImageFile(null)
    setImagePreview(cat.icon?.startsWith('http') ? cat.icon : null)
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
            setImageFile(null)
            setImagePreview(null)
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
          <div className="hidden sm:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="w-[300px] font-semibold text-slate-700">Category</TableHead>
                  <TableHead className="font-semibold text-slate-700 hidden sm:table-cell">Image</TableHead>
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
                        <div className="text-xs text-slate-500 sm:hidden mt-2">
                          {cat.icon?.startsWith('http') ? (
                            <img src={cat.icon} alt={cat.name} className="w-8 h-8 object-contain rounded" />
                          ) : (
                            <span className="bg-slate-100 px-2 py-1 rounded">No Image</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 hidden sm:table-cell">
                        {cat.icon?.startsWith('http') ? (
                          <img src={cat.icon} alt={cat.name} className="w-12 h-12 object-contain rounded-lg border border-slate-200 bg-white p-1" />
                        ) : (
                          <span className="bg-slate-100 text-xs px-2 py-1 rounded text-slate-500">{cat.icon || 'None'}</span>
                        )}
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

          {/* Mobile Cards Layout */}
          <div className="sm:hidden divide-y divide-slate-100">
            {categories.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No categories found.</div>
            ) : (
              categories.map((cat) => (
                <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-900 text-base">{cat.name}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-2 mt-2">
                      {cat.icon?.startsWith('http') ? (
                        <img src={cat.icon} alt={cat.name} className="w-10 h-10 object-contain rounded border border-slate-200 bg-white p-1" />
                      ) : (
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {cat.icon || 'No Icon'}
                        </span>
                      )}
                      <span>{new Date(cat.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
                  </div>
                </div>
              ))
            )}
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
              <Label htmlFor="image">Category Image <span className="text-red-500">*</span></Label>
              <Input id="image" type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" required onChange={handleImageChange} />
              <p className="text-xs text-slate-500">Supported: PNG, JPG, WEBP, SVG (Max 5MB)</p>
            </div>
            {imagePreview && (
              <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 flex justify-center">
                <img src={imagePreview} alt="Preview" className="h-24 w-24 object-contain" />
              </div>
            )}
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
              <Label htmlFor="edit-image">Category Image</Label>
              <Input id="edit-image" type="file" accept="image/png, image/jpeg, image/webp, image/svg+xml" onChange={handleImageChange} />
              <p className="text-xs text-slate-500">Select a new image to replace the current one.</p>
            </div>
            {imagePreview && (
              <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50 flex flex-col items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Image Preview</span>
                <img src={imagePreview} alt="Preview" className="h-24 w-24 object-contain" />
              </div>
            )}
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
