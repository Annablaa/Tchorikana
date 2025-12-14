import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateConversationDto, UpdateConversationDto } from '@/lib/types/entities'
import { getCorsHeaders } from '@/lib/cors'

// Handle OPTIONS (preflight) requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

// GET /api/conversations
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (id) {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json(
          { message: 'Conversation not found', error: error.message },
          { status: 404, headers: getCorsHeaders(request) }
        )
      }

      return NextResponse.json({ data }, { headers: getCorsHeaders(request) })
    }

    let query = supabase.from('conversations').select('*')

    if (type && (type === 'channel' || type === 'person')) {
      query = query.eq('type', type)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { message: 'Error fetching conversations', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json({ data: data || [], count: count || data?.length || 0 }, { headers: getCorsHeaders(request) })
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// POST /api/conversations
export async function POST(request: Request) {
  try {
    const body: CreateConversationDto = await request.json()

    if (!body.name || !body.type) {
      return NextResponse.json(
        { message: 'Missing required fields: name and type are required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    if (body.type !== 'channel' && body.type !== 'person') {
      return NextResponse.json(
        { message: 'Invalid type: must be "channel" or "person"' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const conversationId = crypto.randomUUID()
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert([
        {
          id: conversationId,
          name: body.name,
          type: body.type,
          avatar_url: body.avatar_url || null,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error creating conversation', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Conversation created successfully', data },
      { status: 201, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// PUT /api/conversations
export async function PUT(request: Request) {
  try {
    const body: UpdateConversationDto & { id: string } = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { message: 'Conversation id is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const updateData: UpdateConversationDto = {}
    if (body.name !== undefined) updateData.name = body.name
    if (body.type !== undefined) {
      if (body.type !== 'channel' && body.type !== 'person') {
        return NextResponse.json(
          { message: 'Invalid type: must be "channel" or "person"' },
          { status: 400, headers: getCorsHeaders(request) }
        )
      }
      updateData.type = body.type
    }
    if (body.avatar_url !== undefined) updateData.avatar_url = body.avatar_url

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error updating conversation', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Conversation not found' },
        { status: 404, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Conversation updated successfully', data },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// DELETE /api/conversations?id=xxx
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Conversation id is required as query parameter' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { message: 'Error deleting conversation', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Conversation deleted successfully' },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

