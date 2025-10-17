'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { Button } from '@/components/common/button';
import { PencilIcon } from '@/components/icons';

type InlineEditableProps = {
  value: string | null;
  // cuando saveStrategy === 'immediate'
  onSave?: (v: string | null) => Promise<void> | void;
  // cuando saveStrategy === 'manual'
  onChange?: (v: string | null) => void;

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

  // New props for the complete pattern
  editorMode?: boolean;
  addLabel?: string;
  renderDisplay?: (value: string) => ReactNode;
  renderWrapper?: (children: ReactNode) => ReactNode;
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
  editorMode = true,
  addLabel,
  renderDisplay,
  renderWrapper,
}: InlineEditableProps) {
  const isControlled = typeof editing === 'boolean';
  const [internalEditing, setInternalEditing] = useState(false);
  const isEditing = isControlled ? (editing as boolean) : internalEditing;

  const [draft, setDraft] = useState(value ?? '');
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => {
    setDraft(value ?? '');
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
    const a = draft.trim();
    const b = (value ?? '').trim();
    if (a === b) {
      cancel(); // No changes, just close
      return;
    }
    await onSave?.(a || null);
    end();
    onCancel?.(); // Close editing mode
  };

  const doManual = () => {
    const trimmed = draft.trim();
    onChange?.(trimmed || null);
    end();
    onCancel?.(); // Close editing mode after saving
  };

  const save = () => (saveStrategy === 'manual' ? doManual() : doImmediate());
  const cancel = () => {
    setDraft(value ?? '');
    end();
    onCancel?.();
  };

  const displayValue = value?.trim() || '';
  const finalAddLabel = addLabel || `+ ${placeholder}`;

  // Public mode (not editor mode) - just display the value
  if (!editorMode) {
    if (!displayValue) return null;

    const content = renderDisplay ? renderDisplay(displayValue) : displayValue;
    return renderWrapper ? <>{renderWrapper(content)}</> : <>{content}</>;
  }

  // Editor mode - not editing
  if (!isEditing) {
    // Has value - show value with edit button
    if (displayValue) {
      const content = renderDisplay ? renderDisplay(displayValue) : displayValue;
      const wrappedContent = renderWrapper ? renderWrapper(content) : content;

      return (
        <div className="flex items-center gap-2">
          {wrappedContent}
          <Button
            onClick={begin}
            className="text-duech-blue inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-100"
            aria-label={`Editar ${placeholder.toLowerCase()}`}
            title={`Editar ${placeholder.toLowerCase()}`}
          >
            <PencilIcon className="h-5 w-5" />
          </Button>
        </div>
      );
    }

    // Empty - show "add" button
    return (
      <Button onClick={begin} className="hover:text-duech-blue text-sm text-gray-500 underline">
        {finalAddLabel}
      </Button>
    );
  }

  // Editor mode - currently editing

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
