import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import { advancedSearch } from '@/app/lib/queries';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = (await cookies()).get('duech_session')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const styles = searchParams.get('styles')?.split(',').filter(Boolean) || [];
    const origin = searchParams.get('origin') || searchParams.get('origins') || ''; // Support both singular and plural
    const letter = searchParams.get('letter') || searchParams.get('letters') || ''; // Support both singular and plural
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // Input validation
    if (query.length > 100) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    if (categories.length > 10 || styles.length > 10) {
      return NextResponse.json({ error: 'Too many filter options' }, { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    // Search in database with filters
    const results = await advancedSearch({
      query: query.trim() || undefined,
      categories: categories.length > 0 ? categories : undefined,
      styles: styles.length > 0 ? styles : undefined,
      origin: origin.trim() || undefined,
      letter: letter.trim() || undefined,
      limit: limit * page, // Get enough results for current page
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    return NextResponse.json({
      success: true,
      data: {
        results: paginatedResults,
        pagination: {
          page,
          limit,
          total: results.length,
          totalPages: Math.ceil(results.length / limit),
          hasNext: endIndex < results.length,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Error in advanced search API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
