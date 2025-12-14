import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getCorsHeaders } from '@/lib/cors'

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

export async function GET(request: Request) {
  console.log('🔍 [TEST] Starting Supabase connection test...')
  console.log('📋 [TEST] Environment variables:', {
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    urlPreview: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
  })

  try {
    console.log('🔌 [TEST] Creating Supabase client...')
    const supabase = createServerClient()
    console.log('✅ [TEST] Client created successfully')
    
    // Test Supabase connection by checking user table
    console.log('📊 [TEST] Attempting to query user table...')
    const { data, error } = await supabase
      .from('user')
      .select('*')
      .limit(1)
    
    console.log('📥 [TEST] Query result:', {
      hasData: !!data,
      dataLength: data?.length || 0,
      hasError: !!error,
      errorMessage: error?.message || null,
    })

    if (error) {
      console.warn('⚠️ [TEST] Query failed:', error.message)
      console.log('📝 [TEST] This might be normal if tables don\'t exist or RLS is blocking access')
      return NextResponse.json(
        { 
          message: 'Supabase connection successful, but test query failed',
          error: error.message,
          note: 'This is normal if you haven\'t created tables yet or RLS is blocking access',
          connectionStatus: 'connected',
          queryStatus: 'failed'
        },
        { status: 200, headers: getCorsHeaders(request) }
      )
    }

    console.log('✅ [TEST] Connection test successful!')
    console.log('📊 [TEST] Sample data:', data?.[0] || 'No data returned')
    
    return NextResponse.json({
      message: 'Supabase connection successful!',
      data: data,
      connectionStatus: 'connected',
      queryStatus: 'success',
      recordCount: data?.length || 0
    }, { headers: getCorsHeaders(request) })
  } catch (error: any) {
    console.error('❌ [TEST] Connection error:', error.message)
    console.error('🔍 [TEST] Error stack:', error.stack)
    return NextResponse.json(
      { 
        message: 'Error connecting to Supabase',
        error: error.message,
        connectionStatus: 'failed',
        check: 'Make sure your .env or .env.local file has the correct Supabase credentials (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)'
      },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

