import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/app/lib/rate-limiting';
import { createWord } from '@/app/lib/editor-mutations';
import type { Word, WordDefinition } from '@/app/lib/definitions';

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
        expressions: Array.isArray(def.expressions)
          ? (def.expressions.filter((expr): expr is string => typeof expr === 'string') as string[])
          : null,
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

    const word: Word = {
      lemma,
      root,
      values,
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
