'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { GRAMMATICAL_CATEGORIES, type Word } from '@/lib/definitions';
import MarkdownRenderer from '@/components/word/markdown-renderer';
import { ArrowRightIcon, BookOpenIcon } from '@/components/icons';
import { Button } from '@/components/common/button';
import { ChipList } from '@/components/common/chip';
import { isEditorModeClient } from '@/lib/editor-mode';

interface WordOfTheDayData {
  word: Word;
  letter: string;
}

export default function WordOfTheDay() {
  const pathname = usePathname();
  const editorMode = isEditorModeClient();
  const [word, setWord] = useState<WordOfTheDayData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWordOfTheDay() {
      try {
        const response = await fetch('/api/word-of-the-day');
        if (!response.ok) {
          throw new Error('Failed to fetch word of the day');
        }
        const data = await response.json();
        setWord(data);
      } catch (err) {
        console.error('WordOfTheDay load error:', err);
        setError(err instanceof Error ? err.message : 'No pudimos cargar la palabra del día.');
      } finally {
        setLoading(false);
      }
    }

    fetchWordOfTheDay();
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-md">
        <p className="text-gray-700">Cargando palabra del día...</p>
      </div>
    );
  }

  if (!word) {
    return (
      <div className="rounded-lg bg-white p-6 text-center shadow-md">
        <p className="text-gray-700">
          {error ? error : 'Aún no hay una palabra destacada para mostrar.'}
        </p>
      </div>
    );
  }

  const firstDefinition = word.word.values[0];
  const shortMeaning =
    firstDefinition.meaning.length > 150
      ? firstDefinition.meaning.substring(0, 150) + '...'
      : firstDefinition.meaning;

  return (
    <div className="border-duech-gold card-hover rounded-xl border-t-4 bg-white p-8 shadow-lg">
      <h2 className="text-duech-gold mb-6 flex items-center text-2xl font-bold">
        <BookOpenIcon className="text-duech-blue mr-3 h-8 w-8" />
        Palabra del Día
      </h2>
      <div className="mb-6">
        <h3 className="text-duech-blue mb-3 text-3xl font-bold">{word.word.lemma}</h3>
        {firstDefinition.categories.length > 0 && (
          <div className="mb-4">
            <ChipList
              items={firstDefinition.categories}
              labels={GRAMMATICAL_CATEGORIES}
              variant="category"
              editorMode={false}
            />
          </div>
        )}
      </div>

      <div className="mb-6 text-lg leading-relaxed text-gray-800">
        <MarkdownRenderer content={shortMeaning} />
      </div>

      <Button
        href={`/palabra/${encodeURIComponent(word.word.lemma)}`}
        className="bg-duech-gold px-6 py-3 font-semibold text-gray-900 shadow-md hover:bg-yellow-500"
      >
        Ver definición completa
        <ArrowRightIcon className="ml-2 h-5 w-5 text-gray-900" />
      </Button>
    </div>
  );
}
