import { useState, type KeyboardEvent } from 'react';

interface ChipInputProps {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  maxItems?: number;
}

function normalizeValue(value: string) {
  return value.trim().replace(/\s+/g, ' ');
}

export default function ChipInput({
  label,
  values,
  onChange,
  placeholder = 'Type and press Enter',
  disabled = false,
  maxItems,
}: ChipInputProps) {
  const [draft, setDraft] = useState('');

  function addChip(rawValue: string) {
    const nextValue = normalizeValue(rawValue);

    if (!nextValue) return;
    if (maxItems && values.length >= maxItems) return;
    if (values.some((value) => value.toLowerCase() === nextValue.toLowerCase())) {
      return;
    }

    onChange([...values, nextValue]);
    setDraft('');
  }

  function removeChip(valueToRemove: string) {
    onChange(values.filter((value) => value !== valueToRemove));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
      if (draft.trim()) {
        event.preventDefault();
        addChip(draft);
      }
      return;
    }

    if (event.key === 'Backspace' && !draft && values.length > 0) {
      event.preventDefault();
      onChange(values.slice(0, -1));
    }
  }

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </span>

      <div className="rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-slate-900 focus-within:ring-4 focus-within:ring-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm text-slate-900"
            >
              <span>{value}</span>
              <button
                type="button"
                onClick={() => removeChip(value)}
                disabled={disabled}
                className="text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                aria-label={`Remove ${value}`}
              >
                ×
              </button>
            </span>
          ))}

          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => addChip(draft)}
            placeholder={placeholder}
            disabled={
              disabled || (maxItems !== undefined && values.length >= maxItems)
            }
            className="min-w-[180px] flex-1 border-0 bg-transparent p-0 text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>
    </label>
  );
}
