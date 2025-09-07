'use client';

interface FilterPillProps {
  label: string;
  value: string;
  onRemove: (value: string) => void;
  variant?: 'default' | 'category' | 'style' | 'origin' | 'letter';
}

const variantStyles = {
  default: 'bg-gray-100 text-gray-800 border-gray-300',
  category: 'bg-blue-100 text-blue-800 border-blue-300',
  style: 'bg-green-100 text-green-800 border-green-300',
  origin: 'bg-purple-100 text-purple-800 border-purple-300',
  letter: 'bg-orange-100 text-orange-800 border-orange-300',
};

export default function FilterPill({
  label,
  value,
  onRemove,
  variant = 'default',
}: FilterPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm font-medium transition-colors ${variantStyles[variant]}`}
    >
      {label}
      <button
        type="button"
        onClick={() => onRemove(value)}
        className="hover:bg-opacity-20 ml-1 rounded-full p-0.5 transition-colors hover:bg-black"
        aria-label={`Remover filtro ${label}`}
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </span>
  );
}
