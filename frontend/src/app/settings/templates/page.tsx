'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Plus, ChevronLeft, Trash2, Pencil, Lightbulb, FileStack } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { documentTemplatesApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { toast } from '@/lib/toast';

interface DocumentTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  createdAt: string;
}

interface TemplateVariable {
  key: string;
  label: string;
}

const BASE_VARIABLE_EMOJI: Record<string, string> = {
  'client.fullName': '🧑',
  'client.phone': '📞',
  'client.email': '📧',
  'case.title': '📋',
  'case.description': '📄',
  'organization.name': '🏢',
  'lawyer.email': '⚖️',
  today: '📅',
};

const CUSTOM_EMOJI_HINTS: [string, string][] = [
  ['паспорт', '📝'],
  ['кадастр', '🏠'],
  ['адрес', '📍'],
  ['полис', '🛡️'],
  ['инн', '🧾'],
  ['номер', '🔢'],
  ['сумма', '💰'],
  ['дата', '📅'],
  ['телефон', '📞'],
  ['email', '📧'],
];

function emojiFor(variable: TemplateVariable): string {
  if (BASE_VARIABLE_EMOJI[variable.key]) return BASE_VARIABLE_EMOJI[variable.key];
  const lowerLabel = variable.label.toLowerCase();
  const hit = CUSTOM_EMOJI_HINTS.find(([hint]) => lowerLabel.includes(hint));
  return hit ? hit[1] : '🔖';
}

function shortLabel(variable: TemplateVariable): string {
  return variable.label.replace(/\s*\((клиент|дело)\)\s*$/i, '');
}

function buildSamples(variables: TemplateVariable[]) {
  const passport = variables.find(
    (v) => v.key.startsWith('custom.') && v.label.toLowerCase().includes('паспорт'),
  );
  const cadastre = variables.find(
    (v) => v.key.startsWith('custom.') && v.label.toLowerCase().includes('кадастр'),
  );

  const passportLine = passport ? `, паспорт: {{${passport.key}}}` : '';
  const cadastreLine = cadastre
    ? `с кадастровым номером {{${cadastre.key}}}, `
    : '';

  return {
    contract: `ДОГОВОР КУПЛИ-ПРОДАЖИ\n\nЯ, {{client.fullName}}${passportLine}, проживающий по адресу: _________________,\n\nпродаю объект недвижимости ${cadastreLine}расположенный по адресу: _________________.\n\nДата: {{today}}\n\nПодпись продавца: _______________\nПодпись покупателя: _______________`,
    power: `ДОВЕРЕННОСТЬ\n\nЯ, {{client.fullName}}${passportLine},\n\nнастоящей доверенностью уполномочиваю представлять мои интересы по делу «{{case.title}}».\n\nДата: {{today}}\n\nПодпись: _______________`,
    claim: `ПРЕТЕНЗИЯ\n\nОт: {{client.fullName}}\nТелефон: {{client.phone}}\n\nПо делу: {{case.title}}\n\nНастоящим заявляю требование о _________________________________.\n\nДата: {{today}}\n\nПодпись: _______________`,
  };
}

function renderPreview(content: string, variables: TemplateVariable[]) {
  if (!content.trim()) {
    return <span className="text-muted-foreground">Текст документа появится здесь...</span>;
  }

  const byKey = new Map(variables.map((v) => [v.key, v]));
  const parts = content.split(/(\{\{[^}]+\}\})/g);

  return parts.map((part, i) => {
    const match = part.match(/^\{\{([^}]+)\}\}$/);
    if (!match) {
      return <span key={i}>{part}</span>;
    }
    const key = match[1].trim();
    const variable = byKey.get(key);
    return (
      <span
        key={i}
        className="mx-0.5 inline-block rounded-md border px-2 py-0.5 text-xs font-medium"
        style={{
          backgroundColor: '#f0fdfa',
          borderColor: variable ? '#0d9488' : '#f59e0b',
          color: variable ? '#0d9488' : '#b45309',
        }}
        title={variable ? undefined : 'Такой переменной нет в списке — проверьте ключ'}
      >
        {variable ? `${emojiFor(variable)} ${shortLabel(variable)}` : `⚠️ ${key}`}
      </span>
    );
  });
}

