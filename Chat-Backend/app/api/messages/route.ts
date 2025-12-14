import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateMessageDto, UpdateMessageDto } from '@/lib/types/entities'
import { getCorsHeaders } from '@/lib/cors'
import { generateEmbedding } from '@/lib/ai/embeddings'

// Handle OPTIONS (preflight) requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

// GET /api/messages
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const conversation_id = searchParams.get('conversation_id')
    const author_id = searchParams.get('author_id')

    if (id) {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json(
          { message: 'Message not found', error: error.message },
          { status: 404, headers: getCorsHeaders(request) }
        )
      }

      return NextResponse.json({ data }, { headers: getCorsHeaders(request) })
    }

    let query = supabase.from('messages').select('*')

    if (conversation_id) {
      query = query.eq('conversation_id', conversation_id)
    }

    if (author_id) {
      query = query.eq('author_id', author_id)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { message: 'Error fetching messages', error: error.message },
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

// POST /api/messages
export async function POST(request: Request) {
  try {
    const body: CreateMessageDto = await request.json()

    if (!body.conversation_id || !body.author_id || !body.content) {
      return NextResponse.json(
        { message: 'Missing required fields: conversation_id, author_id, and content are required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const messageId = crypto.randomUUID()
    const supabaseAdmin = getSupabaseAdmin()

    // Generate embedding for semantic search
    let embedding: number[] | null = null
    try {
      embedding = await generateEmbedding(body.content)
    } catch (embeddingError) {
      // Log error but don't fail message creation if embedding fails
      console.warn('Failed to generate embedding for message:', embeddingError instanceof Error ? embeddingError.message : 'Unknown error')
      // Continue without embedding - message will still be created
    }

    const insertData: any = {
      id: messageId,
      conversation_id: body.conversation_id,
      author_id: body.author_id,
      content: body.content,
      is_ai: body.is_ai || false,
      task_proposal: body.task_proposal || null,
      search_result: body.search_result || null,
    }

    // Only add embedding if it was successfully generated
    if (embedding) {
      insertData.embedding = embedding
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error creating message', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Message created successfully', data },
      { status: 201, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// PUT /api/messages
export async function PUT(request: Request) {
  try {
    const body: UpdateMessageDto & { id: string } = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { message: 'Message id is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const updateData: UpdateMessageDto = {}
    if (body.conversation_id !== undefined) updateData.conversation_id = body.conversation_id
    if (body.author_id !== undefined) updateData.author_id = body.author_id
    if (body.content !== undefined) updateData.content = body.content
    if (body.is_ai !== undefined) updateData.is_ai = body.is_ai
    if (body.task_proposal !== undefined) updateData.task_proposal = body.task_proposal
    if (body.search_result !== undefined) updateData.search_result = body.search_result

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('messages')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error updating message', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Message not found' },
        { status: 404, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Message updated successfully', data },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// DELETE /api/messages?id=xxx
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Message id is required as query parameter' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { message: 'Error deleting message', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}
