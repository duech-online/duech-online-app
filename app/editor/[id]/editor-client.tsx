'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import MarkdownRenderer from '@/app/ui/markdown-renderer';
import InlineEditable from '@/app/ui/editor/inline-editable';
import {
  CategorySelector,
  StyleSelector,
  CategoryChip,
  StyleChip,
} from '@/app/ui/editor/edit-controls';
import {
  GRAMMATICAL_CATEGORIES,
  USAGE_STYLES,
  LEXICOGRAPHERS,
  STATES,
  type Example,
  type Word,
  type WordDefinition,
} from '@/app/lib/definitions';

type Props = { initialWord: Word; initialLetter: string };

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export default function EditorClient({ initialWord, initialLetter }: Props) {
  const [word, setWord] = useState<Word>(initialWord);
  const [letter] = useState(initialLetter);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSavedLemma, setLastSavedLemma] = useState(initialWord.lemma);

  const [editingKey, setEditingKey] = useState<string | null>(null);
  const isEditing = (k: string) => editingKey === k;
  const toggle = (k: string) => setEditingKey((prev) => (prev === k ? null : k));

  const [editingCategories, setEditingCategories] = useState<number | null>(null);
  const [editingStyles, setEditingStyles] = useState<number | null>(null);

  const [lexicographer, setLexicographer] = useState('');
  const [status, setStatus] = useState('');

  // Debounced auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wordRef = useRef(word);

  // Keep wordRef up to date
  useEffect(() => {
    wordRef.current = word;
  }, [word]);

  // Auto-save function
  const autoSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      const response = await fetch(`/api/editor/words/${encodeURIComponent(lastSavedLemma)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wordRef.current),
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
  }, [word, autoSave]);

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

  const handleAddExample = (defIndex: number) => {
    const arr = getExamples(word.values[defIndex]);
    setExamples(defIndex, [...arr, emptyExample()]);
    setEditingKey(`def:${defIndex}:ex:${arr.length}`);
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
  };

  const updateExampleField = (
    defIndex: number,
    exIndex: number,
    field: keyof Example,
    val: string | null
  ) => {
    const arr = getExamples(word.values[defIndex]);
    arr[exIndex] = { ...arr[exIndex], [field]: val && String(val).length ? val : undefined };
    setExamples(defIndex, arr);
  };

  // ---------- definiciones ----------
  const handleAddDefinition = () => {
    const newDef: WordDefinition = {
      number: word.values.length + 1,
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
    setWord((prev) => ({ ...prev, values: [...prev.values, newDef] }));
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
        icon: (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ),
        label: 'Guardando...',
      },
      saved: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ),
        label: 'Guardado',
      },
      error: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        ),
        label: 'Error al guardar',
      },
    };

    const config = statusConfig[saveStatus];

    return (
      <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg ${config.bg} px-4 py-2 shadow-lg ${config.text}`}>
        {config.icon}
        <span className="text-sm font-medium">{config.label}</span>
      </div>
    );
  };

  // ---------- UI ----------
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

            <button
              onClick={() => toggle('lemma')}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
              aria-label="Editar lema"
              title="Editar lema"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                />
              </svg>
            </button>
          </div>

          {/* selects locales */}
          <div className="flex flex-col gap-2 sm:min-w-[320px]">
            <select
              value={lexicographer}
              onChange={(e) => setLexicographer(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-[13px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="" disabled>
                Selecciona un lexicógrafo
              </option>
              {LEXICOGRAPHERS.map((lx) => (
                <option key={lx} value={lx}>
                  {lx}
                </option>
              ))}
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-8 w-full rounded-md border border-gray-300 px-2 text-[13px] focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            >
              <option value="" disabled>
                Selecciona un estado
              </option>
              {STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
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
          <button
            onClick={() => toggle('root')}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
            aria-label="Editar raíz"
            title="Editar raíz"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
              />
            </svg>
          </button>
        </div>

        {/* definiciones */}
        <div className="space-y-16">
          {word.values.map((def, defIndex) => {
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
                      <button
                        onClick={() => toggle(`def:${defIndex}:origin`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                        aria-label="Editar origen"
                        title="Editar origen"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggle(`def:${defIndex}:origin`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir origen
                    </button>
                  )}
                </div>

                {/* categorías */}
                <div className="mb-3">
                  {!def.categories || def.categories.length === 0 ? (
                    <button
                      onClick={() => setEditingCategories(defIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir categorías
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {def.categories.map((cat, i) => (
                        <CategoryChip
                          key={`${cat}-${i}`}
                          code={cat}
                          label={GRAMMATICAL_CATEGORIES[cat] || cat}
                          onRemove={(code) => {
                            const next = def.categories.filter((c) => c !== code);
                            patchDefLocal(defIndex, { categories: next });
                          }}
                        />
                      ))}

                      <button
                        onClick={() => setEditingCategories(defIndex)}
                        aria-label="Editar categorías"
                        title="Editar categorías"
                        className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 leading-none text-blue-600 hover:bg-blue-50"
                      >
                        +
                      </button>
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
                        href={`/editor/${encodeURIComponent(def.remission)}`}
                        className="text-duech-blue hover:text-duech-gold font-bold transition-colors"
                      >
                        {def.remission}
                      </Link>
                      <button
                        onClick={() => toggle(`def:${defIndex}:remission`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                        aria-label="Editar remisión"
                        title="Editar remisión"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggle(`def:${defIndex}:remission`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir remisión
                    </button>
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
                      <button
                        onClick={() => toggle(`def:${defIndex}:meaning`)}
                        className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                        aria-label="Editar significado"
                        title="Editar significado"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* estilos de uso */}
                <div className="mb-3">
                  {!def.styles || def.styles.length === 0 ? (
                    <button
                      onClick={() => setEditingStyles(defIndex)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir estilos de uso
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {def.styles.map((s) => (
                        <StyleChip
                          className="bg-duech-gold inline-block rounded-full px-4 py-2 text-sm font-semibold text-gray-900"
                          key={s}
                          code={s}
                          label={USAGE_STYLES[s] || s}
                          onRemove={(code) => {
                            const next = (def.styles || []).filter((x) => x !== code);
                            patchDefLocal(defIndex, { styles: next.length ? next : null });
                          }}
                        />
                      ))}

                      <button
                        onClick={() => setEditingStyles(defIndex)}
                        aria-label="Editar estilos de uso"
                        title="Editar estilos de uso"
                        className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 leading-none text-blue-600 hover:bg-blue-50"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* observación */}
                <div className="mb-3">
                  {def.observation ? (
                    <div className="rounded-md bg-blue-50 px-4 py-3 text-blue-900">
                      <span className="font-semibold">Observación: </span>
                      {isEditing(`def:${defIndex}:observation`) ? (
                        <InlineEditable
                          as="textarea"
                          value={def.observation}
                          editing
                          saveStrategy="manual"
                          onChange={(v) => {
                            patchDefLocal(defIndex, { observation: v.trim() ? v : null });
                            setEditingKey(null);
                          }}
                          onCancel={() => setEditingKey(null)}
                        />
                      ) : (
                        <span>{def.observation}</span>
                      )}
                      <button
                        onClick={() => toggle(`def:${defIndex}:observation`)}
                        className="ml-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                        aria-label="Editar observación"
                        title="Editar observación"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => toggle(`def:${defIndex}:observation`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir observación
                    </button>
                  )}
                </div>

                {/* ejemplos */}
                <div className="mt-4">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      Ejemplo{exs.length > 1 ? 's' : ''}
                    </h3>
                    <button
                      onClick={() => handleAddExample(defIndex)}
                      aria-label="Agregar ejemplo"
                      title="Agregar ejemplo"
                      className="inline-flex size-9 items-center justify-center rounded-full border-2 border-dashed border-blue-400 text-blue-600 hover:bg-blue-50"
                    >
                      +
                    </button>
                  </div>

                  <div className="space-y-2">
                    {exs.map((ex, exIndex) => {
                      const key = `def:${defIndex}:ex:${exIndex}`;
                      const editing = isEditing(key);
                      return (
                        <div
                          key={exIndex}
                          className="relative rounded-xl border border-blue-100 bg-blue-50/70 p-4 pb-16 ring-1 ring-blue-100 ring-inset"
                        >
                          {/* texto del ejemplo */}
                          <div className="mb-3 text-gray-700">
                            {editing ? (
                              <InlineEditable
                                as="textarea"
                                value={ex.value || ''}
                                editing
                                saveStrategy="manual"
                                onChange={(v) => {
                                  updateExampleField(defIndex, exIndex, 'value', v);
                                  setEditingKey(null);
                                }}
                                onCancel={() => setEditingKey(null)}
                                placeholder="*Ejemplo*"
                              />
                            ) : (
                              <MarkdownRenderer content={ex.value || '*Ejemplo vacío*'} />
                            )}
                          </div>

                          {/* metadatos: se muestran solo si existen; en edición se muestran todos */}
                          {(() => {
                            const hasAnyMeta = !!(
                              ex.author ||
                              ex.title ||
                              ex.source ||
                              ex.date ||
                              ex.page
                            );
                            if (!hasAnyMeta && !editing) return null;

                            return (
                              <div className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm text-gray-600 md:grid-cols-2">
                                {(editing || ex.author) && (
                                  <div>
                                    <span className="font-medium">Autor:</span>{' '}
                                    {editing ? (
                                      <InlineEditable
                                        value={ex.author ?? ''}
                                        editing
                                        saveStrategy="manual"
                                        onChange={(v) => {
                                          updateExampleField(defIndex, exIndex, 'author', v);
                                          setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                        placeholder=""
                                      />
                                    ) : (
                                      <span>{ex.author}</span>
                                    )}
                                  </div>
                                )}

                                {(editing || ex.title) && (
                                  <div>
                                    <span className="font-medium">Título:</span>{' '}
                                    {editing ? (
                                      <InlineEditable
                                        value={ex.title ?? ''}
                                        editing
                                        saveStrategy="manual"
                                        onChange={(v) => {
                                          updateExampleField(defIndex, exIndex, 'title', v);
                                          setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                        placeholder=""
                                      />
                                    ) : (
                                      <span>{ex.title}</span>
                                    )}
                                  </div>
                                )}

                                {(editing || ex.source) && (
                                  <div>
                                    <span className="font-medium">Fuente:</span>{' '}
                                    {editing ? (
                                      <InlineEditable
                                        value={ex.source ?? ''}
                                        editing
                                        saveStrategy="manual"
                                        onChange={(v) => {
                                          updateExampleField(defIndex, exIndex, 'source', v);
                                          setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                        placeholder=""
                                      />
                                    ) : (
                                      <span>{ex.source}</span>
                                    )}
                                  </div>
                                )}

                                {(editing || ex.date) && (
                                  <div>
                                    <span className="font-medium">Fecha:</span>{' '}
                                    {editing ? (
                                      <InlineEditable
                                        value={ex.date ?? ''}
                                        editing
                                        saveStrategy="manual"
                                        onChange={(v) => {
                                          updateExampleField(defIndex, exIndex, 'date', v);
                                          setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                        placeholder=""
                                      />
                                    ) : (
                                      <span>{ex.date}</span>
                                    )}
                                  </div>
                                )}

                                {(editing || ex.page) && (
                                  <div>
                                    <span className="font-medium">Página:</span>{' '}
                                    {editing ? (
                                      <InlineEditable
                                        value={ex.page ? String(ex.page) : ''}
                                        editing
                                        saveStrategy="manual"
                                        onChange={(v) => {
                                          updateExampleField(defIndex, exIndex, 'page', v);
                                          setEditingKey(null);
                                        }}
                                        onCancel={() => setEditingKey(null)}
                                        placeholder=""
                                      />
                                    ) : (
                                      <span>{ex.page}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* acciones abajo a la derecha */}
                          <div className="absolute right-3 bottom-3 flex gap-2">
                            <button
                              onClick={() => toggle(key)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                              aria-label="Editar ejemplo"
                              title="Editar ejemplo"
                            >
                              <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteExample(defIndex, exIndex)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-600 hover:bg-red-100"
                              aria-label="Eliminar ejemplo"
                              title="Eliminar ejemplo"
                            >
                              <svg
                                className="h-6 w-6"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V4a1 1 0 011-1h6a1 1 0 011 1v3M4 7h16M10 11v6m4-6v6"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* variante */}
                <div className="mt-4">
                  <span className="text-sm font-medium text-gray-900">Variante: </span>
                  {def.variant ? (
                    <>
                      <InlineEditable
                        value={def.variant}
                        editing={isEditing(`def:${defIndex}:variant`)}
                        saveStrategy="manual"
                        onChange={(v) => {
                          patchDefLocal(defIndex, { variant: v.trim() ? v : null });
                          setEditingKey(null);
                        }}
                        onCancel={() => setEditingKey(null)}
                      />
                      <button
                        onClick={() => toggle(`def:${defIndex}:variant`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-blue-700 hover:bg-blue-100"
                        aria-label="Editar variante"
                        title="Editar variante"
                      >
                        <svg
                          className="h-6 w-6"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L7.5 21H4v-3.5L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggle(`def:${defIndex}:variant`)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Añadir variante
                    </button>
                  )}
                </div>

                {/* botones agregar/eliminar definición */}
                <div className="pointer-events-none absolute bottom-0 left-1/2 flex -translate-x-1/2 translate-y-1/2 items-center gap-4">
                  <button
                    onClick={handleAddDefinition}
                    aria-label="Agregar definición"
                    title="Agregar definición"
                    className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-blue-400 bg-white text-blue-600 shadow hover:bg-blue-50 focus:ring-2 focus:ring-blue-300 focus:outline-none"
                  >
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M12 5v14M5 12h14"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={() => handleDeleteDefinition(defIndex)}
                    aria-label="Eliminar definición"
                    title="Eliminar definición"
                    className="pointer-events-auto inline-flex size-14 items-center justify-center rounded-full border-2 border-dashed border-red-300 bg-white text-red-600 shadow hover:bg-red-50 focus:ring-2 focus:ring-red-300 focus:outline-none"
                  >
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m3 0V4a1 1 0 011-1h6a1 1 0 011 1v3M4 7h16M10 11v6m4-6v6"
                        strokeWidth={2.2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* modales multi-select */}
      {editingCategories !== null && (
        <CategorySelector
          isOpen
          onClose={() => setEditingCategories(null)}
          onSave={(cats) => {
            patchDefLocal(editingCategories, { categories: cats });
          }}
          selectedCategories={word.values[editingCategories].categories}
        />
      )}

      {editingStyles !== null && (
        <StyleSelector
          isOpen
          onClose={() => setEditingStyles(null)}
          onSave={(styles) => {
            patchDefLocal(editingStyles, { styles: styles.length ? styles : null });
          }}
          selectedStyles={word.values[editingStyles].styles || []}
        />
      )}
    </div>
  );
}
