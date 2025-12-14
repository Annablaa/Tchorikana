import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { CreateTaskDto, UpdateTaskDto } from '@/lib/types/entities'
import { getCorsHeaders } from '@/lib/cors'

// Handle OPTIONS (preflight) requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

// GET /api/tasks
export async function GET(request: Request) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const status = searchParams.get('status')
    const proposed_by = searchParams.get('proposed_by')
    const message_id = searchParams.get('message_id')

    if (id) {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        return NextResponse.json(
          { message: 'Task not found', error: error.message },
          { status: 404, headers: getCorsHeaders(request) }
        )
      }

      return NextResponse.json({ data }, { headers: getCorsHeaders(request) })
    }

    let query = supabase.from('tasks').select('*')

    if (status && (status === 'pending' || status === 'confirmed' || status === 'rejected')) {
      query = query.eq('status', status)
    }

    if (proposed_by) {
      query = query.eq('proposed_by', proposed_by)
    }

    if (message_id) {
      query = query.eq('message_id', message_id)
    }

    const { data, error, count } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { message: 'Error fetching tasks', error: error.message },
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

// POST /api/tasks
export async function POST(request: Request) {
  try {
    const body: CreateTaskDto = await request.json()

    if (!body.action || !body.summary || !body.proposed_by) {
      return NextResponse.json(
        { message: 'Missing required fields: action, summary, and proposed_by are required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    if (body.action !== 'create' && body.action !== 'update' && body.action !== 'comment') {
      return NextResponse.json(
        { message: 'Invalid action: must be "create", "update", or "comment"' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    if (body.status && body.status !== 'pending' && body.status !== 'confirmed' && body.status !== 'rejected') {
      return NextResponse.json(
        { message: 'Invalid status: must be "pending", "confirmed", or "rejected"' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const taskId = crypto.randomUUID()
    const supabaseAdmin = getSupabaseAdmin()

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert([
        {
          id: taskId,
          message_id: body.message_id || null,
          task_id: body.task_id || null,
          action: body.action,
          summary: body.summary,
          details: body.details || null,
          status: body.status || 'pending',
          proposed_by: body.proposed_by,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error creating task', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Task created successfully', data },
      { status: 201, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// PUT /api/tasks
export async function PUT(request: Request) {
  try {
    const body: UpdateTaskDto & { id: string } = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { message: 'Task id is required' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const updateData: UpdateTaskDto = {}
    if (body.message_id !== undefined) updateData.message_id = body.message_id
    if (body.task_id !== undefined) updateData.task_id = body.task_id
    if (body.action !== undefined) {
      if (body.action !== 'create' && body.action !== 'update' && body.action !== 'comment') {
        return NextResponse.json(
          { message: 'Invalid action: must be "create", "update", or "comment"' },
          { status: 400, headers: getCorsHeaders(request) }
        )
      }
      updateData.action = body.action
    }
    if (body.summary !== undefined) updateData.summary = body.summary
    if (body.details !== undefined) updateData.details = body.details
    if (body.status !== undefined) {
      if (body.status !== 'pending' && body.status !== 'confirmed' && body.status !== 'rejected') {
        return NextResponse.json(
          { message: 'Invalid status: must be "pending", "confirmed", or "rejected"' },
          { status: 400, headers: getCorsHeaders(request) }
        )
      }
      updateData.status = body.status
    }
    if (body.proposed_by !== undefined) updateData.proposed_by = body.proposed_by

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No fields to update' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { message: 'Error updating task', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Task not found' },
        { status: 404, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Task updated successfully', data },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

// DELETE /api/tasks?id=xxx
export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { message: 'Task id is required as query parameter' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    const { error } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json(
        { message: 'Error deleting task', error: error.message },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    return NextResponse.json(
      { message: 'Task deleted successfully' },
      { status: 200, headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

