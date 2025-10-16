'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getWordOfTheDay } from '@/app/lib/dictionary';
import { Word, GRAMMATICAL_CATEGORIES } from '@/app/lib/definitions';
import MarkdownRenderer from '@/app/ui/markdown-renderer';
import { ArrowRightIcon, BookOpenIcon } from './icons';
import { Button } from './button';
import { Chip } from '@/app/ui/chip';
import { isEditorModeClient } from '@/app/lib/editor-mode';

export default function WordOfTheDay() {
  const pathname = usePathname();
  const editorMode = isEditorModeClient(pathname);
  const [word, setWord] = useState<{ word: Word; letter: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadRandomWord = async () => {
      setLoading(true);
      setError(null);
      try {
        const randomWord = await getWordOfTheDay();
        if (!active) return;
        setWord(randomWord);
      } catch (err) {
        console.error('WordOfTheDay load error:', err);
        if (!active) return;
        const message =
          err instanceof Error ? err.message : 'No pudimos cargar la palabra del día.';
        setWord(null);
        setError(message);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadRandomWord();

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse rounded-lg bg-white p-6 shadow-md">
        <div className="mb-4 h-6 w-1/3 rounded bg-gray-200"></div>
        <div className="mb-3 h-8 w-1/2 rounded bg-gray-200"></div>
        <div className="mb-2 h-4 w-full rounded bg-gray-200"></div>
        <div className="h-4 w-3/4 rounded bg-gray-200"></div>
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
          <div className="mb-4 flex flex-wrap gap-2">
            {firstDefinition.categories.map((cat, index) => (
              <Chip
                key={index}
                code={cat}
                label={GRAMMATICAL_CATEGORIES[cat] || cat}
                variant="category"
              />
            ))}
          </div>
        )}
      </div>

      <div className="mb-6 text-lg leading-relaxed text-gray-800">
        <MarkdownRenderer content={shortMeaning} />
      </div>

      <Button
        href={
          editorMode
            ? `/editor/palabra/${encodeURIComponent(word.word.lemma)}`
            : `/palabra/${encodeURIComponent(word.word.lemma)}`
        }
        className="bg-duech-gold px-6 py-3 font-semibold text-gray-900 shadow-md hover:bg-yellow-500"
      >
        Ver definición completa
        <ArrowRightIcon className="ml-2 h-5 w-5 text-gray-900" />
      </Button>
    </div>
  );
}
