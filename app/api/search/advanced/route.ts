import { NextRequest, NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/lib/dictionary-server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import { SearchResult } from '@/types/dictionary';

interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origins?: string[];
  letters?: string[];
}

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
    const origins = searchParams.get('origins')?.split(',').filter(Boolean) || [];
    const letters = searchParams.get('letters')?.split(',').filter(Boolean) || [];
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000);

    // Input validation
    if (query.length > 100) {
      return NextResponse.json({ error: 'Query too long' }, { status: 400 });
    }

    if (categories.length > 10 || styles.length > 10 || origins.length > 10 || letters.length > 10) {
      return NextResponse.json({ error: 'Too many filter options' }, { status: 400 });
    }

    // Validate pagination parameters
    if (page < 1 || limit < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const filters: AdvancedSearchFilters = {
      query: query.trim(),
      categories,
      styles,
      origins: origins.map(o => o.trim()).filter(Boolean),
      letters: letters.map(l => l.trim()).filter(Boolean),
    };

    const dictionaries = await loadDictionaryServer();
    const results: SearchResult[] = [];

    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        // Filter by letters if specified
        if (filters.letters && filters.letters.length > 0 && !filters.letters.includes(letterGroup.letter)) return;

        letterGroup.values.forEach((word) => {
          let matches = true;

          // Check query in lemma or meaning
          if (filters.query && filters.query.trim()) {
            const normalizedQuery = filters.query.toLowerCase();
            const inLemma = word.lemma.toLowerCase().includes(normalizedQuery);
            const inMeaning = word.values.some((def) =>
              def.meaning.toLowerCase().includes(normalizedQuery)
            );
            matches = inLemma || inMeaning;
          }

          // Check categories
          if (matches && filters.categories && filters.categories.length > 0) {
            matches = word.values.some((def) =>
              def.categories.some((cat) => filters.categories?.includes(cat))
            );
          }

          // Check styles
          if (matches && filters.styles && filters.styles.length > 0) {
            matches = word.values.some(
              (def) => def.styles && def.styles.some((style) => filters.styles?.includes(style))
            );
          }

          // Check origins
          if (matches && filters.origins && filters.origins.length > 0) {
            matches = word.values.some((def) =>
              def.origin && filters.origins!.some(origin => 
                def.origin!.toLowerCase().includes(origin.toLowerCase())
              )
            );
          }

          if (matches) {
            results.push({
              word,
              letter: letterGroup.letter,
              matchType: filters.query ? 'partial' : 'exact',
            });
          }
        });
      });
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
