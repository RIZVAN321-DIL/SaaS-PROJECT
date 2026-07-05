'use client';

import { Input } from '@/components/ui/input';

interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  fieldType: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';
  options?: string[] | null;
  required: boolean;
  order: number;
}

interface DynamicCustomFieldsProps {
  definitions: CustomFieldDefinition[];
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}

export function DynamicCustomFields({
  definitions,
  values,
  onChange,
}: DynamicCustomFieldsProps) {
  if (!definitions.length) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Дополнительные данные
      </p>

      {definitions.map((def) => {
        const value = values[def.key] ?? '';

        switch (def.fieldType) {
          case 'TEXT':
            return (
              <Input
                key={def.id}
                label={def.label}
                value={String(value)}
                onChange={(e) => onChange(def.key, e.target.value)}
                required={def.required}
                placeholder={def.label}
              />
            );

          case 'TEXTAREA':
            return (
              <div key={def.id}>
                <label className="mb-2 block text-sm font-medium">
                  {def.label}
                  {def.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <textarea
                  value={String(value)}
                  onChange={(e) => onChange(def.key, e.target.value)}
                  required={def.required}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                  placeholder={def.label}
                />
              </div>
            );

          case 'NUMBER':
            return (
              <Input
                key={def.id}
                label={def.label}
                type="number"
                value={String(value)}
                onChange={(e) => onChange(def.key, e.target.value)}
                required={def.required}
                placeholder={def.label}
              />
            );

          case 'DATE':
            return (
              <Input
                key={def.id}
                label={def.label}
                type="date"
                value={String(value)}
                onChange={(e) => onChange(def.key, e.target.value)}
                required={def.required}
              />
            );

          case 'BOOLEAN':
            return (
              <div key={def.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3">
                <span className="text-sm font-medium">
                  {def.label}
                  {def.required && <span className="text-red-500 ml-0.5">*</span>}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={value === true || value === 'true'}
                  onClick={() => onChange(def.key, value === true || value === 'true' ? 'false' : 'true')}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    value === true || value === 'true' ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      value === true || value === 'true' ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            );

          case 'SELECT':
            return (
              <div key={def.id}>
                <label className="mb-2 block text-sm font-medium">
                  {def.label}
                  {def.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                <select
                  value={String(value)}
                  onChange={(e) => onChange(def.key, e.target.value)}
                  required={def.required}
                  className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                >
                  <option value="">—</option>
                  {(def.options ?? []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
                  }
