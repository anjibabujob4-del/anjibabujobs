import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse, NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'


export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 1. Verify auth with the anon/session client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Use admin client (service role) for the actual DB mutation — bypasses RLS
    const adminSupabase = createAdminClient()
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

    if (image && image.size > 0) {
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

      const { error: uploadError } = await adminSupabase.storage
        .from('category-icons')
        .upload(filePath, image, {
          upsert: true,
          contentType: image.type,
        })

      if (uploadError) {
        return NextResponse.json({ error: `Upload error: ${uploadError.message}` }, { status: 500 })
      }

      const { data: publicUrlData } = adminSupabase.storage
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

    const { data, error } = await adminSupabase
      .from('job_categories')
      .update(categoryData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('[PUT /api/admin/categories/:id] DB error:', error)
      throw error
    }

    revalidateTag('categories', 'max')
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, category: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to update category.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // 1. Verify auth with the anon/session client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (!profile || !['SUPER_ADMIN', 'ADMIN', 'RECRUITER'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Use admin client (service role) for DB mutations — bypasses RLS
    const adminSupabase = createAdminClient()
    const { id } = await context.params

    console.log(`[DELETE /api/admin/categories] Attempting to delete category id: ${id}`)

    // Check if jobs are associated with this category
    const { count, error: countError } = await adminSupabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (countError) {
      console.error('[DELETE] Job count error:', countError)
      throw countError
    }

    if (count && count > 0) {
      return NextResponse.json(
        { error: `This category has ${count} job(s) associated with it. Please reassign or remove those jobs before deleting this category.` },
        { status: 400 }
      )
    }

    // Get the category to find its icon for cleanup later
    const { data: categoryBeforeDelete } = await adminSupabase
      .from('job_categories')
      .select('id, name, icon')
      .eq('id', id)
      .single()

    console.log(`[DELETE] Category to delete:`, JSON.stringify(categoryBeforeDelete))

    if (!categoryBeforeDelete) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 })
    }

    // Delete the category from database
    const { error: deleteError, data: deleteData } = await adminSupabase
      .from('job_categories')
      .delete()
      .eq('id', id)
      .select()

    if (deleteError) {
      console.error('[DELETE] Database delete error:', deleteError)
      throw deleteError
    }

    console.log(`[DELETE] Delete result:`, JSON.stringify(deleteData))

    // Verify deletion succeeded — check the row no longer exists
    const { data: verifyData } = await adminSupabase
      .from('job_categories')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (verifyData) {
      console.error(`[DELETE] VERIFICATION FAILED — category still exists after delete:`, id)
      return NextResponse.json(
        { error: 'Category could not be deleted. Please check database permissions.' },
        { status: 500 }
      )
    }

    console.log(`[DELETE] Verification passed — category ${id} successfully deleted from database.`)

    // Clean up image from storage if it exists
    if (categoryBeforeDelete?.icon && categoryBeforeDelete.icon.includes('/category-icons/')) {
      try {
        const urlObj = new URL(categoryBeforeDelete.icon)
        const pathParts = urlObj.pathname.split('/category-icons/')
        if (pathParts.length > 1) {
          const filePath = decodeURIComponent(pathParts[1])
          await adminSupabase.storage.from('category-icons').remove([filePath])
          console.log(`[DELETE] Storage cleanup successful for: ${filePath}`)
        }
      } catch (e) {
        // Storage cleanup failure must NOT cause the delete to appear failed
        console.error('[DELETE] Storage cleanup error (non-fatal):', e)
      }
    }

    revalidateTag('categories', 'max')
    revalidatePath('/', 'layout')

    return NextResponse.json({
      success: true,
      deletedCategoryId: id,
      message: `Category "${categoryBeforeDelete.name}" deleted successfully.`,
    })
  } catch (error: any) {
    console.error('[DELETE /api/admin/categories/:id] Unhandled error:', error)
    return NextResponse.json({ error: error.message || 'Unable to delete category.' }, { status: 500 })
  }
}
