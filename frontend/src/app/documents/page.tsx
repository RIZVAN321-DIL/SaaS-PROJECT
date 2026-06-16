'use client';

import { useEffect, useState } from 'react';

import { AppShell } from '@/components/layout/app-shell';
import { documentsApi } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { DocumentUploadForm } from '@/components/forms/document-upload-form';

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
  const [documents, setDocuments] =
    useState<DocumentItem[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [showForm, setShowForm] =
    useState(false);

  async function loadDocuments() {
    const token =
      getAccessToken();

    if (!token) {
      return;
    }

    try {
      const data =
        await documentsApi.getAll(
          token,
        );

      setDocuments(
        data as DocumentItem[],
      );
    } catch (err) {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div
          className="
            flex
            items-center
            justify-between
          "
        >
          <div>
            <h1 className="text-3xl font-bold">
              Документы
            </h1>

            <p className="text-muted-foreground">
              Безопасное хранение документов
            </p>
          </div>

          <button
            onClick={() =>
              setShowForm(true)
            }
            className="
              rounded-xl
              bg-primary
              px-5
              py-3
              text-sm
              font-medium
              text-primary-foreground
            "
          >
            Загрузить документ
          </button>
        </div>

        {showForm && (
          <div
            className="
              fixed
              inset-0
              z-50
              flex
              items-center
              justify-center
              bg-black/50
            "
            onClick={() =>
              setShowForm(false)
            }
          >
            <div
              className="
                w-full
                max-w-lg
                rounded-2xl
                bg-background
                p-6
                shadow-xl
              "
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <h2 className="mb-4 text-lg font-semibold">
                Загрузить документ
              </h2>

              <DocumentUploadForm
                onSuccess={() => {
                  setShowForm(false);
                  loadDocuments();
                }}
              />
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {loading ? (
            <div
              className="
                rounded-2xl
                border
                border-border
                bg-card
                p-8
                text-center
              "
            >
              Загрузка...
            </div>
          ) : documents.length ===
            0 ? (
            <div
              className="
                rounded-2xl
                border
                border-border
                bg-card
                p-8
                text-center
              "
            >
              Документов пока нет
            </div>
          ) : (
            documents.map(
              (document) => (
                <div
                  key={
                    document.id
                  }
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-border
                    bg-card
                    p-5
                  "
                >
                  <div>
                    <h3 className="font-semibold">
                      {
                        document.name
                      }
                    </h3>

                    <div
                      className="
                        mt-1
                        text-sm
                        text-muted-foreground
                      "
                    >
                      Дело:{' '}
                      {document.case
                        ?.title ??
                        '-'}
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-muted-foreground
                      "
                    >
                      {new Date(
                        document.createdAt,
                      ).toLocaleString('ru-RU')}
                    </div>
                  </div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                    "
                  >
                    <span
                      className="
                        rounded-lg
                        border
                        border-border
                        px-3
                        py-1
                        text-xs
                      "
                    >
                      {document.type ??
                        'ФАЙЛ'}
                    </span>

                    {document.fileUrl && (
                      <a
                        href={
                          document.fileUrl
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="
                          rounded-lg
                          border
                          border-border
                          px-3
                          py-2
                          text-sm
                        "
                      >
                        Открыть
                      </a>
                    )}
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </AppShell>
  );
}
