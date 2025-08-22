/**
 * Dictionary data loader and utility functions
 */

import { Dictionary, Word, LetterGroup, SearchResult, WordDefinition } from '@/types/dictionary';

let dictionaryData: Dictionary[] | null = null;

/**
 * Load dictionary data from JSON file
 * This function works on the client side
 */
export async function loadDictionary(): Promise<Dictionary[]> {
  if (dictionaryData) return dictionaryData;

  try {
    // Use absolute URL for client-side fetching
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const response = await fetch(`${baseUrl}/data/example.json`);
    if (!response.ok) {
      throw new Error('Failed to load dictionary data');
    }
    dictionaryData = await response.json();
    return dictionaryData;
  } catch (error) {
    console.error('Error loading dictionary:', error);
    return [];
  }
}

/**
 * Get all words from the dictionary
 */
export async function getAllWords(): Promise<Word[]> {
  const dictionaries = await loadDictionary();
  const allWords: Word[] = [];

  dictionaries.forEach(dict => {
    dict.value.forEach(letterGroup => {
      allWords.push(...letterGroup.values);
    });
  });

  return allWords;
}

/**
 * Get a random word for "Lotería de palabras"
 */
export async function getRandomWord(): Promise<{ word: Word; letter: string } | null> {
  const dictionaries = await loadDictionary();
  if (!dictionaries.length) return null;

  const dict = dictionaries[0];
  const letterGroups = dict.value.filter(lg => lg.values.length > 0);
  if (!letterGroups.length) return null;

  const randomLetterGroup = letterGroups[Math.floor(Math.random() * letterGroups.length)];
  const randomWord = randomLetterGroup.values[Math.floor(Math.random() * randomLetterGroup.values.length)];

  return { word: randomWord, letter: randomLetterGroup.letter };
}

/**
 * Search words by query
 */
export async function searchWords(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length === 0) return [];

  const normalizedQuery = query.toLowerCase().trim();
  const dictionaries = await loadDictionary();
  const results: SearchResult[] = [];

  dictionaries.forEach(dict => {
    dict.value.forEach(letterGroup => {
      letterGroup.values.forEach(word => {
        // Exact match
        if (word.lemma.toLowerCase() === normalizedQuery) {
          results.push({
            word,
            letter: letterGroup.letter,
            matchType: 'exact',
          });
        }
        // Partial match in lemma
        else if (word.lemma.toLowerCase().includes(normalizedQuery)) {
          results.push({
            word,
            letter: letterGroup.letter,
            matchType: 'partial',
          });
        }
        // Search in definitions
        else {
          const hasDefinitionMatch = word.values.some(def =>
            def.meaning.toLowerCase().includes(normalizedQuery)
          );
          if (hasDefinitionMatch) {
            results.push({
              word,
              letter: letterGroup.letter,
              matchType: 'definition',
            });
          }
        }
      });
    });
  });

  // Sort results: exact matches first, then partial, then definition matches
  return results.sort((a, b) => {
    const order = { exact: 0, partial: 1, definition: 2 };
    return order[a.matchType] - order[b.matchType];
  });
}

/**
 * Get word by ID (lemma)
 */
export async function getWordById(id: string): Promise<{ word: Word; letter: string } | null> {
  const dictionaries = await loadDictionary();
  
  for (const dict of dictionaries) {
    for (const letterGroup of dict.value) {
      const word = letterGroup.values.find(w => w.lemma === id);
      if (word) {
        return { word, letter: letterGroup.letter };
      }
    }
  }
  
  return null;
}

/**
 * Advanced search with filters
 */
export interface AdvancedSearchFilters {
  query?: string;
  categories?: string[];
  styles?: string[];
  origin?: string;
  letter?: string;
}

export async function advancedSearch(filters: AdvancedSearchFilters): Promise<SearchResult[]> {
  const dictionaries = await loadDictionary();
  const results: SearchResult[] = [];

  dictionaries.forEach(dict => {
    dict.value.forEach(letterGroup => {
      // Filter by letter if specified
      if (filters.letter && letterGroup.letter !== filters.letter) return;

      letterGroup.values.forEach(word => {
        let matches = true;

        // Check query in lemma or meaning
        if (filters.query && filters.query.trim()) {
          const normalizedQuery = filters.query.toLowerCase();
          const inLemma = word.lemma.toLowerCase().includes(normalizedQuery);
          const inMeaning = word.values.some(def =>
            def.meaning.toLowerCase().includes(normalizedQuery)
          );
          matches = inLemma || inMeaning;
        }

        // Check categories
        if (matches && filters.categories && filters.categories.length > 0) {
          matches = word.values.some(def =>
            def.categories.some(cat => filters.categories?.includes(cat))
          );
        }

        // Check styles
        if (matches && filters.styles && filters.styles.length > 0) {
          matches = word.values.some(def =>
            def.styles && def.styles.some(style => filters.styles?.includes(style))
          );
        }

        // Check origin
        if (matches && filters.origin) {
          matches = word.values.some(def =>
            def.origin && def.origin.toLowerCase().includes(filters.origin!.toLowerCase())
          );
        }

        if (matches) {
          results.push({
            word,
            letter: letterGroup.letter,
            matchType: filters.query ? 'partial' : 'exact',
          });
        }
      });
    });
  });

  return results;
}

/**
 * Get unique categories from dictionary
 */
export async function getAvailableCategories(): Promise<string[]> {
  const words = await getAllWords();
  const categories = new Set<string>();

  words.forEach(word => {
    word.values.forEach(def => {
      def.categories.forEach(cat => categories.add(cat));
    });
  });

  return Array.from(categories).sort();
}

/**
 * Get unique styles from dictionary
 */
export async function getAvailableStyles(): Promise<string[]> {
  const words = await getAllWords();
  const styles = new Set<string>();

  words.forEach(word => {
    word.values.forEach(def => {
      if (def.styles) {
        def.styles.forEach(style => styles.add(style));
      }
    });
  });

  return Array.from(styles).sort();
}

/**
 * Get unique origins from dictionary
 */
export async function getAvailableOrigins(): Promise<string[]> {
  const words = await getAllWords();
  const origins = new Set<string>();

  words.forEach(word => {
    word.values.forEach(def => {
      if (def.origin) {
        origins.add(def.origin);
      }
    });
  });

  return Array.from(origins).sort();
}