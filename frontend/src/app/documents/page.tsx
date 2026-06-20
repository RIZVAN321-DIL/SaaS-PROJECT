'use client';

import { useEffect, useState } from 'react';

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

  case?: {
    id: string;
    title: string;
  };
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);

  async function loadDocuments() {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    try {
      const data = await documentsApi.getAll(token);
      setDocuments(data as DocumentItem[]);
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleOpen(document: DocumentItem) {
    const token = getAccessToken();
    if (!token) return;

    setOpeningId(document.id);
    try {
      const blob = await documentsApi.download(document.id, token);
      openBlobInNewTab(blob);
    } catch {
      toast.error('Не удалось открыть документ');
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Документы
            </h1>

            <p className="text-muted-foreground">
              Безопасное хранение документов
            </p>
          </div>

          <Button onClick={() => setShowForm(true)}>
            Загрузить документ
          </Button>
        </div>

        <Modal
          open={showForm}
          onClose={() => setShowForm(false)}
          title="Загрузить документ"
        >
          <DocumentUploadForm
            onSuccess={() => {
              setShowForm(false);
              loadDocuments();
            }}
          />
        </Modal>

        <div className="grid gap-4">
          {loading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              Загрузка...
            </div>
          ) : documents.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              Документов пока нет
            </div>
          ) : (
            documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <h3 className="font-semibold">{document.name}</h3>

                  <div className="mt-1 text-sm text-muted-foreground">
                    Дело: {document.case?.title ?? '-'}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    {new Date(document.createdAt).toLocaleString('ru-RU')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-lg border border-border px-3 py-1 text-xs">
                    {document.type ?? 'ФАЙЛ'}
                  </span>

                  {document.fileUrl && (
                    <button
                      type="button"
                      onClick={() => handleOpen(document)}
                      disabled={openingId === document.id}
                      className="rounded-lg border border-border px-3 py-2 text-sm transition hover:bg-accent disabled:opacity-50"
                    >
                      {openingId === document.id ? 'Открываем...' : 'Открыть'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}
