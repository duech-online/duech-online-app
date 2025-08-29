import { NextResponse } from 'next/server';
import { loadDictionaryServer } from '@/app/lib/dictionary-server';

export async function GET() {
  try {
    const dictionaries = await loadDictionaryServer();

    if (!dictionaries.length) {
      return NextResponse.json({ error: 'No dictionary data available' }, { status: 404 });
    }

    const categories = new Set<string>();
    const styles = new Set<string>();
    const origins = new Set<string>();

    // Extract unique values
    dictionaries.forEach((dict) => {
      dict.value.forEach((letterGroup) => {
        letterGroup.values.forEach((word) => {
          word.values.forEach((def) => {
            // Collect categories
            def.categories.forEach((cat) => categories.add(cat));

            // Collect styles
            if (def.styles) {
              def.styles.forEach((style) => styles.add(style));
            }

            // Collect origins
            if (def.origin) {
              origins.add(def.origin);
            }
          });
        });
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        categories: Array.from(categories).sort(),
        styles: Array.from(styles).sort(),
        origins: Array.from(origins).sort(),
      },
    });
  } catch (error) {
    console.error('Error in metadata API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
