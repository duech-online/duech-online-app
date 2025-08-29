import { NextRequest, NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/app/lib/dictionary-server';
import { SearchResult } from '@/app/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000); // Max 50 results per page

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

    const normalizedQuery = query.toLowerCase().trim();
    const dictionaries = await loadDictionaryServer();
    const results: SearchResult[] = [];

    // Search logic (same as before but with server-side processing)
    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        letterGroup.values.forEach((word) => {
          // Exact match
          if (word.lemma.toLowerCase() === normalizedQuery) {
            results.push({
              word,
              letter: letterGroup.letter,
              matchType: 'exact',
            });
          }
          // Partial match in lemma
          else if (word.lemma.toLowerCase().includes(normalizedQuery)) {
            results.push({
              word,
              letter: letterGroup.letter,
              matchType: 'partial',
            });
          }
          // Search in definitions
          else {
            const hasDefinitionMatch = word.values.some((def) =>
              def.meaning.toLowerCase().includes(normalizedQuery)
            );
            if (hasDefinitionMatch) {
              results.push({
                word,
                letter: letterGroup.letter,
                matchType: 'definition',
              });
            }
          }
        });
      });
    });

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
