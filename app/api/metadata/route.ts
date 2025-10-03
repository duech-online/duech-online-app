import { NextResponse } from 'next/server';
import { getDictionaryMetadata, getAvailableLetters } from '@/app/lib/queries';
import { db } from '@/app/lib/db';
import { meanings } from '@/app/lib/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get dictionary statistics
    const metadata = await getDictionaryMetadata();
    const letters = await getAvailableLetters();

    // Get distinct categories
    const categoriesResult = await db
      .select({
        category: sql<string>`DISTINCT UNNEST(${meanings.categories})`,
      })
      .from(meanings);

    const categories = categoriesResult
      .map((r) => r.category)
      .filter((c) => c != null)
      .sort();

    // Get distinct styles
    const stylesResult = await db
      .select({
        style: sql<string>`DISTINCT UNNEST(${meanings.styles})`,
      })
      .from(meanings);

    const styles = stylesResult
      .map((r) => r.style)
      .filter((s) => s != null)
      .sort();

    // Get distinct origins
    const originsResult = await db.selectDistinct({ origin: meanings.origin }).from(meanings);

    const origins = originsResult
      .map((r) => r.origin)
      .filter((o) => o != null)
      .sort();

    return NextResponse.json({
      success: true,
      data: {
        categories,
        styles,
        origins: origins as string[],
        letters,
        stats: metadata,
      },
    });
  } catch (error) {
    console.error('Error in metadata API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
