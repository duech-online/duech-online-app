import { NextResponse } from 'next/server';
import { getWordOfTheDay } from '@/lib/dictionary';

/**
 * GET /api/word-of-the-day
 * Returns the word of the day
 */
export async function GET() {
  try {
    const word = await getWordOfTheDay();

    if (!word) {
      return NextResponse.json({ error: 'No word of the day found' }, { status: 404 });
    }

    return NextResponse.json(word);
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
