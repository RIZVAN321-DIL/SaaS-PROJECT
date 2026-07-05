'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Info } from 'lucide-react';

import { customFieldDefinitionsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

interface CustomFieldDefinition {
  id: string;
  key: string;
  label: string;
  entityType: 'CLIENT' | 'CASE';
  fieldType: 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'DATE' | 'SELECT' | 'BOOLEAN';
  options?: string[] | null;
  required: boolean;
  order: number;
  caseTypeId?: string | null;
}

interface CaseType {
  id: string;
  name: string;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  TEXT: 'Текст',
  TEXTAREA: 'Большой текст',
  NUMBER: 'Число',
  DATE: 'Дата',
  SELECT: 'Список',
  BOOLEAN: 'Да / Нет',
};

interface Props {
  entityType: 'CLIENT' | 'CASE';
  caseTypes: CaseType[];
}

export function CustomFieldsManager({ entityType, caseTypes }: Props) {
  const [definitions, setDefinitions] = useState<CustomFieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CustomFieldDefinition | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // поля формы
  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [fieldType, setFieldType] = useState<string>('TEXT');
  const [optionsStr, setOptionsStr] = useState('');
  const [required, setRequired] = useState(false);
  const [caseTypeId, setCaseTypeId] = useState('');

  const [deleteTarget, setDeleteTarget] = useState<CustomFieldDefinition | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadDefinitions() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = (await customFieldDefinitionsApi.getAll(entityType, token)) as CustomFieldDefinition[];
      setDefinitions(data);
    } catch {
      toast.error('Не удалось загрузить настраиваемые поля');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDefinitions();
  }, [entityType]);

  function openCreate() {
    setEditing(null);
    setKey('');
    setLabel('');
    setFieldType('TEXT');
    setOptionsStr('');
    setRequired(false);
    setCaseTypeId('');
    setFormError('');
    setShowForm(true);
  }

  function openEdit(def: CustomFieldDefinition) {
    setEditing(def);
    setKey(def.key);
    setLabel(def.label);
    setFieldType(def.fieldType);
    setOptionsStr((def.options ?? []).join('\n'));
    setRequired(def.required);
    setCaseTypeId(def.caseTypeId ?? '');
    setFormError('');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    setFormError('');

    try {
      const options = fieldType === 'SELECT'
        ? optionsStr.split('\n').map((s) => s.trim()).filter(Boolean)
        : undefined;

      if (editing) {
        // При редактировании НЕ отправляем entityType и key — они не меняются
        await customFieldDefinitionsApi.update(editing.id, {
          label: label.trim(),
          fieldType,
          options,
          required,
          caseTypeId: entityType === 'CASE' ? (caseTypeId || undefined) : undefined,
        }, token);
        toast.success('Поле обновлено');
      } else {
        // При создании отправляем всё
        await customFieldDefinitionsApi.create({
          entityType,
          key: key.trim(),
          label: label.trim(),
          fieldType,
          options,
          required,
          caseTypeId: entityType === 'CASE' ? (caseTypeId || undefined) : undefined,
        }, token);
        toast.success('Поле создано');
      }

      setShowForm(false);
      loadDefinitions();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка сохранения поля');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    const token = getAccessToken();
    if (!token) return;
    setDeleting(true);
    try {
      await customFieldDefinitionsApi.remove(deleteTarget.id, token);
      toast.success(`Поле «${deleteTarget.label}» удалено`);
      setDeleteTarget(null);
      loadDefinitions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления поля');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {entityType === 'CLIENT'
            ? 'Эти поля появятся в карточке каждого клиента'
            : 'Эти поля появятся в карточке дела'}
        </p>
        <Button onClick={openCreate} className="h-9 px-3 text-sm">
          <Plus size={14} /> Добавить поле
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : definitions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
          Нет настраиваемых полей. Создайте первое поле — например, «Паспортные данные» или «ИНН».
        </div>
      ) : (
        <div className="space-y-1">
          {definitions.map((def) => (
            <div
              key={def.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
            >
              <div>
                <span className="text-sm font-medium">{def.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({FIELD_TYPE_LABELS[def.fieldType] ?? def.fieldType})
                </span>
                {def.required && (
                  <span className="ml-1.5 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-600">
                    обязательное
                  </span>
                )}
                {def.caseTypeId && (
                  <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                    {caseTypes.find((t) => t.id === def.caseTypeId)?.name ?? def.caseTypeId}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(def)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground"
                >
                  <Pencil size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(def)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:text-red-500"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка создания / редактирования */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Редактировать поле' : 'Новое поле'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Название поля"
            required
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (!editing) {
                setKey(
                  e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, '_')
                    .replace(/[^a-zа-яё0-9_]/g, ''),
                );
              }
            }}
            placeholder="Например: Паспортные данные"
          />

          <Input
            label="Ключ переменной"
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="паспорт"
            disabled={!!editing}
          />
          {!editing && (
            <p className="text-xs text-muted-foreground">
              Используется в шаблонах как {`{{custom.${key || 'ключ'}}}`}
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium">Тип поля</label>
            <select
              value={fieldType}
              onChange={(e) => setFieldType(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
            >
              {Object.entries(FIELD_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {fieldType === 'SELECT' && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Варианты выбора (по одному на строку)
              </label>
              <textarea
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-background px-4 py-3 outline-none focus:border-primary"
                placeholder={'Вариант 1\nВариант 2\nВариант 3'}
              />
            </div>
          )}

          {entityType === 'CASE' && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Привязать к типу дела (необязательно)
              </label>
              <select
                value={caseTypeId}
                onChange={(e) => setCaseTypeId(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
              >
                <option value="">Все типы дел</option>
                {caseTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>{ct.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="cf-required"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="accent-primary"
            />
            <label htmlFor="cf-required" className="text-sm">Обязательное поле</label>
          </div>

          {formError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" />
              {formError}
            </div>
          )}

          <Button type="submit" loading={saving} className="w-full">
            {editing ? 'Сохранить' : 'Создать поле'}
          </Button>
        </form>
      </Modal>

      {/* Модалка удаления */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Удалить поле?"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Поле «{deleteTarget?.label}» будет удалено. Уже заполненные значения в карточках
            сохранятся, но перестанут отображаться и редактироваться.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1">
              Отмена
            </Button>
            <Button
              onClick={confirmDelete}
              loading={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              Удалить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
                  }