export default function DocumentTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentTemplate | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [templateToDelete, setTemplateToDelete] = useState<DocumentTemplate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const samples = useMemo(() => buildSamples(variables), [variables]);

  async function loadTemplates() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = (await documentTemplatesApi.getAll(token)) as DocumentTemplate[];
      setTemplates(data);
    } catch {
      // тост уже показан в api.ts
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTemplates();
    async function loadVariables() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = (await documentTemplatesApi.getVariables(token)) as TemplateVariable[];
        setVariables(data);
      } catch {
        // не критично — просто не покажем подсказку
      }
    }
    loadVariables();
  }, []);

  function openCreateForm() {
    setEditing(null);
    setName('');
    setDescription('');
    setContent('');
    setFormError('');
    setShowForm(true);
  }

  function openEditForm(template: DocumentTemplate) {
    setEditing(template);
    setName(template.name);
    setDescription(template.description ?? '');
    setContent(template.content);
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
      if (editing) {
        await documentTemplatesApi.update(
          editing.id,
          { name, description, content },
          token,
        );
        toast.success('Шаблон обновлён');
      } else {
        await documentTemplatesApi.create({ name, description, content }, token);
        toast.success('Шаблон создан');
      }
      setShowForm(false);
      loadTemplates();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Не удалось сохранить шаблон',
      );
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!templateToDelete) return;
    const token = getAccessToken();
    if (!token) return;
    setDeleting(true);
    try {
      await documentTemplatesApi.remove(templateToDelete.id, token);
      toast.success(`Шаблон «${templateToDelete.name}» удалён`);
      setTemplateToDelete(null);
      loadTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось удалить шаблон');
    } finally {
      setDeleting(false);
    }
  }

  function insertVariable(key: string) {
    setContent((prev) => `${prev}{{${key}}}`);
  }

  function loadSample(type: keyof ReturnType<typeof buildSamples>) {
    setContent(samples[type]);
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => router.push('/settings')}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft size={14} /> Настройки
        </button>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Шаблоны документов</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Договоры, доверенности и другие документы с автозаполнением из карточки дела
            </p>
          </div>
          <Button onClick={openCreateForm} className="h-9 px-3 text-sm">
            <Plus size={14} /> Новый шаблон
          </Button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted/60" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-16 text-center">
            <FileText size={28} className="text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Пока нет ни одного шаблона. Создайте первый — например, доверенность или договор.
            </p>
            <Button onClick={openCreateForm} className="h-9 px-3 text-sm">
              <Plus size={14} /> Новый шаблон
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{template.name}</h3>
                  {template.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {template.description}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditForm(template)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
                    title="Редактировать"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setTemplateToDelete(template)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:border-red-400 hover:text-red-500"
                    title="Удалить"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== МОДАЛКА СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ===== */}
        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title={editing ? 'Редактировать шаблон' : 'Новый шаблон документа'}
        >
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[80vh] p-1">
            <Input
              label="Название"
              placeholder="Например: Доверенность на представительство"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label="Описание (необязательно)"
              placeholder="Короткая подсказка для коллег"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            {/* ===== Готовые образцы ===== */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <FileStack size={13} /> Готовые образцы (нажмите, чтобы заполнить)
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => loadSample('contract')}
                  className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs transition hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[#f0fdfa]"
                >
                  Договор купли-продажи
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('power')}
                  className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs transition hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[#f0fdfa]"
                >
                  Доверенность
                </button>
                <button
                  type="button"
                  onClick={() => loadSample('claim')}
                  className="rounded-lg border border-dashed border-border px-3 py-1.5 text-xs transition hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[#f0fdfa]"
                >
                  Претензия
                </button>
              </div>
            </div>

            {/* ===== Кнопки переменных с эмодзи ===== */}
            {variables.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/40 p-3">
                <div className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Lightbulb size={13} className="mt-0.5 shrink-0" />
                  Нажимайте на кнопки, чтобы вставить данные клиента или дела. При создании
                  документа они заменятся на реальные значения.
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs transition hover:border-[#0d9488] hover:text-[#0d9488] hover:bg-[#f0fdfa]"
                      title={`{{${v.key}}}`}
                    >
                      <span>{emojiFor(v)}</span>
                      {shortLabel(v)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ===== Текст документа ===== */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Текст документа</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
                rows={10}
                placeholder={
                  'Например:\n\nДОВЕРЕННОСТЬ\n\nВыдана {{client.fullName}} на представление интересов по делу «{{case.title}}».\n\nДата: {{today}}'
                }
                className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none transition focus:border-[#0d9488]"
              />
            </div>

            {/* ===== Предпросмотр ===== */}
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">👁 Предпросмотр</label>
              <div className="min-h-[64px] whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-3 text-sm leading-relaxed">
                {renderPreview(content, variables)}
              </div>
            </div>

            {formError && <p className="text-xs text-red-500">{formError}</p>}

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button type="submit" loading={saving} className="flex-1">
                {editing ? 'Сохранить' : 'Создать'}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ===== МОДАЛКА УДАЛЕНИЯ ===== */}
        <Modal
          open={!!templateToDelete}
          onClose={() => setTemplateToDelete(null)}
          title="Удалить шаблон?"
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Шаблон «{templateToDelete?.name}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setTemplateToDelete(null)}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button
                type="button"
                variant="danger"
                loading={deleting}
                onClick={confirmDelete}
                className="flex-1"
              >
                Удалить
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
