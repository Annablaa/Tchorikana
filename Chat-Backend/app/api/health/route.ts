import { NextResponse } from 'next/server'
import { getCorsHeaders } from '@/lib/cors'

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

export async function GET(request: Request) {
  return NextResponse.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString()
  }, { headers: getCorsHeaders(request) })
}

