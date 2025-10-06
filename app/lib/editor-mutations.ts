import 'server-only';
import { db } from '@/app/lib/db';
import { words, meanings } from '@/app/lib/schema';
import { eq } from 'drizzle-orm';
import type { Word, Example } from '@/app/lib/definitions';

/**
 * Update a word and all its meanings
 */
export async function updateWordByLemma(prevLemma: string, updatedWord: Word) {
  // Find the word by lemma
  const existingWord = await db.query.words.findFirst({
    where: eq(words.lemma, prevLemma),
  });

  if (!existingWord) {
    throw new Error(`Word not found: ${prevLemma}`);
  }

  // Update word metadata (lemma, root)
  await db
    .update(words)
    .set({
      lemma: updatedWord.lemma,
      root: updatedWord.root || null,
      updatedAt: new Date(),
    })
    .where(eq(words.id, existingWord.id));

  // Delete all existing meanings for this word
  await db.delete(meanings).where(eq(meanings.wordId, existingWord.id));

  // Insert new meanings
  for (const def of updatedWord.values) {
    // Normalize examples to array
    const examplesArray = Array.isArray(def.example)
      ? def.example
      : def.example
        ? [def.example]
        : [];

    // Convert examples to match database schema (remove undefined fields)
    const cleanedExamples = examplesArray.map((ex: Example) => ({
      value: ex.value,
      ...(ex.author !== undefined && { author: ex.author }),
      ...(ex.title !== undefined && { title: ex.title }),
      ...(ex.source !== undefined && { source: ex.source }),
      ...(ex.date !== undefined && { date: ex.date }),
      ...(ex.page !== undefined && { page: ex.page }),
    }));

    await db.insert(meanings).values({
      wordId: existingWord.id,
      number: def.number,
      origin: def.origin || null,
      meaning: def.meaning,
      observation: def.observation || null,
      remission: def.remission || null,
      categories: def.categories.length > 0 ? def.categories : null,
      styles: def.styles && def.styles.length > 0 ? def.styles : null,
      examples: cleanedExamples.length > 0 ? cleanedExamples : null,
      expressions: def.expressions && def.expressions.length > 0 ? def.expressions : null,
    });
  }

  return { success: true };
}

/**
 * Create a new word with its meanings
 */
export async function createWord(newWord: Word, createdBy?: number) {
  // Insert the word
  const [wordRecord] = await db
    .insert(words)
    .values({
      lemma: newWord.lemma,
      root: newWord.root || null,
      letter: newWord.lemma[0].toLowerCase(),
      status: 'draft',
      createdBy: createdBy || null,
    })
    .returning();

  // Insert meanings
  for (const def of newWord.values) {
    const examplesArray = Array.isArray(def.example)
      ? def.example
      : def.example
        ? [def.example]
        : [];

    const cleanedExamples = examplesArray.map((ex: Example) => ({
      value: ex.value,
      ...(ex.author !== undefined && { author: ex.author }),
      ...(ex.title !== undefined && { title: ex.title }),
      ...(ex.source !== undefined && { source: ex.source }),
      ...(ex.date !== undefined && { date: ex.date }),
      ...(ex.page !== undefined && { page: ex.page }),
    }));

    await db.insert(meanings).values({
      wordId: wordRecord.id,
      number: def.number,
      origin: def.origin || null,
      meaning: def.meaning,
      observation: def.observation || null,
      remission: def.remission || null,
      categories: def.categories.length > 0 ? def.categories : null,
      styles: def.styles && def.styles.length > 0 ? def.styles : null,
      examples: cleanedExamples.length > 0 ? cleanedExamples : null,
      expressions: def.expressions && def.expressions.length > 0 ? def.expressions : null,
    });
  }

  return { success: true, wordId: wordRecord.id };
}

/**
 * Delete a word by lemma (cascade delete will remove meanings)
 */
export async function deleteWordByLemma(lemma: string) {
  const existingWord = await db.query.words.findFirst({
    where: eq(words.lemma, lemma),
  });

  if (!existingWord) {
    throw new Error(`Word not found: ${lemma}`);
  }

  await db.delete(words).where(eq(words.id, existingWord.id));
  return { success: true };
}
