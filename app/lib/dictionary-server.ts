/**
 * Server-side dictionary data loader
 * This file contains functions that only run on the server
 */

import { Dictionary, Word } from '@/app/lib/definitions';
import { dictionaries } from '@/app/lib/placeholder-data';

export function loadDictionaryServer(): Promise<Dictionary[]> {
  return Promise.resolve(dictionaries as Dictionary[]);
}

/**
 * Get word by lemma (server-side)
 */
export async function getWordByLemmaServer(
  lemma: string
): Promise<{ word: Word; letter: string } | null> {
  const dicts = dictionaries as Dictionary[];
  for (const dict of dicts) {
    for (const letterGroup of dict.value) {
      const word = letterGroup.values.find((w) => w.lemma === lemma);
      if (word) {
        return { word, letter: letterGroup.letter };
      }
    }
  }

  return null;
}
