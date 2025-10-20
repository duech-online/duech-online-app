import { NextRequest, NextResponse } from 'next/server';
import { getWordByLemma } from '@/lib/queries';
import { updateWordByLemma, deleteWordByLemma, createWord } from '@/lib/editor-mutations';
import { applyRateLimit } from '@/lib/rate-limiting';
import type { Word, WordDefinition } from '@/lib/definitions';

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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface CreateWordPayload {
  lemma?: unknown;
  root?: unknown;
  letter?: unknown;
  assignedTo?: unknown;
  values?: unknown;
  status?: unknown;
}

function normalizeWordDefinitions(input: unknown): WordDefinition[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
    .map((def, index) => {
      const number = typeof def.number === 'number' ? def.number : index + 1;
      const meaning =
        typeof def.meaning === 'string' && def.meaning.trim()
          ? def.meaning
          : `Definición ${number}`;

      const exampleValue: WordDefinition['example'] =
        Array.isArray(def.example) || typeof def.example === 'object'
          ? (def.example as WordDefinition['example'])
          : ([] as WordDefinition['example']);

      return {
        number,
        meaning,
        origin: typeof def.origin === 'string' ? def.origin : null,
        categories: Array.isArray(def.categories)
          ? (def.categories.filter((cat): cat is string => typeof cat === 'string') as string[])
          : [],
        remission: typeof def.remission === 'string' ? def.remission : null,
        styles: Array.isArray(def.styles)
          ? (def.styles.filter((style): style is string => typeof style === 'string') as string[])
          : null,
        observation: typeof def.observation === 'string' ? def.observation : null,
        example: exampleValue,
        variant: typeof def.variant === 'string' ? def.variant : null,
      };
    });
}

function resolveAssignedTo(rawValue: unknown): number | null {
  if (typeof rawValue === 'number' && Number.isInteger(rawValue)) {
    return rawValue;
  }

  if (typeof rawValue === 'string') {
    const parsed = parseInt(rawValue, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (Array.isArray(rawValue) && rawValue.length > 0) {
    return resolveAssignedTo(rawValue[0]);
  }

  return null;
}

/**
 * POST /api/words/[lemma]
 * Create a new word with its meanings
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await applyRateLimit(request);
  if (!rateLimitResult.success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  try {
    const payload = (await request.json()) as CreateWordPayload;

    const lemma = typeof payload.lemma === 'string' ? payload.lemma.trim() : '';
    if (!lemma) {
      return NextResponse.json({ error: 'El lema es obligatorio' }, { status: 400 });
    }

    const root = typeof payload.root === 'string' ? payload.root : '';
    const letter = typeof payload.letter === 'string' ? payload.letter.trim() : null;
    const assignedTo = resolveAssignedTo(payload.assignedTo);
    const status = typeof payload.status === 'string' ? payload.status : undefined;
    const values = normalizeWordDefinitions(payload.values);

    // Ensure at least one definition exists
    const finalValues =
      values.length > 0
        ? values
        : [
            {
              number: 1,
              meaning: 'Definición pendiente',
              origin: null,
              categories: [],
              remission: null,
              styles: null,
              observation: null,
              example: [],
              variant: null,
            },
          ];

    const word: Word = {
      lemma,
      root,
      values: finalValues,
    };

    const result = await createWord(word, {
      letter,
      assignedTo,
      status,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          wordId: result.wordId,
          lemma: result.lemma,
          letter: result.letter,
        },
      },
      { status: 201 }
    );
  } catch (error) {
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
    return NextResponse.json(
      {
        error: 'Error al eliminar la palabra',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
