import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import { searchWords } from '@/app/lib/queries';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = (await cookies()).get('duech_session')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 results per page

    // Input validation
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Prevent excessively long queries
    if (query.length > 100) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const normalizedQuery = query.trim();

    // Search in database
    const results = await searchWords(normalizedQuery, limit * page);

    // Sort results: exact matches first, then partial, then definition matches
    const sortedResults = results.sort((a, b) => {
      const order = { exact: 0, partial: 1, definition: 2 };
      return order[a.matchType] - order[b.matchType];
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = sortedResults.slice(startIndex, endIndex);

    // Return paginated results
    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          page,
          limit,
          total: sortedResults.length,
          totalPages: Math.ceil(sortedResults.length / limit),
          hasNext: endIndex < sortedResults.length,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
