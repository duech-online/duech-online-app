import { notFound } from 'next/navigation';
import { getWordByLemma } from '@/app/lib/queries';
import { WordDisplay } from '@/app/components/word/word-display';
import { isEditorMode } from '@/app/lib/editor-mode-server';

export default async function WordDetailPage({ params }: { params: { id: string } }) {
  const editorMode = await isEditorMode();
  const decodedLemma = decodeURIComponent(params.id);

  const wordData = await getWordByLemma(
    decodedLemma,
    editorMode ? { includeDrafts: true } : undefined
  );

  if (!wordData) {
    notFound();
  }

  const { word, letter, status, assignedTo } = wordData;

  return (
    <WordDisplay
      initialWord={word}
      initialLetter={letter}
      initialStatus={status}
      initialAssignedTo={assignedTo ?? undefined}
      editorMode={editorMode}
    />
  );
}
