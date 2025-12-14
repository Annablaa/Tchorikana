import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateUserDto, UpdateUserDto } from '@/lib/types/entities'
import { getCorsHeaders } from '@/lib/cors'

// Handle OPTIONS (preflight) requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

// GET /api/users - Get all users or filter by query params
export async function GET(request: Request) {
  console.log('📥 [USERS API] GET request received')
  try {
    console.log('🔌 [USERS API] Creating admin client...')
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const username = searchParams.get('username')
    const email = searchParams.get('email')
    
    console.log('🔍 [USERS API] Query parameters:', { id, username, email })

    if (id) {
      console.log(`🔍 [USERS API] Fetching user with ID: ${id}`)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        console.error('❌ [USERS API] Error fetching user:', error.message)
        return NextResponse.json(
          { message: 'User not found', error: error.message },
          { status: 404, headers: getCorsHeaders(request) }
        )
      }

      console.log('✅ [USERS API] User found:', { id: data?.id, username: data?.username })
      return NextResponse.json({ data }, { headers: getCorsHeaders(request) })
    }

    // Get all users or filter
    let query = supabase.from('users').select('*')

    if (username) {
      query = query.eq('username', username)
    }

    if (email) {
      query = query.eq('email', email)
    }

    console.log('📊 [USERS API] Executing query...')
    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('❌ [USERS API] Query error:', error.message)
      return NextResponse.json(
        { message: 'Error fetching users', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    console.log(`✅ [USERS API] Successfully fetched ${data?.length || 0} users`)
    return NextResponse.json({ data: data || [], count: count || data?.length || 0 }, { headers: getCorsHeaders(request) })
  } catch (error: any) {
    console.error('❌ [USERS API] Server error:', error.message)
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  console.log('📥 [USERS API] POST request received')
  try {
    let body: CreateUserDto
    
    try {
      body = await request.json()
      console.log('📋 [USERS API] Request body received:', { 
        username: body.username, 
        email: body.email,
        display_name: body.display_name
      })
    } catch (error) {
      console.error('❌ [USERS API] Invalid JSON:', error)
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    // Validate required fields
    if (!body.username || !body.email || !body.display_name) {
      console.warn('⚠️ [USERS API] Missing required fields')
      return NextResponse.json(
        { message: 'Missing required fields: username, email, and display_name are required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    // Generate unique UUID for the user
    const userId = crypto.randomUUID()
    console.log('🆔 [USERS API] Generated user ID:', userId)

    const supabaseAdmin = getSupabaseAdmin()
    console.log('💾 [USERS API] Inserting user into database...')
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: userId,
          username: body.username,
          email: body.email,
          display_name: body.display_name,
          avatar_url: body.avatar_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('❌ [USERS API] Error creating user:', error.message)
      return NextResponse.json(
        { message: 'Error creating user', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    console.log('✅ [USERS API] User created successfully:', { id: data?.id, username: data?.username })
    return NextResponse.json(
      { message: 'User created successfully', data },
      { status: 201, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    console.error('❌ [USERS API] Server error:', error.message)
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// PUT /api/users - Update a user
export async function PUT(request: Request) {
  try {
    let body: UpdateUserDto & { id: string }
    
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { message: 'Invalid JSON in request body' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    if (!body.id) {
      return NextResponse.json(
        { message: 'User id is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const updateData: UpdateUserDto = {}
    if (body.username !== undefined) updateData.username = body.username
    if (body.email !== undefined) updateData.email = body.email
    if (body.display_name !== undefined) updateData.display_name = body.display_name
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error updating user', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'User updated successfully', data },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// DELETE /api/users?id=xxx - Delete a user
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'User id is required as query parameter' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const { error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { message: 'Error deleting user', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
