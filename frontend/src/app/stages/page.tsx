'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Layers, Plus, Pencil, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { getAccessToken } from '@/lib/auth';
import { toast } from '@/lib/toast';
import { caseStagesApi, caseTypesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';

interface Stage {
  id: string;
  name: string;
  order: number;
  color: string;
  createdAt: string;
  caseTypeId?: string | null;
}

interface CaseType {
  id: string;
  name: string;
}

interface StageFormProps {
  initial?: { name: string; color: string; order?: number };
  mode: 'create' | 'edit';
  onSubmit: (data: { name: string; color: string; order?: number }) => Promise<void>;
  loading: boolean;
  error: string;
}

function StageForm({ initial, mode, onSubmit, loading, error }: StageFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [color, setColor] = useState(initial?.color ?? '#3B82F6');
  const [order, setOrder] = useState(String(initial?.order ?? ''));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSubmit({
      name,
      color,
      ...(mode === 'create' ? { order: Number(order) } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Название стадии"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Например: В работе"
        autoFocus
      />

      {mode === 'create' && (
        <div>
          <Input
            label="Порядковый номер"
            required
            type="number"
            min={1}
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="1"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Если номер занят — остальные стадии сдвинутся автоматически
          </p>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-medium">Цвет метки</label>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-11 w-16 cursor-pointer rounded-xl border border-border bg-background px-1.5"
          />
          <span className="font-mono text-sm text-muted-foreground">{color.toUpperCase()}</span>
          <div className="flex gap-1.5">
            {['#3B82F6', '#22C55E', '#F59E0B', '#A855F7', '#EF4444', '#14B8A6'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition ${color === c ? 'border-foreground scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-500">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full">
        {mode === 'create' ? 'Создать стадию' : 'Сохранить изменения'}
      </Button>
    </form>
  );
}

function StagesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCaseTypeId = searchParams.get('caseTypeId') ?? '';

  const [caseTypes, setCaseTypes] = useState<CaseType[]>([]);
  // '' = дефолтная (общая) воронка организации
  const [selectedCaseTypeId, setSelectedCaseTypeId] = useState(initialCaseTypeId);
  const [usesOwnPipeline, setUsesOwnPipeline] = useState(false);

  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Stage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadCaseTypes() {
      const token = getAccessToken();
      if (!token) return;
      try {
        const data = (await caseTypesApi.getAll(token)) as CaseType[];
        setCaseTypes(data);
      } catch {
        setCaseTypes([]);
      }
    }
    loadCaseTypes();
  }, []);

  // Показываем ли мы собственную воронку типа дела или дефолтную (общую):
  // "own" стадии — те, у которых caseTypeId ровно совпадает с выбранным типом.
  // Если для типа собственных стадий нет — сервер вернёт дефолтные, и мы
  // предупредим, что редактирование здесь создаст именно СВОЮ воронку.
  async function loadStages() {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = (await caseStagesApi.getAll(
        token,
        selectedCaseTypeId || undefined,
      )) as Stage[];
      const sorted = data.sort((a, b) => a.order - b.order);
      setStages(sorted);
      setUsesOwnPipeline(
        selectedCaseTypeId
          ? sorted.length > 0 && sorted[0].caseTypeId === selectedCaseTypeId
          : true,
      );
    } catch {
      setStages([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCaseTypeId]);

  function changeCaseType(id: string) {
    setSelectedCaseTypeId(id);
    router.replace(id ? `/stages?caseTypeId=${id}` : '/stages');
  }

  async function handleCreate(data: { name: string; color: string; order?: number }) {
    const token = getAccessToken();
    if (!token) return;
    setSubmitting(true);
    setFormError('');
    try {
      await caseStagesApi.create(
        { ...data, order: data.order ?? 1, caseTypeId: selectedCaseTypeId || undefined },
        token,
      );
      toast.success('Стадия создана');
      setCreateOpen(false);
      loadStages();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка создания стадии');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleEdit(data: { name: string; color: string }) {
    const token = getAccessToken();
    if (!token || !editTarget) return;
    setSubmitting(true);
    setFormError('');
    try {
      await caseStagesApi.update(editTarget.id, data, token);
      toast.success('Стадия обновлена');
      setEditTarget(null);
      loadStages();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка обновления стадии');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    const token = getAccessToken();
    if (!token || !deleteTarget) return;
    setDeleting(true);
    try {
      await caseStagesApi.remove(deleteTarget.id, token);
      toast.success(`Стадия «${deleteTarget.name}» удалена`);
      setDeleteTarget(null);
      loadStages();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления стадии');
    } finally {
      setDeleting(false);
    }
  }

  function openCreate() {
    setFormError('');
    setCreateOpen(true);
  }

  function openEdit(stage: Stage) {
    setFormError('');
    setEditTarget(stage);
  }

  const selectedTypeName = caseTypes.find((t) => t.id === selectedCaseTypeId)?.name;

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold">
              <Layers size={22} /> Воронка стадий
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Этапы дел — порядок, названия, цвета. Своя воронка для каждого типа дела
            </p>
          </div>
          <Button onClick={openCreate} className="flex items-center gap-1.5">
            <Plus size={15} /> Добавить стадию
          </Button>
        </div>

        {/* Выбор воронки: общая (дефолтная) или конкретного типа дела */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => changeCaseType('')}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
              !selectedCaseTypeId
                ? 'border-primary text-primary'
                : 'border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            Общая воронка
          </button>
          {caseTypes.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => changeCaseType(type.id)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                selectedCaseTypeId === type.id
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>

        {selectedCaseTypeId && !usesOwnPipeline && !loading && (
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
            <p className="text-amber-600">
              У типа «{selectedTypeName}» пока нет собственной воронки — показана общая.
              Добавив стадию здесь, вы создадите отдельную воронку именно для этого типа дела.
            </p>
          </div>
        )}

        <Modal
          open={createOpen}
          onClose={() => { setCreateOpen(false); setFormError(''); }}
          title="Новая стадия"
        >
          <StageForm
            mode="create"
            onSubmit={handleCreate}
            loading={submitting}
            error={formError}
          />
        </Modal>

        <Modal
          open={Boolean(editTarget)}
          onClose={() => { setEditTarget(null); setFormError(''); }}
          title={`Редактировать — ${editTarget?.name ?? ''}`}
        >
          {editTarget && (
            <StageForm
              mode="edit"
              initial={{ name: editTarget.name, color: editTarget.color }}
              onSubmit={handleEdit}
              loading={submitting}
              error={formError}
            />
          )}
        </Modal>

        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title="Удалить стадию?"
        >
          {deleteTarget && (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm">
                <p className="font-medium text-amber-600">Важно:</p>
                <p className="mt-1 text-muted-foreground">
                  Все дела в стадии <strong>«{deleteTarget.name}»</strong> потеряют привязку к стадии, но не будут удалены. Остальные стадии сдвинутся автоматически.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium transition hover:bg-muted"
                >
                  Отмена
                </button>
                <Button
                  onClick={handleDelete}
                  loading={deleting}
                  className="flex-1 bg-red-500 hover:bg-red-600"
                >
                  Удалить
                </Button>
              </div>
            </div>
          )}
        </Modal>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {loading ? (
            <div className="space-y-0 divide-y divide-border">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 p-4">
                  <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-6 animate-pulse rounded bg-muted" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : stages.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <Layers size={28} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Стадий пока нет</p>
              <Button onClick={openCreate} variant="secondary" className="mt-1 text-sm">
                <Plus size={13} className="mr-1" /> Создать первую стадию
              </Button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="w-10 p-4" />
                  <th className="w-10 p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    №
                  </th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Название
                  </th>
                  <th className="w-24 p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Цвет
                  </th>
                  <th className="w-28 p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stages.map((stage) => (
                  <tr key={stage.id} className="group transition hover:bg-muted/30">
                    <td className="w-10 p-4">
                      <GripVertical
                        size={15}
                        className="text-muted-foreground/30 group-hover:text-muted-foreground/60"
                      />
                    </td>
                    <td className="w-10 p-4">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
                        {stage.order}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium">{stage.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-7 w-7 rounded-lg border border-border"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-mono text-xs text-muted-foreground">
                          {stage.color.toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(stage)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                          title="Редактировать"
                        >
                          <Pencil size={12} /> Изменить
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(stage)}
                          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-500 transition hover:bg-red-500/10"
                          title="Удалить"
                        >
                          <Trash2 size={12} /> Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {stages.length > 0 && (
          <p className="text-xs text-muted-foreground">
            При добавлении стадии с существующим номером — остальные стадии этой воронки сдвинутся автоматически. При удалении дела не теряются, только снимается привязка к стадии.
          </p>
        )}
      </div>
    </AppShell>
  );
}

export default function StagesPage() {
  return (
    <Suspense fallback={null}>
      <StagesPageContent />
    </Suspense>
  );
}
