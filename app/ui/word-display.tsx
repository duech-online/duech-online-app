'use client';

import React from 'react';
import { useState, useEffect, useRef, useCallback } from 'react';
import InlineEditable from '@/app/ui/inline-editable';
import { MultiSelector } from '@/app/ui/multi-selector-modal';
import { Button } from '@/app/ui/button';
import { DefinitionSection } from '@/app/ui/definition-section';
import { WordHeader } from '@/app/ui/word-header';
import { ExampleDisplay } from '@/app/ui/example-display';
import { SpinnerIcon, CheckCircleIcon, ExclamationCircleIcon } from '@/app/ui/icons';
import {
  GRAMMATICAL_CATEGORIES,
  USAGE_STYLES,
  STATUS_OPTIONS,
  type Example,
  type Word,
  type WordDefinition,
} from '@/app/lib/definitions';
import { ExampleEditorModal, type ExampleDraft } from '@/app/ui/example-editor-modal';

interface WordDisplayProps {
  initialWord: Word;
  initialLetter: string;
  initialStatus?: string;
  initialAssignedTo?: number;
  editorMode?: boolean;
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type ActiveExample = { defIndex: number; exIndex: number; isNew?: boolean };

const LETTER_OPTIONS = 'abcdefghijklmnñopqrstuvwxyz'.split('').map((letter) => ({
  value: letter,
  label: letter.toUpperCase(),
}));

export function WordDisplay({
  initialWord,
  initialLetter,
  initialStatus,
  initialAssignedTo,
  editorMode = false,
}: WordDisplayProps) {
  const [word, setWord] = useState<Word>(initialWord);
  const [letter, setLetter] = useState(initialLetter);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedLemma, setLastSavedLemma] = useState(initialWord.lemma);
  const [status, setStatus] = useState<string>(initialStatus || 'draft');
  const [assignedTo, setAssignedTo] = useState<number | null>(initialAssignedTo || null);
  const [users, setUsers] = useState<Array<{ id: number; username: string; role: string }>>([]);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const isEditing = (k: string) => editingKey === k;
  const toggle = (k: string) => setEditingKey((prev) => (prev === k ? null : k));

  const [editingCategories, setEditingCategories] = useState<number | null>(null);
  const [editingStyles, setEditingStyles] = useState<number | null>(null);
  const [activeExample, setActiveExample] = useState<ActiveExample | null>(null);
  const [exampleDraft, setExampleDraft] = useState<ExampleDraft | null>(null);

