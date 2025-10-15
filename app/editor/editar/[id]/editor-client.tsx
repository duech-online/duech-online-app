'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/app/ui/markdown-renderer';
import InlineEditable from '@/app/ui/inline-editable';
import { MultiSelector } from '@/app/ui/multi-selector';
import { Chip } from '@/app/ui/chip';
import { Button } from '@/app/ui/button';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  SpinnerIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@/app/ui/icons';
import {
  GRAMMATICAL_CATEGORIES,
  USAGE_STYLES,
  STATUS_OPTIONS,
  type Example,
  type Word,
  type WordDefinition,
} from '@/app/lib/definitions';

type Props = {
  initialWord: Word;
  initialLetter: string;
  initialStatus?: string;
  initialAssignedTo?: number;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type ActiveExample = { defIndex: number; exIndex: number; isNew?: boolean };

type ExampleDraft = {
  value: string;
  author: string;
  title: string;
  source: string;
  date: string;
  page: string;
};

export default function EditorClient({
  initialWord,
  initialLetter,
  initialStatus,
  initialAssignedTo,
}: Props) {
  const [word, setWord] = useState<Word>(initialWord);
  const [letter] = useState(initialLetter);
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

  // Fetch users for assignedTo dropdown
  useEffect(() => {
    fetch('/api/users')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.data);
        }
      })
      .catch((err) => console.error('Error fetching users:', err));
  }, []);

  // Debounced auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordRef = useRef(word);
  const statusRef = useRef(status);
  const assignedToRef = useRef(assignedTo);

  // Keep refs up to date
  useEffect(() => {
    statusRef.current = status;
    assignedToRef.current = assignedTo;
  }, [status, assignedTo]);

  // Keep wordRef up to date
  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/words/${encodeURIComponent(lastSavedLemma)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: wordRef.current,
          status: statusRef.current,
          assignedTo: assignedToRef.current,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar');

      setSaveStatus('saved');
      setLastSavedLemma(wordRef.current.lemma);

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');

      // Reset error status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }
  }, [lastSavedLemma]);

  // Debounced save trigger - 2 seconds after last change
  useEffect(() => {
    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save
    saveTimeoutRef.current = setTimeout(() => {
      autoSave();
    }, 2000); // 2 second debounce

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [word, status, assignedTo, autoSave]);

  // ---------- helpers: patch LOCAL ----------
  const patchWordLocal = (patch: Partial<Word>) => {
    setWord((prev) => ({ ...prev, ...patch }));
  };

  const patchDefLocal = (idx: number, patch: Partial<WordDefinition>) => {
    setWord((prev) => ({
      ...prev,
      values: prev.values.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));
  };

  // ---------- ejemplos ----------
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

  // ---------- definiciones ----------
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

  // Save status indicator component
  const SaveStatusIndicator = () => {
    if (saveStatus === 'idle') return null;

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

  // ---------- UI ----------
  const hasDefinitions = word.values.length > 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <SaveStatusIndicator />

      <div className="border-duech-gold rounded-xl border-t-4 bg-white p-10 shadow-2xl">
        {/* header */}
        <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-duech-blue text-5xl font-bold">
              <InlineEditable
                value={word.lemma}
                editing={isEditing('lemma')}
                saveStrategy="manual"
                onChange={(v) => {
                  patchWordLocal({ lemma: v });
                  setEditingKey(null);
                }}
                onCancel={() => setEditingKey(null)}
                placeholder="(lema)"
              />
            </h1>

            <span className="text-duech-gold rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold uppercase">
              LETRA {letter.toUpperCase()}
            </span>

            <Button
              onClick={() => toggle('lemma')}
              className="text-duech-blue ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
              aria-label="Editar lema"
              title="Editar lema"
            >
              <PencilIcon className="h-6 w-6" />
            </Button>
          </div>

          {/* selects locales */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
              <label htmlFor="assignedTo" className="font-semibold text-blue-900">
                Asignado a:
              </label>
              <select
                id="assignedTo"
                value={assignedTo ?? ''}
                onChange={(e) => setAssignedTo(e.target.value ? Number(e.target.value) : null)}
                className="rounded border-gray-300 bg-white text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Sin asignar</option>
                {users
                  .filter(
                    (u) => u.role === 'lexicographer' || u.role === 'editor' || u.role === 'admin'
                  )
                  .map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.username}
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
              <label htmlFor="status" className="font-semibold text-blue-900">
                Estado:
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="rounded border-gray-300 bg-white text-sm text-gray-800 focus:border-blue-500 focus:ring-blue-500"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* raíz */}
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-gray-700">Raíz: </span>
          <span className="text-duech-blue font-semibold">
            <InlineEditable
              value={word.root}
              editing={isEditing('root')}
              saveStrategy="manual"
              onChange={(v) => {
                patchWordLocal({ root: v });
                setEditingKey(null);
              }}
              onCancel={() => setEditingKey(null)}
              placeholder="+ Añadir raíz"
            />
          </span>
          <Button
            onClick={() => toggle('root')}
            className="text-duech-blue inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
            aria-label="Editar raíz"
            title="Editar raíz"
          >
            <PencilIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* definiciones */}
        <div className="space-y-16">
          {hasDefinitions ? (
            word.values.map((def, defIndex) => {
              const exs = getExamples(def);
              return (
                <section
                  key={defIndex}
                  className="relative rounded-2xl border-2 border-blue-300/70 bg-white p-6 pb-16 pl-14 shadow-sm sm:pl-16"
                >
                  {/* número + origen */}
                  <div className="mt-1 mb-2 flex items-center gap-2">
                    <span className="bg-duech-blue absolute top-3 left-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white">
                      {def.number}
                    </span>

                    {/* ORIGEN */}
                    {isEditing(`def:${defIndex}:origin`) ? (
                      <div className="flex items-center gap-2">
                        <InlineEditable
                          value={def.origin ?? ''}
                          editing
                          saveStrategy="manual"
                          onChange={(v) => {
                            patchDefLocal(defIndex, { origin: v ? v : null });
                            setEditingKey(null);
                          }}
                          onCancel={() => setEditingKey(null)}
                          placeholder="Origen (p. ej. inglés, quechua)"
                        />
                      </div>
                    ) : def.origin ? (
                      <>
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Origen:</span> {def.origin}
                        </span>
                        <Button
                          onClick={() => toggle(`def:${defIndex}:origin`)}
                          className="text-duech-blue inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                          aria-label="Editar origen"
                          title="Editar origen"
                        >
                          <PencilIcon className="h-6 w-6" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => toggle(`def:${defIndex}:origin`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Añadir origen
                      </Button>
                    )}
                  </div>

                  {/* categorías */}
                  <div className="mb-3">
                    {!def.categories || def.categories.length === 0 ? (
                      <Button
                        onClick={() => setEditingCategories(defIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Añadir categorías
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {def.categories.map((cat, i) => (
                          <Chip
                            key={`${cat}-${i}`}
                            code={cat}
                            label={GRAMMATICAL_CATEGORIES[cat] || cat}
                            onRemove={(code) => {
                              const next = def.categories.filter((c) => c !== code);
                              patchDefLocal(defIndex, { categories: next });
                            }}
                            variant="category"
                          />
                        ))}

                        <Button
                          onClick={() => setEditingCategories(defIndex)}
                          aria-label="Editar categorías"
                          title="Editar categorías"
                          className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 leading-none text-blue-600 hover:bg-blue-50"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* remisión */}
                  <div className="mb-2 flex items-center gap-2">
                    {isEditing(`def:${defIndex}:remission`) ? (
                      <InlineEditable
                        value={def.remission ?? ''}
                        editing
                        saveStrategy="manual"
                        onChange={(v) => {
                          patchDefLocal(defIndex, { remission: v ? v : null });
                          setEditingKey(null);
                        }}
                        onCancel={() => setEditingKey(null)}
                        placeholder="Artículo de remisión"
                      />
                    ) : def.remission ? (
                      <>
                        <span className="text-lg text-gray-800">Ver </span>
                        <Link
                          href={`/editor/editar/${encodeURIComponent(def.remission)}`}
                          className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                        >
                          {def.remission}
                        </Link>
                        <Button
                          onClick={() => toggle(`def:${defIndex}:remission`)}
                          className="text-duech-blue inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                          aria-label="Editar remisión"
                          title="Editar remisión"
                        >
                          <PencilIcon className="h-6 w-6" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => toggle(`def:${defIndex}:remission`)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Añadir remisión
                      </Button>
                    )}
                  </div>

                  {/* significado */}
                  <div className="mb-4">
                    {isEditing(`def:${defIndex}:meaning`) ? (
                      <InlineEditable
                        as="textarea"
                        value={def.meaning}
                        editing
                        saveStrategy="manual"
                        onChange={(v) => {
                          patchDefLocal(defIndex, { meaning: v });
                          setEditingKey(null);
                        }}
                        onCancel={() => setEditingKey(null)}
                      />
                    ) : (
                      <div className="text-xl leading-relaxed text-gray-900">
                        <MarkdownRenderer content={def.meaning} />
                        <Button
                          onClick={() => toggle(`def:${defIndex}:meaning`)}
                          className="text-duech-blue mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                          aria-label="Editar significado"
                          title="Editar significado"
                        >
                          <PencilIcon className="h-6 w-6" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* estilos de uso */}
                  <div className="mb-3">
                    {!def.styles || def.styles.length === 0 ? (
                      <Button
                        onClick={() => setEditingStyles(defIndex)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Añadir estilos de uso
                      </Button>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        {def.styles.map((s) => (
                          <Chip
                            className="bg-duech-gold inline-block rounded-full px-4 py-2 text-sm font-semibold text-gray-900"
                            key={s}
                            code={s}
                            label={USAGE_STYLES[s] || s}
                            onRemove={(code: string) => {
                              const next = (def.styles || []).filter((x) => x !== code);
                              patchDefLocal(defIndex, { styles: next.length ? next : null });
                            }}
                            variant="style"
                          />
                        ))}

                        <Button
                          onClick={() => setEditingStyles(defIndex)}
                          aria-label="Editar estilos de uso"
                          title="Editar estilos de uso"
                          className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 leading-none text-blue-600 hover:bg-blue-50"
                        >
                          <PlusIcon className="h-5 w-5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* observación */}
                  <div className="mb-3">
                    {isEditing(`def:${defIndex}:observation`) ? (
                      <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-900">
                        <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                          Observación
                        </label>
                        <textarea
                          value={def.observation ?? ''}
                          onChange={(event) =>
                            patchDefLocal(defIndex, {
                              observation: event.target.value.trim() ? event.target.value : null,
                            })
                          }
                          rows={3}
                          className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                          placeholder="Añade una observación…"
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              if (!def.observation?.trim()) {
                                patchDefLocal(defIndex, { observation: null });
                              }
                              toggle(`def:${defIndex}:observation`);
                            }}
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                          >
                            Cerrar
                          </Button>
                        </div>
                      </div>
                    ) : def.observation ? (
                      <Button
                        type="button"
                        onClick={() => toggle(`def:${defIndex}:observation`)}
                        className="w-full rounded-md bg-blue-50 px-4 py-3 text-left text-sm text-blue-800 hover:bg-blue-100"
                      >
                        <span className="font-semibold">Observación:</span> {def.observation}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          patchDefLocal(defIndex, { observation: '' });
                          toggle(`def:${defIndex}:observation`);
                        }}
                        className="text-duech-blue text-sm hover:text-blue-800"
                      >
                        + Añadir observación
                      </Button>
                    )}
                  </div>

                  {/* ejemplos */}
                  <div className="mt-4">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-sm font-medium text-gray-900">
                        Ejemplo{exs.length > 1 ? 's' : ''}
                      </h3>
                      <Button
                        onClick={() => handleAddExample(defIndex)}
                        aria-label="Agregar ejemplo"
                        title="Agregar ejemplo"
                        className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {exs.map((ex, exIndex) => {
                        const isExampleActive =
                          activeExample?.defIndex === defIndex &&
                          activeExample?.exIndex === exIndex;
                        const draft = isExampleActive ? exampleDraft : null;

                        return (
                          <div
                            key={exIndex}
                            className="relative rounded-xl border border-blue-100 bg-blue-50/70 p-4 pb-16 ring-1 ring-blue-100 ring-inset"
                          >
                            {isExampleActive && draft ? (
                              <>
                                <div className="mb-4">
                                  <label className="mb-1 block text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                    Texto del ejemplo
                                  </label>
                                  <textarea
                                    autoFocus
                                    value={draft.value}
                                    onChange={(event) =>
                                      setExampleDraft((prev) =>
                                        prev ? { ...prev, value: event.target.value } : prev
                                      )
                                    }
                                    rows={4}
                                    className="min-h-[120px] w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                    placeholder="Escribe el ejemplo..."
                                  />
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                  <div>
                                    <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                      Autor
                                    </label>
                                    <input
                                      value={draft.author}
                                      onChange={(event) =>
                                        setExampleDraft((prev) =>
                                          prev ? { ...prev, author: event.target.value } : prev
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                      placeholder="Nombre del autor"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                      Título
                                    </label>
                                    <input
                                      value={draft.title}
                                      onChange={(event) =>
                                        setExampleDraft((prev) =>
                                          prev ? { ...prev, title: event.target.value } : prev
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                      placeholder="Título de la obra / artículo"
                                    />
                                  </div>

                                  <div>
                                    <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                      Fuente
                                    </label>
                                    <input
                                      value={draft.source}
                                      onChange={(event) =>
                                        setExampleDraft((prev) =>
                                          prev ? { ...prev, source: event.target.value } : prev
                                        )
                                      }
                                      className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                      placeholder="Revista, libro, medio..."
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
                                    <div>
                                      <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                        Fecha
                                      </label>
                                      <input
                                        value={draft.date}
                                        onChange={(event) =>
                                          setExampleDraft((prev) =>
                                            prev ? { ...prev, date: event.target.value } : prev
                                          )
                                        }
                                        className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        placeholder="1998, s. XIX, etc."
                                      />
                                    </div>

                                    <div>
                                      <label className="text-xs font-semibold tracking-wide text-blue-900 uppercase">
                                        Página
                                      </label>
                                      <input
                                        value={draft.page}
                                        onChange={(event) =>
                                          setExampleDraft((prev) =>
                                            prev ? { ...prev, page: event.target.value } : prev
                                          )
                                        }
                                        className="mt-1 w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                                        placeholder="p. 42"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="absolute right-3 bottom-3 flex gap-2">
                                  <Button
                                    type="button"
                                    onClick={saveExampleDraft}
                                    className="bg-duech-blue text-white hover:bg-blue-800"
                                  >
                                    Guardar ejemplo
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={() =>
                                      closeExampleEditor(activeExample?.isNew ?? false)
                                    }
                                    className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="mb-3 text-gray-700">
                                  <MarkdownRenderer content={ex.value || '*Ejemplo vacío*'} />
                                </div>

                                {(() => {
                                  const hasAnyMeta = !!(
                                    ex.author ||
                                    ex.title ||
                                    ex.source ||
                                    ex.date ||
                                    ex.page
                                  );
                                  if (!hasAnyMeta) return null;

                                  return (
                                    <div className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm text-gray-600 md:grid-cols-2">
                                      {ex.author && (
                                        <div>
                                          <span className="font-medium">Autor:</span> {ex.author}
                                        </div>
                                      )}
                                      {ex.title && (
                                        <div>
                                          <span className="font-medium">Título:</span> {ex.title}
                                        </div>
                                      )}
                                      {ex.source && (
                                        <div>
                                          <span className="font-medium">Fuente:</span> {ex.source}
                                        </div>
                                      )}
                                      {ex.date && (
                                        <div>
                                          <span className="font-medium">Fecha:</span> {ex.date}
                                        </div>
                                      )}
                                      {ex.page && (
                                        <div>
                                          <span className="font-medium">Página:</span> {ex.page}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                <div className="absolute right-3 bottom-3 flex gap-2">
                                  <Button
                                    onClick={() => openExampleEditor(defIndex, exIndex)}
                                    className="text-duech-blue inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-blue-100"
                                    aria-label="Editar ejemplo"
                                    title="Editar ejemplo"
                                  >
                                    <PencilIcon className="h-6 w-6" />
                                  </Button>
                                  <Button
                                    onClick={() => handleDeleteExample(defIndex, exIndex)}
                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-100"
                                    aria-label="Eliminar ejemplo"
                                    title="Eliminar ejemplo"
                                  >
                                    <TrashIcon className="h-6 w-6" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* variante */}
                  <div className="mt-4">
                    <span className="text-sm font-medium text-gray-900">Variante: </span>
                    {isEditing(`def:${defIndex}:variant`) ? (
                      <div className="flex items-center gap-2">
                        <input
                          value={def.variant ?? ''}
                          onChange={(event) =>
                            patchDefLocal(defIndex, { variant: event.target.value || null })
                          }
                          className="w-64 rounded-lg border border-blue-200 px-3 py-2 text-sm text-gray-800 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                          placeholder="Añade una variante..."
                        />
                        <Button
                          type="button"
                          onClick={() => toggle(`def:${defIndex}:variant`)}
                          className="rounded-lg border border-gray-300 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100"
                        >
                          Listo
                        </Button>
                      </div>
                    ) : def.variant ? (
                      <Button
                        type="button"
                        onClick={() => toggle(`def:${defIndex}:variant`)}
                        className="rounded px-2 py-1 text-sm text-blue-700 hover:bg-blue-50"
                      >
                        {def.variant}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => {
                          patchDefLocal(defIndex, { variant: '' });
                          toggle(`def:${defIndex}:variant`);
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Añadir variante
                      </Button>
                    )}
                  </div>

                  {/* botones agregar/eliminar definición */}
                  <div className="pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-4">
                    <Button
                      onClick={() => handleAddDefinition(defIndex)}
                      aria-label="Agregar definición"
                      title="Agregar definición"
                      className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                    >
                      <PlusIcon className="h-7 w-7" />
                    </Button>

                    <Button
                      onClick={() => handleDeleteDefinition(defIndex)}
                      aria-label="Eliminar definición"
                      title="Eliminar definición"
                      className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
                    >
                      <TrashIcon className="h-7 w-7" />
                    </Button>
                  </div>
                </section>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/40 px-6 py-10 text-center text-gray-600">
              <p>Esta palabra aún no tiene definiciones.</p>
              <Button
                type="button"
                onClick={() => handleAddDefinition()}
                className="bg-duech-blue rounded-full px-6 py-2 text-sm text-white hover:bg-blue-800"
              >
                Añadir definición
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* modales multi-select */}
      {editingCategories !== null && (
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

      {editingStyles !== null && (
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
    </div>
  );
}
