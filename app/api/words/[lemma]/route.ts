import { NextRequest, NextResponse } from 'next/server';
import { getWordByLemma } from '@/app/lib/queries';
import { updateWordByLemma, deleteWordByLemma, createWord } from '@/app/lib/editor-mutations';
import { applyRateLimit } from '@/app/lib/rate-limiting';
import type { Word } from '@/app/lib/definitions';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lemma: string }> }
) {
  // Apply rate limiting
  const rateLimitResult = await applyRateLimit(request);
  if (!rateLimitResult.success) {
    const response = new NextResponse('Too Many Requests', { status: 429 });
    return response;
  }

  try {
    const { lemma } = await params;

    // Input validation
    if (!lemma || typeof lemma !== 'string' || lemma.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid lemma parameter' }, { status: 400 });
    }

    // Sanitize input
    const decodedLemma = decodeURIComponent(lemma.trim());

    // Prevent excessively long queries (potential DoS)
    if (decodedLemma.length > 100) {
      return NextResponse.json({ error: 'Lemma too long' }, { status: 400 });
    }

    // Get word data from database
    const wordData = await getWordByLemma(decodedLemma);

    if (!wordData) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // Return only the requested word data
    return NextResponse.json({
      success: true,
      data: wordData,
    });
  } catch (error) {
    console.error('Error in word API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/words/[lemma]
 * Create a new word with its meanings
 */
export async function POST(request: NextRequest, context: { params: Promise<{ lemma: string }> }) {
  try {
    const body = await request.json();
    const newWord: Word = body;

    // Validate that the word has the basic required fields
    if (!newWord.lemma || !newWord.values || newWord.values.length === 0) {
      return NextResponse.json(
        { error: 'La palabra debe tener un lema y al menos una definición' },
        { status: 400 }
      );
    }

    const result = await createWord(newWord, { status: 'draft' });

    return NextResponse.json({
      success: true,
      wordId: result.wordId,
      message: 'Palabra creada exitosamente'
    });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json(
      {
        error: 'Error al crear la palabra',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/words/[lemma]
 * Update a word and its meanings
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ lemma: string }> }) {
  try {
    const { lemma } = await context.params;
    const decodedLemma = decodeURIComponent(lemma);
    const body = await request.json();
    const { word: updatedWord, status, assignedTo } = body;

    await updateWordByLemma(decodedLemma, updatedWord, { status, assignedTo });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json(
      {
        error: 'Error al actualizar la palabra',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/words/[lemma]
 * Delete a word and its meanings
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ lemma: string }> }
) {
  try {
    const { lemma } = await context.params;
    const decodedLemma = decodeURIComponent(lemma);

    await deleteWordByLemma(decodedLemma);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json(
      {
        error: 'Error al eliminar la palabra',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