  // Fetch users for assignedTo dropdown (editor mode only)
  useEffect(() => {
    if (!editorMode) return;

    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data);
        }
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, [editorMode]);

  // Debounced auto-save (editor mode only)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordRef = useRef(word);
  const letterRef = useRef(letter);
  const statusRef = useRef(status);
  const assignedToRef = useRef(assignedTo);

  useEffect(() => {
    statusRef.current = status;
    assignedToRef.current = assignedTo;
    letterRef.current = letter;
  }, [status, assignedTo, letter]);

  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  const autoSave = useCallback(async () => {
    if (!editorMode) return;

    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/words/${encodeURIComponent(lastSavedLemma)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordRef.current,
          letter: letterRef.current,
          status: statusRef.current,
          assignedTo: assignedToRef.current,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar');

      setSaveStatus('saved');
      setLastSavedLemma(wordRef.current.lemma);

      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');

      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [editorMode, lastSavedLemma]);

  useEffect(() => {
    if (!editorMode) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [word, letter, status, assignedTo, autoSave, editorMode]);

  // Helper functions
  const patchWordLocal = (patch: Partial<Word>) => {
    setWord((prev) => ({ ...prev, ...patch }));
  };

  const patchDefLocal = (idx: number, patch: Partial<WordDefinition>) => {
    setWord((prev) => ({
      ...prev,
      values: prev.values.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  const emptyExample = (): Example => ({
    value: '',
    author: undefined,
    title: undefined,
    source: undefined,
    date: undefined,
    page: undefined,
  });

  const getExamples = (def: WordDefinition): Example[] => {
    const ex = def.example as Example | Example[] | undefined;
    if (!ex) return [];
    return Array.isArray(ex) ? ex : [ex];
  };

  const setExamples = (defIndex: number, arr: Example[]) => {
    setWord((prev) => {
      const values = [...prev.values];
      const normalized = arr.length === 0 ? [emptyExample()] : arr;
      values[defIndex] = {
        ...values[defIndex],
        example: normalized.length === 1 ? normalized[0] : normalized,
      };
      return { ...prev, values };
    });
  };

  const toExampleDraft = (example: Example): ExampleDraft => ({
    value: example.value ?? '',
    author: example.author ?? '',
    title: example.title ?? '',
    source: example.source ?? '',
    date: example.date ?? '',
    page: example.page ?? '',
  });

  const fromExampleDraft = (draft: ExampleDraft): Example => {
    const sanitize = (value: string) => value.trim();
    const base: Example = {
      value: sanitize(draft.value),
    };

    const author = sanitize(draft.author);
    const title = sanitize(draft.title);
    const source = sanitize(draft.source);
    const date = sanitize(draft.date);
    const page = sanitize(draft.page);

    if (author) base.author = author;
    if (title) base.title = title;
    if (source) base.source = source;
    if (date) base.date = date;
    if (page) base.page = page;

    return base;
  };

  const openExampleEditor = (defIndex: number, exIndex: number, isNew = false) => {
    const arr = getExamples(word.values[defIndex]);
    const current = arr[exIndex] ?? emptyExample();
    setActiveExample({ defIndex, exIndex, isNew });
    setExampleDraft(toExampleDraft(current));
  };

  const closeExampleEditor = (shouldDiscardNew = false) => {
    if (shouldDiscardNew && activeExample?.isNew) {
      const arr = getExamples(word.values[activeExample.defIndex]);
      setExamples(
        activeExample.defIndex,
        arr.filter((_, index) => index !== activeExample.exIndex)
      );
    }
    setActiveExample(null);
    setExampleDraft(null);
  };

  const saveExampleDraft = () => {
    if (!activeExample || !exampleDraft) {
      closeExampleEditor();
      return;
    }

    const arr = getExamples(word.values[activeExample.defIndex]);
    const updated = [...arr];
    updated[activeExample.exIndex] = fromExampleDraft(exampleDraft);
    setExamples(activeExample.defIndex, updated);
    closeExampleEditor();
  };

  const handleAddExample = (defIndex: number) => {
    const arr = getExamples(word.values[defIndex]);
    const newExample = emptyExample();
    setExamples(defIndex, [...arr, newExample]);
    openExampleEditor(defIndex, arr.length, true);
  };

  const handleDeleteExample = (defIndex: number, exIndex: number) => {
    const arr = getExamples(word.values[defIndex]);
    if (arr.length <= 1) {
      alert('La definición debe tener al menos un ejemplo.');
      return;
    }
    setExamples(
      defIndex,
      arr.filter((_, i) => i !== exIndex)
    );

    if (activeExample && activeExample.defIndex === defIndex) {
      if (activeExample.exIndex === exIndex) {
        closeExampleEditor();
      } else if (activeExample.exIndex > exIndex) {
        setActiveExample({ ...activeExample, exIndex: activeExample.exIndex - 1 });
      }
    }
  };

  const handleAddDefinition = (insertIndex?: number) => {
    const baseNumber = insertIndex !== undefined ? insertIndex + 1 : word.values.length + 1;
    const newDef: WordDefinition = {
      number: baseNumber,
      origin: null,
      categories: [],
      remission: null,
      meaning: 'Nueva definición',
      styles: null,
      observation: null,
      example: emptyExample(),
      variant: null,
      expressions: null,
    };

    setWord((prev) => {
      const values = [...prev.values];
      const insertAt = insertIndex !== undefined ? insertIndex + 1 : values.length;
      values.splice(insertAt, 0, newDef);

      const renumbered = values.map((def, idx) => ({
        ...def,
        number: idx + 1,
      }));

      return { ...prev, values: renumbered };
    });
  };

  const handleDeleteDefinition = (defIndex: number) => {
    setWord((prev) => ({ ...prev, values: prev.values.filter((_, i) => i !== defIndex) }));
  };

  // Render example helper
  const renderExample = (example: Example | Example[], defIndex?: number, isEditable = false) => {
    return (
      <ExampleDisplay
        example={example}
        defIndex={defIndex}
        editorMode={isEditable}
        onEdit={(exIndex) => defIndex !== undefined && openExampleEditor(defIndex, exIndex)}
        onAdd={() => defIndex !== undefined && handleAddExample(defIndex)}
        onDelete={(exIndex) => defIndex !== undefined && handleDeleteExample(defIndex, exIndex)}
      />
    );
  };

  // Save status indicator
  const SaveStatusIndicator = () => {
    if (!editorMode || saveStatus === 'idle') return null;

    const statusConfig = {
      saving: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        icon: <SpinnerIcon className="h-4 w-4" />,
        label: 'Guardando...',
      },
      saved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: <CheckCircleIcon className="h-4 w-4" />,
        label: 'Guardado',
      },
      error: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: <ExclamationCircleIcon className="h-4 w-4" />,
        label: 'Error al guardar',
      },
    } as const;

    const config = statusConfig[saveStatus];

    return (
      <div
        className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg ${config.bg} px-4 py-2 shadow-lg ${config.text}`}
      >
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  const hasDefinitions = word.values.length > 0;
  const searchPath = '/buscar';
  const searchLabel = editorMode ? 'Buscar' : 'Buscar';

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SaveStatusIndicator />

      <WordHeader
        lemma={word.lemma}
        onLemmaChange={(v) => patchWordLocal({ lemma: v ?? '' })}
        editorMode={editorMode}
        editingLemma={isEditing('lemma')}
        onStartEditLemma={() => toggle('lemma')}
        onCancelEditLemma={() => setEditingKey(null)}
        letter={letter}
        onLetterChange={setLetter}
        letterOptions={LETTER_OPTIONS}
        assignedTo={assignedTo}
        onAssignedToChange={setAssignedTo}
        users={users}
        status={status}
        onStatusChange={setStatus}
        statusOptions={STATUS_OPTIONS}
        searchPath={searchPath}
        searchLabel={searchLabel}
      />

      <div className="border-duech-gold rounded-xl border-t-4 bg-white p-10 shadow-2xl">
        {/* Root */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-gray-700">Raíz: </span>
          <span className="text-duech-blue font-semibold">
            <InlineEditable
              value={word.root}
              onChange={(v) => patchWordLocal({ root: v ?? '' })}
              editorMode={editorMode}
              editing={isEditing('root')}
              onStart={() => toggle('root')}
              onCancel={() => setEditingKey(null)}
              saveStrategy="manual"
              placeholder="Raíz de la palabra"
              addLabel="+ Añadir raíz"
            />
          </span>
        </div>

        {/* Definitions */}
        <div className="space-y-16">
          {hasDefinitions ? (
            word.values.map((def, defIndex) => (
              <DefinitionSection
                key={defIndex}
                definition={def}
                defIndex={defIndex}
                editorMode={editorMode}
                editingKey={editingKey}
                onToggleEdit={toggle}
                onPatchDefinition={(patch) => patchDefLocal(defIndex, patch)}
                onSetEditingCategories={() => setEditingCategories(defIndex)}
                onSetEditingStyles={() => setEditingStyles(defIndex)}
                onAddDefinition={() => handleAddDefinition(defIndex)}
                onDeleteDefinition={() => handleDeleteDefinition(defIndex)}
                renderExample={renderExample}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center text-gray-600">
              <p>Esta palabra aún no tiene definiciones.</p>
              {editorMode && (
                <Button
                  type="button"
                  onClick={() => handleAddDefinition()}
                  className="bg-duech-blue rounded-full px-6 py-2 text-sm text-white hover:bg-blue-800"
                >
                  Añadir definición
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Multi-select modals (editor mode only) */}
      {editorMode && editingCategories !== null && (
        <MultiSelector
          isOpen
          onClose={() => setEditingCategories(null)}
          onSave={(cats: string[]) => {
            patchDefLocal(editingCategories, { categories: cats });
          }}
          selectedItems={word.values[editingCategories].categories}
          title="Seleccionar categorías gramaticales"
          options={GRAMMATICAL_CATEGORIES}
          maxWidth="2xl"
          columns={3}
        />
      )}

      {editorMode && editingStyles !== null && (
        <MultiSelector
          isOpen
          onClose={() => setEditingStyles(null)}
          onSave={(styles: string[]) => {
            patchDefLocal(editingStyles, { styles: styles.length ? styles : null });
          }}
          selectedItems={word.values[editingStyles].styles || []}
          title="Seleccionar estilos de uso"
          options={USAGE_STYLES}
          maxWidth="lg"
          columns={2}
        />
      )}

      {/* Example editor modal */}
      <ExampleEditorModal
        isOpen={editorMode && activeExample !== null && exampleDraft !== null}
        isNew={activeExample?.isNew ?? false}
        draft={exampleDraft ?? { value: '', author: '', title: '', source: '', date: '', page: '' }}
        onDraftChange={setExampleDraft}
        onSave={saveExampleDraft}
        onCancel={() => closeExampleEditor(activeExample?.isNew)}
      />
    </div>
  );
}
