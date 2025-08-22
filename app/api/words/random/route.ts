import { NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/lib/dictionary-server';

export async function GET() {
  try {
    const dictionaries = await loadDictionaryServer();

    if (!dictionaries.length) {
      return NextResponse.json({ error: 'No dictionary data available' }, { status: 404 });
    }

    const dict = dictionaries[0];
    const letterGroups = dict.value.filter((lg) => lg.values.length > 0);

    if (!letterGroups.length) {
      return NextResponse.json({ error: 'No words available' }, { status: 404 });
    }

    // Get random word
    const randomLetterGroup = letterGroups[Math.floor(Math.random() * letterGroups.length)];
    const randomWord =
      randomLetterGroup.values[Math.floor(Math.random() * randomLetterGroup.values.length)];

    // Return only the random word data
    return NextResponse.json({
      success: true,
      data: {
        word: randomWord,
        letter: randomLetterGroup.letter,
      },
    });
  } catch (error) {
    console.error('Error in random word API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
