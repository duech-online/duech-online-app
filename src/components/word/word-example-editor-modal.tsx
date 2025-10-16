'use client';

import React from 'react';
import { Button } from '@/components/common/button';

type ExampleDraft = {
  value: string;
  author: string;
  title: string;
  source: string;
  date: string;
  page: string;
};

interface ExampleEditorModalProps {
  isOpen: boolean;
  isNew: boolean;
  draft: ExampleDraft;
  onDraftChange: (draft: ExampleDraft) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function ExampleEditorModal({
  isOpen,
  isNew,
  draft,
  onDraftChange,
  onSave,
  onCancel,
}: ExampleEditorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6">
        <h2 className="mb-4 text-2xl font-bold">{isNew ? 'Nuevo ejemplo' : 'Editar ejemplo'}</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Ejemplo *</label>
            <textarea
              value={draft.value}
              onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
              className="min-h-[100px] w-full rounded border p-2"
              placeholder="Texto del ejemplo"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Autor</label>
            <input
              type="text"
              value={draft.author}
              onChange={(e) => onDraftChange({ ...draft, author: e.target.value })}
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Título</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => onDraftChange({ ...draft, title: e.target.value })}
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fuente</label>
            <input
              type="text"
              value={draft.source}
              onChange={(e) => onDraftChange({ ...draft, source: e.target.value })}
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Fecha</label>
            <input
              type="text"
              value={draft.date}
              onChange={(e) => onDraftChange({ ...draft, date: e.target.value })}
              className="w-full rounded border p-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Página</label>
            <input
              type="text"
              value={draft.page}
              onChange={(e) => onDraftChange({ ...draft, page: e.target.value })}
              className="w-full rounded border p-2"
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button onClick={onCancel} className="rounded border px-4 py-2 hover:bg-gray-50">
            Cancelar
          </Button>
          <Button
            onClick={onSave}
            className="bg-duech-blue rounded px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}

export type { ExampleDraft };
