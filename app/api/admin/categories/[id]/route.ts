import { createClient } from '@/lib/supabase/server'
import { NextResponse, NextRequest } from 'next/server'


export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params
    const formData = await request.formData()
    const name = formData.get('name') as string
    const image = formData.get('image') as File | null
    const iconName = formData.get('icon') as string | null

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    let iconUrl = null

    if (image) {
      // Validate image
      if (image.size > 5 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image must be smaller than 5 MB.' }, { status: 400 })
      }
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
      if (!allowedTypes.includes(image.type)) {
        return NextResponse.json({ error: 'Please upload PNG, JPG, JPEG, WEBP or SVG.' }, { status: 400 })
      }

      const fileExt = image.name.split('.').pop()
      const fileName = `${slug}-${crypto.randomUUID()}.${fileExt}`
      const filePath = `${slug}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('category-icons')
        .upload(filePath, image, {
          upsert: true,
          contentType: image.type,
        })

      if (uploadError) {
        return NextResponse.json({ error: `Upload error: ${uploadError.message}` }, { status: 500 })
      }

      const { data: publicUrlData } = supabase.storage
        .from('category-icons')
        .getPublicUrl(filePath)

      iconUrl = publicUrlData.publicUrl
    }

    const categoryData: any = { name }
    if (iconUrl) {
      categoryData.icon = iconUrl
    } else if (iconName !== null) {
      categoryData.icon = iconName
    }

    const { data, error } = await supabase
      .from('job_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true, category: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to update category.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient()

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await context.params

    // Check if jobs are associated with this category
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (countError) throw countError

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'This category has jobs associated with it. Please reassign or remove those jobs before deleting this category.' },
        { status: 400 }
      )
    }

    // Get the category to find its icon for deletion
    const { data: category } = await supabase
      .from('job_categories')
      .select('icon')
      .eq('id', id)
      .single()

    // Delete the category
    const { error: deleteError } = await supabase
      .from('job_categories')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    // Clean up image from storage if it exists (if icon is a URL)
    if (category?.icon && category.icon.includes('/category-icons/')) {
      try {
        const urlObj = new URL(category.icon)
        const pathParts = urlObj.pathname.split('/category-icons/')
        if (pathParts.length > 1) {
          const filePath = pathParts[1]
          await supabase.storage.from('category-icons').remove([filePath])
        }
      } catch (e) {
        console.error('Failed to parse or remove icon URL', e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to delete category.' }, { status: 500 })
  }
}
