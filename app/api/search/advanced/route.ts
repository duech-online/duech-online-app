import { NextRequest, NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/app/lib/dictionary-server';
import { SearchResult } from '@/app/lib/types';

interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origin?: string;
  letter?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse parameters
    const query = searchParams.get('q') || '';
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const styles = searchParams.get('styles')?.split(',').filter(Boolean) || [];
    const origin = searchParams.get('origin') || '';
    const letter = searchParams.get('letter') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 1000);

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

    const filters: AdvancedSearchFilters = {
      query: query.trim(),
      categories,
      styles,
      origin: origin.trim(),
      letter: letter.trim(),
    };

    const dictionaries = await loadDictionaryServer();
    const results: SearchResult[] = [];

    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        // Filter by letter if specified
        if (filters.letter && letterGroup.letter !== filters.letter) return;

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

          // Check origin
          if (matches && filters.origin) {
            matches = word.values.some(
              (def) =>
                def.origin && def.origin.toLowerCase().includes(filters.origin!.toLowerCase())
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
