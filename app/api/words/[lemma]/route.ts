import { NextRequest, NextResponse } from 'next/server';
import { getWordByLemmaServer } from '@/lib/dictionary-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lemma: string }> }
) {
  try {
    const { lemma } = await params;
    
    // Input validation
    if (!lemma || typeof lemma !== 'string' || lemma.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid lemma parameter' },
        { status: 400 }
      );
    }

    // Sanitize input
    const decodedLemma = decodeURIComponent(lemma.trim());
    
    // Prevent excessively long queries (potential DoS)
    if (decodedLemma.length > 100) {
      return NextResponse.json(
        { error: 'Lemma too long' },
        { status: 400 }
      );
    }

    // Get word data
    const wordData = await getWordByLemmaServer(decodedLemma);

    if (!wordData) {
      return NextResponse.json(
        { error: 'Word not found' },
        { status: 404 }
      );
    }

    // Return only the requested word data
    return NextResponse.json({
      success: true,
      data: wordData
    });

  } catch (error) {
    console.error('Error in word API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}