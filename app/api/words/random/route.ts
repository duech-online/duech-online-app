import { NextResponse } from 'next/server';

import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import { getRandomWord } from '@/app/lib/queries';

export async function GET() {
  try {
    const token = (await cookies()).get('duech_session')?.value;
    if (!token || !verifyToken(token)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get random word from database
    const wordData = await getRandomWord();

    if (!wordData) {
      return NextResponse.json({ error: 'No words available' }, { status: 404 });
    }

    // Return the random word data
    return NextResponse.json({
      success: true,
      data: wordData,
    });
  } catch (error) {
    console.error('Error in random word API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
