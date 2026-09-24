import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'


export async function POST(request: Request) {
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

    const formData = await request.formData()
    const name = formData.get('name') as string
    const image = formData.get('image') as File | null
    const iconName = formData.get('icon') as string | null

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    // Generate slug for storage path
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
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

    const categoryData: any = { name, slug }
    if (iconUrl) {
      categoryData.icon = iconUrl
    } else if (iconName) {
      categoryData.icon = iconName
    }

    const { data, error } = await adminSupabase
      .from('job_categories')
      .insert(categoryData)
      .select()
      .single()

    if (error) {
      console.error('[POST /api/admin/categories] DB insert error:', error)
      throw error
    }

    revalidateTag('categories', 'max')
    revalidatePath('/', 'layout')

    return NextResponse.json({ success: true, category: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unable to create category.' }, { status: 500 })
  }
}
