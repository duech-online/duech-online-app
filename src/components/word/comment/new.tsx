'use client';

import React, { useState } from 'react';
import { Button } from '@/components/common/button';
import { PlusIcon } from '@/components/icons';
import EditableInput from '@/components/word/editable-input';

type NewCommentProps = {
  onAdd: (text: string) => Promise<void> | void;
  editorMode?: boolean;
};

/**
 * NewComment
 * Renders a button to add a new comment. When clicked, shows an EditableInput
 * to enter the comment text. Calls `onAdd` with the new text.
 */
export default function NewComment({ onAdd, editorMode = true }: NewCommentProps) {
  const [adding, setAdding] = useState(false);

  const start = () => setAdding(true);
  const cancel = () => setAdding(false);

  const handleAdd = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      cancel();
      return;
    }
    try {
      await onAdd(trimmed);
    } finally {
      setAdding(false);
    }
  };

  if (!editorMode) return null;

  return (
    <div className={`w-full sm:w-auto ${adding ? 'sm:flex-1' : 'sm:flex-shrink-0'}`}>
      {!adding ? (
        <Button
          onClick={start}
          className="bg-duech-blue inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-800"
        >
          <PlusIcon className="h-4 w-4" /> Añadir comentario
        </Button>
      ) : (
        <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/60 p-4 shadow-inner">
          <p className="text-xs font-medium text-blue-900">Escribe un comentario editorial.</p>
          <EditableInput
            value=""
            onChange={handleAdd}
            onBlur={cancel}
            placeholder="Escribe tu comentario y presiona Enter…"
            autoFocus
            className="mt-3 w-full bg-white shadow-sm"
          />
        </div>
      )}
    </div>
  );
}
