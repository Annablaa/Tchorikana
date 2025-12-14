import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getCorsHeaders } from '@/lib/cors'
import { generateEmbedding } from '@/lib/ai/embeddings'
import { enhanceSearchResults } from '@/lib/ai/generate'

// Handle OPTIONS (preflight) requests
export async function OPTIONS(request: Request) {
  return new NextResponse(null, { headers: getCorsHeaders(request) })
}

// POST /api/search - Semantic search using vector similarity
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query, limit = 10, threshold = 0.4 } = body // Default threshold for semantic search

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { message: 'Search query is required and must be a non-empty string' },
        { status: 400, headers: getCorsHeaders(request) }
      )
    }

    // Generate embedding for the search query
    let queryEmbedding: number[]
    try {
      queryEmbedding = await generateEmbedding(query.trim())
      console.log(`Generated query embedding: ${queryEmbedding.length} dimensions`)
    } catch (error) {
      return NextResponse.json(
        { 
          message: 'Failed to generate embedding for search query', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        },
        { status: 500, headers: getCorsHeaders(request) }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // Use Supabase's vector similarity search (pgvector)
    // This uses cosine similarity by default
    const { data, error } = await supabaseAdmin.rpc('match_messages', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    })

    if (error) {
      // If the function doesn't exist, we'll need to create it or use a different approach
      // For now, let's try a direct query approach
      console.warn('RPC function match_messages not found, trying direct query:', error.message)
      
      // Fallback: Use direct vector similarity query
      // Note: This requires the pgvector extension and proper setup
      // We'll use a simpler approach that works with Supabase
      // Fetch more messages to ensure we have enough to filter
      const { data: messages, error: queryError } = await supabaseAdmin
        .from('messages')
        .select('id, conversation_id, author_id, content, created_at, embedding')
        .not('embedding', 'is', null)
        .limit(100) // Get more messages to ensure we have enough candidates

      if (queryError) {
        return NextResponse.json(
          { message: 'Error searching messages', error: queryError.message },
          { status: 500, headers: getCorsHeaders(request) }
        )
      }

      if (!messages || messages.length === 0) {
        return NextResponse.json(
          {
            query,
            results: [],
            count: 0,
            message: 'No messages with embeddings found in database',
          },
          { headers: getCorsHeaders(request) }
        )
      }

      // Debug: Check first message embedding format
      if (messages.length > 0) {
        const firstMsg = messages[0]
        console.log(`Sample message embedding type: ${typeof firstMsg.embedding}, isArray: ${Array.isArray(firstMsg.embedding)}, sample: ${JSON.stringify(firstMsg.embedding)?.substring(0, 100)}`)
      }

      // Helper function to parse embedding (handles both array and string formats)
      const parseEmbedding = (embedding: any): number[] | null => {
        if (Array.isArray(embedding)) {
          return embedding
        }
        if (typeof embedding === 'string') {
          try {
            // Try parsing as JSON array string
            const parsed = JSON.parse(embedding)
            if (Array.isArray(parsed)) {
              return parsed
            }
          } catch {
            // If JSON.parse fails, try parsing as PostgreSQL array string format
            // Format: "{0.01804306,0.0030030657,...}" or "[0.01804306,0.0030030657,...]"
            try {
              const cleaned = embedding.replace(/[{}[\]]/g, '')
              const numbers = cleaned.split(',').map(Number)
              if (numbers.every(n => !isNaN(n))) {
                return numbers
              }
            } catch {
              // Ignore parsing errors
            }
          }
        }
        return null
      }

      console.log(`Found ${messages.length} messages with embeddings to search through`)

      // Calculate cosine similarity for each message
      const allResults = (messages || [])
        .map((msg) => {
          const embeddingArray = parseEmbedding(msg.embedding)
          
          if (!embeddingArray) {
            console.warn(`Skipping message ${msg.id}: embedding is not a valid array`, typeof msg.embedding, msg.embedding?.substring?.(0, 50))
            return null
          }

          if (embeddingArray.length !== queryEmbedding.length) {
            console.warn(`Skipping message ${msg.id}: embedding dimension mismatch (${embeddingArray.length} vs ${queryEmbedding.length})`)
            return null
          }

          // Calculate cosine similarity
          const similarity = cosineSimilarity(queryEmbedding, embeddingArray)
          
          return {
            ...msg,
            similarity,
          }
        })
        .filter((msg) => msg !== null)

      // Log all similarities for debugging (top 10)
      const sortedForDebug = [...allResults].sort((a, b) => b!.similarity - a!.similarity).slice(0, 10)
      console.log(`Top similarities:`, sortedForDebug.map(r => ({ id: r!.id.substring(0, 8), similarity: r!.similarity.toFixed(4), content: r!.content.substring(0, 30) })))

      // Filter by threshold and limit
      const results = allResults
        .filter((msg) => msg !== null && msg.similarity >= threshold)
        .sort((a, b) => b!.similarity - a!.similarity)
        .slice(0, limit)
        .map((msg) => ({
          id: msg!.id,
          conversation_id: msg!.conversation_id,
          author_id: msg!.author_id,
          content: msg!.content,
          created_at: msg!.created_at,
          similarity: Math.round(msg!.similarity * 10000) / 10000, // Round to 4 decimal places
        }))

      console.log(`Search completed: Found ${results.length} results (>= ${threshold}) from ${messages.length} messages`)

      // If no results with threshold, try with lower threshold and return top results
      let finalResults = results
      if (results.length === 0 && allResults.length > 0) {
        const topResults = allResults
          .sort((a, b) => b!.similarity - a!.similarity)
          .slice(0, limit)
          .map((msg) => ({
            id: msg!.id,
            conversation_id: msg!.conversation_id,
            author_id: msg!.author_id,
            content: msg!.content,
            created_at: msg!.created_at,
            similarity: Math.round(msg!.similarity * 10000) / 10000,
          }))

        const actualThreshold = topResults.length > 0 ? topResults[topResults.length - 1].similarity : 0

        console.log(`No results with threshold ${threshold}, returning top ${topResults.length} results (lowest similarity: ${actualThreshold})`)

        finalResults = topResults
      }

      // Enhance results using Google AI if we have results
      let enhancedResults: Array<{
        id: string
        conversation_id: string
        author_id: string
        content: string
        created_at?: string | null
        similarity: number
      }> = finalResults
      let aiSummary: string | undefined
      
      if (finalResults.length > 0) {
        try {
          console.log('Enhancing search results with Google AI...')
          const enhancement = await enhanceSearchResults(query, finalResults.map(r => ({
            id: r.id,
            conversation_id: r.conversation_id,
            author_id: r.author_id,
            content: r.content,
            created_at: r.created_at,
            similarity: r.similarity,
          })))
          enhancedResults = enhancement.enhancedResults
          aiSummary = enhancement.summary
          console.log(`AI enhancement completed. Summary: ${aiSummary?.substring(0, 50)}...`)
        } catch (error) {
          console.warn('AI enhancement failed, using original results:', error instanceof Error ? error.message : 'Unknown error')
          // Continue with original results if enhancement fails
        }
      }

      return NextResponse.json(
        {
          query,
          results: enhancedResults,
          count: enhancedResults.length,
          summary: aiSummary,
          ...(results.length === 0 && allResults.length > 0 ? {
            warning: `No results found with similarity >= ${threshold}. Showing top results.`,
          } : {}),
        },
        { headers: getCorsHeaders(request) }
      )
    }

    // If RPC function worked, format the results
    const formattedResults = (data || []).map((result: any) => ({
      id: result.id,
      conversation_id: result.conversation_id,
      author_id: result.author_id,
      content: result.content,
      created_at: result.created_at,
      similarity: result.similarity || 0,
    }))

    return NextResponse.json(
      {
        query,
        results: formattedResults,
        count: formattedResults.length,
      },
      { headers: getCorsHeaders(request) }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500, headers: getCorsHeaders(request) }
    )
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  if (denominator === 0) {
    return 0
  }

  return dotProduct / denominator
}

