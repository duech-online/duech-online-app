'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  value: string;
  // cuando saveStrategy === 'immediate'
  onSave?: (v: string) => Promise<void> | void;
  // cuando saveStrategy === 'manual'
  onChange?: (v: string) => void;

  as?: 'input' | 'textarea';
  placeholder?: string;
  className?: string;

  // controlado opcional
  editing?: boolean;
  onCancel?: () => void;
  onStart?: () => void;

  // 'manual' => Enter/blur: llama onChange(v) y cierra (no API)
  // 'immediate' => Enter/blur: llama onSave(v) y cierra (sí API)
  saveStrategy?: 'manual' | 'immediate';
};

export default function InlineEditable({
  value,
  onSave,
  onChange,
  as = 'input',
  placeholder = '—',
  className = '',
  editing,
  onCancel,
  onStart,
  saveStrategy = 'manual', // por defecto manual
}: Props) {
  const isControlled = typeof editing === 'boolean';
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = isControlled ? (editing as boolean) : internalEditing;

  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);
  useEffect(() => {
    if (isEditing) ref.current?.focus();
  }, [isEditing]);

  const begin = () => {
    if (isControlled) onStart?.();
    else setInternalEditing(true);
  };
  const end = () => {
    if (!isControlled) setInternalEditing(false);
  };

  const doImmediate = async () => {
    end();
    const a = (draft ?? '').trim();
    const b = (value ?? '').trim();
    if (a === b) return;
    await onSave?.(draft);
  };

  const doManual = () => {
    end();
    onChange?.(draft);
  };

  const save = () => (saveStrategy === 'manual' ? doManual() : doImmediate());
  const cancel = () => {
    setDraft(value);
    end();
    onCancel?.();
  };

  if (!isEditing) {
    return (
      <span
        className={`cursor-text rounded px-1 hover:bg-yellow-50 ${className}`}
        onClick={begin}
        title="Click para editar"
      >
        {value?.trim() ? value : <em className="text-gray-400">{placeholder}</em>}
      </span>
    );
  }

  if (as === 'textarea') {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          // Enter: salir/guardar local. Shift+Enter: salto de línea.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            save();
          }
          if (e.key === 'Escape') cancel();
        }}
        rows={3}
        className={`w-full rounded border border-gray-300 p-2 ${className}`}
      />
    );
  }

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === 'Enter') save();
        if (e.key === 'Escape') cancel();
      }}
      className={`rounded border border-gray-300 px-2 py-1 ${className}`}
    />
  );
}
