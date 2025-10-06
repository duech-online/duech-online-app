import { NextRequest, NextResponse } from 'next/server';
import { updateWordByLemma, deleteWordByLemma } from '@/app/lib/editor-mutations';
import type { Word } from '@/app/lib/definitions';

/**
 * PUT /api/editor/words/[lemma]
 * Update a word and its meanings
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ lemma: string }> }) {
  try {
    const { lemma } = await context.params;
    const decodedLemma = decodeURIComponent(lemma);
    const body = await request.json();
    const updatedWord: Word = body;

    await updateWordByLemma(decodedLemma, updatedWord);

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
 * DELETE /api/editor/words/[lemma]
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
