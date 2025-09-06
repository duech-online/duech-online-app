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
  variant = 'default' 
}: FilterPillProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border transition-colors ${variantStyles[variant]}`}>
      {label}
      <button
        type="button"
        onClick={() => onRemove(value)}
        className="ml-1 hover:bg-black hover:bg-opacity-20 rounded-full p-0.5 transition-colors"
        aria-label={`Remover filtro ${label}`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </span>
  );
}