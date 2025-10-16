import { notFound } from 'next/navigation';
import { getWordByLemma } from '@/app/lib/queries';
import { WordDisplay } from '@/app/ui/word-display';

export default async function WordDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const decodedLemma = decodeURIComponent(id);

  const wordData = await getWordByLemma(decodedLemma);

  if (!wordData) {
    notFound();
  }

  const { word, letter } = wordData;

  return <WordDisplay initialWord={word} initialLetter={letter} />;
}
