interface WordCommentSectionProps {
  editorMode: boolean;
}

export default function WordCommentSection({ editorMode }: WordCommentSectionProps) {
  return <>{editorMode && <h1>Comentarios</h1>}</>;
}
