'use client';

import { useState } from 'react';
import type { Example } from '@/app/lib/definitions';
import { Button } from '@/app/ui/button';

export function ExampleEditor({
  isOpen,
  initial,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  initial: Example;
  onClose: () => void;
  onSave: (e: Example) => void;
}) {
  const [ex, setEx] = useState<Example>(initial);
  if (!isOpen) return null;
  const set = (k: keyof Example, v: string | null) =>
    setEx((prev) => ({ ...prev, [k]: v && v.length ? v : null }));

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-xl font-bold text-gray-900">Editar ejemplo</h3>

        <label className="mb-2 block text-sm font-medium">Texto</label>
        <textarea
          rows={5}
          value={ex.value || ''}
          onChange={(e) => set('value', e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <input
            placeholder="Autor"
            value={ex.author ?? ''}
            onChange={(e) => set('author', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Título"
            value={ex.title ?? ''}
            onChange={(e) => set('title', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Fuente"
            value={ex.source ?? ''}
            onChange={(e) => set('source', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Fecha"
            value={ex.date ?? ''}
            onChange={(e) => set('date', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
          <input
            placeholder="Página"
            value={ex.page ?? ''}
            onChange={(e) => set('page', e.target.value)}
            className="rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onSave(ex);
              onClose();
            }}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
