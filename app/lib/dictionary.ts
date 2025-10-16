import { SearchResponse, Word } from '@/app/lib/definitions';
import { getWordByLemma } from '@/app/lib/queries';
import { searchDictionary } from '@/app/lib/dictionary-client';

const LETTERS = 'abcdefghijklmnñopqrstuvwxyz'.split('');
const wordOfTheDayCache = new Map<string, { word: Word; letter: string }>();

/**
 * Get a random word for "Word of the Day"
 * Server-only function that uses the client-safe searchDictionary function.
 */
export async function getWordOfTheDay(
  date: Date = new Date()
): Promise<{ word: Word; letter: string } | null> {
  try {
    const seed = date.toISOString().slice(0, 10); // YYYY-MM-DD (UTC based)
    if (wordOfTheDayCache.has(seed)) {
      return wordOfTheDayCache.get(seed)!;
    }
    const startIndex = hashSeed(seed) % LETTERS.length;

    let searchResult: SearchResponse | null = null;
    let selectedLetter = LETTERS[startIndex];

    const idx = startIndex % LETTERS.length;
    const initialLetter = LETTERS[idx];
    const initialResult = await searchDictionary({ letters: [initialLetter] }, 1, 1000);

    if (initialResult.results.length > 0) {
      searchResult = initialResult;
      selectedLetter = initialLetter;
    } else {
      selectedLetter = 'o';
      searchResult = await searchDictionary({ letters: [selectedLetter] }, 1, 1000);
    }

    const pool = [...searchResult.results].sort((a, b) =>
      a.word.lemma.localeCompare(b.word.lemma, 'es')
    );
    if (pool.length === 0) {
      throw new Error(
        `No se encontraron palabras para la fecha ${seed}. (letra=${selectedLetter}, filtros vacíos, Resultados=${searchResult.results.length})`
      );
    }

    const index = hashSeed(`${seed}:${selectedLetter}`) % pool.length;
    const chosen = pool[index];
    const detailed = await getWordByLemma(chosen.word.lemma);

    const fallbackWord = detailed ?? { word: chosen.word, letter: chosen.letter };

    wordOfTheDayCache.set(seed, fallbackWord);
    return fallbackWord;
  } catch (error) {
    console.error('Error getting word of the day:', error);
    throw error;
  }
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash;
}
