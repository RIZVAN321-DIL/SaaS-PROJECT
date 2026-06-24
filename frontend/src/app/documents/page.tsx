'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Search, Trash2, ExternalLink, Upload } from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { documentsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { openBlobInNewTab } from '@/lib/download';
import { toast } from '@/lib/toast';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface DocumentItem {
  id: string;
  name: string;
  type?: string;
  fileUrl?: string;
  createdAt: string;
  case?: { id: string; title: string };
}

function fileIcon(type?: string) {
  const t = (type ?? '').toLowerCase();
  if (t.includes('pdf')) return '📄';
  if (t.includes('image') || t.includes('jpg') || t.includes('png')) return '🖼';
  if (t.includes('doc') || t.includes('word')) return '📝';
  if (t.includes('xls') || t.includes('sheet')) return '📊';
  return '📎';
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function loadDocuments() {
    const token = getAccessToken();
    if (!token) return;
    try {
      const data = await documentsApi.getAll(token);
      setDocuments(data as DocumentItem[]);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadDocuments(); }, []);

  async function handleOpen(doc: DocumentItem) {
    const token = getAccessToken();
    if (!token) return;
    setOpeningId(doc.id);
    try {
      const blob = await documentsApi.download(doc.id, token);
      openBlobInNewTab(blob);
    } catch {
      toast.error('Не удалось открыть документ');
    } finally {
      setOpeningId(null);
    }
  }

  async function handleDelete(doc: DocumentItem) {
    const token = getAccessToken();
    if (!token) return;
    if (!confirm(`Удалить документ «${doc.name}»?`)) return;
    setDeletingId(doc.id);
    try {
      await documentsApi.remove(doc.id, token);
      toast.success('Документ удалён');
      loadDocuments();
    } catch {
      toast.error('Не удалось удалить документ');
    } finally {
      setDeletingId(null);
    }
  }

  const filtered = documents.filter(
    (d) =>
      !search ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.case?.title.toLowerCase().includes(search.toLowerCase()),
  );

  const grouped = filtered.reduce<Record<string, { caseTitle: string; caseId: string; docs: DocumentItem[] }>>(
    (acc, doc) => {
      const key = doc.case?.id ?? '__none__';
      if (!acc[key]) {
        acc[key] = { caseTitle: doc.case?.title ?? 'Без дела', caseId: doc.case?.id ?? '', docs: [] };
      }
      acc[key].docs.push(doc);
      return acc;
    },
    {},
  );

  return (
    <AppShell>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Документы</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">Безопасное хранение файлов</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="h-9 px-3 text-sm">
            <Upload size={14} /> Загрузить
          </Button>
        </div>

        <Modal open={showForm} onClose={() => setShowForm(false)} title="Загрузить документ">
          <DocumentUploadForm onSuccess={() => { setShowForm(false); loadDocuments(); }} />
        </Modal>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или делу..."
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary"
          />
        </div>

        {!loading && documents.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><FileText size={12} /> {documents.length} документов</span>
            <span>·</span>
            <span>{Object.keys(grouped).length} дел</span>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl border border-border bg-card" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card py-16 text-center">
            <FileText size={28} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="mb-3 text-sm text-muted-foreground">
              {search ? 'Ничего не найдено' : 'Документов пока нет'}
            </p>
            {!search && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Загрузить первый документ
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([key, group]) => (
              <div key={key} className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.caseTitle}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      {group.docs.length}
                    </span>
                  </div>
                  {group.caseId && (
                    <button
                      type="button"
                      onClick={() => router.push(`/cases/${group.caseId}`)}
                      className="text-[11px] text-primary hover:underline"
                    >
                      Открыть дело →
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border/60">
                  {group.docs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-lg">{fileIcon(doc.type)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{doc.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {doc.type && <span className="mr-2 uppercase">{doc.type}</span>}
                          {new Date(doc.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {doc.fileUrl && (
                          <button
                            type="button"
                            onClick={() => handleOpen(doc)}
                            disabled={openingId === doc.id}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/10 disabled:opacity-50"
                          >
                            <ExternalLink size={12} />
                            {openingId === doc.id ? 'Открываем...' : 'Открыть'}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(doc)}
                          disabled={deletingId === doc.id}
                          className="rounded-lg p-1.5 text-muted-foreground transition hover:text-red-500 disabled:opacity-50"
                          aria-label="Удалить"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
                        }
